import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { Platform } from 'react-native';
import { supabase } from './supabase';

const MAX_FILE_MB = 5; // лимит (например, 5 MB)

// проверка размера файла по URI (локальный файл)
async function checkFileSize(uri, maxMB = 5) {
  const info = await FileSystem.getInfoAsync(uri);
  const sizeMB = info.size / (1024 * 1024);

  if (sizeMB > maxMB) {
    throw new Error(
      `Файл слишком большой (${sizeMB.toFixed(2)}MB). Лимит: ${maxMB}MB`
    );
  }

  return true;
}
// проверка размера файла по URI (внешняя ссылка)
async function checkBlobSize(uri, maxMB = 5) {
  const response = await fetch(uri);
  const blob = await response.blob();
  const sizeMB = blob.size / (1024 * 1024);

  if (sizeMB > maxMB) {
    throw new Error(
      `Файл слишком большой (${sizeMB.toFixed(2)}MB). Лимит: ${maxMB}MB`
    );
  }

  return blob;
}

// универсальная загрузка картинки
export async function uploadImageToSupabase(uri, userId, options) {
  try {
    const { bucket = 'avatars', isAvatar = true } = options || {};
    let fileData;
    let fileExt = 'jpg';

    // ✅ добавлена поддержка Blob и data:image (для Web)
    if (uri && typeof uri === 'object' && uri.blob) {
      const { blob, ext } = uri;
      const arrayBuffer = await blob.arrayBuffer();
      fileData = arrayBuffer;
      fileExt = ext || (blob.type ? blob.type.split('/')[1] : 'jpg');
    } else if (typeof uri === 'string' && uri.startsWith('data:image')) {
      const response = await fetch(uri);
      const blob = await response.blob();
      fileData = await blob.arrayBuffer();
      fileExt = blob.type.split('/')[1] || 'jpg';
    } else if (uri.startsWith('http')) {
      // 📥 Качаем из внешней ссылки через fetch → ArrayBuffer
      const response = await fetch(uri);
      const buffer = await response.arrayBuffer();
      fileData = buffer;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('/')) {
        fileExt = contentType.split('/')[1];
      }
    } else if (uri.startsWith('file://')) {
      // 📱 Локальный файл (ImagePicker)
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      fileData = decode(base64);
      fileExt = uri.split('.').pop() || 'jpg';
    } else {
      throw new Error('❌ Неподдерживаемый тип URI: ' + uri);
    }

    // путь для сохранения
    let filePath;
    if (isAvatar) {
      // 🖼 аватар — всегда одно имя → старый файл перезаписывается
      filePath = `avatars/${userId}.${fileExt}`;
    } else {
      // 📂 job-фото — сохраняем уникально
      const fileName = `${Date.now()}.${fileExt}`;
      filePath = `jobs/${userId}/${fileName}`;
    }

    // загрузка в Supabase
    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileData, {
        contentType: `image/${fileExt}`,
        upsert: true, // важно для аватарок
      });

    if (error) throw error;

    // получить публичный URL
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    const publicUrl = data.publicUrl;

    console.log('✅ Файл загружен:', publicUrl);
    return { publicUrl, filePath };
  } catch (e) {
    console.error('❌ Ошибка загрузки в Supabase:', e);
    return null;
  }
}

// // пример использования
// // загрузка одного изображения
// const avatarUrl = await uploadImageToSupabase(uri, user.id, { bucket: "avatars", isAvatar: true });

// setAvatarUrl(avatarUrl.publicUrl);

// // загрузка нескольких изображений
// const uploaded = await Promise.all(
//   images.map(uri =>
//     await uploadImageToSupabase(uri, user.id, { bucket: "jobs", isAvatar: false });
//   )
// );

// // массив ссылок на фото
// const jobImagesUrls = uploaded.map(item => item.publicUrl);
