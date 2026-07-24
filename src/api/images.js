import { fetchWithSession } from './apiBase';
import { logError, logInfo } from '../../utils/log_util';

/**
 * @returns {Promise<{
 *   avatar: { maxSizeBytes: number, maxSizeMB: number, allowedTypes: string[] },
 *   jobImages: { maxSizeBytes: number, maxSizeMB: number, allowedTypes: string[] },
 * }>}
 */
export async function getImageLimits(session) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: '/api/images/limits',
            method: 'GET',
        });
        return response.data;
    } catch (error) {
        logError('Error fetching image limits:', error);
        throw error;
    }
}

/**
 * Отправить аватарку на сервер для модерации
 * @param {string} base64Image - Base64 строка изображения
 * @param {string} fileType - Тип файла (jpg, png и т.д.)
 * @param {object} session - Сессия пользователя
 * @returns {Promise<object>} { pending_avatar: string }
 */
export async function uploadAvatarForModeration(base64Image, fileType, session) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: '/api/images/avatar',
            method: 'POST',
            data: {
                image: base64Image,
                fileType
            }
        });

        if (response.status === 200 || response.status === 201) {
            logInfo('Avatar uploaded for moderation:', response.data);
            return response.data;
        } else {
            throw new Error(response.data?.error || 'Failed to upload avatar for moderation');
        }
    } catch (error) {
        logError('Error uploading avatar for moderation:', error);
        throw error;
    }
}

/**
 * Marks the current unread avatar rejection as acknowledged — `rejected_avatar`
 * in GET /users/me goes back to null until the next rejection happens.
 * @param {object} session - Сессия пользователя
 */
export async function dismissAvatarRejection(session) {
    try {
        await fetchWithSession({
            session,
            endpoint: '/api/images/avatar/rejection/dismiss',
            method: 'POST',
        });
    } catch (error) {
        logError('Error dismissing avatar rejection:', error);
        throw error;
    }
}
