import React, { useMemo, useState, useCallback } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';
import SearchPanel from '../../../../components/SearchPanel';
import {
  BASE_DESIGN_HEIGHT,
  scaleByHeight,
  scaleByHeightMobile,
} from '../../../../utils/resizeFuncs';
import { useWindowInfo } from '../../../../context/windowContext';
import { useComponentContext } from '../../../../context/globalAppContext';
import RegisterProfessionModal from '../../../../components/RegisterProfessionModal';
import { icons } from '../../../../constants/icons';
import UniversalProfessionComponent from '../../../../components/ui/UniversalProfessionComponent';
import { PROFESSION_TYPES } from '../../../../constants/enums';
import { useTranslation } from 'react-i18next';

const SystemProfessions = ({ openSystemRegistration }) => {
  const [searchValue, setSearchValue] = useState('');
  const { height, isLandscape } = useWindowInfo();
  const isWebLandscape = isLandscape && Platform.OS === 'web';
  const { themeController, languageController, jobTypesController } = useComponentContext();
  const isRTL = languageController.isRTL;
  const { t } = useTranslation();

  const formattedUserRequests = useMemo(() => {
    const requests = [];
    jobTypesController.userToSystemRequest.list.forEach((request) => {
      const reuqestObject = {
        title: request.final_type_name || request.requested_type_name,
        subtitle: request.final_subtype_name || request.requested_subtype_name,
        type: (() => {
          switch (request.status) {
            case "pending":
              return PROFESSION_TYPES.PENDING;
            case "approved":
              return PROFESSION_TYPES.VERIFIED;
            case "rejected":
              return PROFESSION_TYPES.REJECTED;
            default:
              return '';
          }
        })()
      };

      if (request.rejection_reason != null && request.rejection_reason.length > 0) {
        reuqestObject.extra = {
          comment: {
            title: 'Rejection reason:',
            content: request.rejection_reason,
          },
        };
      }

      const userProfessionType = (() => {
        switch (request.user_profession_status) {
          case "pending":
            return PROFESSION_TYPES.PENDING;
          case "approved":
            return PROFESSION_TYPES.VERIFIED;
          case "rejected":
            return PROFESSION_TYPES.REJECTED;
          default:
            return null;
        }
      })();

      if (userProfessionType) {
        reuqestObject.extra = {
          ...reuqestObject.extra,
          userProfession: {
            type: userProfessionType,
            label: t('professions.request_status.user_profession'),
            comment:
              request.user_profession_status === 'rejected' &&
                request.user_profession_rejection_reason
                ? {
                  title: 'Rejection reason:',
                  content: request.user_profession_rejection_reason,
                }
                : null,
          },
        };
      }

      requests.push(reuqestObject);
    });

    return requests;
  }, [jobTypesController.userToSystemRequest.list, languageController.current]);

  const filteredFormattedUserRequests = useMemo(() => {
    if (searchValue.trim() === '') {
      return formattedUserRequests;
    }
    return formattedUserRequests.filter((request) => {
      const searchLower = searchValue.toLowerCase();
      return (
        request.title.toLowerCase().includes(searchLower) ||
        request.subtitle.toLowerCase().includes(searchLower) ||
        (request.extra?.comment?.content &&
          request.extra.comment.content.toLowerCase().includes(searchLower))
      );
    });
  }, [formattedUserRequests, searchValue]);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await jobTypesController?.reloadProfessionRequests?.();
    } finally {
      setRefreshing(false);
    }
  }, [jobTypesController]);

  const sizes = useMemo(() => {
    const web = (size, options) => scaleByHeight(size, height, BASE_DESIGN_HEIGHT, options);
    const mobile = (size, options) => scaleByHeightMobile(size, height, options);

    return {
      containerPaddingH: isWebLandscape ? web(10) : mobile(10),
      containerPaddingV: isWebLandscape ? web(14) : mobile(14),
      scrollContainerPaddingBottom: isWebLandscape ? web(20) : mobile(120),
      plusButtonSize: isWebLandscape ? web(64) : mobile(64, { maxScale: 1.35 }),
      plusButtonLeft: isWebLandscape ? web(32) : mobile(16),
      plusButtonRight: isWebLandscape ? web(32) : mobile(16),

      plusButtonBottom: isWebLandscape ? web(16) : mobile(16),
      plusIconSize: isWebLandscape ? web(24) : mobile(24, { maxScale: 1.35 }),
      plusButtonShadowColor: '#000',
      plusButtonShadowOffset: {
        width: 0,
        height: isWebLandscape ? web(4) : mobile(4),
      },
      plusButtonShadowOpacity: 0.3,
      plusButtonShadowRadius: isWebLandscape ? web(5) : mobile(5),
      plusButtonElevation: isWebLandscape ? 10 : 8,
      chooseTextFontSize: isWebLandscape ? web(18) : mobile(18),
      chooseTextMarginBottom: isWebLandscape ? web(25) : mobile(25),
    };
  }, [height, isWebLandscape]);

  const add = () => {
    openSystemRegistration(false);
  };

  return (
    <>
      <View
        style={[
          styles.container,
          {
            backgroundColor: themeController.current?.backgroundColor,
            direction: isRTL ? 'rtl' : 'ltr',
            paddingHorizontal: sizes.containerPaddingH,
            paddingVertical: sizes.containerPaddingV,
          },
        ]}
      >
        <View>
          <SearchPanel
            searchValue={searchValue}
            setSearchValue={setSearchValue}
          />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            { paddingBottom: sizes.scrollContainerPaddingBottom },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[themeController.current?.primaryColor || '#007AFF']}
              tintColor={themeController.current?.primaryColor || '#007AFF'}
            />
          }
        >
          {filteredFormattedUserRequests.map((request, index) =>
            <UniversalProfessionComponent
              key={index}
              item={{
                type: request.type,
                title: request.title,
                subtitle: request.subtitle,
                extra: request.extra || null,
              }}
              onPress={() => { }}
            />)}
        </ScrollView>
        {/* Кнопка + */}
        {formattedUserRequests.length > 0 ? (
          <>
            <TouchableOpacity
              style={{
                backgroundColor: themeController.current?.mainBadgeBackground,
                width: sizes.plusButtonSize,
                height: sizes.plusButtonSize,
                borderRadius: sizes.plusButtonSize,
                justifyContent: 'center',
                alignItems: 'center',
                position: 'absolute',
                // ...(isRTL
                //   ? {
                //     left: sizes.plusButtonLeft,
                //   }
                //   : {
                //     right: sizes.plusButtonRight,
                //   }),
                right: sizes.plusButtonRight,
                bottom: sizes.plusButtonBottom,
                shadowColor: sizes.plusButtonShadowColor,
                shadowOffset: sizes.plusButtonShadowOffset,
                shadowOpacity: sizes.plusButtonShadowOpacity,
                shadowRadius: sizes.plusButtonShadowRadius,
                elevation: sizes.plusButtonElevation,
              }}
              onPress={add}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('professions.add_profession', { defaultValue: 'הוסף מקצוע' })}
            >
              <Image
                source={icons.plus}
                style={{
                  width: sizes.plusIconSize,
                  height: sizes.plusIconSize,
                  tintColor: themeController.current?.buttonTextColorPrimary,
                }}
                resizeMode='contain'
                accessible={false}
                aria-hidden={true}
              />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View
              style={{
                position: 'absolute',
                ...(isRTL
                  ? {
                    left: sizes.plusButtonLeft,
                  }
                  : {
                    right: sizes.plusButtonRight,
                  }),
                bottom: '50%',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <Text
                accessibilityRole="header"
                style={{
                  color: themeController.current?.textColor,
                  textAlign: 'center',
                  fontFamily: 'Rubik-SemiBold',
                  fontSize: sizes.chooseTextFontSize,
                  marginBottom: sizes.chooseTextMarginBottom,
                }}
              >
                {t('professions.choose_profession')}
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: themeController.current?.mainBadgeBackground,
                  width: sizes.plusButtonSize,
                  height: sizes.plusButtonSize,
                  borderRadius: sizes.plusButtonSize,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: sizes.plusButtonShadowColor,
                  shadowOffset: sizes.plusButtonShadowOffset,
                  shadowOpacity: sizes.plusButtonShadowOpacity,
                  shadowRadius: sizes.plusButtonShadowRadius,
                  elevation: sizes.plusButtonElevation,
                }}
                onPress={add}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('professions.add_profession', { defaultValue: 'הוסף מקצוע' })}
              >
                <Image
                  source={icons.plus}
                  style={{
                    width: sizes.plusIconSize,
                    height: sizes.plusIconSize,
                    tintColor: themeController.current?.buttonTextColorPrimary,
                  }}
                  resizeMode='contain'
                  accessible={false}
                  aria-hidden={true}
                />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  scrollContainer: {
    flexGrow: 1,
  },
});

export default SystemProfessions;
