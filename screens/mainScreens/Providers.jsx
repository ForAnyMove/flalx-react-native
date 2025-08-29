import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import JobTypeSelector from '../../components/JobTypeSelector';
import ProviderSummaryBlock from '../../components/ProviderSummaryBlock';
import SearchPanel from '../../components/SearchPanel';
import { useComponentContext } from '../../context/globalAppContext';

export default function Providers() {
  const { themeController, session, providersController } = useComponentContext();
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [users, setUsers] = useState([]); // Здесь должен быть массив пользователей
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = session?.token?.access_token;

        const response = await fetch(`${session.serverURL}/users/others`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        console.log('Fetched users:', data);
        
        setUsers(data);
      } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);
  if (providersController.error) return <Text>{providersController.error}</Text>;
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeController.current?.backgroundColor },
      ]}
    >
      <View>
        <SearchPanel
          searchValue={searchValue}
          setSearchValue={setSearchValue}
        />
      </View>
      <View>
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
        <ScrollView>
          {providersController.providers.length > 0 && providersController.providers
            ?.filter(
              (user) =>
                (filteredJobs.length > 0
                  ? user?.jobTypes.some((jobType) =>
                      filteredJobs.includes(jobType)
                    )
                  : user) &&
                (user?.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                  user?.surname
                    .toLowerCase()
                    .includes(searchValue.toLowerCase()))
            )
            ?.map((user, index) => (
              <ProviderSummaryBlock key={index} user={user} />
            ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    paddingHorizontal: RFValue(10),
    paddingVertical: RFValue(14),
  },
};
