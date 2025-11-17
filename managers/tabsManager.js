import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

const subTabsList = ['new', 'waiting', 'in-progress', 'done'];

export default function tabsManager({ name, defaultTab, list }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [activeSubTab, setActiveSubTab] = useState(subTabsList[0]);
  const [isRegisterNewUser, setRegisterNewUser] = useState(false);
  const [isOTPAuth, setOTPAuth] = useState(false);

  // Загружаем сохранённое состояние (только web)
  useEffect(() => {
    if (Platform.OS === 'web') {
      const saved = localStorage.getItem(`tabs-${name}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.activeTab && list.includes(parsed.activeTab)) {
          setActiveTab(parsed.activeTab);
        }
        if (
          name === 'app' &&
          parsed.activeSubTab &&
          subTabsList.includes(parsed.activeSubTab)
        ) {
          setActiveSubTab(parsed.activeSubTab);
        }
      }
    }
  }, []);

  // Сохраняем изменения в localStorage
  useEffect(() => {
    if (Platform.OS === 'web') {
      const payload = { activeTab };
      if (name === 'app' && activeTab !== 'providers') {
        payload.activeSubTab = activeSubTab;
      }
      if (name !== 'profile') {
        localStorage.setItem(`tabs-${name}`, JSON.stringify(payload));
      }
    }
  }, [activeTab, activeSubTab]);

  return {
    active: activeTab,
    list,
    activeSubTab:
      name === 'app' && activeTab !== 'providers' ? activeSubTab : null,
    subList: name === 'app' && activeTab !== 'providers' ? subTabsList : null,
    goTo: (tabName) => setActiveTab(tabName),
    goToIndex: (index) => setActiveTab(list[index]),
    goToSub: (subTab) => setActiveSubTab(subTab),
    registerControl: {
      state: isRegisterNewUser,
      goToRegisterScreen: () => setRegisterNewUser(true),
      leaveRegisterScreen: () => setRegisterNewUser(false),
    },
    authControl: {
      state: isOTPAuth,
      switch: () => setOTPAuth((prev) => !prev),
    },
  };
}
