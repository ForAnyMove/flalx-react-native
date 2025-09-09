import {
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { RFValue, RFPercentage } from 'react-native-responsive-fontsize';
import { JOB_SUB_TYPES } from '../constants/jobSubTypes';
import { JOB_TYPES } from '../constants/jobTypes';
import { LICENSES } from '../constants/licenses';
import { useComponentContext } from '../context/globalAppContext';
import JobHistoryModal from './JobHistoryModal';
import NewJobModal from './NewJobModal';
import ProvidersSection from './ProvidersSection';
import CustomFlatList from './ui/CustomFlatList';
import DateTimeInput from './ui/DateTimeInput';
import DateTimeInputDouble from './ui/DateTimeInputDouble';
import { useTranslation } from 'react-i18next';
import { useWindowInfo } from '../context/windowContext';
import { icons } from '../constants/icons';

const getResponsiveSize = (mobileSize, webSize, isLandscape) => {
  if (Platform.OS === 'web') {
    return isLandscape ? webSize * 1.6 : RFValue(mobileSize);
  }
  return RFValue(mobileSize);
};

export default function ShowJobModal({ closeModal, status, currentJobId }) {
  // const router = useRouter();
  const { themeController, session, jobsController, languageController } =
    useComponentContext();
  const { t } = useTranslation();
  const { width, height, isLandscape } = useWindowInfo();
  const isRTL = languageController?.isRTL;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  // размеры (только для веб-альбомной — иначе RFValue как было)
  const sizes = {
    font: isWebLandscape ? height * 0.016 : RFValue(12),
    inputFont: isWebLandscape ? height * 0.014 : RFValue(10),
    padding: isWebLandscape ? height * 0.01 : RFValue(8),
    margin: isWebLandscape ? height * 0.012 : RFValue(10),
    borderRadius: isWebLandscape ? height * 0.006 : RFValue(5),
    thumb: isWebLandscape ? height * 0.12 : RFValue(80),
    headerHeight: isWebLandscape ? height * 0.07 : RFPercentage(7),
    icon: isWebLandscape ? height * 0.035 : RFValue(16),
    horizontalGap: isWebLandscape ? width*0.01 : 0,
  };

  const [newJobModalVisible, setNewJobModalVisible] = useState(false);
  const [isInterestedRequest, setInterestedRequest] = useState(
    status === 'jobs-waiting'
  );

  const [showCancelRequestModal, setCancelRequestModal] = useState(false);
  const [showConfirmInterestModal, setConfirmInterestModal] = useState(false);

  const [showHistoryModal, setHistoryModal] = useState(false);

  const [currentJobInfo, setCurrentJobInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Подгружаем job при редактировании
  useEffect(() => {
    if (!currentJobId) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const job = await jobsController.actions.getJobById(
          currentJobId,
          session
        );
        if (cancelled) return;
        setCurrentJobInfo(job);
        if (job.doneComment) {
          setEditableCommentValue(job.doneComment);
        }
      } catch (e) {
        console.error('Failed to load job:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentJobId, session]);

  const [editableCommentState, setEditableCommentState] = useState(false);
  const [editableCommentValue, setEditableCommentValue] = useState('');

  function extraUiByStatus(status) {
    switch (status) {
      case 'store-waiting':
        return [
          <ProvidersSection
            key='providers'
            styles={styles}
            currentJobInfo={currentJobInfo}
            status={status}
            closeAllModal={closeModal}
          />,
          <View
            style={{
              width: '100%',
              gap: sizes.horizontalGap,
              flexDirection: isWebLandscape
                ? isRTL
                  ? 'row-reverse'
                  : 'row'
                : 'column',
            }}
          >
            <TouchableOpacity
              key='updateButton'
              style={[
                styles.createButton,
                {
                  backgroundColor:
                    themeController.current?.buttonColorPrimaryDefault,
                  ...(isWebLandscape && {
                    paddingVertical: sizes.padding * 1.2,
                    borderRadius: sizes.borderRadius,
                    width: '30%',
                  }),
                },
              ]}
              onPress={() => setNewJobModalVisible(true)}
            >
              <Text
                style={{
                  color: 'white',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  ...(isWebLandscape && { fontSize: sizes.font }),
                }}
              >
                {t('showJob.buttons.update', { defaultValue: 'Update' })}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              key='closeButton'
              style={[
                styles.createButton,
                {
                  backgroundColor:
                    themeController.current?.buttonColorSecondaryDefault,
                  ...(isWebLandscape && {
                    paddingVertical: sizes.padding * 1.2,
                    borderRadius: sizes.borderRadius, 
                    width: '30%',
                  }),
                },
              ]}
              onPress={() => {
                jobsController.actions
                  .deleteJob(currentJobId)
                  .then(closeModal());
              }}
            >
              <Text
                style={{
                  color: 'white',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  ...(isWebLandscape && { fontSize: sizes.font }),
                }}
              >
                {t('showJob.buttons.close', { defaultValue: 'Close' })}
              </Text>
            </TouchableOpacity>
          </View>,
        ];
      case 'store-in-progress':
        return [
          <ProvidersSection
            key='providers'
            styles={styles}
            currentJobInfo={currentJobInfo}
            status={status}
            closeAllModal={closeModal}
          />,
        ];
      case 'store-done':
        return [
          <ProvidersSection
            key='providers'
            styles={styles}
            currentJobInfo={currentJobInfo}
            status={status}
            closeAllModal={closeModal}
          />,
          <View
            style={[
              styles.inputBlock,
              { backgroundColor: themeController.current?.formInputBackground },
            ]}
            key='provider-comments'
          >
            <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>
              {t('showJob.fields.providerComments', {
                defaultValue: 'Provider comments',
              })}
            </Text>
            <TextInput
              value={currentJobInfo?.doneComment || ''}
              style={[
                styles.input,
                { height: RFValue(70) },
                isRTL && { textAlign: 'right' },
              ]}
              multiline
              readOnly
            />
          </View>,
          !currentJobInfo?.isClosed && (
            <TouchableOpacity
              key='confirmButton'
              style={[
                styles.createButton,
                {
                  backgroundColor:
                    themeController.current?.buttonColorPrimaryDefault,
                  ...(isWebLandscape && {
                    paddingVertical: sizes.padding * 1.2,
                    borderRadius: sizes.borderRadius,
                  }),
                },
              ]}
              onPress={() => jobsController.actions.confirmJob(currentJobId)}
            >
              <Text
                style={{
                  color: 'white',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  ...(isWebLandscape && { fontSize: sizes.font }),
                }}
              >
                {t('showJob.buttons.confirmCompletion', {
                  defaultValue: 'Confirm job completion',
                })}
              </Text>
            </TouchableOpacity>
          ),
        ];
      case 'jobs-new':
        return [
          isInterestedRequest ? (
            <>
              <TouchableOpacity
                key='updateButton'
                style={[
                  styles.createButton,
                  {
                    backgroundColor: 'transparent',
                    borderColor: 'red',
                    borderWidth: 1,
                    ...(isWebLandscape && {
                      paddingVertical: sizes.padding * 1.2,
                      borderRadius: sizes.borderRadius,
                    }),
                  },
                ]}
                onPress={() => setCancelRequestModal(true)}
              >
                <Text
                  style={{
                    color: 'red',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    ...(isWebLandscape && { fontSize: sizes.font }),
                  }}
                >
                  {t('showJob.buttons.cancelRequest', {
                    defaultValue: 'Cancel request',
                  })}
                </Text>
              </TouchableOpacity>
              <Text
                style={[
                  styles.waitText,
                  { color: themeController.current?.unactiveTextColor },
                  isRTL && { textAlign: 'right' },
                  isWebLandscape && { fontSize: sizes.inputFont },
                ]}
                key='waitText'
              >
                {t('showJob.messages.waitForCall', {
                  defaultValue: 'Wait for a call from the customer...',
                })}
              </Text>
            </>
          ) : (
            <TouchableOpacity
              key='updateButton'
              style={[
                styles.createButton,
                {
                  backgroundColor:
                    themeController.current?.buttonColorPrimaryDefault,
                  ...(isWebLandscape && {
                    paddingVertical: sizes.padding * 1.2,
                    borderRadius: sizes.borderRadius,
                  }),
                },
              ]}
              onPress={() => setConfirmInterestModal(true)}
            >
              <Text
                style={{
                  color: 'white',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  ...(isWebLandscape && { fontSize: sizes.font }),
                }}
              >
                {t('showJob.buttons.interested', {
                  defaultValue: 'I am interested in the job',
                })}
              </Text>
            </TouchableOpacity>
          ),
        ];
      case 'jobs-waiting':
        return [
          isInterestedRequest ? (
            <>
              <TouchableOpacity
                key='updateButton'
                style={[
                  styles.createButton,
                  {
                    backgroundColor: 'transparent',
                    borderColor: 'red',
                    borderWidth: 1,
                    ...(isWebLandscape && {
                      paddingVertical: sizes.padding * 1.2,
                      borderRadius: sizes.borderRadius,
                    }),
                  },
                ]}
                onPress={() => setCancelRequestModal(true)}
              >
                <Text
                  style={{
                    color: 'red',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    ...(isWebLandscape && { fontSize: sizes.font }),
                  }}
                >
                  {t('showJob.buttons.cancelRequest', {
                    defaultValue: 'Cancel request',
                  })}
                </Text>
              </TouchableOpacity>
              <Text
                style={[
                  styles.waitText,
                  { color: themeController.current?.unactiveTextColor },
                  isRTL && { textAlign: 'right' },
                  isWebLandscape && { fontSize: sizes.inputFont },
                ]}
                key='waitText'
              >
                {t('showJob.messages.waitForCall', {
                  defaultValue: 'Wait for a call from the customer...',
                })}
              </Text>
            </>
          ) : (
            <TouchableOpacity
              key='updateButton'
              style={[
                styles.createButton,
                {
                  backgroundColor:
                    themeController.current?.buttonColorPrimaryDefault,
                  ...(isWebLandscape && {
                    paddingVertical: sizes.padding * 1.2,
                    borderRadius: sizes.borderRadius,
                  }),
                },
              ]}
              onPress={() => setConfirmInterestModal(true)}
            >
              <Text
                style={{
                  color: 'white',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  ...(isWebLandscape && { fontSize: sizes.font }),
                }}
              >
                {t('showJob.buttons.interested', {
                  defaultValue: 'I am interested in the job',
                })}
              </Text>
            </TouchableOpacity>
          ),
        ];
      case 'jobs-in-progress':
        return [
          <ProvidersSection
            key='providers'
            styles={styles}
            currentJobInfo={currentJobInfo}
            status={status}
            closeAllModal={closeModal}
          />,
          <TouchableOpacity
            key='completeBtn'
            style={[
              styles.createButton,
              {
                backgroundColor:
                  themeController.current?.buttonColorPrimaryDefault,
                ...(isWebLandscape && {
                  paddingVertical: sizes.padding * 1.2,
                  borderRadius: sizes.borderRadius,
                }),
              },
            ]}
            onPress={() =>
              jobsController.actions
                .markJobDone(currentJobId)
                .then(closeModal())
            }
          >
            <Text
              style={{
                color: 'white',
                textAlign: 'center',
                fontWeight: 'bold',
                ...(isWebLandscape && { fontSize: sizes.font }),
              }}
            >
              {t('showJob.buttons.markCompleted', {
                defaultValue: 'Mark as completed',
              })}
            </Text>
          </TouchableOpacity>,
        ];
      case 'jobs-done':
        return [
          <ProvidersSection
            key='providers'
            styles={styles}
            currentJobInfo={currentJobInfo}
            status={status}
            closeAllModal={closeModal}
          />,
          <View
            style={[
              styles.inputBlock,
              { backgroundColor: themeController.current?.formInputBackground },
            ]}
            key='provider-comments'
          >
            <View
              style={[
                styles.editableTitlePanel,
                isRTL && { flexDirection: 'row-reverse' },
              ]}
            >
              <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>
                {t('showJob.fields.myComments', {
                  defaultValue: 'My comments',
                })}
              </Text>
              {editableCommentState ? (
                <View
                  style={[
                    styles.editPanel,
                    isRTL && { flexDirection: 'row-reverse' },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => {
                      setEditableCommentState(false);
                      setEditableCommentValue(currentJobInfo?.doneComment);
                    }}
                  >
                    <MaterialIcons
                      name='cancel'
                      size={RFValue(18)}
                      color='#00000080'
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setEditableCommentState(false);
                      // currentJobInfo.doneComment = editableCommentValue;
                    }}
                  >
                    <MaterialIcons
                      name='check-circle'
                      size={RFValue(18)}
                      color='#00000080'
                    />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => setEditableCommentState(true)}>
                  <MaterialCommunityIcons
                    name='pencil'
                    size={RFValue(18)}
                    color='#00000080'
                  />
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              value={editableCommentValue}
              style={[
                styles.input,
                { height: RFValue(70) },
                isRTL && { textAlign: 'right' },
              ]}
              onChangeText={setEditableCommentValue}
              multiline
              readOnly={!editableCommentState}
            />
          </View>,
        ];
      default:
        return [];
    }
  }

  const formContent = [
    <View
      style={[
        styles.inputBlock,
        { backgroundColor: themeController.current?.formInputBackground },
      ]}
      key='type'
    >
      <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>
        {t('showJob.fields.type', { defaultValue: 'Type' })}
      </Text>
      <TextInput
        value={JOB_TYPES[currentJobInfo?.type] || '-'}
        style={[styles.input, isRTL && { textAlign: 'right' }]}
        readOnly
      />
    </View>,
    <View
      style={[
        styles.inputBlock,
        { backgroundColor: themeController.current?.formInputBackground },
      ]}
      key='subType'
    >
      <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>
        {t('showJob.fields.subType', { defaultValue: 'Sub type' })}
      </Text>
      <TextInput
        value={JOB_SUB_TYPES[currentJobInfo?.subType] || '-'}
        style={[styles.input, isRTL && { textAlign: 'right' }]}
        readOnly
      />
    </View>,
    <View
      style={[
        styles.inputBlock,
        { backgroundColor: themeController.current?.formInputBackground },
      ]}
      key='profession'
    >
      <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>
        {t('showJob.fields.profession', { defaultValue: 'Profession' })}
      </Text>
      <TextInput
        value={LICENSES[currentJobInfo?.profession] || '-'}
        style={[styles.input, isRTL && { textAlign: 'right' }]}
        readOnly
      />
    </View>,
    <View
      style={[
        styles.inputBlock,
        { backgroundColor: themeController.current?.formInputBackground },
      ]}
      key='description'
    >
      <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>
        {t('showJob.fields.description', { defaultValue: 'Description' })}
      </Text>
      <TextInput
        value={currentJobInfo?.description || ''}
        style={[
          styles.input,
          { height: RFValue(70) },
          isRTL && { textAlign: 'right' },
        ]}
        multiline
        readOnly
      />
    </View>,
    <View
      style={[
        styles.inputBlock,
        { backgroundColor: themeController.current?.formInputBackground },
      ]}
      key='price'
    >
      <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>
        {t('showJob.fields.price', { defaultValue: 'Price' })}
      </Text>
      <TextInput
        value={currentJobInfo?.price || '-'}
        style={[styles.input, isRTL && { textAlign: 'right' }]}
        keyboardType='numeric'
        readOnly
      />
    </View>,
    <View style={styles.imageInputBlock} key='images'>
      <View
        style={[styles.imageRow, isRTL && { flexDirection: 'row-reverse' }]}
      >
        {/* Скролл с картинками */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.imageScrollContainer,
            isRTL && { flexDirection: 'row-reverse' },
          ]}
        >
          {currentJobInfo?.images.map((uri, index) => (
            <View
              key={index}
              style={[
                styles.imageWrapper,
                isRTL && { marginRight: 0, marginLeft: 8 },
              ]}
            >
              <Image source={{ uri }} style={styles.imageThumbnail} />
            </View>
          ))}
        </ScrollView>
      </View>
    </View>,
    <View
      style={[
        styles.inputBlock,
        { backgroundColor: themeController.current?.formInputBackground },
      ]}
      key='location'
    >
      <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>
        {t('showJob.fields.location', { defaultValue: 'Location' })}
      </Text>
      <TextInput
        value={currentJobInfo?.location || '-'}
        style={[styles.input, isRTL && { textAlign: 'right' }]}
        readOnly
      />
    </View>,
    <View
      style={[styles.row, isRTL && { flexDirection: 'row-reverse' }]}
      key='dateTimeRange'
    >
      {Platform.OS !== 'android' ? (
        <DateTimeInput
          key='startDateTime'
          label={t('showJob.fields.start', { defaultValue: 'Start' })}
          value={currentJobInfo?.startDateTime}
          readOnly={true}
        />
      ) : (
        <DateTimeInputDouble
          label={t('showJob.fields.start', { defaultValue: 'Start' })}
          value={currentJobInfo?.startDateTime}
          readOnly={true}
        />
      )}
      {Platform.OS !== 'android' ? (
        <DateTimeInput
          key='endDateTime'
          label={t('showJob.fields.end', { defaultValue: 'End' })}
          value={currentJobInfo?.endDateTime}
          readOnly={true}
        />
      ) : (
        <DateTimeInputDouble
          label={t('showJob.fields.end', { defaultValue: 'End' })}
          value={currentJobInfo?.endDateTime}
          readOnly={true}
        />
      )}
    </View>,
    ...extraUiByStatus(status),
  ];

  // Грид версия (только веб-альбомная)
  const bg = themeController.current?.formInputBackground;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      {loading ? (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: themeController.current?.backgroundColor,
          }}
        >
          <Text style={{ color: themeController.current?.textColor }}>
            {t('showJob.messages.loading', { defaultValue: 'Loading...' })}
          </Text>
        </View>
      ) : (
        <View
          style={{
            flex: 1,
            backgroundColor: themeController.current?.backgroundColor,
          }}
        >
          <View
            style={[
              styles.header,
              {
                height: sizes.headerHeight,
                padding: sizes.padding,
                backgroundColor: themeController.current?.backgroundColor,
              },
              isRTL && {flexDirection: 'row-reverse'}
            ]}
          >
            <TouchableOpacity
              // onPress={() =>
              //   router.canGoBack?.() ? router.back() : router.replace('/store')
              // }
              onPress={() => closeModal()}
            >
              <Image
                source={icons.cross}
                style={{
                  opacity: 0.8,
                  width: sizes.icon,
                  height: sizes.icon,
                  tintColor: themeController.current?.textColor || 'black',
                }}
              />
            </TouchableOpacity>
            <Text
              style={[
                styles.logo,
                {
                  color: themeController.current?.primaryColor,
                  fontSize: getResponsiveSize(20, height * 0.02, isLandscape),
                },
              ]}
            >
              FLALX
            </Text>
            <TouchableOpacity
              // onPress={() =>
              //   router.canGoBack?.() ? router.back() : router.replace('/store')
              // }
              onPress={() => setHistoryModal(true)}
            >
              <Image
                source={icons.history}
                style={{
                  opacity: 0.8,
                  width: sizes.icon,
                  height: sizes.icon,
                  tintColor: themeController.current?.textColor || 'black',
                }}
              />
            </TouchableOpacity>
          </View>

          {Platform.OS === 'web' ? (
            isWebLandscape ? (
              <ScrollView
                contentContainerStyle={[
                  styles.container,
                  { padding: sizes.margin },
                ]}
                keyboardShouldPersistTaps='handled'
              >
                <View
                  direction={isRTL ? 'rtl' : 'ltr'}
                  style={[
                    styles.gridContainer,
                    {
                      justifyContent: isRTL ? 'end' : 'start',
                      position: 'relative',
                      gridRowGap: height * 0.02,
                    },
                  ]}
                >
                  {/* Колонка 1: Type */}
                  <View
                    style={{
                      gridArea: isRTL ? '1 / 2 / 2 / 3' : '1 / 1 / 2 / 2',
                    }}
                  >
                    <View
                      style={[
                        styles.inputBlock,
                        {
                          backgroundColor: bg,
                          padding: sizes.padding,
                          borderRadius: sizes.borderRadius,
                          marginBottom: 0,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.label,
                          isRTL && { textAlign: 'right' },
                          { fontSize: sizes.font },
                        ]}
                      >
                        {t('showJob.fields.type', { defaultValue: 'Type' })}
                      </Text>
                      <TextInput
                        value={JOB_TYPES[currentJobInfo?.type] || '-'}
                        style={{
                          padding: sizes.padding,
                          fontSize: sizes.inputFont,
                          borderRadius: sizes.borderRadius,
                          backgroundColor: 'transparent',
                          textAlign: isRTL ? 'right' : 'left',
                        }}
                        readOnly
                      />
                    </View>
                  </View>

                  {/* Колонка 2 (растянутая по высоте): Description */}
                  <View
                    style={{
                      gridArea: isRTL ? '1 / 1 / 3 / 2' : '1 / 2 / 3 / 3',
                    }}
                  >
                    <View
                      style={[
                        styles.inputBlock,
                        {
                          backgroundColor: bg,
                          padding: sizes.padding,
                          borderRadius: sizes.borderRadius,
                          height: '100%',
                          marginBottom: 0,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.label,
                          isRTL && { textAlign: 'right' },
                          { fontSize: sizes.font },
                        ]}
                      >
                        {t('showJob.fields.description', {
                          defaultValue: 'Description',
                        })}
                      </Text>
                      <TextInput
                        value={currentJobInfo?.description || ''}
                        style={{
                          padding: sizes.padding,
                          fontSize: sizes.inputFont,
                          borderRadius: sizes.borderRadius,
                          height: height * 0.12,
                          backgroundColor: 'transparent',
                          textAlign: isRTL ? 'right' : 'left',
                        }}
                        multiline
                        readOnly
                      />
                    </View>
                  </View>

                  {/* Sub type */}
                  <View
                    style={{
                      gridArea: isRTL ? '2 / 2 / 3 / 3' : '2 / 1 / 3 / 2',
                    }}
                  >
                    <View
                      style={[
                        styles.inputBlock,
                        {
                          backgroundColor: bg,
                          padding: sizes.padding,
                          borderRadius: sizes.borderRadius,
                          marginBottom: 0,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.label,
                          isRTL && { textAlign: 'right' },
                          { fontSize: sizes.font },
                        ]}
                      >
                        {t('showJob.fields.subType', {
                          defaultValue: 'Sub type',
                        })}
                      </Text>
                      <TextInput
                        value={JOB_SUB_TYPES[currentJobInfo?.subType] || '-'}
                        style={{
                          padding: sizes.padding,
                          fontSize: sizes.inputFont,
                          borderRadius: sizes.borderRadius,
                          backgroundColor: 'transparent',
                          textAlign: isRTL ? 'right' : 'left',
                        }}
                        readOnly
                      />
                    </View>
                  </View>

                  {/* Profession */}
                  <View
                    style={{
                      gridArea: isRTL ? '3 / 2 / 4 / 3' : '3 / 1 / 4 / 2',
                    }}
                  >
                    <View
                      style={[
                        styles.inputBlock,
                        {
                          backgroundColor: bg,
                          padding: sizes.padding,
                          borderRadius: sizes.borderRadius,
                          marginBottom: 0,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.label,
                          isRTL && { textAlign: 'right' },
                          { fontSize: sizes.font },
                        ]}
                      >
                        {t('showJob.fields.profession', {
                          defaultValue: 'Profession',
                        })}
                      </Text>
                      <TextInput
                        value={LICENSES[currentJobInfo?.profession] || '-'}
                        style={{
                          padding: sizes.padding,
                          fontSize: sizes.inputFont,
                          borderRadius: sizes.borderRadius,
                          backgroundColor: 'transparent',
                          textAlign: isRTL ? 'right' : 'left',
                        }}
                        readOnly
                      />
                    </View>
                  </View>

                  {/* Price */}
                  <View
                    style={{
                      gridArea: isRTL ? '3 / 1 / 4 / 2' : '3 / 2 / 4 / 3',
                    }}
                  >
                    <View
                      style={[
                        styles.inputBlock,
                        {
                          backgroundColor: bg,
                          padding: sizes.padding,
                          borderRadius: sizes.borderRadius,
                          marginBottom: 0,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.label,
                          isRTL && { textAlign: 'right' },
                          { fontSize: sizes.font },
                        ]}
                      >
                        {t('showJob.fields.price', { defaultValue: 'Price' })}
                      </Text>
                      <TextInput
                        value={currentJobInfo?.price || '-'}
                        style={{
                          padding: sizes.padding,
                          fontSize: sizes.inputFont,
                          borderRadius: sizes.borderRadius,
                          backgroundColor: 'transparent',
                          textAlign: isRTL ? 'right' : 'left',
                        }}
                        keyboardType='numeric'
                        readOnly
                      />
                    </View>
                  </View>

                  {/* Photos (full width) */}
                  <View style={{ gridArea: '4 / 1 / 6 / 3' }}>
                    <Text
                      style={[
                        styles.label,
                        isRTL && { textAlign: 'right' },
                        {
                          fontSize: sizes.font,
                          marginBottom: sizes.margin / 2,
                        },
                      ]}
                    >
                      {t('showJob.fields.uploadingPhotos', {
                        defaultValue: 'Uploading photos',
                      })}
                    </Text>
                    <View
                      style={[
                        styles.imageRow,
                        isRTL && { flexDirection: 'row-reverse' },
                      ]}
                    >
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={[
                          styles.imageScrollContainer,
                          isRTL && { flexDirection: 'row-reverse' },
                        ]}
                      >
                        {currentJobInfo?.images.map((uri, index) => (
                          <View
                            key={index}
                            style={[
                              styles.imageWrapper,
                              isRTL && { marginRight: 0, marginLeft: 8 },
                            ]}
                          >
                            <Image
                              source={{ uri }}
                              style={{
                                width: sizes.thumb,
                                height: sizes.thumb,
                                borderRadius: sizes.borderRadius,
                              }}
                            />
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  </View>

                  {/* Location */}
                  <View
                    style={{
                      gridArea: isRTL ? '6 / 2 / 7 / 3' : '6 / 1 / 7 / 2',
                    }}
                  >
                    <View
                      style={[
                        styles.inputBlock,
                        {
                          backgroundColor: bg,
                          padding: sizes.padding,
                          borderRadius: sizes.borderRadius,
                          marginBottom: 0,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.label,
                          isRTL && { textAlign: 'right' },
                          { fontSize: sizes.font },
                        ]}
                      >
                        {t('showJob.fields.location', {
                          defaultValue: 'Location',
                        })}
                      </Text>
                      <TextInput
                        value={currentJobInfo?.location || '-'}
                        style={{
                          padding: sizes.padding,
                          fontSize: sizes.inputFont,
                          borderRadius: sizes.borderRadius,
                          backgroundColor: 'transparent',
                          textAlign: isRTL ? 'right' : 'left',
                        }}
                        readOnly
                      />
                    </View>
                  </View>

                  {/* Start date */}
                  <View
                    style={{
                      gridArea: isRTL ? '7 / 2 / 8 / 3' : '7 / 1 / 8 / 2',
                    }}
                  >
                    <View
                      style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
                    >
                      {Platform.OS !== 'android' ? (
                        <DateTimeInput
                          key='startDateTime'
                          label={t('showJob.fields.start', {
                            defaultValue: 'Start',
                          })}
                          value={currentJobInfo?.startDateTime}
                          readOnly={true}
                        />
                      ) : (
                        <DateTimeInputDouble
                          label={t('showJob.fields.start', {
                            defaultValue: 'Start',
                          })}
                          value={currentJobInfo?.startDateTime}
                          readOnly={true}
                        />
                      )}
                    </View>
                  </View>

                  {/* End date */}
                  <View
                    style={{
                      gridArea: isRTL ? '7 / 1 / 8 / 2' : '7 / 2 / 8 / 3',
                    }}
                  >
                    <View
                      style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
                    >
                      {Platform.OS !== 'android' ? (
                        <DateTimeInput
                          key='endDateTime'
                          label={t('showJob.fields.end', {
                            defaultValue: 'End',
                          })}
                          value={currentJobInfo?.endDateTime}
                          readOnly={true}
                        />
                      ) : (
                        <DateTimeInputDouble
                          label={t('showJob.fields.end', {
                            defaultValue: 'End',
                          })}
                          value={currentJobInfo?.endDateTime}
                          readOnly={true}
                        />
                      )}
                    </View>
                  </View>
                </View>

                {/* Остальные элементы ВНЕ сетки, обычной колонкой */}
                <View
                  style={{ marginTop: sizes.margin, gap: sizes.margin / 2 }}
                >
                  {extraUiByStatus(status).map((node, idx) => (
                    <View key={`extra-${idx}`}>{node}</View>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <CustomFlatList
                data={formContent}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item }) => item}
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps='handled'
              />
            )
          ) : (
            <FlatList
              data={formContent}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item }) => item}
              contentContainerStyle={styles.container}
              keyboardShouldPersistTaps='handled'
            />
          )}
        </View>
      )}
      <Modal visible={newJobModalVisible} animationType='slide'>
        <NewJobModal
          closeModal={() => setNewJobModalVisible(false)}
          editMode={true}
          currentJobId={currentJobId}
          initialJob={currentJobInfo}
        />
      </Modal>
      <Modal visible={showCancelRequestModal} transparent animationType='fade'>
        <View style={styles.overlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: themeController.current?.backgroundColor },
            ]}
          >
            <Text
              style={[
                styles.message,
                { color: themeController.current?.textColor },
                isRTL && { textAlign: 'right' },
                isWebLandscape && { fontSize: sizes.font },
              ]}
            >
              {t('showJob.messages.confirmCancelTitle', {
                defaultValue: 'Are you sure to cancel the request?',
              })}
            </Text>
            <View
              style={[
                styles.buttonRow,
                isRTL && { flexDirection: 'row-reverse' },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor:
                      themeController.current?.buttonColorPrimaryDefault,
                    ...(isWebLandscape && {
                      paddingVertical: sizes.padding,
                      borderRadius: sizes.borderRadius,
                    }),
                  },
                ]}
                onPress={() => setCancelRequestModal(false)}
              >
                <Text
                  style={[
                    styles.buttonText,
                    { color: themeController.current?.buttonTextColorPrimary },
                    isWebLandscape && { fontSize: sizes.font },
                  ]}
                >
                  {t('common.no', { defaultValue: 'No' })}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor:
                      themeController.current?.buttonColorPrimaryDisabled,
                    ...(isWebLandscape && {
                      paddingVertical: sizes.padding,
                      borderRadius: sizes.borderRadius,
                    }),
                  },
                ]}
                onPress={() => {
                  jobsController.actions
                    .removeProvider(currentJobId)
                    .then(() => {
                      setCancelRequestModal(false);
                      setInterestedRequest(false);
                    });
                }}
              >
                <Text
                  style={[
                    styles.buttonText,
                    { color: themeController.current?.buttonTextColorPrimary },
                    isWebLandscape && { fontSize: sizes.font },
                  ]}
                >
                  {t('common.yes', { defaultValue: 'Yes' })}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={showConfirmInterestModal}
        transparent
        animationType='fade'
      >
        <View style={styles.overlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: themeController.current?.backgroundColor,
                paddingTop: RFValue(5),
              },
            ]}
          >
            <TouchableOpacity
              // onPress={() =>
              //   router.canGoBack?.() ? router.back() : router.replace('/store')
              // }
              onPress={() => setConfirmInterestModal(false)}
              style={styles.modalCloseTouchableArea}
            >
              <Text style={styles.modalCloseButton}>✕</Text>
            </TouchableOpacity>
            <Text
              style={[
                styles.message,
                { color: themeController.current?.textColor },
                isRTL && { textAlign: 'right' },
                isWebLandscape && { fontSize: sizes.font },
              ]}
            >
              {t('showJob.paywall.notice', {
                defaultValue:
                  'To continue this action, you need to pay or subscribe',
              })}
            </Text>
            <View style={styles.buttonColumn}>
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: 'transparent',
                    borderColor:
                      themeController.current?.buttonColorPrimaryDefault,
                    borderWidth: 1,
                    ...(isWebLandscape && {
                      paddingVertical: sizes.padding,
                      borderRadius: sizes.borderRadius,
                    }),
                  },
                ]}
                onPress={() => {
                  jobsController.actions.addProvider(currentJobId).then(() => {
                    setConfirmInterestModal(false);
                    setInterestedRequest(true);
                  });
                }}
              >
                <Text
                  style={[
                    styles.buttonText,
                    {
                      color: themeController.current?.buttonColorPrimaryDefault,
                    },
                    isWebLandscape && { fontSize: sizes.font },
                  ]}
                >
                  {t('showJob.buttons.buy099', {
                    defaultValue: 'Buy for 0.99$',
                  })}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor:
                      themeController.current?.buttonColorPrimaryDefault,
                    ...(isWebLandscape && {
                      paddingVertical: sizes.padding,
                      borderRadius: sizes.borderRadius,
                    }),
                  },
                ]}
                // onPress={() => {
                //   setConfirmInterestModal(false);
                //   setInterestedRequest(true);
                // }}
              >
                <Text
                  style={[
                    styles.buttonText,
                    { color: themeController.current?.buttonTextColorPrimary },
                    isWebLandscape && { fontSize: sizes.font },
                  ]}
                >
                  {t('showJob.buttons.getSubscription', {
                    defaultValue: 'Get a subscription',
                  })}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* <Modal visible={showHistoryModal} animationType='fade'>
        <View
          style={{
            flex: 1,
            backgroundColor: themeController.current?.backgroundColor,
          }}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setHistoryModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
            <Text
              style={[styles.logo, { color: themeController.current?.primaryColor }]}
            >
              FLALX
            </Text>
          </View>
        </View>
      </Modal> */}
      <JobHistoryModal
        visible={showHistoryModal}
        onClose={() => setHistoryModal(false)}
        history={currentJobInfo?.changes_history}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: RFValue(14),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: RFValue(14),
  },
  logo: {
    fontSize: RFValue(20),
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: RFValue(18),
  },
  modalCloseTouchableArea: {
    alignSelf: 'flex-end',
    marginBottom: RFValue(8),
  },
  modalCloseButton: {
    fontSize: RFValue(18),
  },
  inputBlock: {
    marginBottom: RFValue(10),
    borderRadius: RFValue(5),
    padding: RFValue(8),
    ...Platform.select({
      web: {
        zIndex: 1,
      },
    }),
  },
  imageInputBlock: {
    marginBottom: RFValue(10),
    ...Platform.select({
      web: {
        zIndex: 1,
      },
    }),
  },
  label: {
    fontWeight: 'bold',
    marginBottom: RFValue(4),
  },
  input: {
    padding: RFValue(8),
  },
  addImageButton: {
    width: RFValue(80),
    height: RFValue(80),
    backgroundColor: '#84B0F4',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RFValue(6),
    marginRight: RFValue(6),
  },
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  imageScrollContainer: {
    flexDirection: 'row',
  },
  imageThumbnail: {
    width: RFValue(80),
    height: RFValue(80),
    borderRadius: RFValue(6),
    marginRight: RFValue(6),
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 8, // отступ между картинками
  },
  createButton: {
    paddingVertical: RFValue(12),
    borderRadius: RFValue(5),
    marginBottom: RFValue(10),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: RFValue(10),
  },
  errorOutline: {
    shadowColor: 'red',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 2,
    paddingVertical: 2,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  waitText: {
    fontSize: RFValue(10),
    textAlign: 'center',
    marginBottom: RFValue(5),
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    position: 'relative',
    width: '80%',
    padding: RFValue(18),
    borderRadius: RFValue(8),
    alignItems: 'center',
  },
  message: {
    fontSize: RFValue(12),
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: RFValue(18),
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  buttonColumn: {
    flexDirection: 'column',
    width: '100%',
    gap: RFValue(8),
  },
  button: {
    flex: 1,
    paddingVertical: RFValue(9),
    marginHorizontal: RFValue(5),
    borderRadius: RFValue(5),
    alignItems: 'center',
  },
  buttonText: {
    fontSize: RFValue(12),
    fontWeight: '600',
  },
  editableTitlePanel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editPanel: {
    flexDirection: 'row',
    gap: RFValue(5),
  },

  // ====== ГРИД ДЛЯ ВЕБ-Альбомной (как в прошлом компоненте) ======
  gridContainer: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 30%)',
    gridTemplateRows: 'repeat(8)',
    gridColumnGap: '1%',
  },
});
