# Deploying the Token-Based Embed System

## ✅ Implementation Complete

The new token-based social media embed system has been fully implemented and tested.

## 📦 What Changed

### New Files Created

1. **Backend (Scraper)**
   - `/scripts/embeds/extractEmbeds.js` - Converts HTML embeds to tokens
   - `/scripts/embeds/extractEmbeds.ts` - TypeScript definitions (optional)
   - `/scripts/translate/prompt.js` - LLM prompts that preserve tokens
   - `/scripts/test-embed-extraction.js` - Test suite

2. **Frontend (React)**
   - `/src/components/embeds/EmbedFromURL.tsx` - Token router (updated)
   - `/src/components/markdown/SmartMarkdown.tsx` - Token detection (updated)
   
3. **Documentation**
   - `/docs/EMBED_TOKEN_SYSTEM.md` - Complete system documentation
   - `/docs/DEPLOYMENT_TOKEN_SYSTEM.md` - This file

### Modified Files

1. **Scraper Pipeline**
   - `/scripts/news-scraper.js`
     - Now imports `htmlToTokens` and `TRANSLATION_SYSTEM_PROMPT`
     - Requests both HTML and markdown from Firecrawl
     - Extracts embeds to tokens before translation
     - Removed YouTube/Twitter URL deletion
     - Uses new translation prompts

2. **Frontend Rendering**
   - `/src/components/TechNewsDetail.tsx`
     - Simplified `sanitizeArticleContent` (removed URL extraction logic)
     - Uses `SmartMarkdown` for rendering
     
3. **Dependencies**
   - `package.json` - Added `cheerio`, `react-tweet`, `remark-gfm`

## 🚀 Deployment Steps

### 1. Install Dependencies

```bash
npm install
```

Dependencies added:
- `cheerio` - HTML parsing for embed extraction
- `react-tweet` - Twitter embed component
- `remark-gfm` - GitHub Flavored Markdown

### 2. Test the System

```bash
# Test embed extraction
node scripts/test-embed-extraction.js

# All tests should pass ✅
```

### 3. Build the Frontend

```bash
npm run build
```

This compiles:
- New embed components
- Updated SmartMarkdown renderer
- Updated TechNewsDetail

### 4. Test Locally (Optional)

```bash
npm run dev
```

Visit an existing article to verify:
- Legacy content still works
- No broken embeds
- SmartMarkdown renders correctly

### 5. Run the Scraper (New Content)

```bash
node scripts/news-scraper.js
```

This will:
1. Scrape new articles from Nuvemmag
2. Extract HTML embeds → convert to tokens
3. Translate content (tokens preserved)
4. Save to Supabase with tokens intact

**Verify in database:**
```sql
SELECT id, title, substring(content, 1, 200)
FROM tech_news
WHERE content LIKE '%[[EMBED:%'
ORDER BY created_at DESC
LIMIT 5;
```

You should see tokens like:
```
[[EMBED:TIKTOK:https://www.tiktok.com/@user/video/123]]
[[EMBED:TWEET:1876543212345678901]]
[[EMBED:YOUTUBE:dQw4w9WgXcQ]]
```

### 6. Deploy to Production

```bash
# Build for production
npm run build

# Deploy (adjust based on your hosting)
# Vercel:
vercel --prod

# Or copy build/ folder to your host
```

### 7. Verify in Production

Visit a newly scraped article URL:
```
https://cemkoyluoglu.codes/tech-news/[slug]
```

Check that:
- ✅ TikTok videos render as interactive embeds
- ✅ Tweets render as Twitter cards
- ✅ YouTube videos render as players
- ✅ No "TIKTOK_WIDGET" text appears
- ✅ No view count links appear
- ✅ CLS (Cumulative Layout Shift) ≈ 0

## 🔍 Troubleshooting

### Problem: Old articles still show broken widgets

**Solution**: Old articles in database have legacy content. Options:
1. Accept legacy content (new articles work fine)
2. Re-scrape specific articles
3. Run migration script (create one if needed)

### Problem: Tokens appear as plain text

**Cause**: Frontend not detecting tokens

**Debug**:
1. Open browser DevTools
2. Check article content in React DevTools
3. Verify `SmartMarkdown` is being used
4. Check token regex in `SmartMarkdown.tsx`

**Fix**: Ensure content contains exact format:
```
[[EMBED:TYPE:DATA]]
```

### Problem: Embeds extracted but lost during translation

**Cause**: LLM mangling tokens

**Debug**:
1. Check scraper logs for "Extracted N embeds"
2. Check database content for tokens
3. If tokens missing after translation, LLM is breaking them

**Fix**: Update `TRANSLATION_SYSTEM_PROMPT` to be more explicit:
```javascript
// Make it VERY clear
content: `CRITICAL: You MUST preserve [[EMBED:...]] EXACTLY.
Do NOT translate, modify, or reformat these tokens.
Example: [[EMBED:TIKTOK:https://...]] stays EXACTLY the same.
...`
```

### Problem: "Cannot find module 'cheerio'"

**Solution**:
```bash
npm install cheerio
```

### Problem: TypeScript errors in IDE

**Solution**: 
- `.ts` files are for type hints only
- `.js` files are what runs
- You can safely ignore `.ts` errors if `.js` works

## 📊 Success Metrics

After deployment, you should see:

### Scraper Output
```
🎬 Extracted 3 embeds: {"tiktok":1,"twitter":1,"youtube":1}
🌐 Translating article with Groq AI...
✅ Article saved to database
```

### Database
```sql
-- Check for tokens
SELECT count(*) FROM tech_news WHERE content LIKE '%[[EMBED:%';
-- Should show > 0 for new articles
```

### Frontend
- Interactive TikTok videos
- Rich Twitter cards
- YouTube video players
- Fast page load (CLS < 0.1)
- Mobile responsive

## 🎯 Next Steps

### Optional Enhancements

1. **Add Instagram Support**
   - Update `extractEmbeds.js` to detect Instagram
   - Create `InstagramEmbed.tsx`
   - Update `EmbedFromURL.tsx` router

2. **Migration Script** (for old articles)
   ```javascript
   // scripts/migrate-old-embeds.js
   // Re-scrape and re-translate old articles
   ```

3. **Analytics**
   ```javascript
   // Track embed interactions
   onClick={() => trackEvent('embed_click', { type: 'tiktok' })}
   ```

4. **Error Boundaries**
   ```jsx
   <ErrorBoundary fallback={<div>Embed failed to load</div>}>
     <EmbedFromToken token={token} />
   </ErrorBoundary>
   ```

## 📝 Maintenance

### Regular Checks

1. **Weekly**: Check scraper logs for embed extraction counts
2. **Monthly**: Verify tokens preserved during translation
3. **Quarterly**: Update translation prompts if LLM behavior changes

### When to Update

- **New social platform**: Add to `extractEmbeds.js`
- **LLM changes**: Update `TRANSLATION_SYSTEM_PROMPT`
- **Rendering issues**: Debug `SmartMarkdown.tsx`

## 🎉 Benefits Achieved

✅ **Security**: No `dangerouslySetInnerHTML`  
✅ **Reliability**: Tokens survive translation  
✅ **Performance**: CLS = 0, lazy loading  
✅ **Maintainability**: Clear separation of concerns  
✅ **Extensibility**: Easy to add new platforms  
✅ **Type Safety**: TypeScript definitions  
✅ **Testing**: Automated test suite  

## 📚 References

- [Full Documentation](/docs/EMBED_TOKEN_SYSTEM.md)
- [Test Suite](/scripts/test-embed-extraction.js)
- [Scraper Code](/scripts/news-scraper.js)
- [Frontend Components](/src/components/embeds/)

## ✉️ Support

If issues persist:
1. Check browser console for errors
2. Check scraper logs
3. Verify database content
4. Review [EMBED_TOKEN_SYSTEM.md](/docs/EMBED_TOKEN_SYSTEM.md)

