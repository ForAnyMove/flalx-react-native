import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { logError } from '../utils/log_util';

const PAYMENT_METHODS = {
  paypal: 'paypal',
  card: 'card',
  apple_pay: 'apple_pay',
  google_pay: 'google_pay',
};

const WEB_PAYMENT_METHODS = [PAYMENT_METHODS.paypal, PAYMENT_METHODS.card];
const ANDROID_PAYMENT_METHODS = [PAYMENT_METHODS.google_pay];
const IOS_PAYMENT_METHODS = [PAYMENT_METHODS.apple_pay];

const SAVED_METHODS_MOCK = [
  {
    id: '1',
    type: PAYMENT_METHODS.card,
    details: {
      cardNumber: '**** **** **** 1234',
      expiryDate: '12/24',
      cardHolderName: 'John Doe',
      title: '**** **** **** 1234',
    },
    default: false,
    isSubscription: true, // Example of a subscription method
  },
  {
    id: '2',
    type: PAYMENT_METHODS.paypal,
    details: {
      email: 'john.doe@example.com',
      title: 'john.doe@example.com',
    },
    default: true,
  },
  {
    id: '3',
    type: PAYMENT_METHODS.card,
    details: {
      cardNumber: '**** **** **** 5678',
      expiryDate: '11/25',
      cardHolderName: 'Jane Doe',
      title: '**** **** **** 5678',
    },
    default: false,
  },
];

export default function paymentsManager() {
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState([]);
  const [savedPaymentMethods, setSavedPaymentMethods] =
    useState(SAVED_METHODS_MOCK);

  useEffect(() => {
    const methods = getAvailablePaymentMethods();
    setAvailablePaymentMethods(methods);
  }, []);

  useEffect(() => {
    const currentMethods = getSavedPaymentMethods();
    setSavedPaymentMethods(currentMethods);
  }, [Platform.OS]);

  function getAvailablePaymentMethods() {
    try {
      if (Platform.OS === 'web') {
        return WEB_PAYMENT_METHODS;
      } else if (Platform.OS === 'android') {
        return ANDROID_PAYMENT_METHODS;
      } else if (Platform.OS === 'ios') {
        return IOS_PAYMENT_METHODS;
      } else {
        return [];
      }
    } catch (e) {
      logError('Error determining available payment methods:', e);
      return [];
    }
  }

  function getSavedPaymentMethods() {
    // Здесь должна быть логика получения сохраненных методов оплаты из бэкенда
    return SAVED_METHODS_MOCK;
  }

  function removePaymentMethod(methodId) {
    try {
      // Здесь должна быть логика удаления метода оплаты на бэкенде
      setSavedPaymentMethods((prev) => {
        const methodToRemove = prev.find((method) => method.id === methodId);
        if (!methodToRemove) {
          return prev; // Метод не найден, ничего не делаем
        }

        const isDefault = methodToRemove.default;
        let newMethods = prev.filter((method) => method.id !== methodId);

        if (isDefault && newMethods.length > 0) {
          // Назначаем первый элемент новым методом по умолчанию
          newMethods = newMethods.map((method, index) => ({
            ...method,
            default: index === 0,
          }));
        }
        return newMethods;
      });
      return { success: true };
    } catch (e) {
      logError('Error removing payment method:', e);
      throw e;
    }
  }

  function addPaymentMethod(method) {
    try {
      // Здесь должна быть логика добавления нового метода оплаты на бэкенде
      setSavedPaymentMethods((prev) => [...prev, method]);
    } catch (e) {
      logError('Error adding payment method:', e);
    }
  }

  function changeDefaultPaymentMethod(methodId) {
    try {
      // Здесь должна быть логика обновления дефолтного метода оплаты на бэкенде

      // После успешного обновления на бэкенде, обновляем состояние локально

      setSavedPaymentMethods((prev) =>
        prev.map((method) => ({
          ...method,
          default: method.id === methodId,
        }))
      );
    } catch (e) {
      logError('Error changing default payment method:', e);
    }
  }

  function updateSubscriptionPaymentMethod(methodId) {
    try {
      // Здесь должна быть логика обновления метода оплаты для подписки на бэкенде

      // После успешного обновления на бэкенде, обновляем состояние локально
      setSavedPaymentMethods((prev) =>
        prev.map((method) => ({
          ...method,
          isSubscription:
            method.id === methodId
              ? !method.isSubscription
              : method.isSubscription,
        }))
      );
    } catch (e) {
      logError('Error updating subscription payment method:', e);
    }
  }

  return {
    availableMethods: availablePaymentMethods,
    savedMethods: savedPaymentMethods,
    addPaymentMethod,
    removePaymentMethod,
    changeDefaultPaymentMethod,
    updateSubscriptionPaymentMethod,
  };
}
