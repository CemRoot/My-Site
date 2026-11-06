/**
 * Image Proxy Utility
 * Routes remote article images through our own domain (/api/img) so they load
 * on networks that block third-party image CDNs and publisher image hosts.
 * Vercel's CDN caches the responses.
 */

import { IMAGE_PROXY_PATH } from '../constants/urls';

interface ImageProxyOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

/**
 * Same-origin URL for a remote image. Sizing options are accepted for API
 * compatibility with the presets; the image is displayed with object-cover.
 */
export function getOptimizedImageUrl(
  originalUrl: string | undefined,
  _options: ImageProxyOptions = {}
): string {
  void _options;
  if (!originalUrl) return '';

  // Local assets, our own domain and already-proxied URLs are used as is
  if (
    originalUrl.startsWith('/') ||
    originalUrl.startsWith('data:') ||
    originalUrl.includes('cemkoyluoglu.tech')
  ) {
    return originalUrl;
  }

  return `${IMAGE_PROXY_PATH}?url=${encodeURIComponent(originalUrl)}`;
}

/**
 * Preset configurations for common use cases
 */
export const IMAGE_PRESETS = {
  // Tech news card thumbnail (list view)
  thumbnail: {
    width: 400,
    height: 225,
    quality: 75,
    format: 'webp' as const,
    fit: 'cover' as const,
  },
  
  // Article hero image
  hero: {
    width: 1200,
    height: 675,
    quality: 85,
    format: 'webp' as const,
    fit: 'cover' as const,
  },
  
  // Related article small thumbnail
  related: {
    width: 300,
    height: 169,
    quality: 70,
    format: 'webp' as const,
    fit: 'cover' as const,
  },
  
  // Mobile optimized
  mobile: {
    width: 600,
    height: 338,
    quality: 75,
    format: 'webp' as const,
    fit: 'cover' as const,
  },
} as const;

/**
 * Hook-friendly function for React components
 */
export function useOptimizedImage(
  url: string | undefined,
  preset: keyof typeof IMAGE_PRESETS = 'thumbnail'
): string {
  return getOptimizedImageUrl(url, IMAGE_PRESETS[preset]);
}

/**
 * onError handler for <img> tags that use getOptimizedImageUrl().
 * Some corporate networks block the wsrv.nl CDN, so on the first failure we
 * retry once with the original source; if that fails too, the image is hidden.
 */
export function imageFallbackHandler(originalUrl: string | undefined) {
  return (e: { currentTarget: HTMLImageElement }) => {
    const img = e.currentTarget;
    if (originalUrl && img.dataset.fallbackApplied !== 'true') {
      img.dataset.fallbackApplied = 'true';
      img.src = originalUrl;
      return;
    }
    img.style.display = 'none';
  };
}
