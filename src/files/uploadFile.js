import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { filesApi } from './filesApi';
import { logInfo } from '../../utils/log_util';
import i18n from '../../utils/i18n/i18n';

const MAX_FILE_MB = 5;

/**
 * @typedef {Object} LocalUploadFile
 * @property {string} uri
 * @property {string} name
 * @property {string} type
 * @property {number} size
 */

const IMAGE_EXT_TO_MIME = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  heic: 'image/heic',
};

/**
 * Normalize the various local image/file shapes already flowing through the
 * app's pickers into a LocalUploadFile the backend upload flow understands:
 *   - already-normalized { uri, name, type, size }
 *   - web-picked { blob, ext } (see utils/supabase/uriHelpers#normalizeImageUri)
 *   - native-picked { uri: 'file://...' }
 *   - a plain http(s)/data/blob URL string
 *
 * @param {LocalUploadFile | { blob: Blob, ext?: string } | { uri: string } | string} source
 * @param {string} fallbackName
 * @returns {Promise<LocalUploadFile>}
 */
async function toLocalUploadFile(source, fallbackName = 'file') {
  if (source && typeof source === 'object' && source.uri && source.type && typeof source.size === 'number') {
    return source;
  }

  // Web-picked file already resolved to a Blob.
  if (source && typeof source === 'object' && source.blob) {
    const { blob, ext } = source;
    const resolvedExt = ext || (blob.type ? blob.type.split('/')[1] : 'jpg');
    return {
      uri: URL.createObjectURL(blob),
      name: `${fallbackName}.${resolvedExt}`,
      type: blob.type || IMAGE_EXT_TO_MIME[resolvedExt] || 'application/octet-stream',
      size: blob.size,
    };
  }

  const uri = typeof source === 'string' ? source : source?.uri;
  if (!uri) {
    throw new Error('Unsupported file source for upload: ' + JSON.stringify(source));
  }

  const ext = (uri.split('.').pop() || 'jpg').split('?')[0].toLowerCase();
  const type = IMAGE_EXT_TO_MIME[ext] || 'application/octet-stream';
  const name = `${fallbackName}.${ext}`;

  let size;
  if (Platform.OS !== 'web' && uri.startsWith('file://')) {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) {
      throw new Error('Selected file does not exist: ' + uri);
    }
    size = info.size;
  } else {
    // http(s)/data/blob URL — fetch to measure size.
    const res = await fetch(uri);
    const blob = await res.blob();
    size = blob.size;
  }

  if (typeof size !== 'number') {
    throw new Error('Could not determine file size for upload: ' + uri);
  }

  return { uri, name, type, size };
}

// Defensive backstop — ImagePickerModal.jsx already validates size against
// imageLimits before a file ever gets here, but fileSize isn't always
// reported by the picker (notably on web), so this is what actually catches
// an oversized file in that case. Was a hardcoded Russian message
// regardless of app locale — real bug, since it's what callers show via
// showError(e.message).
function assertSizeWithinLimit(file, maxMB = MAX_FILE_MB) {
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > maxMB) {
    throw new Error(i18n.t('imagePicker.fileTooLarge', { size: maxMB }));
  }
}

// Documents (passport/certificate uploads) are private; everything else
// (avatars, job/attachment photos) is public.
function visibilityForPurpose(purpose) {
  return purpose === 'document' ? 'private' : 'public';
}

/**
 * Upload a local file to backend-managed storage via the pre-signed URL flow:
 * request an upload URL, PUT/POST the file bytes directly to it, then confirm
 * completion with the backend. The frontend never sees a bucket name or path.
 *
 * @param {{ file: LocalUploadFile, purpose?: import('./filesApi').FilePurpose }} input
 * @returns {Promise<{ fileId: string, file: { id: string, contentType: string, sizeBytes: number, purpose: string } }>}
 */
export async function uploadFileToBackendStorage({ file, purpose = 'other' }) {
  const upload = await filesApi.createUploadUrl({
    fileName: file.name,
    contentType: file.type,
    sizeBytes: file.size,
    purpose,
    visibility: visibilityForPurpose(purpose),
  });

  const blob = await fetch(file.uri).then((r) => r.blob());

  const uploadRes = await fetch(upload.uploadUrl, {
    method: upload.method,
    headers: {
      'Content-Type': file.type,
      ...(upload.uploadToken ? { Authorization: `Bearer ${upload.uploadToken}` } : {}),
    },
    body: blob,
  });

  if (!uploadRes.ok) {
    throw new Error('File upload failed');
  }

  const complete = await filesApi.completeUpload({ fileId: upload.fileId });

  return { fileId: upload.fileId, file: complete.file };
}

/**
 * Convenience wrapper for screens/components that need to pick an image and
 * immediately display it: normalizes the picked asset, uploads it to backend
 * storage, and resolves a display URL for it.
 *
 * @param {LocalUploadFile | { blob: Blob, ext?: string } | { uri: string } | string} source
 * @param {{ purpose?: import('./filesApi').FilePurpose, fileName?: string }} [options]
 * @returns {Promise<{ url: string, fileId: string }>}
 */
export async function uploadImageAsset(source, options = {}) {
  const { purpose = 'other', fileName = 'image' } = options;

  const file = await toLocalUploadFile(source, fileName);
  assertSizeWithinLimit(file);

  const { fileId } = await uploadFileToBackendStorage({ file, purpose });
  const { downloadUrl } = await filesApi.getDownloadUrl(fileId);

  logInfo('✅ Файл загружен:', downloadUrl);
  return { url: downloadUrl, fileId };
}
