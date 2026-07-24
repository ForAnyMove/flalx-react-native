import { useEffect, useRef, useState } from 'react';
import { Text, Button } from 'react-native';
import { useComponentContext } from '../context/globalAppContext';
import Providers from './mainScreens/Providers';
import Store from './mainScreens/Store';
import Header from '../components/Header';
import Jobs from './mainScreens/Jobs';
import MfaRecommendationModal from '../components/modals/MfaRecommendationModal';
import { getMfaRecommendCooldownUntil } from '../src/auth/mfaRecommendCooldown';

export default function AppMainScreen({ switchToProfile, sidebarWidth }) {
  const { session, appTabController, user } = useComponentContext();

  // AppMainScreen only mounts once App.js's nextStep/firstauth routing has
  // fully resolved into the actual app — for a fresh registration that's
  // after the name/account-type/professions forms too (RegisterScreen.jsx),
  // for an existing login it's immediately. Either way this is the right
  // place for the one-time "consider enabling MFA" nudge. Shown at most once
  // per mount (a relogin/app reload can show it again), and skipped entirely
  // while snoozed — see components/modals/MfaRecommendationModal.jsx (records
  // the snooze on any action) and src/auth/mfaRecommendCooldown.js.
  const [mfaRecommendVisible, setMfaRecommendVisible] = useState(false);
  const mfaRecommendShownRef = useRef(false);

  useEffect(() => {
    const userId = user.current?.id;
    if (
      !userId ||
      !session.mfa?.setupRecommended ||
      session.mfa?.enabled === true ||
      mfaRecommendShownRef.current
    ) {
      return;
    }
    let cancelled = false;
    (async () => {
      const cooldownUntil = await getMfaRecommendCooldownUntil(userId);
      if (cancelled || cooldownUntil) return;
      mfaRecommendShownRef.current = true;
      setMfaRecommendVisible(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [session.mfa?.setupRecommended, session.mfa?.enabled, user.current?.id]);

  function renderScreen() {
    const isClient = user?.current?.account_type === 'client';
    
    if (isClient) {
      return <Store sidebarWidth={sidebarWidth} />;
    }

    switch (appTabController.active) {
      case 'client':
        return <Store sidebarWidth={sidebarWidth} />;
      case 'providers':
        return <Providers />;
      case 'business':
        return <Jobs sidebarWidth={sidebarWidth} />;
      default:
        <Button title='Sign Out' onPress={() => session?.signOut()} />;
    }
  }
  return (
    <>
      <Header switchToProfile={switchToProfile} />
      {renderScreen()}
      <MfaRecommendationModal
        visible={mfaRecommendVisible}
        onClose={() => setMfaRecommendVisible(false)}
      />
    </>
  );
}
