# 🚀 Supabase Migration Guide
## Tech News: JSON → PostgreSQL

This guide will help you migrate your tech news system from JSON file storage to Supabase PostgreSQL.

---

## 📋 Prerequisites

- ✅ Supabase account (free tier works perfectly)
- ✅ Existing tech news in `public/data/tech-news.json`
- ✅ Node.js installed

---

## 🎯 Step 1: Create Supabase Project

### 1.1 Sign Up / Log In
- Go to: https://supabase.com
- Create a free account or log in

### 1.2 Create New Project
```
1. Click "New Project"
2. Choose organization
3. Project Settings:
   - Name: my-site-tech-news (or your choice)
   - Database Password: [Generate strong password - SAVE THIS!]
   - Region: Choose closest to your users
   - Pricing Plan: Free (perfect for this use case)
4. Click "Create new project"
5. Wait 2-3 minutes for database provisioning
```

---

## 🗄️ Step 2: Create Database Schema

### 2.1 Open SQL Editor
```
1. In Supabase Dashboard → Click "SQL Editor" (left sidebar)
2. Click "New query"
```

### 2.2 Run Schema Creation Script
```sql
-- Copy entire contents of: docs/tech-news-schema.sql
-- Paste into SQL Editor
-- Click "Run" button
```

✅ **Expected Result:** "Success. No rows returned"

### 2.3 Verify Table Creation
```
1. Click "Table Editor" (left sidebar)
2. You should see "tech_news_articles" table
3. Columns: id, title, description, content, image_url, date, category, etc.
```

---

## 🔑 Step 3: Get API Credentials

### 3.1 Find Your Credentials
```
1. Go to: Project Settings → API (left sidebar)
2. You'll need two values:
```

**Copy These Values:**

#### A) Project URL
```
Location: "Project URL" section
Example: https://abc123xyz.supabase.co
```

#### B) Anon Public Key
```
Location: "Project API keys" section → "anon public"
Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### C) Service Role Key (Secret!)
```
Location: "Project API keys" section → "service_role"
⚠️ IMPORTANT: This is a SECRET key - never commit to git!
Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🔐 Step 4: Update Environment Variables

### 4.1 Local Development (.env file)
```bash
# Add to your .env file (create if doesn't exist):

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Existing keys (keep these)
GROQ_API_KEY=your_groq_key
FIRECRAWL_API_KEY=your_firecrawl_key
```

### 4.2 GitHub Secrets (for CI/CD)
```
1. Go to: GitHub Repository → Settings → Secrets and variables → Actions
2. Click "New repository secret" for each:

Secret 1:
Name: NEXT_PUBLIC_SUPABASE_URL
Value: [Your Project URL]

Secret 2:
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [Your Anon Public Key]

Secret 3:
Name: SUPABASE_SERVICE_ROLE_KEY
Value: [Your Service Role Key]
```

### 4.3 Vercel Environment Variables
```
1. Go to: Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add three variables (same as above)
3. Select: Production, Preview, Development (all environments)
4. Click "Save"
```

---

## 📦 Step 5: Run Migration

### 5.1 Install Dependencies (if needed)
```bash
npm install @supabase/supabase-js
```

### 5.2 Run Migration Script
```bash
npm run migrate:supabase
```

### 5.3 Expected Output
```
🚀 Starting Migration: JSON → Supabase
============================================================
📂 Reading JSON file: public/data/tech-news.json
📊 Found 25 articles to migrate
💾 Current Supabase database: 0 articles
============================================================

[1/25] Processing...
✅ Migrated: AI Applications: New breakthrough in...
[2/25] Processing...
✅ Migrated: Latest News: Tech industry trends...
...

============================================================
🎉 Migration Completed!

✅ Successfully migrated: 25
⏭️  Skipped (duplicates):  0
❌ Failed:                0
📊 Total in database:     25
============================================================
```

---

## ✅ Step 6: Verify Migration

### 6.1 Check Supabase Dashboard
```
1. Go to: Table Editor → tech_news_articles
2. You should see all your articles
3. Check sample rows for correct data
```

### 6.2 Test API Endpoint Locally
```bash
# Start dev server
npm run dev

# In browser, visit:
http://localhost:5173/api/tech-news

# Expected: JSON response with articles
```

### 6.3 Test Frontend
```
1. Go to: http://localhost:5173/tech-news
2. Articles should load from Supabase
3. Click an article → Detail page should work
4. Pagination should work (20 articles per page)
```

---

## 🚀 Step 7: Deploy to Production

### 7.1 Commit Changes
```bash
git add .
git commit -m "feat: Migrate tech news to Supabase PostgreSQL"
git push origin main
```

### 7.2 Vercel Auto-Deploy
```
1. Vercel will automatically deploy
2. Wait ~2-3 minutes
3. Visit your production site
4. Test /tech-news page
```

### 7.3 Update GitHub Actions (Scraper)
Your scraper workflow will now save to Supabase automatically!
No changes needed - it uses the same environment variables.

---

## 🎯 What Changed?

### Before (JSON):
```
User → Website → public/data/tech-news.json
Scraper → JSON file
Limitations: Static, slow with many articles
```

### After (Supabase):
```
User → Website → API → Supabase PostgreSQL
Scraper → Supabase PostgreSQL
Benefits: Dynamic, fast, scalable, queryable
```

---

## 🔧 Troubleshooting

### Migration Script Fails
```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# If empty, reload .env
source .env  # Linux/Mac
```

### API Returns 404
```
1. Check Vercel environment variables are set
2. Redeploy: Vercel Dashboard → Deployments → Redeploy
```

### Articles Not Loading
```
1. Check browser console for errors
2. Check network tab: /api/tech-news should return 200
3. Verify Supabase RLS policies are created (schema.sql)
```

### Duplicate Articles
```sql
-- In Supabase SQL Editor, check for duplicates:
SELECT source_url, COUNT(*) as count
FROM tech_news_articles
GROUP BY source_url
HAVING COUNT(*) > 1;

-- Delete duplicates (keep newest):
DELETE FROM tech_news_articles a
USING tech_news_articles b
WHERE a.id < b.id
AND a.source_url = b.source_url;
```

---

## 📊 Database Management

### View All Articles
```sql
SELECT id, title, category, date, views
FROM tech_news_articles
ORDER BY date DESC
LIMIT 10;
```

### Get Statistics
```sql
-- Articles per category
SELECT category, COUNT(*) as count
FROM tech_news_articles
GROUP BY category
ORDER BY count DESC;

-- Most viewed articles
SELECT title, views, category
FROM tech_news_articles
ORDER BY views DESC
LIMIT 10;
```

### Delete Old Articles (>90 days)
```sql
DELETE FROM tech_news_articles
WHERE date < NOW() - INTERVAL '90 days';
```

---

## 🎉 Benefits of Supabase

✅ **Performance:** Much faster than JSON file reading  
✅ **Scalability:** Handle 1000s of articles easily  
✅ **Filtering:** Category, date, search - all server-side  
✅ **Analytics:** View counts, popular articles  
✅ **Real-time:** Instant updates when scraper runs  
✅ **Backup:** Automatic daily backups  
✅ **Security:** Row Level Security (RLS) policies  
✅ **Free Tier:** 500 MB database, 2 GB bandwidth/month  

---

## 📞 Support

- **Supabase Docs:** https://supabase.com/docs
- **GitHub Issues:** Create issue in your repo
- **Supabase Discord:** https://discord.supabase.com

---

## ✨ Next Steps (Optional Enhancements)

1. **Search Functionality:** Full-text search using PostgreSQL
2. **View Counter:** Track popular articles
3. **Comments System:** Using Supabase real-time
4. **Bookmarks:** Save favorite articles
5. **RSS Feed:** Generate from database
6. **Email Digest:** Weekly newsletter from database

---

**Congratulations! Your tech news is now powered by Supabase! 🎉**

