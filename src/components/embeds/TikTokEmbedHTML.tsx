/**
 * TikTok Embed using Native HTML
 * Renders TikTok's official embed HTML with script loader
 */

'use client';
import React, { useEffect, useRef } from 'react';
import { TIKTOK_EMBED_SCRIPT_URL } from '../../lib/constants/urls';

interface TikTokEmbedHTMLProps {
  url: string;
}

let tiktokScriptLoaded = false;

function ensureTikTokScript() {
  if (tiktokScriptLoaded) {
    if (window.tiktokEmbed) {
      window.tiktokEmbed.lib.render(document.querySelectorAll('.tiktok-embed'));
    }
    return;
  }

  if (document.querySelector('[data-tiktok-embed="true"]')) {
    tiktokScriptLoaded = true;
    if (window.tiktokEmbed) {
      window.tiktokEmbed.lib.render(document.querySelectorAll('.tiktok-embed'));
    }
    return;
  }

  const script = document.createElement('script');
  script.src = TIKTOK_EMBED_SCRIPT_URL;
  script.async = true;
  script.onload = () => {
    tiktokScriptLoaded = true;
    if (window.tiktokEmbed) {
      window.tiktokEmbed.lib.render(document.querySelectorAll('.tiktok-embed'));
    }
  };
  script.setAttribute('data-tiktok-embed', 'true');
  document.body.appendChild(script);
}

export default function TikTokEmbedHTML({ url }: TikTokEmbedHTMLProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Extract video ID from URL
  const videoIdMatch = url.match(/\/video\/(\d+)/);
  const videoId = videoIdMatch?.[1] || '';

  useEffect(() => {
    ensureTikTokScript();
    
    // Force re-render after mount
    const timer = setTimeout(() => {
      if (window.tiktokEmbed) {
        window.tiktokEmbed.lib.render(document.querySelectorAll('.tiktok-embed'));
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [url]);

  return (
    <div 
      ref={containerRef}
      className="my-8 mx-auto w-full max-w-[620px]"
    >
      <div className="relative w-full" style={{ aspectRatio: '9/16', maxHeight: '800px' }}>
        <blockquote
          className="tiktok-embed"
          cite={url}
          data-video-id={videoId}
          style={{ maxWidth: '605px', minWidth: '325px', margin: '0 auto' }}
        >
          <section>
            <a 
              target="_blank" 
              rel="noopener noreferrer"
              href={url}
            >
              View on TikTok
            </a>
          </section>
        </blockquote>
      </div>
    </div>
  );
}

