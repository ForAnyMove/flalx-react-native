import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useMemo, useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import JobTypeSelector from '../../../components/JobTypeSelector';
import SearchPanel from '../../../components/SearchPanel';
import { useComponentContext } from '../../../context/globalAppContext';
import { useWindowInfo } from '../../../context/windowContext';
import { useTranslation } from 'react-i18next';
import { scaleByHeight, scaleByHeightMobile } from '../../../utils/resizeFuncs';
import { useLocalization } from '../../../src/services/useLocalization';
import JobExpectationsBadge from '../../../components/ui/JobExpectationsBadge';
// const mock = [
//   {
//     "id": "bb54ba45-f4ba-411c-ab4c-688db3d0a956",
//     "type": {
//       "id": "7d0d9b2d-135d-47a5-89a1-743209e43bac",
//       "key": "cleaner",
//       "name": "Cleaner",
//       "name_i18n": {
//         "en": "Cleaner",
//         "he": "מנקה"
//       }
//     },
//     "subType": {
//       "id": "5ca068e1-3eee-41a4-85bd-3cbcf4ce49d7",
//       "key": "house_cleaning",
//       "name": "House Cleaning",
//       "name_i18n": {
//         "en": "House Cleaning",
//         "he": "ניקיון בית"
//       }
//     },
//     "description": "CH3232",
//     "price": "333",
//     "images": [],
//     "startDateTime": "2026-01-14T10:57:00+00:00",
//     "endDateTime": "2026-01-30T10:57:00+00:00",
//     "createdAt": "2026-01-18T10:57:30.787203+00:00",
//     "status": "expired",
//     "creator": "4f04025a-eeaa-451d-a25c-586f6bdcf8f9",
//     "doneComment": null,
//     "extraMarker": null,
//     "providerStatus": 'obsolete',
//     "myProviderSource": 'personal',
//     "proposed_price": "50",
//     "proposed_time_from": "2026-01-14T10:57:00+00:00",
//     "proposed_time_to": "2026-01-30T10:57:00+00:00",
//     "changes_history": [
//       {
//         "date": "2026-01-18T10:57:33.324Z",
//         "type": "created",
//         "changes": {
//           "type": "7d0d9b2d-135d-47a5-89a1-743209e43bac",
//           "price": "333",
//           "subType": "5ca068e1-3eee-41a4-85bd-3cbcf4ce49d7",
//           "location": {
//             "address": "Лондон",
//             "latitude": 51.5072178,
//             "longitude": -0.12758619999999998,
//             "formatterAddress": "Лондон, Великобритания"
//           },
//           "experience": {
//             "years": 0,
//             "months": 3
//           },
//           "description": "CH",
//           "endDateTime": "2026-01-30T10:57:00.000Z",
//           "startDateTime": "2026-01-14T10:57:00.000Z"
//         }
//       },
//       {
//         "date": "2026-01-18T12:04:45.487Z",
//         "type": "job_updated",
//         "changes": {
//           "description": "CH3232",
//           "endDateTime": "2026-01-30T10:57:00.000Z",
//           "startDateTime": "2026-01-14T10:57:00.000Z"
//         }
//       },
//       {
//         "date": "2026-01-18T12:36:50.264Z",
//         "type": "job_updated",
//         "changes": {
//           "experience": {
//             "years": 0,
//             "months": 1
//           }
//         }
//       },
//       {
//         "date": "2026-01-19T10:59:23.435Z",
//         "type": "executor_assigned_by_creator",
//         "creatorId": "4f04025a-eeaa-451d-a25c-586f6bdcf8f9",
//         "executorId": "7b4bfd6d-5d57-41e2-8b74-430dc5b12d0a"
//       },
//       {
//         "date": "2026-01-24T12:32:58.857Z",
//         "type": "executor_assigned_by_creator",
//         "creatorId": "4f04025a-eeaa-451d-a25c-586f6bdcf8f9",
//         "executorId": "6cbdd225-53fd-4dd6-baf8-70e89efabaf2"
//       }
//     ],
//     "location": {
//       "address": "Лондон",
//       "latitude": 51.5072178,
//       "longitude": -0.12758619999999998,
//       "formatterAddress": "Лондон, Великобритания"
//     },
//     "executor": "6cbdd225-53fd-4dd6-baf8-70e89efabaf2",
//     "isDone": false,
//     "isClosed": false,
//     "jobType": "normal",
//     "isRated": false,
//     "moderated_by": null,
//     "moderated_at": "2026-01-18T12:01:15.159+00:00",
//     "moderation_comment": null,
//     "rejection_reason": "Other",
//     "updated_at": null,
//     "experience": {
//       "years": 0,
//       "months": 1
//     },
//     "isRejectionNoticedByUser": true,
//     "is_paid": null,
//     "created_by_account_type": null,
//     "expires_at": null,
//     "comments": [
//       {
//         "id": "7814c403-e6fb-4f2e-a36b-24a58fb7f33f",
//         "user_id": "6cbdd225-53fd-4dd6-baf8-70e89efabaf2",
//         "author_id": "6cbdd225-53fd-4dd6-baf8-70e89efabaf2",
//         "text": "Test comment",
//         "created_at": "2026-02-25T21:22:25.108314",
//         "rating": 1,
//         "job_id": "bb54ba45-f4ba-411c-ab4c-688db3d0a956",
//         "author": {
//           "id": "6cbdd225-53fd-4dd6-baf8-70e89efabaf2",
//           "name": "ftyh",
//           "email": "fortunamaf7@gmail.com",
//           "avatar": "https://jucihggsazsyuitjdtqi.supabase.co/storage/v1/object/public/avatars/avatars/6cbdd225-53fd-4dd6-baf8-70e89efabaf2.jpeg",
//           "surname": "df"
//         },
//         "user": {
//           "id": "6cbdd225-53fd-4dd6-baf8-70e89efabaf2",
//           "name": "ftyh",
//           "email": "fortunamaf7@gmail.com",
//           "avatar": "https://jucihggsazsyuitjdtqi.supabase.co/storage/v1/object/public/avatars/avatars/6cbdd225-53fd-4dd6-baf8-70e89efabaf2.jpeg",
//           "surname": "df"
//         }
//       }
//     ]
//   }
// ]
export default function WaitingScreen({
  setShowJobModalVisible,
  setCurrentJobId,
  setJobModalStatus,
}) {
  const { themeController, jobsController, languageController, user } =
    useComponentContext();
  const { tField } = useLocalization(languageController.current);
  const { height, isLandscape } = useWindowInfo();
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
      fontLoading: isWebLandscape ? web(20) : mobile(20),
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
  // const filteredJobsList = mock;
  const filteredJobsList = jobsController.executor.waiting
    .filter((job) =>
      filteredJobs.length > 0 ? filteredJobs.includes(job.type.key) || filteredJobs.includes(job.subType.key) : true
    )
    .filter((job) =>
      [tField(job.type, 'name'), job.description].some((field) =>
        field?.toLowerCase()?.includes(searchValue?.toLowerCase())
      )
    );

  // const filteredJobsList2 = useMemo(() => {
  //   let list = jobsController.waiting.list;
  //   if (filteredJobs.length > 0) {
  //     list = list.filter((job) => filteredJobs.includes(job.type.id));
  //   }
  //   if (searchValue.length > 0) {
  //     const lowerSearch = searchValue.toLowerCase();
  //     list = list.filter((job) =>
  //       job.type.name.toLowerCase().includes(lowerSearch)
  //     );
  //   }
  //   return list;
  // }, [jobsController.waiting.list, filteredJobs, searchValue]);

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
            const myEntry = user.current?.id
              ? job?.providers?.find((p) => (p?.id || p) === user.current.id)
              : null;
            const needsAgreement = myEntry && myEntry.job_agreement != null && myEntry.job_agreement !== 'agreed';

            function checkIsBadgeExist() {
              if (job?.providerStatus) {
                switch (job.providerStatus) {
                  case 'obsolete':
                    return true;
                  case 'choosed':
                    return true;
                  default:
                    return false;
                }
              }
              if (job?.status === 'expired') {
                return true;
              }
              if (job?.myProviderSource === 'personal') {
                return true;
              }


              return false;
            }

            function getBadgeText() {
              if (job?.providerStatus) {
                switch (job.providerStatus) {
                  case 'obsolete':
                    return t('extra_markers.obsolete');
                  case 'choosed':
                    return t('extra_markers.choosed');
                  default:
                    return '';
                }
              }
              if (job?.status === 'expired') {
                return t('extra_markers.deleted', { defaultValue: 'Deleted' });
              }
              if (job?.myProviderSource === 'personal') {
                return t('extra_markers.for_you');
              }

              return '';
            }
            function getBadgeBackgroundColor() {
              if (job?.providerStatus) {
                switch (job.providerStatus) {
                  case 'obsolete':
                    return themeController.current?.mainBadgeBackground;
                  case 'choosed':
                    return themeController.current?.verifiedMarkerColor;
                  default:
                    return '';
                }
              }
              if (job?.status === 'expired') {
                return themeController.current?.errorTextColor;
              }
              if (job?.myProviderSource === 'personal') {
                return themeController.current?.personalMarkerColor;
              }

              return '';
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
                    checkIsBadgeExist() && {
                      borderWidth: sizes.personalMarkerBorderWidth,
                      borderColor: getBadgeBackgroundColor(),
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
                    <JobExpectationsBadge
                      expectations={job}
                      isRTL={isRTL}
                    />
                  </View>
                  {checkIsBadgeExist() && (
                    <View
                      style={[
                        styles.specialMarkerContainer,
                        {
                          backgroundColor: getBadgeBackgroundColor(),
                          // borderWidth: job.status === 'expired' ? 1 : 0,
                          borderColor: getBadgeBackgroundColor(),
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
                            color: themeController.current?.tabBarTextColorActive,
                            fontSize: sizes.personalMarkerFontSize,
                          },
                        ]}
                      >
                        {getBadgeText()}
                      </Text>
                    </View>
                  )}
                  {needsAgreement && (
                    <View
                      style={[
                        styles.specialMarkerContainer,
                        {
                          backgroundColor: themeController.current?.primaryColor,
                          paddingVertical: sizes.personalMarkerVP,
                          paddingHorizontal: sizes.personalMarkerHP,
                          bottom: 0,
                          top: undefined,
                        },
                        isRTL
                          ? {
                            left: 0,
                            borderTopRightRadius: sizes.personalMarkerBottomAngleRadius,
                          }
                          : {
                            right: 0,
                            borderTopLeftRadius: sizes.personalMarkerBottomAngleRadius,
                          },
                      ]}
                    >
                      <Text
                        style={{
                          color: '#fff',
                          fontSize: sizes.personalMarkerFontSize,
                        }}
                      >
                        {t('extra_markers.updated', { defaultValue: 'Updated' })}
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
    alignSelf: 'flex-start',
  },
};
