import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import JobTypeSelector from '../../../components/JobTypeSelector';
import { RFValue } from 'react-native-responsive-fontsize';
import SearchPanel from '../../../components/SearchPanel';
import { useComponentContext } from '../../../context/globalAppContext';
import { useWindowInfo } from '../../../context/windowContext';
import { useTranslation } from 'react-i18next';
import { scaleByHeight } from '../../../utils/resizeFuncs';

export default function NewScreen({
  setShowJobModalVisible,
  setCurrentJobId,
  setJobModalStatus,
}) {
  const { themeController, jobsController, languageController } =
    useComponentContext();
  const { height, isLandscape } = useWindowInfo();
  const { t } = useTranslation();
  const isRTL = languageController.isRTL;
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchValue, setSearchValue] = useState('');

  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  // размеры для web-landscape
  const sizes = {
    cardRadius: isWebLandscape ? height * 0.007 : RFValue(5),
    imageHeight: isWebLandscape ? scaleByHeight(120, height) : RFValue(45),
    imageWidth: isWebLandscape ? scaleByHeight(153, height) : RFValue(55),
    fontTitle: isWebLandscape ? scaleByHeight(18, height) : RFValue(12),
    fontDescription: isWebLandscape ? scaleByHeight(16, height) : RFValue(10),
    badgeSize: isWebLandscape ? scaleByHeight(20, height) : RFValue(16),
    badgeFont: isWebLandscape ? scaleByHeight(12, height) : RFValue(10),
    scrollContainerWidth: isWebLandscape ? '60%' : '100%',
    badgePosition: isWebLandscape ? height * 0.005 : RFValue(5),
    personalMarkerBorderWidth: isWebLandscape ? height * 0.003 : RFValue(2),
    personalMarkerVP: isWebLandscape ? height * 0.003 : RFValue(2),
    personalMarkerHP: isWebLandscape ? height * 0.012 : RFValue(6),
    personalMarkerBottomAngleRadius: isWebLandscape
      ? height * 0.01
      : RFValue(8),
    personalMarkerFontSize: isWebLandscape ? height * 0.015 : RFValue(10),
    containerMarginTop: isWebLandscape
      ? scaleByHeight(24, height)
      : RFValue(14),
  };

  const filteredJobsList = jobsController.executor.new.filter((job) =>
    filteredJobs.length > 0 ? filteredJobs.includes(job.type) : true
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: themeController.current?.backgroundColor,
          direction: isRTL ? 'rtl' : 'ltr',
        },
      ]}
    >
      {/* <View>
        <SearchPanel
          searchValue={searchValue}
          setSearchValue={setSearchValue}
        />
      </View> */}
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
            {
              width: sizes.scrollContainerWidth,
              marginTop: sizes.containerMarginTop,
            },
          ]}
        >
          {filteredJobsList.map((job, index) => {
            const hasImage = job.images && job.images.length > 0;
            let extraMarkerStyle = {};
            let isMarkerExist = false;
            let extraMarkerColor;
            let extraMarkerText;
            if (job?.status) {
              switch (job.status) {
                case 'top':
                  isMarkerExist = true;
                  extraMarkerColor = themeController.current?.topMarkerColor;
                  extraMarkerText = 'Top';
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

                default:
                  break;
              }
            }
            return (
              <TouchableOpacity
                key={index}
                style={styles.cardContainer}
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
                          themeController.current?.defaultBlocksMockBackground,
                        ...(isRTL
                          ? {
                              marginLeft: RFValue(10),
                              marginRight: 0,
                            }
                          : {
                              marginRight: RFValue(10),
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
                      {t(`jobTypes.${job.type}`)}
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
    paddingHorizontal: RFValue(10),
    paddingVertical: RFValue(14),
    paddingBottom: 0,
  },
  scrollContainer: {
    paddingBottom: 0,
  },
  cardContainer: {
    marginBottom: RFValue(8),
  },
  cardContent: {
    flexDirection: 'row',
    borderRadius: RFValue(5),
    alignItems: 'center',
    position: 'relative',
  },
  imageContainer: {
    width: RFValue(55),
    height: RFValue(55),
    borderTopLeftRadius: RFValue(5),
    borderBottomLeftRadius: RFValue(5),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: RFValue(10),
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
    fontSize: RFValue(12),
    // fontWeight: '600',
  },
  description: {
    fontSize: RFValue(10),
    marginTop: RFValue(2),
  },
  badge: {
    position: 'absolute',
    top: RFValue(5),
    right: RFValue(5),
    borderRadius: RFValue(999),
    paddingHorizontal: RFValue(2),
    paddingVertical: RFValue(2),
    minWidth: RFValue(16),
    height: RFValue(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    // fontWeight: 'bold',
    fontSize: RFValue(10),
  },
  specialMarkerContainer: {
    position: 'absolute',
    top: 0,
  },
};
