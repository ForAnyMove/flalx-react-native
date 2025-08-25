import { useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { useComponentContext } from '../context/globalAppContext';
import { JOB_TYPES } from '../constants/jobTypes';
import { JOB_SUB_TYPES } from '../constants/jobSubTypes';
import { LICENSES } from '../constants/licenses';
import { icons } from '../constants/icons';
import { useTranslation } from 'react-i18next';

const ProviderSummaryBlock = ({ user }) => {
  const { t } = useTranslation();
  const { themeController } = useComponentContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  
  const {
    avatar,
    name,
    surname,
    professions,
    jobTypes,
    jobSubTypes,
    about,
    email,
    phoneNumber
  } = user;

  return (
    <>
      {/* Summary Block */}
      <View style={styles.summaryContainer}>
        <View style={styles.avatarNameContainer}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Image source={icons.person} style={{ width: '100%', height: '100%' }} />
            </View>
          )}
          <Text style={styles.nameText}>{name} {surname}</Text>
        </View>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={[styles.visitButton, { backgroundColor: themeController.current?.buttonColorPrimaryDefault }]}>
          <Text style={[styles.visitButtonText, { color: themeController.current?.buttonTextColorPrimary}]}>Visit</Text>
        </TouchableOpacity>
      </View>

      {/* Fullscreen Modal */}
      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => {
              setModalVisible(false);
              setShowContactInfo(false);
            }}
          >
            <Image source={icons.back} style={{ width: RFValue(28), height: RFValue(28) }} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>FLALX</Text>
        </View>
        <ScrollView contentContainerStyle={styles.modalContent}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.modalAvatar} />
          ) : (
            <View style={styles.modalAvatarPlaceholder}>
              <Image source={icons.person} style={{ width: RFValue(40), height: RFValue(40) }} />
            </View>
          )}
          <Text style={styles.modalName}>{name} {surname}</Text>

          {/* Professions */}
          <View style={styles.centerRow}>
            {professions?.map((p, index) => (
              <View key={index} style={styles.professionBadge}>
                <Text style={styles.professionText}>{LICENSES[p]}</Text>
              </View>
            ))}
          </View>

          {/* Job Types */}
          <Text style={styles.sectionTitle}>Types of job I&apos;m looking for</Text>
          <View style={styles.wrapRow}>
            {jobTypes?.map((type, index) => (
              <View key={index} style={styles.typeBadge}>
                <Text style={styles.typeText}>{JOB_TYPES[type]}</Text>
              </View>
            ))}
          </View>

          {/* Sub Types */}
          <Text style={styles.sectionTitle}>Sub types of job am I interested</Text>
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
          {!showContactInfo ? (
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
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              {
                backgroundColor: themeController.current?.buttonColorPrimaryDefault,
              },
            ]}
            onPress={() => {
              setModalVisible(false);
              setShowContactInfo(false);
            }}
          >
            <Text
              style={[
                styles.primaryText,
                { color: themeController.current?.buttonTextColorPrimary },
              ]}
            >
              Close
            </Text>
          </TouchableOpacity>
      </Modal>
    </>
  );
};

export default ProviderSummaryBlock;

const styles = StyleSheet.create({
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: RFValue(10),
  },
  avatarNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: RFValue(33),
    height: RFValue(33),
    borderRadius: RFValue(21),
    marginRight: RFValue(10),
  },
  avatarPlaceholder: {
    width: RFValue(33),
    height: RFValue(33),
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
    paddingHorizontal: RFValue(14),
    paddingVertical: RFValue(5),
    borderRadius: RFValue(5),
  },
  visitButtonText: {
    fontWeight: '600',
  },
  modalContent: {
    padding: RFValue(14),
    paddingBottom: RFValue(20),
  },
  modalAvatar: {
    width: RFValue(75),
    height: RFValue(75),
    borderRadius: RFValue(50),
    alignSelf: 'center',
    marginBottom: RFValue(10),
  },
  modalAvatarPlaceholder: {
    width: RFValue(75),
    height: RFValue(75),
    borderRadius: RFValue(50),
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: RFValue(10),
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
    marginBottom: RFValue(12),
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: RFValue(4),
    marginBottom: RFValue(10),
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
