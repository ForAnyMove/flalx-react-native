import React from 'react';
import { View, TouchableOpacity, Image, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../context/globalAppContext';
import { useWindowInfo } from '../../context/windowContext';
import { icons } from '../../constants/icons';
import { ACCESSIBILITY_HIT_SLOP } from '../../constants/themes';
import MfaSetupScreen from '../../screens/register/MfaSetupScreen';
import AppModal from '../ui/AppModal';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';

/**
 * Reusable wrapper around the same MfaSetupScreen used during registration's
 * post-auth nextStep routing (App.js), for triggering MFA setup on demand
 * from elsewhere (Profile's Security block, MfaRecommendationModal). `showSkip`
 * picks the exit affordance: a real close (X) button for a deliberate
 * self-serve "Set up" action, or MfaSetupScreen's own built-in "Skip for now"
 * link for a recommend-and-dismiss flow.
 *
 * Rendered conditionally on `visible` (not just hidden via the Modal's own
 * prop) so MfaSetupScreen fully remounts on every open — its enroll-on-mount
 * effect only runs once per mount, and a stale QR/secret from a previous
 * open would otherwise linger if the tree stayed mounted underneath.
 */
export default function MfaSetupModal({ visible, onClose, onDone, showSkip = false }) {
  const { t } = useTranslation();
  const { themeController, languageController } = useComponentContext();
  const theme = themeController.current;
  const isRTL = languageController.isRTL;
  const { height, isLandscape } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;
  const scale = isWebLandscape ? (s) => scaleByHeight(s, height) : (s) => scaleByHeightMobile(s, height);

  return (
    <AppModal visible={visible} transparent={false} onRequestClose={onClose}>
      {visible && (
        <View
          style={{ flex: 1, backgroundColor: theme.backgroundColor }}
          accessibilityViewIsModal={true}
          role="dialog"
          aria-modal="true"
        >
          {!showSkip && (
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: isWebLandscape ? scale(24) : scale(48),
                [isRTL ? 'left' : 'right']: scale(20),
                zIndex: 10,
              }}
              onPress={onClose}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('common.close', { defaultValue: 'סגור' })}
              hitSlop={ACCESSIBILITY_HIT_SLOP}
            >
              <Image
                source={icons.cross}
                style={{ width: scale(22), height: scale(22), tintColor: theme.textColor }}
                accessible={false}
                aria-hidden={true}
              />
            </TouchableOpacity>
          )}
          <MfaSetupScreen optional={showSkip} onDone={onDone} onSkip={showSkip ? onClose : undefined} />
        </View>
      )}
    </AppModal>
  );
}
