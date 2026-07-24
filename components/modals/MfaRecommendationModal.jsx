import React, { useMemo, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../context/globalAppContext';
import { useWindowInfo } from '../../context/windowContext';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';
import { icons } from '../../constants/icons';
import MfaSetupModal from './MfaSetupModal';
import { setMfaRecommendCooldownUntil, MFA_RECOMMEND_COOLDOWN_MS } from '../../src/auth/mfaRecommendCooldown';
import { logError } from '../../utils/log_util';

/**
 * Post-login/registration nudge shown when GET /users/me (or the
 * verify-phone/mfa-verify response — see managers/sessionManager.js)
 * reports setupRecommended. MFA is optional now, so this is a dismissible
 * popup, not a blocking nextStep screen — see AppMainScreen.jsx for when
 * it's opened.
 *
 * Deliberately skips the reference design's header illustration and
 * "Learn more" link (starts straight from the "Recommended" badge/text), and
 * uses the app's own icon set (Ionicons, already used elsewhere e.g.
 * ContactSupportModal.jsx) and theme tokens instead of the mockup's — same
 * "structure from the design, style from our app" approach as
 * ContactSupportModal.
 */
export default function MfaRecommendationModal({ visible, onClose }) {
  const { t } = useTranslation();
  const { themeController, languageController, user } = useComponentContext();
  const theme = themeController.current;
  const isRTL = languageController.isRTL;
  const { height, isLandscape } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const [setupVisible, setSetupVisible] = useState(false);

  // Any interaction — closing, "Not now", or even just clicking "Enable"
  // without finishing setup — snoozes the popup for 2 weeks, recorded at the
  // moment of the click (not just on final close), per the requirement that
  // an abandoned/incomplete flow still counts.
  const recordDismissal = () => {
    const userId = user?.current?.id;
    if (!userId) return;
    setMfaRecommendCooldownUntil(userId, Date.now() + MFA_RECOMMEND_COOLDOWN_MS).catch((e) =>
      logError('mfaRecommendCooldown write error:', e)
    );
  };

  const handleClose = () => {
    recordDismissal();
    onClose();
  };

  const handleEnablePress = () => {
    recordDismissal();
    setSetupVisible(true);
  };

  const handleSetupDone = () => {
    setSetupVisible(false);
    onClose();
  };

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);
    const scale = isWebLandscape ? web : mobile;

    return {
      modalWidth: isWebLandscape ? scale(460) : '92%',
      borderRadius: scale(16),
      padding: isWebLandscape ? scale(28) : scale(22),
      closeIconSize: scale(18),
      badgeFont: scale(12),
      titleFont: scale(20),
      subtitleFont: scale(14),
      fieldFont: scale(15),
      helpFont: scale(12.5),
      btnHeight: scale(52),
      btnFont: scale(16),
      gap: scale(16),
      smallGap: scale(8),
    };
  }, [isWebLandscape, height]);

  const row = { flexDirection: isRTL ? 'row-reverse' : 'row' };
  const textAlign = isRTL ? 'right' : 'left';
  const iconMargin = { marginRight: isRTL ? 0 : sizes.smallGap, marginLeft: isRTL ? sizes.smallGap : 0 };

  const BenefitRow = ({ icon, text }) => (
    <View style={[row, { alignItems: 'center', marginBottom: sizes.smallGap }]}>
      <Ionicons name={icon} size={16} color={theme.primaryColor} style={iconMargin} />
      <Text style={{ flex: 1, fontSize: sizes.helpFont, color: theme.textColor, textAlign }}>{text}</Text>
    </View>
  );

  return (
    <>
      <Modal visible={visible && !setupVisible} transparent animationType='fade' onRequestClose={handleClose}>
        {visible && !setupVisible && (
          <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' }}>
            <View
              style={{
                width: sizes.modalWidth,
                maxHeight: '90%',
                backgroundColor: theme.backgroundColor,
                borderRadius: sizes.borderRadius,
                padding: sizes.padding,
              }}
            >
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  top: sizes.padding / 1.5,
                  [isRTL ? 'left' : 'right']: sizes.padding / 1.5,
                  zIndex: 10,
                }}
                onPress={handleClose}
              >
                <Image
                  source={icons.cross}
                  style={{ width: sizes.closeIconSize, height: sizes.closeIconSize, tintColor: theme.textColor }}
                />
              </TouchableOpacity>

              <View
                style={[
                  row,
                  {
                    alignSelf: 'center',
                    alignItems: 'center',
                    backgroundColor: `${theme.primaryColor}14`,
                    paddingHorizontal: sizes.smallGap * 1.5,
                    paddingVertical: sizes.smallGap * 0.75,
                    borderRadius: 20,
                    marginBottom: sizes.gap,
                  },
                ]}
              >
                <Ionicons name='settings-outline' size={13} color={theme.primaryColor} style={iconMargin} />
                <Text style={{ color: theme.primaryColor, fontFamily: 'Rubik-Medium', fontSize: sizes.badgeFont }}>
                  {t('auth.mfa_recommend.badge')}
                </Text>
              </View>

              <Text
                style={{
                  fontSize: sizes.titleFont,
                  fontFamily: 'Rubik-Bold',
                  color: theme.textColor,
                  textAlign: 'center',
                  marginBottom: sizes.smallGap,
                }}
              >
                {t('auth.mfa_recommend.title')}
              </Text>
              <Text
                style={{
                  fontSize: sizes.subtitleFont,
                  color: theme.unactiveTextColor,
                  textAlign: 'center',
                  marginBottom: sizes.gap,
                }}
              >
                {t('auth.mfa_recommend.subtitle')}
              </Text>

              <View
                style={[
                  row,
                  {
                    alignItems: 'center',
                    backgroundColor: theme.formInputBackground,
                    borderRadius: sizes.borderRadius / 1.5,
                    padding: sizes.smallGap * 1.5,
                    marginBottom: sizes.gap,
                  },
                ]}
              >
                <Ionicons name='phone-portrait-outline' size={20} color={theme.primaryColor} style={iconMargin} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: sizes.helpFont, color: theme.unactiveTextColor, textAlign }}>
                    {t('auth.mfa_recommend.method_label')}
                  </Text>
                  <Text style={{ fontSize: sizes.fieldFont, fontFamily: 'Rubik-Medium', color: theme.textColor, textAlign }}>
                    {t('auth.mfa_recommend.method_value')}
                  </Text>
                </View>
                <Ionicons name='checkmark-circle' size={20} color={theme.verifiedMarkerColor} />
              </View>

              <View
                style={{
                  borderWidth: 1,
                  borderColor: theme.borderColor,
                  borderRadius: sizes.borderRadius / 1.5,
                  padding: sizes.smallGap * 1.5,
                  marginBottom: sizes.gap,
                }}
              >
                <BenefitRow icon='key-outline' text={t('auth.mfa_recommend.benefit_extra_protection')} />
                <BenefitRow icon='finger-print-outline' text={t('auth.mfa_recommend.benefit_unauthorized_access')} />
                <BenefitRow icon='time-outline' text={t('auth.mfa_recommend.benefit_setup_time')} />
              </View>

              <View style={[row, { alignItems: 'flex-start', marginBottom: sizes.gap }]}>
                <Ionicons name='lock-closed-outline' size={14} color={theme.unactiveTextColor} style={[iconMargin, { marginTop: 2 }]} />
                <Text style={{ flex: 1, fontSize: sizes.helpFont, color: theme.unactiveTextColor, textAlign }}>
                  {t('auth.mfa_recommend.disclaimer')}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleEnablePress}
                style={{
                  height: sizes.btnHeight,
                  borderRadius: sizes.borderRadius / 1.5,
                  backgroundColor: theme.buttonColorPrimaryDefault,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: sizes.smallGap,
                }}
              >
                <Text style={{ color: theme.buttonTextColorPrimary, fontFamily: 'Rubik-Medium', fontSize: sizes.btnFont }}>
                  {t('auth.mfa_recommend.enable_button')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleClose}
                style={{
                  height: sizes.btnHeight,
                  borderRadius: sizes.borderRadius / 1.5,
                  borderWidth: 1,
                  borderColor: theme.borderColor,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: theme.textColor, fontFamily: 'Rubik-Medium', fontSize: sizes.btnFont }}>
                  {t('auth.mfa_recommend.not_now_button')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

      <MfaSetupModal visible={setupVisible} onClose={handleSetupDone} onDone={handleSetupDone} showSkip />
    </>
  );
}
