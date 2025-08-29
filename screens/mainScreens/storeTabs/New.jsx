import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, ScrollView, TouchableOpacity, View } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import NewJobModal from '../../../components/NewJobModal';
import NewJobTemplateCard from '../../../components/NewJobTemplateCard';
import SearchPanel from '../../../components/SearchPanel';
import { JOB_TYPES } from '../../../constants/jobTypes';
import { useComponentContext } from '../../../context/globalAppContext';

export default function NewScreen() {
  const { themeController } = useComponentContext();
  const router = useRouter();
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [newJobModalVisible, setNewJobModalVisible] = useState(false);
  const [activeKey, setActiveKey] = useState(null);
  
  return (
    <>
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
          <View style={styles.cardsWrapper}>
            {Object.entries(JOB_TYPES)
              .filter(([key, value]) =>
                value.toLowerCase().includes(searchValue.toLowerCase())
              )
              .map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  // onPress={() => router.push(`/new-job-modal?key=${key}`)}
                  onPress={() => {
                    setNewJobModalVisible(true);
                    setActiveKey(key);
                  }}
                >
                  <NewJobTemplateCard
                    templateTitle={label}
                    imageSource={null} // сюда можешь передавать uri картинки
                  />
                </TouchableOpacity>
              ))}
          </View>
        </ScrollView>
        <Modal visible={newJobModalVisible} animationType="slide">
          <NewJobModal activeKey={activeKey} closeModal={() => setNewJobModalVisible(false)} />
        </Modal>
      </View>
    </>
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
    paddingBottom: RFValue(20),
  },
  cardsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
};
