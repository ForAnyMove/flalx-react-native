export function connectWebSocket(userId, serverUrl, onMessage) {
    serverUrl = serverUrl.replace(/^https?:\/\//, '').replace(/^ws?:\/\//, '');

    const wsUrl = `ws://${serverUrl}/?userId=${userId}`;
    console.log(`Connecting to WebSocket at ${wsUrl}`);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log(`Received WebSocket message: ${event.data}`);

        onMessage(data);
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected');
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    return ws;
}