/**
 * Cleans embedded social media blockquotes from markdown
 * and replaces them with embed tokens at the correct position
 */

/**
 * Removes TikTok embed blocks from markdown and inserts token at that position.
 * Extracts the TikTok URL from within the block automatically.
 * Handles both blockquote (> TikTok Embed) and plain text (TikTok Embed) formats.
 */
export function replaceTikTokBlockquote(markdown) {
  const lines = markdown.split('\n');
  const cleanedLines = [];
  let inTikTokBlock = false;
  let blockTikTokUrl = null;
  let blockLines = [];

  const TIKTOK_URL_RE = /https?:\/\/(?:www\.)?tiktok\.com\/@[^\s\/]+\/video\/\d+/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!inTikTokBlock && (/^>\s*TikTok\s+Embed/i.test(trimmed) || /^TikTok\s+Embed$/i.test(trimmed))) {
      inTikTokBlock = true;
      blockTikTokUrl = null;
      blockLines = [];
      continue;
    }

    if (inTikTokBlock) {
      if (!blockTikTokUrl) {
        const m = TIKTOK_URL_RE.exec(line);
        if (m) blockTikTokUrl = m[0].split('?')[0];
      }

      if (trimmed === '' || line.startsWith('>') || /tiktok\.com/i.test(line)) {
        continue;
      }

      inTikTokBlock = false;
      if (blockTikTokUrl) {
        cleanedLines.push('');
        cleanedLines.push(`[[EMBED:TIKTOK:${blockTikTokUrl}]]`);
        cleanedLines.push('');
      }
      cleanedLines.push(line);
    } else {
      cleanedLines.push(line);
    }
  }

  if (inTikTokBlock && blockTikTokUrl) {
    cleanedLines.push('');
    cleanedLines.push(`[[EMBED:TIKTOK:${blockTikTokUrl}]]`);
    cleanedLines.push('');
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

