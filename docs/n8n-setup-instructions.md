# 🔧 n8n LinkedIn Workflow - Manuel Setup

JSON import çok büyük olduğu için, workflow'u **adım adım manuel olarak** oluşturacağız.

---

## 📦 1. YENİ WORKFLOW OLUŞTUR

1. n8n → "+ Add workflow"
2. İsim: **LinkedIn Digest - Unified System**
3. Save

---

## 🎯 2. ENTRY POINTS (3 Trigger)

### **A. Schedule Trigger**
1. "+" → Search "Schedule Trigger"
2. **Trigger Interval:** Cron
3. **Cron Expression:** `30 16 * * 1-5` (Mon-Fri 16:30 UTC)
4. **Note:** "Daily at 16:30 UTC"

### **B. Webhook Trigger**
1. "+" → Search "Webhook"
2. **HTTP Method:** POST
3. **Path:** `linkedin-digest`
4. **Response Mode:** "Using 'Respond to Webhook' Node"
5. **Note:** "Handles manual + callbacks"
6. Save → Copy webhook URL

**Your webhook URL:**
```
https://your-n8n-instance.app.n8n.cloud/webhook/linkedin-digest
```

---

## 🔀 3. PARSE TRIGGER (Code Node)

1. "+" → Search "Code"
2. **Mode:** "Run Once for All Items"
3. **Code:**

```javascript
const items = $input.all();
const firstItem = items[0];

let triggerType = 'schedule';
let webhookData = null;
let callbackData = null;

if (firstItem.json.body) {
  webhookData = firstItem.json.body;
  
  if (webhookData.action && webhookData.digest_id) {
    triggerType = 'callback';
    callbackData = {
      action: webhookData.action,
      digest_id: webhookData.digest_id,
      callback_query_id: webhookData.callback_query_id,
      chat_id: webhookData.chat_id,
      message_id: webhookData.message_id,
      edited_content: webhookData.edited_content || null
    };
  } else if (webhookData.trigger === 'manual') {
    triggerType = 'manual';
  }
}

const today = new Date();
const todayDate = today.toISOString().split('T')[0];

return {
  triggerType: triggerType,
  todayDate: todayDate,
  timestamp: new Date().toISOString(),
  webhookData: webhookData,
  callbackData: callbackData,
  telegramChatId: webhookData?.chat_id || '6474838032'
};
```

**Connect:** Both triggers → This node

---

## 🔁 4. ROUTE BY TRIGGER TYPE (IF Node)

1. "+" → Search "IF"
2. **Condition:**
   - Value 1: `{{ $json.triggerType }}`
   - Operation: `equals`
   - Value 2: `callback`

**TRUE path:** Callback flow  
**FALSE path:** Schedule/Manual flow

---

## 📋 5. SCHEDULE/MANUAL FLOW

### **A. Check If Digest Exists (Supabase)**
1. "+" → "Supabase"
2. **Operation:** Execute Query
3. **Query:**
```sql
SELECT * FROM linkedin_digest_posts 
WHERE digest_date = '{{ $('Parse Trigger Type').item.json.todayDate }}' 
LIMIT 1
```

### **B. Digest Exists? (IF)**
1. "+" → "IF"
2. **Condition:**
   - Value 1: `{{ $json.id }}`
   - Operation: `exists`

**TRUE:** Already exists → Notify  
**FALSE:** Create new → Continue

### **C. Notify Duplicate (Telegram)**
1. "+" → "Telegram"
2. **Operation:** Send Message
3. **Chat ID:** `{{ $('Parse Trigger Type').item.json.telegramChatId }}`
4. **Text:**
```
⚠️ *Daily digest already exists for today!*

Status: {{ $json.status }}
Created: {{ $json.created_at }}

No action needed.
```
5. **Parse Mode:** Markdown

**Then:** → Respond to Webhook (with error message)

### **D. Fetch Today's Articles (Supabase)**
1. "+" → "Supabase"
2. **Operation:** Execute Query
3. **Query:**
```sql
SELECT * FROM tech_news_articles 
WHERE DATE(created_at) = '{{ $('Parse Trigger Type').item.json.todayDate }}' 
ORDER BY created_at DESC 
LIMIT 15
```

### **E. Prepare Articles (Code)**
```javascript
const items = $input.all();
const articles = items.map(item => ({
  id: item.json.id,
  title: item.json.title,
  title_en: item.json.title_en,
  summary_en: item.json.summary_en,
  content_en: item.json.content_en,
  slug: item.json.slug,
  category: item.json.category,
  source_url: item.json.source_url,
  created_at: item.json.created_at
}));

return {
  articles: articles,
  articleCount: articles.length,
  todayDate: $('Parse Trigger Type').item.json.todayDate
};
```

### **F. OpenAI Generate (OpenAI Node)**
1. "+" → "OpenAI"
2. **Resource:** Chat
3. **Model:** gpt-4o-mini
4. **Message:**
```
You are a LinkedIn Growth Editor crafting high-engagement tech news posts in ENGLISH.

[FULL PROMPT FROM USER - PASTE HERE]

ARTICLES JSON:
{{ JSON.stringify($json.articles, null, 2) }}
```
5. **Temperature:** 0.7
6. **Max Tokens:** 2000

### **G. Save Digest (Supabase)**
1. "+" → "Supabase"
2. **Operation:** Insert
3. **Table:** `linkedin_digest_posts`
4. **Fields:**
   - `digest_date`: `{{ $('Parse Trigger Type').item.json.todayDate }}`
   - `article_ids`: `{{ JSON.stringify($('Prepare Articles').item.json.articles.map(a => a.id)) }}`
   - `article_count`: `{{ $('Prepare Articles').item.json.articleCount }}`
   - `suggested_content`: `{{ $json.message.content }}`
   - `status`: `pending`

### **H. Prepare Telegram Message (Code)**
```javascript
const digest = $input.first().json;
const content = digest.suggested_content || 'No content generated';

const preview = content.length > 500 
  ? content.substring(0, 500) + '...'
  : content;

const message = `📰 *Daily LinkedIn Digest Ready!*\n\n📅 Date: ${digest.digest_date}\n📊 Articles: ${digest.article_count}\n\nContent:\n${preview}\n\nChoose an action below:`;

const replyMarkup = {
  inline_keyboard: [
    [
      { text: '✅ Approve & Post', callback_data: `approve_${digest.id}` },
      { text: '❌ Reject', callback_data: `reject_${digest.id}` }
    ],
    [
      { text: '✏️ Edit & Approve', callback_data: `edit_${digest.id}` },
      { text: '👁️ View Full', callback_data: `view_${digest.id}` }
    ]
  ]
};

return {
  chatId: $('Parse Trigger Type').item.json.telegramChatId,
  text: message,
  replyMarkup: replyMarkup,
  digestId: digest.id,
  digestDate: digest.digest_date
};
```

### **I. Send to Telegram**
1. "+" → "Telegram"
2. **Chat ID:** `{{ $json.chatId }}`
3. **Text:** `{{ $json.text }}`
4. **Additional Fields → Reply Markup:** `{{ JSON.stringify($json.replyMarkup) }}`
5. **Parse Mode:** Markdown

### **J. Respond to Webhook**
1. "+" → "Respond to Webhook"
2. **Respond With:** JSON
3. **Body:**
```json
{
  "success": true,
  "message": "Digest created and sent to Telegram",
  "digest_id": "{{ $('Save Digest').item.json.id }}"
}
```

---

## 🎬 6. CALLBACK FLOW

### **A. Fetch Digest by ID (Supabase)**
1. "+" → "Supabase"
2. **Operation:** Execute Query
3. **Query:**
```sql
SELECT * FROM linkedin_digest_posts 
WHERE id = '{{ $('Parse Trigger Type').item.json.callbackData.digest_id }}' 
LIMIT 1
```

### **B. Route Callback Action (Switch)**
1. "+" → "Switch"
2. **Mode:** "Rules"
3. **Rules:**

**Rule 1: Approve**
- Output Key: `approve`
- Condition: `{{ $('Parse Trigger Type').item.json.callbackData.action }}` equals `approve`

**Rule 2: Reject**
- Output Key: `reject`
- Condition: `{{ $('Parse Trigger Type').item.json.callbackData.action }}` equals `reject`

**Rule 3: View**
- Output Key: `view`
- Condition: `{{ $('Parse Trigger Type').item.json.callbackData.action }}` equals `view`

**Rule 4: Edit**
- Output Key: `edit`
- Condition: `{{ $('Parse Trigger Type').item.json.callbackData.action }}` equals `edit`

---

### **C. APPROVE BRANCH**

**C1. Update Status to 'posting' (Supabase)**
```sql
UPDATE linkedin_digest_posts 
SET status = 'posting', updated_at = NOW() 
WHERE id = '{{ $('Fetch Digest by ID').item.json.id }}'
RETURNING *
```

**C2. Post to LinkedIn (LinkedIn Node)**
1. "+" → "LinkedIn"
2. **Operation:** Create a Post
3. **Text:** `{{ $('Fetch Digest by ID').item.json.approved_content || $('Fetch Digest by ID').item.json.suggested_content }}`
4. **Credential:** LinkedIn OAuth2

**C3. Update Status to 'posted' (Supabase)**
```sql
UPDATE linkedin_digest_posts 
SET 
  status = 'posted', 
  linkedin_post_id = '{{ $json.id }}',
  posted_at = NOW(),
  updated_at = NOW()
WHERE id = '{{ $('Fetch Digest by ID').item.json.id }}'
RETURNING *
```

**C4. Send Success (Telegram)**
```
✅ *Digest posted to LinkedIn!*

📅 Date: {{ $('Fetch Digest by ID').item.json.digest_date }}
🔗 Post ID: {{ $json.linkedin_post_id }}

This message was sent automatically with n8n
```

**C5. Respond to Webhook**
```json
{
  "success": true,
  "message": "Digest approved and posted to LinkedIn"
}
```

---

### **D. REJECT BRANCH**

**D1. Update Status to 'rejected' (Supabase)**
```sql
UPDATE linkedin_digest_posts 
SET status = 'rejected', updated_at = NOW() 
WHERE id = '{{ $('Fetch Digest by ID').item.json.id }}'
RETURNING *
```

**D2. Send Confirmation (Telegram)**
```
❌ *Digest rejected.*

The digest has been marked as rejected.

This message was sent automatically with n8n
```

**D3. Respond to Webhook**
```json
{
  "success": true,
  "message": "Digest rejected"
}
```

---

### **E. VIEW BRANCH**

**E1. Prepare Full Content (Code)**
```javascript
const digest = $('Fetch Digest by ID').item.json;
const fullContent = digest.suggested_content;

const message = `📰 *Full Digest Content*\n\n${fullContent}\n\n📅 Date: ${digest.digest_date}\n📊 Articles: ${digest.article_count}`;

return {
  chatId: $('Parse Trigger Type').item.json.callbackData.chat_id,
  text: message
};
```

**E2. Send Full Content (Telegram)**
- Chat ID: `{{ $json.chatId }}`
- Text: `{{ $json.text }}`
- Parse Mode: Markdown

**E3. Respond to Webhook**
```json
{
  "success": true,
  "message": "Full content sent"
}
```

---

### **F. EDIT BRANCH**

**F1. Send Edit Instructions (Telegram)**
```
✏️ *Edit Mode*

This feature will be available soon.

For now, you can:
• Reject this digest
• Create a new one manually

This message was sent automatically with n8n
```

**F2. Respond to Webhook**
```json
{
  "success": true,
  "message": "Edit mode (coming soon)"
}
```

---

## ✅ 7. FİNAL CHECKS

1. **Connect all nodes** (drag arrows between nodes)
2. **Test each path:**
   - Schedule trigger
   - Manual webhook
   - Approve callback
   - Reject callback
   - View callback
3. **Activate workflow** (top-right toggle)
4. **Copy webhook URL** → Add to Vercel env: `N8N_LINKEDIN_WORKFLOW_WEBHOOK`

---

## 🎉 DONE!

Your unified workflow is ready! All 3 entry points work through this single workflow.

**Webhook URL:**
```
https://your-n8n-instance.app.n8n.cloud/webhook/linkedin-digest
```

Add this to Vercel and you're done! 🚀

