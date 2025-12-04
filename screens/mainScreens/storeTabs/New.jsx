import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import NewJobModal from '../../../components/NewJobModal';
import NewJobTemplateCard from '../../../components/NewJobTemplateCard';
import SearchPanel from '../../../components/SearchPanel';
import { JOB_TYPES } from '../../../constants/jobTypes';
import { useComponentContext } from '../../../context/globalAppContext';
import { useWebView } from '../../../context/webViewContext';
import { useWindowInfo } from '../../../context/windowContext';
import { checkHasPendingJob } from '../../../src/api/jobs';
import { useNotification } from '../../../src/render';
import { useTranslation } from 'react-i18next';
import { scaleByHeight, scaleByHeightMobile } from '../../../utils/resizeFuncs';
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
  const { height } = useWindowDimensions();
  const { isLandscape } = useWindowInfo();
  const isWebLandscape = isLandscape && Platform.OS === 'web';
  const { t } = useTranslation();

  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  // const [newJobModalVisible, setNewJobModalVisible] = useState(false);
  // const [activeKey, setActiveKey] = useState(null);

  const [likes, setLikes] = useState([]);

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);

    return {
      containerPaddingH: isWebLandscape ? web(10) : mobile(10),
      containerPaddingV: isWebLandscape ? web(14) : mobile(14),
      scrollContainerPaddingBottom: isWebLandscape ? web(20) : mobile(20),
    };
  }, [height, isWebLandscape]);

  return (
    <>
      <View
        style={[
          styles.container,
          {
            backgroundColor: themeController.current?.backgroundColor,
            direction: isRTL ? 'rtl' : 'ltr',
            paddingHorizontal: sizes.containerPaddingH,
            paddingVertical: sizes.containerPaddingV,
          },
        ]}
      >
        <View>
          <SearchPanel
            searchValue={searchValue}
            setSearchValue={setSearchValue}
          />
        </View>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            { paddingBottom: sizes.scrollContainerPaddingBottom },
          ]}
        >
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
                      const url =
                        pendingJobRequest.payment?.paymentMetadata
                          ?.paypalApproval?.href;
                      const message = [
                        t('subscriptions.messages.pendingJob'),
                        '',
                        t('subscriptions.messages.paymentURL', { url: url }),
                        '',
                        t('subscriptions.messages.cancelPendingJob'),
                      ].join('\n');

                      showWarning(message, [
                        {
                          title: t('subscriptions.messages.moveToPayment'),
                          backgroundColor: '#3B82F6',
                          textColor: '#FFFFFF',
                          onPress: () => openWebView(url),
                        },
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
    paddingBottom: 0,
  },
  scrollContainer: {},
  cardsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
};
