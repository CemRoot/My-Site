# ✅ Vercel Environment Variables Checklist

## 📋 Required Variables

### **1. Telegram Bot**
```bash
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_CHAT_ID=6474838032
```

**How to get:**
- Bot Token: @BotFather on Telegram
- Chat ID: @userinfobot on Telegram

---

### **2. Supabase Database**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...your_service_key_here
```

**How to get:**
- Login to https://supabase.com/dashboard
- Select your project → Settings → API
- Copy "Project URL" and "service_role key"

⚠️ **IMPORTANT:** Use `service_role` key (NOT anon key) for server-side operations

---

### **3. n8n Webhook**
```bash
N8N_LINKEDIN_WORKFLOW_WEBHOOK=https://your-n8n.app.n8n.cloud/webhook/linkedin-digest
```

**How to get:**
1. Setup n8n workflow (see `docs/n8n-setup-instructions.md`)
2. Add Webhook trigger node
3. Copy webhook URL from node
4. Add to Vercel

⚠️ **CRITICAL:** This is the **UNIFIED** workflow webhook. Do NOT use old webhook variables:
- ~~N8N_MANUAL_DIGEST_WEBHOOK~~ (DEPRECATED)
- ~~N8N_CALLBACK_WEBHOOK_URL~~ (DEPRECATED)
- ~~N8N_LINKEDIN_CALLBACK_WEBHOOK~~ (DEPRECATED)

---

### **4. GitHub Integration**
```bash
GITHUB_TOKEN=ghp_your_personal_access_token_here
GITHUB_REPOSITORY=CemRoot/My-Site
```

**How to get:**
- Settings → Developer settings → Personal access tokens → Tokens (classic)
- Scopes needed: `repo`, `workflow`
- Used for: Triggering manual article scraper GitHub Actions

---

## 🔍 Verification Steps

### **Step 1: Check in Vercel Dashboard**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Verify ALL above variables exist

---

### **Step 2: Test Telegram Connection**
```bash
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe"
```

**Expected:** `{"ok":true,"result":{...}}`

---

### **Step 3: Test Supabase Connection**
```bash
curl -X GET "https://your-project.supabase.co/rest/v1/tech_news_articles?limit=1" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"
```

**Expected:** JSON array of articles

---

### **Step 4: Test n8n Webhook**
```bash
curl -X POST "https://your-n8n.app.n8n.cloud/webhook/linkedin-digest" \
  -H "Content-Type: application/json" \
  -d '{
    "trigger": "manual",
    "chat_id": "6474838032"
  }'
```

**Expected:** 
```json
{
  "success": true,
  "message": "Digest created and sent to Telegram",
  "digest_id": "..."
}
```

---

### **Step 5: Test GitHub Token**
```bash
curl -H "Authorization: token ${GITHUB_TOKEN}" \
  https://api.github.com/repos/CemRoot/My-Site/actions/workflows
```

**Expected:** JSON list of workflows

---

## 🚨 Common Issues

### **Issue 1: "N8N_LINKEDIN_WORKFLOW_WEBHOOK not configured"**
**Solution:** 
1. Make sure you added the variable to Vercel
2. Redeploy your site (Vercel doesn't auto-update env vars)
3. Check spelling (exact match required)

---

### **Issue 2: "Invalid Supabase credentials"**
**Solution:**
1. Use `service_role` key (not anon key)
2. Check URL format: `https://xxx.supabase.co` (no trailing slash)
3. Verify in Supabase dashboard → Settings → API

---

### **Issue 3: "GitHub Actions not triggering"**
**Solution:**
1. Check token scopes: Must have `repo` + `workflow`
2. Repository format: `username/repo` (not full URL)
3. Token not expired?

---

### **Issue 4: "n8n webhook 404"**
**Solution:**
1. Is n8n workflow **ACTIVE**? (toggle in top-right)
2. Correct webhook path? Should be `/webhook/linkedin-digest`
3. Test directly in browser: Should show "This is a webhook URL, please make a POST request"

---

## 📝 Environment Variable Template

Copy this to Vercel dashboard:

```bash
# Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# n8n
N8N_LINKEDIN_WORKFLOW_WEBHOOK=

# GitHub
GITHUB_TOKEN=
GITHUB_REPOSITORY=

# Site URL
NEXT_PUBLIC_SITE_URL=https://cemkoyluoglu.codes
SITE_URL=https://cemkoyluoglu.codes
```

---

## ✅ Final Check

After adding all variables:
1. Redeploy your site on Vercel
2. Test `/menu` command in Telegram
3. Try "Manuel Digest Oluştur" button
4. Verify no errors in Vercel logs

**All working?** ✅ You're done!

