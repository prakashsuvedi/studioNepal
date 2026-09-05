export type AspectRatioType = '16:9' | '9:16' | '1:1' | '4:5';

export interface AspectDimensions {
  width: number;
  height: number;
  ratio: number;
}

export const ASPECT_RATIO_DIMENSIONS: Record<AspectRatioType, AspectDimensions> = {
  '16:9': { width: 1024, height: 576, ratio: 16 / 9 },
  '9:16': { width: 576, height: 1024, ratio: 9 / 16 },
  '1:1': { width: 1024, height: 1024, ratio: 1 / 1 },
  '4:5': { width: 800, height: 1000, ratio: 4 / 5 },
};

export interface NormalizedOverlayCoordinate {
  normX: number; // 0.0 - 1.0
  normY: number; // 0.0 - 1.0
  normWidth: number; // 0.0 - 1.0
  normHeight: number; // 0.0 - 1.0
  anchor: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  cropMode: 'cover' | 'contain' | 'smart-center';
}

/**
 * Converts absolute pixel coordinates from source canvas to normalized (0.0 - 1.0) coordinates.
 */
export function normalizeCoordinate(
  absX: number,
  absY: number,
  absWidth: number,
  absHeight: number,
  sourceAspect: AspectRatioType,
  anchor: NormalizedOverlayCoordinate['anchor'] = 'top-right'
): NormalizedOverlayCoordinate {
  const dims = ASPECT_RATIO_DIMENSIONS[sourceAspect];
  return {
    normX: Math.max(0, Math.min(1, absX / dims.width)),
    normY: Math.max(0, Math.min(1, absY / dims.height)),
    normWidth: Math.max(0.01, Math.min(1, absWidth / dims.width)),
    normHeight: Math.max(0.01, Math.min(1, absHeight / dims.height)),
    anchor,
    cropMode: 'smart-center',
  };
}

/**
 * Denormalizes (0.0 - 1.0) coordinates into absolute target canvas pixels,
 * preserving anchor margins and aspect ratios without visual clipping or distortion.
 */
export function denormalizeCoordinate(
  normalized: NormalizedOverlayCoordinate,
  targetAspect: AspectRatioType
): { x: number; y: number; width: number; height: number; cropMode: string } {
  const targetDims = ASPECT_RATIO_DIMENSIONS[targetAspect];

  let width = normalized.normWidth * targetDims.width;
  let height = normalized.normHeight * targetDims.height;

  // Maintain aspect ratio scaling based on anchor point
  let x = normalized.normX * targetDims.width;
  let y = normalized.normY * targetDims.height;

  if (normalized.anchor === 'top-right') {
    const rightMargin = (1 - (normalized.normX + normalized.normWidth)) * targetDims.width;
    x = targetDims.width - rightMargin - width;
  } else if (normalized.anchor === 'bottom-right') {
    const rightMargin = (1 - (normalized.normX + normalized.normWidth)) * targetDims.width;
    const bottomMargin = (1 - (normalized.normY + normalized.normHeight)) * targetDims.height;
    x = targetDims.width - rightMargin - width;
    y = targetDims.height - bottomMargin - height;
  } else if (normalized.anchor === 'center') {
    x = (targetDims.width - width) / 2;
    y = (targetDims.height - height) / 2;
  }

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
    cropMode: normalized.cropMode,
  };
}
