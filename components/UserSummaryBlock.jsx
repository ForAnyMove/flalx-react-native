import { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { LICENSES } from '../constants/licenses';
import { useComponentContext } from '../context/globalAppContext';
import { useTranslation } from 'react-i18next';
import { icons } from '../constants/icons';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import CommentsSection from './CommentsSection';
import { useWebView } from '../context/webViewContext';
import { useWindowInfo } from '../context/windowContext';
import { useLocalization } from '../src/services/useLocalization';
import { logError } from '../utils/log_util';

const UserSummaryBlock = ({
  user,
  status = 'store-waiting',
  currentJobId,
  closeAllModal,
}) => {
  const {
    themeController,
    jobsController,
    languageController,
    usersReveal,
    setAppLoading,
  } = useComponentContext();
  const { t } = useTranslation();
  const { openWebView } = useWebView();
  const { tField } = useLocalization(languageController.current);
  const isRTL = languageController?.isRTL;
  const [modalVisible, setModalVisible] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);

  const { width, height } = useWindowDimensions();
  const { sidebarWidth } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && width > height;

  // компактные размеры для веб-альбомной (меньше, чем на мобильном)
  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);
    const scale = isWebLandscape ? web : mobile;

    return {
      font: scale(16),
      smallFont: scale(14),
      sectionTitleSize: scale(18),
      small: scale(14),
      inputFont: isWebLandscape ? height * 0.013 : mobile(10),
      padding: isWebLandscape ? height * 0.009 : mobile(8),
      paddingHorizontal: scale(17),
      margin: isWebLandscape ? height * 0.01 : mobile(10),
      borderRadius: scale(8),
      thumb: isWebLandscape ? height * 0.11 : mobile(80),
      headerHeight: isWebLandscape ? web(50) : height * 0.07,
      headerMargin: isWebLandscape ? web(30) : mobile(5),
      avatar: isWebLandscape ? web(48) : mobile(33),
      icon: scale(24),
      iconSmall: isWebLandscape ? height * 0.025 : mobile(20),
      panelWidth: isWebLandscape ? Math.min(width * 0.55, 720) : undefined,
      cardWidth: '100%',
      logoFont: scale(24),
      containerHeight: scale(80),
      pagePaddingHorizontal: isWebLandscape
        ? scale(24)
        : scaleByHeightMobile(15, height),
      nameSize: scale(28),
      professionSize: scale(20),
      btnRadius: scale(8),
      unlockContactBtnHeight: scale(38),
      unlockContactBtnPaddingHorizontal: scale(24),
      unlockContactBtnFontSize: scale(20),
      iconMargin: scale(7),
      showContactInfoMarginBottom: scale(10),
      modalAvatar: isWebLandscape ? web(112) : mobile(112),
      avatarMarginTop: scale(24),
      avatarMarginBottom: scale(8),
      contactInfoHeight: scale(50),
      badgeHeight: scale(34),
      badgeGap: scale(8),
      badgePaddingHorizontal: scale(12),
      providerInfoGap: scale(8),
      titleMarginBottom: scale(4),
      professionMarginBottom: scale(32),
      infoSectionsContainerMarginBottom: isWebLandscape
        ? 0
        : scaleByHeightMobile(15, height),
      infoSectionsContainerGap: isWebLandscape
        ? 0
        : scaleByHeightMobile(15, height),
      infoSectionMarginBottom: isWebLandscape ? web(23) : mobile(16),
      modalHeaderPaddingTop: isWebLandscape
        ? scaleByHeight(32, height)
        : scaleByHeightMobile(16, height),
      createRequestBtnHeight: isWebLandscape
        ? scaleByHeight(62, height)
        : scaleByHeightMobile(62, height),
      aboutMaxHeight: isWebLandscape ? web(100) : mobile(100),
    };
  }, [isWebLandscape, width, height]);

  const userId = user.id || user?._j?.id;

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
  } = user.id ? user : user._j;

  const handleUserRevealTry = async () => {
    try {
      setAppLoading(true);

      const result = await usersReveal.tryReveal(user.id);
      if (result.paymentUrl) {
        openWebView(result.paymentUrl);
      }

      setAppLoading(false);
    } catch (error) {
      logError('Error revealing user:', error);
    }
  };

  return (
    <>
      {/* Summary Block */}
      <View
        style={[
          styles.summaryContainer,
          // isRTL && { flexDirection: 'row-reverse' },
          {
            height: sizes.containerHeight,
            width: sizes.cardWidth,
            flexDirection: isRTL ? 'row-reverse' : 'row',
            backgroundColor: themeController.current?.formInputBackground,
            borderRadius: sizes.borderRadius,
            paddingHorizontal: sizes.paddingHorizontal,
          },
        ]}
      >
        <View
          style={[
            styles.avatarNameContainer,
            {
              flexDirection: isRTL ? 'row-reverse' : 'row',
              gap: sizes.providerInfoGap,
            },
          ]}
        >
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              style={[
                styles.avatar,
                {
                  width: sizes.avatar,
                  height: sizes.avatar,
                  borderRadius: sizes.avatar / 2,
                },
              ]}
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
            <Text
              style={{
                fontSize: sizes.font,
                color: themeController.current?.textColor,
                fontFamily: 'Rubik-SemiBold',
              }}
            >
              {name} {surname}
            </Text>
            <Text
              style={{
                fontSize: sizes.smallFont,
                color: themeController.current?.unactiveTextColor,
              }}
            >
              {LICENSES[professions?.[0]]}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={[
            {
              // borderRadius: sizes.borderRadius,
            },
          ]}
        >
          <Text
            style={[
              styles.visitButtonText,
              {
                color: themeController.current?.primaryColor,
                fontSize: sizes.font,
              },
            ]}
          >
            {t('userSummary.visit', { defaultValue: 'Visit' })}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Fullscreen Modal (прозрачная, клик по пустой зоне закрывает) */}
      <Modal visible={modalVisible} animationType='slide' transparent>
        {/* клик по фону — закрыть */}
        <TouchableWithoutFeedback
          onPress={() => {
            setModalVisible(false);
            setShowContactInfo(false);
          }}
        >
          <View style={[styles.backdrop]}>
            {/* Контентная панель; клики внутри не закрывают */}
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.panel,
                  {
                    backgroundColor: themeController.current?.backgroundColor,
                    borderTopLeftRadius: sizes.borderRadius,
                    borderBottomLeftRadius: sizes.borderRadius,
                    paddingBottom: sizes.padding,
                    paddingHorizontal: sizes.pagePaddingHorizontal,
                    // Веб-альбомная: узкая панель справа, с пустой кликабельной зоной слева
                    width: isWebLandscape ? width - sidebarWidth : '100%',
                    alignSelf: isRTL ? 'flex-start' : 'flex-end',
                    height: '100%',
                  },
                ]}
              >
                {/* Header */}
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
                  <Image
                    source={
                      avatar
                        ? { uri: avatar }
                        : themeController.current.isTheme
                        ? icons.defaultAvatar
                        : icons.monotoneAvatar
                    }
                    style={[
                      styles.modalAvatar,
                      {
                        width: sizes.modalAvatar,
                        height: sizes.modalAvatar,
                        borderRadius: sizes.modalAvatar / 2,
                        alignSelf: 'center',
                        marginTop: sizes.avatarMarginTop,
                        marginBottom: sizes.avatarMarginBottom,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.modalName,
                      {
                        fontSize: sizes.nameSize,
                        fontFamily: 'Rubik-Bold',
                        textAlign: 'center',
                        color: themeController.current?.textColor,
                        marginBottom: professions?.[0]
                          ? sizes.titleMarginBottom
                          : sizes.professionMarginBottom,
                      },
                    ]}
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
                            {
                              fontSize: sizes.sectionTitleSize,
                              color: themeController.current?.textColor,
                              marginBottom: sizes.infoSectionMarginBottom / 2,
                            },
                          ]}
                        >
                          {t('profile.job_types')}
                        </Text>
                        <View
                          style={[
                            styles.wrapRow,
                            ,
                            { gap: sizes.badgeGap },
                            isRTL && { justifyContent: 'flex-end' },
                          ]}
                        >
                          {professions?.map((p, i) => (
                            <View
                              key={i}
                              style={[
                                styles.typeBadge,
                                {
                                  borderRadius: sizes.borderRadius / 2,
                                  borderColor:
                                    themeController.current
                                      ?.formInputLabelColor,
                                  paddingHorizontal:
                                    sizes.badgePaddingHorizontal,
                                  height: sizes.badgeHeight,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.typeText,
                                  {
                                    fontSize: sizes.small,
                                    color:
                                      themeController.current
                                        ?.formInputLabelColor,
                                  },
                                ]}
                              >
                                {tField(p.job_type, 'name')}
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
                              marginBottom: sizes.infoSectionMarginBottom / 2,
                            },
                          ]}
                        >
                          {t('profile.job_subtypes')}
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
                                {
                                  borderRadius: sizes.borderRadius / 2,
                                  borderColor:
                                    themeController.current
                                      ?.formInputLabelColor,
                                  paddingHorizontal:
                                    sizes.badgePaddingHorizontal,
                                  height: sizes.badgeHeight,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  {
                                    fontSize: sizes.small,
                                    color:
                                      themeController.current
                                        ?.formInputLabelColor,
                                  },
                                ]}
                              >
                                {tField(p.job_subtype, 'name')}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Sub Types */}
                    {/* <Text
                    style={[
                      styles.sectionTitle,
                      {
                        fontSize: isWebLandscape ? height * 0.016 : RFValue(12),
                        marginBottom: sizes.padding * 0.5,
                        textAlign: isRTL ? 'right' : 'left',
                      },
                    ]}
                  >
                    {t('userSummary.subTypesTitle', {
                      defaultValue: 'Sub types of job am I interested',
                    })}
                  </Text>
                  <View
                    style={[
                      styles.wrapRow,
                      {
                        gap: sizes.padding * 0.35,
                        marginBottom: sizes.margin,
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                      },
                    ]}
                  >
                    {jobSubTypes?.map((sub, index) => (
                      <View
                        key={index}
                        style={[
                          styles.typeBadge,
                          {
                            borderRadius: sizes.borderRadius,
                            paddingHorizontal: sizes.padding * 0.75,
                            paddingVertical: sizes.padding * 0.45,
                            margin: sizes.padding * 0.25,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.typeText,
                            {
                              fontSize: isWebLandscape
                                ? height * 0.013
                                : RFValue(10),
                            },
                          ]}
                        >
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
                            marginBottom: sizes.infoSectionMarginBottom / 2,
                          },
                        ]}
                      >
                        {t('profile.about_me')}
                      </Text>
                      <Text
                        style={[
                          {
                            fontSize: sizes.small,
                            color: themeController.current?.unactiveTextColor,
                            maxHeight: sizes.aboutMaxHeight,
                            overflow: 'auto',
                          },
                        ]}
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
                            marginBottom: sizes.infoSectionMarginBottom / 2,
                          },
                        ]}
                      >
                        {t('profile.contact_info', {
                          defaultValue: 'Contact information',
                        })}
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
                            style={[
                              {
                                fontSize: sizes.unlockContactBtnFontSize,
                                color:
                                  themeController.current
                                    ?.buttonTextColorPrimary,
                              },
                            ]}
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
                                style={[
                                  styles.contactInfo,
                                  {
                                    fontSize: sizes.small,
                                    color:
                                      themeController.current
                                        ?.unactiveTextColor,
                                  },
                                ]}
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
                                style={[
                                  {
                                    fontSize: sizes.small,
                                    color:
                                      themeController.current
                                        ?.unactiveTextColor,
                                  },
                                ]}
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

                {status === 'store-waiting' && (
                  <View>
                    {!usersReveal.contains(user.id) && (
                      <Text
                        style={[
                          {
                            color: '#f33',
                            textAlign: 'center',
                            fontSize: sizes.small,
                            marginBottom: sizes.showContactInfoMarginBottom,
                          },
                          isWebLandscape && {
                            textAlign: isRTL ? 'right' : 'left',
                          },
                        ]}
                      >
                        {t('userSummary.openContactHint', {
                          defaultValue:
                            'Open contact information to be able to approve provider',
                        })}
                      </Text>
                    )}
                    <TouchableOpacity
                      style={[
                        styles.primaryBtn,
                        {
                          backgroundColor: usersReveal.contains(user.id)
                            ? themeController.current?.buttonColorPrimaryDefault
                            : themeController.current
                                ?.buttonColorPrimaryDisabled,
                          borderRadius: sizes.borderRadius,
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                          height: sizes.createRequestBtnHeight,
                        },
                        isWebLandscape && {
                          width: '30%',
                          alignSelf: isRTL ? 'flex-end' : 'flex-start',
                          marginBottom: sizes.infoSectionMarginBottom,
                        },
                      ]}
                      onPress={() => {
                        if (usersReveal.contains(user.id)) {
                          setAppLoading(true);
                          jobsController.actions
                            .approveProvider(currentJobId, userId)
                            .then(() => {
                              setModalVisible(false);
                              setShowContactInfo(false);
                              closeAllModal();
                              setAppLoading(false);
                            });
                        }
                      }}
                    >
                      <Text
                        style={[
                          {
                            fontSize: sizes.professionSize,
                            color:
                              themeController.current?.buttonTextColorPrimary,
                          },
                        ]}
                      >
                        {t('userSummary.approve', { defaultValue: 'Approve' })}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* {status === 'store-in-progress' && (
                  <View>
                    <TouchableOpacity
                      style={[
                        styles.primaryBtn,
                        {
                          backgroundColor:
                            themeController.current?.buttonColorPrimaryDefault,
                          borderRadius: sizes.borderRadius,
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                          height: sizes.createRequestBtnHeight,
                        },
                        isWebLandscape && {
                          width: '30%',
                          alignSelf: isRTL ? 'flex-end' : 'flex-start',
                          marginBottom: sizes.infoSectionMarginBottom,
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
                          {
                            fontSize: sizes.professionSize,
                            color:
                              themeController.current?.buttonTextColorPrimary,
                          },
                        ]}
                      >
                        {t('userSummary.removeExecutor', {
                          defaultValue: 'Remove executor',
                        })}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )} */}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

export default UserSummaryBlock;

const styles = StyleSheet.create({
  summaryContainer: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarNameContainer: {
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameText: {
    fontWeight: '500',
  },
  visitButton: {},
  visitButtonText: {
    textDecorationLine: 'underline',
  },
  modalContent: {},
  modalAvatar: {
    alignSelf: 'center',
  },
  modalAvatarPlaceholder: {
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  modalName: {
    textAlign: 'center',
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
  typeText: {
    color: '#444',
  },
  sectionTitle: {
    // fontWeight: '600',
    // color: '#333',
  },
  aboutText: {
    color: '#444',
  },
  contactInfo: {
    color: '#333',
    marginVertical: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontWeight: 'bold',
    color: '#0A62EA',
    fontFamily: 'Rubik-Bold',
  },
  primaryBtn: {
    alignItems: 'center',
  },
  primaryText: {},

  // фон модалки (перехватчик кликов)
  backdrop: {
    flex: 1,
  },
  // панель контента модалки (справа)
  panel: {
    // базовые значения переопределяются динамически через inline-стили
  },
});
