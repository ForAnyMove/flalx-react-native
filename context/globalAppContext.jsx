import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { JOB_SUB_TYPES } from '../constants/jobSubTypes';
import { JOB_TYPES } from '../constants/jobTypes';
import { LICENSES } from '../constants/licenses';
import { LIGHT_THEME } from '../constants/themes';
import themeManager from '../managers/themeManager';
import sessionManager from '../managers/sessionManager';
import languageManager from '../managers/languageManager';
import tabsManager from '../managers/tabsManager';
import jobsManager from '../managers/jobsManager';
import providersManager from '../managers/providersManager';
import { View, ActivityIndicator } from 'react-native';
import { getSubscriptionPlans } from '../src/api/subscriptions';
import authTabsManager from '../managers/authTabsManager';
import jobTypeManager from '../managers/jobTypeManager';
import { useGeolocation } from '../managers/useGeolocation';

const ComponentContext = createContext();


const myProfileMock = {
  id: 'user_010',
  name: 'Ivan',
  surname: 'Petrov',
  about: 'Supervises large infrastructure projects.',
  location: 'Moscow, Russia',
  email: 'ivan.petrov@example.ru',
  phoneNumber: '+7-915-555-1234',
  professions: ['license_1', 'license_2'],
  jobTypes: ['job_2', 'job_50'],
  jobSubTypes: ['subjob_11', 'subjob_22', 'subjob_33'],
  avatar: 'https://randomuser.me/api/portraits/men/10.jpg',
  profileBack:
    'https://www.muchbetteradventures.com/magazine/content/images/2024/04/mount-everest-at-sunset.jpg',
};

const appTabsList = ['client', 'providers', 'business'];
const profileTabsList = ['profile', 'professions', 'settings'];

export const ComponentProvider = ({ children }) => {
  const themeController = themeManager();
  const { session, user, subscription, usersReveal, isLoader } = sessionManager();
  const languageController = languageManager();
  const appTabController = tabsManager({ name: 'app', defaultTab: appTabsList[0], list: appTabsList });
  const profileTabController = tabsManager({ name: 'profile', defaultTab: profileTabsList[0], list: profileTabsList });

  const { registerControl, authControl, forgotPassControl } = authTabsManager();

  const jobsController = jobsManager({ session, user });
  const jobTypesController = jobTypeManager({ session });
  const geolocationController = useGeolocation();

  const providersController = providersManager({ session });
  const [loadingCounter, setLoadingCounter] = useState(0);
  const [subscriptionPlans, setSubscriptionPlans] = useState(null);

  useEffect(() => {
    if (session.token == null || subscriptionPlans != null) return;


    const fetchPlans = async () => {
      try {
        const { plans } = await getSubscriptionPlans(session);
        console.log(plans);
        setSubscriptionPlans(plans);

      } catch (error) {
        console.error('Error fetching subscription plans:', error);
      }
    }
    fetchPlans();

  }, [session.token, subscriptionPlans]);

  const setAppLoading = (isLoading) => {
    setLoadingCounter(prev => {
      if (isLoading) return prev + 1;
      return Math.max(prev - 1, 0);
    });
  };

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
        isLoader,
        registerControl,
        authControl,
        forgotPassControl,
        geolocationController
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
