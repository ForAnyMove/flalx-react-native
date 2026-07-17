import React from 'react';
import { Modal, View, TouchableOpacity, Image, Platform } from 'react-native';
import { useComponentContext } from '../../context/globalAppContext';
import { useWindowInfo } from '../../context/windowContext';
import { icons } from '../../constants/icons';
import MfaSetupScreen from '../../screens/register/MfaSetupScreen';

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
  const { themeController, languageController } = useComponentContext();
  const theme = themeController.current;
  const isRTL = languageController.isRTL;
  const { isLandscape } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  return (
    <Modal visible={visible} animationType='slide' transparent={false} onRequestClose={onClose}>
      {visible && (
        <View style={{ flex: 1, backgroundColor: theme.backgroundColor }}>
          {!showSkip && (
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: isWebLandscape ? 24 : 48,
                [isRTL ? 'left' : 'right']: 20,
                zIndex: 10,
              }}
              onPress={onClose}
            >
              <Image source={icons.cross} style={{ width: 22, height: 22, tintColor: theme.textColor }} />
            </TouchableOpacity>
          )}
          <MfaSetupScreen optional={showSkip} onDone={onDone} onSkip={showSkip ? onClose : undefined} />
        </View>
      )}
    </Modal>
  );
}
