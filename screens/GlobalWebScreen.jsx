import React, { useEffect } from 'react';
import { Modal, View, Button, Platform } from 'react-native';
import { useWebView } from '../context/webViewContext';
import { WebView } from 'react-native-webview';
import { useTranslation } from 'react-i18next';

export const GlobalWebScreen = () => {
    const { webViewState, closeWebView } = useWebView();
    const { t } = useTranslation();

    useEffect(() => {
        if (Platform.OS === 'web' && webViewState.visible && webViewState.url) {
            window.open(webViewState.url, '_blank');
            closeWebView();
        }
    }, [webViewState.visible, webViewState.url]);

    if (Platform.OS === 'web') {
        return null;
    }

    return (
        <Modal visible={webViewState.visible} animationType="slide">
            <View style={{ flex: 1 }}>
                <Button title={t('common.close')} onPress={closeWebView} />
                <WebView source={{ uri: webViewState.url }} style={{ flex: 1 }} />
            </View>
        </Modal>
    );
};