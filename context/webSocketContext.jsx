import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { connectWebSocket } from '../src/services/webSocketService';
import { useComponentContext } from './globalAppContext';

const WebSocketContext = createContext();

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
    const { session, user, usersReveal, providersController } = useComponentContext();
    const { jobsController } = useComponentContext();

    const wsRef = useRef(null);
    const [lastMessage, setLastMessage] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!session || !user.current?.id || !session.serverURL) return;
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

        wsRef.current = connectWebSocket(user.current?.id, session.serverURL, (data) => {
            handleMessageReceived(data);
        });

        wsRef.current.onopen = () => setConnected(true);
        wsRef.current.onclose = () => setConnected(false);
        wsRef.current.onerror = () => setConnected(false);

        return () => {
            wsRef.current && wsRef.current.close();
        };
    }, [session?.serverURL, user.current?.id]);

    const handleMessageReceived = (message) => {
        setLastMessage(message);

        switch (message.type) {
            case "JOB_PAYMENT_SUCCESS":
                console.log("Job payment successful:", message.type);

                jobsController.reloadCreator();
                break;
            case "USER_INFO_PAYMENT_SUCCESS":
                if (message.userId) usersReveal.appendRevealed(message.userId);
                else usersReveal.refresh();

                providersController.reload();
                break;
            default:
                break;
        }
    }

    return (
        <WebSocketContext.Provider value={{ lastMessage, connected }}>
            {children}
        </WebSocketContext.Provider>
    );
};