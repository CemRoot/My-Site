# Content Cleaning Pipeline - Complete Guide

## Overview
This document explains the complete content cleaning pipeline in `scripts/lib/scraper/ScrapeOrchestrator.js` (CLI entrypoint: `scripts/news-scraper.js`) to ensure NO unwanted content appears in articles.

## Pipeline Steps (In Order)

### STEP 0: Header/Navigation Removal ✂️
**Purpose:** Remove everything BEFORE the actual article content
**Location:** Lines 464-487

```javascript
// Find and remove everything up to and including date (dd/mm/yyyy)
// This removes:
// - Logo/branding links
// - Navigation menu
// - Category links
// - Date line
```

**Pattern:** `/\d{1,2}\/\d{1,2}\/\d{4}/`

**Why First?** Must run BEFORE embed extraction to avoid extracting navigation YouTube channels (@Nuvem_tv)

---

### STEP 1: Tweet ID Extraction from HTML 🐦
**Purpose:** Handle dynamic Twitter embeds that Firecrawl can't scrape
**Location:** Lines 495-506

```javascript
// Extract tweet IDs from HTML source
// Store for later use in "Twitter Widget Iframe" replacement
```

**Pattern:** `/(?:twitter|x)\.com\/[^\/]+\/status\/(\d+)/gi`

**Use Case:** Embedly-wrapped Twitter iframes

---

### STEP 2: Markdown Embed Extraction 🎬
**Purpose:** Convert markdown social media links to tokens
**Location:** Lines 508-510

```javascript
// Firecrawl often returns iframes as markdown links
// [Title](youtube.com/watch?v=ID) → [[EMBED:YOUTUBE:ID]]
```

**Handles:**
- YouTube watch links
- YouTube shorts
- YouTube youtu.be links
- TikTok video links
- Twitter status links

**Module:** `extractAllEmbedsFromMarkdown()`

---

### STEP 3: HTML Embed Extraction 🖼️
**Purpose:** Convert HTML iframes/blockquotes to tokens
**Location:** Lines 512-553

```javascript
// Extract embeds from HTML and inject into markdown
// Replaces blockquotes with tokens at correct positions
```

**Handles:**
- TikTok blockquotes
- Twitter blockquotes
- Embedly CDN iframes (Twitter)
- YouTube iframes

**Module:** `htmlToTokens()`

---

### STEP 4: Image Removal 🖼️❌
**Purpose:** Remove ALL markdown images
**Location:** Line 556

```javascript
// Featured image already stored separately
// Remove all ![alt](url) patterns
```

---

### STEP 5: Branding Removal 🏷️❌
**Purpose:** Remove Nuvemmag logo and branding
**Location:** Lines 558-562

```javascript
// Remove:
// - Linked logo images
// - HTML anchor tags with branding
// - NuvemMag-Logo references
```

---

### STEP 6: URL Cleanup 🔗
**Purpose:** Remove "Kaynak:" lines and remaining Nuvemmag URLs
**Location:** Lines 564-570

```javascript
// Remove:
// - "Kaynak: [URL]" lines
// - Markdown links to nuvemmag.com
// - Plain nuvemmag.com URLs
```

---

### STEP 7: LINE-BY-LINE AGGRESSIVE CLEANING 🧹
**Purpose:** Remove ALL navigation, footer, and UI text
**Location:** Lines 572-688

#### 7.1 Section Skipping
Skip "İlginizi Çekebilir" and "Kategoriler" sections entirely

#### 7.2 YouTube UI Text Filtering (CRITICAL) 📺
```javascript
// After [[EMBED:YOUTUBE:...]] token:
// Skip next 15 lines (contains UI text)

// Also filter individual lines:
// - "Info", "Share", "Subscribe", "Watch later", "Copy link"
// - "19.4K subscribers", "1M subscribers"
// - "1.2M views"
// - "Introducing X - YouTube"
// - Channel URLs (youtube.com/@)
// - Embed tracking params
```

#### 7.3 Twitter Widget Replacement 🐦
```javascript
// "Twitter Widget Iframe" → [[EMBED:TWEET:ID]]
// Uses tweet IDs extracted in Step 1
```

#### 7.4 Navigation/Footer/Category Filtering 📋
**Removed Text:**
- Ana Sayfa
- Ana SayfaEn
- En Son Haberler
- Çiçek ile Teknoloji
- Yapay Zeka Uygulamaları
- Yapay Zeka (short)
- Teknoloji (short)
- Sürdürülebilirlik
- Bilim ve Dünya
- Gündem (short)
- Kurumsal
- Hakkımızda
- Künye
- İletişim
- Aydınlatma
- Çerez Politikası
- Kişisel Verilerin Korunması
- Pinetent Digital
- Tüm Hakları Saklıdır
- ©202X (copyright)

**Removed URLs:**
- instagram.com (unless embed)
- twitter.com (unless embed)
- linkedin.com
- youtube.com/@ (channels)
- x.com/Nuvemmag
- facebook.com
- post-category
- cdn.prod.website-files.com

**Removed Patterns:**
- Date lines (dd/mm/yyyy)
- Empty markdown links []()
- Nuvemmag domain URLs

#### 7.5 Short Name Filtering 👤
```javascript
// Skip lines with 1-3 words if:
// - No punctuation
// - Not an embed token
// - Not a heading (#)
// - Not bold (**)
// - Previous line doesn't end with punctuation

// Example: "FBR" (company name)
```

---

### STEP 8: Whitespace Cleanup 🧼
**Purpose:** Clean up excessive whitespace
**Location:** Lines 691-696

```javascript
// - Replace 3+ newlines with 2
// - Remove trailing spaces
// - Remove blank lines
// - Trim final output
```

---

## YouTube UI Text - Complete List

### Patterns to Remove
1. **UI Buttons**
   - Info
   - Share
   - Subscribe
   - Watch later
   - Copy link
   - Report
   - Playlist

2. **Metrics**
   - X subscribers (e.g., "19.4K subscribers")
   - X views (e.g., "1.2M views")

3. **URLs**
   - youtube.com/channel/...
   - youtube.com/@username (CHANNELS, not videos!)
   - embeds_referring_euri parameters

4. **Metadata**
   - "Introducing X - YouTube"
   - "Photo image of..."
   - "Video thumbnail..."
   - "Uploaded by..."

5. **Skip Lines**
   - After YouTube embed: skip next 15 lines

---

## Header/Navigation - Complete List

### Removed at Step 0
- Logo images
- Navigation menu
- Category links (e.g., "Yapay Zeka")
- Date (dd/mm/yyyy)

### Removed at Step 7 (Fallback)
All Turkish navigation terms:
- Ana Sayfa / Ana SayfaEn
- En Son Haberler
- Teknoloji categories
- Footer links

---

## Twitter Handling

### Dynamic Embeds (Embedly)
1. Extract tweet ID from HTML (Step 1)
2. Find "Twitter Widget Iframe" placeholder (Step 7.3)
3. Replace with `[[EMBED:TWEET:ID]]`

### Static Embeds
1. Extract from blockquote (Step 3)
2. Replace blockquote with token

---

## TikTok Handling

### Blockquote Method
1. Find blockquote.tiktok-embed in HTML
2. Extract URL
3. Replace with `[[EMBED:TIKTOK:URL]]`

### Markdown Method
1. Find [Text](tiktok.com/...) in markdown
2. Extract URL
3. Replace with token

---

## YouTube Handling (CRITICAL)

### Markdown Links (Primary Method)
```javascript
// [Title](youtube.com/watch?v=ID) → [[EMBED:YOUTUBE:ID]]
// [Title](youtu.be/ID) → [[EMBED:YOUTUBE:ID]]
// [Title](youtube.com/shorts/ID) → [[EMBED:YOUTUBE:ID]]
```

### HTML Iframes (Secondary)
```javascript
// <iframe src="youtube.com/embed/ID"> → [[EMBED:YOUTUBE:ID]]
```

### Channel Links (EXCLUDED)
```javascript
// youtube.com/@username → SKIPPED (not embedded)
```

### UI Text Cleanup
After embed token, skip 15 lines to remove:
- Video title
- Channel name
- Subscriber count
- UI buttons

---

## Quality Validation

### Automatic Check (After Translation)
```javascript
assertContentQuality(translatedArticle);
// Throws error if validation fails
// Article is NOT saved to DB
```

### Validation Rules
See `validation/README.md` for complete list

---

## Testing

### Run Validation Tests
```bash
node scripts/test-content-validation.js
```

### Scrape Single Article (Test)
```bash
# Create a test script:
node scripts/scrape-single-article.js
```

---

## Troubleshooting

### Issue: Header links still appearing
**Check:** Step 0 date pattern regex
**Fix:** Update `datePattern` if date format changed

### Issue: YouTube UI text in content
**Check:** `skipYouTubeUILines` count (currently 15)
**Fix:** Increase count or add more patterns to Step 7.2

### Issue: Wrong YouTube video (Rick Roll)
**Check:** `extractMarkdownEmbeds.js` patterns
**Fix:** Ensure correct video ID extraction, not channel

### Issue: Navigation text in middle of article
**Check:** Step 7.4 patterns
**Fix:** Add new pattern to navigation filter

---

## Maintenance Checklist

When updating the pipeline:
1. ✅ Update code in news-scraper.js
2. ✅ Add test case to test-content-validation.js
3. ✅ Run validation tests
4. ✅ Update this guide
5. ✅ Test on a real article
6. ✅ Deploy to production

---

## Pipeline Summary

```
┌─────────────────────────────────────────────────────┐
│ 1. Scrape HTML + Markdown from Firecrawl            │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ STEP 0: Remove Header/Navigation (up to date)       │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ STEP 1: Extract Tweet IDs from HTML                 │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ STEP 2: Extract Embeds from Markdown Links          │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ STEP 3: Extract Embeds from HTML Iframes            │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ STEP 4-6: Remove Images, Branding, URLs             │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ STEP 7: Line-by-Line Aggressive Cleaning            │
│   - YouTube UI text (skip 15 lines)                 │
│   - Navigation/footer/category                       │
│   - Twitter Widget → Token                           │
│   - Short names                                      │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ STEP 8: Whitespace Cleanup                          │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ Translate with Groq AI                               │
│ (Tokens preserved via system prompt)                │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ Quality Validation                                   │
│ (Reject if any critical errors)                     │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ Save to Database ✅                                  │
└─────────────────────────────────────────────────────┘
```

---

## Key Principles

1. **Order Matters** - Each step depends on previous steps
2. **Header First** - Remove navigation BEFORE embed extraction
3. **YouTube Critical** - Most complex, needs aggressive cleaning
4. **Quality Gate** - Validation prevents bad articles from reaching DB
5. **Token Preservation** - Embeds survive translation unchanged
6. **Fail Fast** - Reject articles with critical issues immediately

---

## Success Metrics

After implementing this pipeline:
- ✅ 0 header/navigation links in content
- ✅ 0 YouTube UI text in content
- ✅ 0 Rick Roll videos (wrong video IDs)
- ✅ 0 translation instruction leakage
- ✅ 0 Nuvemmag branding in content
- ✅ 100% correct embed rendering
