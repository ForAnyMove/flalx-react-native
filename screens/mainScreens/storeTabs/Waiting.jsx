import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Platform,
  useWindowDimensions,
} from 'react-native';
import JobTypeSelector from '../../../components/JobTypeSelector';
import SearchPanel from '../../../components/SearchPanel';
import ShowJobModal from '../../../components/ShowJobModal';
import { useComponentContext } from '../../../context/globalAppContext';
import { useWindowInfo } from '../../../context/windowContext';
import { useTranslation } from 'react-i18next';
import { scaleByHeight, scaleByHeightMobile } from '../../../utils/resizeFuncs';
import { Divider } from 'react-native-paper';
import { useLocalization } from '../../../src/services/useLocalization';

export default function WaitingScreen({
  setShowJobModalVisible,
  setCurrentJobId,
  setJobModalStatus,
}) {
  const { themeController, jobsController, languageController } =
    useComponentContext();
  const { tField } = useLocalization(languageController.current);
  const { height } = useWindowDimensions();
  const { isLandscape } = useWindowInfo();
  const { t } = useTranslation();
  const isRTL = languageController.isRTL;

  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  // const [showJobModalVisible, setShowJobModalVisible] = useState(false);
  // const [currentJobId, setCurrentJobId] = useState(null);

  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);

    return {
      cardRadius: isWebLandscape ? web(8) : mobile(8),
      cardShadow: isWebLandscape ? web(1) : mobile(3),
      imageHeight: isWebLandscape ? web(120) : mobile(90),
      imageWidth: isWebLandscape ? web(153) : '25%',
      fontTitle: isWebLandscape ? web(18) : mobile(18),
      fontLoading: isWebLandscape ? web(20) : mobile(20),
      fontDescription: isWebLandscape ? web(16) : mobile(16),
      badgeSize: isWebLandscape ? web(20) : mobile(20),
      badgeFont: isWebLandscape ? web(12) : mobile(12),
      scrollContainerWidth: isWebLandscape ? '60%' : '100%',
      badgePosition: isWebLandscape ? web(5) : mobile(5),
      imageMargin: isWebLandscape ? web(10) : mobile(10),
      containerPaddingH: isWebLandscape ? web(10) : mobile(10),
      containerPaddingV: isWebLandscape ? web(14) : mobile(14),
      cardMarginBottom: isWebLandscape ? web(8) : mobile(8),
      descriptionMarginTop: isWebLandscape ? web(2) : mobile(2),
      badgePadding: isWebLandscape ? web(2) : mobile(2),
    };
  }, [height, isWebLandscape]);

  const pendingJobsList = jobsController.creator.pending
    .filter((job) =>
      filteredJobs.length > 0 ? filteredJobs.includes(job.type.key) || filteredJobs.includes(job.subType.key) : true
    )
    .filter((job) =>
      [tField(job.type, 'name'), job.description].some((field) =>
        field.toLowerCase().includes(searchValue.toLowerCase())
      )
    );

  const filteredJobsList = jobsController.creator.waiting
    .filter((job) =>
      filteredJobs.length > 0 ? filteredJobs.includes(job.type.key) || filteredJobs.includes(job.subType.key) : true
    )
    .filter((job) =>
      [tField(job.type, 'name'), job.description].some((field) =>
        field.toLowerCase().includes(searchValue.toLowerCase())
      )
    );



  const drawJobCard = (job, index) => {
    const hasImage = job.images && job.images.length > 0;
    return <TouchableOpacity
      key={index}
      style={[styles.cardContainer, { marginBottom: sizes.cardMarginBottom }]}
      onPress={() => {
        setCurrentJobId(job.id);
        setShowJobModalVisible(true);
        setJobModalStatus('store-waiting');
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
            {tField(job.type, 'name')}
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
        {job.providers?.length > 0 && (
          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  themeController.current?.secondaryBadgeBackground,
                minWidth: sizes.badgeSize,
                height: sizes.badgeSize,
                borderRadius: sizes.badgeSize / 2,
                top: sizes.badgePosition,
                paddingHorizontal: sizes.badgePadding,
                paddingVertical: sizes.badgePadding,
                ...(isRTL
                  ? { left: sizes.badgePosition }
                  : { right: sizes.badgePosition }),
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color: themeController.current?.badgeTextColor,
                  fontSize: sizes.badgeFont,
                },
              ]}
            >
              {job.providers.length}
            </Text>
          </View>
        )}
        {(job.status === 'pending' || job.status === 'pending_moderation') &&
          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  themeController.current?.mainBadgeBackground,
                minWidth: sizes.badgeSize,
                height: sizes.badgeSize,
                borderRadius: sizes.badgeSize / 4,
                top: sizes.badgePosition,
                paddingHorizontal: sizes.badgePadding,
                paddingVertical: sizes.badgePadding,
                ...(isRTL
                  ? { left: sizes.badgePosition }
                  : { right: sizes.badgePosition }),
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color: themeController.current?.badgeTextColor,
                  fontSize: sizes.badgeFont,
                },
              ]}
            >
              {job.status === 'pending_moderation' ? t('common.pending_moderation') : t('common.waiting_payment')}
            </Text>
          </View>}
      </View>
    </TouchableOpacity>
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: themeController.current?.backgroundColor,
          direction: isRTL ? 'rtl' : 'ltr',
          paddingHorizontal: sizes.containerPaddingH,
          paddingVertical: sizes.containerPaddingV,
        },
      ]}
    >
      <View>
        <SearchPanel
          searchValue={searchValue}
          setSearchValue={setSearchValue}
        />
      </View>

      <View style={{ width: isWebLandscape ? '70%' : '100%' }}>
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
          {/* <View style={{
            paddingLeft: 10,
            paddingRight: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <Text
              style={[
                styles.title,
                {
                  color: themeController.current?.primaryColor,
                  fontSize: sizes.fontTitle,
                },
              ]}
            >
              Unpublished
            </Text>
            <Text
              style={[
                styles.title,
                {
                  color: themeController.current?.unactiveTextColor,
                  fontSize: sizes.badgeFont,
                },
              ]}
            >
              waiting for payment
            </Text>
          </View>
          <View style={{ height: 10 }} />
          <TouchableOpacity
            style={[styles.cardContainer, { marginBottom: sizes.cardMarginBottom }]}
          >
            <View
              style={[
                styles.cardContent,
                {
                  backgroundColor:
                    themeController.current?.formInputBackground,
                  borderRadius: sizes.cardRadius,
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
                <View style={styles.placeholderImage}>
                  <FontAwesome6
                    name='image'
                    size={sizes.fontTitle}
                    color={
                      themeController.current?.defaultBlocksMockColor
                    }
                  />
                </View>
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
                  Cleaner
                </Text>
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
                  Default job description text
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          <View style={{ height: 10 }} />
          <Divider />
          <View style={{ height: 20 }} /> */}
          {pendingJobsList.map((job, index) => {
            return drawJobCard(job, index);
          })}
          {pendingJobsList.length > 0 && <Divider style={{ marginBottom: sizes.cardMarginBottom }} />}
          {filteredJobsList.map((job, index) => {
            return drawJobCard(job, index);
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    // fontWeight: 'bold',
  },
};
