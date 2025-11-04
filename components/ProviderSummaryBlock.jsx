import { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { useComponentContext } from '../context/globalAppContext';
import { JOB_TYPES } from '../constants/jobTypes';
import { JOB_SUB_TYPES } from '../constants/jobSubTypes';
import { LICENSES } from '../constants/licenses';
import { icons } from '../constants/icons';
import { useWindowInfo } from '../context/windowContext';
import { useTranslation } from 'react-i18next';
import CommentsSection from './CommentsSection';
import { scaleByHeight } from '../utils/resizeFuncs';
import { useWebView } from '../context/webViewContext';

const ProviderSummaryBlock = ({ user, chooseUser }) => {
  const { t } = useTranslation();
  const { themeController, languageController, usersReveal, setAppLoading } =
    useComponentContext();
  const { openWebView } = useWebView();
  const { height, isLandscape, width, sidebarWidth } = useWindowInfo();
  const isRTL = languageController.isRTL;

  const [modalVisible, setModalVisible] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);

  const isWebLandscape = Platform.OS === 'web' && isLandscape;
  const sizes = {
    font: isWebLandscape ? scaleByHeight(16, height) : RFValue(12),
    smallFont: isWebLandscape ? scaleByHeight(14, height) : RFValue(10),
    sectionTitleSize: isWebLandscape ? scaleByHeight(18, height) : RFValue(14),
    small: isWebLandscape ? height * 0.014 : RFValue(10),
    avatar: isWebLandscape ? scaleByHeight(48, height) : RFValue(33),
    modalAvatar: isWebLandscape ? scaleByHeight(112, height) : RFValue(75),
    icon: isWebLandscape ? scaleByHeight(24, height) : RFValue(28),
    padding: isWebLandscape ? height * 0.01 : RFValue(10),
    paddingHorizontal: isWebLandscape ? scaleByHeight(17, height) : RFValue(12),
    cardWidth: isWebLandscape ? '32%' : '100%', // 👈 3 в ряд для web-landscape
    borderRadius: isWebLandscape ? scaleByHeight(8, height) : RFValue(5),
    padding: isWebLandscape ? height * 0.009 : RFValue(8),
    containerHeight: isWebLandscape ? scaleByHeight(80, height) : RFValue(70),
    containerWidth: isWebLandscape ? '32%' : '100%',
    logoFont: isWebLandscape ? scaleByHeight(24, height) : RFValue(18),
    pagePaddingHorizontal: isWebLandscape
      ? scaleByHeight(24, height)
      : RFValue(15),
    modalHeaderPadding: isWebLandscape ? scaleByHeight(7, height) : RFValue(10),
    modalHeaderPaddingTop: isWebLandscape
      ? scaleByHeight(32, height)
      : RFValue(5),
    avatarVerticalMargin: isWebLandscape
      ? scaleByHeight(12, height)
      : RFValue(8),
    nameSize: isWebLandscape ? scaleByHeight(28, height) : RFValue(14),
    professionSize: isWebLandscape ? scaleByHeight(20, height) : RFValue(12),
    unlockContactBtnHeight: isWebLandscape
      ? scaleByHeight(38, height)
      : RFValue(40),
    btnRadius: isWebLandscape ? scaleByHeight(8, height) : RFValue(6),
    infoSectionMarginBottom: isWebLandscape
      ? scaleByHeight(23, height)
      : RFValue(15),
    unlockContactBtnPaddingHorizontal: isWebLandscape
      ? scaleByHeight(24, height)
      : RFValue(15),
    iconMargin: isWebLandscape ? scaleByHeight(7, height) : RFValue(3),
    headerHeight: isWebLandscape ? scaleByHeight(50, height) : RFPercentage(7),
    headerMargin: isWebLandscape ? scaleByHeight(30, height) : RFValue(5),
    contactInfoHeight: isWebLandscape ? scaleByHeight(50, height) : RFValue(30),
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
  console.log('User data:', user);

  const handleUserRevealTry = async () => {
    try {
      setAppLoading(true);

      const result = await usersReveal.tryReveal(user.id);
      if (result.paymentUrl) {
        openWebView(result.paymentUrl);
      }

      setAppLoading(false);
    } catch (error) {
      console.error('Error revealing user:', error);
    }
  };

  return (
    <>
      {/* Summary Block */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={[
          styles.visitButton,
          {
            height: sizes.containerHeight,
            width: sizes.cardWidth,
          },
        ]}
      >
        <View
          style={[
            styles.summaryContainer,
            {
              width: '100%',
              height: '100%',
              padding: sizes.padding,
              paddingHorizontal: sizes.paddingHorizontal,
              flexDirection: isRTL ? 'row-reverse' : 'row',
              backgroundColor: themeController.current?.formInputBackground,
              borderRadius: sizes.borderRadius,
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
                <Image
                  source={icons.defaultAvatar}
                  style={{ width: '100%', height: '100%' }}
                />
              </View>
            )}
            <View>
              <Text
                style={{
                  fontSize: sizes.font,
                  color: themeController.current?.textColor,
                  marginHorizontal: RFValue(8),
                }}
              >
                {name} {surname}
              </Text>
              <Text
                style={{
                  fontSize: sizes.smallFont,
                  color: themeController.current?.unactiveTextColor,
                  marginHorizontal: RFValue(8),
                }}
              >
                {LICENSES[professions?.[0]]}
              </Text>
            </View>
          </View>
          {/* <Text
            style={{
              fontSize: sizes.small,
              fontWeight: '600',
              color: themeController.current?.buttonTextColorPrimary,
            }}
          >
            {t('common.visit')}
          </Text> */}
        </View>
      </TouchableOpacity>

      {/* Fullscreen Modal */}
      <Modal visible={modalVisible} animationType='slide' transparent>
        <TouchableWithoutFeedback
          onPress={() => {
            setModalVisible(false);
            setShowContactInfo(false);
          }}
        >
          <View style={[styles.backdrop]}>
            <TouchableWithoutFeedback>
              <View
                style={{
                  backgroundColor: themeController.current?.backgroundColor,
                  borderTopLeftRadius: sizes.borderRadius,
                  borderBottomLeftRadius: sizes.borderRadius,
                  paddingBottom: sizes.padding,
                  paddingHorizontal: sizes.pagePaddingHorizontal,
                  // Веб-альбомная: узкая панель справа, с пустой кликабельной зоной слева
                  width: isWebLandscape ? width - sidebarWidth : '100%',
                  alignSelf: isRTL ? 'flex-start' : 'flex-end',
                  height: '100%',
                }}
              >
                <View
                  style={[
                    styles.modalHeader,
                    {
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                      paddingHorizontal: sizes.modalHeaderPadding,
                      paddingVertical: sizes.modalHeaderPaddingTop,
                      backgroundColor: themeController.current?.backgroundColor,
                      borderBottomColor:
                        themeController.current?.profileDefaultBackground,
                      height: sizes.headerHeight,
                      marginTop: sizes.headerMargin,
                      borderBottomWidth: 2,
                    },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => {
                      setModalVisible(false);
                      setShowContactInfo(false);
                    }}
                  >
                    <Image
                      source={isRTL ? icons.forward : icons.back}
                      style={{
                        width: sizes.icon,
                        height: sizes.icon,
                        tintColor: themeController.current?.textColor,
                      }}
                    />
                  </TouchableOpacity>
                  <Text
                    style={[
                      styles.modalTitle,
                      {
                        fontSize: sizes.logoFont,
                        color: themeController.current?.primaryColor,
                      },
                    ]}
                  >
                    FLALX
                  </Text>
                </View>
                <ScrollView contentContainerStyle={{}}>
                  {avatar ? (
                    <Image
                      source={{ uri: avatar }}
                      style={{
                        width: sizes.modalAvatar,
                        height: sizes.modalAvatar,
                        borderRadius: sizes.modalAvatar / 2,
                        alignSelf: 'center',
                        marginVertical: sizes.avatarVerticalMargin,
                      }}
                    />
                  ) : (
                    <View
                      style={[
                        {
                          width: sizes.modalAvatar,
                          height: sizes.modalAvatar,
                          borderRadius: sizes.modalAvatar / 2,
                          alignSelf: 'center',
                          marginVertical: sizes.avatarVerticalMargin,
                        },
                      ]}
                    >
                      <Image
                        source={icons.defaultAvatar}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </View>
                  )}
                  <Text
                    style={{
                      fontSize: sizes.nameSize,
                      // fontWeight: '600',
                      textAlign: 'center',
                      marginBottom: RFValue(6),
                      color: themeController.current?.textColor,
                    }}
                  >
                    {name} {surname}
                  </Text>
                  <Text
                    style={{
                      fontSize: sizes.professionSize,
                      // fontWeight: '600',
                      color: themeController.current?.unactiveTextColor,
                      marginHorizontal: RFValue(8),
                      textAlign: 'center',
                    }}
                  >
                    {LICENSES[professions?.[0]]}
                  </Text>

                  {/* Контейнер для сетки 2x2 */}
                  <View
                    style={[
                      isWebLandscape && {
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        alignSelf: isRTL ? 'flex-end' : 'flex-start',
                      },
                      isWebLandscape && { width: '66%' },
                    ]}
                  >
                    {/* Job Types */}
                    {jobTypes && jobTypes?.length > 0 && (
                      <View
                        style={[
                          isWebLandscape && {
                            width: '48%',
                            marginBottom: sizes.infoSectionMarginBottom,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.sectionTitle,
                            {
                              fontSize: sizes.sectionTitleSize,
                              color: themeController.current?.textColor,
                            },
                          ]}
                        >
                          {t('profile.job_types')}
                        </Text>
                        <View style={styles.wrapRow}>
                          {jobTypes?.map((type, i) => (
                            <View
                              key={i}
                              style={[
                                styles.typeBadge,
                                {
                                  borderRadius: sizes.borderRadius / 2,
                                  paddingHorizontal: sizes.padding * 0.75,
                                  paddingVertical: sizes.padding * 0.45,
                                  margin: sizes.padding * 0.25,
                                },
                              ]}
                            >
                              <Text
                                style={{
                                  fontSize: sizes.small,
                                  color:
                                    themeController.current
                                      ?.formInputLabelColor,
                                }}
                              >
                                {JOB_TYPES[type]}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Professions */}
                    {professions && professions?.length > 0 && (
                      <View
                        style={[
                          isWebLandscape && {
                            width: '48%',
                            marginBottom: sizes.infoSectionMarginBottom,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.sectionTitle,
                            {
                              fontSize: sizes.sectionTitleSize,
                              color: themeController.current?.textColor,
                            },
                          ]}
                        >
                          {t('profile.professions')}
                        </Text>
                        <View style={styles.centerRow}>
                          {professions?.map((p, i) => (
                            <View
                              key={i}
                              style={[
                                styles.professionBadge,
                                {
                                  paddingHorizontal: sizes.padding * 0.75,
                                  paddingVertical: sizes.padding * 0.5,
                                  borderRadius: sizes.borderRadius,
                                  marginHorizontal: sizes.padding * 0.5,
                                  marginVertical: sizes.padding * 0.15,
                                },
                              ]}
                            >
                              <Text
                                style={{
                                  fontSize: sizes.small,
                                  color:
                                    themeController.current
                                      ?.formInputLabelColor,
                                }}
                              >
                                {LICENSES[p]}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Sub Types */}
                    {/* <Text style={[styles.sectionTitle, { fontSize: sizes.sectionTitleSize , color: themeController.current?.textColor}]}>
                    {t('profile.job_subtypes')}
                  </Text>
                  <View style={styles.wrapRow}>
                    {jobSubTypes?.map((sub, i) => (
                      <View key={i} style={styles.typeBadge}>
                        <Text style={{ fontSize: sizes.small }}>
                          {JOB_SUB_TYPES[sub]}
                        </Text>
                      </View>
                    ))}
                  </View> */}

                    {/* About */}
                    <View
                      style={[
                        isWebLandscape && {
                          width: '48%',
                          marginBottom: sizes.infoSectionMarginBottom,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.sectionTitle,
                          {
                            fontSize: sizes.sectionTitleSize,
                            color: themeController.current?.textColor,
                          },
                        ]}
                      >
                        {t('profile.about_me')}
                      </Text>
                      <Text
                        style={{
                          fontSize: sizes.small,
                          color: themeController.current?.unactiveTextColor,
                        }}
                      >
                        {about}
                      </Text>
                    </View>

                    {/* Contact Info */}
                    <View
                      style={[
                        isWebLandscape && {
                          width: '48%',
                          marginBottom: sizes.infoSectionMarginBottom,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.sectionTitle,
                          {
                            fontSize: sizes.sectionTitleSize,
                            color: themeController.current?.textColor,
                          },
                        ]}
                      >
                        {t('profile.contact_info')}
                      </Text>
                      {!usersReveal.contains(user.id) ? (
                        <TouchableOpacity
                          style={[
                            styles.primaryBtn,
                            {
                              backgroundColor:
                                themeController.current
                                  ?.buttonColorPrimaryDefault,
                              height: sizes.unlockContactBtnHeight,
                              justifyContent: 'center',
                              borderRadius: sizes.btnRadius,
                              width: 'max-content',
                              alignSelf: isRTL ? 'flex-end' : 'flex-start',
                              paddingHorizontal:
                                sizes.unlockContactBtnPaddingHorizontal,
                            },
                          ]}
                          onPress={handleUserRevealTry}
                        >
                          <Text
                            style={{
                              fontSize: sizes.professionSize,
                              color:
                                themeController.current?.buttonTextColorPrimary,
                            }}
                          >
                            {t('profile.open_contact_info')}
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <View
                          style={
                            isWebLandscape && {
                              flexDirection: isRTL ? 'row-reverse' : 'row',
                              alignItems: 'center',
                              height: sizes.contactInfoHeight,
                            }
                          }
                        >
                          {phoneNumber && (
                            <View
                              style={{
                                flexDirection: isRTL ? 'row-reverse' : 'row',
                                alignItems: 'center',
                              }}
                            >
                              <Image
                                source={icons.mobile}
                                style={{
                                  width: sizes.icon,
                                  height: sizes.icon,
                                  [isRTL ? 'marginLeft' : 'marginRight']:
                                    sizes.iconMargin,
                                }}
                              />
                              <Text
                                style={{
                                  fontSize: sizes.small,
                                  color:
                                    themeController.current?.unactiveTextColor,
                                }}
                              >
                                {phoneNumber}
                              </Text>
                            </View>
                          )}
                          {email && (
                            <View
                              style={{
                                flexDirection: isRTL ? 'row-reverse' : 'row',
                                alignItems: 'center',
                              }}
                            >
                              <Image
                                source={icons.emailContact}
                                style={{
                                  width: sizes.icon,
                                  height: sizes.icon,
                                  [isRTL ? 'marginLeft' : 'marginRight']:
                                    sizes.iconMargin,
                                }}
                              />
                              <Text
                                style={{
                                  fontSize: sizes.small,
                                  color:
                                    themeController.current?.unactiveTextColor,
                                }}
                              >
                                {email}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                  <CommentsSection userId={user.id} />
                </ScrollView>
                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    {
                      backgroundColor:
                        themeController.current?.buttonColorPrimaryDefault,
                      borderRadius: sizes.btnRadius,
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                    },
                    isWebLandscape && {
                      width: '30%',
                      height: scaleByHeight(62, height),
                      alignSelf: isRTL ? 'flex-end' : 'flex-start',
                      marginBottom: sizes.infoSectionMarginBottom,
                    },
                  ]}
                  onPress={() => {
                    chooseUser();
                    setModalVisible(false);
                    setShowContactInfo(false);
                  }}
                >
                  <Text
                    style={{
                      fontSize: sizes.professionSize,
                      color: themeController.current?.buttonTextColorPrimary,
                    }}
                  >
                    {t('providersSection.createRequest')}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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
  avatarPlaceholder: {
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  visitButton: { borderRadius: RFValue(5) },
  modalHeader: {
    alignItems: 'center',
    padding: RFValue(10),
    borderBottomWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'space-between',
  },
  modalTitle: {
    // fontWeight: 'bold',
    color: '#0A62EA',
    fontFamily: 'Rubik-Bold',
  },
  sectionTitle: { marginBottom: RFValue(5) },
  centerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: RFValue(10),
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: RFValue(10),
  },
  professionBadge: {
    backgroundColor: '#eee',
    padding: RFValue(4),
    borderRadius: RFValue(5),
    margin: RFValue(2),
  },
  typeBadge: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: RFValue(6),
    padding: RFValue(4),
    margin: RFValue(2),
  },
  primaryBtn: {
    padding: RFValue(10),
    borderRadius: RFValue(6),
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
  },
});
