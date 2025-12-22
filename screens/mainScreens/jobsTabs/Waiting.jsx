import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useMemo, useState } from 'react';
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

export default function WaitingScreen({
  setShowJobModalVisible,
  setCurrentJobId,
  setJobModalStatus,
}) {
  const { themeController, jobsController, languageController } =
    useComponentContext();
  const { height } = useWindowDimensions();
  const { isLandscape } = useWindowInfo();
  const { t } = useTranslation();
  const isRTL = languageController.isRTL;
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchValue, setSearchValue] = useState('');

  const isWebLandscape = Platform.OS === 'web' && isLandscape;

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
      containerPaddingHorizontal: isWebLandscape ? web(10) : mobile(10),
      containerPaddingVertical: isWebLandscape ? web(14) : mobile(14),
      cardMarginBottom: isWebLandscape ? web(8) : mobile(8),
      imageMargin: isWebLandscape ? web(10) : mobile(10),
      descriptionMarginTop: isWebLandscape ? web(2) : mobile(2),
    };
  }, [height, isWebLandscape]);

  const filteredJobsList = jobsController.executor.waiting
    .filter((job) =>
      filteredJobs.length > 0 ? filteredJobs.includes(job.type.name_en) : true
    )
    .filter((job) =>
      [job.type.name_en, job.description].some((field) =>
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
        <Text>Loading...</Text>
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
                  setJobModalStatus('jobs-waiting');
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
                    job?.myProviderSource === 'personal' && {
                      borderWidth: sizes.personalMarkerBorderWidth,
                      borderColor: themeController.current?.personalMarkerColor,
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
                        ...(isRTL && Platform.OS === 'web'
                          ? {
                            borderTopRightRadius: sizes.cardRadius,
                            borderBottomRightRadius: sizes.cardRadius,
                          }
                          : {
                            borderTopLeftRadius: sizes.cardRadius,
                            borderBottomLeftRadius: sizes.cardRadius,
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
                      {job.type.name_en}
                    </Text>
                    {job.description ? (
                      <Text
                        style={[
                          styles.description,
                          {
                            color: themeController.current?.unactiveTextColor,
                            textAlign:
                              isRTL && Platform.OS === 'web' ? 'right' : 'left',
                            fontSize: sizes.fontDescription,
                            marginTop: sizes.descriptionMarginTop,
                          },
                        ]}
                      >
                        {job.description}
                      </Text>
                    ) : null}
                  </View>
                  {job?.myProviderSource === 'personal' && (
                    <View
                      style={[
                        styles.specialMarkerContainer,
                        {
                          backgroundColor:
                            themeController.current?.personalMarkerColor,
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
                        {'For you'}
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
