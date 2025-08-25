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

    // async function handleAuth(email, password) {
    //   try {
    //     // Try to sign up first
    //     const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    //       email,
    //       password,
    //     });

    //     if (signUpError) {
    //       // If user already exists, try sign in
    //       if (signUpError.message && signUpError.message.includes('already registered')) {
    //         const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    //           email,
    //           password,
    //         });
    //         if (signInError) {
    //           console.error(signInError);
    //         } else {
    //           // Signed in successfully
    //           // You can handle signInData here
    //         }
    //       } else {
    //         console.error(signUpError);
    //       }
    //     } else {
    //       // Signed up successfully
    //       // You can handle signUpData here
    //     }
    //   } catch (err) {
    //     console.error(err);
    //   }
    // }

    // useEffect(() => {
    //   // Example usage of handleAuth
    //   handleAuth('john@example.com', 'password123');
    // }, []);
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
