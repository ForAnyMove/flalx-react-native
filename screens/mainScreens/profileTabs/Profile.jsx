import {
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  Modal,
} from 'react-native';
import { useComponentContext } from '../../../context/globalAppContext';
import { useMemo, useState, useEffect } from 'react';
import { icons } from '../../../constants/icons';
import { useWindowInfo } from '../../../context/windowContext';
import { useTranslation } from 'react-i18next';
import ImagePickerModal from '../../../components/ui/ImagePickerModal';
import { scaleByHeight, scaleByHeightMobile } from '../../../utils/resizeFuncs';
import SubscriptionsModal from '../../../components/SubscriptionsModal';
import { getUserExportData } from '../../../src/api/dataExport';
import CouponsModal from '../../../components/CouponsModal';
import { logError, logInfo } from '../../../utils/log_util';
import CustomTextInput from '../../../components/ui/CustomTextInput';
import { ModalContent } from './ModalContent';
import { Linking } from 'react-native';
import PaymentMethodsModal from '../../../components/PaymentMethodsModal';
import UpdateUserDataModal from '../../../components/modals/UpdateUserDataModal';
import UpdateEmailModal from '../../../components/modals/UpdateEmailModal';
import UpdatePhoneModal from '../../../components/modals/UpdatePhoneModal';
import { useNotification } from '../../../src/render';
import { uploadAvatarForModeration } from '../../../src/api/images';
import { convertImageToBase64 } from '../../../utils/imageToBase64';
import { exportHtmlToPdf } from '../../../utils/htmlToPdf';

export default function Profile() {
  const { user, themeController, languageController, session, setAppLoading } =
    useComponentContext();
  const { showError, showInfo } = useNotification();
  const [userState, setUserState] = useState(user.current || {});
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);
  const [acceptModalVisibleTitle, setAcceptModalVisibleTitle] = useState('');
  const [acceptModalVisibleFunc, setAcceptModalVisibleFunc] = useState(
    () => () => {},
  );
  const [changePasswordModal, showPasswordModal] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [pickerVisible, setPickerVisible] = useState(false);
  const { height, isLandscape } = useWindowInfo();
  const { t } = useTranslation();
  const isRTL = languageController.isRTL;

  const [subscriptionsModal, setSubscriptionsModal] = useState(false);
  const [couponsModalVisible, setCouponsModalVisible] = useState(false);
  const [paymentMethodsModalVisible, setPaymentMethodsModalVisible] =
    useState(false);
  const [contactUsVisible, setContactUsVisible] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [updateUserDataModalVisible, setUpdateUserDataModalVisible] =
    useState(false);
  const [updateEmailModalVisible, setUpdateEmailModalVisible] = useState(false);
  const [updatePhoneModalVisible, setUpdatePhoneModalVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [baseInfoEditMode, setBaseInfoEditMode] = useState(false);
  const [editingFields, setEditingFields] = useState({});

  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  // Синхронизация userState с user.current (включая pending_avatar)
  useEffect(() => {
    if (user.current) {
      setUserState(user.current);
    }
  }, [user.current]);

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);

    return {
      baseFont: isWebLandscape ? web(12) : mobile(12),
      avatarSize: isWebLandscape ? web(114) : mobile(114),
      btnPadding: isWebLandscape ? web(10) : mobile(10),
      btnMargin: isWebLandscape ? 0 : mobile(5),
      btnFont: isWebLandscape ? web(20) : mobile(20),
      btnHeight: isWebLandscape ? web(64) : mobile(64),
      btnWidth: isWebLandscape ? '32%' : '100%',
      labelFont: isWebLandscape ? web(12) : mobile(12),
      fieldFont: isWebLandscape ? web(16) : mobile(16),
      fieldPadding: isWebLandscape ? web(10) : mobile(10),
      fieldPaddingVertical: isWebLandscape ? web(12) : mobile(12),
      fieldMargin: isWebLandscape ? 0 : mobile(5),
      containerPaddingH: isWebLandscape ? web(24) : mobile(12),
      containerPaddingV: isWebLandscape ? web(10) : mobile(10),
      containerWidth: '100%',
      iconSize: isWebLandscape ? web(24) : mobile(24),
      paddingVertical: isWebLandscape ? web(10) : mobile(10),
      modalWidth: isWebLandscape ? web(450) : '80%',
      modalHeight: isWebLandscape ? web(230) : '60%',
      modalFont: isWebLandscape ? web(24) : mobile(24),
      modalTextMarginBottom: isWebLandscape ? web(32) : mobile(32),
      modalBtnHeight: isWebLandscape ? web(62) : mobile(62),
      modalBtnWidth: isWebLandscape ? web(153) : '40%',
      modalBtnFont: isWebLandscape ? web(20) : mobile(20),
      modalBtnBorderRadius: isWebLandscape ? web(8) : mobile(8),
      modalBtnsGap: isWebLandscape ? web(24) : mobile(24),
      modalPadding: isWebLandscape ? web(32) : mobile(32),
      modalLineHeight: isWebLandscape ? web(32) : mobile(32),
      modalCloseBtnTopRightPosition: isWebLandscape ? web(7) : mobile(7),
      modalIconSize: isWebLandscape ? web(22) : mobile(22),
      modalFieldMargin: isWebLandscape ? web(18) : mobile(18),
      profileBackHeight: isWebLandscape ? web(250) : mobile(250),
      profileBackMarginBottom: isWebLandscape ? web(10) : mobile(15),
      profileBackBorderRadius: isWebLandscape ? web(10) : mobile(10),
      infoFieldsGap: isWebLandscape ? web(6) : mobile(6),
      breakLineMarginVertical: isWebLandscape ? web(15) : mobile(15),
      buttonsMarginBottom: isWebLandscape ? web(20) : mobile(20),
      infoFieldBorderRadius: isWebLandscape ? web(8) : mobile(8),
      infoFieldPaddingH: isWebLandscape ? web(16) : mobile(16),
      labelMarginBottom: isWebLandscape ? web(4) : mobile(4),
      editPanelGap: isWebLandscape ? web(5) : mobile(5),
      oneLineInputHeight: isWebLandscape ? web(20) : mobile(20),
    };
  }, [height, isWebLandscape]);

  const handleUpdateUserData = async (data) => {
    setIsUpdating(true);
    try {
      const updatedUser = await user.update(data);
      if (updatedUser) {
        setUserState(updatedUser);
      }
      setUpdateUserDataModalVisible(false);
    } catch (error) {
      console.error('Failed to update user data:', error);
      // Optionally, show an error message to the user
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateEmail = (newEmail) => {
    // The logic is now inside the modal.
    // We can potentially update the user state here if needed,
    // but Supabase handles the email change after verification.
    // For now, we just close the modal, and the user will see the pending change.
    // setUpdateEmailModalVisible(false);
    console.log(`Email change process initiated for ${newEmail}.`);
  };

  const handleUpdatePhone = async (newPhone) => {
    setIsUpdating(true);
    try {
      // The actual update happens inside the modal flow now.
      // We just need to update the local state and close the modal.
      const updatedUser = await user.update({ phoneNumber: newPhone });
      if (updatedUser) {
        setUserState(updatedUser);
      }
      setUpdatePhoneModalVisible(false);
      // Maybe show a success message
    } catch (error) {
      console.error('Failed to update user phone:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Функция загрузки и обновления аватара через сервер
  async function uploadAvatar(uri) {
    try {
      setAppLoading(true);

      // 1. Конвертировать файл в base64
      const { base64, fileType } = await convertImageToBase64(uri);

      // 2. Отправить на сервер
      const { pending_avatar } = await uploadAvatarForModeration(
        base64,
        fileType,
        session,
      );

      // 3. Обновить локальный стейт
      user.setPendingAvatar(pending_avatar);
      setUserState((prev) => ({ ...prev, pending_avatar }));

      showInfo(t('my_profile.avatar_uploaded_for_moderation'));
    } catch (err) {
      logError('Ошибка загрузки аватара:', err.message);
      showError(err.message || t('errors.unexpected_error'));
    } finally {
      setAppLoading(false);
    }
  }

  async function downloadExportData() {
    try {
      setAppLoading(true);
      const res = await getUserExportData(session, languageController.current);
      if (res) {
        await exportHtmlToPdf(res, 'user-data-export.pdf');
        if (Platform.OS === 'web') {
          showInfo(t('my_profile.export_success'));
        }
      }
    } catch (err) {
      console.error('Error exporting data:', err);
      showError(t('errors.unexpected_error'));
    } finally {
      setAppLoading(false);
    }
  }

  // const firstBtnsRow = isWebLandscape
  //   ? ['coupons', 'subscription', 'payment']
  //   : ['coupons', 'subscription'];
  // const secondBtnsRow = isWebLandscape
  //   ? ['contact', 'feedback', 'whatsapp']
  //   : ['contact', 'feedback', 'whatsapp'];
  const firstBtnsRow = ['coupons', 'subscription', 'payment'];
  const secondBtnsRow = ['contact', 'feedback', 'whatsapp'];

  const openWhatsApp = async () => {
    const number = await session.getWhatsAppNumber();
    if (!number) {
      console.log('Could not get WhatsApp number');
      // Optionally, show an alert to the user
      return;
    }
    const url = `whatsapp://send?phone=${number}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.log('WhatsApp is not installed');
        // Optionally, show an alert to the user
      }
    } catch (err) {
      console.error('An error occurred', err);
    }
  };

  const buttonsConfig = {
    coupons: {
      text: t('my_profile.coupons'),
      action: () => setCouponsModalVisible(true),
      style: 'primary',
    },
    subscription: {
      text: t('my_profile.subscription'),
      action: () => setSubscriptionsModal(true),
      style: 'primary',
    },
    payment: {
      text: t('my_profile.payment'),
      action: () => setPaymentMethodsModalVisible(true),
      style: 'primary',
      // hidden: isWebLandscape,
    },
    contact: {
      text: t('my_profile.contact_us'),
      action: () => setContactUsVisible(true),
      style: 'secondary',
    },
    feedback: {
      text: t('my_profile.feedback'),
      action: () => setFeedbackVisible(true),
      style: 'secondary',
    },
    whatsapp: {
      text: 'WhatsApp',
      action: openWhatsApp,
      style: 'secondary',
    },
    delete: {
      text: t('my_profile.delete'),
      action: () => {
        setAcceptModalVisible(true);
        setAcceptModalVisibleTitle(t('my_profile.confirm_delete'));
        setAcceptModalVisibleFunc(() => async () => {
          try {
            await user.delete();
          } catch (err) {
            logInfo('Ошибка удаления:', err.message);
          }
          setAcceptModalVisible(false);
        });
      },
      style: 'secondary',
    },
  };

  const renderButtons = (row) => (
    <>
      {row.map((key) => {
        const btnConfig = buttonsConfig[key];
        if (!btnConfig || btnConfig.hidden)
          return (
            <View
              key={key}
              style={{
                height: sizes.btnHeight,
                marginBottom: sizes.btnMargin,
                width: sizes.btnWidth,
              }}
            />
          );

        const isPrimary = btnConfig.style === 'primary';

        return (
          <TouchableOpacity
            key={key}
            style={[
              isPrimary ? styles.primaryBtn : styles.secondaryBtn,
              {
                backgroundColor: isPrimary
                  ? themeController.current?.buttonColorPrimaryDefault
                  : themeController.current?.buttonColorSecondaryDefault,
                height: sizes.btnHeight,
                marginBottom: sizes.btnMargin,
                width: sizes.btnWidth,
                borderRadius: sizes.infoFieldBorderRadius,
              },
              key === 'whatsapp' && {
                backgroundColor: themeController.current?.whatsappBtnColor,
              },
              key === 'delete' && {
                backgroundColor: themeController.current?.errorTextColor,
              },
            ]}
            onPress={btnConfig.action}
          >
            <Text
              style={[
                isPrimary ? styles.primaryText : styles.secondaryText,
                {
                  fontSize: sizes.btnFont,
                  color: isPrimary
                    ? themeController.current?.buttonTextColorPrimary
                    : themeController.current?.buttonTextColorSecondary,
                },
              ]}
            >
              {btnConfig.text}
            </Text>
          </TouchableOpacity>
        );
      })}
    </>
  );

  return (
    <ScrollView
      style={[
        styles.userProfile,
        {
          backgroundColor: themeController.current?.backgroundColor,
          paddingVertical: sizes.paddingVertical,
        },
      ]}
      contentContainerStyle={{
        alignItems: isWebLandscape ? 'center' : 'stretch',
      }}
    >
      <View
        style={{
          paddingHorizontal: sizes.containerPaddingH,
          paddingBottom: sizes.containerPaddingV,
          width: sizes.containerWidth,
        }}
      >
        <ImageBackground
          source={userState?.profileBack}
          resizeMode='cover'
          style={[
            styles.profileBack,
            {
              backgroundColor:
                themeController.current?.profileDefaultBackground,
              height: sizes.profileBackHeight,
              marginBottom: sizes.profileBackMarginBottom,
              borderRadius: sizes.profileBackBorderRadius,
            },
          ]}
        >
          <View style={{ alignItems: 'center' }}>
            {/* Контейнер для аватара и кнопки */}
            <View style={{ position: 'relative' }}>
              <Image
                source={
                  // Приоритет: pending_avatar > avatar > default
                  userState.pending_avatar
                    ? { uri: userState.pending_avatar }
                    : userState.avatar
                      ? { uri: userState.avatar }
                      : icons.defaultAvatarInverse
                }
                style={{
                  width: sizes.avatarSize,
                  height: sizes.avatarSize,
                  borderRadius: sizes.avatarSize / 2,
                  backgroundColor: '#ccc',
                }}
              />
              {/* Кнопка редактирования аватара */}
              <TouchableOpacity
                style={[
                  styles.cameraButton,
                  {
                    width: sizes.avatarSize * 0.3,
                    height: sizes.avatarSize * 0.3,
                  },
                ]}
                onPress={() => setPickerVisible(true)}
              >
                <Image source={icons.camera} style={styles.cameraIcon} />
              </TouchableOpacity>
            </View>

            {/* Текст о модерации аватарки */}
            {userState.pending_avatar && (
              <View
                style={{ marginTop: sizes.infoFieldsGap, alignItems: 'center' }}
              >
                <Text
                  style={{
                    fontSize: sizes.labelFont,
                    color:
                      themeController.current?.textColorSecondary || '#666',
                    fontFamily: 'Rubik-Medium',
                  }}
                >
                  {t('my_profile.avatar_pending_moderation')}
                </Text>
                <Text
                  style={{
                    fontSize: sizes.labelFont * 0.85,
                    color:
                      themeController.current?.textColorSecondary || '#999',
                    fontFamily: 'Rubik-Regular',
                  }}
                >
                  {t('my_profile.avatar_pending_subtitle')}
                </Text>
              </View>
            )}
          </View>
        </ImageBackground>

        <View
          style={{
            width: '100%',
            alignItems: isRTL ? 'flex-start' : 'flex-end',
            marginBottom: sizes.labelMarginBottom * 2,
          }}
        >
          <TouchableOpacity
            // onPress={() => setUpdateUserDataModalVisible(true)}
            onPress={() => setBaseInfoEditMode(true)}
            style={{ visibility: baseInfoEditMode ? 'hidden' : 'visible' }}
          >
            <Image
              source={icons.edit}
              style={{
                width: sizes.iconSize,
                height: sizes.iconSize,
                resizeMode: 'contain',
                tintColor: themeController.current?.unactiveTextColor,
              }}
            />
          </TouchableOpacity>
        </View>
        {/* Инфо-поля */}
        <View
          style={{
            flexDirection: isWebLandscape
              ? isRTL
                ? 'row-reverse'
                : 'row'
              : 'column',
            gap: sizes.infoFieldsGap,
            marginBottom: sizes.infoFieldsGap,
            width: '100%',
            justifyContent: 'space-between',
          }}
        >
          <View
            style={{
              // flexDirection: isWebLandscape ? 'row' : 'column',
              // flexWrap: isWebLandscape ? 'wrap' : 'nowrap',
              justifyContent: isWebLandscape ? 'space-between' : 'center',
              gap: sizes.infoFieldsGap,
              direction: isRTL ? 'rtl' : 'ltr',
              width: isWebLandscape ? '48.5%' : '100%',
            }}
          >
            {[
              { key: 'first_name', value: userState?.name, field: 'name' },
              { key: 'surname', value: userState?.surname, field: 'surname' },
            ].map((f) => (
              <InfoField
                key={f.key}
                label={t(`my_profile.${f.key}`)}
                value={f.value}
                onEditPress={() => setUpdateUserDataModalVisible(true)}
                baseFont={sizes.fieldFont}
                fieldPadding={sizes.fieldPadding}
                btnHeight={sizes.btnHeight}
                fieldMargin={sizes.fieldMargin}
                iconSize={sizes.iconSize}
                isLandscape={isLandscape}
                multiline={f.multiline}
                height={height}
                sizes={sizes}
                isRTL={isRTL}
                field={f.field}
                editMode={baseInfoEditMode}
                setEditingFields={setEditingFields}
              />
            ))}
          </View>
          <InfoField
            key='about'
            label={t(`my_profile.about`)}
            value={userState?.about}
            onEditPress={() => setUpdateUserDataModalVisible(true)}
            baseFont={sizes.fieldFont}
            fieldPadding={sizes.fieldPadding}
            btnHeight={sizes.btnHeight * 2 + sizes.infoFieldsGap}
            fieldMargin={sizes.fieldMargin}
            iconSize={sizes.iconSize}
            isLandscape={isLandscape}
            multiline={true}
            height={height}
            sizes={sizes}
            isRTL={isRTL}
            field='about'
            editMode={baseInfoEditMode}
            setEditingFields={setEditingFields}
          />
        </View>
        {baseInfoEditMode && (
          <View
            style={{
              width: '100%',
              alignItems: isRTL ? 'flex-start' : 'flex-end',
            }}
          >
            <View
              style={{
                width: '48.5%',
                flexDirection: 'row',
                justifyContent: 'flex-end',
                gap: '5%',
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  handleUpdateUserData({});
                  setBaseInfoEditMode(false);
                }}
                style={[
                  styles.secondaryReverseBtn,
                  {
                    flex: 1,
                    backgroundColor: themeController.current?.backgroundColor,
                    borderColor:
                      themeController.current?.buttonColorSecondaryDefault,
                    height: sizes.btnHeight,
                    borderRadius: sizes.infoFieldBorderRadius,
                  },
                ]}
              >
                <Text
                  style={{
                    color: themeController.current?.buttonColorSecondaryDefault,
                    fontSize: sizes.btnFont,
                  }}
                >
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  handleUpdateUserData(editingFields);
                  setBaseInfoEditMode(false);
                }}
                style={[
                  styles.primaryBtn,
                  {
                    flex: 1,
                    backgroundColor:
                      themeController.current?.buttonColorPrimaryDefault,
                    height: sizes.btnHeight,
                    borderRadius: sizes.infoFieldBorderRadius,
                  },
                ]}
              >
                <Text
                  style={{
                    color: themeController.current?.buttonTextColorPrimary,
                    fontSize: sizes.btnFont,
                  }}
                >
                  {t('common.save')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View
          style={[
            styles.breakLine,
            {
              backgroundColor: themeController.current?.breakLineColor,
              marginVertical: sizes.breakLineMarginVertical,
            },
          ]}
        />
        <View
          style={{
            flexDirection: isWebLandscape ? 'row' : 'column',
            flexWrap: isWebLandscape ? 'wrap' : 'nowrap',
            justifyContent: isWebLandscape ? 'space-between' : 'center',
            gap: sizes.infoFieldsGap,
            direction: isRTL ? 'rtl' : 'ltr',
            width: '100%',
          }}
        >
          {[
            { key: 'email', value: userState?.email, field: 'email' },
            {
              key: 'phone',
              value: userState?.phoneNumber,
              field: 'phoneNumber',
            },
          ].map((f) => (
            <InfoField
              key={f.key}
              label={t(`my_profile.${f.key}`)}
              value={f.value}
              onEditPress={() => {
                if (f.key === 'email') {
                  setUpdateEmailModalVisible(true);
                } else if (f.key === 'phone') {
                  setUpdatePhoneModalVisible(true);
                }
              }}
              baseFont={sizes.fieldFont}
              fieldPadding={sizes.fieldPadding}
              btnHeight={sizes.btnHeight}
              fieldMargin={sizes.fieldMargin}
              iconSize={sizes.iconSize}
              isLandscape={isLandscape}
              multiline={f.multiline}
              height={height}
              sizes={sizes}
              isRTL={isRTL}
              field={f.field}
            />
          ))}
        </View>
        <View
          style={[
            styles.breakLine,
            {
              backgroundColor: themeController.current?.breakLineColor,
              marginVertical: sizes.breakLineMarginVertical,
            },
          ]}
        />

        {/* Первые 3 кнопки */}
        <View
          style={{
            flexDirection: isWebLandscape
              ? isRTL
                ? 'row-reverse'
                : 'row'
              : 'column',
            width: '100%',
            flexWrap: isWebLandscape ? 'wrap' : 'nowrap',
            justifyContent: isWebLandscape ? 'space-between' : 'center',
            gap: sizes.infoFieldsGap,
            direction: isRTL ? 'rtl' : 'ltr',
            // marginBottom: isWebLandscape ? sizes.buttonsMarginBottom : sizes.infoFieldsGap,
          }}
        >
          {renderButtons(firstBtnsRow)}
        </View>

        <View
          style={[
            styles.breakLine,
            {
              backgroundColor: themeController.current?.breakLineColor,
              marginVertical: sizes.breakLineMarginVertical,
            },
          ]}
        />

        {/* Остальные кнопки */}
        <View
          style={{
            flexDirection: isWebLandscape ? 'row' : 'column',
            flexWrap: isWebLandscape ? 'wrap' : 'nowrap',
            justifyContent: isWebLandscape ? 'space-between' : 'center',
            gap: sizes.infoFieldsGap,
            direction: isRTL ? 'rtl' : 'ltr',
            // marginBottom: isWebLandscape ? sizes.buttonsMarginBottom : sizes.infoFieldsGap,
          }}
        >
          {[
            {
              key: user.current?.is_password_exist
                ? 'change_password'
                : 'create_password',
              style: styles.primaryReverseBtn,
              textStyle: styles.primaryText,
              bg: themeController.current?.backgroundColor,
              color: themeController.current?.buttonColorPrimaryDefault,
              border: themeController.current?.buttonColorPrimaryDefault,
              onPress: () => {
                setOldPassword('');
                setNewPassword('');
                setRepeatPassword('');
                showPasswordModal(true);
              },
            },
            {
              key: 'logout',
              style: styles.secondaryReverseBtn,
              textStyle: styles.secondaryText,
              bg: themeController.current?.backgroundColor,
              color: themeController.current?.buttonColorSecondaryDefault,
              border: themeController.current?.buttonColorSecondaryDefault,
              onPress: () => {
                setAcceptModalVisible(true);
                setAcceptModalVisibleTitle(t('my_profile.confirm_logout'));
                setAcceptModalVisibleFunc(() => async () => {
                  try {
                    await session.signOut();
                  } catch (err) {
                    logInfo('Ошибка выхода из системы:', err.message);
                  }
                  setAcceptModalVisible(false);
                });
              },
            },
            {
              key: 'export_data',
              style: styles.secondaryReverseBtn,
              textStyle: styles.secondaryText,
              bg: themeController.current?.backgroundColor,
              color: themeController.current?.buttonColorSecondaryDefault,
              border: themeController.current?.buttonColorSecondaryDefault,
              onPress: downloadExportData,
            },
          ].map((btn) => (
            <TouchableOpacity
              key={btn.key}
              onPress={btn.onPress}
              style={[
                btn.style,
                {
                  backgroundColor: btn.bg,
                  borderColor: btn.border,
                  height: sizes.btnHeight,
                  marginBottom: sizes.btnMargin,
                  width: sizes.btnWidth,
                  borderRadius: sizes.infoFieldBorderRadius,
                },
              ]}
            >
              <Text
                style={[
                  btn.textStyle,
                  { fontSize: sizes.btnFont, color: btn.color },
                ]}
              >
                {t(`my_profile.${btn.key}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View
          style={[
            styles.breakLine,
            {
              backgroundColor: themeController.current?.breakLineColor,
              marginVertical: sizes.breakLineMarginVertical,
            },
          ]}
        />

        <View
          style={{
            flexDirection: isWebLandscape
              ? isRTL
                ? 'row-reverse'
                : 'row'
              : 'column',
            gap: sizes.btnMargin,
            width: '100%',
            flexWrap: isWebLandscape ? 'wrap' : 'nowrap',
            justifyContent: isWebLandscape ? 'space-between' : 'center',
            gap: sizes.infoFieldsGap,
            direction: isRTL ? 'rtl' : 'ltr',
            // marginBottom: isWebLandscape
            //   ? sizes.buttonsMarginBottom
            //   : sizes.infoFieldsGap,
          }}
        >
          {renderButtons(secondBtnsRow)}
        </View>

        <View
          style={[
            styles.breakLine,
            {
              backgroundColor: themeController.current?.breakLineColor,
              marginVertical: sizes.breakLineMarginVertical,
            },
          ]}
        />

        <View
          style={{
            flexDirection: isWebLandscape ? 'row' : 'column',
            flexWrap: isWebLandscape ? 'wrap' : 'nowrap',
            justifyContent: 'center',
            gap: sizes.infoFieldsGap,
            direction: isRTL ? 'rtl' : 'ltr',
          }}
        >
          {renderButtons(['delete'])}
        </View>
      </View>

      {/* Modal подтверждения */}
      <Modal visible={acceptModalVisible} transparent animationType='fade'>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: themeController.current?.backgroundColor,
                width: sizes.modalWidth,
                padding: sizes.modalPadding,
                borderRadius: sizes.modalBtnBorderRadius,
              },
              isWebLandscape && { height: sizes.modalHeight },
            ]}
          >
            <TouchableOpacity
              style={[
                {
                  position: 'absolute',
                  top: sizes.modalCloseBtnTopRightPosition,
                  right: sizes.modalCloseBtnTopRightPosition,
                },
              ]}
              onPress={() => setAcceptModalVisible(false)}
            >
              <Image
                source={icons.cross}
                style={{
                  width: sizes.modalIconSize,
                  height: sizes.modalIconSize,
                  tintColor: themeController.current?.textColor,
                }}
              />
            </TouchableOpacity>
            <Text
              style={[
                styles.modalText,
                {
                  fontSize: sizes.modalFont,
                  marginBottom: sizes.modalTextMarginBottom,
                  textAlign: 'center',
                  color: themeController.current?.textColor,
                  lineHeight: sizes.modalLineHeight,
                },
              ]}
            >
              {acceptModalVisibleTitle}
            </Text>
            <View
              style={[
                styles.modalButtonsRow,
                {
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  gap: sizes.modalBtnsGap,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor:
                      themeController.current?.buttonColorPrimaryDefault,
                    height: sizes.modalBtnHeight,
                    width: sizes.modalBtnWidth,
                    borderRadius: sizes.modalBtnBorderRadius,
                  },
                ]}
                onPress={() => setAcceptModalVisible(false)}
              >
                <Text
                  style={{
                    color: themeController.current?.buttonTextColorPrimary,
                    fontSize: sizes.modalBtnFont,
                  }}
                >
                  {t('common.no')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor: themeController.current?.backgroundColor,
                    height: sizes.modalBtnHeight,
                    width: sizes.modalBtnWidth,
                    borderRadius: sizes.modalBtnBorderRadius,
                    borderWidth: 1,
                    borderColor:
                      themeController.current?.buttonColorPrimaryDefault,
                  },
                ]}
                onPress={() => acceptModalVisibleFunc()}
              >
                <Text
                  style={{
                    color: themeController.current?.buttonColorPrimaryDefault,
                    fontSize: sizes.modalBtnFont,
                  }}
                >
                  {t('common.yes')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal смены пароля */}
      <Modal visible={changePasswordModal} transparent animationType='fade'>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: themeController.current?.backgroundColor,
                width: sizes.modalWidth,
                padding: sizes.modalPadding,
                borderRadius: sizes.modalBtnBorderRadius,
              },
              // isWebLandscape && { height: sizes.modalHeight },
            ]}
          >
            <TouchableOpacity
              style={[
                {
                  position: 'absolute',
                  top: sizes.modalCloseBtnTopRightPosition,
                  right: sizes.modalCloseBtnTopRightPosition,
                },
              ]}
              onPress={() => showPasswordModal(false)}
            >
              <Image
                source={icons.cross}
                style={{
                  width: sizes.modalIconSize,
                  height: sizes.modalIconSize,
                  tintColor: themeController.current?.textColor,
                }}
              />
            </TouchableOpacity>
            <Text
              style={[
                styles.modalText,
                {
                  fontSize: sizes.modalFont,
                  marginBottom: sizes.modalTextMarginBottom,
                  textAlign: 'center',
                  color: themeController.current?.textColor,
                  lineHeight: sizes.modalLineHeight,
                },
              ]}
            >
              {user.current?.is_password_exist
                ? t('my_profile.change_password')
                : t('my_profile.create_password')}
            </Text>

            {/* Поля ввода паролей */}
            <View style={{ width: '100%', marginBottom: sizes.fieldMargin }}>
              {/* Старый пароль — только если пароль уже существует */}
              {user.current?.is_password_exist && (
                <View
                  style={[
                    styles.profileInfoString,
                    {
                      backgroundColor:
                        themeController.current?.formInputBackground,
                      borderRadius: sizes.infoFieldBorderRadius,
                      height: sizes.btnHeight,
                      paddingHorizontal: sizes.infoFieldPaddingH,
                      marginBottom: sizes.modalFieldMargin,
                      position: 'relative',
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.profileInfoLabel,
                        {
                          fontSize: sizes.labelFont,
                          color: themeController.current?.formInputLabelColor,
                        },
                      ]}
                    >
                      {t('my_profile.old_password')}
                    </Text>

                    <CustomTextInput
                      secureTextEntry={!showOldPassword}
                      value={oldPassword}
                      onChangeText={setOldPassword}
                      style={[
                        styles.profileInfoText,
                        {
                          fontSize: sizes.fieldFont,
                          color: themeController.current?.formInputTextColor,
                        },
                      ]}
                    />
                  </View>

                  {/* ICON */}
                  <TouchableOpacity
                    onPress={() => setShowOldPassword((p) => !p)}
                    style={{
                      position: 'absolute',
                      right: isRTL ? undefined : sizes.iconSize / 2,
                      left: isRTL ? sizes.iconSize / 2 : undefined,
                      top: '56%',
                      transform: [{ translateY: -sizes.iconSize / 2 }],
                    }}
                  >
                    <Image
                      source={showOldPassword ? icons.eyeOpen : icons.eyeClosed}
                      style={{
                        width: sizes.iconSize,
                        height: sizes.iconSize,
                        tintColor: themeController.current?.formInputLabelColor,
                      }}
                    />
                  </TouchableOpacity>
                </View>
              )}

              {/* Новый пароль */}
              <View
                style={[
                  styles.profileInfoString,
                  {
                    backgroundColor:
                      themeController.current?.formInputBackground,
                    borderRadius: sizes.infoFieldBorderRadius,
                    height: sizes.btnHeight,
                    paddingHorizontal: sizes.infoFieldPaddingH,
                    marginBottom: sizes.modalFieldMargin,
                    position: 'relative',
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.profileInfoLabel,
                      {
                        fontSize: sizes.labelFont,
                        color: themeController.current?.formInputLabelColor,
                      },
                    ]}
                  >
                    {t('my_profile.new_password')}
                  </Text>

                  <CustomTextInput
                    secureTextEntry={!showNewPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    style={[
                      styles.profileInfoText,
                      {
                        fontSize: sizes.fieldFont,
                        color: themeController.current?.formInputTextColor,
                      },
                    ]}
                  />
                </View>

                {/* ICON */}
                <TouchableOpacity
                  onPress={() => setShowNewPassword((p) => !p)}
                  style={{
                    position: 'absolute',
                    right: isRTL ? undefined : sizes.iconSize / 2,
                    left: isRTL ? sizes.iconSize / 2 : undefined,
                    top: '56%',
                    transform: [{ translateY: -sizes.iconSize / 2 }],
                  }}
                >
                  <Image
                    source={showNewPassword ? icons.eyeOpen : icons.eyeClosed}
                    style={{
                      width: sizes.iconSize,
                      height: sizes.iconSize,
                      tintColor: themeController.current?.formInputLabelColor,
                    }}
                  />
                </TouchableOpacity>
              </View>

              {/* Повтор нового пароля */}
              <View
                style={[
                  styles.profileInfoString,
                  {
                    backgroundColor:
                      themeController.current?.formInputBackground,
                    borderRadius: sizes.infoFieldBorderRadius,
                    height: sizes.btnHeight,
                    paddingHorizontal: sizes.infoFieldPaddingH,
                    marginBottom: sizes.modalFieldMargin,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.profileInfoLabel,
                      {
                        fontSize: sizes.labelFont,
                        color: themeController.current?.formInputLabelColor,
                      },
                    ]}
                  >
                    {t('my_profile.repeat_new_password')}
                  </Text>

                  <CustomTextInput
                    secureTextEntry={true}
                    value={repeatPassword}
                    onChangeText={setRepeatPassword}
                    style={[
                      styles.profileInfoText,
                      {
                        fontSize: sizes.fieldFont,
                        color: themeController.current?.formInputTextColor,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            <View
              style={[
                styles.modalButtonsRow,
                {
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  gap: sizes.modalBtnsGap,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor:
                      themeController.current?.buttonColorPrimaryDefault,
                    height: sizes.modalBtnHeight,
                    width: sizes.modalBtnWidth,
                    borderRadius: sizes.modalBtnBorderRadius,
                  },
                ]}
                onPress={() => showPasswordModal(false)}
              >
                <Text
                  style={{
                    color: themeController.current?.buttonTextColorPrimary,
                    fontSize: sizes.modalBtnFont,
                  }}
                >
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor:
                      themeController.current?.buttonTextColorPrimary,
                    height: sizes.modalBtnHeight,
                    width: sizes.modalBtnWidth,
                    borderRadius: sizes.modalBtnBorderRadius,
                    borderWidth: 1,
                    borderColor:
                      themeController.current?.buttonColorPrimaryDefault,
                  },
                ]}
                onPress={async () => {
                  if (newPassword !== repeatPassword) {
                    alert(t('errors.passwords_not_match'));
                    return;
                  }

                  if (user.current?.is_password_exist) {
                    const res = await session.changePassword(
                      oldPassword,
                      newPassword,
                    );
                    if (!res.success) {
                      alert(t(`errors.${res.error}`));
                      return;
                    }
                  } else {
                    const res = await session.createPassword(newPassword);
                    if (!res.success) {
                      alert(t(`errors.${res.error}`));
                      return;
                    }
                  }

                  showPasswordModal(false);
                }}
              >
                <Text
                  style={{
                    color: themeController.current?.buttonColorPrimaryDefault,
                    fontSize: sizes.modalBtnFont,
                  }}
                >
                  {user.current?.is_password_exist
                    ? t('common.change')
                    : t('common.create')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal выбора изображения */}
      <ImagePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onAdd={async (uris) => {
          if (uris?.length > 0) {
            await uploadAvatar(uris[0]);
          }
        }}
        theme={themeController.current}
      />

      {/* Subscriptions */}
      <SubscriptionsModal
        visible={subscriptionsModal}
        main={false}
        closeModal={() => {
          setSubscriptionsModal(false);
        }}
      />
      <PaymentMethodsModal
        visible={paymentMethodsModalVisible}
        onClose={() => setPaymentMethodsModalVisible(false)}
      />
      <CouponsModal
        visible={couponsModalVisible}
        onClose={() => setCouponsModalVisible(false)}
      />
      <Modal
        visible={contactUsVisible}
        animationType='slide'
        transparent={isWebLandscape}
      >
        <ModalContent
          title={t('settings.contact_us')}
          onClose={() => setContactUsVisible(false)}
          content={''}
          contactForm={true}
        />
      </Modal>

      <Modal
        visible={feedbackVisible}
        animationType='slide'
        transparent={isWebLandscape}
      >
        <ModalContent
          title={t('settings.feedback')}
          onClose={() => setFeedbackVisible(false)}
          content={''}
          feedback={true}
        />
      </Modal>
      <UpdateUserDataModal
        visible={updateUserDataModalVisible}
        onClose={() => setUpdateUserDataModalVisible(false)}
        userData={{
          name: userState?.name,
          surname: userState?.surname,
          about: userState?.about,
        }}
        onSave={handleUpdateUserData}
        isLoading={isUpdating}
      />
      <UpdateEmailModal
        visible={updateEmailModalVisible}
        onClose={() => setUpdateEmailModalVisible(false)}
        currentEmail={userState?.email}
        onSave={handleUpdateEmail}
        isLoading={isUpdating}
      />
      <UpdatePhoneModal
        visible={updatePhoneModalVisible}
        onClose={() => setUpdatePhoneModalVisible(false)}
        currentPhone={userState?.phoneNumber}
        onSave={handleUpdatePhone}
        isLoading={isUpdating}
      />
    </ScrollView>
  );
}

function InfoField({
  label,
  value,
  changeInfo,
  onEditPress,
  multiline = false,
  baseFont,
  fieldPadding,
  fieldMargin,
  iconSize,
  isLandscape,
  btnHeight,
  height,
  sizes,
  isRTL,
  field,
  editMode = false,
  setEditingFields,
}) {
  const { themeController } = useComponentContext();
  const [currentValue, setCurrentValue] = useState(value);

  // const handleSave = () => {
  //   changeInfo(currentValue);
  //   setEditMode(false);
  // };

  // const handleCancel = () => {
  //   setCurrentValue(value);
  //   setEditMode(false);
  // };

  return (
    <View
      style={[
        styles.profileInfoString,
        {
          width:
            Platform.OS === 'web' && isLandscape
              ? multiline || field === 'email' || field === 'phoneNumber'
                ? '48.5%'
                : '100%'
              : '100%',
          height: btnHeight,
          marginBottom: fieldMargin,
          backgroundColor: editMode
            ? themeController.current?.formInputBackgroundEditMode
            : themeController.current?.formInputBackground,
          borderRadius: sizes.infoFieldBorderRadius,
          paddingHorizontal: sizes.infoFieldPaddingH,
        },
        multiline && { alignItems: 'flex-start' },
        // multiline &&
        //   Platform.OS === 'web' &&
        //   isLandscape && {
        //     [isRTL ? 'marginLeft' : 'marginRight']: sizes.infoFieldsGap * 4,
        //   },
        multiline && isRTL && { flexDirection: 'row-reverse' },
      ]}
    >
      <View
        style={
          multiline
            ? {
                paddingVertical: sizes.fieldPaddingVertical,
                alignItems: 'flex-start',
                flex: 1,
                height: '100%',
              }
            : { flex: 1 }
        }
      >
        <Text
          style={[
            styles.profileInfoLabel,
            {
              fontSize: sizes.labelFont,
              color: themeController.current?.formInputLabelColor,
              marginBottom: sizes.labelMarginBottom,
            },
            multiline && isRTL && { alignSelf: 'flex-end' },
          ]}
        >
          {label}
        </Text>
        {editMode ? (
          <CustomTextInput
            style={[
              styles.profileInfoText,
              {
                fontSize: baseFont,
                color: themeController.current?.formInputTextColor,
                minHeight: baseFont * 0.9,
              },
              multiline && { flex: 1 },
            ]}
            value={currentValue}
            onChangeText={(text) => {
              setEditingFields((prev) => ({ ...prev, [field]: text }));
              setCurrentValue(text);
            }}
            multiline={multiline}
            autoFocus={true}
          />
        ) : (
          <Text
            style={[
              styles.profileInfoText,
              {
                fontSize: baseFont,
                color: themeController.current?.formInputTextColor,
                minHeight: baseFont * 0.9,
              },
              multiline
                ? { overflow: 'auto' }
                : { overflow: 'hidden', maxHeight: sizes.oneLineInputHeight },
            ]}
          >
            {value}
          </Text>
        )}
      </View>

      {!editMode && (field === 'email' || field === 'phoneNumber') && (
        // ? (
        //   <View
        //     style={[
        //       styles.editPanel,
        //       { gap: sizes.editPanelGap },
        //       multiline && { marginTop: sizes.fieldPaddingVertical },
        //     ]}
        //   >
        //     <TouchableOpacity
        //       onPress={() => {
        //         setEditMode(false);
        //         setTextValue(value);
        //       }}
        //     >
        //       <Image
        //         source={icons.cancel}
        //         style={{
        //           width: iconSize,
        //           height: iconSize,
        //           resizeMode: 'contain',
        //           tintColor: themeController.current?.unactiveTextColor,
        //         }}
        //       />
        //     </TouchableOpacity>
        //     <TouchableOpacity
        //       onPress={async () => {
        //         setEditMode(false);
        //         await changeInfo(textValue);
        //       }}
        //     >
        //       <Image
        //         source={icons.checkCircle}
        //         style={{
        //           width: iconSize,
        //           height: iconSize,
        //           resizeMode: 'contain',
        //           tintColor: themeController.current?.unactiveTextColor,
        //         }}
        //       />
        //     </TouchableOpacity>
        //   </View>
        // ) :
        <TouchableOpacity
          onPress={onEditPress}
          style={[multiline && { marginTop: sizes.fieldPaddingVertical }]}
        >
          <Image
            source={icons.edit}
            style={{
              width: iconSize,
              height: iconSize,
              resizeMode: 'contain',
              tintColor: themeController.current?.unactiveTextColor,
            }}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  userProfile: { flex: 1 },
  profileBack: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  profileInfoString: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakLine: { width: '100%', height: 1 },
  primaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    // fontWeight: 'bold'
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    // fontWeight: 'bold'
  },
  primaryReverseBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryReverseBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  profileInfoLabel: {
    // fontWeight: 'bold'
  },
  profileInfoText: {
    width: '100%',
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
  },
  editPanel: { flexDirection: 'row' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalCard: { width: '80%', position: 'relative' },
  modalButtonsRow: { justifyContent: 'center' },
  modalBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
  },
  modalText: {
    fontFamily: 'Rubik-Bold',
  },
});
