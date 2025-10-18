# 🚀 n8n LinkedIn Digest Setup Guide

## ✅ YAPILMASI GEREKENLER

### 1️⃣ Parse Callback Node'unu Güncelleyin

**n8n'de:**
1. "LinkedIn Digest Callback Handler" workflow'unu açın
2. **"Parse Telegram Callback"** node'una çift tıklayın
3. JavaScript kodunu aşağıdaki ile **DEĞİŞTİRİN:**

```javascript
const webhookData = $input.first().json;
const body = webhookData.body;  // ← ÖNEMLI: body'yi al
const callback = body.callback_query;

if (!callback || !callback.data) {
  return [{ json: { error: 'Invalid callback' } }];
}

const [action, digestId] = callback.data.split('_');

return [{
  json: {
    action: action,
    digestId: digestId,
    callbackQueryId: callback.id,
    chatId: callback.message.chat.id,
    messageId: callback.message.message_id
  }
}];
```

4. **"Save"** butonuna basın

---

### 2️⃣ Workflow'u ACTIVE Yapın

**n8n'de:**
1. Workflow sayfasının **sağ üst köşesinde** "Active" toggle'ını bulun
2. **Toggle'ı AÇIN** (yeşil olmalı) ✅
3. Production URL otomatik olarak aktif olacak

**Production URL (örnek):**
```
https://testhesabsi.app.n8n.cloud/webhook/linkedin-digest-callback
```

⚠️ **DİKKAT:** Test mode'dan çıkın! "Listen for test event" butonuna basmayın.

---

### 3️⃣ Credentials Kontrol

**LinkedIn OAuth2:**
```
Settings → Credentials → LinkedIn OAuth2
├── Organization Support: ☐ KAPALI
├── Use Legacy API: ☑ AÇIK (connection için gerekli)
└── Connection: ✅ Active
```

**Supabase:**
```
Settings → Credentials → Supabase
├── Host: https://egehpwmjvvabyvfilehd.supabase.co
├── Service Role Key: ✅ Configured
└── Connection: ✅ Active
```

**Telegram:**
```
Settings → Credentials → Telegram
├── Access Token: ✅ Configured
└── Connection: ✅ Active
```

---

### 4️⃣ Her İki Workflow'u da ACTIVE Yapın

**Workflow #1: LinkedIn Daily Digest Generator**
- Schedule: 16:30 weekdays
- Status: **ACTIVE** ✅

**Workflow #2: LinkedIn Digest Callback Handler**
- Webhook: linkedin-digest-callback
- Status: **ACTIVE** ✅

---

## 🧪 TEST

### Manuel Test

**Workflow #1'i test edin:**
1. n8n'de "LinkedIn Daily Digest Generator" açın
2. **"Execute Workflow"** butonuna basın
3. Telegram'da mesaj gelmeli (4 butonla)

**Workflow #2'yi test edin:**
1. Telegram'da gelen mesajda **"👁️ View Full"** butonuna basın
2. Tam içerik görmelisiniz
3. n8n → Executions → Son execution başarılı olmalı ✅

---

## ✅ KONTROL LİSTESİ

Tamamlandıysa işaretleyin:

```
☐ Parse Callback kodu güncellendi
☐ Workflow #1 ACTIVE
☐ Workflow #2 ACTIVE
☐ LinkedIn credential bağlı ve test edildi
☐ Supabase credential bağlı
☐ Telegram credential bağlı
☐ Test mesajı gönderildi ve butona basıldı
☐ n8n execution başarılı
```

---

## 🎯 SON DURUM

**Sistem akışı:**

```
┌──────────────────────────────────────────┐
│  n8n Workflow #1 (16:30 Daily)          │
│  → Generate digest                       │
│  → Save to Supabase (pending)           │
│  → Send Telegram (4 buttons)            │
└──────────────────────────────────────────┘
                ↓ User clicks button
┌──────────────────────────────────────────┐
│  Telegram Bot API                        │
│  → https://cemkoyluoglu.codes/          │
│     api/telegram-webhook                 │
└──────────────────────────────────────────┘
                ↓
┌──────────────────────────────────────────┐
│  Vercel (Security Layer)                 │
│  → UUID validation                       │
│  → Rate limiting                         │
│  → Forward to n8n                        │
└──────────────────────────────────────────┘
                ↓
┌──────────────────────────────────────────┐
│  n8n Workflow #2 (Callback Handler)     │
│  → Parse callback                        │
│  → Get digest from DB                    │
│  → Post to LinkedIn                      │
│  → Update DB (posted)                    │
│  → Send confirmation                     │
└──────────────────────────────────────────┘
```

---

## 🚨 SORUN GİDERME

### Telegram'da JSON metni görünüyor

**Sorun:** Telegram mesajında garip JSON kodu görünüyor

**Çözüm:**
1. Telegram'da `/start` yazın
2. Eski mesajları silin
3. n8n Workflow #1'i tekrar çalıştırın
4. Yeni mesaj düzgün gelmelidir

### Workflow tetiklenmiyor

**Kontrol edin:**
- [ ] Workflow ACTIVE mi?
- [ ] Webhook URL doğru mu?
- [ ] Vercel env var ekli mi?

### LinkedIn post atılmıyor

**Kontrol edin:**
- [ ] LinkedIn credential bağlı mı?
- [ ] Legacy API açık mı?
- [ ] n8n execution log'larında hata var mı?

---

## 📞 Destek

**Sorun yaşarsanız:**
1. n8n → Executions → Son execution'ı kontrol edin
2. Hangi node'da hata var?
3. Error message nedir?

**Log kontrol:**
- Vercel: `vercel logs --follow`
- n8n: Executions tab

---

**Sistem hazır! Test edin ve sonucu bildirin.** 🚀

