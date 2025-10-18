# LinkedIn Digest Automation System

## 📋 Overview

The LinkedIn Digest System automatically generates and posts daily tech news digests to LinkedIn via Telegram approval workflow.

**Status:** ✅ Active (Replaced legacy `linkedin_posts` system)

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                   LINKEDIN DIGEST FLOW                       │
└─────────────────────────────────────────────────────────────┘

1️⃣ n8n Workflow (Content Generation)
   ├── Schedule: Daily at 16:30 weekdays
   ├── Checks: linkedin_digest_posts duplicate prevention
   ├── Fetches: Today's tech_news_articles (limit 15)
   ├── AI Generation: OpenAI GPT-4 creates digest
   └── Stores: linkedin_digest_posts (status: pending)

2️⃣ Telegram Notification
   ├── Sends: Digest preview with 4 buttons
   │   ├── ✅ Approve & Post
   │   ├── ✏️ Edit & Approve
   │   ├── ❌ Reject
   │   └── 👁️ View Full
   └── Webhook: https://cemkoyluoglu.codes/api/telegram-webhook

3️⃣ Vercel Webhook Handler (api/telegram-webhook.js)
   ├── Security: UUID validation, rate limiting, chat auth
   ├── Action Handlers:
   │   ├── approve: Posts to LinkedIn API
   │   ├── reject: Updates status to 'rejected'
   │   ├── edit: Shows content for manual edit
   │   └── view: Displays full content
   └── Database: Updates linkedin_digest_posts status

4️⃣ LinkedIn API Integration
   ├── Endpoint: POST /v2/ugcPosts
   ├── Auth: Bearer token (LINKEDIN_ACCESS_TOKEN)
   ├── Content: digest.suggested_content
   └── Response: linkedin_post_id

5️⃣ Confirmation
   └── Telegram: Success/error notification
```

---

## 🗄️ Database Schema

### `linkedin_digest_posts` Table

```sql
CREATE TABLE linkedin_digest_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  digest_date DATE NOT NULL UNIQUE,
  article_ids UUID[] NOT NULL,
  article_count INTEGER NOT NULL DEFAULT 0,
  suggested_content TEXT NOT NULL,
  approved_content TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  telegram_message_id INTEGER,
  linkedin_post_id TEXT,
  posted_at TIMESTAMP WITH TIME ZONE,
  engagement_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Statuses:**
- `pending`: Awaiting approval
- `approved`: Approved but not yet posted
- `posted`: Successfully posted to LinkedIn
- `rejected`: User rejected
- `failed`: LinkedIn API error

---

## 🔒 Security Features

### 1. UUID Validation
```javascript
// RFC 4122 compliant UUID check
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
```

### 2. Rate Limiting
```javascript
// 10 requests per minute per user
checkRateLimit(userId, maxRequests=10, windowMs=60000)
```

### 3. Chat Authorization
```javascript
// Only authorized Telegram chat can trigger actions
if (chatId.toString() !== CONFIG.TELEGRAM_CHAT_ID) {
  return unauthorized;
}
```

### 4. Duplicate Prevention
- Unique constraint on `digest_date`
- Status check before posting
- n8n workflow checks existing digest

### 5. Error Handling
- Try-catch on all async operations
- Database transaction safety
- Telegram error notifications
- LinkedIn API retry logic

---

## ⚙️ Configuration

### Required Environment Variables

```bash
# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# LinkedIn
LINKEDIN_ACCESS_TOKEN=your_access_token
LINKEDIN_PERSON_URN=urn:li:person:YOUR_ID

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### LinkedIn OAuth Setup

1. **Create LinkedIn App:**
   - Go to: https://www.linkedin.com/developers/apps
   - Create app with permissions: `w_member_social`

2. **Get Access Token:**
   ```bash
   # Use LinkedIn OAuth 2.0 flow
   # Scope: w_member_social
   ```

3. **Get Person URN:**
   ```bash
   curl -X GET 'https://api.linkedin.com/v2/me' \
     -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
   ```

4. **Add to Vercel:**
   ```bash
   vercel env add LINKEDIN_ACCESS_TOKEN
   vercel env add LINKEDIN_PERSON_URN
   ```

---

## 📝 Callback Data Format

Telegram buttons send callback_data in this format:

```
{action}_{digest_id}
```

**Examples:**
- `approve_550e8400-e29b-41d4-a716-446655440000`
- `reject_550e8400-e29b-41d4-a716-446655440000`
- `edit_550e8400-e29b-41d4-a716-446655440000`
- `view_550e8400-e29b-41d4-a716-446655440000`

**Pattern Matching:**
```javascript
if (data.match(/^(approve|reject|edit|view)_[0-9a-f-]+$/i)) {
  const [action, digestId] = data.split('_');
  // Handle action...
}
```

---

## 🧪 Testing Guide

### Phase 3-1: Manual Testing

#### Step 1: Generate Digest (n8n)
```bash
1. Open n8n workflow
2. Click "Execute Workflow" (manual trigger)
3. Check: Digest created in linkedin_digest_posts
4. Check: Telegram message received with 4 buttons
```

#### Step 2: Test Approve Button
```bash
1. Click "✅ Approve & Post" in Telegram
2. Expected:
   ✅ "🚀 LinkedIn'e gönderiliyor..." message
   ✅ Post appears on LinkedIn
   ✅ Database status = 'posted'
   ✅ linkedin_post_id populated
   ✅ "✅ Başarıyla LinkedIn'de paylaşıldı!" confirmation
```

#### Step 3: Test Reject Button
```bash
1. Generate new digest
2. Click "❌ Reject" in Telegram
3. Expected:
   ✅ Database status = 'rejected'
   ✅ "❌ Digest reddedildi" confirmation
   ✅ Buttons removed from message
```

#### Step 4: Test Edit Button
```bash
1. Generate new digest
2. Click "✏️ Edit & Approve" in Telegram
3. Expected:
   ✅ Full content shown
   ✅ Instructions for manual editing
   ✅ Buttons remain active
```

#### Step 5: Test View Button
```bash
1. Click "👁️ View Full" in Telegram
2. Expected:
   ✅ Full digest content displayed
   ✅ Metadata shown (date, count, status)
   ✅ Buttons remain active
```

### Phase 3-2: Edge Case Testing

#### Test 1: Duplicate Approval
```bash
1. Approve digest
2. Try to approve same digest again
3. Expected: "⚠️ Bu digest zaten paylaşılmış!"
```

#### Test 2: Rate Limiting
```bash
1. Click button 11 times in 1 minute
2. Expected: "⏱️ Çok fazla istek gönderdiniz. Lütfen 1 dakika bekleyin."
```

#### Test 3: Invalid UUID
```bash
# Manually send callback with invalid UUID
1. Send: approve_invalid-uuid
2. Expected: "❌ Geçersiz istek formatı."
```

#### Test 4: Unauthorized Chat
```bash
# Send request from different Telegram chat
1. Forward message to another chat
2. Click button
3. Expected: Request blocked (logged, no response)
```

#### Test 5: LinkedIn API Error
```bash
# Use invalid/expired LinkedIn token
1. Temporarily set wrong LINKEDIN_ACCESS_TOKEN
2. Approve digest
3. Expected:
   ✅ Error caught
   ✅ Status = 'failed'
   ✅ Error message sent to Telegram
   ✅ No crash
```

#### Test 6: Network Timeout
```bash
# Simulate slow network
1. Add delay to LinkedIn API response
2. Expected:
   ✅ Request timeout handled
   ✅ User notified
   ✅ Status updated appropriately
```

---

## 🐛 Troubleshooting

### Issue: Telegram buttons not appearing

**Solution:**
```bash
# Check Telegram webhook URL
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo

# Should return:
{
  "url": "https://cemkoyluoglu.codes/api/telegram-webhook",
  "has_custom_certificate": false,
  "pending_update_count": 0
}

# If wrong, reset:
curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook \
  -d "url=https://cemkoyluoglu.codes/api/telegram-webhook"
```

### Issue: LinkedIn API 401 Unauthorized

**Solution:**
```bash
# Verify token validity
curl -X GET 'https://api.linkedin.com/v2/me' \
  -H 'Authorization: Bearer YOUR_TOKEN'

# If invalid, regenerate OAuth token
# LinkedIn tokens expire after 60 days
```

### Issue: Duplicate key error

**Solution:**
```sql
-- Check if digest exists for today
SELECT * FROM linkedin_digest_posts 
WHERE digest_date = CURRENT_DATE;

-- If exists and you want to recreate:
DELETE FROM linkedin_digest_posts 
WHERE digest_date = CURRENT_DATE;
```

### Issue: Database not updating

**Solution:**
```bash
# Check Supabase connection
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('linkedin_digest_posts').select('count').then(console.log);
"

# Verify RLS policies allow service role
```

---

## 📊 Monitoring

### Key Metrics

```sql
-- Daily success rate
SELECT 
  digest_date,
  status,
  COUNT(*) as count
FROM linkedin_digest_posts
WHERE digest_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY digest_date, status
ORDER BY digest_date DESC;

-- Average time to approval
SELECT 
  AVG(EXTRACT(EPOCH FROM (posted_at - created_at))/3600) as avg_hours
FROM linkedin_digest_posts
WHERE status = 'posted'
  AND posted_at IS NOT NULL;

-- Rejection rate
SELECT 
  COUNT(*) FILTER (WHERE status = 'rejected') * 100.0 / COUNT(*) as rejection_rate
FROM linkedin_digest_posts
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';
```

### Vercel Logs

```bash
# View webhook logs
vercel logs --follow

# Filter for LinkedIn errors
vercel logs | grep "LinkedIn API error"
```

---

## 🔄 Migration from Legacy System

### Legacy System (`linkedin_posts`)
- ❌ Individual article posts
- ❌ Multiple approvals needed
- ❌ Complex workflow
- ❌ Table: `linkedin_posts`

### New System (`linkedin_digest_posts`)
- ✅ Daily digest format
- ✅ Single approval
- ✅ Simplified UX
- ✅ Table: `linkedin_digest_posts`

### Migration Steps

**Already completed:**
1. ✅ Created `linkedin_digest_posts` table
2. ✅ Updated `api/telegram-webhook.js`
3. ✅ Marked legacy scripts as deprecated
4. ✅ Updated documentation

**Optional cleanup:**
```sql
-- ⚠️ Only if you're sure legacy system is not needed
DROP TABLE IF EXISTS linkedin_posts;
```

---

## 📚 API Reference

### Webhook Endpoint

```
POST https://cemkoyluoglu.codes/api/telegram-webhook
```

**Request Body (Telegram format):**
```json
{
  "callback_query": {
    "id": "callback_id",
    "from": {
      "id": 1925139795
    },
    "message": {
      "chat": {
        "id": 1925139795
      },
      "message_id": 12345
    },
    "data": "approve_550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Digest posted successfully"
}
```

### LinkedIn API

```
POST https://api.linkedin.com/v2/ugcPosts
Authorization: Bearer {ACCESS_TOKEN}
X-Restli-Protocol-Version: 2.0.0
```

**Request Body:**
```json
{
  "author": "urn:li:person:YOUR_ID",
  "lifecycleState": "PUBLISHED",
  "specificContent": {
    "com.linkedin.ugc.ShareContent": {
      "shareCommentary": {
        "text": "Your digest content here"
      },
      "shareMediaCategory": "NONE"
    }
  },
  "visibility": {
    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
  }
}
```

---

## 👥 Support

**Issues:** Report bugs via [GitHub Issues](https://github.com/CemRoot/My-Site/issues)  
**Email:** cemkoyluoglu@icloud.com  
**Documentation:** See `/docs` folder for more guides

---

## 📝 Changelog

### v2.0.0 (Current) - October 2025
- ✅ Digest-based system
- ✅ Enhanced security (UUID validation, rate limiting)
- ✅ Improved UX (4 button workflow)
- ✅ Better error handling
- ✅ Comprehensive documentation

### v1.0.0 (Legacy) - Deprecated
- Individual article posting
- Basic approval workflow
- Manual post generation

---

**Last Updated:** October 18, 2025  
**Maintained By:** Dr. Cem Koyluoglu

