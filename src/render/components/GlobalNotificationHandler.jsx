import React from 'react';
import { useNotification } from '../other/NotificationContext';
import { NotificationModal } from '../popups/NotificationModal';

export const GlobalNotificationHandler = () => {
    const { notification, hideNotification } = useNotification();

    return (
        <NotificationModal
            visible={notification.visible}
            type={notification.type}
            message={notification.message}
            buttons={notification.buttons}
            onClose={hideNotification}
        />
    );
};