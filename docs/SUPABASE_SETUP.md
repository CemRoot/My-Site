# 🗄️ Supabase Newsletter Setup Guide

## ✅ Quick Setup (5 minutes)

### Step 1: Run SQL Schema in Supabase

1. **Open Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard
   - Or click "Open in Supabase" in Vercel

2. **Navigate to SQL Editor:**
   - Left sidebar → Click "SQL Editor"
   - Or direct link: https://supabase.com/dashboard/project/egehpwmjvvabyvfilehd/sql

3. **Create Newsletter Table:**
   - Click "New Query"
   - Copy entire content from `supabase-schema.sql`
   - Paste into SQL Editor
   - Click "Run" (or press Ctrl+Enter)

4. **Verify Success:**
   You should see output like:
   ```
   Success. No rows returned
   ```

---

### Step 2: Verify Table Created

Run this query in SQL Editor:

```sql
SELECT * FROM newsletter_subscribers;
```

Expected: Empty table (0 rows) - This is correct! ✅

---

### Step 3: Test Subscription

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Visit:**
   ```
   http://localhost:3000/tech-news
   ```

3. **Scroll to newsletter form**
   - Enter your email
   - Click "Subscribe"
   - Should see success message

4. **Check Supabase:**
   - Go to Table Editor → `newsletter_subscribers`
   - Your email should appear! 🎉

---

## 🔒 Security Features (Already Configured)

### Row Level Security (RLS)

✅ **Public (Anonymous Users):**
- ✅ Can INSERT (subscribe)
- ❌ Cannot SELECT (read emails)
- ❌ Cannot UPDATE
- ❌ Cannot DELETE

✅ **Admin (Authenticated):**
- ✅ Can SELECT (view all subscribers)
- ✅ Can UPDATE (change status)
- ✅ Can DELETE (remove subscribers)

**This means:**
- ✅ Users can subscribe
- ✅ Nobody can see other people's emails
- ✅ Only YOU (admin) can view subscriber list
- ✅ GDPR compliant!

---

## 📊 View Subscribers (Admin Only)

### Option 1: Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/egehpwmjvvabyvfilehd/editor
2. Click "newsletter_subscribers" table
3. View all subscribers

### Option 2: SQL Query

```sql
-- Get all active subscribers
SELECT 
  email,
  subscribed_at,
  source,
  status
FROM newsletter_subscribers
WHERE status = 'active'
ORDER BY subscribed_at DESC;
```

### Option 3: Export to CSV

```sql
-- Copy this result to CSV
SELECT 
  email,
  subscribed_at
FROM newsletter_subscribers
WHERE status = 'active'
ORDER BY subscribed_at DESC;
```

Then click "Download" button in Supabase UI.

---

## 🎯 Useful SQL Queries

### Get Subscriber Count

```sql
SELECT 
  status,
  COUNT(*) as count
FROM newsletter_subscribers
GROUP BY status;
```

### Recent Subscribers (Last 7 days)

```sql
SELECT 
  email,
  subscribed_at,
  source
FROM newsletter_subscribers
WHERE subscribed_at >= NOW() - INTERVAL '7 days'
ORDER BY subscribed_at DESC;
```

### Unsubscribe an Email

```sql
UPDATE newsletter_subscribers
SET status = 'unsubscribed'
WHERE email = 'user@example.com';
```

### Delete a Subscriber (GDPR Right to be Forgotten)

```sql
DELETE FROM newsletter_subscribers
WHERE email = 'user@example.com';
```

---

## 🌍 Environment Variables

### Local (.env)

Already configured! ✅

```env
NEXT_PUBLIC_SUPABASE_URL=https://egehpwmjvvabyvfilehd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...
```

### Vercel (Production)

**ALREADY SET BY VERCEL!** ✅

When you created Supabase from Vercel, it automatically added:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

No manual setup needed!

### GitHub Actions

Add to GitHub Secrets:

1. Go to: https://github.com/YOUR_REPO/settings/secrets/actions
2. Add these secrets:
   - `SUPABASE_SERVICE_ROLE_KEY` (from .env)
   - `NEXT_PUBLIC_SUPABASE_URL` (from .env)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from .env)

---

## 🚀 Deployment Checklist

- [x] ✅ Supabase created in Vercel
- [x] ✅ Environment variables configured
- [x] ✅ `supabase-schema.sql` created
- [ ] ⏳ **Run SQL schema in Supabase** (YOU NEED TO DO THIS!)
- [ ] ⏳ Test locally
- [ ] ⏳ Commit & push to GitHub
- [ ] ⏳ Vercel auto-deploys
- [ ] ⏳ Test on live site

---

## 🐛 Troubleshooting

### "Failed to subscribe" Error

**Check:**
1. SQL schema ran successfully?
   ```sql
   SELECT * FROM newsletter_subscribers;
   ```
   Should return empty table, not error

2. RLS policies created?
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'newsletter_subscribers';
   ```
   Should show 5 policies

3. Environment variables set?
   - Check `.env` file locally
   - Check Vercel dashboard for production

### "Email already subscribed" Error

**This is normal!** The email is already in database.

To test again:
```sql
DELETE FROM newsletter_subscribers WHERE email = 'your-test@email.com';
```

### Can't see subscribers in Supabase Dashboard

**This is expected!** RLS prevents anonymous access.

**Solution:** Log in to Supabase dashboard as admin to view.

---

## 📈 Database Limits (Free Tier)

- ✅ **500 MB** database size
- ✅ **50,000 MAU** (Monthly Active Users)
- ✅ **Unlimited API requests**
- ✅ **5 GB egress** (bandwidth)

**For newsletter:**
- Each email = ~200 bytes
- 500 MB = ~2.5 million emails!
- You're SAFE! ✅

---

## 🔐 Privacy & GDPR Compliance

### Data Stored:
- ✅ Email address
- ✅ Subscription timestamp
- ✅ Source (website)
- ✅ IP address (for fraud detection)
- ✅ User agent (for analytics)

### Security Measures:
- ✅ Row Level Security (RLS)
- ✅ HTTPS encryption
- ✅ EU region (Dublin, Ireland)
- ✅ Supabase is GDPR compliant

### User Rights:
- ✅ Right to access (SQL query)
- ✅ Right to erasure (DELETE query)
- ✅ Right to unsubscribe (UPDATE status)

Already covered in Privacy Policy! ✅

---

## 📞 Support

- **Supabase Docs:** https://supabase.com/docs
- **Supabase Status:** https://status.supabase.com/
- **Dashboard:** https://supabase.com/dashboard/project/egehpwmjvvabyvfilehd

---

**Last Updated:** October 12, 2025  
**Status:** Ready for Setup! 🚀  
**Next Step:** Run `supabase-schema.sql` in Supabase SQL Editor

