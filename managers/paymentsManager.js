import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { logError } from '../utils/log_util';
import {
  fetchPaymentMethods,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  updateSubscriptionMethod,
} from '../src/api/paymentMethods';

const WEB_PAYMENT_METHODS = ['paypal', 'hyp'];
const ANDROID_PAYMENT_METHODS = ['google_pay'];
const IOS_PAYMENT_METHODS = ['apple_pay'];

function getAvailablePaymentMethods() {
  if (Platform.OS === 'web') return WEB_PAYMENT_METHODS;
  if (Platform.OS === 'android') return ANDROID_PAYMENT_METHODS;
  if (Platform.OS === 'ios') return IOS_PAYMENT_METHODS;
  return [];
}

function transformBackendMethod(pm) {
  return {
    id: pm.id,
    type: pm.provider.toLowerCase(), // "PAYPAL" → "paypal", "HYP" → "hyp"
    details: {
      title: pm.displayLabel ?? pm.provider,
      email: pm.email ?? undefined,
      cardNumber: pm.last4 ? `**** **** **** ${pm.last4}` : undefined,
      expiryDate: pm.expiresAt ? pm.expiresAt.slice(0, 7) : undefined,
    },
    default: pm.isDefaultPurchase,
    isSubscription: pm.isDefaultSubscription,
  };
}

export default function paymentsManager({ session }) {
  const [availablePaymentMethods] = useState(getAvailablePaymentMethods);
  const [savedPaymentMethods, setSavedPaymentMethods] = useState([]);

  const token = session?.token?.access_token;

  // ─── Load saved methods on login ─────────────────────────────────────────────
  useEffect(() => {
    setSavedPaymentMethods([]);
    if (!session?.token) return;

    fetchPaymentMethods(session)
      .then((methods) => setSavedPaymentMethods(methods.map(transformBackendMethod)))
      .catch((e) => logError('Failed to load saved payment methods:', e));
  }, [token]);

  // ─── Remove a saved method ────────────────────────────────────────────────────
  async function removePaymentMethod(methodId) {
    try {
      await deletePaymentMethod(session, methodId);
      setSavedPaymentMethods((prev) => prev.filter((m) => m.id !== methodId));
      return { success: true };
    } catch (e) {
      if (e.response?.status === 409) {
        const err = new Error('payment_method_in_use_subscription');
        err.subscriptionId = e.response.data?.subscriptionId;
        throw err;
      }
      logError('Failed to remove payment method:', e);
      throw e;
    }
  }

  // ─── Change default method ────────────────────────────────────────────────────
  async function changeDefaultPaymentMethod(methodId, type = 'purchase') {
    try {
      await setDefaultPaymentMethod(session, methodId, type);
      setSavedPaymentMethods((prev) =>
        prev.map((m) => ({
          ...m,
          default: type === 'purchase' ? m.id === methodId : m.default,
          isSubscription: type === 'subscription' ? m.id === methodId : m.isSubscription,
        }))
      );
    } catch (e) {
      logError('Failed to change default payment method:', e);
      throw e;
    }
  }

  // ─── Change subscription payment method ──────────────────────────────────────
  async function updateSubscriptionPaymentMethod(subscriptionId, methodId) {
    try {
      await updateSubscriptionMethod(session, subscriptionId, methodId);
      // Refresh to get updated isSubscription flags
      const fresh = await fetchPaymentMethods(session);
      setSavedPaymentMethods(fresh.map(transformBackendMethod));
    } catch (e) {
      logError('Failed to update subscription payment method:', e);
      throw e;
    }
  }

  // ─── Update from purchase snapshot ───────────────────────────────────────────
  function updateFromSnapshot(snapshot) {
    if (!snapshot?.paymentMethods) return;
    setSavedPaymentMethods(snapshot.paymentMethods.map(transformBackendMethod));
  }

  // ─── Refresh saved methods from API ──────────────────────────────────────────
  async function refreshSavedMethods() {
    if (!session?.token) return;
    try {
      const fresh = await fetchPaymentMethods(session);
      setSavedPaymentMethods(fresh.map(transformBackendMethod));
    } catch (e) {
      logError('Failed to refresh saved payment methods:', e);
    }
  }

  return {
    availableMethods: availablePaymentMethods,
    savedMethods: savedPaymentMethods,
    removePaymentMethod,
    changeDefaultPaymentMethod,
    updateSubscriptionPaymentMethod,
    updateFromSnapshot,
    refreshSavedMethods,
  };
}
