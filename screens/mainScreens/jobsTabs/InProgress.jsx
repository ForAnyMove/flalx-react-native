import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useComponentContext } from '../../../context/globalAppContext';
import JobTypeSelector from '../../../components/JobTypeSelector';
import { FontAwesome6 } from '@expo/vector-icons';
import JobExpectationsBadge from '../../../components/ui/JobExpectationsBadge';
import SearchPanel from '../../../components/SearchPanel';
import { useWindowInfo } from '../../../context/windowContext';
import { useTranslation } from 'react-i18next';
import { scaleByHeight, scaleByHeightMobile } from '../../../utils/resizeFuncs';
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

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);

    return {
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
          contentContainerStyle={[
            styles.scrollContainer,
            { width: sizes.scrollContainerWidth },
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
    paddingVertical: 10,
  },
  title: {
    // fontWeight: '600',
  },
  description: {},
};


