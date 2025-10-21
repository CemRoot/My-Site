# 🚀 n8n Unified LinkedIn Workflow - Setup Guide

## 📊 Sistem Mimarisi

Bu tek, temiz workflow **3 farklı entry point**'i destekler:
1. **Schedule Trigger** (16:30 UTC daily) → Otomatik digest
2. **Webhook Manual** (POST /webhook/linkedin-digest) → Manuel tetikleme
3. **Webhook Callback** (POST /webhook/linkedin-digest) → Telegram buton işlemleri

---

## 🏗️ WORKFLOW YAPISI

```
┌─────────────────────────────────────────────────────┐
│ ENTRY POINTS (3 Trigger)                            │
├─────────────────────────────────────────────────────┤
│ 1. Schedule Trigger (16:30 UTC)                     │
│ 2. Webhook - Manual Trigger                         │
│ 3. Webhook - Callback (approve/reject/edit/view)    │
└──────────────────┬──────────────────────────────────┘
                   ↓
    ┌──────────────────────────┐
    │ Parse Trigger Type       │ ← Determines flow
    │ (Code Node)              │
    └──────────┬───────────────┘
               ↓
    ┌──────────────────────────┐
    │ Route by Type (IF)       │
    └───┬──────────────┬───────┘
        │              │
   CALLBACK          SCHEDULE/MANUAL
        │              │
        ↓              ↓
┌──────────────┐  ┌──────────────────┐
│ Fetch Digest │  │ Check Duplicate  │
│ by ID        │  │ (Supabase Query) │
└──────┬───────┘  └────────┬─────────┘
       │                   │
       ↓                   ↓
┌──────────────┐  ┌──────────────────┐
│ Route Action │  │ Digest Exists?   │
│ (Switch)     │  │ (IF)             │
└──┬───┬───┬───┘  └──┬────────────┬──┘
   │   │   │   │      │            │
  approve reject view edit  EXISTS  NOT EXISTS
   │   │   │   │      │            │
   ↓   ↓   ↓   ↓      ↓            ↓
[Handle Each]    [Notify]   [Fetch Articles]
                              ↓
                        [OpenAI Generate]
                              ↓
                        [Save to Database]
                              ↓
                        [Send Telegram]
```

---

## 🔧 KRİTİK NODE'LAR

### 1️⃣ **Parse Trigger Type** (Code Node)
**Amaç:** Entry point'i belirle ve data hazırla

```javascript
// Determines: schedule | manual | callback
const triggerType = webhookData?.action ? 'callback' 
                  : webhookData?.trigger === 'manual' ? 'manual'
                  : 'schedule';

// CRITICAL: Consistent date format
const todayDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

return {
  triggerType,
  todayDate,
  callbackData,
  telegramChatId
};
```

**✅ FIX:** `todayDate` her zaman `YYYY-MM-DD` format

---

### 2️⃣ **Check If Digest Exists** (Supabase)
**Amaç:** Duplicate digest önle

```sql
SELECT * FROM linkedin_digest_posts 
WHERE digest_date = '{{ $json.todayDate }}' 
LIMIT 1
```

**✅ FIX:** Tarih parametresi `Parse Trigger Type` node'undan geliyor

---

### 3️⃣ **Digest Exists?** (IF Node)
**Condition:**
```
$json.id EXISTS → TRUE (Already exists)
NOT EXISTS → FALSE (Create new)
```

**TRUE path:** Notify Duplicate → Respond  
**FALSE path:** Fetch Articles → OpenAI → Save → Telegram

---

### 4️⃣ **Route Callback Action** (Switch Node)
**Amaç:** Telegram buton callback'lerini yönlendir

**Outputs:**
- `approve` → Post to LinkedIn
- `reject` → Update status to 'rejected'
- `view` → Show full content
- `edit` → Edit interface

---

## 🎯 CALLBACK HANDLER'LAR

### ✅ **APPROVE FLOW**

```
Route → Approve
     ↓
[Update Status to 'posting']
     ↓
[Post to LinkedIn] (LinkedIn node)
     ↓
[Update Status to 'posted' + linkedin_post_id]
     ↓
[Send Success Message to Telegram]
     ↓
[Respond to Webhook]
```

**LinkedIn Node Configuration:**
- **Operation:** Create a post
- **Content:** `={{ $('Fetch Digest by ID').item.json.approved_content || $('Fetch Digest by ID').item.json.suggested_content }}`
- **Credential:** LinkedIn OAuth2

---

### ❌ **REJECT FLOW**

```
Route → Reject
     ↓
[Update Status to 'rejected']
     ↓
[Send Confirmation to Telegram]
     ↓
[Respond to Webhook]
```

---

### 👁️ **VIEW FLOW**

```
Route → View
     ↓
[Prepare Full Content Message]
     ↓
[Send Long Message to Telegram]
     ↓
[Respond to Webhook]
```

**Telegram Message:**
```javascript
const fullContent = digest.suggested_content;
const message = `📰 *Full Digest Content*\n\n${fullContent}\n\n📅 Date: ${digest.digest_date}\n📊 Articles: ${digest.article_count}`;
```

---

### ✏️ **EDIT FLOW** (YENİ!)

```
Route → Edit
     ↓
[Send Edit Instructions to Telegram]
     ↓
[Wait for User Input] ← Conversation state in Supabase
     ↓
[Update approved_content with edited text]
     ↓
[Send Updated Preview with Approve Button]
     ↓
[Respond to Webhook]
```

**Edit Implementation:**
1. Telegram'a mesaj gönder: "Lütfen düzenlenmiş içeriği gönderin"
2. User metni yazar
3. Vercel webhook yakalar → Supabase'e kaydet
4. n8n'e geri döner → Preview gösterir
5. User approve eder → LinkedIn'e post

---

## 🔐 GÜVENLİK & DEDUPLICATION

### **1. Telegram Callback Deduplication** (Vercel)
```javascript
// In telegram-webhook.js
const processedCallbacks = new Map();

if (processedCallbacks.has(callbackQueryId)) {
  return res.status(200).json({ success: true, message: 'Already processed' });
}

processedCallbacks.set(callbackQueryId, Date.now());
```

### **2. Status Validation** (Vercel)
```javascript
// Only approve/reject pending digests
if (action === 'approve' || action === 'reject') {
  if (digest.status !== 'pending') {
    return res.status(200).json({ 
      success: false, 
      message: `Cannot ${action} a ${digest.status} digest` 
    });
  }
}
```

### **3. Duplicate Date Check** (n8n)
```sql
-- Consistent YYYY-MM-DD format
WHERE digest_date = '{{ $json.todayDate }}'
```

---

## 📝 SETUP CHECKLIST

### **1. n8n Credentials**
- [ ] LinkedIn OAuth2 (w_member_social scope)
- [ ] Telegram Bot Token
- [ ] Supabase (URL + Service Key)
- [ ] OpenAI API Key

### **2. Vercel Environment Variables**
```bash
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
N8N_LINKEDIN_WORKFLOW_WEBHOOK=https://your-n8n.app.n8n.cloud/webhook/linkedin-digest
GITHUB_TOKEN=...
GITHUB_REPOSITORY=...
```

### **3. Import Workflow**
1. n8n → Workflows → Import
2. Upload `n8n-linkedin-unified-workflow.json`
3. Update all credential references
4. Test each trigger type

### **4. Activate Workflow**
- Toggle "Active" in top-right
- Schedule will start automatically
- Webhook URL will be live

---

## 🧪 TESTING SCENARIOS

### **Test 1: Otomatik Digest (Schedule)**
```bash
# Wait for 16:30 UTC OR
# Manually execute "Daily Schedule" node in n8n
```

**Expected:**
1. Fetches today's articles
2. Generates digest with OpenAI
3. Saves to Supabase (status: pending)
4. Sends Telegram with buttons

---

### **Test 2: Manuel Digest**
```bash
curl -X POST https://your-n8n.app.n8n.cloud/webhook/linkedin-digest \
  -H "Content-Type: application/json" \
  -d '{
    "trigger": "manual",
    "chat_id": "6474838032"
  }'
```

**Expected:** Same as Test 1

---

### **Test 3: Approve Callback**
1. Click "✅ Approve & Post" in Telegram
2. Vercel forwards to n8n
3. n8n posts to LinkedIn
4. Status updated to 'posted'
5. Confirmation sent to Telegram

---

### **Test 4: Duplicate Prevention**
```bash
# Run Test 2 twice in a row
```

**Expected:** Second attempt returns "already exists"

---

### **Test 5: Edit & Approve**
1. Click "✏️ Edit & Approve"
2. Type edited content in Telegram
3. Preview shown with Approve button
4. Click Approve
5. Edited version posted to LinkedIn

---

## 🐛 TROUBLESHOOTING

### **Problem: "already exists" but want to recreate**
**Solution:** Delete from Supabase first:
```sql
DELETE FROM linkedin_digest_posts WHERE digest_date = '2025-01-20';
```

### **Problem: Infinite Telegram loop**
**Solution:** Already fixed in Vercel with:
- Immediate callback acknowledgment
- Deduplication map
- 200 OK on all responses

### **Problem: LinkedIn post fails**
**Check:**
1. LinkedIn OAuth credentials valid?
2. Token expired? (n8n should auto-refresh)
3. Content too long? (LinkedIn limit: 3000 chars)

### **Problem: Date mismatch in duplicate check**
**Solution:** Use consistent format everywhere:
```javascript
// ALWAYS use this:
const todayDate = new Date().toISOString().split('T')[0];
// NOT: $now.format() or $json.someDate
```

---

## 📚 WORKFLOW FILES

- **Main Workflow:** `docs/n8n-linkedin-unified-workflow.json` (TEK DOSYA - import et)
- **Vercel Webhook:** `api/telegram-webhook.js` (security layer)
- **Menu Handler:** `scripts/telegram-menu-handler.js` (manual trigger)

---

## ✅ DONE!

Bu workflow ile:
- ✅ No duplicates (guaranteed)
- ✅ No infinite loops (fixed)
- ✅ Edit functionality (new!)
- ✅ Clean separation of concerns
- ✅ Single source of truth (Supabase)

**Herhangi bir sorun olursa, n8n execution log'larını kontrol et!**

