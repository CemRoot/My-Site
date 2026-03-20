/**
 * Cleans embedded social media blockquotes from markdown
 * and replaces them with embed tokens at the correct position
 */

/**
 * Removes TikTok embed blockquotes from markdown and inserts token at that position
 * @param {string} markdown - Markdown content
 * @param {string} url - TikTok URL to insert as token
 * @returns {string} - Cleaned markdown with token
 */
export function replaceTikTokBlockquote(markdown, url) {
  // Pattern: > TikTok Embed followed by links
  // We need to remove everything from "> TikTok Embed" until the end of the blockquote
  
  const lines = markdown.split('\n');
  const cleanedLines = [];
  let inTikTokBlockquote = false;
  let tokenInserted = false;
  let blockquoteStartIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect start of TikTok blockquote
    if (line.includes('> TikTok Embed')) {
      inTikTokBlockquote = true;
      blockquoteStartIndex = i;
      // Insert token instead
      cleanedLines.push('');
      cleanedLines.push(`[[EMBED:TIKTOK:${url}]]`);
      cleanedLines.push('');
      tokenInserted = true;
      continue;
    }
    
    // Skip lines within TikTok blockquote
    if (inTikTokBlockquote) {
      // Check if this line is still part of blockquote (starts with > or is empty)
      if (line.startsWith('>') || line.trim() === '') {
        continue;
      } else {
        // End of blockquote
        inTikTokBlockquote = false;
        cleanedLines.push(line);
      }
    } else {
      cleanedLines.push(line);
    }
  }
  
  return cleanedLines.join('\n');
}

/**
 * Removes Twitter/X embed blocks from markdown and inserts token at that position.
 * Handles both blockquote format (> Twitter...) and Firecrawl expanded format
 * (plain "Twitter Embed" followed by twitter.com links and tweet content text).
 */
export function replaceTwitterBlockquote(markdown) {
  const lines = markdown.split('\n');
  const cleanedLines = [];
  let inTwitterBlock = false;
  let blockTweetId = null;

  const hasTwitterUrl = (line) =>
    /twitter\.com|x\.com\/\w+\/status|twimg\.com|t\.co\/|help\.twitter/i.test(line);

  const lookaheadHasTwitter = (fromIndex) => {
    const window = Math.min(fromIndex + 8, lines.length);
    for (let j = fromIndex; j < window; j++) {
      if (hasTwitterUrl(lines[j])) return true;
    }
    return false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!inTwitterBlock && (/^>\s*Twitter/i.test(trimmed) || /^Twitter\s+Embed$/i.test(trimmed))) {
      inTwitterBlock = true;
      blockTweetId = null;
      continue;
    }

    if (inTwitterBlock) {
      if (!blockTweetId) {
        const m = /\/status\/(\d+)/.exec(line);
        if (m) blockTweetId = m[1];
      }

      const isTweetRelated = !trimmed || hasTwitterUrl(line);
      if (isTweetRelated) continue;

      // Non-twitter line: check if more twitter links come soon (tweet text in between)
      if (lookaheadHasTwitter(i + 1)) continue;

      // No more twitter links ahead — end of block
      inTwitterBlock = false;
      if (blockTweetId) {
        cleanedLines.push('');
        cleanedLines.push(`[[EMBED:TWEET:${blockTweetId}]]`);
        cleanedLines.push('');
      }
      cleanedLines.push(line);
    } else {
      cleanedLines.push(line);
    }
  }

  if (inTwitterBlock && blockTweetId) {
    cleanedLines.push('');
    cleanedLines.push(`[[EMBED:TWEET:${blockTweetId}]]`);
    cleanedLines.push('');
  }

  return cleanedLines.join('\n');
}

/**
 * Removes all social media embed remnants from markdown
 * @param {string} markdown - Markdown content
 * @returns {string} - Cleaned markdown
 */
export function cleanSocialEmbedRemnants(markdown) {
  let cleaned = markdown;
  
  // Remove TikTok-related text blocks
  cleaned = cleaned.replace(/>\s*TikTok Embed\s*>/gi, '');
  cleaned = cleaned.replace(/>\s*Watch more exciting videos on TikTok[\\]*\s*/gi, '');
  cleaned = cleaned.replace(/>\s*Watch now\s*/gi, '');
  
  // Remove Twitter-related text blocks
  cleaned = cleaned.replace(/>\s*Twitter Widget Iframe\s*/gi, '');
  cleaned = cleaned.replace(/>\s*Tweet\s*>/gi, '');
  cleaned = cleaned.replace(/Loading tweet\.\.\./gi, '');
  cleaned = cleaned.replace(/View on Twitter[:\s]*/gi, '');
  cleaned = cleaned.replace(/View on X[:\s]*/gi, '');

  // BUG 3 FIX: Remove stray t.co URLs entirely (including markdown links)
  cleaned = cleaned.replace(/\[[^\]]*\]\(https?:\/\/t\.co\/[a-zA-Z0-9]+\)/g, '');
  cleaned = cleaned.replace(/https?:\/\/t\.co\/[a-zA-Z0-9]+/g, '');

  // Remove twitter/x links in blockquotes
  cleaned = cleaned.replace(/>\s*\[[^\]]+\]\(https:\/\/(?:www\.)?(?:twitter|x)\.com[^\)]*\)/gi, '');
  
  // Remove YouTube-related text blocks
  cleaned = cleaned.replace(/>\s*YouTube Widget\s*/gi, '');
  
  // Remove isolated blockquote markers with social media links
  cleaned = cleaned.replace(/>\s*\[[\d.KM]+\]\(https:\/\/(?:www\.)?tiktok\.com[^\)]*\)/gi, '');
  cleaned = cleaned.replace(/>\s*\[@[^\]]+\]\(https:\/\/(?:www\.)?tiktok\.com[^\)]*\)/gi, '');
  
  // Remove remaining empty blockquote lines
  cleaned = cleaned.replace(/^>\s*$/gm, '');

  // Clean up excessive newlines
  cleaned = cleaned.replace(/(\r?\n){3,}/g, '\n\n');
  
  return cleaned.trim();
}

