/**
 * HTML Embed Extractor
 * Converts HTML social media embeds to protected tokens for LLM translation
 * This prevents LLMs from mangling/escaping embed code during translation
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
 * 
 * @param {string} html - HTML content to extract embeds from
 * @returns {{contentWithTokens: string, embedCount: {tiktok: number, twitter: number, youtube: number}}}
 */
export function htmlToTokens(html) {
  const $ = cheerio.load(html, { decodeEntities: false });
  
  const counts = { tiktok: 0, twitter: 0, youtube: 0 };

  // ==========================================
  // TikTok Embed Detection
  // ==========================================
  $('blockquote.tiktok-embed, div.tiktok, [cite*="tiktok.com"]').each((_, el) => {
    const $el = $(el);
    
    let url = $el.attr('cite') || '';
    
    if (!url) {
      url = $el.find('blockquote.tiktok-embed').attr('cite') || '';
    }
    
    if (!url) {
      const videoId = $el.attr('data-video-id') || $el.find('blockquote.tiktok-embed').attr('data-video-id') || '';
      if (videoId) {
        url = `https://www.tiktok.com/@unknown/video/${videoId}`;
      }
    }
    
    if (!url) {
      const link = $el.find('a[href*="tiktok.com"]').attr('href');
      if (link) url = link;
    }
    
    if (url) {
      const cleanUrl = url.split('?')[0];
      $el.replaceWith(`\n\n[[EMBED:TIKTOK:${cleanUrl}]]\n\n`);
      counts.tiktok++;
    }
  });

  // ==========================================
  // Twitter (X) Embed Detection
  // ==========================================
  
  // Method 1: Standard blockquote embeds
  $('blockquote.twitter-tweet, blockquote.x-tweet, [class*="twitter"], [class*="x-tweet"]').each((_, el) => {
    const $el = $(el);
    
    const statusLink = $el.find('a[href*="/status/"]').last().attr('href') || '';
    
    const match = /\/status\/(\d+)/.exec(statusLink);
    const tweetId = match?.[1];
    
    if (tweetId) {
      $el.replaceWith(`\n\n[[EMBED:TWEET:${tweetId}]]\n\n`);
      counts.twitter++;
    }
  });

  // Method 2: Embedly CDN iframes (used by Nuvemmag)
  $('iframe[src*="embedly.com"]').each((_, el) => {
    const $el = $(el);
    const src = $el.attr('src') || '';
    
    // Check if schema=twitter in URL
    if (src.includes('schema=twitter') || src.includes('schema%3Dtwitter')) {
      // Extract the embedded URL parameter
      const urlMatch = /url=([^&]+)/.exec(src);
      if (urlMatch) {
        const encodedUrl = urlMatch[1];
        const decodedUrl = decodeURIComponent(encodedUrl);
        
        // Extract tweet ID from URL
        const tweetMatch = /\/status\/(\d+)/.exec(decodedUrl);
        if (tweetMatch) {
          const tweetId = tweetMatch[1];
          // Replace the entire figure/div wrapper if exists
          const $parent = $el.closest('figure, div');
          if ($parent.length > 0) {
            $parent.replaceWith(`\n\n[[EMBED:TWEET:${tweetId}]]\n\n`);
          } else {
            $el.replaceWith(`\n\n[[EMBED:TWEET:${tweetId}]]\n\n`);
          }
          counts.twitter++;
        }
      }
    }
  });

  // Method 3: Standalone Twitter links
  $('a[href*="twitter.com"][href*="/status/"], a[href*="x.com"][href*="/status/"]').each((_, el) => {
    const $el = $(el);
    const href = $el.attr('href') || '';
    const match = /\/status\/(\d+)/.exec(href);
    const tweetId = match?.[1];
    
    if (tweetId && $el.parent().is('p') && $el.parent().text().trim() === $el.text().trim()) {
      $el.parent().replaceWith(`\n\n[[EMBED:TWEET:${tweetId}]]\n\n`);
      counts.twitter++;
    }
  });

  // ==========================================
  // YouTube Embed Detection
  // ==========================================
  $('iframe[src*="youtube.com/embed"], iframe[src*="youtube-nocookie.com/embed"]').each((_, el) => {
    const $el = $(el);
    const src = $el.attr('src') || '';
    
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
      $el.parent().replaceWith(`\n\n[[EMBED:YOUTUBE:${videoId}]]\n\n`);
      counts.youtube++;
    }
  });

  let contentWithTokens = $.html();
  
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
 * @param {string} content - Content with tokens
 * @returns {string} Content with URLs
 */
export function tokensToUrls(content) {
  return content
    .replace(/\[\[EMBED:TIKTOK:([^\]]+)\]\]/g, '$1')
    .replace(/\[\[EMBED:TWEET:(\d+)\]\]/g, 'https://twitter.com/i/status/$1')
    .replace(/\[\[EMBED:YOUTUBE:([A-Za-z0-9_-]{11})\]\]/g, 'https://youtu.be/$1');
}

