import { useEffect, useMemo, useState } from 'react';
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
  useWindowDimensions,
} from 'react-native';
// import { RFValue } from 'react-native-responsive-fontsize';
import { useComponentContext } from '../context/globalAppContext';
import { JOB_TYPES } from '../constants/jobTypes';
import { LICENSES } from '../constants/licenses';
import { icons } from '../constants/icons';
import { useWindowInfo } from '../context/windowContext';
import { useTranslation } from 'react-i18next';
import CommentsSection from './CommentsSection';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import { useWebView } from '../context/webViewContext';
import { useLocalization } from '../src/services/useLocalization';
import SubscriptionsModal from './SubscriptionsModal';
import { useNotification } from '../src/render';
import { formatCurrency } from '../utils/currency_formatter';

const ProviderSummaryBlock = ({ user, chooseUser }) => {
  const { t } = useTranslation();
  const {
    themeController,
    languageController,
    usersReveal,
    setAppLoading,
    providersManager,
    user: currentUser,
    couponsManagerController
  } = useComponentContext();
  const { tField } = useLocalization(languageController.current);
  const { openWebView } = useWebView();
  const { showWarning } = useNotification();
  const { height, isLandscape, width, sidebarWidth } = useWindowInfo();
  const isRTL = languageController.isRTL;

  const [modalVisible, setModalVisible] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [plansModalVisible, setPlansModalVisible] = useState(false);

  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const sizes = useMemo(
    () => ({
      font: isWebLandscape
        ? scaleByHeight(16, height)
        : scaleByHeightMobile(14, height),
      smallFont: isWebLandscape
        ? scaleByHeight(14, height)
        : scaleByHeightMobile(12, height),
      sectionTitleSize: isWebLandscape
        ? scaleByHeight(18, height)
        : scaleByHeightMobile(14, height),
      small: isWebLandscape
        ? scaleByHeight(14, height)
        : scaleByHeightMobile(10, height),
      avatar: isWebLandscape
        ? scaleByHeight(48, height)
        : scaleByHeightMobile(33, height),
      modalAvatar: isWebLandscape
        ? scaleByHeight(112, height)
        : scaleByHeightMobile(75, height),
      icon: isWebLandscape
        ? scaleByHeight(24, height)
        : scaleByHeightMobile(28, height),
      padding: isWebLandscape ? height * 0.01 : scaleByHeightMobile(10, height),
      paddingHorizontal: isWebLandscape
        ? scaleByHeight(17, height)
        : scaleByHeightMobile(12, height),
      cardWidth: isWebLandscape ? '32%' : '100%', // 👈 3 в ряд для web-landscape
      borderRadius: isWebLandscape
        ? scaleByHeight(8, height)
        : scaleByHeightMobile(5, height),
      containerHeight: isWebLandscape
        ? scaleByHeight(80, height)
        : scaleByHeightMobile(70, height),
      containerWidth: isWebLandscape ? '32%' : '100%',
      logoFont: isWebLandscape
        ? scaleByHeight(24, height)
        : scaleByHeightMobile(18, height),
      pagePaddingHorizontal: isWebLandscape
        ? scaleByHeight(24, height)
        : scaleByHeightMobile(15, height),
      modalHeaderPadding: isWebLandscape
        ? scaleByHeight(7, height)
        : scaleByHeightMobile(10, height),
      modalHeaderPaddingTop: isWebLandscape
        ? scaleByHeight(32, height)
        : scaleByHeightMobile(5, height),
      avatarMarginTop: isWebLandscape
        ? scaleByHeight(24, height)
        : scaleByHeightMobile(8, height),
      avatarMarginBottom: isWebLandscape
        ? scaleByHeight(8, height)
        : scaleByHeightMobile(8, height),
      nameSize: isWebLandscape
        ? scaleByHeight(28, height)
        : scaleByHeightMobile(14, height),
      professionSize: isWebLandscape
        ? scaleByHeight(20, height)
        : scaleByHeightMobile(12, height),
      unlockContactBtnHeight: isWebLandscape
        ? scaleByHeight(38, height)
        : scaleByHeightMobile(35, height),
      btnRadius: isWebLandscape
        ? scaleByHeight(8, height)
        : scaleByHeightMobile(6, height),
      infoSectionMarginBottom: isWebLandscape
        ? scaleByHeight(23, height)
        : scaleByHeightMobile(15, height),
      unlockContactBtnPaddingHorizontal: isWebLandscape
        ? scaleByHeight(24, height)
        : scaleByHeightMobile(15, height),
      iconMargin: isWebLandscape
        ? scaleByHeight(7, height)
        : scaleByHeightMobile(3, height),
      headerHeight: isWebLandscape ? scaleByHeight(50, height) : height * 0.07,
      headerMargin: isWebLandscape
        ? scaleByHeight(30, height)
        : scaleByHeightMobile(5, height),
      contactInfoHeight: isWebLandscape
        ? scaleByHeight(50, height)
        : scaleByHeightMobile(30, height),
      badgeHeight: isWebLandscape
        ? scaleByHeight(34, height)
        : scaleByHeightMobile(20, height),
      badgeGap: isWebLandscape
        ? scaleByHeight(8, height)
        : scaleByHeightMobile(6, height),
      badgePaddingHorizontal: isWebLandscape
        ? scaleByHeight(12, height)
        : scaleByHeightMobile(10, height),
      providerInfoGap: isWebLandscape
        ? scaleByHeight(8, height)
        : scaleByHeightMobile(10, height),
      titleMarginBottom: isWebLandscape
        ? scaleByHeight(4, height)
        : scaleByHeightMobile(2, height),
      professionMarginBottom: isWebLandscape
        ? scaleByHeight(32, height)
        : scaleByHeightMobile(20, height),
      infoSectionsContainerMarginBottom: isWebLandscape
        ? 0
        : scaleByHeightMobile(15, height),
      infoSectionsContainerGap: isWebLandscape
        ? 0
        : scaleByHeightMobile(15, height),
      createRequestBtnHeight: isWebLandscape
        ? scaleByHeight(62, height)
        : scaleByHeightMobile(45, height),
      createRequestBtnFontSize: isWebLandscape
        ? scaleByHeight(20, height)
        : scaleByHeightMobile(16, height),
      mobileBottomContainerPaddingVertical: scaleByHeightMobile(16, height),
      containerPaddingHorizontal: isWebLandscape
        ? scaleByHeight(20, height)
        : scaleByHeightMobile(14, height),
      modalRadius: isWebLandscape
        ? scaleByHeight(8, height)
        : scaleByHeightMobile(5, height),
      modalPadding: isWebLandscape
        ? scaleByHeight(45, height)
        : scaleByHeightMobile(12, height),
      modalCardW: isWebLandscape ? scaleByHeight(450, height) : '88%',
      modalCrossTopRightPos: isWebLandscape
        ? scaleByHeight(7, height)
        : scaleByHeightMobile(10, height),
      iconSize: isWebLandscape
        ? scaleByHeight(24, height)
        : scaleByHeightMobile(20, height),
      modalTitle: isWebLandscape
        ? scaleByHeight(24, height)
        : scaleByHeightMobile(16, height),
      modalTitleMarginBottom: isWebLandscape
        ? scaleByHeight(22, height)
        : scaleByHeightMobile(10, height),
      modalSub: isWebLandscape
        ? scaleByHeight(20, height)
        : scaleByHeightMobile(12, height),
      chipMarginBottom: isWebLandscape
        ? scaleByHeight(40 / 3, height)
        : scaleByHeightMobile(12 / 3, height),
      chipFont: isWebLandscape
        ? scaleByHeight(14, height)
        : scaleByHeightMobile(12, height),
      btnH: isWebLandscape
        ? scaleByHeight(62, height)
        : scaleByHeightMobile(42, height),
      btnW: isWebLandscape ? scaleByHeight(300, height) : '100%',
      btnMB: isWebLandscape
        ? scaleByHeight(16, height)
        : scaleByHeightMobile(16, height),
    }),
    [isWebLandscape, height]
  );

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        summaryContainer: {
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          padding: sizes.padding,
          paddingHorizontal: sizes.paddingHorizontal,
          flexDirection: isRTL ? 'row-reverse' : 'row',
          backgroundColor: themeController.current?.formInputBackground,
          borderRadius: sizes.borderRadius,
        },
        avatarNameContainer: {
          alignItems: 'center',
          flexDirection: isRTL ? 'row-reverse' : 'row',
          gap: sizes.providerInfoGap,
        },
        avatar: {
          width: sizes.avatar,
          height: sizes.avatar,
          borderRadius: sizes.avatar / 2,
          backgroundColor: '#ddd',
          justifyContent: 'center',
          alignItems: 'center',
        },
        avatarPlaceholder: {
          width: sizes.avatar,
          height: sizes.avatar,
          borderRadius: sizes.avatar / 2,
          backgroundColor: '#ddd',
          justifyContent: 'center',
          alignItems: 'center',
        },
        nameText: {
          fontSize: sizes.font,
          color: themeController.current?.textColor,
          fontFamily: 'Rubik-SemiBold',
        },
        professionText: {
          fontSize: sizes.smallFont,
          color: themeController.current?.unactiveTextColor,
        },
        visitButton: {
          height: sizes.containerHeight,
          width: sizes.cardWidth,
          borderRadius: sizes.borderRadius,
        },
        modalHeader: {
          alignItems: 'center',
          borderBottomWidth: 2,
          justifyContent: 'space-between',
          flexDirection: isRTL ? 'row-reverse' : 'row',
          paddingHorizontal: sizes.modalHeaderPadding,
          paddingVertical: sizes.modalHeaderPaddingTop,
          backgroundColor: themeController.current?.backgroundColor,
          borderBottomColor: themeController.current?.profileDefaultBackground,
          height: sizes.headerHeight,
          marginTop: sizes.headerMargin,
        },
        modalTitle: {
          color: themeController.current?.primaryColor,
          fontFamily: 'Rubik-Bold',
          fontSize: sizes.logoFont,
        },
        sectionTitle: {
          marginBottom: sizes.infoSectionMarginBottom / 4,
          fontSize: sizes.sectionTitleSize,
          color: themeController.current?.textColor,
        },
        typeBadge: {
          borderWidth: 1,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: sizes.borderRadius / 2,
          borderColor: themeController.current?.formInputLabelColor,
          paddingHorizontal: sizes.badgePaddingHorizontal,
          height: sizes.badgeHeight,
        },
        badgeText: {
          fontSize: sizes.small,
          color: themeController.current?.formInputLabelColor,
        },
        primaryBtn: {
          alignItems: 'center',
          backgroundColor: themeController.current?.buttonColorPrimaryDefault,
          borderRadius: sizes.btnRadius,
          justifyContent: 'center',
          height: sizes.createRequestBtnHeight,
        },
      }),
    [sizes, themeController, isRTL]
  );

  const {
    avatar,
    name,
    surname,
    professions,
    experience,
    jobTypes,
    jobSubTypes,
    about,
    email,
    phoneNumber,
  } = user;

  const handleUserRevealTry = async (useCoupon = false) => {
    try {
      setAppLoading(true);

      const result = await usersReveal.tryReveal(user.id, useCoupon);
      if (result.paymentUrl) {
        openWebView(result.paymentUrl);
      } else if (result.user) {
        providersManager.appendUserData(user.id, result.user.email, result.user.phoneNumber);
      }

      setAppLoading(false);
      setPurchaseModalVisible(false);
    } catch (error) {
      console.log(error.response);

      if (error.response && error.response.status === 400 && error.response.data.code == 'NO_COUPONS_AVAILABLE') {
        setAppLoading(false);
        showWarning(t('showJob.errors.noCouponsAvailable', {
          defaultValue: 'No coupons available to use for this job.',
        }));
      }
      else {
        setAppLoading(false);
        setPurchaseModalVisible(false);
      }
    }
  };

  return (
    <>
      {/* Summary Block */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={[styles.visitButton, dynamicStyles.visitButton]}
      >
        <View style={dynamicStyles.summaryContainer}>
          <View style={dynamicStyles.avatarNameContainer}>
            {avatar ? (
              <Image
                source={{ uri: avatar }}
                style={[styles.avatar, dynamicStyles.avatar]}
              />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  dynamicStyles.avatarPlaceholder,
                ]}
              >
                <Image
                  source={
                    themeController.current.isTheme
                      ? icons.defaultAvatar
                      : icons.monotoneAvatar
                  }
                  style={{ width: '100%', height: '100%' }}
                />
              </View>
            )}
            <View>
              <Text style={dynamicStyles.nameText}>
                {name} {surname}
              </Text>
              <Text style={dynamicStyles.professionText}>
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
                <View style={[styles.modalHeader, dynamicStyles.modalHeader]}>
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
                  <Text style={[styles.modalTitle, dynamicStyles.modalTitle]}>
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
                        marginTop: sizes.avatarMarginTop,
                        marginBottom: sizes.avatarMarginBottom,
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
                          marginTop: sizes.avatarMarginTop,
                          marginBottom: sizes.avatarMarginBottom,
                        },
                      ]}
                    >
                      <Image
                        source={
                          themeController.current.isTheme
                            ? icons.defaultAvatar
                            : icons.monotoneAvatar
                        }
                        style={{ width: '100%', height: '100%' }}
                      />
                    </View>
                  )}
                  <Text
                    style={{
                      fontSize: sizes.nameSize,
                      textAlign: 'center',
                      fontFamily: 'Rubik-Bold',
                      color: themeController.current?.textColor,
                      marginBottom: professions?.[0]
                        ? sizes.titleMarginBottom
                        : sizes.professionMarginBottom,
                    }}
                  >
                    {name} {surname}
                  </Text>
                  {professions?.[0] && (
                    <Text
                      style={{
                        fontSize: sizes.professionSize,
                        color: themeController.current?.unactiveTextColor,
                        textAlign: 'center',
                        marginBottom: sizes.professionMarginBottom,
                      }}
                    >
                      {LICENSES[professions?.[0]]}
                    </Text>
                  )}

                  {/* Контейнер для сетки 2x2 */}
                  <View
                    style={[
                      {
                        marginBottom: sizes.infoSectionsContainerMarginBottom,
                        gap: sizes.infoSectionsContainerGap,
                      },
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
                            dynamicStyles.sectionTitle,
                          ]}
                        >
                          {t('profile.job_types')}
                        </Text>
                        <View
                          style={[
                            styles.wrapRow,
                            { gap: sizes.badgeGap },
                            isRTL && { justifyContent: 'flex-end' },
                          ]}
                        >
                          {professions?.map((p, i) => (
                            <View
                              key={i}
                              style={[
                                styles.typeBadge,
                                dynamicStyles.typeBadge,
                              ]}
                            >
                              <Text style={dynamicStyles.badgeText}>
                                {tField(p.job_type, 'name')}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

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
                            dynamicStyles.sectionTitle,
                          ]}
                        >
                          {t('profile.job_subtypes')}
                        </Text>
                        <View
                          style={[
                            styles.wrapRow,
                            { gap: sizes.badgeGap },
                            isRTL && { justifyContent: 'flex-end' },
                          ]}
                        >
                          {professions?.map((p, i) => (
                            <View
                              key={i}
                              style={[
                                styles.typeBadge,
                                dynamicStyles.typeBadge,
                              ]}
                            >
                              <Text style={dynamicStyles.badgeText}>
                                {tField(p.job_subtype, 'name')}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Professions */}
                    {/* {professions && professions?.length > 0 && (
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
                            dynamicStyles.sectionTitle,
                          ]}
                        >
                          {t('profile.professions')}
                        </Text>
                        <View
                          style={[
                            styles.centerRow,
                            { gap: sizes.badgeGap },
                            isRTL && { justifyContent: 'flex-end' },
                          ]}
                        >
                          {professions?.map((p, i) => (
                            <View
                              key={i}
                              style={[
                                styles.professionBadge,
                                dynamicStyles.typeBadge,
                              ]}
                            >
                              <Text style={dynamicStyles.badgeText}>
                                {tField(p.job_subtype, 'name')}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )} */}

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
                          dynamicStyles.sectionTitle,
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
                          dynamicStyles.sectionTitle,
                        ]}
                      >
                        {t('profile.contact_info')}
                      </Text>
                      {!usersReveal.contains(user.id) ? (
                        <TouchableOpacity
                          style={[
                            styles.primaryBtn,
                            dynamicStyles.primaryBtn,
                            {
                              height: sizes.unlockContactBtnHeight,
                              width: 'max-content',
                              alignSelf: isRTL ? 'flex-end' : 'flex-start',
                              paddingHorizontal:
                                sizes.unlockContactBtnPaddingHorizontal,
                            },
                          ]}
                          onPress={() => setPurchaseModalVisible(true)}
                        >
                          <Text
                            style={{
                              fontSize: sizes.professionSize,
                              color:
                                themeController.current?.buttonTextColorPrimary,
                            }}
                          >
                            {t('common.purchase')}
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
                {isWebLandscape ? (
                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      dynamicStyles.primaryBtn,
                      {
                        padding: 0,
                      },
                      isWebLandscape && {
                        width: '30%',
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
                        fontSize: sizes.createRequestBtnFontSize,
                        color: themeController.current?.buttonTextColorPrimary,
                      }}
                    >
                      {t('providersSection.createRequest')}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View
                    style={[
                      styles.bottomButtonWrapper,
                      {
                        width: width,
                        backgroundColor:
                          themeController.current?.backgroundColor,
                        paddingHorizontal: sizes.containerPaddingHorizontal,
                        paddingVertical:
                          sizes.mobileBottomContainerPaddingVertical,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -6 },
                        shadowOpacity: 0.12,
                        shadowRadius: 8,
                        elevation: 16,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.primaryBtn,
                        dynamicStyles.primaryBtn,
                        {
                          padding: 0,
                        },
                        isWebLandscape && {
                          width: '30%',
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
                          fontSize: sizes.createRequestBtnFontSize,
                          color:
                            themeController.current?.buttonTextColorPrimary,
                        }}
                      >
                        {t('providersSection.createRequest')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>

        {/* OPEN CONTACT PURCHASE MODAL */}
        <Modal visible={purchaseModalVisible} animationType='fade' transparent>
          {/* кликабельная подложка с отступом под сайдбар на web-landscape */}
          <View
            style={[
              styles.backdrop,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            {/* рабочая область — центрируем карточку */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setPurchaseModalVisible(false)}
              style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
            >
              <View
                style={[
                  styles.centerArea,
                  // { width: isWebLandscape ? width - sidebarWidth : '100%' },
                  { width: '100%' },
                ]}
              >
                {/* сама карточка; клики внутри НЕ закрывают */}
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={(e) => e.stopPropagation()}
                  style={[
                    styles.modalCard,
                    {
                      backgroundColor: themeController.current?.backgroundColor,
                      borderRadius: sizes.modalRadius,
                      padding: sizes.modalPadding,
                      width: sizes.modalCardW,
                      position: 'relative',
                      alignItems: 'center',
                    },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => setPurchaseModalVisible(false)}
                    style={{
                      position: 'absolute',
                      top: sizes.modalCrossTopRightPos,
                      right: sizes.modalCrossTopRightPos,
                    }}
                  >
                    <Image
                      source={icons.cross}
                      style={{
                        width: sizes.iconSize,
                        height: sizes.iconSize,
                        tintColor: themeController.current?.textColor,
                      }}
                      resizeMode='contain'
                    />
                  </TouchableOpacity>
                  {/* заголовок */}
                  <Text
                    style={{
                      fontSize: sizes.modalTitle,
                      fontFamily: 'Rubik-Bold',
                      color: themeController.current?.textColor,
                      textAlign: 'center',
                      marginBottom: sizes.modalTitleMarginBottom,
                    }}
                  >
                    {t('providerSection.modalContactPopupTitle', {
                      defaultValue:
                        'Select a method for receiving information about this contact',
                    })}
                  </Text>

                  {/* кнопка подтверждения с ценой */}
                  <TouchableOpacity
                    onPress={() => handleUserRevealTry(false)}
                    style={{
                      height: sizes.btnH,
                      width: sizes.btnW,
                      borderRadius: sizes.modalRadius,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor:
                        themeController.current?.buttonColorPrimaryDefault,
                      marginBottom: sizes.btnMB,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: sizes.modalSub,
                        color:
                          themeController.current?.buttonColorPrimaryDefault,
                      }}
                    >
                      {t('showJob.buttons.buyForPrice', {
                        defaultValue: 'Buy for {{price}}',
                        price: formatCurrency(usersReveal.product.price, usersReveal.product.currency),
                      })}
                    </Text>
                  </TouchableOpacity>

                  {/* кнопка подтверждения с купонами */}
                  <TouchableOpacity
                    onPress={() => handleUserRevealTry(true)}
                    style={{
                      height: sizes.btnH,
                      width: sizes.btnW,
                      borderRadius: sizes.modalRadius,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor:
                        themeController.current?.buttonColorSecondaryDefault,
                      marginBottom: sizes.btnMB,
                      justifyContent: 'center',
                      alignItems: 'center',
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: sizes.modalSub,
                        color:
                          themeController.current?.buttonColorSecondaryDefault,
                      }}
                    >
                      {t('showJob.buttons.buyForCoupons', {
                        defaultValue: 'Buy for 1',
                        count: 1,
                      })}
                    </Text>
                    <Image
                      source={icons.coupon}
                      style={{
                        width: sizes.iconSize,
                        height: sizes.iconSize,
                        tintColor:
                          themeController.current?.buttonColorSecondaryDefault,
                      }}
                    />
                    <Text
                      style={[
                        {
                          color:
                            themeController.current
                              ?.buttonColorSecondaryDefault,
                          fontSize: sizes.modalSub,
                        },
                      ]}
                    >
                      {` (${couponsManagerController.balance || 0})`}
                    </Text>
                  </TouchableOpacity>

                  {/* кнопка тарифов */}
                  {/* {subscription.current == null && */}
                  {true && (
                    <TouchableOpacity
                      onPress={() => {
                        setPlansModalVisible(true);
                        setPurchaseModalVisible(false);
                      }}
                      style={{
                        height: sizes.btnH,
                        width: sizes.btnW,
                        borderRadius: sizes.modalRadius,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor:
                          themeController.current?.buttonColorPrimaryDefault,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: sizes.modalSub,
                          color:
                            themeController.current?.buttonTextColorPrimary,
                        }}
                      >
                        {t('newJob.statusModal.buttons.viewPlans', {
                          defaultValue: 'See pricing plans',
                        })}
                      </Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </Modal>

        {/* PLANS MODAL (простая заглушка, такой же фон/центрирование) */}
        <SubscriptionsModal
          visible={plansModalVisible}
          main={false}
          closeModal={() => {
            setPlansModalVisible(false);
            setPurchaseModalVisible(true);
          }}
        />
      </Modal>
    </>
  );
};

export default ProviderSummaryBlock;

const styles = StyleSheet.create({
  summaryContainer: {
    // justifyContent: 'space-between',
    // alignItems: 'center',
  },
  avatarNameContainer: { alignItems: 'center' },
  avatar: {
    // backgroundColor: '#ddd',
    // justifyContent: 'center',
    // alignItems: 'center',
  },
  avatarPlaceholder: {
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  visitButton: {
    // borderRadius: RFValue(5)
  },
  modalHeader: {
    // alignItems: 'center',
    // padding: RFValue(10),
    // borderBottomWidth: 1,
    // borderColor: '#ccc',
    // justifyContent: 'space-between',
  },
  modalTitle: {
    // fontWeight: 'bold',
    // color: '#0A62EA',
    fontFamily: 'Rubik-Bold',
  },
  sectionTitle: {
    // marginBottom: RFValue(5)
  },
  centerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  professionBadge: {
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtn: {
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
  },
  bottomButtonWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  modalCard: {
    // цвета/радиусы/паддинги задаём из sizes в JSX
    shadowColor: '#000',
    shadowOpacity: 0.15,
    elevation: 8,
  },
  chip: {
    // базовые параметры, динамика — в JSX
    boxSizing: 'border-box',
  },
});
