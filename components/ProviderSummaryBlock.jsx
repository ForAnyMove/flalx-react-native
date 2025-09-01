import { useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { useComponentContext } from '../context/globalAppContext';
import { JOB_TYPES } from '../constants/jobTypes';
import { JOB_SUB_TYPES } from '../constants/jobSubTypes';
import { LICENSES } from '../constants/licenses';
import { icons } from '../constants/icons';
import { useWindowInfo } from '../context/windowContext';
import { useTranslation } from 'react-i18next';
import CommentsSection from './CommentsSection';

const ProviderSummaryBlock = ({ user }) => {
  const { t } = useTranslation();
  const { themeController, languageController } = useComponentContext();
  const { height, isLandscape } = useWindowInfo();
  const isRTL = languageController.isRTL;

  const [modalVisible, setModalVisible] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);

  const isWebLandscape = Platform.OS === 'web' && isLandscape;
  const sizes = {
    font: isWebLandscape ? height * 0.016 : RFValue(12),
    small: isWebLandscape ? height * 0.014 : RFValue(10),
    avatar: isWebLandscape ? height * 0.06 : RFValue(33),
    modalAvatar: isWebLandscape ? height * 0.1 : RFValue(75),
    icon: isWebLandscape ? height * 0.035 : RFValue(28),
    padding: isWebLandscape ? height * 0.01 : RFValue(10),
    cardWidth: isWebLandscape ? '32%' : '100%', // 👈 3 в ряд для web-landscape
  };

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
  } = user;

  return (
    <>
      {/* Summary Block */}
      <View
        style={[
          styles.summaryContainer,
          {
            width: sizes.cardWidth,
            padding: sizes.padding,
            flexDirection: isRTL ? 'row-reverse' : 'row',
            backgroundColor: themeController.current?.formInputBackground,
            borderRadius: isWebLandscape ? height * 0.01 : RFValue(8),
          },
        ]}
      >
        <View
          style={[
            styles.avatarNameContainer,
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
        >
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              style={{
                width: sizes.avatar,
                height: sizes.avatar,
                borderRadius: sizes.avatar / 2,
              }}
            />
          ) : (
            <View
              style={[
                styles.avatarPlaceholder,
                {
                  width: sizes.avatar,
                  height: sizes.avatar,
                  borderRadius: sizes.avatar / 2,
                },
              ]}
            >
              <Image source={icons.person} style={{ width: '100%', height: '100%' }} />
            </View>
          )}
          <Text
            style={{
              fontSize: sizes.font,
              fontWeight: '600', // 👈 вернул жирность
              color: themeController.current?.textColor,
              marginHorizontal: RFValue(8),
            }}
          >
            {name} {surname}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={[
            styles.visitButton,
            {
              backgroundColor: themeController.current?.buttonColorPrimaryDefault,
              paddingHorizontal: sizes.padding,
            },
          ]}
        >
          <Text
            style={{
              fontSize: sizes.small,
              fontWeight: '600',
              color: themeController.current?.buttonTextColorPrimary,
            }}
          >
            {t('common.visit')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Fullscreen Modal */}
      <Modal visible={modalVisible} animationType="slide">
        <View style={[styles.modalHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity
            onPress={() => {
              setModalVisible(false);
              setShowContactInfo(false);
            }}
          >
            <Image
              source={icons.back}
              style={{
                width: sizes.icon,
                height: sizes.icon,
                tintColor: themeController.current?.textColor,
              }}
            />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>FLALX</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: sizes.padding }}>
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              style={{
                width: sizes.modalAvatar,
                height: sizes.modalAvatar,
                borderRadius: sizes.modalAvatar / 2,
                alignSelf: 'center',
              }}
            />
          ) : (
            <View
              style={[
                styles.modalAvatarPlaceholder,
                {
                  width: sizes.modalAvatar,
                  height: sizes.modalAvatar,
                  borderRadius: sizes.modalAvatar / 2,
                },
              ]}
            >
              <Image source={icons.person} style={{ width: '60%', height: '60%' }} />
            </View>
          )}
          <Text
            style={{
              fontSize: sizes.font,
              fontWeight: '600',
              textAlign: 'center',
              marginBottom: RFValue(6),
              color: themeController.current?.textColor,
            }}
          >
            {name} {surname}
          </Text>

          {/* Professions */}
          <Text style={styles.sectionTitle}>{t('profile.professions')}</Text>
          <View style={styles.centerRow}>
            {professions?.map((p, i) => (
              <View key={i} style={styles.professionBadge}>
                <Text style={{ fontSize: sizes.small }}>{LICENSES[p]}</Text>
              </View>
            ))}
          </View>

          {/* Job Types */}
          <Text style={styles.sectionTitle}>{t('profile.job_types')}</Text>
          <View style={styles.wrapRow}>
            {jobTypes?.map((type, i) => (
              <View key={i} style={styles.typeBadge}>
                <Text style={{ fontSize: sizes.small }}>{JOB_TYPES[type]}</Text>
              </View>
            ))}
          </View>

          {/* Sub Types */}
          <Text style={styles.sectionTitle}>{t('profile.job_subtypes')}</Text>
          <View style={styles.wrapRow}>
            {jobSubTypes?.map((sub, i) => (
              <View key={i} style={styles.typeBadge}>
                <Text style={{ fontSize: sizes.small }}>{JOB_SUB_TYPES[sub]}</Text>
              </View>
            ))}
          </View>

          {/* About */}
          <Text style={styles.sectionTitle}>{t('profile.about_me')}</Text>
          <Text style={{ fontSize: sizes.small, color: '#444' }}>{about}</Text>

          {/* Contact Info */}
          <Text style={styles.sectionTitle}>{t('profile.contact_info')}</Text>
          {!showContactInfo ? (
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { backgroundColor: themeController.current?.buttonColorPrimaryDefault },
              ]}
              onPress={() => setShowContactInfo(true)}
            >
              <Text
                style={{
                  fontSize: sizes.small,
                  color: themeController.current?.buttonTextColorPrimary,
                }}
              >
                {t('profile.open_contact_info')}
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <Text style={{ fontSize: sizes.small }}>📞 {phoneNumber}</Text>
              <Text style={{ fontSize: sizes.small }}>✉️ {email}</Text>
            </>
          )}
          <CommentsSection userId={user.id} allowAdd={true} />
        </ScrollView>
        <TouchableOpacity
          style={[
            styles.primaryBtn,
            { backgroundColor: themeController.current?.buttonColorPrimaryDefault },
          ]}
          onPress={() => {
            setModalVisible(false);
            setShowContactInfo(false);
          }}
        >
          <Text
            style={{
              fontSize: sizes.small,
              color: themeController.current?.buttonTextColorPrimary,
            }}
          >
            {t('common.close')}
          </Text>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default ProviderSummaryBlock;

const styles = StyleSheet.create({
  summaryContainer: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: RFValue(8),
  },
  avatarNameContainer: { alignItems: 'center' },
  avatarPlaceholder: { backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
  visitButton: { borderRadius: RFValue(5) },
  modalHeader: {
    alignItems: 'center',
    padding: RFValue(10),
    borderBottomWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'space-between',
  },
  modalTitle: { fontSize: RFValue(18), fontWeight: 'bold', color: '#0A62EA' },
  sectionTitle: { fontWeight: '600', marginBottom: RFValue(5), color: '#333' },
  centerRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginBottom: RFValue(10) },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: RFValue(10) },
  professionBadge: { backgroundColor: '#eee', padding: RFValue(4), borderRadius: RFValue(5), margin: RFValue(2) },
  typeBadge: { borderWidth: 1, borderColor: '#ccc', borderRadius: RFValue(6), padding: RFValue(4), margin: RFValue(2) },
  primaryBtn: { padding: RFValue(10), margin: RFValue(10), borderRadius: RFValue(6), alignItems: 'center' },
});
