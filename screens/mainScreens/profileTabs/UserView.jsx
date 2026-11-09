import React, { useMemo } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useComponentContext } from '../../../context/globalAppContext';
import { useWindowInfo } from '../../../context/windowContext';
import { useTranslation } from 'react-i18next';
import { icons } from '../../../constants/icons';
import { LICENSES } from '../../../constants/licenses';
import { scaleByHeight, scaleByHeightMobile } from '../../../utils/resizeFuncs';
import { useLocalization } from '../../../src/services/useLocalization';
import { formatPhoneDisplay } from '../../../src/phone/phoneUtils';
import { formatExperience } from '../../../utils/experience_ulit';
import CommentsSection from '../../../components/CommentsSection';

export default function UserView() {
  const { user, themeController, languageController, jobTypesController } =
    useComponentContext();
  const { t } = useTranslation();
  const { tField } = useLocalization(languageController.current);
  const isRTL = languageController?.isRTL;
  const { width, height, isLandscape, effectiveSidebarWidth } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const currentUser = user?.current || {};
  const {
    id: userId,
    avatar,
    name,
    surname,
    about,
    email,
    phoneNumber,
  } = currentUser;

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);
    const scale = isWebLandscape ? web : mobile;

    return {
      font: scale(16),
      smallFont: scale(14),
      sectionTitleSize: scale(18),
      small: scale(14),
      padding: isWebLandscape ? web(16) : mobile(8),
      paddingHorizontal: scale(17),
      margin: isWebLandscape ? height * 0.01 : mobile(10),
      borderRadius: scale(8),
      avatar: isWebLandscape ? web(112) : mobile(112),
      avatarMarginTop: scale(20),
      avatarMarginBottom: scale(8),
      iconSmall: isWebLandscape ? height * 0.025 : mobile(20),
      badgeGap: scale(8),
      nameSize: scale(28),
      professionSize: scale(20),
      titleMarginBottom: scale(4),
      professionMarginBottom: scale(24),
      infoSectionMarginBottom: isWebLandscape ? web(23) : mobile(16),
      aboutMaxHeight: isWebLandscape ? web(100) : mobile(100),
      expBadgePaddingHorizontal: scale(10),
      expBadgePaddingVertical: scale(2),
      expBadgeRadius: scale(4),
      pagePaddingHorizontal: isWebLandscape
        ? scale(24)
        : scaleByHeightMobile(15, height),
      bannerPaddingV: scale(10),
      bannerPaddingH: scale(14),
      bannerMarginBottom: scale(16),
      bannerIconSize: scale(18),
    };
  }, [isWebLandscape, height, width]);

  // Сбор профессий пользователя
  const professionsList = useMemo(() => {
    // 1. Если в user.current.professions уже есть список объектов
    if (Array.isArray(currentUser.professions) && currentUser.professions.length > 0) {
      if (typeof currentUser.professions[0] === 'object' && currentUser.professions[0] !== null) {
        return currentUser.professions;
      }
    }

    // 2. Иначе строим из одобренных запросов в jobTypesController
    const approved = [];
    const list = jobTypesController?.userToUserRequest?.list || [];
    list.forEach((req) => {
      if (req.status === 'approved' || req.is_verified === true) {
        const typeObj = jobTypesController.jobTypesWithSubtypes?.find(
          (jt) => jt.id === req.job_type_id
        );
        const subtypeObj = typeObj?.subtypes?.find(
          (st) => st.id === req.job_subtype_id
        );
        approved.push({
          job_type: typeObj || { name: req.requested_type_name },
          job_subtype: subtypeObj || { name: req.requested_subtype_name },
          years_of_experience:
            req.years_of_experience ??
            req.experience ??
            req.yearsOfExperience ??
            req.years_experience ??
            req.work_experience,
          verified_at: req.verified_at || req.updated_at || req.created_at,
        });
      }
    });

    return approved;
  }, [currentUser.professions, jobTypesController?.userToUserRequest?.list, jobTypesController?.jobTypesWithSubtypes]);

  const primaryProfessionTitle = useMemo(() => {
    if (Array.isArray(currentUser.professions) && currentUser.professions.length > 0) {
      const first = currentUser.professions[0];
      if (typeof first === 'string') {
        return LICENSES[first] || first;
      }
      if (typeof first === 'object' && first !== null) {
        const subtype = tField(first.job_subtype, 'name');
        const type = tField(first.job_type, 'name');
        return subtype || type || '';
      }
    }
    if (professionsList.length > 0) {
      const first = professionsList[0];
      return tField(first.job_subtype, 'name') || tField(first.job_type, 'name') || '';
    }
    return '';
  }, [currentUser.professions, professionsList, tField]);

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: themeController.current?.backgroundColor,
      }}
      contentContainerStyle={{
        paddingHorizontal: sizes.pagePaddingHorizontal,
        paddingBottom: sizes.padding * 4,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: isWebLandscape ? Math.min(width - effectiveSidebarWidth, 720) : '100%',
        }}
      >
        {/* Информационный баннер вверху */}
        <View
          style={{
            flexDirection: isRTL ? 'row-reverse' : 'row',
            alignItems: 'center',
            backgroundColor: `${themeController.current?.primaryColor || '#007AFF'}15`,
            borderColor: `${themeController.current?.primaryColor || '#007AFF'}40`,
            borderWidth: 1,
            borderRadius: sizes.borderRadius,
            paddingVertical: sizes.bannerPaddingV,
            paddingHorizontal: sizes.bannerPaddingH,
            marginTop: sizes.bannerPaddingV,
            marginBottom: sizes.bannerMarginBottom,
            gap: sizes.badgeGap,
          }}
        >
          <Image
            source={icons.eyeOpen}
            style={{
              width: sizes.bannerIconSize,
              height: sizes.bannerIconSize,
              tintColor: themeController.current?.primaryColor,
            }}
            resizeMode="contain"
          />
          <Text
            style={{
              flex: 1,
              fontSize: sizes.smallFont,
              color: themeController.current?.textColor,
              fontFamily: 'Rubik-Medium',
              textAlign: isRTL ? 'right' : 'left',
            }}
          >
            {t('profile.public_view_hint', {
              defaultValue: 'This is how other users see your profile',
            })}
          </Text>
        </View>

        {/* Аватар */}
        <View style={{ alignItems: 'center' }}>
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              style={{
                width: sizes.avatar,
                height: sizes.avatar,
                borderRadius: sizes.avatar / 2,
                marginTop: sizes.avatarMarginTop,
                marginBottom: sizes.avatarMarginBottom,
              }}
            />
          ) : (
            <View
              style={{
                width: sizes.avatar,
                height: sizes.avatar,
                borderRadius: sizes.avatar / 2,
                marginTop: sizes.avatarMarginTop,
                marginBottom: sizes.avatarMarginBottom,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: themeController.current?.formInputBackground,
              }}
            >
              <Image
                source={
                  themeController.current?.isTheme
                    ? icons.defaultAvatar
                    : icons.monotoneAvatar
                }
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: sizes.avatar / 2,
                }}
              />
            </View>
          )}

          {/* Имя и фамилия */}
          <Text
            style={{
              fontSize: sizes.nameSize,
              fontFamily: 'Rubik-Bold',
              textAlign: 'center',
              color: themeController.current?.textColor,
              marginBottom: primaryProfessionTitle ? sizes.titleMarginBottom : sizes.professionMarginBottom,
            }}
          >
            {`${name || ''} ${surname || ''}`.trim() || t('profile.anonymous', { defaultValue: 'User' })}
          </Text>

          {/* Главная профессия/лицензия под именем */}
          {Boolean(primaryProfessionTitle) && (
            <Text
              style={{
                fontSize: sizes.professionSize,
                color: themeController.current?.unactiveTextColor,
                textAlign: 'center',
                marginBottom: sizes.professionMarginBottom,
              }}
            >
              {primaryProfessionTitle}
            </Text>
          )}
        </View>

        {/* Секция профессий с плашками опыта */}
        {professionsList.length > 0 && (
          <View style={{ width: '100%', marginBottom: sizes.infoSectionMarginBottom }}>
            <Text
              style={{
                fontSize: sizes.sectionTitleSize,
                color: themeController.current?.textColor,
                marginBottom: sizes.infoSectionMarginBottom / 2,
                fontFamily: 'Rubik-SemiBold',
                textAlign: isRTL ? 'right' : 'left',
              }}
            >
              {t('profile.professions', { defaultValue: 'Professions' })}
            </Text>
            <View style={{ gap: sizes.badgeGap }}>
              {professionsList.map((p, i) => {
                const typeLabel = tField(p.job_type, 'name');
                const subtypeLabel = tField(p.job_subtype, 'name');
                const rawExp =
                  p.experience ??
                  p.years_of_experience ??
                  p.yearsOfExperience ??
                  p.years_experience ??
                  p.work_experience ??
                  currentUser.years_of_experience ??
                  currentUser.experience;
                const expLabel = formatExperience(
                  rawExp,
                  t,
                  p.verified_at || p.updated_at || p.created_at
                );
                const hasExperience = Boolean(expLabel && expLabel !== '-');

                return (
                  <View
                    key={i}
                    style={{
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                      alignItems: 'center',
                      backgroundColor: themeController.current?.formInputBackground,
                      padding: sizes.padding,
                      borderRadius: sizes.borderRadius,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: sizes.font,
                        color: themeController.current?.textColor,
                        fontFamily: 'Rubik-Medium',
                      }}
                    >
                      {typeLabel}
                    </Text>
                    {Boolean(subtypeLabel) && (
                      <>
                        <Image
                          source={icons.forward}
                          style={{
                            width: sizes.iconSmall,
                            height: sizes.iconSmall,
                            tintColor: themeController.current?.unactiveTextColor,
                            marginHorizontal: sizes.badgeGap,
                            transform: [{ rotate: isRTL ? '180deg' : '0deg' }],
                          }}
                        />
                        <Text
                          style={{
                            fontSize: sizes.font,
                            color: themeController.current?.textColor,
                          }}
                        >
                          {subtypeLabel}
                        </Text>
                      </>
                    )}
                    <View style={{ flex: 1 }} />
                    {hasExperience && (
                      <View
                        style={{
                          backgroundColor: `${themeController.current?.primaryColor || '#007AFF'}1A`,
                          paddingHorizontal: sizes.expBadgePaddingHorizontal,
                          paddingVertical: sizes.expBadgePaddingVertical,
                          borderRadius: sizes.expBadgeRadius,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: sizes.smallFont,
                            color: themeController.current?.primaryColor || '#007AFF',
                            fontFamily: 'Rubik-Medium',
                          }}
                        >
                          {expLabel}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Блок «О себе» */}
        {Boolean(about) && (
          <View style={{ width: '100%', marginBottom: sizes.infoSectionMarginBottom }}>
            <Text
              style={{
                fontSize: sizes.sectionTitleSize,
                color: themeController.current?.textColor,
                marginBottom: sizes.infoSectionMarginBottom / 2,
                fontFamily: 'Rubik-SemiBold',
                textAlign: isRTL ? 'right' : 'left',
              }}
            >
              {t('profile.about_me', { defaultValue: 'A little about me' })}
            </Text>
            <Text
              style={{
                fontSize: sizes.small,
                color: themeController.current?.unactiveTextColor,
                maxHeight: sizes.aboutMaxHeight,
                textAlign: isRTL ? 'right' : 'left',
              }}
            >
              {about}
            </Text>
          </View>
        )}

        {/* Контактная информация */}
        <View style={{ width: '100%', marginBottom: sizes.infoSectionMarginBottom }}>
          <Text
            style={{
              fontSize: sizes.sectionTitleSize,
              color: themeController.current?.textColor,
              marginBottom: sizes.infoSectionMarginBottom / 2,
              fontFamily: 'Rubik-SemiBold',
              textAlign: isRTL ? 'right' : 'left',
            }}
          >
            {t('profile.contact_info', { defaultValue: 'Contact information' })}
          </Text>
          <View
            style={{
              flexDirection: isRTL ? 'row-reverse' : 'row',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: sizes.padding,
            }}
          >
            {Boolean(phoneNumber) && (
              <View
                style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  alignItems: 'center',
                }}
              >
                <Image
                  source={icons.mobile}
                  style={{
                    width: sizes.iconSmall,
                    height: sizes.iconSmall,
                    [isRTL ? 'marginLeft' : 'marginRight']: sizes.badgeGap,
                    tintColor: themeController.current?.primaryColor,
                  }}
                />
                <Text
                  style={{
                    fontSize: sizes.small,
                    color: themeController.current?.textColor,
                  }}
                >
                  {formatPhoneDisplay(phoneNumber)}
                </Text>
              </View>
            )}
            {Boolean(email) && (
              <View
                style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  alignItems: 'center',
                }}
              >
                <Image
                  source={icons.emailContact}
                  style={{
                    width: sizes.iconSmall,
                    height: sizes.iconSmall,
                    [isRTL ? 'marginLeft' : 'marginRight']: sizes.badgeGap,
                    tintColor: themeController.current?.primaryColor,
                  }}
                />
                <Text
                  style={{
                    fontSize: sizes.small,
                    color: themeController.current?.textColor,
                  }}
                >
                  {email}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Разделитель перед комментариями */}
        <View
          style={{
            height: 1,
            backgroundColor: themeController.current?.profileDefaultBackground,
            marginVertical: sizes.infoSectionMarginBottom,
            width: '100%',
          }}
        />

        {/* Секция отзывов и рейтинга */}
        {Boolean(userId) && (
          <View style={{ width: '100%' }}>
            <CommentsSection userId={userId} allowAdd={false} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

