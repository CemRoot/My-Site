# Social Media Embed Token System

## Overview

This document explains the **token-based embed preservation system** that ensures TikTok, Twitter/X, and YouTube embeds survive the translation pipeline without breaking.

## The Problem

Previously, social media embeds were breaking because:
1. **HTML Mangling**: LLMs would "clean" or escape HTML embed code during translation (converting `>` to `\>`, etc.)
2. **URL Deletion**: The sanitization layer was removing social media URLs
3. **Lost Context**: Markdown conversion would lose the embed structure

Result: Embeds appeared as broken text like "TIKTOK_WIDGET" or view counts

## The Solution: Protected Tokens

We use a **three-stage pipeline** with protected tokens:

### Stage 1: Scraping (HTML → Tokens)
```
HTML Embed → [[EMBED:TYPE:DATA]] Token
```

**File**: `scripts/embeds/extractEmbeds.ts`

Converts HTML embeds to protected tokens:
- `<blockquote class="tiktok-embed">...</blockquote>` → `[[EMBED:TIKTOK:https://tiktok.com/@user/video/123]]`
- `<blockquote class="twitter-tweet">...</blockquote>` → `[[EMBED:TWEET:1876543212345678901]]`
- `<iframe src="youtube.com/embed/abc">` → `[[EMBED:YOUTUBE:abc]]`

### Stage 2: Translation (Tokens Pass Through)
```
[[EMBED:...]] → LLM Translation → [[EMBED:...]] (Unchanged)
```

**Files**: 
- `scripts/translate/prompt.ts` - Instructs LLM to preserve tokens
- `scripts/news-scraper.js` - Uses new prompts

The LLM is explicitly instructed:
> "Keep all [[EMBED:...]] tokens EXACTLY as they appear. Do not modify them."

### Stage 3: Frontend (Tokens → React Components)
```
[[EMBED:TYPE:DATA]] → React Embed Component
```

**Files**:
- `src/components/markdown/SmartMarkdown.tsx` - Detects tokens
- `src/components/embeds/EmbedFromURL.tsx` - Routes to correct component
- `src/components/embeds/{TweetEmbed,TikTokEmbed,YouTubeEmbed}.tsx` - Render embeds

## Token Format

### TikTok
```
[[EMBED:TIKTOK:https://www.tiktok.com/@username/video/1234567890]]
```

### Twitter/X
```
[[EMBED:TWEET:1876543212345678901]]
```

### YouTube
```
[[EMBED:YOUTUBE:dQw4w9WgXcQ]]
```

## Implementation Details

### 1. Scraper Integration

**File**: `scripts/news-scraper.js`

```javascript
import { htmlToTokens } from './embeds/extractEmbeds.js';

// Get both HTML and markdown from Firecrawl
const { markdown, html, metadata } = scrapeResult.data;

// Extract embeds and convert to tokens
if (html) {
  const extracted = htmlToTokens(html);
  const tokens = extracted.contentWithTokens.match(/\[\[EMBED:[^\]]+\]\]/g) || [];
  
  // Add tokens to content
  content = content + '\n\n' + tokens.join('\n\n');
  
  console.log(`Extracted ${tokens.length} embeds:`, extracted.embedCount);
}
```

### 2. Translation Prompt

**File**: `scripts/translate/prompt.ts`

```javascript
export const TRANSLATION_SYSTEM_PROMPT = `
You are a professional translator.

CRITICAL: Any text inside [[EMBED:...]] must be copied EXACTLY.
- DO NOT translate these tokens
- DO NOT add spaces or modify them
- Keep them on their own lines

Examples to preserve:
- [[EMBED:TIKTOK:https://www.tiktok.com/@user/video/123]]
- [[EMBED:TWEET:1876543212345678901]]
- [[EMBED:YOUTUBE:dQw4w9WgXcQ]]
`;
```

### 3. Frontend Detection

**File**: `src/components/markdown/SmartMarkdown.tsx`

```typescript
const TOKEN_REGEX = /^\s*\[\[EMBED:(?:TIKTOK|TWEET|YOUTUBE):.+\]\]\s*$/i;

// In paragraph renderer:
p({ node, children }) {
  const token = maybeEmbedToken(node);
  if (token) {
    return <EmbedFromToken token={token} />;
  }
  // ... normal paragraph rendering
}
```

### 4. Embed Components

**File**: `src/components/embeds/EmbedFromURL.tsx`

```typescript
export function EmbedFromToken({ token }: { token: string }) {
  const match = /^\[\[EMBED:(TIKTOK|TWEET|YOUTUBE):(.+)\]\]$/i.exec(token.trim());
  
  if (!match) return null;
  
  const type = match[1].toUpperCase();
  const payload = match[2];
  
  if (type === 'TWEET') return <TweetEmbed id={payload} />;
  if (type === 'TIKTOK') return <TikTokEmbed url={payload} />;
  if (type === 'YOUTUBE') return <YouTubeEmbed id={payload} />;
  
  return null;
}
```

## Testing

### Test Content

Create an article with embedded social media:

```markdown
October 15, 2025

# Test Article with Embeds

This is a test article.

[[EMBED:TIKTOK:https://www.tiktok.com/@jesstawil/video/7558264080222473485]]

Here's a tweet:

[[EMBED:TWEET:1876543212345678901]]

And a YouTube video:

[[EMBED:YOUTUBE:dQw4w9WgXcQ]]

The end.
```

### Expected Result

The frontend should render:
- ✅ Interactive TikTok video player
- ✅ Embedded tweet card
- ✅ YouTube video player

NOT:
- ❌ Plain text tokens
- ❌ "TIKTOK_WIDGET" placeholders
- ❌ View count links

## Benefits

1. **XSS Safe**: No `dangerouslySetInnerHTML`
2. **Translation Safe**: Tokens survive LLM processing
3. **Type Safe**: TypeScript for all components
4. **Performance**: TikTok script loads once globally
5. **CLS Free**: Aspect-ratio wrappers prevent layout shift
6. **Responsive**: Works on mobile and desktop
7. **Theme Compatible**: Dark/light mode support

## Debugging

### Check if tokens are preserved during translation

```javascript
import { validateTokenPreservation } from './scripts/translate/prompt.js';

const original = "Test [[EMBED:TWEET:123]] content";
const translated = await translateText(original);

const validation = validateTokenPreservation(original, translated);
console.log(validation);
// { valid: true, missingTokens: [], extraTokens: [] }
```

### Check token extraction from HTML

```javascript
import { htmlToTokens } from './scripts/embeds/extractEmbeds.js';

const html = '<blockquote class="tiktok-embed" cite="https://tiktok.com/@user/video/123">';
const result = htmlToTokens(html);

console.log(result.contentWithTokens); // Contains [[EMBED:TIKTOK:...]]
console.log(result.embedCount); // { tiktok: 1, twitter: 0, youtube: 0 }
```

## Extending the System

### Adding Instagram Support

1. **Update extractor** (`scripts/embeds/extractEmbeds.ts`):
```typescript
$('blockquote.instagram-media').each((_, el) => {
  const url = $(el).find('a').attr('href');
  if (url) {
    $(el).replaceWith(`\n\n[[EMBED:INSTAGRAM:${url}]]\n\n`);
    counts.instagram++;
  }
});
```

2. **Create component** (`src/components/embeds/InstagramEmbed.tsx`):
```typescript
export default function InstagramEmbed({ url }: { url: string }) {
  return <div>Instagram embed for {url}</div>;
}
```

3. **Update router** (`src/components/embeds/EmbedFromURL.tsx`):
```typescript
if (type === 'INSTAGRAM') {
  return <InstagramEmbed url={payload} />;
}
```

## Maintenance

### When to Update

- **New social platform**: Add to extractor, create component, update router
- **LLM changes behavior**: Update translation prompt
- **Frontend rendering issues**: Check SmartMarkdown token detection

### Key Files

```
scripts/
├── embeds/
│   └── extractEmbeds.ts      # HTML → Tokens
├── translate/
│   └── prompt.ts              # LLM instructions
└── news-scraper.js            # Main scraping pipeline

src/components/
├── embeds/
│   ├── TweetEmbed.tsx         # Twitter component
│   ├── TikTokEmbed.tsx        # TikTok component
│   ├── YouTubeEmbed.tsx       # YouTube component
│   └── EmbedFromURL.tsx       # Token router
├── markdown/
│   └── SmartMarkdown.tsx      # Token detection
└── TechNewsDetail.tsx         # Article display
```

## Troubleshooting

### Problem: Tokens appear as plain text

**Solution**: Check `SmartMarkdown.tsx` token detection regex

### Problem: Embeds don't render

**Solution**: Check `EmbedFromToken` parsing and routing logic

### Problem: Tokens get translated/mangled

**Solution**: Update translation prompt to be more explicit

### Problem: HTML embeds not extracted

**Solution**: Check Firecrawl format includes `'html'` and `extractEmbeds.ts` selectors

## Migration Guide

### Existing Articles (Legacy)

Old articles with broken widget text will be cleaned up by `sanitizeArticleContent`.

### New Articles (Token-Based)

New articles scraped after this update will use tokens automatically.

### Manual Conversion

To manually convert an article:
1. Find the original source URL
2. Re-scrape using the updated scraper
3. The new version will have proper tokens

## Performance Metrics

- **TikTok Script**: Loads once, ~50KB
- **Twitter Embed**: ~30KB per tweet (lazy loaded)
- **YouTube Embed**: Lazy iframe (no upfront cost)
- **CLS Score**: 0 (aspect-ratio wrappers)

## Security

- ✅ No `dangerouslySetInnerHTML`
- ✅ Token validation before rendering
- ✅ URL sanitization in extractors
- ✅ XSS protection via ReactMarkdown
- ✅ CSP compatible (no inline scripts)

