import axios from 'axios';
import { API_BASE_URL } from '../../utils/config';
import { logError } from '../../utils/log_util';

// Not under /auth or /users — a standalone top-level route.
const GEO_ENDPOINT = `${API_BASE_URL}/api/geo/me`;

/**
 * Detects the caller's country from their IP (Cloudflare-derived on the
 * backend) — used as the default region for phone-number inputs across the
 * app before the user picks one themselves. Best-effort: never blocks input
 * on this, callers fall back to device locale / a fixed default on failure.
 * @returns {Promise<{ iso2: string, source: string } | null>}
 */
async function getMyCountry() {
  try {
    const res = await axios.get(GEO_ENDPOINT, { timeout: 5000 });
    return res.data?.country ?? null;
  } catch (e) {
    logError('getMyCountry error:', e.message || e);
    return null;
  }
}

// Every PhoneField mounted in the same app session shares one lookup instead
// of each firing its own request (e.g. navigating login -> register -> forgot
// password all within one session).
let cachedCountryPromise = null;

export function getMyCountryCached() {
  if (!cachedCountryPromise) {
    cachedCountryPromise = getMyCountry();
  }
  return cachedCountryPromise;
}
