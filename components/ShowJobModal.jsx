import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { JOB_SUB_TYPES } from '../constants/jobSubTypes';
import { JOB_TYPES } from '../constants/jobTypes';
import { LICENSES } from '../constants/licenses';
import { useComponentContext } from '../context/globalAppContext';
import JobHistoryModal from './JobHistoryModal';
import NewJobModal from './NewJobModal';
import JobExpectationsBadge from './ui/JobExpectationsBadge';
import ProvidersSection from './ProvidersSection';
import CustomFlatList from './ui/CustomFlatList';
import DateTimeInput from './ui/DateTimeInput';
import DateTimeInputDouble from './ui/DateTimeInputDouble';
import { useTranslation } from 'react-i18next';
import { useWindowInfo } from '../context/windowContext';
import { icons } from '../constants/icons';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import JobModalWrapper from './JobModalWrapper';
import {
  addSelfToJobProviders,
  completeJob,
  payForJob,
  updateJobComment,
  respondToJobAgreement,
} from '../src/api/jobs';
import { useWebView } from '../context/webViewContext';
import { useWebSocket } from '../context/webSocketContext';
import SubscriptionsModal from './SubscriptionsModal';
import CommentsSection from './CommentsSection';
import CompleteJobModal from './CompleteJobModal';
import { useLocalization } from '../src/services/useLocalization';
import { useNotification } from '../src/render';
import { formatExperience } from '../utils/experience_ulit';
import { formatCurrency } from '../utils/currency_formatter';
import { PublishJobModal } from './PublishJobModal';
import PurchaseModal from './PurchaseModal';
import ChosenUserModal from './ChosenUserModal';
import InterestRequestModal from './InterestRequestModal';
import { logError } from '../utils/log_util';
import CustomTextInput from './ui/CustomTextInput';

async function editJobById(jobId, updates, session) {
  try {
    const token = session?.token?.access_token;

    const response = await fetch(`${session.serverURL}/jobs/${jobId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Ошибка при обновлении заявки');
    }

    const updatedJob = await response.json();
    return updatedJob;
  } catch (error) {
    logError('Ошибка обновления job:', error.message);
    throw error;
  }
}

/**
 * Format field values for display in agreement modal.
 * Converts IDs to names for type/subtype fields, formats dates, etc.
 */
const MOCK_JOB = {
  id: 'mock-job-id',
  type: {
    id: '7d0d9b2d-135d-47a5-89a1-743209e43bac',
    key: 'cleaner',
    name: 'Cleaner',
    name_i18n: {
      en: 'Cleaner',
      he: 'מנקה',
    },
  },
  subType: {
    id: '5ca068e1-3eee-41a4-85bd-3cbcf4ce49d7',
    key: 'house_cleaning',
    name: 'House Cleaning',
    name_i18n: {
      en: 'House Cleaning',
      he: 'ניקיון בית',
    },
  },
  description: 'Mock Job for Testing',
  price: '333',
  images: [],
  startDateTime: '2026-01-14T10:57:00+00:00',
  endDateTime: '2026-01-30T10:57:00+00:00',
  createdAt: '2026-01-18T10:57:30.787203+00:00',
  status: 'waiting',
  creator: '4f04025a-eeaa-451d-a25c-586f6bdcf8f9',
  creator_account_type: 'client',
  providerStatus: 'choosed',
  providers: [
    {
      id: 'p1',
      name: 'John Doe',
      rating: 4.8,
      avatar: null,
      professions: ['cleaner'],
      executor_expectations: {
        salary: '50',
        startDateTime: '2026-01-14T10:57:00+00:00',
        endDateTime: '2026-01-30T10:57:00+00:00',
      },
    },
    {
      id: 'p2',
      name: 'Jane Smith',
      rating: 3.5,
      avatar: null,
      professions: ['cleaner'],
      executor_expectations: {
        salary: '45',
        startDateTime: '2026-01-15T12:00:00+00:00',
        endDateTime: '2026-01-25T18:00:00+00:00',
      },
    },
  ],
};

function formatFieldValue(field, value, jobTypesController, t) {
  if (value == null) return '—';

  switch (field) {
    case 'type':
      return jobTypesController?.jobTypesWithSubtypes?.find(t => t.id === value)?.name || String(value);
    case 'subType':
      return jobTypesController?.jobTypesWithSubtypes?.flatMap(t => t.subtypes || []).find(st => st.id === value)?.name || String(value);
    case 'start':
    case 'startDateTime':
    case 'end':
    case 'endDateTime': {
      const date = new Date(value);
      if (isNaN(date)) return String(value);
      return date.toLocaleString();
    }
    case 'location':
      return typeof value === 'object' ? (value?.address || String(value)) : String(value);
    case 'experience':
      return typeof value === 'object' ? `${value.min || 0}-${value.max || 0}` : String(value);
    default:
      return String(value);
  }
}

/**
 * Given a job's changes_history array and the agreement_change_date of the
 * provider, compute the before→after diff to display in the agreement modal.
 *
 * Algorithm:
 * 1. Find anchor entry A whose date is within ±2 s of agreementChangeDate
 * 2. BLOCK_WILL: merge changes from A onwards (last-write-wins per field)
 * 3. BLOCK_WAS: for each field in BLOCK_WILL, walk backwards from A-1 to
 *    find the last known previous value
 * 4. Return array of { field, was, will } objects
 */
function computeAgreementDiff(changesHistory, agreementChangeDate) {
  if (!Array.isArray(changesHistory) || !agreementChangeDate) return null;

  const sorted = [...changesHistory].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const anchorMs = new Date(agreementChangeDate).getTime();

  const anchorIdx = sorted.findIndex(
    (e) => Math.abs(new Date(e.date).getTime() - anchorMs) <= 2000
  );
  console.log(anchorIdx, agreementChangeDate);
  if (anchorIdx === -1) return null;

  // BLOCK_WILL: accumulate from anchor onwards (last entry wins per field)
  const blockWill = {};
  for (let i = anchorIdx + 1; i < sorted.length; i++) {
    Object.assign(blockWill, sorted[i].changes || {});
    console.log(blockWill);

  }

  // BLOCK_WAS: walk backwards before anchor to find last value per field
  const blockWas = {};
  for (const field of Object.keys(blockWill)) {
    for (let i = anchorIdx; i >= 0; i--) {
      const prev = sorted[i].changes || {};
      if (Object.prototype.hasOwnProperty.call(prev, field)) {
        blockWas[field] = prev[field];
        break;
      }
    }
  }

  return Object.keys(blockWill).map((field) => ({
    field,
    was: Object.prototype.hasOwnProperty.call(blockWas, field) ? blockWas[field] : null,
    will: blockWill[field],
  }));
}

export default function ShowJobModal({
  closeModal,
  status: initialStatus,
  currentJobId,
}) {
  const {
    themeController,
    session,
    user,
    jobsController,
    languageController,
    setAppLoading,
    subscription,
    couponsManagerController,
    jobTypesController,
  } = useComponentContext();
  const { tField } = useLocalization(languageController.current);
  const { showError, showWarning } = useNotification();
  const { t } = useTranslation();
  const { width, height, isLandscape } = useWindowInfo();
  const { openWebView } = useWebView();
  const { lastMessage } = useWebSocket();
  const isRTL = languageController?.isRTL;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const [status, setStatus] = useState(initialStatus || 'store-waiting');

  const prevJobLocation = useRef(null);

  useEffect(() => {
    if (!currentJobId) return;

    // Определяем, к какой группе относится заявка
    const isCreator = status.startsWith('store');
    const isExecutor = status.startsWith('jobs');

    // Определяем, какие массивы отслеживать
    const jobGroups = isCreator
      ? {
        waiting: jobsController.creator.waiting,
        in_progress: jobsController.creator.inProgress,
        done: jobsController.creator.done,
      }
      : {
        new: jobsController.executor.new,
        waiting: jobsController.executor.waiting,
        in_progress: jobsController.executor.inProgress,
        done: jobsController.executor.done,
      };

    // Поиск текущего местоположения заявки
    let currentLocation = null;

    for (const key of Object.keys(jobGroups)) {
      const found = jobGroups[key].find((j) => j.id === currentJobId);
      if (found) {
        currentLocation = key;
        break;
      }
    }

    // Проверка изменения положения
    if (currentLocation) {
      const prev = prevJobLocation.current;
      if (prev && prev !== currentLocation) {
        const fromStatus = `${isCreator ? 'client' : 'business'}-${prev}`;
        const toStatus = `${isCreator ? 'client' : 'business'
          }-${currentLocation}`;
        setStatus(toStatus);
      }

      prevJobLocation.current = currentLocation;
    } else {
      // если заявка пропала из списка (например, удалена)
      if (prevJobLocation.current) {
        prevJobLocation.current = null;
      }
    }
  }, [
    status,
    ...(status.startsWith('client')
      ? [
        jobsController.creator.waiting,
        jobsController.creator.inProgress,
        jobsController.creator.done,
      ]
      : [
        jobsController.executor.new,
        jobsController.executor.waiting,
        jobsController.executor.inProgress,
        jobsController.executor.done,
      ]),
  ]);

  const sizes = useMemo(
    () => ({
      font: isWebLandscape
        ? scaleByHeight(12, height)
        : scaleByHeightMobile(12, height),
      inputFont: isWebLandscape
        ? scaleByHeight(16, height)
        : scaleByHeightMobile(16, height),
      padding: isWebLandscape
        ? scaleByHeight(4, height)
        : scaleByHeightMobile(8, height),
      inputContainerPaddingHorizontal: isWebLandscape
        ? scaleByHeight(16, height)
        : scaleByHeightMobile(16, height),
      inputContainerPaddingVertical: isWebLandscape
        ? scaleByHeight(10, height)
        : scaleByHeightMobile(10, height),
      margin: isWebLandscape
        ? scaleByHeight(18, height)
        : scaleByHeightMobile(10, height),
      mobileGap: scaleByHeightMobile(16, height),
      borderRadius: isWebLandscape
        ? scaleByHeight(8, height)
        : scaleByHeightMobile(8, height),
      thumb: isWebLandscape
        ? scaleByHeight(128, height)
        : scaleByHeightMobile(128, height),
      headerMargin: isWebLandscape
        ? scaleByHeight(30, height)
        : scaleByHeightMobile(5, height),
      headerHeight: isWebLandscape ? scaleByHeight(50, height) : height * 0.07,
      icon: isWebLandscape
        ? scaleByHeight(24, height)
        : scaleByHeightMobile(16, height),
      iconSize: isWebLandscape
        ? scaleByHeight(24, height)
        : scaleByHeightMobile(24, height),
      horizontalGap: isWebLandscape ? width * 0.01 : 0,
      headerPaddingHorizontal: isWebLandscape
        ? scaleByHeight(7, height)
        : scaleByHeightMobile(3, height),
      containerPaddingHorizontal: isWebLandscape
        ? scaleByHeight(20, height)
        : scaleByHeightMobile(14, height),
      inputHeight: isWebLandscape
        ? scaleByHeight(64, height)
        : scaleByHeightMobile(40, height),
      photosLabelSize: isWebLandscape
        ? scaleByHeight(18, height)
        : scaleByHeightMobile(18, height),
      photosLabelMarginBottom: isWebLandscape
        ? scaleByHeight(14, height)
        : scaleByHeightMobile(16, height),
      saveBtnWidth: isWebLandscape ? scaleByHeight(380, height) : '100%',
      saveBtnWidthHalf: isWebLandscape ? scaleByHeight(180, height) : '48%',
      saveBtnHeight: isWebLandscape
        ? scaleByHeight(62, height)
        : scaleByHeightMobile(62, height),
      saveBtnFont: isWebLandscape
        ? scaleByHeight(20, height)
        : scaleByHeightMobile(20, height),
      underBtnTextMarginTop: isWebLandscape
        ? scaleByHeight(14, height)
        : scaleByHeightMobile(10, height),
      modalWidth: isWebLandscape ? scaleByHeight(450, height) : '80%',
      modalHeight: isWebLandscape ? scaleByHeight(230, height) : '60%',
      doubleBtnLineModalHeight: isWebLandscape
        ? scaleByHeight(306, height)
        : scaleByHeightMobile(40, height),
      modalFont: isWebLandscape
        ? scaleByHeight(24, height)
        : scaleByHeightMobile(14, height),
      modalTextMarginBottom: isWebLandscape
        ? scaleByHeight(32, height)
        : scaleByHeightMobile(12, height),
      modalBtnHeight: isWebLandscape
        ? scaleByHeight(62, height)
        : scaleByHeightMobile(50, height),
      modalBtnWidth: isWebLandscape ? scaleByHeight(153, height) : '40%',
      modalLongBtnWidth: isWebLandscape ? scaleByHeight(300, height) : '80%',
      modalBtnFont: isWebLandscape
        ? scaleByHeight(20, height)
        : scaleByHeightMobile(20, height),
      modalBtnBorderRadius: isWebLandscape
        ? scaleByHeight(8, height)
        : scaleByHeightMobile(6, height),
      modalBtnsGap: isWebLandscape
        ? scaleByHeight(24, height)
        : scaleByHeightMobile(12, height),
      modalPadding: isWebLandscape
        ? scaleByHeight(32, height)
        : scaleByHeightMobile(16, height),
      modalLineHeight: isWebLandscape
        ? scaleByHeight(32, height)
        : scaleByHeightMobile(22, height),
      modalCloseBtnTopRightPosition: isWebLandscape
        ? scaleByHeight(7, height)
        : scaleByHeightMobile(5, height),
      btnsColumnGap: isWebLandscape
        ? scaleByHeight(16, height)
        : scaleByHeightMobile(10, height),
      noPhotosMessageSize: isWebLandscape
        ? scaleByHeight(24, height)
        : scaleByHeightMobile(21, height),
      noPhotosMessageHeight: isWebLandscape
        ? scaleByHeight(128, height)
        : scaleByHeightMobile(128, height),
      noPhotosMessageWidth: isWebLandscape
        ? scaleByHeight(685, height)
        : '100%',
      commentFieldHeight: isWebLandscape
        ? scaleByHeight(131, height)
        : scaleByHeightMobile(131, height),
      descriptionInputHeight: isWebLandscape
        ? 'auto'
        : scaleByHeightMobile(70, height),
      logoFontSize: isWebLandscape
        ? scaleByHeight(24, height)
        : scaleByHeightMobile(18, height),
      crossIconSize: isWebLandscape
        ? scaleByHeight(24, height)
        : scaleByHeightMobile(20, height),
      historyIconSize: isWebLandscape
        ? scaleByHeight(24, height)
        : scaleByHeightMobile(20, height),
      mobileBottomContainerPaddingVertical: scaleByHeightMobile(16, height),
      dateTimeGapMobile: scaleByHeightMobile(20, height),
      mobileBottomPaddingExtraSpace: scaleByHeightMobile(120, height),
    }),
    [isWebLandscape, height, width]
  );

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        inputBlock: {
          borderRadius: sizes.borderRadius,
          padding: 0,
          paddingHorizontal: sizes.inputContainerPaddingHorizontal,
          paddingVertical: sizes.inputContainerPaddingVertical,
          backgroundColor: themeController.current?.formInputBackground,
          ...Platform.select({
            web: {
              zIndex: 1,
            },
          }),
        },
        label: {
          color: themeController.current?.unactiveTextColor,
          fontSize: sizes.font,
        },
        input: {
          width: '100%',
          fontFamily: 'Rubik-Regular',
          // fontWeight: '500',
          color: themeController.current?.textColor,
          fontSize: sizes.inputFont,
          ...Platform.select({
            web: isWebLandscape && {
              fontFamily: 'Rubik-Medium',
            },
          }),
        },
        imageInputBlock: {
          marginBottom: sizes.margin,
          ...Platform.select({
            web: {
              zIndex: 1,
            },
          }),
        },
        imageRow: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        imageScrollContainer: {
          flexDirection: 'row',
        },
        imageThumbnail: {
          width: sizes.thumb,
          height: sizes.thumb,
          borderRadius: sizes.borderRadius,
        },
        imageWrapper: {
          position: 'relative',
          marginRight: sizes.margin / 2,
        },
        createButton: {
          borderRadius: sizes.borderRadius,
          alignItems: 'center',
          justifyContent: 'center',
          height: sizes.saveBtnHeight,
          width: '100%',
        },
        buttonText: {
          color: 'white',
          textAlign: 'center',
          fontSize: sizes.saveBtnFont,
        },
        waitText: {
          fontSize: sizes.inputFont,
          textAlign: 'center',
          marginBottom: sizes.margin / 2,
          color: themeController.current?.unactiveTextColor,
          marginTop: sizes.underBtnTextMarginTop,
        },
        modalOverlay: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)',
        },
        modalCard: {
          position: 'relative',
          width: sizes.modalWidth,
          padding: sizes.modalPadding,
          borderRadius: sizes.modalBtnBorderRadius,
          alignItems: 'center',
          backgroundColor: themeController.current?.backgroundColor,
        },
        modalText: {
          fontFamily: 'Rubik-Bold',
          fontSize: sizes.modalFont,
          marginBottom: sizes.modalTextMarginBottom,
          textAlign: 'center',
          color: themeController.current?.textColor,
          lineHeight: sizes.modalLineHeight,
        },
        modalButtonsRow: {
          flexDirection: 'row',
          justifyContent: 'center',
          gap: sizes.modalBtnsGap,
        },
        modalBtn: {
          alignItems: 'center',
          justifyContent: 'center',
          height: sizes.modalBtnHeight,
          borderRadius: sizes.modalBtnBorderRadius,
          ...Platform.select({
            web: {
              boxSizing: 'border-box',
            },
          }),
        },
        modalBtnText: {
          fontSize: sizes.modalBtnFont,
        },
        buttonColumn: {
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          gap: sizes.btnsColumnGap,
        },
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottomWidth: 1,
          backgroundColor: themeController.current?.backgroundColor,
          borderBottomColor: themeController.current?.profileDefaultBackground,
          height: sizes.headerHeight,
          paddingHorizontal: sizes.headerPaddingHorizontal,
          marginVertical: sizes.headerMargin,
        },
        logo: {
          fontSize: sizes.logoFontSize,
          fontFamily: 'Rubik-Bold',
          color: themeController.current?.primaryColor,
        },
      }),
    [sizes, themeController]
  );
  const [newJobModalVisible, setNewJobModalVisible] = useState(false);
  const [isInterestedRequest, setInterestedRequest] = useState(
    status === 'jobs-waiting'
  );

  const [showCancelRequestModal, setCancelRequestModal] = useState(false);
  const [showConfirmInterestModal, setConfirmInterestModal] = useState(false);
  const [showInterestRequestModal, setShowInterestRequestModal] = useState(false);
  const [completeJobModalVisible, setCompleteJobModalVisible] = useState(false);

  const [publishModalVisible, setPublishModalVisible] = useState(false);
  const [interestFormData, setInterestFormData] = useState({ price: '', startDate: null, endDate: null });
  const [interestStep, setInterestStep] = useState(1);
  const [plansModalReturnTarget, setPlansModalReturnTarget] = useState(null); // 'interest' | 'purchase' | 'publish'

  const [showHistoryModal, setHistoryModal] = useState(false);

  const [acceptModalVisible, setAcceptModalVisible] = useState(false);
  const [acceptModalVisibleTitle, setAcceptModalVisibleTitle] = useState('');
  const [acceptModalVisibleFunc, setAcceptModalVisibleFunc] = useState(
    () => { }
  );

  const [plansModalVisible, setPlansModalVisible] = useState(false);

  const [agreementModalVisible, setAgreementModalVisible] = useState(false);
  const [agreementChanges, setAgreementChanges] = useState(null);

  const [currentJobInfo, setCurrentJobInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChosenUserModal, setShowChosenUserModal] = useState(false);

  useEffect(() => {
    if (currentJobInfo?.providerStatus === 'choosed' && status.startsWith('jobs')) {
      setShowChosenUserModal(true);
      console.log('Showing chosen user modal for job:', currentJobInfo);
    }
  }, [currentJobInfo?.providerStatus, status]);

  const location = currentJobInfo?.location;

  // Подгружаем job при редактировании
  useEffect(() => {
    if (!currentJobId) return;
    let cancelled = false;

    (async () => {
      try {
        // Показываем лоадер только при первой загрузке; фоновые обновления — тихие
        if (!currentJobInfo) setLoading(true);

        let job;
        if (currentJobId === 'mock-job-id') {
          job = MOCK_JOB;
        } else {
          job = await jobsController.actions.getJobById(currentJobId, session);
        }

        if (cancelled) return;
        setCurrentJobInfo(job);
        if (job?.job_comment) {
          setEditableCommentValue(job?.job_comment?.comment);
        }

        // Auto-show agreement modal if provider hasn't agreed to current job version
        if (status.startsWith('jobs') && user.current?.id) {
          const myEntry = job?.providers?.find((p) => (p?.id || p) === user.current.id);
          if (myEntry && myEntry.job_agreement != null && myEntry.job_agreement !== 'agreed') {
            const diff = computeAgreementDiff(
              job?.changes_history,
              myEntry.agreement_change_date
            );
            setAgreementChanges(diff);
            setAgreementModalVisible(true);
          }
        }

        const isProvider = await jobsController.actions.checkIsProviderInJob(
          currentJobId
        );
        setInterestedRequest(isProvider);
      } catch (e) {
        logInfo('Failed to load job:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    currentJobId,
    session?.token?.access_token,
    jobsController.creator.waiting,
    jobsController.creator.inProgress,
    jobsController.creator.done,
    jobsController.executor.new,
    jobsController.executor.waiting,
    jobsController.executor.inProgress,
    jobsController.executor.done,
  ]);

  const [editableCommentState, setEditableCommentState] = useState(false);
  const [editableCommentValue, setEditableCommentValue] = useState(
    currentJobInfo?.job_comment?.comment || ''
  );

  // Direct call (no paywall) — used when user already has a subscription
  const handleAddingSelfToJobProviders = async (paymentOptions = {}) => {
    try {
      setAppLoading(true);
      const result = await addSelfToJobProviders(currentJobId, session, paymentOptions);

      if (result.success == true) {
        if (result.payment?.paymentMetadata?.approval?.href) {
          openWebView(result.payment.paymentMetadata.approval.href);
        } else {
          jobsController.reloadAll();
        }
      }

      setAppLoading(false);
    } catch (e) {
      setAppLoading(false);
      if (e.response && e.response.status === 400 && e.response.data.code == 'NO_COUPONS_AVAILABLE') {
        showWarning(t('errors.no_coupons', {
          defaultValue: 'You have no coupons available',
        }));
      }
    }
  };

  // PurchaseModal: onPurchase handler for the interest/provider paywall
  const handlePurchaseInterest = async (payload) => {
    const finalPayload = {
      ...payload,
      ...(interestFormData && {
        provider_price: interestFormData.price,
        provider_start_date: interestFormData.startDate,
        provider_end_date: interestFormData.endDate,
      }),
    };
    const result = await addSelfToJobProviders(currentJobId, session, finalPayload);
    if (result.payment?.paymentMetadata?.approval?.href) {
      openWebView(result.payment.paymentMetadata.approval.href);
    } else if (result.success) {
      jobsController.reloadAll();
    }
    return result;
  };

  // PurchaseModal: onPayWithCoupons handler for the interest/provider paywall
  const handlePayCouponsInterest = () => {
    const payload = {
      useCoupon: true,
      ...(interestFormData && {
        provider_price: interestFormData.price,
        provider_start_date: interestFormData.startDate,
        provider_end_date: interestFormData.endDate,
      }),
    };
    setConfirmInterestModal(false);
    setShowInterestRequestModal(false);
    setAppLoading(true);
    addSelfToJobProviders(currentJobId, session, payload)
      .then((result) => {
        if (result.success) {
          couponsManagerController?.refreshBalance();
          jobsController.reloadAll();
        }
      })
      .catch((e) => {
        if (e.response?.status === 400 && e.response.data?.code === 'NO_COUPONS_AVAILABLE') {
          showWarning(t('errors.no_coupons', { defaultValue: 'You have no coupons available' }));
        }
      })
      .finally(() => setAppLoading(false));
  };

  const handleInterestRequest = async () => {
    // We don't reset formData here to allow persistence across payment flows
    const isBusinessJob = currentJobInfo?.creator?.account_type === 'provider';
    const hasSubscription = subscription.current != null;

    if (isBusinessJob) {
      if (hasSubscription) {
        handleAddingSelfToJobProviders({});
        setInterestedRequest(true);
      } else {
        setConfirmInterestModal(true);
      }
    } else {
      // If we are starting a fresh request (no price entered), reset step to 1
      if (!interestFormData.price) setInterestStep(1);
      setShowInterestRequestModal(true);
    }
  };

  const handleConfirmInterestRequest = async (formData, paymentOptions = {}) => {
    try {
      setInterestFormData(formData);
      setAppLoading(true);
      // Combine form data (price, date) with payment options if any
      const finalOptions = {
        ...paymentOptions,
        provider_price: formData.price,
        provider_start_date: formData.startDate,
        provider_end_date: formData.endDate,
      };

      await handleAddingSelfToJobProviders(finalOptions);
      setInterestedRequest(true);
      setShowInterestRequestModal(false);
      setConfirmInterestModal(false);
      return { success: true };
    } catch (error) {
      logError('Error adding self to job providers:', error.message);
      throw error;
    } finally {
      setAppLoading(false);
    }
  };

  useEffect(() => {
    if (!lastMessage) return;
    if (lastMessage.type === 'JOB_UPDATED_REQUIRES_AGREEMENT' &&
      lastMessage.payload?.jobId === currentJobId &&
      status.startsWith('jobs')) {
      const diff = computeAgreementDiff(
        currentJobInfo?.changes_history,
        lastMessage.payload?.changeDate
      );
      setAgreementChanges(diff);
      setAgreementModalVisible(true);
    }
  }, [lastMessage]);

  const handleAgreeToJobUpdate = async () => {
    try {
      setAppLoading(true);
      await respondToJobAgreement(currentJobId, session, true);
      setAgreementModalVisible(false);
      jobsController.reloadExecutor();
    } catch {
      // silently ignore
    } finally {
      setAppLoading(false);
    }
  };

  const handleDeclineJobUpdate = async () => {
    try {
      setAppLoading(true);
      await respondToJobAgreement(currentJobId, session, false);
      setAgreementModalVisible(false);
      jobsController.reloadExecutor();
      closeModal();
    } catch {
      // silently ignore
    } finally {
      setAppLoading(false);
    }
  };

  function extraUiByStatus(status) {
    switch (status) {
      case 'store-waiting':
        switch (currentJobInfo?.status) {
          case 'pending':
            return [<Text
              style={[
                {
                  alignSelf: isRTL ? 'flex-end' : 'flex-start',
                  verticalAlign: 'center',
                  color: themeController.current?.unactiveTextColor,
                  marginBottom: sizes.margin / 2,
                },
              ]}
            >
              {t('showJob.messages.waitingForPayment', {
                defaultValue: 'Waiting for payment...',
              })}
            </Text>]
          case 'pending_moderation':
            return [<Text
              style={[
                {
                  alignSelf: isRTL ? 'flex-end' : 'flex-start',
                  verticalAlign: 'center',
                  color: themeController.current?.unactiveTextColor,
                  marginBottom: sizes.margin / 2,
                },
              ]}
            >
              {t('showJob.messages.waitingForModeration', {
                defaultValue: 'Waiting for moderation...',
              })}
            </Text>]
          default:
            return [<ProvidersSection
              key='providers'
              styles={styles}
              currentJobInfo={currentJobInfo}
              status={status}
              closeAllModal={closeModal}
            />]
        }
      case 'store-in-progress':
        return [
          <ProvidersSection
            key='providers'
            styles={styles}
            currentJobInfo={currentJobInfo}
            status={status}
            closeAllModal={closeModal}
          />,
        ];
      case 'store-done':
        return [
          <View
            style={
              isWebLandscape && {
                flexDirection: isRTL ? 'row-reverse' : 'row',
                gap: scaleByHeight(21, height),
              }
            }
            key='done-view-store'
          >
            <ProvidersSection
              key='providers'
              styles={styles}
              currentJobInfo={currentJobInfo}
              status={status}
              closeAllModal={closeModal}
            />
            <View
              style={[
                styles.inputBlock,
                {
                  backgroundColor: themeController.current?.formInputBackground,
                  borderRadius: sizes.borderRadius,
                  paddingHorizontal: sizes.inputContainerPaddingHorizontal,
                  paddingVertical: sizes.inputContainerPaddingVertical,
                },
                isWebLandscape && {
                  width: scaleByHeight(330, height),
                  height: scaleByHeight(136, height),
                },
              ]}
              key='provider-comments'
            >
              <Text
                style={[
                  styles.label,
                  {
                    fontSize: sizes.font,
                    color: themeController.current?.unactiveTextColor,
                  },
                  isRTL && { textAlign: 'right' },
                ]}
              >
                {t('showJob.fields.providerComments', {
                  defaultValue: 'Provider comments',
                })}
              </Text>
              <CustomTextInput
                value={currentJobInfo?.job_comment?.comment || ''}
                placeholder={t('showJob.fields.commentsPlaceholder', {
                  defaultValue: 'Comment on the completed work...',
                })}
                placeholderTextColor={
                  themeController.current?.formInputPlaceholderColor
                }
                style={[
                  styles.input,
                  {
                    color: themeController.current?.textColor,
                    fontSize: sizes.inputFont,
                    padding: 0,
                    paddingVertical: sizes.padding,
                  },
                  isWebLandscape && { height: '100%', padding: 0 },
                  isRTL && { textAlign: 'right' },
                ]}
                multiline
                readOnly
              />
            </View>
          </View>,
          <CommentsSection
            jobId={currentJobInfo?.id}
            userId={currentJobInfo?.executor}
            allowAdd={currentJobInfo?.comments?.length == 0}
            allowAddOnly={true}
          />,
        ];
      case 'jobs-new':
        return [
          // isInterestedRequest ? (
          //   <>
          //     <TouchableOpacity
          //       key='updateButton'
          //       style={[
          //         styles.createButton,
          //         {
          //           backgroundColor: 'transparent',
          //           backgroundColor:
          //             themeController.current?.buttonColorSecondaryDefault,
          //           borderRadius: sizes.borderRadius,
          //           ...(isWebLandscape && {
          //             paddingVertical: sizes.padding * 1.2,
          //           }),
          //         },
          //         isWebLandscape && {
          //           width: sizes.saveBtnWidth,
          //           height: sizes.saveBtnHeight,
          //         },
          //       ]}
          //       onPress={() => setCancelRequestModal(true)}
          //     >
          //       <Text
          //         style={{
          //           color: themeController.current?.buttonTextColorSecondary,
          //           textAlign: 'center',
          //           ...(isWebLandscape && { fontSize: sizes.saveBtnFont }),
          //         }}
          //       >
          //         {t('showJob.buttons.cancelRequest', {
          //           defaultValue: 'Cancel request',
          //         })}
          //       </Text>
          //     </TouchableOpacity>
          //     <Text
          //       style={[
          //         styles.waitText,
          //         {
          //           color: themeController.current?.unactiveTextColor,
          //           marginTop: sizes.underBtnTextMarginTop,
          //         },
          //         isWebLandscape && {
          //           fontSize: sizes.inputFont,
          //           textAlign: isRTL ? 'right' : 'left',
          //         },
          //       ]}
          //       key='waitText'
          //     >
          //       {t('showJob.messages.waitForCall', {
          //         defaultValue: 'Wait for a call from the customer...',
          //       })}
          //     </Text>
          //   </>
          // ) : (
          //   <TouchableOpacity
          //     key='updateButton'
          //     style={[
          //       styles.createButton,
          //       {
          //         backgroundColor:
          //           themeController.current?.buttonColorPrimaryDefault,
          //         ...(isWebLandscape && {
          //           paddingVertical: sizes.padding * 1.2,
          //           borderRadius: sizes.borderRadius,
          //         }),
          //       },
          //       isWebLandscape && {
          //         width: sizes.saveBtnWidth,
          //         height: sizes.saveBtnHeight,
          //       },
          //     ]}
          //     onPress={handleInterestRequest}
          //   >
          //     <Text
          //       style={{
          //         color: 'white',
          //         textAlign: 'center',
          //         ...(isWebLandscape && { fontSize: sizes.saveBtnFont }),
          //       }}
          //     >
          //       {t('showJob.buttons.interested', {
          //         defaultValue: 'I am interested in the job',
          //       })}
          //     </Text>
          //   </TouchableOpacity>
          // ),
          <ProvidersSection
            key='providers'
            styles={styles}
            currentJobInfo={currentJobInfo}
            status={status}
            closeAllModal={closeModal}
          />,
        ];
      case 'jobs-waiting':
        return [
          // isInterestedRequest ? (
          //   <>
          //     <TouchableOpacity
          //       key='updateButton'
          //       style={[
          //         styles.createButton,
          //         {
          //           backgroundColor: 'transparent',
          //           backgroundColor:
          //             themeController.current?.buttonColorSecondaryDefault,
          //           borderRadius: sizes.borderRadius,
          //           ...(isWebLandscape && {
          //             paddingVertical: sizes.padding * 1.2,
          //           }),
          //         },
          //         isWebLandscape && {
          //           width: sizes.saveBtnWidth,
          //           height: sizes.saveBtnHeight,
          //         },
          //       ]}
          //       onPress={() => setCancelRequestModal(true)}
          //     >
          //       <Text
          //         style={{
          //           color: themeController.current?.buttonTextColorSecondary,
          //           textAlign: 'center',
          //           ...(isWebLandscape && { fontSize: sizes.saveBtnFont }),
          //         }}
          //       >
          //         {t('showJob.buttons.cancelRequest', {
          //           defaultValue: 'Cancel request',
          //         })}
          //       </Text>
          //     </TouchableOpacity>
          //     <Text
          //       style={[
          //         styles.waitText,
          //         {
          //           color: themeController.current?.unactiveTextColor,
          //           marginTop: sizes.underBtnTextMarginTop,
          //         },
          //         isRTL && { textAlign: 'right' },
          //         isWebLandscape && {
          //           fontSize: sizes.inputFont,
          //           textAlign: isRTL ? 'right' : 'left',
          //         },
          //       ]}
          //       key='waitText'
          //     >
          //       {t('showJob.messages.waitForCall', {
          //         defaultValue: 'Wait for a call from the customer...',
          //       })}
          //     </Text>
          //   </>
          // ) : (
          //   <TouchableOpacity
          //     key='updateButton'
          //     style={[
          //       styles.createButton,
          //       {
          //         backgroundColor:
          //           themeController.current?.buttonColorPrimaryDefault,
          //         borderRadius: sizes.borderRadius,
          //         ...(isWebLandscape && {
          //           paddingVertical: sizes.padding * 1.2,
          //         }),
          //       },
          //       isWebLandscape && {
          //         width: sizes.saveBtnWidth,
          //         height: sizes.saveBtnHeight,
          //       },
          //     ]}
          //     onPress={handleInterestRequest}
          //   >
          //     <Text
          //       style={{
          //         color: 'white',
          //         textAlign: 'center',
          //         ...(isWebLandscape && { fontSize: sizes.saveBtnFont }),
          //       }}
          //     >
          //       {t('showJob.buttons.interested', {
          //         defaultValue: 'I am interested in the job',
          //       })}
          //     </Text>
          //   </TouchableOpacity>
          // ),
          <ProvidersSection
            key='providers'
            styles={styles}
            currentJobInfo={currentJobInfo}
            status={status}
            closeAllModal={closeModal}
          />,
        ];
      case 'jobs-in-progress':
        return [
          <ProvidersSection
            key='providers'
            styles={styles}
            currentJobInfo={currentJobInfo}
            status={status}
            closeAllModal={closeModal}
          />,
        ];
      case 'jobs-done':
        return [
          <View
            style={
              isWebLandscape && {
                flexDirection: isRTL ? 'row-reverse' : 'row',
                gap: scaleByHeight(21, height),
              }
            }
            key='done-view'
          >
            <ProvidersSection
              key='providers'
              styles={styles}
              currentJobInfo={currentJobInfo}
              status={status}
              closeAllModal={closeModal}
            />
            <View
              style={[
                styles.inputBlock,
                {
                  backgroundColor: themeController.current?.formInputBackground,
                  borderRadius: sizes.borderRadius,
                  paddingHorizontal: sizes.inputContainerPaddingHorizontal,
                  paddingVertical: sizes.inputContainerPaddingVertical,
                },
                isWebLandscape && {
                  width: scaleByHeight(330, height),
                  height: scaleByHeight(136, height),
                },
              ]}
              key='provider-comments'
            >
              <View
                style={[
                  styles.editableTitlePanel,
                  isRTL && { flexDirection: 'row-reverse' },
                ]}
              >
                <Text
                  style={[
                    styles.label,
                    {
                      fontSize: sizes.font,
                      color: themeController.current?.unactiveTextColor,
                    },
                    isRTL && { textAlign: 'right' },
                  ]}
                >
                  {t('showJob.fields.myComments', {
                    defaultValue: 'My comments',
                  })}
                </Text>
                {editableCommentState ? (
                  <View
                    style={[
                      styles.editPanel,
                      isRTL && { flexDirection: 'row-reverse' },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        setEditableCommentState(false);
                        setEditableCommentValue(
                          currentJobInfo?.job_comment?.comment || ''
                        );
                      }}
                    >
                      <MaterialIcons
                        name='cancel'
                        size={sizes.icon}
                        color={themeController.current?.unactiveTextColor}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setEditableCommentState(false);

                        updateJobComment(
                          currentJobId,
                          editableCommentValue,
                          session
                        ).then(() => {
                          jobsController.reloadExecutor();
                        });
                      }}
                    >
                      <MaterialIcons
                        name='check-circle'
                        size={sizes.icon}
                        color={themeController.current?.unactiveTextColor}
                      />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => setEditableCommentState(true)}
                  >
                    <MaterialCommunityIcons
                      name='pencil'
                      size={sizes.icon}
                      color={themeController.current?.unactiveTextColor}
                    />
                  </TouchableOpacity>
                )}
              </View>
              <CustomTextInput
                value={
                  editableCommentState
                    ? editableCommentValue
                    : currentJobInfo?.job_comment
                      ? currentJobInfo?.job_comment.comment
                      : null
                }
                placeholder={t('showJob.fields.myCommentsPlaceholder', {
                  defaultValue: 'Write a comment on the completed work...',
                })}
                placeholderTextColor={
                  themeController.current?.formInputPlaceholderColor
                }
                style={[
                  styles.input,
                  {
                    height: sizes.commentFieldHeight,
                    color: themeController.current?.textColor,
                    fontSize: sizes.inputFont,
                    padding: 0,
                    paddingVertical: sizes.padding,
                  },
                  isWebLandscape && { padding: 0 },
                  isRTL && { textAlign: 'right' },
                ]}
                onChangeText={setEditableCommentValue}
                multiline
                readOnly={!editableCommentState}
              />
            </View>
          </View>,
        ];
      default:
        return [];
    }
  }

  function bottomButtonByStatus(status) {
    switch (status) {
      case 'store-waiting':
        return [
          <View
            style={{
              width: '100%',
              gap: sizes.horizontalGap,
              justifyContent: 'space-between',
              flexDirection: isRTL ? 'row-reverse' : 'row',
            }}
          >
            {currentJobInfo.status == 'pending' && <TouchableOpacity
              key='payButton'
              style={[
                styles.createButton,
                {
                  backgroundColor:
                    themeController.current?.buttonColorPrimaryDefault,
                  borderRadius: sizes.borderRadius,
                  width: sizes.saveBtnWidthHalf * 1.2,
                  height: sizes.saveBtnHeight,
                },
              ]}
              onPress={() => {
                if (subscription.current != null && currentJobInfo?.jobType == 'normal') {
                  payToPublish({});
                } else {
                  setPublishModalVisible(true);
                }
              }}
            >
              <Text
                style={{
                  color: 'white',
                  textAlign: 'center',
                  fontSize: sizes.saveBtnFont,
                }}
              >
                {t('newJob.statusModal.buttons.confirm', {
                  defaultValue: 'Publish'
                })}
              </Text>
            </TouchableOpacity>}
            {currentJobInfo.status != 'pending' && currentJobInfo.status != 'pending_moderation' && <TouchableOpacity
              key='updateButton'
              style={[
                styles.createButton,
                {
                  backgroundColor:
                    themeController.current?.buttonColorPrimaryDefault,
                  borderRadius: sizes.borderRadius,
                  width: sizes.saveBtnWidthHalf,
                  height: sizes.saveBtnHeight,
                },
              ]}
              onPress={() => setNewJobModalVisible(true)}
            >
              <Text
                style={{
                  color: 'white',
                  textAlign: 'center',
                  fontSize: sizes.saveBtnFont,
                }}
              >
                {t('showJob.buttons.update', { defaultValue: 'Update' })}
              </Text>
            </TouchableOpacity>}
            <TouchableOpacity
              key='closeButton'
              style={[
                styles.createButton,
                {
                  backgroundColor:
                    themeController.current?.buttonColorSecondaryDefault,
                  borderRadius: sizes.borderRadius,
                  width: sizes.saveBtnWidthHalf,
                  height: sizes.saveBtnHeight,
                },
              ]}
              onPress={() => {
                setAcceptModalVisible(true);
                setAcceptModalVisibleTitle(t('showJob.messages.closeJobTitle'));
                setAcceptModalVisibleFunc(() => async () => {
                  try {
                    await jobsController.actions
                      .deleteJob(currentJobId)
                      .then(closeModal());
                  } catch (err) {
                    logInfo('Ошибка закрытия заявки:', err.message);
                  }
                  setAcceptModalVisible(false);
                });
              }}
            >
              <Text
                style={{
                  color: 'white',
                  textAlign: 'center',
                  fontSize: sizes.saveBtnFont,
                }}
              >
                {t('showJob.buttons.close', { defaultValue: 'Close' })}
              </Text>
            </TouchableOpacity>
          </View>,
        ];
      // case 'store-in-progress':
      //   return [
      //     <ProvidersSection
      //       key='providers'
      //       styles={styles}
      //       currentJobInfo={currentJobInfo}
      //       status={status}
      //       closeAllModal={closeModal}
      //     />,
      //   ];
      case 'store-done':
        return [
          // false &&
          // ((
          //   <TouchableOpacity
          //     key='confirmButton'
          //     style={[
          //       styles.createButton,
          //       {
          //         backgroundColor:
          //           themeController.current?.buttonColorPrimaryDefault,
          //         borderRadius: sizes.borderRadius,
          //         ...(isWebLandscape && {
          //           paddingVertical: sizes.padding * 1.2,
          //           borderRadius: sizes.borderRadius,
          //         }),
          //       },
          //       isWebLandscape && {
          //         width: sizes.saveBtnWidth,
          //         height: sizes.saveBtnHeight,
          //       },
          //     ]}
          //     onPress={() => jobsController.actions.confirmJob(currentJobId)}
          //   >
          //     <Text
          //       style={{
          //         color: 'white',
          //         textAlign: 'center',
          //         ...(isWebLandscape && { fontSize: sizes.saveBtnFont }),
          //       }}
          //     >
          //       {t('showJob.buttons.confirmCompletion', {
          //         defaultValue: 'Confirm job completion',
          //       })}
          //     </Text>
          //   </TouchableOpacity>
          // )),
        ];
      case 'jobs-new':
        return [
          isInterestedRequest ? (
            <>
              <TouchableOpacity
                key='updateButton'
                style={[
                  styles.createButton,
                  {
                    backgroundColor: 'transparent',
                    backgroundColor:
                      themeController.current?.buttonColorSecondaryDefault,
                    borderRadius: sizes.borderRadius,
                    width: sizes.saveBtnWidth,
                    height: sizes.saveBtnHeight,
                  },
                ]}
                onPress={() => setCancelRequestModal(true)}
              >
                <Text
                  style={{
                    color: themeController.current?.buttonTextColorSecondary,
                    textAlign: 'center',
                    fontSize: sizes.saveBtnFont,
                  }}
                >
                  {t('showJob.buttons.cancelRequest', {
                    defaultValue: 'Cancel request',
                  })}
                </Text>
              </TouchableOpacity>
              <Text
                style={[
                  styles.waitText,
                  {
                    color: themeController.current?.unactiveTextColor,
                    marginTop: sizes.underBtnTextMarginTop,
                    fontSize: sizes.inputFont,
                    textAlign: 'center',
                  },
                ]}
                key='waitText'
              >
                {t('showJob.messages.waitForCall', {
                  defaultValue: 'Wait for a call from the customer...',
                })}
              </Text>
            </>
          ) : (
            <TouchableOpacity
              key='updateButton'
              style={[
                styles.createButton,
                {
                  backgroundColor:
                    themeController.current?.buttonColorPrimaryDefault,
                  borderRadius: sizes.borderRadius,
                  width: sizes.saveBtnWidth,
                  height: sizes.saveBtnHeight,
                },
              ]}
              onPress={handleInterestRequest}
            >
              <Text
                style={{
                  color: 'white',
                  textAlign: 'center',
                  fontSize: sizes.saveBtnFont,
                }}
              >
                {t('showJob.buttons.interested', {
                  defaultValue: 'I am interested in the job',
                })}
              </Text>
            </TouchableOpacity>
          ),
        ];
      case 'jobs-waiting':
        return [
          isInterestedRequest ? (
            <>
              <TouchableOpacity
                key='updateButton'
                style={[
                  styles.createButton,
                  {
                    backgroundColor: 'transparent',
                    backgroundColor:
                      themeController.current?.buttonColorSecondaryDefault,
                    borderRadius: sizes.borderRadius,
                    width: sizes.saveBtnWidth,
                    height: sizes.saveBtnHeight,
                  },
                ]}
                onPress={() => setCancelRequestModal(true)}
              >
                <Text
                  style={{
                    color: themeController.current?.buttonTextColorSecondary,
                    textAlign: 'center',
                    fontSize: sizes.saveBtnFont,
                  }}
                >
                  {t('showJob.buttons.cancelRequest', {
                    defaultValue: 'Cancel request',
                  })}
                </Text>
              </TouchableOpacity>
              <Text
                style={[
                  styles.waitText,
                  {
                    color: themeController.current?.unactiveTextColor,
                    marginTop: sizes.underBtnTextMarginTop,
                    fontSize: sizes.inputFont,
                    textAlign: 'center',
                  },
                ]}
                key='waitText'
              >
                {t('showJob.messages.waitForCall', {
                  defaultValue: 'Wait for a call from the customer...',
                })}
              </Text>
            </>
          ) : (
            <TouchableOpacity
              key='updateButton'
              style={[
                styles.createButton,
                {
                  backgroundColor:
                    themeController.current?.buttonColorPrimaryDefault,
                  borderRadius: sizes.borderRadius,
                  width: sizes.saveBtnWidth,
                  height: sizes.saveBtnHeight,
                },
              ]}
              onPress={handleInterestRequest}
            >
              <Text
                style={{
                  color: 'white',
                  textAlign: 'center',
                  fontSize: sizes.saveBtnFont,
                }}
              >
                {t('showJob.buttons.interested', {
                  defaultValue: 'I am interested in the job',
                })}
              </Text>
            </TouchableOpacity>
          ),
        ];
      case 'jobs-in-progress':
        return [
          <TouchableOpacity
            key='completeBtn'
            style={[
              styles.createButton,
              {
                backgroundColor:
                  themeController.current?.buttonColorPrimaryDefault,
                borderRadius: sizes.borderRadius,
                width: sizes.saveBtnWidth,
                height: sizes.saveBtnHeight,
              },
            ]}
            onPress={() => setCompleteJobModalVisible(true)}
          >
            <Text
              style={{
                color: 'white',
                textAlign: 'center',
                fontSize: sizes.saveBtnFont,
              }}
            >
              {t('showJob.buttons.markCompleted', {
                defaultValue: 'Mark as completed',
              })}
            </Text>
          </TouchableOpacity>,
        ];
      case 'jobs-done':
        return [
          // <View
          //   style={
          //     isWebLandscape && {
          //       flexDirection: isRTL ? 'row-reverse' : 'row',
          //       gap: scaleByHeight(21, height),
          //     }
          //   }
          //   key='done-view'
          // >
          // </View>,
          <CommentsSection
            key='commentsSection'
            jobId={currentJobInfo?.id}
            userId={currentJobInfo?.creator}
            allowAdd={currentJobInfo?.comments?.length == 0}
            allowAddOnly={true}
          />
        ];
      default:
        return [];
    }
  }

  // Direct publish (no paywall modal) — used when user has subscription
  async function payToPublish(paymentOptions = {}) {
    try {
      setAppLoading(true);
      const data = await payForJob(currentJobInfo.id, session, paymentOptions);
      if (data.paymentUrl) {
        openWebView(data.paymentUrl, () => { });
      } else {
        jobsController.reloadCreator();
      }
      if (paymentOptions.useCoupon) {
        couponsManagerController?.refreshBalance();
      }
      setAppLoading(false);
      setPublishModalVisible(false);
    } catch (e) {
      setAppLoading(false);
      if (e.response && e.response.status === 400 && e.response.data.code == 'NO_COUPONS_AVAILABLE') {
        showWarning(t('errors.no_coupons', {
          defaultValue: 'You have no coupons available',
        }));
      } else {
        setPublishModalVisible(false);
      }
    }
  }

  // PurchaseModal: onPurchase handler for the publish paywall
  const handlePurchasePublish = async (payload) => {
    const data = await payForJob(currentJobInfo.id, session, payload);
    if (data.paymentUrl) {
      openWebView(data.paymentUrl, () => { });
    } else {
      jobsController.reloadCreator();
    }
    return data;
  };

  // PurchaseModal: onPayWithCoupons handler for the publish paywall
  const handlePayCouponsPublish = () => {
    setPublishModalVisible(false);
    setAppLoading(true);
    payForJob(currentJobInfo.id, session, { useCoupon: true })
      .then((data) => {
        jobsController.reloadCreator();
        couponsManagerController?.refreshBalance();
      })
      .catch((e) => {
        if (e.response?.status === 400 && e.response.data?.code === 'NO_COUPONS_AVAILABLE') {
          showWarning(t('errors.no_coupons', { defaultValue: 'You have no coupons available' }));
        }
      })
      .finally(() => setAppLoading(false));
  }

  const formContent = [
    <View
      style={[
        styles.inputBlock,
        dynamicStyles.inputBlock,
        { backgroundColor: themeController.current?.formInputBackground },
      ]}
      key='type'
    >
      <Text
        style={[
          styles.label,
          dynamicStyles.label,
          isRTL && { textAlign: 'right' },
        ]}
      >
        {t('showJob.fields.type', { defaultValue: 'Type' })}
      </Text>
      <CustomTextInput
        value={tField(currentJobInfo?.type, 'name') || '-'}
        style={[
          styles.input,
          dynamicStyles.input,
          isRTL && { textAlign: 'right' },
        ]}
        readOnly
      />
    </View>,
    <View
      style={[
        styles.inputBlock,
        dynamicStyles.inputBlock,
        { backgroundColor: themeController.current?.formInputBackground },
      ]}
      key='subType'
    >
      <Text
        style={[
          styles.label,
          dynamicStyles.label,
          isRTL && { textAlign: 'right' },
        ]}
      >
        {t('showJob.fields.subType', { defaultValue: 'Sub type' })}
      </Text>
      <CustomTextInput
        value={tField(currentJobInfo?.subType, 'name') || '-'}
        style={[
          styles.input,
          dynamicStyles.input,
          isRTL && { textAlign: 'right' },
        ]}
        readOnly
      />
    </View>,
    // <View
    //   style={[
    //     styles.inputBlock,
    //     dynamicStyles.inputBlock,
    //     { backgroundColor: themeController.current?.formInputBackground },
    //   ]}
    //   key='profession'
    // >
    //   <Text
    //     style={[
    //       styles.label,
    //       dynamicStyles.label,
    //       isRTL && { textAlign: 'right' },
    //     ]}
    //   >
    //     {t('showJob.fields.profession', { defaultValue: 'Profession' })}
    //   </Text>
    //   <CustomTextInput
    //     value={LICENSES[currentJobInfo?.profession] || '-'}
    //     style={[
    //       styles.input,
    //       dynamicStyles.input,
    //       isRTL && { textAlign: 'right' },
    //     ]}
    //     readOnly
    //   />
    // </View>,
    <View
      style={[
        styles.inputBlock,
        dynamicStyles.inputBlock,
        { backgroundColor: themeController.current?.formInputBackground },
      ]}
      key='location'
    >
      <Text
        style={[
          styles.label,
          dynamicStyles.label,
          isRTL && { textAlign: 'right' },
        ]}
      >
        {t('showJob.fields.location', { defaultValue: 'Location' })}
      </Text>
      <CustomTextInput
        value={location?.address || '-'}
        style={[
          styles.input,
          dynamicStyles.input,
          isRTL && { textAlign: 'right' },
        ]}
        readOnly
      />
    </View>,
    <View
      style={[
        styles.inputBlock,
        dynamicStyles.inputBlock,
        { backgroundColor: themeController.current?.formInputBackground },
      ]}
      key='description'
    >
      <Text
        style={[
          styles.label,
          dynamicStyles.label,
          isRTL && { textAlign: 'right' },
        ]}
      >
        {t('showJob.fields.description', { defaultValue: 'Description' })}
      </Text>
      <CustomTextInput
        value={currentJobInfo?.description || ''}
        style={[
          styles.input,
          dynamicStyles.input,
          { height: sizes.descriptionInputHeight },
          isRTL && { textAlign: 'right' },
        ]}
        multiline
        readOnly
      />
    </View>,
    <View
      style={[
        styles.inputBlock,
        dynamicStyles.inputBlock,
        { backgroundColor: themeController.current?.formInputBackground },
      ]}
      key='price'
    >
      <Text
        style={[
          styles.label,
          dynamicStyles.label,
          isRTL && { textAlign: 'right' },
        ]}
      >
        {t('showJob.fields.price', { defaultValue: 'Price' })}
      </Text>
      <CustomTextInput
        value={currentJobInfo?.price || '-'}
        style={[
          styles.input,
          dynamicStyles.input,
          isRTL && { textAlign: 'right' },
        ]}
        keyboardType='numeric'
        readOnly
      />
    </View>,
    <View
      style={[styles.imageInputBlock, dynamicStyles.imageInputBlock]}
      key='images'
    >
      <Text
        style={[
          styles.label,
          isRTL && { textAlign: 'right' },
          {
            fontSize: sizes.photosLabelSize,
            marginBottom: sizes.photosLabelMarginBottom,
            color: themeController.current?.textColor,
          },
        ]}
      >
        {t('showJob.fields.photos', {
          defaultValue: 'Photos',
        })}
      </Text>
      <View
        style={[
          styles.imageRow,
          dynamicStyles.imageRow,
          isRTL && { flexDirection: 'row-reverse' },
        ]}
      >
        {/* Скролл с картинками */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.imageScrollContainer,
            dynamicStyles.imageScrollContainer,
            !isWebLandscape && { width: '100%' },
            isRTL && { flexDirection: 'row-reverse' },
          ]}
        >
          {currentJobInfo?.images.length > 0 ? (
            <>
              {currentJobInfo?.images.map((uri, index) => (
                <View
                  key={index}
                  style={[
                    styles.imageWrapper,
                    dynamicStyles.imageWrapper,
                    isRTL && { marginRight: 0, marginLeft: 8 },
                  ]}
                >
                  <Image
                    source={{ uri }}
                    style={[
                      styles.imageThumbnail,
                      dynamicStyles.imageThumbnail,
                    ]}
                  />
                </View>
              ))}
            </>
          ) : (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                height: sizes.noPhotosMessageHeight,
                width: sizes.noPhotosMessageWidth,
              }}
            >
              <Text
                style={{
                  color: themeController?.current.formInputPlaceholderColor,
                  fontSize: sizes.noPhotosMessageSize,
                  opacity: 0.5,
                }}
              >
                {t('showJob.messages.noPhotosMessage')}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>,
    currentJobInfo?.experience ? (
      <View
        style={[
          styles.inputBlock,
          dynamicStyles.inputBlock,
          { backgroundColor: themeController.current?.formInputBackground },
        ]}
        key='experience'
      >
        <Text
          style={[
            styles.label,
            dynamicStyles.label,
            isRTL && { textAlign: 'right' },
          ]}
        >
          {t('showJob.fields.experience', { defaultValue: 'Experience' })}
        </Text>
        <CustomTextInput
          value={formatExperience(currentJobInfo?.experience, t)}
          style={[
            styles.input,
            dynamicStyles.input,
            isRTL && { textAlign: 'right' },
          ]}
          readOnly
        />
      </View>
    ) : null,
    <View
      style={[
        styles.row,
        {
          gap: sizes.dateTimeGapMobile,
          paddingBottom: sizes.mobileBottomPaddingExtraSpace, // чтобы не закрывались кнопками
        },
        isRTL && { flexDirection: 'row-reverse' },
      ]}
      key='dateTimeRange'
    >
      {Platform.OS !== 'android' ? (
        <DateTimeInput
          key='startDateTime'
          label={t('showJob.fields.start', { defaultValue: 'Start' })}
          value={currentJobInfo?.startDateTime}
          readOnly={true}
        />
      ) : (
        <DateTimeInputDouble
          label={t('showJob.fields.start', { defaultValue: 'Start' })}
          value={currentJobInfo?.startDateTime}
          readOnly={true}
        />
      )}
      {Platform.OS !== 'android' ? (
        <DateTimeInput
          key='endDateTime'
          label={t('showJob.fields.end', { defaultValue: 'End' })}
          value={currentJobInfo?.endDateTime}
          readOnly={true}
        />
      ) : (
        <DateTimeInputDouble
          label={t('showJob.fields.end', { defaultValue: 'End' })}
          value={currentJobInfo?.endDateTime}
          readOnly={true}
        />
      )}
    </View>,
    ...extraUiByStatus(status),
  ].filter(Boolean);

  // Грид версия (только веб-альбомная)
  const bg = themeController.current?.formInputBackground;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      {loading ? (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: themeController.current?.backgroundColor,
            paddingHorizontal: sizes.containerPaddingHorizontal,
          }}
        >
          <Text style={{ color: themeController.current?.unactiveTextColor }}>
            {t('showJob.messages.loading', { defaultValue: 'Loading...' })}
          </Text>
        </View>
      ) : (
        <View
          style={{
            flex: 1,
            backgroundColor: themeController.current?.backgroundColor,
            paddingHorizontal: sizes.containerPaddingHorizontal,
          }}
        >
          <View
            style={[
              styles.header,
              dynamicStyles.header,
              isRTL && { flexDirection: 'row-reverse' },
            ]}
          >
            <TouchableOpacity
              // onPress={() =>
              //   router.canGoBack?.() ? router.back() : router.replace('/store')
              // }
              onPress={() => closeModal()}
            >
              <Image
                source={icons.cross}
                style={{
                  width: sizes.crossIconSize,
                  height: sizes.crossIconSize,
                  tintColor: themeController.current?.formInputLabelColor,
                }}
                resizeMode='contain'
              />
            </TouchableOpacity>
            <Text style={[styles.logo, dynamicStyles.logo]}>FLALX</Text>
            <TouchableOpacity
              // onPress={() =>
              //   router.canGoBack?.() ? router.back() : router.replace('/store')
              // }
              onPress={() => setHistoryModal(true)}
            >
              <Image
                source={icons.history}
                style={{
                  width: sizes.historyIconSize,
                  height: sizes.historyIconSize,
                  tintColor: themeController.current?.formInputLabelColor,
                }}
              />
            </TouchableOpacity>
          </View>

          {Platform.OS === 'web' ? (
            isWebLandscape ? (
              <ScrollView
                contentContainerStyle={[
                  styles.container,
                  // { padding: sizes.margin },
                ]}
                keyboardShouldPersistTaps='handled'
              >
                <View
                  direction={isRTL ? 'rtl' : 'ltr'}
                  style={[
                    styles.gridContainer,
                    {
                      justifyContent: isRTL ? 'end' : 'start',
                      position: 'relative',
                      gridRowGap: scaleByHeight(15, height),
                      gridColumnGap: scaleByHeight(21, height),
                      gridTemplateColumns: `repeat(2, ${scaleByHeight(
                        330,
                        height
                      )}px)`,
                      gridTemplateRows: `
                        ${scaleByHeight(64, height)}px 
                        ${scaleByHeight(64, height)}px 
                        ${scaleByHeight(64, height)}px 
                        ${scaleByHeight(75, height)}px 
                        ${scaleByHeight(75, height)}px 
                        ${currentJobInfo?.experience
                          ? `${scaleByHeight(64, height)}px`
                          : ''
                        }
                        ${scaleByHeight(64, height)}px 
                      `,
                    },
                  ]}
                >
                  {/* Колонка 1: Type */}
                  <View
                    style={{
                      gridArea: isRTL ? '1 / 2 / 2 / 3' : '1 / 1 / 2 / 2',
                    }}
                  >
                    <View
                      style={[
                        styles.inputBlock,
                        {
                          backgroundColor: bg,
                          paddingVertical: sizes.inputContainerPaddingVertical,
                          paddingHorizontal:
                            sizes.inputContainerPaddingHorizontal,
                          borderRadius: sizes.borderRadius,
                          marginBottom: 0,
                          height: sizes.inputHeight,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.label,
                          {
                            color: themeController.current?.unactiveTextColor,
                          },
                          isRTL && { textAlign: 'right' },
                          { fontSize: sizes.font },
                        ]}
                      >
                        {t('showJob.fields.type', { defaultValue: 'Type' })}
                      </Text>
                      <CustomTextInput
                        value={tField(currentJobInfo?.type, 'name') || '-'}
                        style={{
                          // fontWeight: '500',
                          fontFamily: 'Rubik-Medium',
                          padding: 0,
                          paddingVertical: sizes.padding,
                          color: themeController.current?.textColor,
                          fontSize: sizes.inputFont,
                          borderRadius: sizes.borderRadius,
                          backgroundColor: 'transparent',
                          textAlign: isRTL ? 'right' : 'left',
                        }}
                        readOnly
                      />
                    </View>
                  </View>

                  {/* Колонка 2 (растянутая по высоте): Description */}
                  <View
                    style={{
                      gridArea: isRTL ? '1 / 1 / 3 / 2' : '1 / 2 / 3 / 3',
                    }}
                  >
                    <View
                      style={[
                        styles.inputBlock,
                        {
                          backgroundColor: bg,
                          paddingVertical: sizes.inputContainerPaddingVertical,
                          paddingHorizontal:
                            sizes.inputContainerPaddingHorizontal,
                          borderRadius: sizes.borderRadius,
                          height: '100%',
                          marginBottom: 0,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.label,
                          {
                            color: themeController.current?.unactiveTextColor,
                          },
                          isRTL && { textAlign: 'right' },
                          { fontSize: sizes.font },
                        ]}
                      >
                        {t('showJob.fields.description', {
                          defaultValue: 'Description',
                        })}
                      </Text>
                      <CustomTextInput
                        value={currentJobInfo?.description || ''}
                        style={{
                          // fontWeight: '500',
                          fontFamily: 'Rubik-Medium',
                          padding: 0,
                          paddingVertical: sizes.padding,
                          color: themeController.current?.textColor,
                          fontSize: sizes.inputFont,
                          borderRadius: sizes.borderRadius,
                          backgroundColor: 'transparent',
                          textAlign: isRTL ? 'right' : 'left',
                        }}
                        multiline
                        readOnly
                      />
                    </View>
                  </View>

                  {/* Sub type */}
                  <View
                    style={{
                      gridArea: isRTL ? '2 / 2 / 3 / 3' : '2 / 1 / 3 / 2',
                    }}
                  >
                    <View
                      style={[
                        styles.inputBlock,
                        {
                          backgroundColor: bg,
                          padding: 0,
                          paddingHorizontal:
                            sizes.inputContainerPaddingHorizontal,
                          paddingVertical: sizes.inputContainerPaddingVertical,
                          borderRadius: sizes.borderRadius,
                          marginBottom: 0,
                          height: sizes.inputHeight,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.label,
                          {
                            color: themeController.current?.unactiveTextColor,
                          },
                          isRTL && { textAlign: 'right' },
                          { fontSize: sizes.font },
                        ]}
                      >
                        {t('showJob.fields.subType', {
                          defaultValue: 'Sub type',
                        })}
                      </Text>
                      <CustomTextInput
                        value={tField(currentJobInfo?.subType, 'name') || '-'}
                        style={{
                          // fontWeight: '500',
                          fontFamily: 'Rubik-Medium',
                          padding: 0,
                          paddingVertical: sizes.padding,
                          color: themeController.current?.textColor,
                          fontSize: sizes.inputFont,
                          borderRadius: sizes.borderRadius,
                          backgroundColor: 'transparent',
                          textAlign: isRTL ? 'right' : 'left',
                        }}
                        readOnly
                      />
                    </View>
                  </View>

                  {/* Profession */}
                  <View
                    style={{
                      gridArea: isRTL ? '3 / 2 / 4 / 3' : '3 / 1 / 4 / 2',
                    }}
                  >
                    {/* Location */}
                    <View
                      style={[
                        styles.inputBlock,
                        {
                          backgroundColor: bg,
                          paddingVertical: sizes.inputContainerPaddingVertical,
                          paddingHorizontal:
                            sizes.inputContainerPaddingHorizontal,
                          borderRadius: sizes.borderRadius,
                          marginBottom: 0,
                          height: sizes.inputHeight,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.label,
                          {
                            color: themeController.current?.unactiveTextColor,
                          },
                          isRTL && { textAlign: 'right' },
                          { fontSize: sizes.font },
                        ]}
                      >
                        {t('showJob.fields.location', {
                          defaultValue: 'Location',
                        })}
                      </Text>
                      <CustomTextInput
                        value={location?.address || '-'}
                        style={{
                          // fontWeight: '500',
                          fontFamily: 'Rubik-Medium',
                          color: themeController.current?.textColor,
                          padding: 0,
                          paddingVertical: sizes.padding,
                          fontSize: sizes.inputFont,
                          borderRadius: sizes.borderRadius,
                          backgroundColor: 'transparent',
                          textAlign: isRTL ? 'right' : 'left',
                        }}
                        readOnly
                      />
                    </View>
                    {/* <View
                      style={[
                        styles.inputBlock,
                        {
                          backgroundColor: bg,
                          padding: 0,
                          paddingHorizontal:
                            sizes.inputContainerPaddingHorizontal,
                          paddingVertical: sizes.inputContainerPaddingVertical,
                          borderRadius: sizes.borderRadius,
                          marginBottom: 0,
                          height: sizes.inputHeight,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.label,
                          {
                            color: themeController.current?.unactiveTextColor,
                          },
                          isRTL && { textAlign: 'right' },
                          { fontSize: sizes.font },
                        ]}
                      >
                        {t('showJob.fields.profession', {
                          defaultValue: 'Profession',
                        })}
                      </Text>
                      <CustomTextInput
                        value={LICENSES[currentJobInfo?.profession] || '-'}
                        style={{
                          fontWeight: '500',
                          padding: 0,
                          paddingVertical: sizes.padding,
                          color: themeController.current?.textColor,
                          fontSize: sizes.inputFont,
                          borderRadius: sizes.borderRadius,
                          backgroundColor: 'transparent',
                          textAlign: isRTL ? 'right' : 'left',
                        }}
                        readOnly
                      />
                    </View> */}
                  </View>

                  {/* Price */}
                  <View
                    style={{
                      gridArea: isRTL ? '3 / 1 / 4 / 2' : '3 / 2 / 4 / 3',
                    }}
                  >
                    <View
                      style={[
                        styles.inputBlock,
                        {
                          backgroundColor: bg,
                          padding: 0,
                          paddingHorizontal:
                            sizes.inputContainerPaddingHorizontal,
                          paddingVertical: sizes.inputContainerPaddingVertical,
                          borderRadius: sizes.borderRadius,
                          marginBottom: 0,
                          height: sizes.inputHeight,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.label,
                          {
                            color: themeController.current?.unactiveTextColor,
                          },
                          isRTL && { textAlign: 'right' },
                          { fontSize: sizes.font },
                        ]}
                      >
                        {t('showJob.fields.price', { defaultValue: 'Price' })}
                      </Text>
                      <CustomTextInput
                        value={currentJobInfo?.price || '-'}
                        style={{
                          // fontWeight: '500',
                          fontFamily: 'Rubik-Medium',
                          padding: 0,
                          paddingVertical: sizes.padding,
                          color: themeController.current?.textColor,
                          fontSize: sizes.inputFont,
                          borderRadius: sizes.borderRadius,
                          backgroundColor: 'transparent',
                          textAlign: isRTL ? 'right' : 'left',
                        }}
                        keyboardType='numeric'
                        readOnly
                      />
                    </View>
                  </View>

                  {/* Photos (full width) */}
                  <View style={{ gridArea: '4 / 1 / 6 / 3' }}>
                    <Text
                      style={[
                        styles.label,
                        isRTL && { textAlign: 'right' },
                        {
                          fontSize: sizes.photosLabelSize,
                          marginBottom: sizes.photosLabelMarginBottom,
                          color: themeController.current?.textColor,
                        },
                      ]}
                    >
                      {t('showJob.fields.photos', {
                        defaultValue: 'Photos',
                      })}
                    </Text>
                    <View
                      style={[
                        styles.imageRow,
                        isRTL && { flexDirection: 'row-reverse' },
                      ]}
                    >
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={[
                          styles.imageScrollContainer,
                          isRTL && { flexDirection: 'row-reverse' },
                        ]}
                      >
                        {currentJobInfo?.images.length > 0 ? (
                          <>
                            {currentJobInfo?.images.map((uri, index) => (
                              <View
                                key={index}
                                style={[
                                  styles.imageWrapper,
                                  {
                                    backgroundColor:
                                      themeController.current
                                        ?.formInputBackground,
                                    marginRight: isRTL ? 0 : sizes.margin / 2,
                                    marginLeft: isRTL ? sizes.margin / 2 : 0,
                                  },
                                ]}
                              >
                                <Image
                                  source={{ uri }}
                                  style={{
                                    width: sizes.thumb,
                                    height: sizes.thumb,
                                    borderRadius: sizes.borderRadius,
                                  }}
                                />
                              </View>
                            ))}
                          </>
                        ) : (
                          <View
                            style={{
                              justifyContent: 'center',
                              alignItems: 'center',
                              height: sizes.noPhotosMessageHeight,
                              width: sizes.noPhotosMessageWidth,
                            }}
                          >
                            <Text
                              style={{
                                color:
                                  themeController?.current
                                    .formInputPlaceholderColor,
                                fontSize: sizes.noPhotosMessageSize,
                                opacity: 0.5,
                              }}
                            >
                              {t('showJob.messages.noPhotosMessage')}
                            </Text>
                          </View>
                        )}
                      </ScrollView>
                    </View>
                  </View>

                  {/* Experience */}
                  {currentJobInfo?.experience && (
                    <View
                      style={{
                        gridArea: isRTL ? '6 / 2 / 7 / 3' : '6 / 1 / 7 / 2',
                      }}
                    >
                      <View
                        style={[
                          styles.inputBlock,
                          {
                            backgroundColor: bg,
                            padding: 0,
                            paddingHorizontal:
                              sizes.inputContainerPaddingHorizontal,
                            paddingVertical:
                              sizes.inputContainerPaddingVertical,
                            borderRadius: sizes.borderRadius,
                            marginBottom: 0,
                            height: sizes.inputHeight,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.label,
                            {
                              color:
                                themeController.current?.unactiveTextColor,
                            },
                            isRTL && { textAlign: 'right' },
                            { fontSize: sizes.font },
                          ]}
                        >
                          {t('showJob.fields.experience')}
                        </Text>
                        <CustomTextInput
                          value={formatExperience(
                            currentJobInfo?.experience,
                            t
                          )}
                          style={{
                            // fontWeight: '500',
                            fontFamily: 'Rubik-Medium',
                            padding: 0,
                            paddingVertical: sizes.padding,
                            color: themeController.current?.textColor,
                            fontSize: sizes.inputFont,
                            borderRadius: sizes.borderRadius,
                            backgroundColor: 'transparent',
                            textAlign: isRTL ? 'right' : 'left',
                          }}
                          keyboardType='numeric'
                          readOnly
                        />
                      </View>
                    </View>
                  )}

                  {/* Start date */}
                  <View
                    style={{
                      gridArea: isRTL
                        ? currentJobInfo?.experience
                          ? '7 / 2 / 8 / 3'
                          : '6 / 2 / 7 / 3'
                        : currentJobInfo?.experience
                          ? '7 / 1 / 8 / 2'
                          : '6 / 1 / 7 / 2',
                    }}
                  >
                    <View
                      style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
                    >
                      {Platform.OS !== 'android' ? (
                        <DateTimeInput
                          key='startDateTime'
                          label={t('showJob.fields.start', {
                            defaultValue: 'Start',
                          })}
                          value={currentJobInfo?.startDateTime}
                          readOnly={true}
                        />
                      ) : (
                        <DateTimeInputDouble
                          label={t('showJob.fields.start', {
                            defaultValue: 'Start',
                          })}
                          value={currentJobInfo?.startDateTime}
                          readOnly={true}
                        />
                      )}
                    </View>
                  </View>

                  {/* End date */}
                  <View
                    style={{
                      gridArea: isRTL
                        ? currentJobInfo?.experience
                          ? '7 / 1 / 8 / 2'
                          : '6 / 1 / 7 / 2'
                        : currentJobInfo?.experience
                          ? '7 / 2 / 8 / 3'
                          : '6 / 2 / 7 / 3',
                    }}
                  >
                    <View
                      style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
                    >
                      {Platform.OS !== 'android' ? (
                        <DateTimeInput
                          key='endDateTime'
                          label={t('showJob.fields.end', {
                            defaultValue: 'End',
                          })}
                          value={currentJobInfo?.endDateTime}
                          readOnly={true}
                        />
                      ) : (
                        <DateTimeInputDouble
                          label={t('showJob.fields.end', {
                            defaultValue: 'End',
                          })}
                          value={currentJobInfo?.endDateTime}
                          readOnly={true}
                        />
                      )}
                    </View>
                  </View>
                </View>

                {/* Остальные элементы ВНЕ сетки, обычной колонкой */}
                <View
                  style={{
                    marginTop: currentJobInfo.status === 'pending' || currentJobInfo.status === 'pending_moderation' ? 0 : sizes.margin,
                    gap: sizes.margin / 2
                  }}
                >
                  {extraUiByStatus(status).map((node, idx) => (
                    <View key={`extra-${idx}`} style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>{node}</View>
                  ))}
                  {bottomButtonByStatus(status).map((node, idx) => (
                    <View key={`extra-btn-${idx}`} style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>{node}</View>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <CustomFlatList
                data={formContent}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item }) => item}
                contentContainerStyle={{
                  // ...styles.container,
                  ...{
                    gap: sizes.mobileGap,
                    height: '90%',
                    width: '100%',
                    overflow: 'auto',
                  },
                }}
                keyboardShouldPersistTaps='handled'
              />
            )
          ) : (
            <FlatList
              data={formContent}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item }) => item}
              contentContainerStyle={{
                // ...styles.container,
                ...{
                  gap: sizes.mobileGap,
                  height: '90%',
                  width: '100%',
                  overflow: 'auto',
                },
              }}
              keyboardShouldPersistTaps='handled'
            />
          )}
          {!isWebLandscape && (
            <View
              style={[
                styles.bottomButtonWrapper,
                {
                  width: width,
                  backgroundColor: themeController.current?.backgroundColor,
                  paddingHorizontal: sizes.containerPaddingHorizontal,
                  paddingVertical: sizes.mobileBottomContainerPaddingVertical,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: -6 },
                  shadowOpacity: 0.12,
                  shadowRadius: 8,
                  elevation: 16,
                },
              ]}
            >
              {bottomButtonByStatus(status).map((node, idx) => (
                <View key={`extra-btn-${idx}`}>{node}</View>
              ))}
            </View>
          )}
        </View>
      )}
      {/* Edit job modal */}
      {/* <Modal visible={newJobModalVisible} animationType='slide'>
        <NewJobModal
          closeModal={() => setNewJobModalVisible(false)}
          editMode={true}
          currentJobId={currentJobId}
          initialJob={currentJobInfo}
        />
      </Modal> */}
      {isWebLandscape ? (
        <JobModalWrapper visible={newJobModalVisible} main={false}>
          <NewJobModal
            closeModal={() => setNewJobModalVisible(false)}
            editMode={true}
            currentJobId={currentJobId}
            initialJob={currentJobInfo}
          />
        </JobModalWrapper>
      ) : (
        <Modal visible={newJobModalVisible} animationType='slide' transparent>
          <NewJobModal
            closeModal={() => setNewJobModalVisible(false)}
            editMode={true}
            currentJobId={currentJobId}
            initialJob={currentJobInfo}
          />
        </Modal>
      )}
      {currentJobInfo && <PurchaseModal
        visible={publishModalVisible}
        onClose={() => setPublishModalVisible(false)}
        price={formatCurrency(
          jobsController.products?.find((p) => p.type === currentJobInfo.jobType)?.price,
          jobsController.products?.find((p) => p.type === currentJobInfo.jobType)?.currency,
        )}
        onPurchase={handlePurchasePublish}
        onPayWithCoupons={handlePayCouponsPublish}
        onOpenSubscriptions={() => {
          setPlansModalVisible(true);
          setPublishModalVisible(false);
        }}
      />}

      {/* Cancel interest modal */}
      <Modal visible={showCancelRequestModal} transparent animationType='fade'>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: themeController.current?.backgroundColor,
                width: sizes.modalWidth,
                padding: sizes.modalPadding,
                borderRadius: sizes.modalBtnBorderRadius,
              },
              isWebLandscape && { height: sizes.modalHeight },
            ]}
          >
            <TouchableOpacity
              style={[
                {
                  position: 'absolute',
                  top: sizes.modalCloseBtnTopRightPosition,
                  right: sizes.modalCloseBtnTopRightPosition,
                },
              ]}
              onPress={() => setAcceptModalVisible(false)}
            >
              <Image
                source={icons.cross}
                style={{
                  width: sizes.iconSize,
                  height: sizes.iconSize,
                  tintColor: themeController.current?.textColor,
                }}
              />
            </TouchableOpacity>
            <Text
              style={[
                styles.modalText,
                {
                  fontSize: sizes.modalFont,
                  marginBottom: sizes.modalTextMarginBottom,
                  textAlign: 'center',
                  color: themeController.current?.textColor,
                  lineHeight: sizes.modalLineHeight,
                },
              ]}
            >
              {t('showJob.messages.confirmCancelTitle', {
                defaultValue: 'Are you sure to cancel the request?',
              })}
            </Text>
            <View
              style={[
                styles.modalButtonsRow,
                {
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  gap: sizes.modalBtnsGap,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor:
                      themeController.current?.buttonColorPrimaryDefault,
                    height: sizes.modalBtnHeight,
                    width: sizes.modalBtnWidth,
                    borderRadius: sizes.modalBtnBorderRadius,
                  },
                ]}
                onPress={() => setCancelRequestModal(false)}
              >
                <Text
                  style={{
                    color: themeController.current?.buttonTextColorPrimary,
                    fontSize: sizes.modalBtnFont,
                  }}
                >
                  {t('common.no', { defaultValue: 'No' })}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor:
                      themeController.current?.buttonTextColorSecondary,
                    borderColor:
                      themeController.current?.buttonColorPrimaryDefault,
                    height: sizes.modalBtnHeight,
                    width: sizes.modalBtnWidth,
                    borderRadius: sizes.modalBtnBorderRadius,
                    borderWidth: 1,
                  },
                ]}
                onPress={() => {
                  setAppLoading(true);
                  jobsController.actions
                    .removeProvider(currentJobId)
                    .then(() => {
                      setCancelRequestModal(false);
                      setInterestedRequest(false);

                      setAppLoading(false);
                    });
                }}
              >
                <Text
                  style={{
                    color: themeController.current?.buttonColorPrimaryDefault,
                    fontSize: sizes.modalBtnFont,
                  }}
                >
                  {t('common.yes', { defaultValue: 'Yes' })}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Confirm interest (paywall) modal */}
      <PurchaseModal
        visible={showConfirmInterestModal}
        onClose={() => setConfirmInterestModal(false)}
        price={formatCurrency(
          jobsController.providerProduct?.price,
          jobsController.providerProduct?.currency,
        )}
        onPurchase={handlePurchaseInterest}
        onPayWithCoupons={handlePayCouponsInterest}
        onOpenSubscriptions={() => {
          setPlansModalReturnTarget('purchase');
          setPlansModalVisible(true);
          setConfirmInterestModal(false);
        }}
        footerText={t('interestRequest.funds_disclosure')}
      />
      <InterestRequestModal
        visible={showInterestRequestModal}
        onClose={() => setShowInterestRequestModal(false)}
        isBusinessJob={currentJobInfo?.creator?.account_type === 'provider'}
        hasSubscription={subscription.current != null}
        price={formatCurrency(
          jobsController.providerProduct?.price,
          jobsController.providerProduct?.currency,
        )}
        onConfirm={handleConfirmInterestRequest}
        onPayWithCoupons={handlePayCouponsInterest}
        onOpenSubscriptions={() => {
          setPlansModalReturnTarget('interest');
          setPlansModalVisible(true);
          setShowInterestRequestModal(false);
        }}
        formData={interestFormData}
        setFormData={setInterestFormData}
        step={interestStep}
        setStep={setInterestStep}
      />
      <ChosenUserModal
        visible={showChosenUserModal}
        onClose={() => setShowChosenUserModal(false)}
        job={currentJobInfo}
        onConfirmPayment={() => new Promise((resolve) => setTimeout(() => resolve(Math.random() > 0.5), 50000))}
      />
      {/* <Modal visible={showHistoryModal} animationType='fade'>
        <View
          style={{
            flex: 1,
            backgroundColor: themeController.current?.backgroundColor,
          }}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setHistoryModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
            <Text
              style={[styles.logo, { color: themeController.current?.primaryColor }]}
            >
              FLALX
            </Text>
          </View>
        </View>
      </Modal> */}

      {/* Modal подтверждения */}
      <Modal visible={acceptModalVisible} transparent animationType='fade'>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: themeController.current?.backgroundColor,
                width: sizes.modalWidth,
                padding: sizes.modalPadding,
                borderRadius: sizes.modalBtnBorderRadius,
              },
              isWebLandscape && { height: sizes.modalHeight },
            ]}
          >
            <TouchableOpacity
              style={[
                {
                  position: 'absolute',
                  top: sizes.modalCloseBtnTopRightPosition,
                  right: sizes.modalCloseBtnTopRightPosition,
                },
              ]}
              onPress={() => setAcceptModalVisible(false)}
            >
              <Image
                source={icons.cross}
                style={{
                  width: sizes.iconSize,
                  height: sizes.iconSize,
                  tintColor: themeController.current?.textColor,
                }}
              />
            </TouchableOpacity>
            <Text
              style={[
                styles.modalText,
                {
                  fontSize: sizes.modalFont,
                  marginBottom: sizes.modalTextMarginBottom,
                  textAlign: 'center',
                  color: themeController.current?.textColor,
                  lineHeight: sizes.modalLineHeight,
                },
              ]}
            >
              {acceptModalVisibleTitle}
            </Text>
            <View
              style={[
                styles.modalButtonsRow,
                {
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  gap: sizes.modalBtnsGap,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor:
                      themeController.current?.buttonColorPrimaryDefault,
                    height: sizes.modalBtnHeight,
                    width: sizes.modalBtnWidth,
                    borderRadius: sizes.modalBtnBorderRadius,
                  },
                ]}
                onPress={() => setAcceptModalVisible(false)}
              >
                <Text
                  style={{
                    color: themeController.current?.buttonTextColorPrimary,
                    fontSize: sizes.modalBtnFont,
                  }}
                >
                  {t('common.no')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor:
                      themeController.current?.buttonTextColorSecondary,
                    borderColor:
                      themeController.current?.buttonColorPrimaryDefault,
                    height: sizes.modalBtnHeight,
                    width: sizes.modalBtnWidth,
                    borderRadius: sizes.modalBtnBorderRadius,
                    borderWidth: 1,
                  },
                ]}
                onPress={() => acceptModalVisibleFunc()}
              >
                <Text
                  style={{
                    color: themeController.current?.buttonColorPrimaryDefault,
                    fontSize: sizes.modalBtnFont,
                  }}
                >
                  {t('common.yes')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <JobHistoryModal
        visible={showHistoryModal}
        onClose={() => setHistoryModal(false)}
        history={
          currentJobInfo?.changes_history == null
            ? []
            : currentJobInfo.changes_history
        }
      />
      <SubscriptionsModal
        visible={plansModalVisible}
        main={false}
        closeModal={() => {
          setPlansModalVisible(false);
          if (subscription.current == null) {
            if (plansModalReturnTarget === 'interest') setShowInterestRequestModal(true);
            else if (plansModalReturnTarget === 'purchase') setConfirmInterestModal(true);
            else if (plansModalReturnTarget === 'publish' || currentJobInfo.status === 'pending') setPublishModalVisible(true);
          }
          setPlansModalReturnTarget(null);
        }}
      />
      <CompleteJobModal
        visible={completeJobModalVisible}
        main={false}
        closeModal={() => {
          setCompleteJobModalVisible(false);
        }}
        completeFunc={(options) => {
          completeJob(currentJobId, options, session).then(
            () => jobsController.reloadExecutor(),
            closeModal()
          );
        }}
      />
      <Modal visible={agreementModalVisible} transparent animationType='fade'>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: themeController.current?.backgroundColor,
                width: sizes.modalWidth,
                padding: sizes.modalPadding,
                borderRadius: sizes.modalBtnBorderRadius,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                {
                  position: 'absolute',
                  top: sizes.modalCloseBtnTopRightPosition,
                  right: sizes.modalCloseBtnTopRightPosition,
                },
              ]}
              onPress={() => {
                setAgreementModalVisible(false);
                closeModal();
              }}
            >
              <Image
                source={icons.cross}
                style={{
                  width: sizes.iconSize,
                  height: sizes.iconSize,
                  tintColor: themeController.current?.textColor,
                }}
              />
            </TouchableOpacity>
            <Text
              style={[
                styles.modalText,
                {
                  fontSize: sizes.modalFont,
                  marginBottom: sizes.modalTextMarginBottom,
                  textAlign: 'center',
                  color: themeController.current?.textColor,
                  lineHeight: sizes.modalLineHeight,
                },
              ]}
            >
              {t('showJob.agreement.title', {
                defaultValue: 'The job has been updated. Do you agree to the new terms?',
              })}
            </Text>
            {agreementChanges && Array.isArray(agreementChanges) && agreementChanges.length > 0 && (
              <View style={{ marginBottom: sizes.modalTextMarginBottom, alignSelf: 'stretch', alignItems: 'center' }}>
                {agreementChanges.map(({ field, was, will }, i) => (
                  <View
                    key={i}
                    style={[
                      {
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        marginBottom: 6,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: sizes.inputFont,
                        fontFamily: 'Rubik-SemiBold',
                        color: themeController.current?.textColor,
                        textAlign: 'center',
                      }}
                    >
                      {t(`showJob.fields.${field}`, { defaultValue: field })}:
                    </Text>
                    <Text
                      style={{
                        fontSize: sizes.inputFont,
                        color: themeController.current?.unactiveTextColor,
                        textDecorationLine: 'line-through',
                        textAlign: 'center',
                      }}
                    >
                      {formatFieldValue(field, was, jobTypesController, t)}
                    </Text>
                    <Text
                      style={{
                        fontSize: sizes.inputFont,
                        color: themeController.current?.unactiveTextColor,
                        textAlign: 'center',
                      }}
                    >
                      →
                    </Text>
                    <Text
                      style={{
                        fontSize: sizes.inputFont,
                        fontFamily: 'Rubik-SemiBold',
                        color: themeController.current?.primaryColor,
                        textAlign: 'center',
                      }}
                    >
                      {formatFieldValue(field, will, jobTypesController, t)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            <View
              style={[
                styles.modalButtonsRow,
                {
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  gap: sizes.modalBtnsGap,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor:
                      themeController.current?.buttonTextColorSecondary,
                    borderColor:
                      themeController.current?.buttonColorPrimaryDefault,
                    height: sizes.modalBtnHeight,
                    width: sizes.modalBtnWidth,
                    borderRadius: sizes.modalBtnBorderRadius,
                    borderWidth: 1,
                  },
                ]}
                onPress={handleDeclineJobUpdate}
              >
                <Text
                  style={{
                    color: themeController.current?.buttonColorPrimaryDefault,
                    fontSize: sizes.modalBtnFont,
                  }}
                >
                  {t('showJob.agreement.decline', { defaultValue: 'Decline' })}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor:
                      themeController.current?.buttonColorPrimaryDefault,
                    height: sizes.modalBtnHeight,
                    width: sizes.modalBtnWidth,
                    borderRadius: sizes.modalBtnBorderRadius,
                  },
                ]}
                onPress={handleAgreeToJobUpdate}
              >
                <Text
                  style={{
                    color: themeController.current?.buttonTextColorPrimary || 'white',
                    fontSize: sizes.modalBtnFont,
                  }}
                >
                  {t('showJob.agreement.agree', { defaultValue: 'Agree' })}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    /* Lines 2144-2145 omitted */
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  logo: {
    fontFamily: 'Rubik-Bold',
  },
  closeButton: {},
  modalCloseTouchableArea: {
    alignSelf: 'flex-end',
  },
  modalCloseButton: {},
  inputBlock: {
    ...Platform.select({
      web: {
        zIndex: 1,
      },
    }),
  },
  imageInputBlock: {
    ...Platform.select({
      web: {
        zIndex: 1,
      },
    }),
  },
  label: {},
  input: {
    width: '100%',
    fontFamily: 'Rubik-Medium',
    // fontWeight: '500',
  },
  addImageButton: {
    backgroundColor: '#84B0F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  imageScrollContainer: {
    flexDirection: 'row',
  },
  imageThumbnail: {},
  imageWrapper: {
    position: 'relative',
  },
  createButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  errorOutline: {
    shadowColor: 'red',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 2,
    paddingVertical: 2,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  waitText: {
    textAlign: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    position: 'relative',
    width: '80%',
    alignItems: 'center',
  },
  message: {
    // fontWeight: '500',
    fontFamily: 'Rubik-Medium',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  buttonColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  button: {
    flex: 1,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'Rubik-Medium',
  },
  editableTitlePanel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editPanel: {
    flexDirection: 'row',
  },
  gridContainer: {
    width: '100%',
    display: 'grid',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalCard: { width: '80%', position: 'relative' },
  modalButtonsRow: { justifyContent: 'center' },
  modalBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
  },
  modalText: {
    fontFamily: 'Rubik-Bold',
  },
  bottomButtonWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
});
