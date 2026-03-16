import { Dimensions, PixelRatio } from 'react-native';

// utils/resizeFuncs.js

const BASE_DESIGN_HEIGHT = 1024;
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
  { round = true } = {}
) {
  if (typeof designValue !== 'number' || !isFinite(designValue)) return 0;
  if (typeof currentHeight !== 'number' || currentHeight <= 0) {
    currentHeight = Dimensions.get('window').height;
  }
  if (typeof baseHeight !== 'number' || baseHeight <= 0) baseHeight = BASE_DESIGN_HEIGHT;

  const scale = currentHeight / baseHeight;
  
  let resizeKef;
  if (baseHeight === MOBILE_DESIGN_HEIGHT) {
    resizeKef = 1;
  } else {
    // Линейная интерполяция для коэффициента масштабирования от 1.0 при 1024 до 2.3 при 320
    resizeKef = 2.3 - 1.3 * (currentHeight / BASE_DESIGN_HEIGHT);
  }
  
  const result = designValue * scale * resizeKef;

  return round ? PixelRatio.roundToNearestPixel(result) : result;
}

export function scaleByHeightMobile(designValue, currentHeight = Dimensions.get('window').height, { round = true } = {}) {
  return scaleByHeight(designValue, currentHeight, MOBILE_DESIGN_HEIGHT, { round });
}