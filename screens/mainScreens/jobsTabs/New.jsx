import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { jobImages } from '../../../constants/jobImages';
import JobTypeSelector from '../../../components/JobTypeSelector';
import SearchPanel from '../../../components/SearchPanel';
import { useComponentContext } from '../../../context/globalAppContext';
import { useWindowInfo } from '../../../context/windowContext';
import { useTranslation } from 'react-i18next';
import { scaleByHeight, scaleByHeightMobile } from '../../../utils/resizeFuncs';
import { useLocalization } from '../../../src/services/useLocalization';
import { useJobDetailNavigation } from '../../../src/services/useJobDetailNavigation';
import { logInfo } from '../../../utils/log_util';
import { getExperienceMonths, calculateCurrentExperience } from '../../../utils/experience_ulit';

export default function NewScreen({
  setShowJobModalVisible,
  setCurrentJobId,
  setJobModalStatus,
  setJobStatusInfo,
}) {
  const { themeController, jobsController, languageController, geolocationController, user, jobTypesController } =
    useComponentContext();
  const openJobDetail = useJobDetailNavigation({ setCurrentJobId, setShowJobModalVisible, setJobModalStatus, setJobStatusInfo });
  const { tField } = useLocalization(languageController.current);
  const { width, height, isLandscape } = useWindowInfo();
  const { t } = useTranslation();
  const isRTL = languageController.isRTL;
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [cardHeights, setCardHeights] = useState({});

  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await jobsController.reloadExecutorNew();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (jobsController && jobsController.reloadExecutor) {
      logInfo('Reloading executor jobs for New tab');

      jobsController.reloadExecutor();
    }
  }, []);

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);

    return {
      cardRadius: isWebLandscape ? web(8) : mobile(8),
      imageHeight: isWebLandscape ? web(120) : mobile(90),
      imageWidth: isWebLandscape ? web(153) : '25%',
      fontTitle: isWebLandscape ? web(18) : mobile(18),
      fontLoading: isWebLandscape ? web(20) : mobile(20),
      fontDescription: isWebLandscape ? web(16) : mobile(16),
      scrollContainerWidth: isWebLandscape ? (width / height < 1.3 ? '85%' : '60%') : '100%',
      personalMarkerBorderWidth: isWebLandscape ? web(2) : mobile(2),
      personalMarkerVP: isWebLandscape ? web(2) : mobile(2),
      personalMarkerHP: isWebLandscape ? web(6) : mobile(6),
      personalMarkerBottomAngleRadius: isWebLandscape ? web(8) : mobile(8),
      personalMarkerFontSize: isWebLandscape ? web(12) : mobile(12),
      containerMarginTop: isWebLandscape ? web(24) : mobile(14),
      containerPaddingHorizontal: isWebLandscape ? web(10) : mobile(10),
      containerPaddingVertical: isWebLandscape ? web(14) : (Platform.OS !== 'web' ? mobile(6) : mobile(14)),
      cardMarginBottom: isWebLandscape ? web(8) : (Platform.OS !== 'web' ? mobile(4) : mobile(8)),
      imageMargin: isWebLandscape ? web(10) : mobile(10),
      descriptionMarginTop: isWebLandscape ? web(2) : mobile(2),
      refreshBtnHeight: isWebLandscape ? web(48) : mobile(48),
      refreshBtnPaddingHorizontal: isWebLandscape ? web(16) : mobile(16),
      refreshBtnBorderRadius: isWebLandscape ? web(8) : mobile(8),
      refreshBtnFont: isWebLandscape ? web(14) : mobile(14),
      refreshBtnIcon: isWebLandscape ? web(16) : mobile(16),
      refreshBtnGap: isWebLandscape ? web(12) : mobile(12),
      textContentPaddingVertical: isWebLandscape ? web(10) : mobile(10),
    };
  }, [width, height, isWebLandscape]);

  const getContractorExperienceForJob = (job) => {
    const jobTypeId = job.type?.id || job.type_id;
    const jobSubTypeId = job.subType?.id || job.sub_type_id || job.subtype_id;
    const jobTypeKey = job.type?.key;
    const jobSubTypeKey = job.subType?.key;

    // 1. Check user.current.professions (if objects)
    const userProfs = Array.isArray(user?.current?.professions) ? user.current.professions : [];
    const matchInUser = userProfs.find((p) => {
      if (!p || typeof p !== 'object') return false;
      const pTypeId = p.job_type_id || p.job_type?.id;
      const pSubTypeId = p.job_subtype_id || p.job_subtype?.id;
      const pTypeKey = p.job_type?.key;
      const pSubTypeKey = p.job_subtype?.key;

      if (jobSubTypeId || jobSubTypeKey) {
        return (jobSubTypeId && pSubTypeId === jobSubTypeId) || (jobSubTypeKey && pSubTypeKey === jobSubTypeKey);
      }
      if (jobTypeId || jobTypeKey) {
        return (jobTypeId && pTypeId === jobTypeId) || (jobTypeKey && pTypeKey === jobTypeKey);
      }
      return false;
    });
    if (matchInUser) {
      const raw = matchInUser.years_of_experience || matchInUser.experience;
      const date = matchInUser.verified_at || matchInUser.updated_at || matchInUser.created_at;
      const current = calculateCurrentExperience(raw, date);
      return getExperienceMonths(current || raw);
    }

    // 2. Check approved profession requests in userToUserRequest.list
    const reqs = Array.isArray(jobTypesController?.userToUserRequest?.list)
      ? jobTypesController.userToUserRequest.list
      : [];
    const matchInReqs = reqs.find((r) => {
      const isApproved = r.status === 'approved' || r.is_verified === true;
      if (!isApproved) return false;

      const rSubTypeId = r.job_subtype_id || r.job_subtype?.id;
      const rTypeId = r.job_type_id || r.job_type?.id;
      const rSubTypeKey = r.job_subtype?.key;
      const rTypeKey = r.job_type?.key;

      if (jobSubTypeId || jobSubTypeKey) {
        return (jobSubTypeId && rSubTypeId === jobSubTypeId) || (jobSubTypeKey && rSubTypeKey === jobSubTypeKey);
      }
      if (jobTypeId || jobTypeKey) {
        return (jobTypeId && rTypeId === jobTypeId) || (jobTypeKey && rTypeKey === jobTypeKey);
      }
      return false;
    });
    if (matchInReqs) {
      const raw = matchInReqs.years_of_experience || matchInReqs.experience;
      const date = matchInReqs.verified_at || matchInReqs.updated_at || matchInReqs.created_at;
      const current = calculateCurrentExperience(raw, date);
      return getExperienceMonths(current || raw);
    }

    // 3. Fallback to general user experience
    if (user?.current?.years_of_experience || user?.current?.experience) {
      const raw = user.current.years_of_experience || user.current.experience;
      return getExperienceMonths(raw);
    }

    return 0;
  };

  const filteredJobsList =
    jobsController == null ||
      jobsController.executor == null ||
      jobsController.executor.new == null
      ? []
      : jobsController.executor.new
        .filter((job) =>
          filteredJobs.length > 0
            ? filteredJobs.includes(job.type.key) ||
            filteredJobs.includes(job.subType.key)
            : true
        )
        .filter((job) => {
          const reqMonths = getExperienceMonths(job.experience);
          if (reqMonths <= 0) return true;
          const contractorMonths = getContractorExperienceForJob(job);
          return contractorMonths >= reqMonths;
        })
        .filter((job) =>
          [tField(job.type, 'name'), job.description].some((field) =>
            field?.toLowerCase()?.includes(searchValue?.toLowerCase())
          )
        );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: themeController.current?.backgroundColor,
          direction: isRTL ? 'rtl' : 'ltr',
          paddingHorizontal: sizes.containerPaddingHorizontal,
          paddingVertical: sizes.containerPaddingVertical,
        },
      ]}
    >
      <View
        style={{
          flexDirection: isRTL ? 'row-reverse' : 'row',
          alignItems: 'flex-start',
          gap: sizes.refreshBtnGap,
        }}
      >
        <View style={{ flex: isWebLandscape ? undefined : 1 }}>
          <SearchPanel
            searchValue={searchValue}
            setSearchValue={setSearchValue}
          />
        </View>
        <TouchableOpacity
          onPress={handleRefresh}
          disabled={refreshing}
          style={{
            flexDirection: isRTL ? 'row-reverse' : 'row',
            alignItems: 'center',
            justifyContent: 'center',
            height: sizes.refreshBtnHeight,
            paddingHorizontal: sizes.refreshBtnPaddingHorizontal,
            borderRadius: sizes.refreshBtnBorderRadius,
            borderWidth: 1,
            borderColor: themeController.current?.buttonColorSecondaryDefault,
            backgroundColor: themeController.current?.backgroundColor,
            opacity: refreshing ? 0.7 : 1,
          }}
        >
          {refreshing ? (
            <ActivityIndicator
              size='small'
              color={themeController.current?.buttonColorSecondaryDefault}
            />
          ) : (
            <>
              <FontAwesome6
                name='arrows-rotate'
                size={sizes.refreshBtnIcon}
                color={themeController.current?.buttonColorSecondaryDefault}
                style={{
                  marginRight: isRTL ? 0 : sizes.refreshBtnGap / 2,
                  marginLeft: isRTL ? sizes.refreshBtnGap / 2 : 0,
                }}
              />
              <Text
                style={{
                  color: themeController.current?.buttonColorSecondaryDefault,
                  fontSize: sizes.refreshBtnFont,
                }}
              >
                {t('common.refresh')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      <View>
        <JobTypeSelector
          selectedTypes={filteredJobs}
          setSelectedTypes={setFilteredJobs}
        />
      </View>
      {geolocationController.enabled && <Text style={{ color: themeController.current?.textColor, marginBottom: sizes.containerMarginTop / 2 }}>{t('misc.search_request_by_location')}</Text>}
      {jobsController.loading.any ? (
        <Text
          style={{
            color: themeController.current?.unactiveTextColor,
            fontSize: sizes.fontLoading,
          }}
        >
          {t('common.loading')}
        </Text>
      ) : jobsController.error ? (
        <Text>{jobsController.error}</Text>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[themeController.current?.buttonColorSecondaryDefault || '#000']}
              tintColor={themeController.current?.buttonColorSecondaryDefault || '#000'}
            />
          }
          contentContainerStyle={[
            styles.scrollContainer,
            {
              width: sizes.scrollContainerWidth,
              marginTop: sizes.containerMarginTop,
            },
          ]}
        >
          {filteredJobsList
            .slice()
            .sort((a, b) => {
              const priorityOrder = ['top', 'quick', 'pro'];
              const aPriority = priorityOrder.indexOf(a.jobType?.toLowerCase());
              const bPriority = priorityOrder.indexOf(b.jobType?.toLowerCase());
              const aVal = aPriority === -1 ? 999 : aPriority;
              const bVal = bPriority === -1 ? 999 : bPriority;
              return aVal - bVal;
            })
            .map((job, index) => {
              const hasImage = job.images && job.images.length > 0;
              let extraMarkerStyle = {};
              let isMarkerExist = false;
              let extraMarkerColor;
              let extraMarkerText;

              const currentCardHeight = cardHeights[index] || 0;
              const isTaller = currentCardHeight > sizes.imageHeight + 5;
              
              const imageRadius = sizes.cardRadius * 0.6;
              const imageRadiusStyle = isRTL && Platform.OS === 'web'
                ? {
                    borderTopRightRadius: imageRadius,
                    borderBottomRightRadius: isTaller ? 0 : imageRadius,
                    borderBottomLeftRadius: isTaller ? imageRadius : 0,
                  }
                : {
                    borderTopLeftRadius: imageRadius,
                    borderBottomLeftRadius: isTaller ? 0 : imageRadius,
                    borderBottomRightRadius: isTaller ? imageRadius : 0,
                  };

              if (job?.jobType) {
                switch (job.jobType) {
                  case 'top':
                    isMarkerExist = true;
                    extraMarkerColor = themeController.current?.topMarkerColor;
                    extraMarkerText = t('extra_markers.top');
                    extraMarkerStyle = {
                      borderWidth: sizes.personalMarkerBorderWidth,
                      borderColor: themeController.current?.topMarkerColor,
                    };
                    break;
                  case 'verified':
                    isMarkerExist = true;
                    extraMarkerColor =
                      themeController.current?.verifiedMarkerColor;
                    extraMarkerText = t('extra_markers.verified');
                    extraMarkerStyle = {
                      borderWidth: sizes.personalMarkerBorderWidth,
                      borderColor: themeController.current?.verifiedMarkerColor,
                    };
                    break;
                  case 'quick':
                    isMarkerExist = true;
                    extraMarkerColor =
                      themeController.current?.quickMarkerColor;
                    extraMarkerText = t('extra_markers.quickly');
                    extraMarkerStyle = {
                      borderWidth: sizes.personalMarkerBorderWidth,
                      borderColor: themeController.current?.quickMarkerColor,
                    };
                    break;
                  case 'pro':
                    isMarkerExist = true;
                    extraMarkerColor =
                      themeController.current?.forProMarkerColor;
                    extraMarkerText = t('extra_markers.pro');
                    extraMarkerStyle = {
                      borderWidth: sizes.personalMarkerBorderWidth,
                      borderColor: themeController.current?.forProMarkerColor,
                    };
                    break;

                  default:
                    break;
                }
              }
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.cardContainer,
                    { marginBottom: sizes.cardMarginBottom },
                  ]}
                  onPress={() => openJobDetail(job, 'jobs-new')}
                  onLayout={(e) => {
                    const height = e.nativeEvent.layout.height;
                    if (cardHeights[index] !== height) {
                      setCardHeights(prev => ({...prev, [index]: height}));
                    }
                  }}
                >
                  <View
                    style={[
                      styles.cardContent,
                      {
                        backgroundColor: themeController.current?.formInputBackground,
                        borderRadius: sizes.cardRadius,
                        flexDirection: isRTL && Platform.OS !== 'web' ? 'row-reverse' : 'row',
                        paddingLeft: isRTL ? sizes.imageMargin : 0,
                        paddingRight: !isRTL ? sizes.imageMargin : 0,
                      },
                      extraMarkerStyle,
                    ]}
                  >
                    <View
                      style={[
                        styles.imageContainer,
                        {
                          width: sizes.imageWidth,
                          height: sizes.imageHeight,
                          maxWidth: sizes.imageHeight * 1.275,
                          backgroundColor:
                            themeController.current
                              ?.defaultBlocksMockBackground,
                          ...(isRTL
                            ? {
                              marginLeft: sizes.imageMargin,
                              marginRight: 0,
                            }
                            : {
                              marginRight: sizes.imageMargin,
                              marginLeft: 0,
                            }),
                          ...imageRadiusStyle,
                        },
                      ]}
                    >
                      {hasImage ? (
                        <Image
                          source={{ uri: job.images[0] }}
                          style={styles.image}
                          resizeMode='cover'
                        />
                      ) : jobImages[job.subType?.key] || jobImages[job.type?.key] ? (
                        <Image
                          source={jobImages[job.subType?.key] || jobImages[job.type?.key]}
                          style={styles.image}
                          resizeMode='cover'
                        />
                      ) : (
                        <View style={styles.placeholderImage}>
                          <FontAwesome6
                            name='image'
                            size={sizes.fontTitle}
                            color={
                              themeController.current?.defaultBlocksMockColor
                            }
                          />
                        </View>
                      )}
                    </View>
                    <View style={[styles.textContent, { paddingVertical: sizes.textContentPaddingVertical }]}>
                      <Text
                        style={[
                          styles.title,
                          {
                            color: themeController.current?.primaryColor,
                            fontSize: sizes.fontTitle,
                          },
                        ]}
                      >
                        {tField(job.type, 'name')}
                      </Text>
                      {job.description ? (
                        <Text
                          numberOfLines={1}
                          ellipsizeMode='tail'
                          style={[
                            styles.description,
                            {
                              color: themeController.current?.unactiveTextColor,
                              textAlign: isRTL ? 'right' : 'left',
                              fontSize: sizes.fontDescription,
                              marginTop: sizes.descriptionMarginTop,
                              width: '100%',
                            },
                          ]}
                        >
                          {job.description}
                        </Text>
                      ) : null}
                    </View>
                    {job?.status !== 'default' && (
                      <View
                        style={[
                          styles.specialMarkerContainer,
                          {
                            backgroundColor: extraMarkerColor,
                            paddingVertical: sizes.personalMarkerVP,
                            paddingHorizontal: sizes.personalMarkerHP,
                          },
                          isRTL
                            ? {
                              left: 0,
                              borderBottomRightRadius: isWebLandscape
                                ? sizes.personalMarkerBottomAngleRadius
                                : 0,
                              borderBottomLeftRadius: isWebLandscape
                                ? 0
                                : sizes.personalMarkerBottomAngleRadius,
                            }
                            : {
                              right: 0,
                              borderBottomLeftRadius:
                                sizes.personalMarkerBottomAngleRadius,
                            },
                        ]}
                      >
                        <Text
                          style={[
                            {
                              color: '#fff',
                              // fontWeight: 'bold',
                              fontSize: sizes.personalMarkerFontSize,
                            },
                          ]}
                        >
                          {extraMarkerText}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    paddingBottom: 0,
  },
  scrollContainer: {
    paddingBottom: 0,
  },
  cardContainer: {},
  cardContent: {
    flexDirection: 'row',
    position: 'relative',
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContent: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    // fontWeight: '600',
  },
  description: {},
  specialMarkerContainer: {
    position: 'absolute',
    top: 0,
  },
};


