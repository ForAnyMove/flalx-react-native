import {
  FontAwesome6,
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
import { RFValue } from 'react-native-responsive-fontsize';
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

export default function ShowJobModal({ closeModal, status, currentJobId }) {
  // const router = useRouter();
  const { themeController, session, jobsController } = useComponentContext();
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
          <TouchableOpacity
            key='updateButton'
            style={[
              styles.createButton,
              {
                backgroundColor:
                  themeController.current?.buttonColorPrimaryDefault,
              },
            ]}
            onPress={() => setNewJobModalVisible(true)}
          >
            <Text
              style={{
                color: 'white',
                textAlign: 'center',
                fontWeight: 'bold',
              }}
            >
              Update
            </Text>
          </TouchableOpacity>,
          <TouchableOpacity
            key='closeButton'
            style={[
              styles.createButton,
              {
                backgroundColor:
                  themeController.current?.buttonColorSecondaryDefault,
              },
            ]}
            onPress={() => {
              jobsController.actions.deleteJob(currentJobId).then(closeModal());
            }}
          >
            <Text
              style={{
                color: 'white',
                textAlign: 'center',
                fontWeight: 'bold',
              }}
            >
              Close
            </Text>
          </TouchableOpacity>,
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
            <Text style={styles.label}>Provider comments</Text>
            <TextInput
              value={currentJobInfo?.doneComment || ''}
              style={[styles.input, { height: RFValue(70) }]}
              multiline
              readOnly
            />
          </View>,
          !currentJobInfo.isClosed && <TouchableOpacity
            key='confirmButton'
            style={[
              styles.createButton,
              {
                backgroundColor:
                  themeController.current?.buttonColorPrimaryDefault,
              },
            ]}
            onPress={() => jobsController.actions.confirmJob(currentJobId)}
          >
            <Text
              style={{
                color: 'white',
                textAlign: 'center',
                fontWeight: 'bold',
              }}
            >
              Confirm job completion
            </Text>
          </TouchableOpacity>,
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
                  },
                ]}
                onPress={() => setCancelRequestModal(true)}
              >
                <Text
                  style={{
                    color: 'red',
                    textAlign: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  Cancel request
                </Text>
              </TouchableOpacity>
              <Text
                style={[
                  styles.waitText,
                  { color: themeController.current?.unactiveTextColor },
                ]}
                key='waitText'
              >
                Wait for a call from the customer...
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
                },
              ]}
              onPress={() => setConfirmInterestModal(true)}
            >
              <Text
                style={{
                  color: 'white',
                  textAlign: 'center',
                  fontWeight: 'bold',
                }}
              >
                I am interested in the job
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
                  },
                ]}
                onPress={() => setCancelRequestModal(true)}
              >
                <Text
                  style={{
                    color: 'red',
                    textAlign: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  Cancel request
                </Text>
              </TouchableOpacity>
              <Text
                style={[
                  styles.waitText,
                  { color: themeController.current?.unactiveTextColor },
                ]}
                key='waitText'
              >
                Wait for a call from the customer...
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
                },
              ]}
              onPress={() => setConfirmInterestModal(true)}
            >
              <Text
                style={{
                  color: 'white',
                  textAlign: 'center',
                  fontWeight: 'bold',
                }}
              >
                I am interested in the job
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
              },
            ]}
            onPress={() => jobsController.actions.markJobDone(currentJobId).then(closeModal())}
          >
            <Text
              style={{
                color: 'white',
                textAlign: 'center',
                fontWeight: 'bold',
              }}
            >
              Mark as completed
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
            <View style={styles.editableTitlePanel}>
              <Text style={styles.label}>My comments</Text>
              {editableCommentState ? (
                <View style={styles.editPanel}>
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
              style={[styles.input, { height: RFValue(70) }]}
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
      <Text style={styles.label}>Type</Text>
      <TextInput
        value={JOB_TYPES[currentJobInfo?.type] || '-'}
        style={styles.input}
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
      <Text style={styles.label}>Sub type</Text>
      <TextInput
        value={JOB_SUB_TYPES[currentJobInfo?.subType] || '-'}
        style={styles.input}
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
      <Text style={styles.label}>Profession</Text>
      <TextInput
        value={LICENSES[currentJobInfo?.profession] || '-'}
        style={styles.input}
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
      <Text style={styles.label}>Description</Text>
      <TextInput
        value={currentJobInfo?.description || ''}
        style={[styles.input, { height: RFValue(70) }]}
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
      <Text style={styles.label}>Price</Text>
      <TextInput
        value={currentJobInfo?.price || '-'}
        style={styles.input}
        keyboardType='numeric'
        readOnly
      />
    </View>,
    <View style={styles.imageInputBlock} key='images'>
      <View style={styles.imageRow}>
        {/* Скролл с картинками */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.imageScrollContainer}
        >
          {currentJobInfo?.images.map((uri, index) => (
            <View key={index} style={styles.imageWrapper}>
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
      <Text style={styles.label}>Location</Text>
      <TextInput
        value={currentJobInfo?.location || '-'}
        style={styles.input}
        readOnly
      />
    </View>,
    <View style={styles.row} key='dateTimeRange'>
      {Platform.OS !== 'android' ? (
        <DateTimeInput
          key='startDateTime'
          label='Start'
          value={currentJobInfo?.startDateTime}
          readOnly={true}
        />
      ) : (
        <DateTimeInputDouble
          label='Start'
          value={currentJobInfo?.startDateTime}
          readOnly={true}
        />
      )}
      {Platform.OS !== 'android' ? (
        <DateTimeInput
          key='endDateTime'
          label='End'
          value={currentJobInfo?.endDateTime}
          readOnly={true}
        />
      ) : (
        <DateTimeInputDouble
          label='End'
          value={currentJobInfo?.endDateTime}
          readOnly={true}
        />
      )}
    </View>,
    ...extraUiByStatus(status),
  ];

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
            Loading...
          </Text>
        </View>
      ) : (
        <View
          style={{
            flex: 1,
            backgroundColor: themeController.current?.backgroundColor,
          }}
        >
          <View style={styles.header}>
            <TouchableOpacity
              // onPress={() =>
              //   router.canGoBack?.() ? router.back() : router.replace('/store')
              // }
              onPress={() => closeModal()}
            >
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
            <Text
              style={[
                styles.logo,
                { color: themeController.current?.primaryColor },
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
              <FontAwesome6
                name='clock-rotate-left'
                size={RFValue(16)}
                color={themeController.current?.textColor}
              />
            </TouchableOpacity>
          </View>

          {Platform.OS === 'web' ? (
            <CustomFlatList
              data={formContent}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item }) => item}
              contentContainerStyle={styles.container}
              keyboardShouldPersistTaps='handled'
            />
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
              ]}
            >
              Are you sure to cancel the request?
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor:
                      themeController.current?.buttonColorPrimaryDefault,
                  },
                ]}
                onPress={() => setCancelRequestModal(false)}
              >
                <Text
                  style={[
                    styles.buttonText,
                    { color: themeController.current?.buttonTextColorPrimary },
                  ]}
                >
                  No
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor:
                      themeController.current?.buttonColorPrimaryDisabled,
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
                  ]}
                >
                  Yes
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
              ]}
            >
              To continue this action, you need to pay or subscribe
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
                  ]}
                >
                  Buy for 0.99$
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor:
                      themeController.current?.buttonColorPrimaryDefault,
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
                  ]}
                >
                  Get a subscription
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
});
