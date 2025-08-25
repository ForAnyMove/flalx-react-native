import { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useComponentContext } from '../../../context/globalAppContext';
// import JobTypeSelector from '../../../components/JobTypeSelector';
import { FontAwesome6 } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import SearchPanel from '../../../components/SearchPanel';
import ShowJobModal from '../../../components/ShowJobModal';
import { JOB_TYPES } from '../../../constants/jobTypes';

export default function InProgressScreen() {
  const { themeController, session } =
    useComponentContext();
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  // const router = useRouter();
  const [showJobModalVisible, setShowJobModalVisible] = useState(false);

  const [currentJobId, setCurrentJobId] = useState(null);
  const [jobs, setJobs] = useState([]); // Здесь должен быть массив пользователей
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const token = session?.token?.access_token;

        const response = await fetch(`${session.serverURL}/jobs/created`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        console.log('Fetched Jobs:', data);
        
        setJobs(data);
      } catch (error) {
        console.error('Ошибка загрузки:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

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
      {/* <View>
        <JobTypeSelector selectedTypes={filteredJobs} setSelectedTypes={setFilteredJobs} />
      </View> */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {jobs
          .filter((value) =>
            value.status === 'in-progress' && value.type.toLowerCase().includes(searchValue.toLowerCase())
          )
          .map((job, index) => {
            const hasImage = job.images && job.images.length > 0;
            return (
              <TouchableOpacity
                key={index}
                style={styles.cardContainer}
                onPress={() => {
                  setCurrentJobId(job.id);
                  setShowJobModalVisible(true);
                }}
              >
                <View
                  style={[
                    styles.cardContent,
                    {
                      backgroundColor:
                        themeController.current?.defaultBlocksBackground,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.imageContainer,
                      {
                        backgroundColor:
                          themeController.current?.defaultBlocksMockBackground,
                      },
                    ]}
                  >
                    {hasImage ? (
                      <Image
                        source={{ uri: job.images[0] }}
                        style={styles.image}
                        resizeMode='cover'
                      />
                    ) : (
                      <View style={styles.placeholderImage}>
                        <FontAwesome6
                          name='image'
                          size={20}
                          color={themeController.current?.defaultBlocksMockColor}
                        />
                      </View>
                    )}
                  </View>
                  <View style={styles.textContent}>
                    <Text
                      style={[
                        styles.title,
                        { color: themeController.current?.textColor },
                      ]}
                    >
                      {JOB_TYPES[job.type]}
                    </Text>
                    {job.description ? (
                      <Text
                        style={[
                          styles.description,
                          { color: themeController.current?.textColor },
                        ]}
                      >
                        {job.description}
                      </Text>
                    ) : null}
                  </View>
                  {/* {job.providers?.length > 0 && (
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor:
                            themeController.current?.secondaryBadgeBackground,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          { color: themeController.current?.badgeTextColor },
                        ]}
                      >
                        {job.providers.length}
                      </Text>
                    </View>
                  )} */}
                </View>
              </TouchableOpacity>
            );
          })}
      </ScrollView>
      <Modal visible={showJobModalVisible} animationType='slide'>
        <ShowJobModal closeModal={() => setShowJobModalVisible(false)} status='store-in-progress' currentJobId={currentJobId} />
      </Modal>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    paddingHorizontal: RFValue(10),
    paddingVertical: RFValue(14),
    paddingBottom: 0,
  },
  scrollContainer: {
    paddingBottom: 0,
  },
  cardContainer: {
    marginBottom: RFValue(8),
  },
  cardContent: {
    flexDirection: 'row',
    borderRadius: RFValue(5),
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: RFValue(3),
    elevation: RFValue(2),
  },
  imageContainer: {
    width: RFValue(55),
    height: RFValue(55),
    borderTopLeftRadius: RFValue(5),
    borderBottomLeftRadius: RFValue(5),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: RFValue(10),
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContent: {
    flex: 1,
    height: '80%',
  },
  title: {
    fontSize: RFValue(12),
    fontWeight: '600',
  },
  description: {
    fontSize: RFValue(10),
    marginTop: RFValue(2),
  },
};
