/**
 * HTML Embed Extractor
 * Converts HTML social media embeds to protected tokens for LLM translation
 * This prevents LLMs from mangling/escaping embed code during translation
 * 
 * @typedef {Object} ExtractedContent
 * @property {string} contentWithTokens
 * @property {{tiktok: number, twitter: number, youtube: number}} embedCount
 */

import * as cheerio from 'cheerio';

/**
 * Extracts social media embeds from HTML and converts them to protected tokens
 * 
 * Token format: [[EMBED:TYPE:DATA]]
 * - TIKTOK: [[EMBED:TIKTOK:https://www.tiktok.com/@user/video/123456]]
 * - TWEET: [[EMBED:TWEET:1876543212345678901]]
 * - YOUTUBE: [[EMBED:YOUTUBE:dQw4w9WgXcQ]]
 * 
 * These tokens are preserved during LLM translation and converted to React components on frontend
 */
export function htmlToTokens(html: string): ExtractedContent {
  const $ = cheerio.load(html, { decodeEntities: false });
  
  const counts = { tiktok: 0, twitter: 0, youtube: 0 };

  // ==========================================
  // TikTok Embed Detection
  // ==========================================
  // Matches: <blockquote class="tiktok-embed" cite="..." data-video-id="...">
  $('blockquote.tiktok-embed, div.tiktok, [cite*="tiktok.com"]').each((_, el) => {
    const $el = $(el);
    
    // Try to get URL from cite attribute
    let url = $el.attr('cite') || '';
    
    // If no cite, try to find it in nested blockquote
    if (!url) {
      url = $el.find('blockquote.tiktok-embed').attr('cite') || '';
    }
    
    // Try to extract video ID if we don't have URL
    if (!url) {
      const videoId = $el.attr('data-video-id') || $el.find('blockquote.tiktok-embed').attr('data-video-id') || '';
      if (videoId) {
        url = `https://www.tiktok.com/@unknown/video/${videoId}`;
      }
    }
    
    // Try to find URL in links
    if (!url) {
      const link = $el.find('a[href*="tiktok.com"]').attr('href');
      if (link) url = link;
    }
    
    if (url) {
      // Clean URL (remove query params)
      const cleanUrl = url.split('?')[0];
      $el.replaceWith(`\n\n[[EMBED:TIKTOK:${cleanUrl}]]\n\n`);
      counts.tiktok++;
    }
  });

  // ==========================================
  // Twitter (X) Embed Detection
  // ==========================================
  // Matches: <blockquote class="twitter-tweet"><a href="...status/123...">
  $('blockquote.twitter-tweet, blockquote.x-tweet, [class*="twitter"], [class*="x-tweet"]').each((_, el) => {
    const $el = $(el);
    
    // Find the status URL (usually in the last link)
    const statusLink = $el.find('a[href*="/status/"]').last().attr('href') || '';
    
    // Extract tweet ID from URL
    const match = /\/status\/(\d+)/.exec(statusLink);
    const tweetId = match?.[1];
    
    if (tweetId) {
      $el.replaceWith(`\n\n[[EMBED:TWEET:${tweetId}]]\n\n`);
      counts.twitter++;
    }
  });

  // Also catch standalone Twitter links that might be meant as embeds
  $('a[href*="twitter.com"][href*="/status/"], a[href*="x.com"][href*="/status/"]').each((_, el) => {
    const $el = $(el);
    const href = $el.attr('href') || '';
    const match = /\/status\/(\d+)/.exec(href);
    const tweetId = match?.[1];
    
    if (tweetId && $el.parent().is('p') && $el.parent().text().trim() === $el.text().trim()) {
      // Only if it's the sole content of a paragraph
      $el.parent().replaceWith(`\n\n[[EMBED:TWEET:${tweetId}]]\n\n`);
      counts.twitter++;
    }
  });

  // ==========================================
  // YouTube Embed Detection
  // ==========================================
  // Matches: <iframe src="youtube.com/embed/..."> or <a href="youtube.com/watch?v=...">
  $('iframe[src*="youtube.com/embed"], iframe[src*="youtube-nocookie.com/embed"]').each((_, el) => {
    const $el = $(el);
    const src = $el.attr('src') || '';
    
    // Extract video ID from embed URL
    const match = /\/embed\/([A-Za-z0-9_-]{11})/.exec(src);
    const videoId = match?.[1];
    
    if (videoId) {
      $el.replaceWith(`\n\n[[EMBED:YOUTUBE:${videoId}]]\n\n`);
      counts.youtube++;
    }
  });

  // Also handle YouTube links
  $('a[href*="youtube.com/watch"], a[href*="youtu.be/"], a[href*="youtube.com/shorts"]').each((_, el) => {
    const $el = $(el);
    const href = $el.attr('href') || '';
    
    // Extract video ID from various YouTube URL formats
    let videoId = null;
    
    // youtu.be/ID
    const shortMatch = /youtu\.be\/([A-Za-z0-9_-]{11})/.exec(href);
    if (shortMatch) videoId = shortMatch[1];
    
    // youtube.com/watch?v=ID
    if (!videoId) {
      const watchMatch = /[?&]v=([A-Za-z0-9_-]{11})/.exec(href);
      if (watchMatch) videoId = watchMatch[1];
    }
    
    // youtube.com/shorts/ID
    if (!videoId) {
      const shortsMatch = /\/shorts\/([A-Za-z0-9_-]{11})/.exec(href);
      if (shortsMatch) videoId = shortsMatch[1];
    }
    
    if (videoId && $el.parent().is('p') && $el.parent().text().trim() === $el.text().trim()) {
      // Only if it's the sole content of a paragraph
      $el.parent().replaceWith(`\n\n[[EMBED:YOUTUBE:${videoId}]]\n\n`);
      counts.youtube++;
    }
  });

  // Get the final HTML/text content
  let contentWithTokens = $.html();
  
  // Clean up excessive whitespace
  contentWithTokens = contentWithTokens
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return {
    contentWithTokens,
    embedCount: counts
  };
}

/**
 * Restores embed tokens to actual URLs for final rendering
 * (Optional utility - mainly used on frontend via React components)
 */
export function tokensToUrls(content: string): string {
  return content
    .replace(/\[\[EMBED:TIKTOK:([^\]]+)\]\]/g, '$1')
    .replace(/\[\[EMBED:TWEET:(\d+)\]\]/g, 'https://twitter.com/i/status/$1')
    .replace(/\[\[EMBED:YOUTUBE:([A-Za-z0-9_-]{11})\]\]/g, 'https://youtu.be/$1');
}

