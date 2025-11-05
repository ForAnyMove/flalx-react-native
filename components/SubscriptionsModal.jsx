import {
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useComponentContext } from '../context/globalAppContext';
import JobModalWrapper from './JobModalWrapper';
import { useWindowInfo } from '../context/windowContext';
import { icons } from '../constants/icons';
import { scaleByHeight } from '../utils/resizeFuncs';
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import { useTranslation } from 'react-i18next';
import { createSubscription, downgradeSubscription, payForPlanUpgrade, upgradeSubscription } from '../src/api/subscriptions';
import { useWebView } from '../context/webViewContext';
import { useNotification } from '../src/render';

function SubscriptionsModalContent({ closeModal }) {
  const { themeController, languageController, subscriptionPlans, subscription, session, setAppLoading } = useComponentContext();
  const { showWarning, showInfo, showError } = useNotification()
  const { openWebView } = useWebView();
  const { width, height, isLandscape, sidebarWidth } = useWindowInfo();
  const { t } = useTranslation();
  const isRTL = languageController?.isRTL;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const tryPurchaseSubscription = async (planId) => {
    try {
      const findPlan = (planId) => {
        return subscriptionPlans.find((plan) => plan.id === planId);
      }

      const currentPlanId = subscription.current?.subscription_plans_id;
      if (currentPlanId != null) {

        if (findPlan(currentPlanId)?.level > findPlan(planId)?.level) {
          showInfo(t('subscriptions.messages.downgradeSubscription'), [{
            title: t('common.yes'),
            backgroundColor: '#45bb33ff',
            textColor: '#FFFFFF',
            onPress: async () => {
              setAppLoading(true);
              try {
                const result = await downgradeSubscription(session, subscription.current.id, planId);
                if (result.success && result.approval_url) {
                  openWebView(result.approval_url);
                }
                else if (result.success) {
                  const message = t('subscriptions.messages.downgradeSuccess');
                  showInfo(message);
                }
              } catch (error) {
                console.error("Error during upgradeSubscription:", error);
                if (error.response && error.response.data && error.response.data.error) {
                  showError(`### ${error.response.data.error}`);
                }
              } finally {
                setAppLoading(false);
              }
            }
          }, {
            title: t('common.no'),
            backgroundColor: '#f65454ff',
            textColor: '#FFFFFF',
          }]);
        } else if (findPlan(currentPlanId)?.level < findPlan(planId)?.level) {
          showInfo(t('subscriptions.messages.upgradeSubscriptionText'), [{
            title: t('common.yes'),
            backgroundColor: '#45bb33ff',
            textColor: '#FFFFFF',
            onPress: async () => {
              setAppLoading(true);
              try {
                const result = await upgradeSubscription(session, subscription.current.id, planId);
                console.log('upgradeSubscription result:', result);

                if (result.success && result.payment_url) {
                  openWebView(result.payment_url);
                }
              } catch (error) {
                console.error("Error during upgradeSubscription:", error);
                if (error.response && error.response.data && error.response.data.error) {
                  showError(`### ${error.response.data.error}`);
                }
              } finally {
                setAppLoading(false);
              }
            }
          }, {
            title: 'No',
            backgroundColor: '#f65454ff',
            textColor: '#FFFFFF',
          }]);
        }

        return;
      }

      setAppLoading(true);

      const result = await createSubscription(session, planId);
      if (result.success && result.approvalUrl) {
        openWebView(result.approvalUrl);
      } else if (result.success == false && result.subscription) {
        const message = t('subscriptionAlreadyExist');

        showWarning(message);
      }

    } catch (error) {
      console.error("Error creating subscription:", error);
    } finally {
      setAppLoading(false);
    }
  };

  const tryUpgradeSubscription = async (subscription) => {
    try {
      setAppLoading(true);
      const result = await payForPlanUpgrade(session, subscription.id);
      if (result.success && result.approval_url) {
        openWebView(result.approval_url);
      }
    } catch (error) {
      setAppLoading(false);
      console.error("Error upgrading subscription:", error);
    } finally {
      setAppLoading(false);
    }
  };

  const sizes = {
    headerHeight: isWebLandscape ? scaleByHeight(50, height) : RFPercentage(7),
    headerMargin: isWebLandscape ? scaleByHeight(30, height) : RFValue(0),
    icon: isWebLandscape ? scaleByHeight(24, height) : RFValue(24),
    logoFont: isWebLandscape ? scaleByHeight(24, height) : RFValue(20),
    modalHeaderPadding: isWebLandscape ? scaleByHeight(7, height) : RFValue(10),
    modalHeaderPaddingTop: isWebLandscape
      ? scaleByHeight(32, height)
      : RFValue(15),
    containerPaddingHorizontal: isWebLandscape
      ? scaleByHeight(23, height)
      : RFValue(15),
    subscriptionsGap: isWebLandscape ? scaleByHeight(23, height) : RFValue(15),
    subscriptionMarginBottom: isWebLandscape
      ? scaleByHeight(23, height)
      : RFValue(15),
    borderRadius: isWebLandscape ? scaleByHeight(8, height) : RFValue(5),
    subscriptionWidth: isWebLandscape
      ? scaleByHeight(419, height)
      : RFValue(300),
    subscriptionHeight: isWebLandscape
      ? scaleByHeight(220, height)
      : RFValue(150),
    subscriptionPadding: isWebLandscape
      ? scaleByHeight(14, height)
      : RFValue(15),
    subscriptionTitleFont: isWebLandscape
      ? scaleByHeight(18, height)
      : RFValue(18),
    subscriptionsTitleMargin: isWebLandscape
      ? scaleByHeight(15, height)
      : RFValue(15),
    subscriptionsDescriptionFont: isWebLandscape
      ? scaleByHeight(16, height)
      : RFValue(16),
    subscriptionsFeaturesFont: isWebLandscape
      ? scaleByHeight(12, height)
      : RFValue(12),
    priceMarginBottom: isWebLandscape ? scaleByHeight(23, height) : RFValue(15),
    subscriptionButtonFont: isWebLandscape
      ? scaleByHeight(20, height)
      : RFValue(16),
    subscriptionsContainerWidth: isWebLandscape
      ? scaleByHeight(900, height)
      : '100%',
    btnWidth: isWebLandscape ? scaleByHeight(387, height) : RFValue(150),
    btnHeight: isWebLandscape ? scaleByHeight(52, height) : RFValue(40),
  };

  //#region helpers

  const getSubscriptionButtonLabel = (changes, isActive, isPendingOnUpgrade, isPendingOnDowngrade, isPendingApproval) => {
    if (isPendingOnUpgrade === true) return `Pay ${changes.prorated_amount}$`;
    if (isPendingOnDowngrade === true) return `Waiting until ${new Date(changes.effective_date).toLocaleDateString()}`;
    if (isPendingApproval === true) return `Approve on PayPal`;
    if (isActive) return t('subscriptions.active');
    return t('subscriptions.choose');
  }

  const isSubscriptionButtonActive = (changes, isActive, isPendingOnUpgrade, isPendingOnDowngrade, isPendingApproval) => {
    if (isPendingApproval === true) return true;
    return !isActive && (isPendingOnDowngrade === false || isPendingOnDowngrade == null);
  }

  //#endregion

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => {
        closeModal(false);
      }}
      style={{
        flex: 1,
      }}
    >
      <TouchableOpacity
        activeOpacity={1}
        style={{
          height: height,
          width: width - (isLandscape ? sidebarWidth : 0),
          backgroundColor: themeController.current?.backgroundColor,
          alignSelf: isRTL ? 'flex-start' : 'flex-end',
          paddingHorizontal: sizes.containerPaddingHorizontal,
        }}
        onPress={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Header */}
        <View
          style={[
            styles.modalHeader,
            {
              flexDirection: isRTL ? 'row-reverse' : 'row',
              paddingHorizontal: sizes.modalHeaderPadding,
              paddingVertical: sizes.modalHeaderPaddingTop,
              backgroundColor: themeController.current?.backgroundColor,
              borderBottomColor:
                themeController.current?.profileDefaultBackground,
              height: sizes.headerHeight,
              marginVertical: sizes.headerMargin,
              borderBottomWidth: 2,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => {
              closeModal(false);
            }}
          >
            <Image
              source={isRTL ? icons.forward : icons.back}
              style={{
                width: sizes.icon,
                height: sizes.icon,
                tintColor: themeController.current?.textColor,
              }}
            />
          </TouchableOpacity>
          <Text
            style={[
              styles.modalTitle,
              {
                fontSize: sizes.logoFont,
                color: themeController.current?.primaryColor,
              },
            ]}
          >
            FLALX
          </Text>
        </View>

        <ScrollView contentContainerStyle={{}}>
          <View
            style={{
              gap: sizes.subscriptionsGap,
              width: sizes.subscriptionsContainerWidth,
              flexWrap: 'wrap',
              flexDirection: 'row',
              alignSelf: isRTL ? 'flex-end' : 'flex-start',
              justifyContent: isRTL ? 'flex-end' : 'flex-start',
            }}
          >
            {subscriptionPlans.map((value) => {
              const isActive = subscription.current?.subscription_plans_id === value.id;
              const changes = subscription.current?.changes?.find((change) => change.target_paypal_plan_id == value.paypal_plan_id && change.status != 'pending' && change.status != 'completed');
              const isPendingOnUpgrade = changes == null ? null : changes.status === 'payment_required' && changes.change_type === 'upgrade';
              const isPendingOnDowngrade = changes == null ? null : changes.status === 'automatic_payment_required' && changes.change_type === 'downgrade';

              const isPendingApproval = subscription.current?.status === 'pending_approval' && isActive;

              return <View
                key={value.id}
                style={[
                  {
                    borderRadius: sizes.borderRadius,
                    width: sizes.subscriptionWidth,
                    // height: sizes.subscriptionHeight,
                    padding: sizes.subscriptionPadding,
                    marginBottom: sizes.subscriptionMarginBottom,
                    backgroundColor:
                      themeController.current?.formInputBackground,
                    boxSizing: 'border-box',
                    alignItems: isRTL ? 'flex-end' : 'flex-start',
                  },
                  value.id === 'pro' && {
                    borderColor:
                      themeController.current?.buttonColorSecondaryDefault,
                    borderWidth: 2,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: sizes.subscriptionTitleFont,
                    marginBottom: sizes.subscriptionsTitleMargin,
                    color: themeController.current?.textColor,
                    fontFamily: 'Rubik-Bold',
                  }}
                >
                  {value.name}
                </Text>
                <Text
                  style={{
                    fontSize: sizes.subscriptionsDescriptionFont,
                    marginBottom: sizes.subscriptionsTitleMargin,
                    color: themeController.current?.unactiveTextColor,
                  }}
                >
                  {value.description}
                </Text>
                {value.features.map((feature, index) => (
                  <Text
                    key={index}
                    style={{
                      fontSize: sizes.subscriptionsFeaturesFont,
                      color: themeController.current?.textColor,
                    }}
                  >
                    {`• ${feature}`}
                  </Text>
                ))}
                <View style={{ marginBottom: sizes.priceMarginBottom / 2 }} />
                <Text
                  style={{
                    fontSize: sizes.subscriptionsDescriptionFont,
                    fontFamily: 'Rubik-Bold',
                    color: themeController.current?.textColor,
                    marginBottom: sizes.priceMarginBottom,
                  }}
                >
                  {value.price}$/{t('subscriptions.month')}
                </Text>
                {isPendingOnUpgrade ? <Text style={{ color: '#ff8800ff' }}>{`${changes.notes}\n\n${changes.prorated_amount}$ for ${changes.prorated_remaining_days} days remaining`}</Text> : null}
                {isPendingOnDowngrade ? <Text style={{ color: '#ff8800ff' }}>{`Your plan is being downgraded, you can use ${subscription.current?.plan?.name} until next billing cycle`}</Text> : null}
                {isPendingApproval && <Text style={{ color: '#ff8800ff' }}>{`Your subscription is pending approval. Please confirm it on paypal.`}</Text>}
                <View style={{ marginBottom: sizes.priceMarginBottom }} />
                <TouchableOpacity
                  onPress={() => {
                    if (isPendingOnUpgrade) {
                      tryUpgradeSubscription(subscription.current);
                    }
                    else if (!isActive && !isPendingOnDowngrade) {
                      tryPurchaseSubscription(value.id);
                    }
                  }}
                  style={{
                    backgroundColor:
                      value.id === 'pro'
                        ? themeController.current?.buttonColorSecondaryDefault
                        : themeController.current?.buttonColorPrimaryDefault,
                    alignSelf: 'center',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: sizes.borderRadius,
                    width: sizes.btnWidth,
                    height: sizes.btnHeight,
                    opacity: !isSubscriptionButtonActive(changes, isActive, isPendingOnUpgrade, isPendingOnDowngrade, isPendingApproval) ? 0.5 : 1,
                    pointerEvents: isSubscriptionButtonActive(changes, isActive, isPendingOnUpgrade, isPendingOnDowngrade, isPendingApproval) ? 'auto' : 'none',
                  }}
                  accessible={!isSubscriptionButtonActive(changes, isActive, isPendingOnUpgrade, isPendingOnDowngrade, isPendingApproval)}
                >
                  <Text
                    style={{
                      fontSize: sizes.subscriptionButtonFont,
                      color:
                        value.id === 'pro'
                          ? themeController.current?.buttonTextColorSecondary
                          : themeController.current?.buttonTextColorPrimary,
                      textAlign: 'center',
                      textAlignVertical: 'center',
                    }}
                  >
                    {getSubscriptionButtonLabel(changes, isActive, isPendingOnUpgrade, isPendingOnDowngrade, isPendingApproval)}
                  </Text>
                </TouchableOpacity>
              </View>;
            })}
          </View>
        </ScrollView>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function SubscriptionsModal({ visible, main, closeModal }) {
  const { isWebLandscape } = useComponentContext();
  return (
    <>
      {isWebLandscape ? (
        <JobModalWrapper visible={visible} main={main}>
          <SubscriptionsModalContent closeModal={closeModal} />
        </JobModalWrapper>
      ) : (
        <Modal visible={visible} animationType='slide' transparent>
          <SubscriptionsModalContent closeModal={closeModal} />
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: RFValue(10),
    borderBottomWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontWeight: 'bold',
    color: '#0A62EA',
    fontFamily: 'Rubik-Bold',
  },
});
