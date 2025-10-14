/**
 * TikTok Embed Component
 * Loads TikTok embed script only once globally
 * Uses aspect ratio wrapper to prevent CLS
 */

'use client';
import React, { useEffect } from 'react';

// Global flag to ensure script loads only once
let tiktokScriptLoaded = false;

/**
 * Ensures TikTok embed script is loaded
 * Safe to call multiple times - script loads only once
 */
function ensureTikTokScript() {
  if (tiktokScriptLoaded) {
    // Script already loaded, just trigger embed reload
    (window as any).tiktokEmbedLoad?.();
    return;
  }

  // Check if script already exists in DOM
  if (document.querySelector('[data-tiktok-embed="true"]')) {
    tiktokScriptLoaded = true;
    (window as any).tiktokEmbedLoad?.();
    return;
  }

  // Create and load script
  const script = document.createElement('script');
  script.src = 'https://www.tiktok.com/embed.js';
  script.async = true;
  script.onload = () => {
    tiktokScriptLoaded = true;
    (window as any).tiktokEmbedLoad?.();
  };
  script.setAttribute('data-tiktok-embed', 'true');
  document.body.appendChild(script);
}

interface TikTokEmbedProps {
  url: string;
  videoId?: string;
}

export default function TikTokEmbed({ url, videoId }: TikTokEmbedProps) {
  useEffect(() => {
    ensureTikTokScript();
  }, []);

  return (
    <div className="my-8 mx-auto w-full max-w-[620px]">
      {/* Aspect ratio wrapper prevents CLS */}
      <div className="relative w-full aspect-[9/16] max-h-[800px]">
        <blockquote
          className="tiktok-embed absolute inset-0"
          cite={url}
          data-video-id={videoId || ''}
          style={{ maxWidth: '605px', minWidth: '325px' }}
        >
          <a href={url} target="_blank" rel="noopener noreferrer">
            Watch on TikTok
          </a>
        </blockquote>
      </div>
    </div>
  );
}

