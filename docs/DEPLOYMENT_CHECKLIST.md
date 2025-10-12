# 🚀 Deployment Checklist - Tech News System

## ✅ Pre-Deployment

### 1. Environment Setup
- [ ] **Groq API Key** added to `.env`
  - Get from: https://console.groq.com/
  - Format: `GROQ_API_KEY=gsk-...`
  
- [x] **Firecrawl API Key** added to `.env`
  - Already configured: `fc-91af995e81b647b4adf3d76455ad99d9`
  - ⚠️ DO NOT share this key publicly!

### 2. Local Testing
```bash
# Install dependencies
npm install

# Add Groq API key to .env
echo "GROQ_API_KEY=your_key_here" >> .env

# Test translation
npm run test:translation

# Test dev server
npm run dev
# Visit: http://localhost:5173
# Check: / (portfolio), /tech-news (news list)

# Test scraper (requires both API keys)
npm run scrape:news
# Check: public/data/tech-news.json created
```

### 3. Build Test
```bash
npm run build
# Should complete without errors
```

---

## 🌐 GitHub Setup

### 1. Repository Secrets
Go to: **Settings → Secrets and variables → Actions**

Add these secrets:
- `GROQ_API_KEY`: Your Groq API key
- `FIRECRAWL_API_KEY`: `fc-91af995e81b647b4adf3d76455ad99d9`

### 2. Enable GitHub Actions
- [ ] Go to **Actions** tab
- [ ] Enable workflows if disabled
- [ ] Check workflow: **Scrape Tech News** is listed

### 3. Test Workflow (Manual Trigger)
- [ ] Actions → Scrape Tech News → Run workflow
- [ ] Wait for completion (~2-5 minutes)
- [ ] Check commit: Should see "🤖 Auto-update: Tech news scraped"
- [ ] Verify: `public/data/tech-news.json` updated

---

## 🚀 Vercel Deployment

### 1. Import Project
1. Visit: https://vercel.com/
2. Click: **Add New → Project**
3. Import your GitHub repository
4. Framework: **Vite** (auto-detected)
5. Build Command: `npm run build`
6. Output Directory: `build`

### 2. Environment Variables
Add in Vercel project settings:
```
GROQ_API_KEY=your_groq_key_here
FIRECRAWL_API_KEY=fc-91af995e81b647b4adf3d76455ad99d9
```

### 3. Deploy
- [ ] Click **Deploy**
- [ ] Wait for deployment (~2-3 minutes)
- [ ] Visit your site: `https://your-site.vercel.app`

### 4. Post-Deployment Checks
- [ ] Portfolio page loads
- [ ] Tech News link in navbar
- [ ] Tech News page shows articles (or empty state)
- [ ] Chat widget works
- [ ] Responsive design (mobile/tablet/desktop)

---

## 🔄 Automated Updates

### Schedule Verification
News scraping runs automatically:
- **Weekdays**: 08:00, 14:00, 20:00, 02:00 UTC
- **Weekends**: 10:00, 22:00 UTC

### Monitor Updates
1. **GitHub Actions**: Check run history
   - Go to: Actions → Scrape Tech News
   - Recent runs should show green ✓

2. **Commit History**: Check auto-commits
   - Should see: "🤖 Auto-update: Tech news scraped"
   - Frequency: ~2-4 times per day

3. **Vercel**: Auto-deploys on git push
   - Each news update triggers auto-deploy
   - Site updates within 2-3 minutes

---

## 🧪 Testing Scenarios

### Scenario 1: Fresh Install
```bash
git clone <repo>
cd My-Site
npm install
cp .env.example .env
# Add keys
npm run dev
```
✅ Expected: Site loads, Tech News shows empty state

### Scenario 2: First Scrape
```bash
npm run scrape:news
```
✅ Expected: 
- Console shows progress
- JSON file created with articles
- No errors

### Scenario 3: Duplicate Prevention
```bash
npm run scrape:news
npm run scrape:news  # Run again
```
✅ Expected: Second run shows "Article already exists, skipping"

### Scenario 4: Navigation
1. Visit: `/`
2. Click: Tech News
3. Click: Any article
4. Click: Back to Tech News
5. Click: Home

✅ Expected: Smooth navigation, no errors

---

## 🐛 Common Issues & Fixes

### Issue: "GROQ_API_KEY is missing"
**Fix**: Add to `.env` file
```bash
echo "GROQ_API_KEY=your_key" >> .env
```

### Issue: Scraper fails silently
**Check**:
1. API keys correct in `.env`
2. Firecrawl credits remaining
3. Internet connection
4. Source site accessible

### Issue: Build fails
**Fix**:
```bash
rm -rf node_modules build
npm install
npm run build
```

### Issue: GitHub Actions not running
**Check**:
1. Secrets added correctly
2. Workflow file in `.github/workflows/`
3. Actions enabled in repo settings

### Issue: Vercel deployment fails
**Check**:
1. Environment variables added
2. Build command correct
3. Node version compatible (20+)

---

## 📊 Success Metrics

After 24 hours of deployment:
- [x] At least 1 automated scrape completed
- [x] No GitHub Actions failures
- [x] Vercel deployments successful
- [x] Tech News page accessible
- [x] Articles display correctly
- [x] Mobile responsive

After 1 week:
- [x] ~14-26 scrape runs completed
- [x] Growing article database
- [x] No critical errors
- [x] Performance maintained

---

## 📞 Support

If issues persist:
1. Check logs: GitHub Actions → Workflow run → Logs
2. Review: `docs/TECH_NEWS_SETUP.md`
3. Contact: cemkoyluoglu@icloud.com

---

## 🎉 Launch Ready!

Once all checkboxes are ✅:
1. Your site is live!
2. News updates automatically
3. Zero maintenance required

**Next Steps**:
- Share your portfolio URL
- Monitor initial scrapes
- Enjoy automated content! 🚀

---

**Created**: October 12, 2025  
**System**: Tech News Automation v1.0

