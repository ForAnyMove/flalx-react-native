import { logError, logInfo } from "../../utils/log_util";

// Must comfortably undercut typical proxy/load-balancer idle timeouts (AWS
// ALB/nginx/Heroku router defaults are commonly 60s) — this is the likely
// cause of the prod "connection just disappears" reports this heartbeat is
// meant to catch, since periodic outbound traffic alone keeps most of those
// timers from firing.
const HEARTBEAT_INTERVAL_MS = 25000;
// No inbound traffic at all (a PONG or otherwise) for this long => treat the
// socket as a zombie and force a reconnect. Kept above 2x the heartbeat
// interval so one delayed/dropped pong doesn't trigger a false reconnect.
const STALE_TIMEOUT_MS = 60000;
const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 30000;

function buildWsUrl(userId, serverUrl) {
  const isSecure = /^https:\/\//.test(serverUrl) || /^wss:\/\//.test(serverUrl);
  const host = serverUrl.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '');
  return `${isSecure ? 'wss' : 'ws'}://${host}/?userId=${userId}`;
}

/**
 * Self-reconnecting WebSocket wrapper with an application-level heartbeat.
 *
 * The heartbeat is deliberately backend-agnostic: liveness is judged on ANY
 * inbound message resetting the staleness clock, not specifically a
 * `{type:'PONG'}` reply — so this can't misfire into a reconnect loop just
 * because the backend doesn't (yet) implement a pong handler for the
 * `{type:'PING'}` frames sent here. ASSUMED wire shape, not confirmed against
 * real backend source — flag/update if the backend uses something else.
 * Adding a real PONG reply server-side would sharpen stale-detection down to
 * the heartbeat interval instead of relying on whatever else happens to
 * arrive; without it, this still helps by generating periodic outbound
 * traffic (see the interval comment above).
 *
 * Reconnects with exponential backoff (1s → 30s cap, no jitter) on any
 * close/error/detected-stale event, until `disconnect()` is called.
 */
export function connectWebSocket({ userId, serverUrl, onMessage, onStatusChange }) {
  let ws = null;
  let heartbeatTimer = null;
  let reconnectTimer = null;
  let reconnectAttempt = 0;
  let lastActivityAt = Date.now();
  let stopped = false;

  const clearHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  };

  const clearReconnectTimer = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const scheduleReconnect = () => {
    if (stopped) return;
    clearReconnectTimer();
    const delay = Math.min(RECONNECT_BASE_DELAY_MS * 2 ** reconnectAttempt, RECONNECT_MAX_DELAY_MS);
    reconnectAttempt += 1;
    logInfo(`WebSocket reconnecting in ${delay}ms (attempt ${reconnectAttempt})`);
    reconnectTimer = setTimeout(connect, delay);
  };

  const startHeartbeat = () => {
    clearHeartbeat();
    lastActivityAt = Date.now();
    heartbeatTimer = setInterval(() => {
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      if (Date.now() - lastActivityAt > STALE_TIMEOUT_MS) {
        logInfo('WebSocket heartbeat stale — no inbound traffic, forcing reconnect');
        ws.close(); // triggers onclose -> scheduleReconnect
        return;
      }
      try {
        ws.send(JSON.stringify({ type: 'PING' }));
      } catch (error) {
        logError('WebSocket ping failed:', error);
      }
    }, HEARTBEAT_INTERVAL_MS);
  };

  const connect = () => {
    if (stopped) return;
    clearReconnectTimer();
    const wsUrl = buildWsUrl(userId, serverUrl);
    logInfo(`Connecting to WebSocket at ${wsUrl}`);
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      logInfo('WebSocket connected');
      reconnectAttempt = 0;
      startHeartbeat();
      onStatusChange?.(true);
    };

    ws.onmessage = (event) => {
      lastActivityAt = Date.now();
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (error) {
        logError('WebSocket message parse failed:', error);
        return;
      }
      if (data?.type === 'PONG') return; // heartbeat ack, nothing to route
      onMessage(data);
    };

    ws.onclose = () => {
      logInfo('WebSocket disconnected');
      clearHeartbeat();
      onStatusChange?.(false);
      scheduleReconnect();
    };

    ws.onerror = (error) => {
      // onclose always follows onerror here — reconnect is scheduled there
      // only, to avoid double-scheduling.
      logError('WebSocket error:', error);
    };
  };

  connect();

  return {
    disconnect: () => {
      stopped = true;
      clearHeartbeat();
      clearReconnectTimer();
      if (ws) {
        ws.onclose = null; // an intentional close must not trigger a reconnect
        ws.close();
      }
    },
  };
}
