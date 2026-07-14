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
  cleaned = cleaned.replace(/^\s*Twitter Widget Iframe\s*$/gim, '');
  cleaned = cleaned.replace(/^\s*Twitter Embed\s*$/gim, '');
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

/** NuvemMag footer / source social profiles — must never appear in published content. */
const NUVEM_SOURCE_SOCIAL_URL_RE =
  /(?:instagram\.com\/nuvem\.mag|linkedin\.com\/company\/nuvem-mag|youtube\.com\/@nuvem_tv|(?:twitter|x)\.com\/(?:nuvemmag|nuvem))/i;

/** LLM-leaked single-bracket widget syntax (distinct from valid [[EMBED:...]] tokens). */
const LEAKED_WIDGET_TAG_RE = /\[(?:TWEET|INSTAGRAM|LINKEDIN|YOUTUBE):\s*[^\]]+\]/gi;

/** Markdown links to social profiles — never valid in published article body (embeds use [[EMBED:...]]). */
const SOCIAL_MD_LINK_RE =
  /\[(?:Twitter|Tweets?|Tweet by @|Instagram(?: post by @[^\]]*)?|Linkedin(?: post by @[^\]]*)?|LinkedIn(?: post by @[^\]]*)?|Youtube(?: video by @[^\]]*)?|YouTube(?: video by @[^\]]*)?)[^\]]*\]\(\s*https?:\/\/(?:www\.)?(?:twitter|x|instagram|linkedin|youtube)\.com[^)]*\)/gi;

/** LLM meta lines / paragraphs that introduce or describe footer social dumps. */
const SOCIAL_LEAK_META_RES = [
  /^(?:The )?[Ff]ollowing links were:?\s*$/gim,
  /^There are no __WIDGET_\d+__ tokens present in the source\.?\s*$/gim,
  /is not present in the original text, however[^\n]*/gi,
  /social media platforms which are not in the required format[^\n]*/gi,
  /The company's social media presence can be found on[^\n]*/gi,
  /\*\*(?:Linkedin|LinkedIn|Instagram|Twitter|Youtube|YouTube):Nuvem(?:Mag| TV)?:\*\*/gi,
  /^\s*\(\s*\)\s*$/gm,
  /^\s*\(https?:\/\/(?:www\.)?(?:twitter|x)\.com\/?\s*\)\s*$/gm,
];

/** Parenthesized social URLs and empty-paren debris left after partial link stripping. */
const PAREN_SOCIAL_URL_RE =
  /\(\s*https?:\/\/(?:www\.)?(?:twitter|x|instagram|linkedin|youtube)\.com[^\s)]*\s*\)/gi;

function stripParenAndLinkArtifacts(text) {
  let cleaned = String(text || '');

  cleaned = cleaned.replace(PAREN_SOCIAL_URL_RE, '');

  // Trailing same-line debris: "...text." (https://twitter.com/) () () ()
  cleaned = cleaned.replace(
    /\s*(?:\(\s*https?:\/\/(?:www\.)?(?:twitter|x|instagram|linkedin|youtube)\.com[^)]*\)\s*)+(?:\(\s*\)\s*)*$/gi,
    '',
  );
  cleaned = cleaned.replace(/\s*(?:\(\s*\)\s*){2,}$/g, '');

  // Broken markdown tails: [Twitter]() or ]()
  cleaned = cleaned.replace(/\[(?:Twitter|Instagram|Linkedin|LinkedIn|Youtube|YouTube|Tweets?)[^\]]*\]\(\s*\)/gi, '');
  cleaned = cleaned.replace(/\]\(\s*\)/g, '');

  // Orphan bracket labels with no URL
  cleaned = cleaned.replace(
    /^\s*\[(?:Twitter|Instagram|Linkedin|LinkedIn|Youtube|YouTube|Tweets?)\]\s*$/gim,
    '',
  );

  // Repeated empty parentheses (loop for ()()() patterns)
  for (let i = 0; i < 6; i++) {
    const next = cleaned.replace(/\(\s*\)/g, '');
    if (next === cleaned) break;
    cleaned = next;
  }

  // Lines composed only of paren/url scraping debris
  cleaned = cleaned
    .split('\n')
    .filter((line) => {
      const t = line.trim();
      if (!t) return true;
      if (/^(?:\(\s*\)\s*)+$/.test(t)) return false;
      if (/^(?:\(\s*https?:\/\/(?:www\.)?(?:twitter|x|instagram|linkedin|youtube)\.com[^)]*\)\s*)+(?:\(\s*\)\s*)*$/i.test(t)) {
        return false;
      }
      return true;
    })
    .join('\n');

  return cleaned;
}

function hasParenOrLinkArtifact(text) {
  const sample = String(text || '');
  if (!sample.trim()) return false;
  if (new RegExp(PAREN_SOCIAL_URL_RE.source, 'i').test(sample)) return true;
  if (/\]\(\s*\)/.test(sample)) return true;
  if (/^\s*(?:\(\s*\)\s*)+$/m.test(sample)) return true;
  if (/^\s*(?:\(\s*https?:\/\/(?:www\.)?(?:twitter|x|instagram|linkedin|youtube)\.com[^)]*\)\s*)+(?:\(\s*\)\s*)*$/im.test(sample)) return true;
  if (/^\s*\[(?:Twitter|Instagram|Linkedin|LinkedIn|Youtube|YouTube)\]\s*$/im.test(sample)) return true;
  // Trailing debris on an otherwise valid line (not the whole article)
  if (/(?:\(\s*https?:\/\/(?:www\.)?(?:twitter|x|instagram|linkedin|youtube)\.com[^)]*\)\s*)+(?:\(\s*\)\s*)+$/i.test(sample)) return true;
  return false;
}

function countSocialMdLinks(text) {
  return (String(text || '').match(new RegExp(SOCIAL_MD_LINK_RE.source, 'gi')) || []).length;
}

function isPlainSocialFooterLine(line) {
  const t = String(line || '').trim();
  if (!t) return false;
  if (/^Twitter\s+Instagram\s+Linkedin\s+Youtube\.?$/i.test(t)) return true;
  if (/^(?:Twitter|Tweets?)(?:\s+(?:Instagram|Linkedin|LinkedIn|Youtube|YouTube))+\.?\s*$/i.test(t)) return true;
  if (/^Twitter,?\s+Instagram,?\s+LinkedIn,?\s+(?:and\s+)?Youtube\.?$/i.test(t)) return true;
  if (/^The company's social media presence can be found on/i.test(t)) return true;
  if (/^\(\s*\)$/.test(t)) return true;
  if (/^(?:\(\s*\)\s*)+$/.test(t)) return true;
  if (/^\(https?:\/\/(?:www\.)?(?:twitter|x)\.com\/?\)$/.test(t)) return true;
  if (/^(?:\(\s*https?:\/\/(?:www\.)?(?:twitter|x|instagram|linkedin|youtube)\.com[^)]*\)\s*)+(?:\(\s*\)\s*)*$/i.test(t)) return true;
  if (/^\*\*(?:Linkedin|LinkedIn|Instagram|Twitter|Youtube|YouTube):Nuvem/i.test(t)) return true;
  if (new RegExp(SOCIAL_MD_LINK_RE.source, 'i').test(t)) return true;
  return false;
}

/**
 * Returns true when text contains banned source social links or leaked widget tags.
 */
export function hasSourceSocialLeak(text) {
  const sample = String(text || '');
  if (!sample.trim()) return false;

  if (/\[(?:TWEET|INSTAGRAM|LINKEDIN|YOUTUBE):\s*[^\]]+\]/i.test(sample)) return true;
  if (/@nuvem\.mag|@nuvem-mag|@Nuvem_tv/i.test(sample)) return true;
  if (/instagram\.com\/nuvem\.mag|linkedin\.com\/company\/nuvem-mag|youtube\.com\/@nuvem_tv/i.test(sample)) return true;
  if (/Tweet by @|Instagram post by|LinkedIn post by|Linkedin post by|Youtube video by|YouTube video by/i.test(sample)) return true;
  if (countSocialMdLinks(sample) >= 1 && NUVEM_SOURCE_SOCIAL_URL_RE.test(sample)) return true;
  if (countSocialMdLinks(sample) >= 2) return true;
  if (/following links were/i.test(sample)) return true;
  if (/is not present in the original text, however/i.test(sample)) return true;
  if (/social media platforms which are not in the required format/i.test(sample)) return true;
  if (/\*\*(?:Linkedin|LinkedIn|Instagram|Twitter|Youtube|YouTube):Nuvem/i.test(sample)) return true;
  if (/^\s*\(\s*\)\s*$/m.test(sample)) return true;
  if (/^\s*\(https?:\/\/(?:www\.)?(?:twitter|x)\.com\/?\s*\)\s*$/m.test(sample)) return true;
  if (hasParenOrLinkArtifact(sample)) return true;
  if (sample.split('\n').some(isPlainSocialFooterLine)) return true;

  return false;
}

/**
 * Strips source-site footer social links and LLM-leaked widget placeholders.
 * Keeps valid [[EMBED:TIKTOK|TWEET|YOUTUBE:...]] article embed tokens intact.
 */
export function stripSourceSocialLeaks(markdown) {
  let cleaned = markdown || '';

  cleaned = cleaned.replace(LEAKED_WIDGET_TAG_RE, '');
  cleaned = cleaned.replace(SOCIAL_MD_LINK_RE, '');

  for (const re of SOCIAL_LEAK_META_RES) {
    cleaned = cleaned.replace(re, '');
  }

  cleaned = cleaned.replace(
    /\[[^\]]*\]\(\s*https?:\/\/(?:www\.)?(?:instagram\.com\/nuvem\.mag|linkedin\.com\/company\/nuvem-mag|youtube\.com\/@nuvem_tv)[^)]*\)/gi,
    '',
  );

  cleaned = cleaned.replace(/https?:\/\/(?:www\.)?instagram\.com\/nuvem\.mag[^\s\)>\]"']*/gi, '');
  cleaned = cleaned.replace(/https?:\/\/(?:www\.)?linkedin\.com\/company\/nuvem-mag[^\s\)>\]"']*/gi, '');
  cleaned = cleaned.replace(/https?:\/\/(?:www\.)?youtube\.com\/@nuvem_tv[^\s\)>\]"']*/gi, '');
  cleaned = cleaned.replace(
    /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/(?:nuvemmag|nuvem)[^\s\)>\]"']*/gi,
    '',
  );

  cleaned = cleaned.replace(
    /(?:Tweet by @\s*)?(?:Instagram post by @nuvem\.mag\s*)?(?:LinkedIn post by @nuvem-mag\s*)?(?:Linkedin post by @nuvem-mag\s*)?(?:Youtube video by @Nuvem_tv\s*)?(?:YouTube video by @Nuvem_tv\s*)?/gi,
    '',
  );

  cleaned = cleaned.replace(
    /^\s*(?:Twitter\s+Instagram\s+Linkedin\s+Youtube|Twitter,?\s+Instagram,?\s+LinkedIn,?\s+(?:and\s+)?Youtube)\.?\s*$/gim,
    '',
  );

  // Remove inline / trailing paren debris before line filtering
  cleaned = stripParenAndLinkArtifacts(cleaned);

  const lines = cleaned.split('\n');
  cleaned = lines.filter((line) => !isPlainSocialFooterLine(line)).join('\n');

  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  return cleaned.trim();
}

/**
 * Removes leaked placeholder artifacts that should never reach the frontend.
 * Keeps valid [[EMBED:TIKTOK|TWEET|YOUTUBE:...]] tokens intact.
 */
export function removeEmbedArtifactNoise(markdown) {
  let cleaned = stripSourceSocialLeaks(markdown);

  cleaned = cleaned
    .replace(/\[\[EMBED:(?!TIKTOK|TWEET|YOUTUBE)[^\]]+\]\]/gi, '')
    .replace(/__WIDGET_\d+__/g, '')
    .replace(/\bWIDGET_\d+\b/g, '')
    .replace(/^\s*(?:Twitter|TikTok)\s+Embed\s*$/gim, '')
    .replace(/^\s*(?:YouTube Widget|Twitter Widget Iframe|Widget Iframe|Instagram Widget|Social Media Widget)\s*$/gim, '')
    .replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}

/**
 * Deduplicates repeated valid embed tokens within a single article.
 * If the exact same token appears multiple times, only the first one is kept.
 */
export function dedupeEmbedTokens(markdown) {
  const seen = new Set();

  const deduped = (markdown || '').replace(
    /\[\[EMBED:(TIKTOK|TWEET|YOUTUBE):([^\]]+)\]\]/gi,
    (match, type, payload) => {
      const normalizedType = String(type).toUpperCase();
      const normalizedPayload = String(payload).trim();
      const key = `${normalizedType}:${normalizedPayload}`;

      if (seen.has(key)) {
        return '';
      }

      seen.add(key);
      return `[[EMBED:${normalizedType}:${normalizedPayload}]]`;
    },
  );

  return deduped.replace(/\n{3,}/g, '\n\n').trim();
}

