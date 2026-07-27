import React, { createContext, useState, useContext, useRef } from 'react';
import { Platform } from 'react-native';

const WebViewContext = createContext();

export const useWebView = () => useContext(WebViewContext);

export const WebViewProvider = ({ children }) => {
    const [webViewState, setWebViewState] = useState({
        visible: false,
        url: null,
        onClose: null,
    });

    // Web only. Browsers only allow window.open() to bypass the popup
    // blocker when it's called synchronously inside a genuine user-gesture
    // handler (a click) — not after an `await` (e.g. the payment API call
    // that produces the redirect URL). So the tab has to be opened blank,
    // synchronously, right when the user clicks — see prepareWebViewTab()
    // below — and only navigated to the real URL once it's known. Navigating
    // an already-open tab isn't subject to the same restriction.
    const pendingTabRef = useRef(null);

    // Call synchronously at the very top of any click handler that might end
    // up calling openWebView() after an async call (payment, coupon, etc.).
    // No-op on native.
    const prepareWebViewTab = () => {
        if (Platform.OS === 'web') {
            pendingTabRef.current = window.open('', '_blank');
        }
    };

    // Call once it turns out no redirect is actually needed after all
    // (coupon/subscription bypass, direct auth, an error, ...) so the blank
    // tab opened by prepareWebViewTab() doesn't hang around empty.
    const cancelWebViewTab = () => {
        if (pendingTabRef.current && !pendingTabRef.current.closed) {
            pendingTabRef.current.close();
        }
        pendingTabRef.current = null;
    };

    const openWebView = (url, onClose) => {
        if (Platform.OS === 'web') {
            if (pendingTabRef.current && !pendingTabRef.current.closed) {
                pendingTabRef.current.location.href = url;
                pendingTabRef.current = null;
                onClose?.();
                return;
            }
            // No pre-opened tab (caller didn't call prepareWebViewTab() first)
            // — falls through to the state-driven path below, which
            // GlobalWebScreen.jsx still handles with a direct window.open()
            // as a best-effort fallback; browsers may block it in this case.
        }
        setWebViewState({ visible: true, url, onClose });
    };

    const closeWebView = () => {
        setWebViewState({ visible: false, url: null, onClose: null });
        if (webViewState.onClose) webViewState.onClose();
    };

    return (
        <WebViewContext.Provider
            value={{ openWebView, closeWebView, webViewState, prepareWebViewTab, cancelWebViewTab }}
        >
            {children}
        </WebViewContext.Provider>
    );
};
