import { fetchWithSession } from './apiBase';
import { logError, logInfo } from '../../utils/log_util';

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
