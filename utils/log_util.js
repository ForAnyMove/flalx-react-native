
const levels = {
    NONE: 'none',
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug',
};


let currentLevel = process.env.EXPO_PUBLIC_LOG_LEVEL || levels.INFO;
let sessionId = null;

const initSession = (customSessionId = null) => {
    sessionId = customSessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sessionHeader = `=== LOG SESSION STARTED ===\nSession ID: ${sessionId}\nTimestamp: ${new Date().toISOString()}\n=========================`;
    console.log(sessionHeader);
    return sessionId;
};

const formatMessage = (message) => {
    if (typeof message === 'object' && message !== null) {
        return JSON.stringify(message, null, 2);
    }
    return String(message);
};

const log = (level, ...args) => {
    const levelOrder = Object.values(levels);
    if (levelOrder.indexOf(level) <= levelOrder.indexOf(currentLevel)) {
        const timestamp = new Date().toISOString();
        const logPrefix = `[${timestamp}] [${level.toUpperCase()}]:`;
        switch (level) {
            case levels.ERROR:
                console.error(logPrefix, args);
                break;
            case levels.WARN:
                console.warn(logPrefix, args);
                break;
            case levels.INFO:
                console.info(logPrefix, args);
                break;
            case levels.DEBUG:
                console.debug(logPrefix, args);
                break;
            default:
                break;
        }
    }
};

const logError = (...args) => log(levels.ERROR, ...args);
const logWarn = (...args) => log(levels.WARN, ...args);
const logInfo = (...args) => log(levels.INFO, ...args);
const logDebug = (...args) => log(levels.DEBUG, ...args);

const setLevel = (level) => {
    if (levels[level.toUpperCase()]) {
        currentLevel = levels[level.toUpperCase()];
    } else {
        logWarn(`Invalid log level: ${level}`);
    }
};


const getSessionId = () => sessionId;

export {
    logError,
    logWarn,
    logInfo,
    logDebug,
    setLevel,
    initSession,
    getSessionId
};
