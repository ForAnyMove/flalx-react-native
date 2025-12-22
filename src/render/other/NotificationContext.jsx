import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notification, setNotification] = useState({
        visible: false,
        type: 'info',
        message: '',
        buttons: [],
        onClose: null,
    });

    const showNotification = ({ type = 'info', message, buttons = [], onClose = null }) => {
        setNotification({
            visible: true,
            type,
            message,
            buttons,
            onClose,
        });
    };

    const hideNotification = () => {
        setNotification(prev => ({
            ...prev,
            visible: false,
        }));

        if (notification.onClose) {
            notification.onClose();
        }
    };

    // Удобные методы для разных типов уведомлений
    const showInfo = (message, buttons = [], onClose = null) => {
        showNotification({ type: 'info', message, buttons, onClose });
    };

    const showWarning = (message, buttons = [], onClose = null) => {
        showNotification({ type: 'warning', message, buttons, onClose });
    };

    const showError = (message, buttons = [], onClose = null) => {
        showNotification({ type: 'error', message, buttons, onClose });
    };

    // Метод для быстрого показа с кнопкой OK
    const showAlert = (message, type = 'info') => {
        showNotification({
            type,
            message,
            buttons: [
                {
                    title: 'OK',
                    backgroundColor: '#3B82F6',
                    textColor: '#FFFFFF',
                }
            ]
        });
    };

    // Метод для подтверждения действия
    const showConfirm = (message, onConfirm, onCancel) => {
        showNotification({
            type: 'warning',
            message,
            buttons: [
                {
                    title: 'Отмена',
                    backgroundColor: '#E5E7EB',
                    textColor: '#374151',
                    onPress: onCancel,
                },
                {
                    title: 'Подтвердить',
                    backgroundColor: '#EF4444',
                    textColor: '#FFFFFF',
                    onPress: onConfirm,
                }
            ]
        });
    };

    return (
        <NotificationContext.Provider
            value={{
                notification,
                showNotification,
                hideNotification,
                showInfo,
                showWarning,
                showError,
                showAlert,
                showConfirm,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};