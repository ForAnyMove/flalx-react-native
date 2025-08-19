import { createContext, useContext, useRef, useState } from 'react';
import { JOB_SUB_TYPES } from '../constants/jobSubTypes';
import { JOB_TYPES } from '../constants/jobTypes';
import { LICENSES } from '../constants/licenses';
import { LIGHT_THEME } from '../constants/themes';
import themeManager from '../managers/themeManager';
import sessionManager from '../managers/sessionManager';
import languageManager from '../managers/languageManager';

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

export const ComponentProvider = ({ children }) => {
  // const [myProfile, setMyProfile] = useState(myProfileMock);
  const themeController = themeManager();
  const {session, user} = sessionManager();
  const languageController = languageManager();
  
  return (
    <ComponentContext.Provider
      value={{
        themeController,
        session,
        user,
        languageController,
      }}
    >
      {children}
    </ComponentContext.Provider>
  );
};

export const useComponentContext = () => useContext(ComponentContext);
