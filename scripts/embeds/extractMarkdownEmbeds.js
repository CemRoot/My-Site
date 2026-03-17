/**
 * Extract YouTube/TikTok/Twitter links from markdown and convert to tokens
 * This handles cases where Firecrawl returns markdown links instead of HTML iframes
 */

/**
 * Extracts YouTube embeds from markdown links and converts them to tokens
 * @param {string} markdown - Markdown content
 * @returns {string} Markdown with YouTube tokens
 */
export function extractYouTubeFromMarkdown(markdown) {
  let content = markdown;
  let count = 0;

  // Pattern 1: [Text](https://www.youtube.com/watch?v=VIDEO_ID)
  content = content.replace(
    /\[([^\]]*)\]\(https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})[^\)]*\)/g,
    (match, text, videoId) => {
      count++;
      return `\n\n[[EMBED:YOUTUBE:${videoId}]]\n\n`;
    }
  );

  // Pattern 2: [Text](https://youtu.be/VIDEO_ID)
  content = content.replace(
    /\[([^\]]*)\]\(https?:\/\/youtu\.be\/([A-Za-z0-9_-]{11})[^\)]*\)/g,
    (match, text, videoId) => {
      count++;
      return `\n\n[[EMBED:YOUTUBE:${videoId}]]\n\n`;
    }
  );

  // Pattern 3: [Text](https://www.youtube.com/shorts/VIDEO_ID)
  content = content.replace(
    /\[([^\]]*)\]\(https?:\/\/(?:www\.)?youtube\.com\/shorts\/([A-Za-z0-9_-]{11})[^\)]*\)/g,
    (match, text, videoId) => {
      count++;
      return `\n\n[[EMBED:YOUTUBE:${videoId}]]\n\n`;
    }
  );

  // Pattern 4: Standalone YouTube URLs (not in markdown links)
  content = content.replace(
    /^https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([A-Za-z0-9_-]{11}).*$/gm,
    (match, videoId) => {
      count++;
      return `\n\n[[EMBED:YOUTUBE:${videoId}]]\n\n`;
    }
  );

  content = content.replace(
    /^https?:\/\/youtu\.be\/([A-Za-z0-9_-]{11}).*$/gm,
    (match, videoId) => {
      count++;
      return `\n\n[[EMBED:YOUTUBE:${videoId}]]\n\n`;
    }
  );

  if (count > 0) {
    console.log(`  ✅ Extracted ${count} YouTube embed(s) from markdown links`);
  }

  return content;
}

/**
 * Extracts TikTok embeds from markdown links and converts them to tokens
 * @param {string} markdown - Markdown content
 * @returns {string} Markdown with TikTok tokens
 */
export function extractTikTokFromMarkdown(markdown) {
  let content = markdown;
  let count = 0;

  // Pattern: [Text](https://www.tiktok.com/@username/video/VIDEO_ID)
  content = content.replace(
    /\[([^\]]*)\]\((https?:\/\/(?:www\.)?tiktok\.com\/@[^\/]+\/video\/\d+)[^\)]*\)/g,
    (match, text, url) => {
      count++;
      // Clean URL (remove query params)
      const cleanUrl = url.split('?')[0];
      return `\n\n[[EMBED:TIKTOK:${cleanUrl}]]\n\n`;
    }
  );

  // Standalone TikTok URLs (matches start-of-line AND inline mid-paragraph)
  // Lookbehind prevents re-matching URLs already inside [[EMBED:TIKTOK:...]] tokens
  content = content.replace(
    /(?<!TIKTOK:)(https?:\/\/(?:www\.)?tiktok\.com\/@[^\s\/]+\/video\/\d+)[^\s)\]"']*/g,
    (match, url) => {
      count++;
      const cleanUrl = url.split('?')[0];
      return `\n\n[[EMBED:TIKTOK:${cleanUrl}]]\n\n`;
    }
  );

  if (count > 0) {
    console.log(`  ✅ Extracted ${count} TikTok embed(s) from markdown links`);
  }

  return content;
}

/**
 * Extracts Twitter/X embeds from markdown links and converts them to tokens
 * @param {string} markdown - Markdown content
 * @returns {string} Markdown with Twitter tokens
 */
export function extractTwitterFromMarkdown(markdown) {
  let content = markdown;
  let count = 0;

  // Pattern: [Text](https://twitter.com/username/status/TWEET_ID)
  content = content.replace(
    /\[([^\]]*)\]\(https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[^\/]+\/status\/(\d+)[^\)]*\)/g,
    (match, text, tweetId) => {
      count++;
      return `\n\n[[EMBED:TWEET:${tweetId}]]\n\n`;
    }
  );

  // Standalone Twitter/X URLs (matches start-of-line AND inline mid-paragraph)
  content = content.replace(
    /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[^\s\/]+\/status\/(\d+)[^\s)\]"']*/g,
    (match, tweetId) => {
      count++;
      return `\n\n[[EMBED:TWEET:${tweetId}]]\n\n`;
    }
  );

  if (count > 0) {
    console.log(`  ✅ Extracted ${count} Twitter embed(s) from markdown links`);
  }

  return content;
}

/**
 * Extract all social media embeds from markdown
 * @param {string} markdown - Markdown content
 * @returns {string} Markdown with all embed tokens
 */
export function extractAllEmbedsFromMarkdown(markdown) {
  let content = markdown;
  
  content = extractYouTubeFromMarkdown(content);
  content = extractTikTokFromMarkdown(content);
  content = extractTwitterFromMarkdown(content);
  
  // Clean up excessive newlines
  content = content.replace(/\n{3,}/g, '\n\n');
  
  return content;
}
