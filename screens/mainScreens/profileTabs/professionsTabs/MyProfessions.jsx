import React, { useMemo, useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
  Text
} from 'react-native';
import SearchPanel from '../../../../components/SearchPanel';
import {
  scaleByHeight,
  scaleByHeightMobile,
} from '../../../../utils/resizeFuncs';
import UniversalProfessionComponent from '../../../../components/ui/UniversalProfessionComponent';
import { useWindowInfo } from '../../../../context/windowContext';
import { useComponentContext } from '../../../../context/globalAppContext';
import { PROFESSION_TYPES } from '../../../../constants/enums';
import { icons } from '../../../../constants/icons';
import AddProfessionModal from '../../../../components/AddProfessionModal';
import RequestProfessionModal from '../../../../components/RequestProfessionModal';
import { useTranslation } from 'react-i18next';
import { SubmitModal } from '../../../../components/modals/misc/SubmitModal';
import { useNotification } from '../../../../src/render';

const MyProfessions = ({ switchToSystemProfessions, systemAddingPopupVisible, setSystemAddingPopupVisible }) => {
  const [searchValue, setSearchValue] = useState('');
  const { height, width } = useWindowDimensions();
  const { isLandscape, sidebarWidth } = useWindowInfo();
  const { showWarning } = useNotification();
  const isWebLandscape = isLandscape && Platform.OS === 'web';
  const { themeController, languageController, jobTypesController, setAppLoading } = useComponentContext();
  const isRTL = languageController.isRTL;
  const { t } = useTranslation();

  const [requestProfessionData, setRequestProfessionData] = useState(null);

  const formattedUserRequests = useMemo(() => {
    const requests = [];
    jobTypesController.userToUserRequest.list.forEach((request) => {
      const reuqestObject = {
        title: jobTypesController.jobTypesWithSubtypes.find(t => t.id === request.job_type_id)?.name_en || request.requested_type_name,
        subtitle: jobTypesController.jobTypesWithSubtypes.find(t => t.id === request.job_type_id)?.subtypes.find(st => st.id === request.job_subtype_id)?.name_en || request.requested_subtype_name,
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

      requests.push(reuqestObject);
    });

    return requests;
  }, [jobTypesController.userToUserRequest.list]);

  const [isRequestModalVisible, setIsRequestModalVisible] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isSubmitModalVisible, setIsSubmitModalVisible] = useState(false);

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);

    return {
      containerPaddingH: isWebLandscape ? web(10) : mobile(10),
      containerPaddingV: isWebLandscape ? web(14) : mobile(14),
      scrollContainerPaddingBottom: isWebLandscape ? web(20) : mobile(20),
      plusButtonSize: isWebLandscape ? web(64) : mobile(64),
      plusButtonLeft: isWebLandscape ? web(36) : mobile(16),
      plusButtonRight: isWebLandscape ? web(36) : mobile(16),
      plusButtonBottom: isWebLandscape ? web(16) : mobile(16),
      plusIconSize: isWebLandscape ? web(24) : mobile(24),
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
  }, [height, width, isWebLandscape]);

  const add = () => {
    // Логика добавления новой профессии
    setIsRequestModalVisible(true);
  };

  //#region Methods

  const handleProfessionRequested = (data) => {
    if (jobTypesController.checkIfVerificationNeeded({ typeId: data.job_type_id, subTypeId: data.job_subtype_id })) {
      setRequestProfessionData(data);
      setIsRequestModalVisible(false);
      setIsAddModalVisible(true);
    } else {

      setAppLoading(true);

      jobTypesController.userToUserRequest.makeRequest(data)
        .then(() => {
          setIsRequestModalVisible(false);
          setIsSubmitModalVisible(true);
        }).catch((err) => {
          if (err?.response?.status === 400) {
            showWarning(t('professions.warnings.validation_failed'), [
              {
                title: 'OK',
                backgroundColor: '#F59E0B',
                textColor: '#FFFFFF'
              },
            ]);
          } else if (err?.response?.status === 409) {
            showWarning(t('professions.warnings.already_requested'), [
              {
                title: 'OK',
                backgroundColor: '#F59E0B',
                textColor: '#FFFFFF'
              },
            ]);
          } else {
            showWarning(t('professions.warnings.unexpected_error'), [
              {
                title: 'OK',
                backgroundColor: '#F59E0B',
                textColor: '#FFFFFF'
              },
            ]);
          }
        }).finally(() => {
          setAppLoading(false);
        });
    }
  }

  const handleDocumentsProvided = (data) => {
    const requestData = {
      job_type_id: requestProfessionData?.job_type_id,
      job_subtype_id: requestProfessionData?.job_subtype_id,
      passport_photo_urls: data.passport_photos,
      certificate_photo_urls: data.certificate_photos,
    }

    if (!requestData.job_type_id || !requestData.job_subtype_id) {
      console.error('Missing job type or subtype ID for profession request.');
      return;
    }

    setAppLoading(true);

    jobTypesController.userToUserRequest.makeRequest(requestData)
      .then(() => {
        setIsAddModalVisible(false);
        setIsSubmitModalVisible(true);
      }).catch((err) => {
        if (err?.response?.status === 400) {
          showWarning(t('professions.warnings.validation_failed'), [
            {
              title: 'OK',
              backgroundColor: '#F59E0B',
              textColor: '#FFFFFF'
            },
          ]);
        } else if (err?.response?.status === 409) {
          showWarning(t('professions.warnings.already_requested'), [
            {
              title: 'OK',
              backgroundColor: '#F59E0B',
              textColor: '#FFFFFF'
            },
          ]);
        } else {
          showWarning(t('professions.warnings.unexpected_error'), [
            {
              title: 'OK',
              backgroundColor: '#F59E0B',
              textColor: '#FFFFFF'
            },
          ]);
        }
      }).finally(() => {
        setAppLoading(false);
      });
  }

  //#endregion

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
        >
          {formattedUserRequests.map((request, index) =>
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
                ...(isRTL
                  ? {
                    left: sizes.plusButtonLeft,
                  }
                  : {
                    right: sizes.plusButtonRight,
                  }),
                bottom: sizes.plusButtonBottom,
                shadowColor: sizes.plusButtonShadowColor,
                shadowOffset: sizes.plusButtonShadowOffset,
                shadowOpacity: sizes.plusButtonShadowOpacity,
                shadowRadius: sizes.plusButtonShadowRadius,
                elevation: sizes.plusButtonElevation,
              }}
              onPress={add}
            >
              <Image
                source={icons.plus}
                style={{
                  width: sizes.plusIconSize,
                  height: sizes.plusIconSize,
                  tintColor: themeController.current?.buttonTextColorPrimary,
                }}
                resizeMode='contain'
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
              >
                <Image
                  source={icons.plus}
                  style={{
                    width: sizes.plusIconSize,
                    height: sizes.plusIconSize,
                    tintColor: themeController.current?.buttonTextColorPrimary,
                  }}
                  resizeMode='contain'
                />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
      <AddProfessionModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onSubmit={handleDocumentsProvided}
      />
      <RequestProfessionModal
        visible={isRequestModalVisible}
        onClose={() => {
          setIsRequestModalVisible(false);
          setRequestProfessionData(null);
        }}
        onRequested={handleProfessionRequested}
        onSwitchToSystemProfessions={switchToSystemProfessions}
      />
      <SubmitModal
        visible={isSubmitModalVisible}
        onClose={() => setIsSubmitModalVisible(false)}
        onSubmitted={() => setIsSubmitModalVisible(false)}
      />
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

export default MyProfessions;
