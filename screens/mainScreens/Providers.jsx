import { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  Platform,
  Modal,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import JobTypeSelector from '../../components/JobTypeSelector';
import ProviderSummaryBlock from '../../components/ProviderSummaryBlock';
import SearchPanel from '../../components/SearchPanel';
import { useComponentContext } from '../../context/globalAppContext';
import JobModalWrapper from '../../components/JobModalWrapper';
import NewJobModal from '../../components/NewJobModal';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';

export default function Providers() {
  const { themeController, providersController, languageController } =
    useComponentContext();
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isRTL = languageController.isRTL;
  const [newJobModalVisible, setNewJobModalVisible] = useState(false);
  const [chosenUserId, setChosenUserId] = useState(null);
  const [chosenUser, setChosenUser] = useState(null);

  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);

    return {
      paddingVertical: isWebLandscape ? web(25) : mobile(14),
      paddingHorizontal: isWebLandscape ? web(10) : mobile(10),
      scrollViewColumnGap: web(23),
      scrollViewRowGap: isWebLandscape ? web(23) : mobile(10),
    };
  }, [isWebLandscape, height]);

  if (providersController.error)
    return <Text>{providersController.error}</Text>;

  const filteredProviders = providersController.providers?.filter(
    (user) =>
      (filteredJobs.length > 0
        ? user?.professions?.some((profession) => filteredJobs.includes(profession?.job_subtype?.key))
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
          paddingVertical: sizes.paddingVertical,
          paddingHorizontal: sizes.paddingHorizontal,
        },
      ]}
    >
      {/* <View>
        <SearchPanel
          searchValue={searchValue}
          setSearchValue={setSearchValue}
        />
      </View> */}
      <View style={{ width: isWebLandscape ? '70%' : '100%' }}>
        <JobTypeSelector
          selectedTypes={filteredJobs}
          setSelectedTypes={setFilteredJobs}
          subtypesOnly={true}
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
            columnGap: isWebLandscape ? sizes.scrollViewColumnGap : 0,
            rowGap: sizes.scrollViewRowGap,
            flexWrap: isWebLandscape ? 'wrap' : 'nowrap',
            justifyContent: isWebLandscape
              ? isRTL
                ? 'flex-end'
                : 'flex-start'
              : 'flex-start',
          }}
        >
          {filteredProviders?.map((user, index) => (
            <ProviderSummaryBlock
              key={index}
              user={user}
              chooseUser={() => {
                setChosenUserId(user?.id);
                setChosenUser(user);
                setNewJobModalVisible(true);
              }}
            />
          ))}
        </ScrollView>
      )}
      {isWebLandscape ? (
        <JobModalWrapper visible={newJobModalVisible} main={true}>
          <NewJobModal
            closeModal={() => setNewJobModalVisible(false)}
            executorId={chosenUserId}
            executor={chosenUser}
          />
        </JobModalWrapper>
      ) : (
        <Modal visible={newJobModalVisible} animationType='slide' transparent>
          <NewJobModal
            closeModal={() => setNewJobModalVisible(false)}
            executorId={chosenUserId}
            executor={chosenUser}
          />
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
