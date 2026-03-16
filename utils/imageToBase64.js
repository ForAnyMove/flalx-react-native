import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

/**
 * Конвертирует URI или Blob изображения в base64 строку
 * @param {string|object} input - URI изображения (file://, blob:, data:, http://) или объект {blob, ext} / {uri}
 * @returns {Promise<{base64: string, fileType: string}>} Base64 строка и тип файла
 */
export async function convertImageToBase64(input) {
    let base64;
    let fileType = 'jpg';

    // Обработка объекта {blob, ext} или {uri}
    if (typeof input === 'object' && input !== null) {
        if (input.blob) {
            // Веб: объект с blob из normalizeImageUri
            const blob = input.blob;
            fileType = input.ext || 'jpg';
            const arrayBuffer = await blob.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            base64 = btoa(String.fromCharCode.apply(null, bytes));
            return { base64, fileType };
        } else if (input.uri) {
            // Мобилка: объект с uri из normalizeImageUri
            const uri = input.uri;
            base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            fileType = uri.split('.').pop() || 'jpg';
            return { base64, fileType };
        }
    }

    // Обработка строкового URI (legacy поддержка)
    const uri = input;
    if (Platform.OS === 'web') {
        // Web: конвертировать blob/data URL в base64
        if (typeof uri === 'string' && uri.startsWith('data:image')) {
            // Если это data URL, извлечь base64
            const parts = uri.split(',');
            base64 = parts[1];
            fileType = parts[0].match(/image\/(\w+)/)?.[1] || 'jpg';
        } else {
            // Если это blob URL, конвертировать
            const response = await fetch(uri);
            const blob = await response.blob();
            fileType = blob.type.split('/')[1] || 'jpg';
            const arrayBuffer = await blob.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            base64 = btoa(String.fromCharCode.apply(null, bytes));
        }
    } else {
        // Mobile: читать из FileSystem
        base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
        });
        fileType = uri.split('.').pop() || 'jpg';
    }

    return { base64, fileType };
}