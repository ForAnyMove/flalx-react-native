import { useRouter } from 'expo-router';
import { useState, useTransition } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import NewJobModal from '../../../components/NewJobModal';
import NewJobTemplateCard from '../../../components/NewJobTemplateCard';
import SearchPanel from '../../../components/SearchPanel';
import { JOB_TYPES } from '../../../constants/jobTypes';
import { useComponentContext } from '../../../context/globalAppContext';
import { useWindowInfo } from '../../../context/windowContext';
import { checkHasPendingJob } from '../../../src/api/jobs';
import { useNotification } from '../../../src/render';
import { useWebView } from '../../../context/webViewContext';
// import JobModalWrapper from '../../../components/JobModalWrapper';

export default function NewScreen({
  newJobModalVisible,
  setNewJobModalVisible,
  setActiveKey,
}) {
  const { themeController, languageController, session } = useComponentContext();
  const { showWarning } = useNotification();
  const { openWebView } = useWebView();
  const isRTL = languageController.isRTL;
  const { isLandscape } = useWindowInfo();
  const isWebLandscape = isLandscape && Platform.OS === 'web';
  const { t } = useTransition();

  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  // const [newJobModalVisible, setNewJobModalVisible] = useState(false);
  // const [activeKey, setActiveKey] = useState(null);

  const [likes, setLikes] = useState([]);

  return (
    <>
      <View
        style={[
          styles.container,
          {
            backgroundColor: themeController.current?.backgroundColor,
            direction: isRTL ? 'rtl' : 'ltr',
          },
        ]}
      >
        <View>
          <SearchPanel
            searchValue={searchValue}
            setSearchValue={setSearchValue}
          />
        </View>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.cardsWrapper}>
            {Object.entries(JOB_TYPES)
              .filter(([key, value]) =>
                value.toLowerCase().includes(searchValue.toLowerCase())
              )
              .sort(([keyA], [keyB]) => {
                const aIsLiked = likes.includes(keyA);
                const bIsLiked = likes.includes(keyB);
                return bIsLiked - aIsLiked;
              })
              .map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  onPress={async () => {
                    const pendingJobRequest = await checkHasPendingJob(session);

                    if (!pendingJobRequest.job) {
                      setActiveKey(key);
                      setNewJobModalVisible(true);
                    } else {
                      const url = pendingJobRequest.payment?.paymentMetadata?.paypalApproval?.href;
                      const message = [
                        t('subscriptions.messages.pendingJob'),
                        "",
                        t('subscriptions.messages.paymentURL', { url: url }),
                        "",
                        t('subscriptions.messages.cancelPendingJob')
                      ].join('\n');

                      showWarning(message,
                        [
                          {
                            title: t('subscriptions.messages.moveToPayment'),
                            backgroundColor: "#3B82F6",
                            textColor: "#FFFFFF",
                            onPress: () => openWebView(url)
                          }
                        ]);
                    }
                  }}
                >
                  <NewJobTemplateCard
                    likeStatus={likes.includes(key)}
                    switchLikeStatus={() => {
                      if (likes.includes(key)) {
                        setLikes(likes.filter((item) => item !== key));
                      } else {
                        setLikes([...likes, key]);
                      }
                    }}
                    templateTitle={key}
                    imageSource={null}
                  />
                </TouchableOpacity>
              ))}
          </View>
        </ScrollView>
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
