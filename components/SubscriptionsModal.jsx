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
import { icons } from '../constants/icons';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import { useTranslation } from 'react-i18next';
import {
  addPaymentMethodToSubscription,
  cancelSubscription,
  createSubscription,
  downgradeSubscription,
  payForPlanUpgrade,
  reactivateSubscription,
  upgradeSubscription,
  updateSubscriptionPaymentMethod,
} from '../src/api/subscriptions';
import { useWebView } from '../context/webViewContext';
import { useNotification } from '../src/render';
import { useMemo, useState } from 'react';
import { useLocalization } from '../src/services/useLocalization';
import { useWindowInfo } from '../context/windowContext';
import { formatCurrency } from '../utils/currency_formatter';
import { logError, logInfo } from '../utils/log_util';
import PurchaseModal from './PurchaseModal';

function SubscriptionsModalContent({ closeModal }) {
  const {
    themeController,
    languageController,
    subscriptionPlans,
    subscription,
    session,
    setAppLoading,
    paymentsManagerController,
  } = useComponentContext();
  const { tField } = useLocalization(languageController?.current);
  const { showWarning, showInfo, showError } = useNotification();
  const { openWebView } = useWebView();
  const { width, height, isLandscape, effectiveSidebarWidth } = useWindowInfo();
  const { t } = useTranslation();
  const isRTL = languageController?.isRTL;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  // ─── Subscription purchase modal state ───────────────────────────────────────
  const [subPurchaseModal, setSubPurchaseModal] = useState({
    visible: false,
    action: null,   // 'new' | 'update' | 'reactivate'
    planId: null,
    subscriptionId: null,
    price: null,
  });

  const openSubPurchaseModal = (action, config) =>
    setSubPurchaseModal({ visible: true, action, planId: null, subscriptionId: null, price: null, ...config });

  const closeSubPurchaseModal = () =>
    setSubPurchaseModal((s) => ({ ...s, visible: false }));

  const handleSubPurchaseModalPurchase = async (payload) => {
    const { action, planId, subscriptionId } = subPurchaseModal;
    if (action === 'new') {
      const result = await createSubscription(session, planId, payload);
      if (result.redirectUrl) openWebView(result.redirectUrl);
      return result;
    } else if (action === 'update') {
      // Update subscription payment method: saved method or new method (redirect)
      if (payload.savedPaymentMethodId) {
        // Change to existing saved payment method (no charge)
        const result = await updateSubscriptionPaymentMethod(
          session,
          subscriptionId,
          payload.savedPaymentMethodId,
        );
        showInfo(t('subscriptions.messages.paymentMethodUpdated'));
        return result ?? { success: true };
      } else {
        // Add new payment method via redirect (1 ILS charge)
        const result = await addPaymentMethodToSubscription(
          session,
          subscriptionId,
          payload.paymentMethod,
        );
        if (result.redirectUrl) openWebView(result.redirectUrl);
        return result;
      }
    } else if (action === 'reactivate') {
      const result = await reactivateSubscription(session, subscriptionId, payload.savedPaymentMethodId);
      return result ?? { success: true };
    }
  };

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
                logError("Error during upgradeSubscription:", error);
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

                if (result.success && result.payment_url) {
                  openWebView(result.payment_url);
                }
              } catch (error) {
                logError("Error during upgradeSubscription:", error);
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

      // No active subscription — open PurchaseModal to handle new subscription payment
      const plan = subscriptionPlans.find((p) => p.id === planId);
      openSubPurchaseModal('new', {
        planId,
        price: plan ? formatCurrency(plan.price, plan.currency) : null,
      });

    } catch (error) {
      logError("Error creating subscription:", error);
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
      logError("Error upgrading subscription:", error);
    } finally {
      setAppLoading(false);
    }
  };

  const tryCancelSubscription = async (subscriptionId) => {
    showInfo(t('subscriptions.messages.cancelSubscription'), [
      {
        title: t('common.yes'),
        backgroundColor: '#f65454ff',
        textColor: '#FFFFFF',
        onPress: async () => {
          setAppLoading(true);
          try {
            await cancelSubscription(session, subscriptionId);
            showInfo(t('subscriptions.messages.cancelSuccess'));
          } catch (error) {
            logError('Error cancelling subscription:', error);
            if (error.response?.data?.error) {
              showError(`### ${error.response.data.error}`);
            }
          } finally {
            setAppLoading(false);
          }
        },
      },
      {
        title: t('common.no'),
        backgroundColor: '#45bb33ff',
        textColor: '#FFFFFF',
      },
    ]);
  };

  const tryReactivateSubscription = async (subscriptionId) => {
    setAppLoading(true);
    try {
      await reactivateSubscription(session, subscriptionId);
      showInfo(t('subscriptions.messages.reactivateSuccess'));
    } catch (error) {
      logError('Error reactivating subscription:', error);
      if (error.response?.data?.error) {
        showError(`### ${error.response.data.error}`);
      }
    } finally {
      setAppLoading(false);
    }
  };

  const tryUpdatePaymentMethod = async (subscriptionId) => {
    const defaultSubMethod =
      paymentsManagerController?.savedMethods?.find((m) => m.isSubscription) ??
      paymentsManagerController?.savedMethods?.[0];
    if (!defaultSubMethod) {
      showError(t('subscriptions.messages.noSavedMethods'));
      return;
    }
    setAppLoading(true);
    try {
      await paymentsManagerController.updateSubscriptionPaymentMethod(subscriptionId, defaultSubMethod.id);
      showInfo(t('subscriptions.messages.paymentMethodUpdated'));
    } catch (error) {
      logError('Error updating subscription payment method:', error);
      showError(error?.message ?? t('errors.unexpected_error'));
    } finally {
      setAppLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return t('subscriptions.status_active');
      case 'pending_cancellation': return t('subscriptions.status_active');
      case 'past_due': return t('subscriptions.status_past_due');
      case 'grace': return t('subscriptions.status_grace');
      default: return '';
    }
  };

  const sizes = useMemo(() => {
    const scale = isWebLandscape ? scaleByHeight : scaleByHeightMobile;
    return {
      headerHeight: isWebLandscape ? scaleByHeight(50, height) : height * 0.07,
      headerMargin: isWebLandscape ? scaleByHeight(30, height) : 0,
      headerMarginBottom: isWebLandscape ? scaleByHeight(30, height) : scaleByHeight(20, height),
      icon: scale(24, height),
      logoFont: scale(24, height),
      modalHeaderPadding: scale(7, height),
      modalHeaderPaddingTop: scale(32, height),
      containerPaddingHorizontal: isWebLandscape ? scaleByHeight(23, height) : scaleByHeightMobile(12, height),
      subscriptionsGap: scale(23, height),
      subscriptionMarginBottom: scale(23, height),
      borderRadius: scale(8, height),
      subscriptionWidth: isWebLandscape
        ? scaleByHeight(419, height)
        : scaleByHeightMobile(300, height),
      subscriptionPadding: scale(14, height),
      subscriptionTitleFont: scale(18, height),
      subscriptionsTitleMargin: scale(15, height),
      subscriptionsDescriptionFont: scale(16, height),
      subscriptionsFeaturesFont: scale(12, height),
      priceMarginBottom: scale(23, height),
      subscriptionButtonFont: scale(20, height),
      subscriptionsContainerWidth: isWebLandscape
        ? scaleByHeight(900, height)
        : '100%',
      btnWidth: isWebLandscape
        ? scaleByHeight(387, height)
        : scaleByHeightMobile(150, height),
      btnHeight: isWebLandscape
        ? scaleByHeight(52, height)
        : scaleByHeightMobile(40, height),
    };
  }, [isWebLandscape, height]);

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
    <>
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
            width: isWebLandscape ? width - effectiveSidebarWidth : width,
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
                marginBottom: sizes.headerMarginBottom,
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
                const subStatus = isActive ? subscription.current?.status : null;
                const isUsableSubscription =
                  subStatus === 'active' ||
                  subStatus === 'pending_cancellation' ||
                  subStatus === 'past_due' ||
                  subStatus === 'grace';

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
                      justifyContent: 'space-between'
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
                    {tField(value, 'name')}
                  </Text>
                  <Text
                    style={{
                      fontSize: sizes.subscriptionsDescriptionFont,
                      marginBottom: sizes.subscriptionsTitleMargin,
                      color: themeController.current?.unactiveTextColor,
                    }}
                  >
                    {tField(value, 'description')}
                  </Text>
                  {tField(value, 'features').map((feature, index) => (
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
                    {formatCurrency(value.price, value.currency)}/{t('subscriptions.month')}
                  </Text>
                  {isPendingOnUpgrade ? <Text style={{ color: '#ff8800ff' }}>{`${changes.notes}\n\n${changes.prorated_amount}$ for ${changes.prorated_remaining_days} days remaining`}</Text> : null}
                  {isPendingOnDowngrade ? <Text style={{ color: '#ff8800ff' }}>{`Your plan is being downgraded, you can use ${subscription.current?.plan?.name} until next billing cycle`}</Text> : null}
                  {isPendingApproval && <Text style={{ color: '#ff8800ff' }}>{`Your subscription is pending approval. Please confirm it on paypal.`}</Text>}
                  <View style={{ marginBottom: sizes.priceMarginBottom }} />
                  {isUsableSubscription ? (
                    <>
                      {/* Horizontal buttons row */}
                      <View style={{
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                        width: '100%',
                        gap: 8,
                      }}>
                        {(subStatus === 'active' || subStatus === 'past_due' || subStatus === 'grace') && (
                          <TouchableOpacity
                            style={{
                              flex: 1,
                              height: sizes.btnHeight,
                              borderRadius: sizes.borderRadius,
                              justifyContent: 'center',
                              alignItems: 'center',
                              borderWidth: 1,
                              borderColor: themeController.current?.buttonColorPrimaryDefault,
                            }}
                            onPress={() => openSubPurchaseModal('update', { subscriptionId: subscription.current.id })}
                          >
                            <Text style={{
                              fontSize: sizes.subscriptionButtonFont * 0.75,
                              color: themeController.current?.buttonColorPrimaryDefault,
                              textAlign: 'center',
                              fontFamily: 'Rubik-Medium',
                            }}>
                              {t('subscriptions.update_payment_method')}
                            </Text>
                          </TouchableOpacity>
                        )}
                        {subStatus === 'active' && (
                          <TouchableOpacity
                            style={{
                              flex: 1,
                              height: sizes.btnHeight,
                              borderRadius: sizes.borderRadius,
                              justifyContent: 'center',
                              alignItems: 'center',
                              borderWidth: 1,
                              borderColor: themeController.current?.errorTextColor,
                            }}
                            onPress={() => tryCancelSubscription(subscription.current.id)}
                          >
                            <Text style={{
                              fontSize: sizes.subscriptionButtonFont * 0.75,
                              color: themeController.current?.errorTextColor,
                              textAlign: 'center',
                              fontFamily: 'Rubik-Medium',
                            }}>
                              {t('subscriptions.cancel')}
                            </Text>
                          </TouchableOpacity>
                        )}
                        {subStatus === 'pending_cancellation' && (
                          <TouchableOpacity
                            style={{
                              width: '100%',
                              height: sizes.btnHeight,
                              borderRadius: sizes.borderRadius,
                              justifyContent: 'center',
                              alignItems: 'center',
                              backgroundColor: value.id === 'pro'
                                ? themeController.current?.buttonColorSecondaryDefault
                                : themeController.current?.buttonColorPrimaryDefault,
                            }}
                            onPress={() => tryReactivateSubscription(subscription.current.id)}
                          >
                            <Text style={{
                              fontSize: sizes.subscriptionButtonFont,
                              color: value.id === 'pro'
                                ? themeController.current?.buttonTextColorSecondary
                                : themeController.current?.buttonTextColorPrimary,
                              textAlign: 'center',
                              fontFamily: 'Rubik-Medium',
                            }}>
                              {t('subscriptions.reactivate')}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      {/* Status info row */}
                      <View style={{
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                        justifyContent: 'space-between',
                        width: '100%',
                        marginTop: 8,
                      }}>
                        <Text style={{
                          fontSize: sizes.subscriptionsFeaturesFont,
                          color: themeController.current?.unactiveTextColor,
                          fontFamily: 'Rubik-Medium',
                        }}>
                          {getStatusLabel(subStatus)}
                        </Text>
                        <Text style={{
                          fontSize: sizes.subscriptionsFeaturesFont,
                          color: themeController.current?.unactiveTextColor,
                          fontFamily: 'Rubik-Medium',
                        }}>
                          {subStatus === 'pending_cancellation'
                            ? t('subscriptions.cancelled')
                            : subscription.current?.next_billing_at
                              ? `${t('subscriptions.next_billing')} ${new Date(subscription.current.next_billing_at).toLocaleDateString()}`
                              : null}
                        </Text>
                      </View>
                    </>
                  ) : (
                    /* Default "Choose" / upgrade button for plans without active subscription */
                    <TouchableOpacity
                      onPress={() => {
                        if (isPendingOnUpgrade) {
                          tryUpgradeSubscription(subscription.current);
                        } else if (!isActive && !isPendingOnDowngrade) {
                          tryPurchaseSubscription(value.id);
                        } else if (isPendingApproval) {
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
                  )}
                </View>;
              })}
            </View>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
      <PurchaseModal
        visible={subPurchaseModal.visible}
        onClose={closeSubPurchaseModal}
        type='subscribtion'
        mode='subscription'
        price={subPurchaseModal.price}
        onPurchase={handleSubPurchaseModalPurchase}
        startStep={subPurchaseModal.action === 'update' ? 'method' : 'select'}
        skipBackOnMethod={subPurchaseModal.action === 'update'}
      />
    </>
  );
}

export default function SubscriptionsModal({ visible, main, closeModal }) {
  const { isLandscape } = useWindowInfo();
  // const isWebLandscape = Platform.OS === 'web' && isLandscape;
  const isWebLandscape = false;
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
