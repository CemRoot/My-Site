/**
 * Image Proxy Utility
 * Uses wsrv.nl (free image CDN) to:
 * - Convert images to WebP
 * - Resize for optimal loading
 * - Cache globally via CDN
 * - Reduce bandwidth and improve LCP
 */

import { WSRV_CDN_BASE_URL } from '../constants/urls';

interface ImageProxyOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

const DEFAULT_OPTIONS: ImageProxyOptions = {
  quality: 80,
  format: 'webp',
  fit: 'cover',
};

/**
 * Generate optimized image URL via wsrv.nl CDN
 * @param originalUrl - Original image URL (from nuvemmag.com, etc.)
 * @param options - Optimization options
 * @returns Proxied/optimized image URL
 */
export function getOptimizedImageUrl(
  originalUrl: string | undefined,
  options: ImageProxyOptions = {}
): string {
  // Return empty string if no URL
  if (!originalUrl) return '';
  
  // Skip if already using our CDN or local assets
  if (
    originalUrl.startsWith('/') ||
    originalUrl.includes('cemkoyluoglu.codes') ||
    originalUrl.includes(WSRV_CDN_BASE_URL) ||
    originalUrl.includes('images.weserv.nl')
  ) {
    return originalUrl;
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Build wsrv.nl URL
  const params = new URLSearchParams();
  
  // Source URL
  params.set('url', originalUrl);
  
  // Format (WebP for best compression)
  if (opts.format) {
    params.set('output', opts.format);
  }
  
  // Quality
  if (opts.quality) {
    params.set('q', opts.quality.toString());
  }
  
  // Dimensions
  if (opts.width) {
    params.set('w', opts.width.toString());
  }
  if (opts.height) {
    params.set('h', opts.height.toString());
  }
  
  // Fit mode
  if (opts.fit) {
    params.set('fit', opts.fit);
  }
  
  // Enable caching
  params.set('n', '-1'); // Do not upscale
  
  return `${WSRV_CDN_BASE_URL}?${params.toString()}`;
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
