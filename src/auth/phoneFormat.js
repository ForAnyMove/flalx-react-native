/**
 * Normalizes a phone number to E.164 (leading '+') before sending it back to
 * a backend endpoint that validates that format. User-typed phone numbers
 * are already validated with a leading '+' at input time and don't need
 * this — it's for phone values read off a backend response instead (e.g.
 * Supabase's own `phone` field, which comes back without the '+').
 * @param {string} phone
 * @returns {string}
 */
export function toE164(phone) {
  const trimmed = String(phone || '').trim();
  if (!trimmed) return trimmed;
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
}
