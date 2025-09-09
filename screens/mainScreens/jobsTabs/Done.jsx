import { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useComponentContext } from '../../../context/globalAppContext';
// import JobTypeSelector from '../../../components/JobTypeSelector';
import { FontAwesome6 } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import SearchPanel from '../../../components/SearchPanel';
import { useWindowInfo } from '../../../context/windowContext';
import { useTranslation } from 'react-i18next';

export default function DoneScreen({
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
    cardShadow: isWebLandscape ? height * 0.001 : RFValue(3),
    imageSize: isWebLandscape ? height * 0.09 : RFValue(55),
    fontTitle: isWebLandscape ? height * 0.018 : RFValue(12),
    fontDescription: isWebLandscape ? height * 0.015 : RFValue(10),
    badgeSize: isWebLandscape ? height * 0.025 : RFValue(16),
    badgeFont: isWebLandscape ? height * 0.014 : RFValue(10),
    scrollContainerWidth: isWebLandscape ? '60%' : '100%',
    badgePosition: isWebLandscape ? height * 0.005 : RFValue(5),
  };
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
      <View>
        <SearchPanel
          searchValue={searchValue}
          setSearchValue={setSearchValue}
        />
      </View>
      {/* <View>
        <JobTypeSelector selectedTypes={filteredJobs} setSelectedTypes={setFilteredJobs} />
      </View> */}
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
          {jobsController.executor.done.map((job, index) => {
            const hasImage = job.images && job.images.length > 0;
            return (
              <TouchableOpacity
                key={index}
                style={styles.cardContainer}
                onPress={() => {
                  setCurrentJobId(job.id);
                  setShowJobModalVisible(true);
                  setJobModalStatus('jobs-done');
                }}
              >
                <View
                  style={[
                    styles.cardContent,
                    {
                      backgroundColor:
                        themeController.current?.defaultBlocksBackground,
                      borderRadius: sizes.cardRadius,
                      shadowRadius: sizes.cardShadow,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.imageContainer,
                      {
                        width: sizes.imageSize,
                        height: sizes.imageSize,
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
                          color: themeController.current?.textColor,
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
                            color: themeController.current?.textColor,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: RFValue(3),
    elevation: RFValue(2),
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
  },
  title: {
    fontSize: RFValue(12),
    fontWeight: '600',
  },
  description: {
    fontSize: RFValue(10),
    marginTop: RFValue(2),
  },
};
