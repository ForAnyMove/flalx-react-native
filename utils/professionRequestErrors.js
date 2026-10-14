const TOP_LEVEL_CODES = [
  'INVALID_JOB_TYPE_SUBTYPE_COMBINATION',
  'INVALID_PASSPORT_PHOTO_URLS',
  'INVALID_CERTIFICATE_PHOTO_URLS',
  'PENDING_REQUEST_EXISTS',
  'PROFESSION_ALREADY_VERIFIED',
  'INTERNAL_ERROR',
];

const DETAIL_CODES = [
  'JOB_TYPE_ID_REQUIRED',
  'JOB_SUBTYPE_ID_REQUIRED',
  'PASSPORT_PHOTOS_REQUIRED',
  'CERTIFICATE_PHOTOS_REQUIRED',
  'INVALID_URL',
  'INVALID_EXPERIENCE_OBJECT',
  'INVALID_YEARS',
  'INVALID_MONTHS',
  'WORK_EXPERIENCE_REQUIRED',
];

/**
 * Возвращает переведённое сообщение об ошибке подачи заявки на профессию
 * по кодам сервера или null, если код неизвестен (тогда вызывающий код
 * использует свой запасной вариант).
 */
export function getProfessionRequestErrorMessage(err, t) {
  const data = err?.response?.data;
  if (!data) return null;

  if (data.code === 'VALIDATION_FAILED' && Array.isArray(data.details)) {
    const messages = [];
    data.details.forEach((d) => {
      if (DETAIL_CODES.includes(d?.code)) {
        const msg = t(`professions.request_errors.details.${d.code}`);
        if (!messages.includes(msg)) messages.push(msg);
      }
    });
    if (messages.length > 0) return messages.join('\n');
    return null;
  }

  if (TOP_LEVEL_CODES.includes(data.code)) {
    return t(`professions.request_errors.${data.code}`);
  }

  return null;
}
