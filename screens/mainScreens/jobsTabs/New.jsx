import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import JobTypeSelector from '../../../components/JobTypeSelector';
import SearchPanel from '../../../components/SearchPanel';
import { useComponentContext } from '../../../context/globalAppContext';
import { useWindowInfo } from '../../../context/windowContext';
import { useTranslation } from 'react-i18next';
import { scaleByHeight, scaleByHeightMobile } from '../../../utils/resizeFuncs';
import { useLocalization } from '../../../src/services/useLocalization';

export default function NewScreen({
  setShowJobModalVisible,
  setCurrentJobId,
  setJobModalStatus,
}) {
  const { themeController, jobsController, languageController, geolocationController } =
    useComponentContext();
  const { tField } = useLocalization(languageController.current);
  const { height } = useWindowDimensions();
  const { isLandscape } = useWindowInfo();
  const { t } = useTranslation();
  const isRTL = languageController.isRTL;
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchValue, setSearchValue] = useState('');

  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  useEffect(() => {
    if (jobsController && jobsController.reloadExecutor) {
      console.log('Reloading executor jobs for New tab');

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
      fontDescription: isWebLandscape ? web(16) : mobile(16),
      scrollContainerWidth: isWebLandscape ? '60%' : '100%',
      personalMarkerBorderWidth: isWebLandscape ? web(2) : mobile(2),
      personalMarkerVP: isWebLandscape ? web(2) : mobile(2),
      personalMarkerHP: isWebLandscape ? web(6) : mobile(6),
      personalMarkerBottomAngleRadius: isWebLandscape ? web(8) : mobile(8),
      personalMarkerFontSize: isWebLandscape ? web(12) : mobile(12),
      containerMarginTop: isWebLandscape ? web(24) : mobile(14),
      containerPaddingHorizontal: isWebLandscape ? web(10) : mobile(10),
      containerPaddingVertical: isWebLandscape ? web(14) : mobile(14),
      cardMarginBottom: isWebLandscape ? web(8) : mobile(8),
      imageMargin: isWebLandscape ? web(10) : mobile(10),
      descriptionMarginTop: isWebLandscape ? web(2) : mobile(2),
    };
  }, [height, isWebLandscape]);


  const filteredJobsList = jobsController == null || jobsController.executor == null || jobsController.executor.new == null ? [] : jobsController.executor.new
    .filter((job) =>
      filteredJobs.length > 0 ? filteredJobs.includes(job.type.key) || filteredJobs.includes(job.subType.key) : true
    )
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
      <View>
        <SearchPanel
          searchValue={searchValue}
          setSearchValue={setSearchValue}
        />
      </View>
      <View>
        <JobTypeSelector
          selectedTypes={filteredJobs}
          setSelectedTypes={setFilteredJobs}
        />
      </View>
      {geolocationController.enabled && <Text style={{ color: themeController.current?.textColor, marginBottom: sizes.containerMarginTop / 2 }}>{t('misc.search_request_by_location')}</Text>}
      {jobsController.loading.any ? (
        <Text>Loading...</Text>
      ) : jobsController.error ? (
        <Text>{jobsController.error}</Text>
      ) : (
        <ScrollView
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
              const priority = {
                top: 1,
                quick: 2,
                pro: 3,
              };

              const aPriority = priority[a.jobType?.toLowerCase()] ?? 999;
              const bPriority = priority[b.jobType?.toLowerCase()] ?? 999;

              return aPriority - bPriority;
            })
            .map((job, index) => {
              const hasImage = job.images && job.images.length > 0;
              let extraMarkerStyle = {};
              let isMarkerExist = false;
              let extraMarkerColor;
              let extraMarkerText;

              if (job?.jobType) {
                switch (job.jobType) {
                  case 'top':
                    isMarkerExist = true;
                    extraMarkerColor = themeController.current?.topMarkerColor;
                    extraMarkerText = 'TOP';
                    extraMarkerStyle = {
                      borderWidth: sizes.personalMarkerBorderWidth,
                      borderColor: themeController.current?.topMarkerColor,
                    };
                    break;
                  case 'verified':
                    isMarkerExist = true;
                    extraMarkerColor =
                      themeController.current?.verifiedMarkerColor;
                    extraMarkerText = 'Verified';
                    extraMarkerStyle = {
                      borderWidth: sizes.personalMarkerBorderWidth,
                      borderColor: themeController.current?.verifiedMarkerColor,
                    };
                    break;
                  case 'quick':
                    isMarkerExist = true;
                    extraMarkerColor =
                      themeController.current?.quickMarkerColor;
                    extraMarkerText = 'Quickly';
                    extraMarkerStyle = {
                      borderWidth: sizes.personalMarkerBorderWidth,
                      borderColor: themeController.current?.quickMarkerColor,
                    };
                    break;
                  case 'pro':
                    isMarkerExist = true;
                    extraMarkerColor =
                      themeController.current?.forProMarkerColor;
                    extraMarkerText = 'For PRO';
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
                  onPress={() => {
                    setCurrentJobId(job.id);
                    setShowJobModalVisible(true);
                    setJobModalStatus('jobs-new');
                  }}
                >
                  <View
                    style={[
                      styles.cardContent,
                      {
                        backgroundColor:
                          themeController.current?.formInputBackground,
                        borderRadius: sizes.cardRadius,
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
                          ...(isRTL && Platform.OS === 'web'
                            ? {
                              borderTopRightRadius: sizes.cardRadius * 0.6,
                              borderBottomRightRadius: sizes.cardRadius * 0.6,
                            }
                            : {
                              borderTopLeftRadius: sizes.cardRadius * 0.6,
                              borderBottomLeftRadius: sizes.cardRadius * 0.6,
                            }),
                        },
                      ]}
                    >
                      {hasImage ? (
                        <Image
                          source={{ uri: job.images[0] }}
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
                    <View style={styles.textContent}>
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
                          style={[
                            styles.description,
                            {
                              color: themeController.current?.unactiveTextColor,
                              textAlign:
                                isRTL && Platform.OS === 'web'
                                  ? 'right'
                                  : 'left',
                              fontSize: sizes.fontDescription,
                              marginTop: sizes.descriptionMarginTop,
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
    alignItems: 'center',
    position: 'relative',
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
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
    height: '80%',
    justifyContent: 'center',
  },
  title: {
    // fontWeight: '600',
  },
  description: {},
  badge: {
    position: 'absolute',
    borderRadius: 999,
    paddingHorizontal: 2,
    paddingVertical: 2,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    // fontWeight: 'bold',
  },
  specialMarkerContainer: {
    position: 'absolute',
    top: 0,
  },
};
