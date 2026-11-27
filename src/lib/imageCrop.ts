import type { CSSProperties } from 'react';
import type { ImageCropConfig } from '@/src/types/studio';

export const DEFAULT_IMAGE_CROP: Required<ImageCropConfig> = {
  x: 50,
  y: 50,
  zoom: 1,
};

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

export function normalizeImageCrop(raw: unknown): Required<ImageCropConfig> | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const candidate = raw as { x?: unknown; y?: unknown; zoom?: unknown };
  const rawX = typeof candidate.x === 'number' && Number.isFinite(candidate.x) ? candidate.x : NaN;
  const rawY = typeof candidate.y === 'number' && Number.isFinite(candidate.y) ? candidate.y : NaN;

  if (Number.isNaN(rawX) && Number.isNaN(rawY)) return undefined;

  const x = roundToTenth(clampNumber(Number.isNaN(rawX) ? 50 : rawX, 0, 100));
  const y = roundToTenth(clampNumber(Number.isNaN(rawY) ? 50 : rawY, 0, 100));
  const rawZoom =
    typeof candidate.zoom === 'number' && Number.isFinite(candidate.zoom) ? candidate.zoom : 1;
  const zoom = Math.round(clampNumber(rawZoom, 1, 2) * 100) / 100;

  return { x, y, zoom };
}

export function resolveImageCrop(crop?: ImageCropConfig | null): Required<ImageCropConfig> {
  return normalizeImageCrop(crop) ?? DEFAULT_IMAGE_CROP;
}

export function getResponsiveCropStyle(item?: {
  desktopCrop?: ImageCropConfig | null;
  mobileCrop?: ImageCropConfig | null;
}): CSSProperties {
  const desktop = resolveImageCrop(item?.desktopCrop);
  const mobile = resolveImageCrop(item?.mobileCrop);

  return {
    '--gk-crop-pos-desktop': `${desktop.x}% ${desktop.y}%`,
    '--gk-crop-scale-desktop': String(desktop.zoom),
    '--gk-crop-pos-mobile': `${mobile.x}% ${mobile.y}%`,
    '--gk-crop-scale-mobile': String(mobile.zoom),
  } as CSSProperties;
}

export function isCustomImageCrop(crop?: ImageCropConfig | null): boolean {
  const resolved = resolveImageCrop(crop);
  return resolved.x !== 50 || resolved.y !== 50 || resolved.zoom !== 1;
}
