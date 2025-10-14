/**
 * Smart URL Embed Router
 * Detects platform from URL and renders appropriate embed component
 * Falls back to plain link for unsupported URLs
 */

import React from 'react';
import TweetEmbed from './TweetEmbed';
import TikTokEmbed from './TikTokEmbed';
import YouTubeEmbed from './YouTubeEmbed';
import { matchTweetId, matchTikTok, matchYouTubeId } from '../../lib/embed/extractors';

interface EmbedFromURLProps {
  url: string;
}

export default function EmbedFromURL({ url }: EmbedFromURLProps) {
  // Try to match Twitter/X URL
  const tweetId = matchTweetId(url);
  if (tweetId) {
    return <TweetEmbed id={tweetId} />;
  }

  // Try to match TikTok URL
  const tiktok = matchTikTok(url);
  if (tiktok) {
    return <TikTokEmbed url={tiktok.url} videoId={tiktok.id} />;
  }

  // Try to match YouTube URL
  const youtubeId = matchYouTubeId(url);
  if (youtubeId) {
    return <YouTubeEmbed id={youtubeId} />;
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

