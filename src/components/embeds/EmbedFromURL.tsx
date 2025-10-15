/**
 * Smart Embed Router
 * Handles both [[EMBED:...]] tokens and direct URLs
 * Renders appropriate embed component based on type
 */

import React from 'react';
import TweetEmbedHTML from './TweetEmbedHTML';
import TikTokEmbedHTML from './TikTokEmbedHTML';
import YouTubeEmbedHTML from './YouTubeEmbedHTML';
import { matchTweetId, matchTikTok, matchYouTubeId } from '../../lib/embed/extractors';

interface EmbedFromTokenProps {
  token: string;
}

interface EmbedFromURLProps {
  url: string;
}

/**
 * Renders embed from [[EMBED:TYPE:DATA]] token
 * This is the primary method used after LLM translation
 */
export function EmbedFromToken({ token }: EmbedFromTokenProps) {
  // Parse token format: [[EMBED:TYPE:DATA]]
  const match = /^\[\[EMBED:(TIKTOK|TWEET|YOUTUBE):(.+)\]\]$/i.exec(token.trim());
  
  if (!match) {
    return null;
  }
  
  const type = match[1].toUpperCase();
  const payload = match[2];
  
  // Route to appropriate HTML embed component
  if (type === 'TWEET') {
    const tweetUrl = `https://twitter.com/i/status/${payload}`;
    return <TweetEmbedHTML url={tweetUrl} id={payload} />;
  }
  
  if (type === 'TIKTOK') {
    return <TikTokEmbedHTML url={payload} />;
  }
  
  if (type === 'YOUTUBE') {
    return <YouTubeEmbedHTML videoId={payload} />;
  }
  
  return null;
}

/**
 * Legacy: Renders embed from direct URL
 * Kept for backward compatibility
 */
export default function EmbedFromURL({ url }: EmbedFromURLProps) {
  // Try to match Twitter/X URL
  const tweetId = matchTweetId(url);
  if (tweetId) {
    return <TweetEmbedHTML url={url} id={tweetId} />;
  }

  // Try to match TikTok URL
  const tiktok = matchTikTok(url);
  if (tiktok) {
    return <TikTokEmbedHTML url={tiktok.url} />;
  }

  // Try to match YouTube URL
  const youtubeId = matchYouTubeId(url);
  if (youtubeId) {
    return <YouTubeEmbedHTML videoId={youtubeId} />;
  }

  // Fallback: render as normal link
  return (
    <p className="text-lg leading-relaxed mb-4">
      <a
        className="text-primary hover:underline"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {url}
      </a>
    </p>
  );
}

