import { Text, Button } from 'react-native';
import { useComponentContext } from '../context/globalAppContext';
import Providers from './mainScreens/Providers';
import Store from './mainScreens/Store';
import Header from '../components/Header';
import Jobs from './mainScreens/Jobs';

export default function AppMainScreen({ switchToProfile, sidebarWidth }) {
  const { session, appTabController } = useComponentContext();

  function renderScreen() {
    switch (appTabController.active) {
      case 'store':
        return <Store sidebarWidth={sidebarWidth} />;
      case 'providers':
        return <Providers />;
      case 'jobs':
        return <Jobs sidebarWidth={sidebarWidth} />;
      default:
        <Button title='Выйти' onPress={() => session?.signOut()} />;
    }
  }
  return (
    <>
      <Header switchToProfile={switchToProfile} />
      {renderScreen()}
    </>
  );
}
