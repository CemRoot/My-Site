# 🚀 Tech News System - Deployment Checklist

## ✅ System Status: READY FOR DEPLOYMENT

### 🎯 Implemented Features
- ✅ Multi-category scraping (7 categories from Nuvemmag)
- ✅ Firecrawl REST API integration (no SDK issues)
- ✅ Groq AI translation (Turkish → English, B2-C1 level)
- ✅ Duplicate prevention (URL hashing)
- ✅ Smart rate limiting (Firecrawl free tier: 10 req/min)
- ✅ Category tagging system
- ✅ Image extraction from articles
- ✅ Source attribution (Nuvemmag + original article)
- ✅ Newsletter subscription system
- ✅ GitHub Actions automation
- ✅ Frontend integration (React Router + shadcn/ui)

---

## 📋 Pre-Deployment Checklist

### 1. Environment Variables

#### Local (.env)
```bash
GROQ_API_KEY=your_groq_key_here
FIRECRAWL_API_KEY=fc-91af995e81b647b4adf3d76455ad99d9
```

#### GitHub Secrets
Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions

Add these secrets:
- `GROQ_API_KEY` → Copy from Vercel (already exists for chatbot)
- `FIRECRAWL_API_KEY` → `fc-91af995e81b647b4adf3d76455ad99d9`

#### Vercel Environment Variables  
Go to: https://vercel.com/YOUR_PROJECT/settings/environment-variables

Add (if not already present):
- `GROQ_API_KEY` → ✅ Already exists
- `FIRECRAWL_API_KEY` → Add: `fc-91af995e81b647b4adf3d76455ad99d9`

---

### 2. Files to Commit

```bash
# Core scraper
scripts/news-scraper.js

# Data storage
public/data/tech-news.json

# Frontend components
src/components/TechNews.tsx
src/components/TechNewsDetail.tsx
src/components/NewsletterSignup.tsx
src/pages/HomePage.tsx
src/App.tsx

# API endpoint
api/newsletter.js

# Config files
.env.example
.gitignore (updated)
package.json (updated)

# Automation
.github/workflows/scrape-tech-news.yml

# Documentation
docs/TECH_NEWS_SETUP.md
README.md (updated)
TECH_NEWS_DEPLOYMENT.md (this file)
```

---

### 3. Deployment Steps

#### Step 1: Commit & Push Changes
```bash
cd /Users/dr.sam/Desktop/My-Site

# Check status
git status

# Add all tech news files
git add .

# Commit
git commit -m "✨ Add Tech News system with multi-category scraping, AI translation, and newsletter"

# Push to GitHub
git push origin main
```

#### Step 2: Add GitHub Secrets
1. Go to GitHub repository settings
2. Navigate to: Settings → Secrets and variables → Actions
3. Add:
   - Name: `FIRECRAWL_API_KEY`
   - Value: `fc-91af995e81b647b4adf3d76455ad99d9`

#### Step 3: Add Vercel Environment Variable
1. Go to Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add:
   - Key: `FIRECRAWL_API_KEY`
   - Value: `fc-91af995e81b647b4adf3d76455ad99d9`
   - Scope: Production, Preview, Development

#### Step 4: Trigger Manual Workflow (Optional)
1. Go to GitHub Actions tab
2. Select "Scrape Tech News" workflow
3. Click "Run workflow" → "Run workflow"
4. Wait ~3-5 minutes for completion

#### Step 5: Verify Vercel Deployment
1. Vercel will auto-deploy when you push to GitHub
2. Check deployment status: https://vercel.com/YOUR_PROJECT/deployments
3. Once deployed, visit: `https://your-site.vercel.app/tech-news`

---

## 🔄 Automated Schedule

### GitHub Actions Schedule
- **Weekdays (Mon-Fri)**: Every 6 hours (08:00, 14:00, 20:00, 02:00 UTC)
- **Weekends (Sat-Sun)**: Every 12 hours (10:00, 22:00 UTC)

### What Happens Automatically?
1. ✅ Scrapes 7 categories from Nuvemmag
2. ✅ Extracts 2 latest articles per category (14 total)
3. ✅ Translates all content to English using Groq AI
4. ✅ Checks for duplicates (skips if already scraped)
5. ✅ Commits changes to GitHub
6. ✅ Vercel auto-deploys updated content

---

## 🧪 Testing

### Local Testing
```bash
# Test scraper manually
npm run scrape:news

# Start dev server
npm run dev

# Visit
http://localhost:5173/tech-news
```

### Production Testing
```bash
# After deployment, visit:
https://your-site.vercel.app/tech-news
https://your-site.vercel.app/tech-news/ARTICLE_ID
```

### Newsletter Testing
1. Go to `/tech-news`
2. Scroll to newsletter form
3. Enter email and submit
4. Check `data/newsletter-subscribers.json` (local only, not committed)

---

## 📊 Rate Limits & Costs

### Firecrawl (Free Tier)
- **Limit**: 10 requests/minute
- **Our usage**: ~8 requests/minute (7s delay between requests)
- **Per run**: 7 categories + 14 articles = ~21 requests
- **Time per run**: ~2-3 minutes

### Groq (Free Tier)
- **Limit**: High (300K tokens/min for developer plan)
- **Our usage**: ~14 translations per run, each ~5K tokens
- **Cost**: FREE

### GitHub Actions
- **Limit**: 2,000 minutes/month (free tier)
- **Our usage**: ~5 min/run × 6 runs/day = 30 min/day = ~900 min/month
- **Cost**: FREE ✅

---

## 🔧 Configuration Adjustments

### Change Scraping Frequency
Edit `.github/workflows/scrape-tech-news.yml`:
```yaml
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours (current: smart schedule)
```

### Change Articles Per Category
Edit `scripts/news-scraper.js`:
```javascript
MAX_ARTICLES_PER_CATEGORY: 2,  // Current: 2 (change to 3, 5, etc.)
```

### Add/Remove Categories
Edit `scripts/news-scraper.js`:
```javascript
CATEGORIES: [
  { name: 'Latest News', url: '...', tag: 'Latest News' },
  // Add more categories here
],
```

---

## 🐛 Troubleshooting

### Issue: Rate Limit Exceeded
**Solution**: Increase `RATE_LIMIT_DELAY` in `scripts/news-scraper.js`:
```javascript
RATE_LIMIT_DELAY: 10000, // 10 seconds instead of 7
```

### Issue: Translation Failing
**Solution**: Check Groq API key in environment variables

### Issue: No New Articles
**Solution**: Normal behavior - duplicate prevention works!
- Check logs: All articles already in database

### Issue: GitHub Actions Failing
**Solutions**:
1. Check secrets are set correctly
2. Check API keys are valid
3. Review workflow logs in GitHub Actions tab

---

## 📖 Documentation

- **Setup Guide**: `docs/TECH_NEWS_SETUP.md`
- **Project README**: `README.md`
- **Environment Example**: `.env.example`

---

## 🎉 Success Criteria

✅ **System is ready when:**
- [ ] All environment variables are set (GitHub + Vercel)
- [ ] Code is committed and pushed to GitHub
- [ ] GitHub Actions workflow runs successfully
- [ ] Vercel deployment completes
- [ ] Tech news page loads at `/tech-news`
- [ ] Newsletter form works
- [ ] Articles are translated and display correctly

---

## 🚀 Quick Deploy Commands

```bash
# 1. Commit everything
git add .
git commit -m "✨ Deploy Tech News system"
git push origin main

# 2. Check GitHub Actions
# Visit: https://github.com/YOUR_REPO/actions

# 3. Check Vercel deployment
# Visit: https://vercel.com/YOUR_PROJECT/deployments

# 4. Test live site
# Visit: https://your-site.vercel.app/tech-news
```

---

## 📞 Support

If issues persist:
1. Check GitHub Actions logs
2. Check Vercel deployment logs  
3. Check browser console for frontend errors
4. Verify all API keys are correct

---

**Last Updated**: October 12, 2025  
**Status**: ✅ READY FOR DEPLOYMENT  
**Next Action**: Add GitHub Secrets → Push to GitHub → Deploy! 🚀

