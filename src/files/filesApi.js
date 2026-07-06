import { fetchWithSession } from '../api/apiBase';
import { API_BASE_URL } from '../../utils/config';

/**
 * Frontend API client for the backend file-upload endpoints.
 *
 * Principle: the frontend never talks to Supabase (or any storage provider)
 * directly, never sees a storage bucket name/path, and never sees a Supabase
 * key. It only knows `/files/upload-url`, the returned `uploadUrl`, and
 * `/files/complete`. The backend owns the storage provider entirely.
 *
 * Transport: reuses the shared, session-authenticated transport
 * (see src/api/apiBase.js#fetchWithSession) — cookie on web, backend app
 * session Bearer token on native. `fetchWithSession` only reads
 * `session.serverURL`, so a minimal session shim is enough here.
 *
 * @typedef {'avatar' | 'attachment' | 'document' | 'other'} FilePurpose
 * @typedef {'public' | 'private'} FileVisibility
 *
 * @typedef {Object} CreateUploadUrlRequest
 * @property {string} fileName
 * @property {string} contentType
 * @property {number} sizeBytes
 * @property {FilePurpose} [purpose]
 * @property {FileVisibility} [visibility]
 *
 * @typedef {Object} CreateUploadUrlResponse
 * @property {string} fileId
 * @property {string} uploadUrl
 * @property {string} [uploadToken]
 * @property {string} path
 * @property {number} expiresInSeconds
 * @property {'PUT' | 'POST'} method
 *
 * @typedef {Object} CompleteUploadResponse
 * @property {'uploaded'} status
 * @property {{ id: string, contentType: string, sizeBytes: number, purpose: string }} file
 *
 * @typedef {Object} DownloadUrlResponse
 * @property {string} downloadUrl
 * @property {number} expiresInSeconds
 */

const apiSession = { serverURL: API_BASE_URL };

export const filesApi = {
  /**
   * @param {CreateUploadUrlRequest} input
   * @returns {Promise<CreateUploadUrlResponse>}
   */
  async createUploadUrl(input) {
    const res = await fetchWithSession({
      session: apiSession,
      endpoint: '/files/upload-url',
      method: 'POST',
      data: input,
    });
    return res.data;
  },

  /**
   * @param {{ fileId: string }} input
   * @returns {Promise<CompleteUploadResponse>}
   */
  async completeUpload(input) {
    const res = await fetchWithSession({
      session: apiSession,
      endpoint: '/files/complete',
      method: 'POST',
      data: input,
    });
    return res.data;
  },

  /**
   * @param {string} fileId
   * @returns {Promise<DownloadUrlResponse>}
   */
  async getDownloadUrl(fileId) {
    const res = await fetchWithSession({
      session: apiSession,
      endpoint: `/files/${fileId}/download-url`,
      method: 'GET',
    });
    return res.data;
  },
};
