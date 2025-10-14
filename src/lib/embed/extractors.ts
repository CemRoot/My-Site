/**
 * URL Extractor Utilities for Social Media Embeds
 * Extracts IDs from Twitter, TikTok, and YouTube URLs
 */

/**
 * Extract tweet ID from Twitter/X URL
 * Supports both twitter.com and x.com domains
 */
export const matchTweetId = (url: string): string | null => {
  const match = /(twitter\.com|x\.com)\/[^/]+\/status\/(\d+)/i.exec(url);
  return match?.[2] || null;
};

/**
 * Extract TikTok video ID and URL
 * Returns both the ID and original URL for embed
 */
export const matchTikTok = (url: string): { id: string; url: string } | null => {
  const match = /tiktok\.com\/@[^/]+\/video\/(\d+)/i.exec(url);
  return match ? { id: match[1], url } : null;
};

/**
 * Extract YouTube video ID from various URL formats
 * Supports youtu.be, youtube.com/watch, and youtube.com/shorts
 */
export const matchYouTubeId = (url: string): string | null => {
  // Short URL format: youtu.be/ID
  const shortMatch = /youtu\.be\/([A-Za-z0-9_-]{11})/i.exec(url)?.[1];
  
  // Long URL formats: youtube.com/watch?v=ID or youtube.com/shorts/ID
  const longMatch = /youtube\.com\/(?:watch\?v=|shorts\/)([A-Za-z0-9_-]{11})/i.exec(url)?.[1];
  
  return shortMatch || longMatch || null;
};

