import React, { createContext, useState, useContext } from 'react';

const WebViewContext = createContext();

export const useWebView = () => useContext(WebViewContext);

export const WebViewProvider = ({ children }) => {
    const [webViewState, setWebViewState] = useState({
        visible: false,
        url: null,
        onClose: null,
    });

    const openWebView = (url, onClose) => {
        setWebViewState({ visible: true, url, onClose });
    };

    const closeWebView = () => {
        setWebViewState({ visible: false, url: null, onClose: null });
        if (webViewState.onClose) webViewState.onClose();
    };

    return (
        <WebViewContext.Provider value={{ openWebView, closeWebView, webViewState }}>
            {children}
        </WebViewContext.Provider>
    );
};