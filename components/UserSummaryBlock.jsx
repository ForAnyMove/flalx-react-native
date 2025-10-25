import { useState } from 'react';
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
} from 'react-native';
import { RFValue, RFPercentage } from 'react-native-responsive-fontsize';
import { JOB_SUB_TYPES } from '../constants/jobSubTypes';
import { JOB_TYPES } from '../constants/jobTypes';
import { LICENSES } from '../constants/licenses';
import { useComponentContext } from '../context/globalAppContext';
import { useWindowInfo } from '../context/windowContext';
import { useTranslation } from 'react-i18next';
import { icons } from '../constants/icons';
import { scaleByHeight } from '../utils/resizeFuncs';
import CommentsSection from './CommentsSection';

const UserSummaryBlock = ({
  user,
  status = 'store-waiting',
  currentJobId,
  closeAllModal,
}) => {
  const { themeController, jobsController, languageController } =
    useComponentContext();
  const { t } = useTranslation();
  const isRTL = languageController?.isRTL;
  const [modalVisible, setModalVisible] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);

  const { width, height, isLandscape, sidebarWidth } = useWindowInfo?.() || {
    width: 1280,
    height: 800,
    isLandscape: false,
    sidebarWidth: 0,
  };
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  // компактные размеры для веб-альбомной (меньше, чем на мобильном)
  const sizes = {
    font: isWebLandscape ? scaleByHeight(16, height) : RFValue(12),
    smallFont: isWebLandscape ? scaleByHeight(14, height) : RFValue(10),
    inputFont: isWebLandscape ? height * 0.013 : RFValue(10),
    padding: isWebLandscape ? height * 0.009 : RFValue(8),
    paddingHorizontal: isWebLandscape ? scaleByHeight(17, height) : RFValue(12),
    margin: isWebLandscape ? height * 0.01 : RFValue(10),
    borderRadius: isWebLandscape ? scaleByHeight(8, height) : RFValue(5),
    thumb: isWebLandscape ? height * 0.11 : RFValue(80),
    headerHeight: isWebLandscape ? scaleByHeight(50, height) : RFPercentage(7),
    avatar: isWebLandscape ? scaleByHeight(48, height) : RFValue(33),
    icon: isWebLandscape ? scaleByHeight(24, height) : RFValue(24),
    iconSmall: isWebLandscape ? height * 0.025 : RFValue(20),
    panelWidth: isWebLandscape ? Math.min(width * 0.55, 720) : undefined, // ширина панели модалки на вебе
    cardWidth: isWebLandscape ? '100%' : '100%', // 👈 3 в ряд для web-landscape
    logoFont: isWebLandscape ? scaleByHeight(24, height) : RFValue(18),
    containerHeight: isWebLandscape ? scaleByHeight(80, height) : RFValue(70),
    pagePaddingHorizontal: isWebLandscape
      ? scaleByHeight(24, height)
      : RFValue(15),
    nameSize: isWebLandscape ? scaleByHeight(28, height) : RFValue(14),
    professionSize: isWebLandscape ? scaleByHeight(20, height) : RFValue(12),
    infoSectionMarginBottom: isWebLandscape
      ? scaleByHeight(23, height)
      : RFValue(15),
    btnRadius: isWebLandscape ? scaleByHeight(8, height) : RFValue(6),
    unlockContactBtnHeight: isWebLandscape
      ? scaleByHeight(38, height)
      : RFValue(40),
    unlockContactBtnPaddingHorizontal: isWebLandscape
      ? scaleByHeight(24, height)
      : RFValue(15),
    iconMargin: isWebLandscape ? scaleByHeight(7, height) : RFValue(3),
    showContactInfoMarginBottom: isWebLandscape
      ? scaleByHeight(10, height)
      : RFValue(5),
    modalAvatar: isWebLandscape ? scaleByHeight(112, height) : RFValue(70),
    avatarVerticalMargin: isWebLandscape ? scaleByHeight(12, height) : RFValue(8),
    contactInfoHeight: isWebLandscape
      ? scaleByHeight(50, height)
      : RFValue(30),
  };

  const userId = user.id || user?._j?.id;

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
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
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
                source={icons.defaultAvatar}
                style={{ width: '100%', height: '100%' }}
              />
            </View>
          )}
          <View>
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
            <Text
              style={{
                fontSize: sizes.smallFont,
                fontWeight: '600', // 👈 вернул жирность
                color: themeController.current?.unactiveTextColor,
                marginHorizontal: RFValue(8),
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
                    source={avatar ? { uri: avatar } : icons.defaultAvatar}
                    style={[
                      styles.modalAvatar,
                      {
                        width: sizes.modalAvatar,
                        height: sizes.modalAvatar,
                        borderRadius: sizes.modalAvatar / 2,
                        alignSelf: 'center',
                        marginVertical: sizes.avatarVerticalMargin,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.modalName,
                      {
                        fontSize: sizes.nameSize,
                        fontWeight: '600',
                        textAlign: 'center',
                        marginBottom: RFValue(6),
                        color: themeController.current?.textColor,
                      },
                    ]}
                  >
                    {name} {surname}
                  </Text>
                  <Text
                    style={{
                      fontSize: sizes.professionSize,
                      fontWeight: '600',
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
                    {jobTypes && (
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
                        <View style={[styles.wrapRow]}>
                          {jobTypes?.map((type, index) => (
                            <View
                              key={index}
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
                                {JOB_TYPES[type]}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                    {/* Professions */}
                    {professions && (
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
                        <View style={[styles.centerRow]}>
                          {professions?.map((p, index) => (
                            <View
                              key={index}
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
                                style={[
                                  styles.professionText,
                                  {
                                    fontSize: sizes.small,
                                    color:
                                      themeController.current
                                        ?.formInputLabelColor,
                                  },
                                ]}
                              >
                                {LICENSES[p]}
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
                          },
                        ]}
                      >
                        {t('userSummary.contactTitle', {
                          defaultValue: 'Contact information',
                        })}
                      </Text>
                      {!showContactInfo && status === 'store-waiting' ? (
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
                          onPress={() => setShowContactInfo(true)}
                        >
                          <Text
                            style={[
                              {
                                fontSize: sizes.professionSize,
                                color:
                                  themeController.current
                                    ?.buttonTextColorPrimary,
                              },
                            ]}
                          >
                            {t('userSummary.openContactCta', {
                              defaultValue:
                                'Open contact information for {{price}}',
                              price: '1.50$',
                            })}
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
                    {!showContactInfo && (
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
                          backgroundColor: showContactInfo
                            ? themeController.current?.buttonColorPrimaryDefault
                            : themeController.current
                                ?.buttonColorPrimaryDisabled,
                          borderRadius: sizes.borderRadius,
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

                {status === 'store-in-progress' && (
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
                        },
                        isWebLandscape && {
                          width: '30%',
                          height: scaleByHeight(62, height),
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
                )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    textDecorationLine: 'underline',
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
    fontWeight: 'bold',
    color: '#0A62EA',
    fontFamily: 'Rubik-Bold',
  },
  primaryBtn: {
    padding: RFValue(12),
    // marginHorizontal: RFValue(12),
    borderRadius: RFValue(6),
    alignItems: 'center',
    // marginVertical: RFValue(5),
  },
  primaryText: {
    fontSize: RFValue(12),
    fontWeight: 'bold',
  },

  // фон модалки (перехватчик кликов)
  backdrop: {
    flex: 1,
  },
  // панель контента модалки (справа)
  panel: {
    // базовые значения переопределяются динамически через inline-стили
  },
});
