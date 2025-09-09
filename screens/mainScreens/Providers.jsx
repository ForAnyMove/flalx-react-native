import { useEffect, useState } from 'react';
import { ScrollView, Text, View, Platform, Modal } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import JobTypeSelector from '../../components/JobTypeSelector';
import ProviderSummaryBlock from '../../components/ProviderSummaryBlock';
import SearchPanel from '../../components/SearchPanel';
import { useComponentContext } from '../../context/globalAppContext';
import { useWindowInfo } from '../../context/windowContext';
import JobModalWrapper from '../../components/JobModalWrapper';
import NewJobModal from '../../components/NewJobModal';

export default function Providers() {
  const { themeController, providersController, languageController } =
    useComponentContext();
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const { isLandscape, height } = useWindowInfo();
  const isRTL = languageController.isRTL;
  const [newJobModalVisible, setNewJobModalVisible] = useState(false);
  const [chosenUserId, setChosenUserId] = useState(null);

  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  if (providersController.error)
    return <Text>{providersController.error}</Text>;

  const filteredProviders = providersController.providers?.filter(
    (user) =>
      (filteredJobs.length > 0
        ? user?.jobTypes?.some((jobType) => filteredJobs.includes(jobType))
        : user) &&
      (user?.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
        user?.surname?.toLowerCase().includes(searchValue.toLowerCase()))
  );
  
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: themeController.current?.backgroundColor,
          paddingVertical: isWebLandscape ? height * 0.03 : RFValue(14),
        },
      ]}
    >
      <View>
        <SearchPanel
          searchValue={searchValue}
          setSearchValue={setSearchValue}
        />
      </View>
      <View style={{ width: isWebLandscape ? '70%' : '100%' }}>
        <JobTypeSelector
          selectedTypes={filteredJobs}
          setSelectedTypes={setFilteredJobs}
        />
      </View>
      {providersController.providers.length <= 0 ? (
        <View>
          <Text>Loading...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            flexDirection: isWebLandscape ? 'row' : 'column',
            gap: isWebLandscape ? '2%' : 0,
            flexWrap: isWebLandscape ? 'wrap' : 'nowrap',
            justifyContent: isWebLandscape
              ? isRTL
                ? 'flex-end'
                : 'flex-start'
              : 'flex-start',
          }}
        >
          {filteredProviders?.map((user, index) => (
            <ProviderSummaryBlock key={index} user={user} chooseUser={() => {
              setChosenUserId(user?.id);
              setNewJobModalVisible(true);
            }} />
          ))}
        </ScrollView>
      )}
      {isWebLandscape ? (
        <JobModalWrapper visible={newJobModalVisible} main={true}>
          <NewJobModal
            closeModal={() => setNewJobModalVisible(false)}
            executorId={chosenUserId}
          />
        </JobModalWrapper>
      ) : (
        <Modal visible={newJobModalVisible} animationType='slide' transparent>
          <NewJobModal
            closeModal={() => setNewJobModalVisible(false)}
            executorId={chosenUserId}
          />
        </Modal>
      )}
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    paddingHorizontal: RFValue(10),
  },
};
