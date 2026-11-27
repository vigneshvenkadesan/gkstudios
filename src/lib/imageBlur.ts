/**
 * Image blur placeholder & preloading utilities for smooth scroll rendering
 */

// Elegant South Indian emerald & antique gold shimmer SVG
const shimmerSvg = (w: number = 700, h: number = 475) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#072421" offset="20%" />
      <stop stop-color="#0E423E" offset="50%" />
      <stop stop-color="#072421" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#072421" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1.5s" repeatCount="indefinite" />
</svg>`;

const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);

export const SHIMMER_BLUR_DATA_URL = `data:image/svg+xml;base64,${toBase64(shimmerSvg(700, 475))}`;

/**
 * Resolves the Next.js Image Optimization endpoint so preloaded URLs hit the exact same
 * AVIF/WebP cache entry used by <Image /> instead of downloading raw unoptimized assets.
 */
export function getOptimizedNextImageUrl(
  src: string,
  width: number = 1080,
  quality: number = 90
): string {
  if (!src || src.startsWith('data:') || src.startsWith('/_next/image')) {
    return src;
  }
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}

/**
 * Pre-warms an image URL into browser cache using off-thread decoding
 */
export function preloadImage(
  src: string,
  width: number = 1080,
  quality: number = 90
): void {
  if (typeof window === 'undefined' || !src) return;
  try {
    const img = new window.Image();
    img.decoding = 'async';
    img.src = getOptimizedNextImageUrl(src, width, quality);
  } catch {
    // Ignore preloading errors
  }
}

/**
 * Custom hook to pre-warm an array of images when a container enters within rootMargin (e.g., 600px)
 */
import { useEffect } from 'react';

export function usePreloadImagesOnApproach(
  containerRef: React.RefObject<HTMLElement | null>,
  imageUrls: string[],
  rootMargin = '600px 0px'
) {
  useEffect(() => {
    if (!containerRef.current || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            imageUrls.forEach((url) => {
              if (url) preloadImage(url);
            });
            observer.disconnect();
          }
        });
      },
      { rootMargin }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [containerRef, imageUrls, rootMargin]);
}
