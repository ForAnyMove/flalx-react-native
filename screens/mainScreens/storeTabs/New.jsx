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
import { useLocalization } from '../../../src/services/useLocalization';
// import JobModalWrapper from '../../../components/JobModalWrapper';

export default function NewScreen({
  newJobModalVisible,
  setNewJobModalVisible,
  setActiveKey,
}) {
  const { themeController, languageController, session, jobTypesController } = useComponentContext();
  const { tField } = useLocalization(languageController.current);

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
            {jobTypesController.jobTypesWithSubtypes && jobTypesController.jobTypesWithSubtypes
              .filter((value) =>
                value.name.toLowerCase().includes(searchValue.toLowerCase())
              )
              .sort((value1, value2) => {
                const aIsLiked = likes.includes(value1.key);
                const bIsLiked = likes.includes(value2.key);
                return bIsLiked - aIsLiked;
              })
              .map((value) => (
                <TouchableOpacity
                  key={value.key}
                  onPress={async () => {
                    const pendingJobRequest = await checkHasPendingJob(session);

                    if (!pendingJobRequest.job) {
                      setActiveKey(value.key);
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
                    likeStatus={likes.includes(value.key)}
                    switchLikeStatus={() => {
                      if (likes.includes(value.key)) {
                        setLikes(likes.filter((item) => item !== value.key));
                      } else {
                        setLikes([...likes, value.key]);
                      }
                    }}
                    templateTitle={tField(value, 'name')}
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
