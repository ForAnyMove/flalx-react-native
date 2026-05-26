import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../context/globalAppContext';
import { logError, logInfo, logWarn } from '../../utils/log_util';

export default function Step_WaitForEmail({ userId, onVerified }) {
  const { t } = useTranslation();
  const { session, themeController } = useComponentContext();
  const theme = themeController.current;
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      logWarn('[MFA] Step_WaitForEmail rendered without a userId.');
      return;
    }

    const waitForVerification = async () => {
      logInfo(`[MFA] Component mounted, starting verification wait for userId: ${userId}`);
      const result = await session.listenForEmailVerification(userId);
      if (result.success) {
        logInfo(`[MFA] Verification successful for userId: ${userId}. Calling onVerified.`);
        onVerified();
      } else {
        logError(`[MFA] Verification failed for userId: ${userId}. Error: ${result.error}`);
        setError(result.error || t('auth.verification_failed'));
      }
    };

    waitForVerification();
  }, [userId]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.primaryColor} />
      <Text style={[styles.title, { color: theme.textColor }]}>
        {t('auth.waiting_for_email_verification')}
      </Text>
      <Text style={[styles.subtitle, { color: theme.unactiveTextColor }]}>
        {t('auth.check_your_inbox')}
      </Text>
      {error && <Text style={[styles.error, { color: theme.errorColor }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginTop: 20 },
    subtitle: { fontSize: 16, textAlign: 'center', marginTop: 10,},
    error: { fontSize: 14, textAlign: 'center', marginTop: 20 },
});