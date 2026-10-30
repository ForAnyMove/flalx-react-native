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

import { useComponentContext } from '../../../context/globalAppContext';
import JobTypeSelector from '../../../components/JobTypeSelector';
import { FontAwesome6 } from '@expo/vector-icons';
import JobExpectationsBadge from '../../../components/ui/JobExpectationsBadge';
import SearchPanel from '../../../components/SearchPanel';
import { useWindowInfo } from '../../../context/windowContext';
import { useTranslation } from 'react-i18next';
import { BASE_DESIGN_HEIGHT, scaleByHeight, scaleByHeightMobile } from '../../../utils/resizeFuncs';
import { useLocalization } from '../../../src/services/useLocalization';
import { useJobDetailNavigation } from '../../../src/services/useJobDetailNavigation';

export default function InProgressScreen({
  setShowJobModalVisible,
  setCurrentJobId,
  setJobModalStatus,
  setJobStatusInfo,
}) {
  const { themeController, jobsController, languageController } =
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
      await jobsController.reloadExecutor();
    } finally {
      setRefreshing(false);
    }
  };

  const sizes = useMemo(() => {
    const web = (size, options) => scaleByHeight(size, height, BASE_DESIGN_HEIGHT, options);
    const mobile = (size, options) => scaleByHeightMobile(size, height, options);

    return {
      listPaddingBottom: isWebLandscape ? web(40) : mobile(120),
      cardRadius: isWebLandscape ? web(8) : mobile(8),
      imageHeight: isWebLandscape ? web(120) : mobile(100),
      imageWidth: isWebLandscape ? web(153) : '25%',
      fontTitle: isWebLandscape ? web(18) : mobile(18),
      fontLoading: isWebLandscape ? web(20) : mobile(20),
      fontDescription: isWebLandscape ? web(16) : mobile(16),
      scrollContainerWidth: isWebLandscape ? (width / height < 1.3 ? '85%' : '60%') : '100%',
      containerPaddingHorizontal: isWebLandscape ? web(10) : mobile(10),
      containerPaddingVertical: isWebLandscape ? web(14) : (Platform.OS !== 'web' ? mobile(6) : mobile(14)),
      cardMarginBottom: isWebLandscape ? web(8) : (Platform.OS !== 'web' ? mobile(4) : mobile(8)),
      imageMargin: isWebLandscape ? web(10) : mobile(10),
      descriptionMarginTop: isWebLandscape ? web(2) : mobile(2),
      refreshBtnHeight: isWebLandscape ? web(48) : mobile(48),
      refreshBtnPaddingHorizontal: isWebLandscape ? web(16) : mobile(12, { maxScale: 1.2 }),
      refreshBtnBorderRadius: isWebLandscape ? web(8) : mobile(8),
      refreshBtnFont: isWebLandscape ? web(14) : mobile(13, { maxScale: 1.2 }),
      refreshBtnIcon: isWebLandscape ? web(16) : mobile(15, { maxScale: 1.2 }),
      refreshBtnGap: isWebLandscape ? web(12) : mobile(8, { maxScale: 1.2 }),
      textContentPaddingVertical: isWebLandscape ? web(10) : mobile(10),
    };
  }, [width, height, isWebLandscape]);

  const filteredJobsList = jobsController.executor.inProgress
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
            { width: sizes.scrollContainerWidth, paddingBottom: sizes.listPaddingBottom },
          ]}
        >
          {filteredJobsList.map((job, index) => {
            const hasImage = job.images && job.images.length > 0;
            const currentCardHeight = cardHeights[index] || 0;
            const isTaller = currentCardHeight > sizes.imageHeight + 5;

            const imageRadiusStyle = isRTL && Platform.OS === 'web'
              ? {
                borderTopRightRadius: sizes.cardRadius,
                borderBottomRightRadius: isTaller ? 0 : sizes.cardRadius,
                borderBottomLeftRadius: isTaller ? sizes.cardRadius : 0,
              }
              : {
                borderTopLeftRadius: sizes.cardRadius,
                borderBottomLeftRadius: isTaller ? 0 : sizes.cardRadius,
                borderBottomRightRadius: isTaller ? sizes.cardRadius : 0,
              };

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.cardContainer,
                  { marginBottom: sizes.cardMarginBottom },
                ]}
                onPress={() => openJobDetail(job, 'jobs-in-progress')}
                onLayout={(e) => {
                  const height = e.nativeEvent.layout.height;
                  if (cardHeights[index] !== height) {
                    setCardHeights(prev => ({ ...prev, [index]: height }));
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
                          themeController.current?.defaultBlocksMockBackground,
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
                            textAlign:
                              isRTL ? 'right' : 'left',
                            fontSize: sizes.fontDescription,
                            marginTop: sizes.descriptionMarginTop,
                            width: '100%',
                          },
                        ]}
                      >
                        {job.description}
                      </Text>
                    ) : null}
                    <JobExpectationsBadge
                      expectations={job}
                      isRTL={isRTL}
                    />
                  </View>
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
};


