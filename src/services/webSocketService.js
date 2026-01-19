import { logError, logInfo } from "../../utils/log_util";

export function connectWebSocket(userId, serverUrl, onMessage) {
    const isSecure = /^https:\/\//.test(serverUrl) || /^wss:\/\//.test(serverUrl);
    serverUrl = serverUrl.replace(/^https?:\/\//, '').replace(/^ws?:\/\//, '');

    const wsUrl = `${(isSecure ? 'wss' : 'ws')}://${serverUrl}/?userId=${userId}`;
    logInfo(`Connecting to WebSocket at ${wsUrl}`);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        logInfo('WebSocket connected');
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        onMessage(data);
    };

    ws.onclose = () => {
        logInfo('WebSocket disconnected');
    };

    ws.onerror = (error) => {
        logError('WebSocket error:', error);
    };

    return ws;
}