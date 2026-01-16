import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { connectWebSocket } from '../src/services/webSocketService';
import { useComponentContext } from './globalAppContext';

const WebSocketContext = createContext();

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const {
    session,
    user,
    usersReveal,
    providersController,
    subscription,
    jobsController,
    couponsManagerController,
  } = useComponentContext();

  const wsRef = useRef(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!session || !user.current?.id || !session.serverURL) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    wsRef.current = connectWebSocket(
      user.current?.id,
      session.serverURL,
      (data) => {
        handleMessageReceived(data);
      }
    );

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
      case 'JOB_PAYMENT_SUCCESS': {
        jobsController.reloadCreator();
        break;
      }
      case 'USER_INFO_PAYMENT_SUCCESS': {
        if (message.userId) usersReveal.appendRevealed(message.userId);
        else usersReveal.refresh();

        providersController.reload();
        break;
      }
      case 'JOB_PROVIDER_ACCESS_GRANTED': {
        jobsController.reloadAll();
        break;
      }
      case 'SUBSCRIPTION_ACTIVATED':
      case 'SUBSCRIPTION_CANCELLED':
      case 'SUBSCRIPTION_EXPIRED':
      case 'SUBSCRIPTION_DOWNGRADE_SCHEDULED':
      case 'SUBSCRIPTION_UPGRADE_INITIATED':
      case 'PLAN_CHANGE_APPROVED':
      case 'SUBSCRIPTION_PLAN_CHANGED_PENDING_PAYMENT':
      case 'SUBSCRIPTION_UPGRADE_SUCCESS':
      case 'SUBSCRIPTION_PAYMENT_SUCCESS':
      case 'SUBSCRIPTION_PLAN_CHANGES_CANCELLED':
      case 'PLAN_UPGRADE_COMPLETED':
      case 'SUBSCRIPTION_PENDING_APPROVAL': {
        subscription.refresh();
        break;
      }
      case 'JOB_CREATED': { // notify all users
        // const jobId = message.payload?.jobId;
        // const job = message.payload?.job;
        // jobsController.reloadExecutor();
        break;
      }
      case 'JOB_DELETED': { // notify all users
        const jobId = message.payload?.jobId;
        const deletedBy = message.payload?.deletedBy;
        jobsController.reloadExecutorNew();
        break;
      }
      case 'JOB_EXECUTOR_ASSIGNED': {
        const jobId = message.payload?.jobId;
        switch (message.payload?.role) {
          case 'creator':
            const executorId = message.payload?.executorId;
            // notify creator about assigned executor
            jobsController.reloadCreator();
            break;
          case 'executor':
            // notify executor about being assigned to job
            jobsController.reloadExecutor();
            break;
          case 'provider':
            // notify other providers that executor has been assigned
            jobsController.reloadExecutor();
            break;
          default:
        }
        break;
      }
      case 'JOB_PROVIDER_ADDED': {
        const jobId = message.payload?.jobId;
        const source = message.payload?.source;
        const providerId = message.payload?.providerId;

        if (source) {
          // provider has been added, notify him
          jobsController.reloadExecutor();
        }
        if (providerId) {
          // provider added himself, notify creator
          jobsController.reloadCreator();
        }
        break;
      }
      case 'JOB_PROVIDER_REMOVED': {
        const jobId = message.payload?.jobId;
        const providerId = message.payload?.providerId;

        if (providerId) {
          // provider removed himself, notify creator
          jobsController.reloadCreator();
        } else {
          // provider has been removed, notify him
          jobsController.reloadExecutor();
        }
        break;
      }
      case 'JOB_STATUS_CHANGED': {
        const jobId = message.payload?.jobId;
        const newStatus = message.payload?.newStatus;
        // notify relevant parties about job status change
        // not implemented yet because no status changes exist at the moment

        jobsController.reloadAll();
        break;
      }
      case 'JOB_COMPLETED': {
        const jobId = message.payload?.jobId;

        switch (message.payload?.role) {
          case 'creator':
            // notify creator about job has been marked as completed by executor
            jobsController.reloadCreator();
            break;
          case 'executor':
            // notify executor about job has been marked as completed
            jobsController.reloadExecutor();
            break;
          default:
        }
        break;
      }
      case 'COMMENT_CREATED': {
        const commentId = message.payload?.commentId;
        const authorId = message.payload?.authorId;
        const userId = message.payload?.userId; // кому оставили комментарий
        const content = message.payload?.content;
        const rating = message.payload?.rating;

        switch (message.payload?.role) {
          case 'recipient':
            // notify user who received the comment
            break;
          case 'author':
            // notify author that comment was successfully posted
            break;
          default:
        }
        break;
      }
      case 'COMMENT_REPLIED': {
        const commentId = message.payload?.commentId;
        const originalCommentId = message.payload?.originalCommentId;
        const replyAuthorId = message.payload?.replyAuthorId;
        const originalAuthorId = message.payload?.originalAuthorId;

        // notify original comment author about reply
        break;
      }
      case 'COMMENT_STATUS_CHANGED': {
        const commentId = message.payload?.commentId;
        const newStatus = message.payload?.newStatus; // approved, rejected, hidden
        const reason = message.payload?.reason;

        switch (message.payload?.role) {
          case 'author':
            // notify comment author about status change
            break;
          case 'recipient':
            // notify recipient if comment was hidden/removed
            break;
          default:
        }
        break;
      }
      case 'FEEDBACK_REQUEST_SUBMITTED': {
        const requestId = message.payload?.requestId;
        const userId = message.payload?.userId;
        const requestType = message.payload?.requestType; // callback, general, bug_report

        switch (message.payload?.role) {
          case 'user':
            // notify user that feedback request was submitted
            // show confirmation: "Your feedback request has been submitted"
            break;
          case 'admin':
            // notify admin about new feedback request
            // show notification: "New feedback request received"
            break;
          default:
        }
        break;
      }
      case 'FEEDBACK_REQUEST_STATUS_CHANGED': {
        const requestId = message.payload?.requestId;
        const newStatus = message.payload?.newStatus; // pending, in_progress, completed, cancelled
        const adminId = message.payload?.adminId;
        const response = message.payload?.response;

        // notify user about status change of their feedback request
        // show notification: "Your feedback request status changed to: {newStatus}"
        break;
      }
      case 'CONTACT_MESSAGE_SUBMITTED': {
        const messageId = message.payload?.messageId;
        const userId = message.payload?.userId;
        const subject = message.payload?.subject;
        const messageType = message.payload?.messageType; // support, general, complaint

        switch (message.payload?.role) {
          case 'user':
            // notify user that contact message was submitted
            break;
          case 'admin':
            // notify admin about new contact message
            break;
          default:
        }
        break;
      }
      case 'CONTACT_MESSAGE_REPLIED': {
        const messageId = message.payload?.messageId;
        const originalMessageId = message.payload?.originalMessageId;
        const adminId = message.payload?.adminId;
        const replyContent = message.payload?.replyContent;

        // notify user about admin reply to their contact message
        break;
      }
      case 'CONTACT_MESSAGE_STATUS_CHANGED': {
        const messageId = message.payload?.messageId;
        const newStatus = message.payload?.newStatus; // open, in_progress, resolved, closed
        const adminId = message.payload?.adminId;

        // notify user about status change of their contact message
        break;
      }
      case 'PROFILE_UPDATED': {
        const userId = message.payload?.userId;
        const updatedFields = message.payload?.updatedFields; // array of field names
        const isPublicChange = message.payload?.isPublicChange;

        if (isPublicChange) {
          // notify followers/connections about public profile updates
        } else {
          // notify only the user about their own profile update
        }
        break;
      }
      case 'PROFILE_VIEWED': {
        const viewedUserId = message.payload?.viewedUserId;
        const viewerUserId = message.payload?.viewerUserId;
        const viewerName = message.payload?.viewerName;
        const viewCount = message.payload?.viewCount;

        // notify user that someone viewed their profile (if enabled)
        break;
      }
      case 'CONTACT_ACCESS_GRANTED': {
        const userId = message.payload?.userId;
        const grantedToUserId = message.payload?.grantedToUserId;
        const grantedToName = message.payload?.grantedToName;
        const accessType = message.payload?.accessType; // phone, email, social

        switch (message.payload?.role) {
          case 'owner':
            // notify user that they granted contact access
            break;
          case 'recipient':
            // notify user that they received contact access
            break;
          default:
        }
        break;
      }
      case 'CONTACT_ACCESS_REVOKED': {
        const userId = message.payload?.userId;
        const revokedFromUserId = message.payload?.revokedFromUserId;
        const revokedFromName = message.payload?.revokedFromName;
        const accessType = message.payload?.accessType;

        switch (message.payload?.role) {
          case 'owner':
            // notify user that they revoked contact access
            break;
          case 'recipient':
            // notify user that their contact access was revoked
            break;
          default:
        }
        break;
      }
      case 'USER_REGISTERED': {
        const userId = message.payload?.userId;
        const userName = message.payload?.userName;
        const registrationDate = message.payload?.registrationDate;

        // notify admins about new user registration (if enabled)
        break;
      }
      case 'MAINTENANCE_SCHEDULED': {
        const maintenanceId = message.payload?.maintenanceId;
        const startTime = message.payload?.startTime;
        const endTime = message.payload?.endTime;
        const description = message.payload?.description;
        const affectedServices = message.payload?.affectedServices; // array

        // notify all users about scheduled maintenance
        break;
      }
      case 'SYSTEM_UPDATE_AVAILABLE': {
        const updateId = message.payload?.updateId;
        const version = message.payload?.version;
        const features = message.payload?.features; // array of new features
        const releaseNotes = message.payload?.releaseNotes;

        // notify users about available system update
        break;
      }
      case 'SECURITY_ALERT': {
        const alertId = message.payload?.alertId;
        const alertType = message.payload?.alertType; // suspicious_login, password_breach, etc.
        const severity = message.payload?.severity; // low, medium, high, critical
        const description = message.payload?.description;
        const actionRequired = message.payload?.actionRequired;

        // notify user about security alert
        break;
      }
      case 'RATE_LIMIT_WARNING': {
        const userId = message.payload?.userId;
        const resource = message.payload?.resource; // api, uploads, requests
        const currentUsage = message.payload?.currentUsage;
        const limit = message.payload?.limit;
        const resetTime = message.payload?.resetTime;

        // notify user about approaching rate limit (development mode)
        break;
      }
      case 'JOB_CREATED_BY_YOU':
      case 'JOB_APPROVED':
      case 'JOB_REJECTED': {
        jobsController.reloadCreator();
        break;
      }
      case 'COUPON_EARNED':
      case 'COUPON_USED':
        couponsManagerController.refreshBalance();
        break;
      default:
        break;
    }
  };

  return (
    <WebSocketContext.Provider value={{ lastMessage, connected }}>
      {children}
    </WebSocketContext.Provider>
  );
};
