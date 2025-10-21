# 🧪 LinkedIn Digest - Test Scenarios

Complete testing guide for the unified workflow system.

---

## 🎯 Test Matrix

| Test # | Scenario | Expected Result | Status |
|--------|----------|-----------------|--------|
| 1 | Otomatik Schedule (16:30) | Digest created | ⏳ |
| 2 | Manuel Trigger (First time) | Digest created | ⏳ |
| 3 | Manuel Trigger (Duplicate) | "Already exists" warning | ⏳ |
| 4 | Approve Button | Post to LinkedIn | ⏳ |
| 5 | Reject Button | Status → rejected | ⏳ |
| 6 | View Button | Full content shown | ⏳ |
| 7 | Edit Button (Coming Soon) | Instructions shown | ⏳ |
| 8 | Approve after Reject | Blocked | ⏳ |
| 9 | Re-create after Reject | Old deleted, new created | ⏳ |
| 10 | Infinite Loop Prevention | No loops | ⏳ |

---

## 📋 TEST 1: Otomatik Schedule (16:30 UTC)

### **Prerequisites:**
- [ ] n8n workflow **ACTIVE**
- [ ] Schedule trigger configured: `30 16 * * 1-5`
- [ ] Today is a weekday
- [ ] At least 1 article exists in database for today

### **Steps:**
1. Wait for 16:30 UTC
2. Check n8n execution log
3. Check Telegram for digest message

### **Expected:**
```
📰 Daily LinkedIn Digest Ready!

📅 Date: 2025-01-20
📊 Articles: 5

Content:
𝐓𝐨𝐝𝐚𝐲'𝐬 𝐓𝐨𝐩 𝐓𝐞𝐜𝐡 𝐇𝐢𝐠𝐡𝐥𝐢𝐠𝐡𝐭𝐬: ...

Choose an action below:
[✅ Approve & Post] [❌ Reject]
[✏️ Edit & Approve] [👁️ View Full]
```

### **Verify in Database:**
```sql
SELECT * FROM linkedin_digest_posts 
WHERE digest_date = CURRENT_DATE
ORDER BY created_at DESC LIMIT 1;
```

**Expected fields:**
- `status`: `pending`
- `article_count`: > 0
- `suggested_content`: Full digest text

✅ **PASS** | ❌ **FAIL**

---

## 📋 TEST 2: Manuel Trigger (First Time)

### **Prerequisites:**
- [ ] No digest exists for today
- [ ] At least 5 articles in database

### **Steps:**
1. Telegram → `/menu`
2. Click "LinkedIn Posts"
3. Click "🚀 Manuel Digest Oluştur"
4. Wait 30-60 seconds

### **Expected Messages:**
```
1. 🚀 Manuel Digest Oluşturuluyor...
   Lütfen bekleyin, bu işlem 30-60 saniye sürebilir.

2. ✅ Digest oluşturma başlatıldı!
   📊 n8n workflow tetiklendi
   ⏳ İşlem tamamlandığında digest ile birlikte bildirim alacaksınız

3. 📰 Daily LinkedIn Digest Ready!
   [... full digest with buttons ...]
```

### **Verify:**
- [ ] 3 messages received
- [ ] Digest has buttons
- [ ] Database has new entry (status: pending)

✅ **PASS** | ❌ **FAIL**

---

## 📋 TEST 3: Manuel Trigger (Duplicate Prevention)

### **Prerequisites:**
- [ ] Digest already exists for today (status: `pending` or `posted`)

### **Steps:**
1. Telegram → `/menu`
2. Click "LinkedIn Posts"
3. Click "🚀 Manuel Digest Oluştur"

### **Expected:**
```
⚠️ Bugün için digest zaten mevcut!

📅 Tarih: 2025-01-20
📊 Durum: pending
📝 Haber sayısı: 5

Digest zaten oluşturulmuş ve onay bekliyor.
LinkedIn Posts menüsünden görüntüleyebilirsiniz.
```

### **Verify:**
- [ ] No new digest created
- [ ] Warning message shown
- [ ] Database unchanged

✅ **PASS** | ❌ **FAIL**

---

## 📋 TEST 4: Approve & Post to LinkedIn

### **Prerequisites:**
- [ ] Digest exists (status: `pending`)
- [ ] LinkedIn OAuth configured in n8n
- [ ] User has valid LinkedIn account

### **Steps:**
1. Find digest message in Telegram
2. Click "✅ Approve & Post"
3. Wait 5-10 seconds

### **Expected:**
```
✅ Digest posted to LinkedIn!

📅 Date: 2025-01-20
🔗 Post ID: urn:li:share:...

This message was sent automatically with n8n
```

### **Verify:**
- [ ] Success message received
- [ ] Check LinkedIn profile: Post visible
- [ ] Database updated:
  - `status`: `posted`
  - `linkedin_post_id`: Has value
  - `posted_at`: Timestamp set

```sql
SELECT status, linkedin_post_id, posted_at 
FROM linkedin_digest_posts 
WHERE digest_date = CURRENT_DATE;
```

✅ **PASS** | ❌ **FAIL**

---

## 📋 TEST 5: Reject Digest

### **Prerequisites:**
- [ ] Digest exists (status: `pending`)

### **Steps:**
1. Find digest message in Telegram
2. Click "❌ Reject"

### **Expected:**
```
❌ Digest rejected.

The digest has been marked as rejected.

This message was sent automatically with n8n
```

### **Verify:**
- [ ] Rejection message received
- [ ] Database updated:
  - `status`: `rejected`

```sql
SELECT status FROM linkedin_digest_posts 
WHERE digest_date = CURRENT_DATE;
```

✅ **PASS** | ❌ **FAIL**

---

## 📋 TEST 6: View Full Content

### **Prerequisites:**
- [ ] Digest exists (any status)

### **Steps:**
1. Find digest message in Telegram
2. Click "👁️ View Full"

### **Expected:**
```
📰 Full Digest Content

𝐓𝐨𝐝𝐚𝐲'𝐬 𝐓𝐨𝐩 𝐓𝐞𝐜𝐡 𝐇𝐢𝐠𝐡𝐥𝐢𝐠𝐡𝐭𝐬: [Full content with all articles]

[EMOJI] [Article 1 summary]
🔗 https://cemkoyluoglu.codes/tech-news/...

[EMOJI] [Article 2 summary]
🔗 https://cemkoyluoglu.codes/tech-news/...

...

#TechNews #AI #CloudComputing

📅 Date: 2025-01-20
📊 Articles: 5
```

### **Verify:**
- [ ] Full content shown (not truncated)
- [ ] All links present
- [ ] Hashtags included

✅ **PASS** | ❌ **FAIL**

---

## 📋 TEST 7: Edit Button (Coming Soon)

### **Prerequisites:**
- [ ] Digest exists (status: `pending`)

### **Steps:**
1. Find digest message in Telegram
2. Click "✏️ Edit & Approve"

### **Expected:**
```
✏️ Edit Mode

This feature will be available soon.

For now, you can:
• Reject this digest
• Create a new one manually

This message was sent automatically with n8n
```

### **Verify:**
- [ ] Instructions shown
- [ ] No errors
- [ ] Status unchanged

✅ **PASS** | ❌ **FAIL**

---

## 📋 TEST 8: Approve After Reject (Security Test)

### **Prerequisites:**
- [ ] Digest exists (status: `rejected`)

### **Steps:**
1. Find OLD digest message (already rejected)
2. Scroll up to find original message with buttons
3. Click "✅ Approve & Post"

### **Expected:**
```
⚠️ Bu digest zaten işleme alındı!

📊 Mevcut durum: rejected
🕐 İşlem zamanı: [timestamp]

Sadece 'pending' durumundaki digest'ler onaylanabilir.
```

### **Verify:**
- [ ] Approval blocked
- [ ] Warning message shown
- [ ] Database unchanged (still `rejected`)
- [ ] **CRITICAL:** No post to LinkedIn

```sql
SELECT status FROM linkedin_digest_posts 
WHERE digest_date = CURRENT_DATE;
-- Should still be 'rejected'
```

✅ **PASS** | ❌ **FAIL**

---

## 📋 TEST 9: Re-create After Rejection

### **Prerequisites:**
- [ ] Digest exists (status: `rejected`)

### **Steps:**
1. Telegram → `/menu`
2. Click "LinkedIn Posts"
3. Click "🚀 Manuel Digest Oluştur"

### **Expected:**
```
1. 🔄 Reddedilen digest siliniyor, yenisi oluşturuluyor...

2. 🚀 Manuel Digest Oluşturuluyor...

3. ✅ Digest oluşturma başlatıldı!

4. 📰 Daily LinkedIn Digest Ready!
   [New digest with buttons]
```

### **Verify:**
- [ ] Old rejected digest deleted
- [ ] New digest created (status: `pending`)
- [ ] New digest ID different from old one

```sql
SELECT id, status, created_at FROM linkedin_digest_posts 
WHERE digest_date = CURRENT_DATE
ORDER BY created_at DESC;
-- Should see only ONE entry (new one)
```

✅ **PASS** | ❌ **FAIL**

---

## 📋 TEST 10: Infinite Loop Prevention

### **Prerequisites:**
- [ ] Digest exists (any status)
- [ ] Vercel webhook configured

### **Steps:**
1. Find digest message in Telegram
2. Click "✅ Approve & Post" button **VERY QUICKLY 5 TIMES**
3. Wait 10 seconds

### **Expected:**
- Only **ONE** success message
- No duplicate posts on LinkedIn
- No error messages
- No "loading" indicators stuck

### **Verify in Vercel Logs:**
```
✅ Callback acknowledged: [callback_id]
⚠️ Callback already processed: [same callback_id]
⚠️ Callback already processed: [same callback_id]
⚠️ Callback already processed: [same callback_id]
⚠️ Callback already processed: [same callback_id]
```

### **Verify in Database:**
```sql
SELECT COUNT(*) FROM linkedin_digest_posts 
WHERE digest_date = CURRENT_DATE 
AND status = 'posted';
-- Should be 1 (not 5!)
```

✅ **PASS** | ❌ **FAIL**

---

## 🐛 Debugging Failed Tests

### **Check n8n Execution Logs**
1. n8n → Executions
2. Find latest execution
3. Check each node's output
4. Look for red error nodes

### **Check Vercel Logs**
```bash
vercel logs --prod
```

**Look for:**
- `📤 Forwarding LinkedIn digest callback to n8n`
- `✅ Callback acknowledged`
- `⚠️ Callback already processed` (for duplicate prevention)

### **Check Supabase Logs**
1. Supabase Dashboard → Logs
2. Filter by `linkedin_digest_posts` table
3. Check for INSERT/UPDATE operations

### **Common Issues:**

| Error | Cause | Solution |
|-------|-------|----------|
| "already exists" always shown | Date format mismatch | Check `todayDate` in n8n Code node |
| Infinite Telegram messages | Callback not acknowledged | Check Vercel deduplication |
| LinkedIn post fails | OAuth token expired | Re-authenticate in n8n |
| "Digest not found" | Wrong digest_id | Check callback data parsing |

---

## ✅ Test Summary

After completing all tests:

```
✅ Passed: ___ / 10
❌ Failed: ___ / 10
```

**All tests passed?** 🎉 System is production-ready!

**Any failures?** Check the debugging section and re-test.

