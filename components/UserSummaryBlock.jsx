import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { JOB_SUB_TYPES } from '../constants/jobSubTypes';
import { JOB_TYPES } from '../constants/jobTypes';
import { LICENSES } from '../constants/licenses';
import { useComponentContext } from '../context/globalAppContext';

const UserSummaryBlock = ({ user, status = 'store-waiting', currentJobId, closeAllModal }) => {
  const { themeController, session, jobsController } =
    useComponentContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const userId =user.id || user?._j?.id;
  console.log('user', user);
  
  const {
    avatar,
    name,
    surname,
    professions,
    jobTypes,
    jobSubTypes,
    about,
    email,
    phoneNumber,
  } = user.id ? user : user._j;
  
  return (
    <>
      {/* Summary Block */}
      <View style={styles.summaryContainer}>
        <View style={styles.avatarNameContainer}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name='person' size={24} color='#666' />
            </View>
          )}
          <Text style={[styles.nameText, { color: themeController.current?.textColor }]}>
            {name} {surname}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={[
            styles.visitButton,
            { backgroundColor: themeController.current?.buttonColorPrimaryDefault },
          ]}
        >
          <Text
            style={[
              styles.visitButtonText,
              { color: themeController.current?.buttonTextColorPrimary },
            ]}
          >
            Visit
          </Text>
        </TouchableOpacity>
      </View>

      {/* Fullscreen Modal */}
      <Modal visible={modalVisible} animationType='slide'>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => {
              setModalVisible(false);
              setShowContactInfo(false);
            }}
          >
            <Ionicons name='arrow-back' size={28} color='#000' />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>FLALX</Text>
        </View>
        <ScrollView contentContainerStyle={styles.modalContent}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.modalAvatar} />
          ) : (
            <View style={styles.modalAvatarPlaceholder}>
              <Ionicons name='person' size={50} color='#666' />
            </View>
          )}
          <Text style={[styles.modalName, { color: themeController.current?.textColor }]}>
            {name} {surname}
          </Text>

          {/* Professions */}
          <View style={styles.centerRow}>
            {professions?.map((p, index) => (
              <View key={index} style={styles.professionBadge}>
                <Text style={styles.professionText}>{LICENSES[p]}</Text>
              </View>
            ))}
          </View>

          {/* Job Types */}
          <Text style={styles.sectionTitle}>
            Types of job I&apos;m looking for
          </Text>
          <View style={styles.wrapRow}>
            {jobTypes?.map((type, index) => (
              <View key={index} style={styles.typeBadge}>
                <Text style={styles.typeText}>{JOB_TYPES[type]}</Text>
              </View>
            ))}
          </View>

          {/* Sub Types */}
          <Text style={styles.sectionTitle}>
            Sub types of job am I interested
          </Text>
          <View style={styles.wrapRow}>
            {jobSubTypes?.map((sub, index) => (
              <View key={index} style={styles.typeBadge}>
                <Text style={styles.typeText}>{JOB_SUB_TYPES[sub]}</Text>
              </View>
            ))}
          </View>

          {/* About */}
          <Text style={styles.sectionTitle}>A little about me</Text>
          <Text style={styles.aboutText}>{about}</Text>

          {/* Contact Info */}
          <Text style={styles.sectionTitle}>Contact information</Text>
          {!showContactInfo && status === 'store-waiting' ? (
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: themeController.current?.buttonColorPrimaryDefault,
                  marginHorizontal: 0,
                },
              ]}
              onPress={() => setShowContactInfo(true)}
            >
              <Text
                style={[
                  styles.primaryText,
                  { color: themeController.current?.buttonTextColorPrimary },
                ]}
              >
                Open contact information for 1.50$
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <Text style={styles.contactInfo}>📞 {phoneNumber}</Text>
              <Text style={styles.contactInfo}>✉️ {email}</Text>
            </>
          )}
        </ScrollView>
        {status === 'store-waiting' && (
          <View>
            {!showContactInfo && (
              <Text
                style={{
                  color: '#f33',
                  textAlign: 'center',
                  fontSize: RFValue(10),
                }}
              >
                Open contact information to be able to approve provider
              </Text>
            )}
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: showContactInfo
                    ? themeController.current?.buttonColorPrimaryDefault
                    : themeController.current?.buttonColorPrimaryDisabled,
                },
              ]}
              onPress={() => {
                if (showContactInfo) {
                  jobsController.actions
                    .approveProvider(currentJobId, userId)
                    .then(() => {
                      setModalVisible(false);
                      setShowContactInfo(false);
                      closeAllModal();
                    });
                }
              }}
            >
              <Text
                style={[
                  styles.primaryText,
                  { color: themeController.current?.buttonTextColorPrimary },
                ]}
              >
                Approve
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {status === 'store-in-progress' && (
          <View>
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: themeController.current?.buttonColorPrimaryDefault,
                  marginHorizontal: RFValue(12),
                },
              ]}
              onPress={() => {
                jobsController.actions
                  .removeExecutor(currentJobId)
                  .then(() => {
                    setModalVisible(false);
                    closeAllModal();
                  });
              }}
            >
              <Text
                style={[
                  styles.primaryText,
                  { color: themeController.current?.buttonTextColorPrimary },
                ]}
              >
                Remove executor
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Modal>
    </>
  );
};

export default UserSummaryBlock;

const styles = StyleSheet.create({
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: RFValue(8),
  },
  avatarNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: RFValue(30),
    height: RFValue(30),
    borderRadius: RFValue(21),
    marginRight: RFValue(10),
  },
  avatarPlaceholder: {
    width: RFValue(30),
    height: RFValue(30),
    borderRadius: RFValue(21),
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: RFValue(10),
  },
  nameText: {
    fontSize: RFValue(12),
    fontWeight: '500',
  },
  visitButton: {
    paddingHorizontal: RFValue(12),
    paddingVertical: RFValue(5),
    borderRadius: RFValue(5),
  },
  visitButtonText: {
    fontWeight: '600',
  },
  modalContent: {
    padding: RFValue(12),
    paddingBottom: RFValue(20),
  },
  modalAvatar: {
    width: RFValue(70),
    height: RFValue(70),
    borderRadius: RFValue(50),
    alignSelf: 'center',
    marginBottom: RFValue(8),
  },
  modalAvatarPlaceholder: {
    width: RFValue(70),
    height: RFValue(70),
    borderRadius: RFValue(50),
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: RFValue(8),
  },
  modalName: {
    fontSize: RFValue(16),
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: RFValue(6),
  },
  centerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: RFValue(10),
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: RFValue(3),
    marginBottom: RFValue(12),
  },
  professionBadge: {
    backgroundColor: '#eee',
    paddingHorizontal: RFValue(6),
    paddingVertical: RFValue(4),
    borderRadius: RFValue(5),
    marginHorizontal: RFValue(4),
    marginVertical: RFValue(1),
  },
  professionText: {
    fontSize: RFValue(10),
    color: '#444',
  },
  typeBadge: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: RFValue(6),
    paddingHorizontal: RFValue(6),
    paddingVertical: RFValue(4),
    margin: RFValue(2),
  },
  typeText: {
    fontSize: RFValue(10),
    color: '#444',
  },
  sectionTitle: {
    fontWeight: '600',
    fontSize: RFValue(12),
    marginBottom: RFValue(5),
    color: '#333',
  },
  aboutText: {
    fontSize: RFValue(10),
    color: '#444',
    marginBottom: RFValue(12),
  },
  contactInfo: {
    fontSize: RFValue(11),
    color: '#333',
    marginVertical: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: RFValue(10),
    borderBottomWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: RFValue(20),
    fontWeight: 'bold',
    color: '#0A62EA',
  },
  primaryBtn: {
    padding: RFValue(12),
    marginHorizontal: RFValue(12),
    borderRadius: RFValue(6),
    alignItems: 'center',
    marginVertical: RFValue(5),
  },
  primaryText: {
    fontSize: RFValue(12),
    fontWeight: 'bold',
  },
});
