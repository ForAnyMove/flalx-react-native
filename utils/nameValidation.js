// Валидация личного имени/фамилии.
//
// Правила основаны на рекомендациях W3C по интернационализации личных имён
// (https://www.w3.org/International/questions/qa-personal-names,
// https://www.w3.org/International/wiki/Personal_names): не пытаться
// угадывать "правильную" форму имени под конкретную культуру, а просто не
// пропускать пустые/мусорные значения и нормализовать пробелы и Unicode-форму
// перед сохранением. Поэтому диапазон разрешённых символов сознательно
// широкий (буквы любого языка через \p{L}/\p{M}, плюс пробел/дефис/апостроф
// как разделители составных имён), а не жёсткий whitelist под конкретный
// алфавит — приложение уже поддерживает иврит (RTL) и латиницу, и не должно
// блокировать другие языки, которые могут появиться позже.
const MIN_LENGTH = 1;
const MAX_LENGTH = 50;

const NAME_REGEX = /^[\p{L}\p{M}]+(?:[ '’.-][\p{L}\p{M}]+)*$/u;

/**
 * @param {string|null|undefined} value
 * @returns {{ valid: true, value: string } | { valid: false, reason: 'empty'|'too_short'|'too_long'|'invalid_chars' }}
 */
export function validatePersonName(value) {
  const normalized = (value ?? '')
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ');

  if (!normalized) {
    return { valid: false, reason: 'empty' };
  }
  if (normalized.length < MIN_LENGTH) {
    return { valid: false, reason: 'too_short' };
  }
  if (normalized.length > MAX_LENGTH) {
    return { valid: false, reason: 'too_long' };
  }
  if (!NAME_REGEX.test(normalized)) {
    return { valid: false, reason: 'invalid_chars' };
  }
  return { valid: true, value: normalized };
}

export const NAME_MAX_LENGTH = MAX_LENGTH;
