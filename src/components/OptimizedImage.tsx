import { useState, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
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
 * Automatically uses WebP/AVIF when available, falls back to original
 */
export function OptimizedImage({
  src,
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

  // Generate WebP and AVIF paths (if they exist)
  const getModernFormats = (originalSrc: string) => {
    const withoutExt = originalSrc.replace(/\.(png|jpg|jpeg)$/i, '');
    return {
      avif: `${withoutExt}.avif`,
      webp: `${withoutExt}.webp`,
      original: originalSrc,
    };
  };

  const formats = getModernFormats(src);

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
      <source type="image/avif" srcSet={formats.avif} />

      {/* WebP - good compression, wider support */}
      <source type="image/webp" srcSet={formats.webp} />

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
          setImageSrc(formats.original);
        }}
        decoding={loading === 'eager' ? 'sync' : 'async'}
      />
    </picture>
  );
}
