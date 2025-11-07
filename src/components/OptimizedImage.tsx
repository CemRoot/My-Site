import { useState, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  srcWebp?: string;
  srcAvif?: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

/**
 * Optimized Image Component with modern format support
 * Works correctly with Vite's asset hashing by accepting separate imports for each format
 *
 * Usage:
 * import imgPng from './image.png';
 * import imgWebp from './image.webp';
 * import imgAvif from './image.avif';
 *
 * <OptimizedImage src={imgPng} srcWebp={imgWebp} srcAvif={imgAvif} ... />
 */
export function OptimizedImage({
  src,
  srcWebp,
  srcAvif,
  alt,
  className = '',
  loading = 'lazy',
  fetchPriority = 'auto',
  width,
  height,
  style,
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Preload critical images
    if (loading === 'eager' && fetchPriority === 'high') {
      const img = new Image();
      img.src = src;
      img.onload = () => setIsLoaded(true);
    }
  }, [src, loading, fetchPriority]);

  return (
    <picture>
      {/* AVIF - best compression, modern browsers */}
      {srcAvif && <source type="image/avif" srcSet={srcAvif} />}

      {/* WebP - good compression, wider support */}
      {srcWebp && <source type="image/webp" srcSet={srcWebp} />}

      {/* Original format - fallback */}
      <img
        src={imageSrc}
        alt={alt}
        className={`${className} ${isLoaded ? 'loaded' : ''}`}
        loading={loading}
        fetchpriority={fetchPriority}
        width={width}
        height={height}
        style={style}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          // Fallback to original if modern formats fail
          setImageSrc(src);
        }}
        decoding={loading === 'eager' ? 'sync' : 'async'}
      />
    </picture>
  );
}
