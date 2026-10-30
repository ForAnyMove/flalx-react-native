import { Dimensions, PixelRatio } from 'react-native';

// utils/resizeFuncs.js

export const BASE_DESIGN_HEIGHT = 1024;
export const MOBILE_DESIGN_HEIGHT = 892;

/**
 * Масштабирует значение из макета по отношению к текущей высоте экрана.
 *
 * @param {number} designValue - Размер элемента из макета (при макете 1440x1024).
 * @param {number} [currentHeight=Dimensions.get('window').height] - Текущая высота экрана.
 * @param {number} [baseHeight=BASE_DESIGN_HEIGHT] - Базовая высота макета (по умолчанию 1024).
 * @param {Object} [options]
 * @param {boolean} [options.round=true] - Округлять до ближайшего пикселя.
 * @returns {number} Масштабированное значение.
 */
export function scaleByHeight(
  designValue,
  currentHeight = Dimensions.get('window').height,
  baseHeight = BASE_DESIGN_HEIGHT,
  { round = true, isFont = false, minScale = 0.5, maxScale = 2.0 } = {},
  isRevertResize = false,
) {
  if (typeof designValue !== 'number' || !isFinite(designValue)) return 0;
  if (typeof currentHeight !== 'number' || currentHeight <= 0) {
    currentHeight = Dimensions.get('window').height;
  }
  if (typeof baseHeight !== 'number' || baseHeight <= 0)
    baseHeight = BASE_DESIGN_HEIGHT;

  const scale = currentHeight / baseHeight;

  let resizeKef = 1;
  if (baseHeight === MOBILE_DESIGN_HEIGHT) {
    resizeKef = 1;
  } else {
    if (currentHeight < BASE_DESIGN_HEIGHT) {
      // Линейная интерполяция для коэффициента масштабирования от 1.0 при 1024 до 2.3 при 320
      if (isRevertResize) {
        resizeKef = 2.3 - (2.3 - 1.3 * (currentHeight / BASE_DESIGN_HEIGHT));
      } else {
        resizeKef = 2.3 - 1.3 * (currentHeight / BASE_DESIGN_HEIGHT);
      }
    }
  }

  // Display Size scaling (applies to all layout elements):
  let result = designValue * scale * resizeKef;

  // Font Size scaling (applies ONLY to text when isFont is explicitly requested):
  if (isFont) {
    const fontScale =
      typeof PixelRatio.getFontScale === 'function' ? PixelRatio.getFontScale() : 1;
    const rawScale =
      typeof fontScale === 'number' && fontScale > 0 ? fontScale : 1;
    const scaleFactor = Math.min(Math.max(rawScale, minScale), maxScale);
    result = result * scaleFactor;
  }

  return round ? PixelRatio.roundToNearestPixel(result) : result;
}

export function scaleByHeightMobile(
  designValue,
  currentHeight = Dimensions.get('window').height,
  options = {},
) {
  return scaleByHeight(designValue, currentHeight, MOBILE_DESIGN_HEIGHT, options);
}

/**
 * Масштабирует размер шрифта с учётом как высоты экрана (Display Size),
 * так и системного масштаба шрифта (Font Size / PixelRatio.getFontScale).
 */
export function scaleFontSize(
  designValue,
  currentHeight = Dimensions.get('window').height,
  options = {},
) {
  return scaleByHeight(designValue, currentHeight, BASE_DESIGN_HEIGHT, {
    ...options,
    isFont: true,
  });
}

export function scaleFontSizeMobile(
  designValue,
  currentHeight = Dimensions.get('window').height,
  options = {},
) {
  return scaleByHeight(designValue, currentHeight, MOBILE_DESIGN_HEIGHT, {
    ...options,
    isFont: true,
  });
}

