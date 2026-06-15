const FALLBACK_TIMEZONES = [
  'Asia/Jerusalem',
  'UTC',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Warsaw',
  'America/New_York',
  'America/Los_Angeles',
];

export const getDeviceTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || FALLBACK_TIMEZONES[0];
  } catch (_error) {
    return FALLBACK_TIMEZONES[0];
  }
};

export const getTimezoneOptions = () => {
  const current = getDeviceTimezone();
  const timezones = Intl.supportedValuesOf?.("timeZone") ?? [...FALLBACK_TIMEZONES];
  return Array.from(new Set([current, ...timezones]));
};

export const getTimezoneCityLabel = (timezone) => {
  if (!timezone) return '';
  const city = timezone.split('/').pop()?.replace(/_/g, ' ') || timezone;
  return `${city} time`;
};

export const formatTimezoneLabel = (timezone) => (
  timezone ? `${timezone}` : ''
);

export const toLocalDateTimeString = (date) => {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (value) => String(value).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export const formatDisplayDateTime = (date, includeTime = true) => {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (v) => String(v).padStart(2, '0');
  const dateStr = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
  if (!includeTime) return dateStr;
  return `${dateStr}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const formatLocalDateTime = (localDateTime, _locale, includeTime = true) => {
  if (!localDateTime) return '';
  const match = String(localDateTime).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return localDateTime;
  const [, year, month, day, hour, minute] = match;
  if (!includeTime) return `${day}.${month}.${year}`;
  return `${day}.${month}.${year}, ${hour}:${minute}`;
};
