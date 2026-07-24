import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import themeManager from '../managers/themeManager';
import sessionManager from '../managers/sessionManager';
import languageManager from '../managers/languageManager';
import tabsManager from '../managers/tabsManager';
import jobsManager from '../managers/jobsManager';
import providersManager from '../managers/providersManager';
import { View, ActivityIndicator } from 'react-native';
import { getSubscriptionPlans } from '../src/api/subscriptions';
import { getImageLimits } from '../src/api/images';
import authTabsManager from '../managers/authTabsManager';
import jobTypeManager from '../managers/jobTypeManager';
import { useGeolocation } from '../managers/useGeolocation';
import couponsManager from '../managers/couponsManager';
import { logError } from '../utils/log_util';
import paymentsManager from '../managers/paymentsManager';

const ComponentContext = createContext();

const appTabsList = ['client', 'business'];
// const appTabsList = ['client', 'providers', 'business'];
const profileTabsList = ['profile', 'professions', 'settings'];

export const ComponentProvider = ({ children }) => {
  const themeController = themeManager();
  const [loadingCounter, setLoadingCounter] = useState(0);

  const setAppLoading = (isLoading) => {
    setLoadingCounter(prev => {
      if (isLoading) return prev + 1;
      return Math.max(prev - 1, 0);
    });
  };

  const { session, user, subscription, usersReveal, isLoader } = sessionManager({ setAppLoading });
  const languageController = languageManager();
  const appTabController = tabsManager({ name: 'app', defaultTab: appTabsList[0], list: appTabsList });
  const profileTabController = tabsManager({ name: 'profile', defaultTab: profileTabsList[0], list: profileTabsList });
  const geolocationController = useGeolocation();
  const couponsManagerController = couponsManager({ session });
  const paymentsManagerController = paymentsManager({ session });

  const { registerControl, forgotPassControl } = authTabsManager();

  const jobsController = jobsManager({ session, user, geolocation: geolocationController });
  const jobTypesController = jobTypeManager({ session });

  const providersController = providersManager({ session });
  const [subscriptionPlans, setSubscriptionPlans] = useState(null);
  const [imageLimits, setImageLimits] = useState(null);

  useEffect(() => {
    if (session.token == null || subscriptionPlans != null) return;


    const fetchPlans = async () => {
      try {
        const { plans } = await getSubscriptionPlans(session);
        setSubscriptionPlans(plans);

      } catch (error) {
        logError('Error fetching subscription plans:', error);
      }
    }
    fetchPlans();

  }, [session.token, subscriptionPlans]);

  useEffect(() => {
    // Public endpoint, no auth required — fetch once on mount so it's
    // already available for pre-auth uploaders too (e.g. RegisterScreen's
    // avatar picker, which runs before session.token exists).
    if (imageLimits != null) return;

    const fetchImageLimits = async () => {
      try {
        const limits = await getImageLimits(session);
        setImageLimits(limits);
      } catch (error) {
        logError('Error fetching image limits:', error);
      }
    }
    fetchImageLimits();

  }, [imageLimits]);

  return (
    <ComponentContext.Provider
      value={{
        themeController,
        session,
        user,
        subscription,
        usersReveal,
        languageController,
        appTabController,
        profileTabController,
        jobsController,
        jobTypesController,
        providersController,
        setAppLoading,
        subscriptionPlans,
        imageLimits,
        isLoader,
        registerControl,
        forgotPassControl,
        geolocationController,
        couponsManagerController,
        paymentsManagerController,
      }}
    >
      {children}
      {loadingCounter > 0 && (
        <View
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
          pointerEvents="auto"
        >
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}
    </ComponentContext.Provider>
  );
};

export const useComponentContext = () => useContext(ComponentContext);
