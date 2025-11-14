# 🔄 Telegram Webhook Sistemi - Nasıl Çalışır?

## 📊 Sistem Mimarisi

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TELEGRAM BOT                                 │
│                  (Mesajlar ve Button Press'ler)                      │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ Webhook ile gönderir
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    VERCEL SERVERLESS FUNCTION                        │
│                   /api/telegram-webhook.js                           │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  1. Mesajı alır ve parse eder                                │   │
│  │  2. Güvenlik kontrolü (Chat ID, Rate Limit)                  │   │
│  │  3. Callback deduplication (tekrar işlemeyi önler)           │   │
│  │  4. Telegram'a HEMEN ACK gönderir (önemli!)                  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                             │                                        │
│                             ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Mesaj Tipi Kontrolü:                                        │   │
│  │  • /menu, /help gibi komutlar → Direct handle                │   │
│  │  • approve/reject/edit → n8n'e forward                       │   │
│  └──────────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ Forward eder
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       N8N WORKFLOW                                   │
│              (LinkedIn Digest Unified Workflow)                      │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  1. Callback'i alır                                          │   │
│  │  2. Action'a göre route eder (approve/reject/edit/view)      │   │
│  │  3. Supabase'de digest status'ünü günceller                  │   │
│  │  4. LinkedIn'e post eder (eğer approve ise)                  │   │
│  │  5. Telegram'a sonucu bildirir                               │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Yeni Reset Sistemi Nasıl Çalışır?

### Eski Sistem (Sorunlu):
```
n8n değişikliği yapılınca:
  ↓
Telegram eski URL'e mesaj göndermeye devam eder
  ↓
Mesajlar kuyrukta sıkışır (pending updates)
  ↓
Yeni mesajlar işlenmez ❌
```

### Yeni Sistem (npm run telegram:reset):

```bash
npm run telegram:reset
```

**Ne Yapar?**

#### Adım 1: Mevcut Durumu Kontrol
```javascript
GET https://api.telegram.org/bot<TOKEN>/getWebhookInfo

Örnek Çıktı:
{
  "url": "https://cemkoyluoglu.codes/api/telegram-webhook",
  "pending_update_count": 47,  // ← SORUN BURADA!
  "last_error_message": "Wrong response from the webhook: 500"
}
```

#### Adım 2: Webhook'u Sil + Kuyruğu Temizle
```javascript
POST https://api.telegram.org/bot<TOKEN>/deleteWebhook
Body: {
  "drop_pending_updates": true  // ← Bu TÜM sıkışmış mesajları siler!
}

✅ 47 pending update SİLİNDİ!
```

#### Adım 3: Yeni Webhook'u Kur
```javascript
POST https://api.telegram.org/bot<TOKEN>/setWebhook
Body: {
  "url": "https://cemkoyluoglu.codes/api/telegram-webhook",
  "allowed_updates": ["callback_query", "message"],
  "max_connections": 40,
  "drop_pending_updates": true  // ← Ekstra güvenlik
}

✅ Yeni webhook kuruldu!
```

#### Adım 4: Doğrulama
```javascript
GET https://api.telegram.org/bot<TOKEN>/getWebhookInfo

Başarılı Çıktı:
{
  "url": "https://cemkoyluoglu.codes/api/telegram-webhook",
  "pending_update_count": 0,  // ← TEMİZ! ✅
  "last_error_message": null
}
```

---

## 🎯 Mesaj Akışı: Adım Adım

### Senaryo 1: /menu Komutu

```
1. Kullanıcı Telegram'da yazar: /menu
   │
   ▼
2. Telegram → Vercel webhook'a POST gönderir
   POST /api/telegram-webhook
   Body: {
     "message": {
       "text": "/menu",
       "from": {"id": 1925139795},
       "chat": {"id": 1925139795}
     }
   }
   │
   ▼
3. Vercel'deki handler:
   - Chat ID kontrolü ✅
   - Rate limit kontrolü ✅
   - Komut tespiti: "/menu"
   - Menu handler çağrılır
   │
   ▼
4. Menu handler:
   - Telegram'a mesaj gönderir (inline keyboard ile)
   - Butonlar: "Scrape", "LinkedIn", "Health", "Status"
   │
   ▼
5. Kullanıcı cevap görür ✅
```

### Senaryo 2: LinkedIn Digest Onaylama

```
1. n8n workflow otomatik çalışır (her gün 16:30)
   - Tech news'leri toplar
   - AI ile digest oluşturur
   - Supabase'e kaydeder (status: 'pending')
   │
   ▼
2. n8n → Telegram'a önizleme gönderir
   Mesaj: "🤖 LinkedIn Digest Hazır!"
   Butonlar: [Onayla] [Reddet] [Düzenle] [Görüntüle]
   │
   ▼
3. Kullanıcı [Onayla] butonuna basar
   │
   ▼
4. Telegram → Vercel'e callback gönderir
   POST /api/telegram-webhook
   Body: {
     "callback_query": {
       "data": "approve_abc-123-def-456",
       "message": {...}
     }
   }
   │
   ▼
5. Vercel handler:
   ┌─────────────────────────────────────────┐
   │ A. HEMEN ACK gönder (önemli!)           │
   │    answerCallbackQuery() ✅              │
   │    → Telegram'a "alındı" der             │
   │    → Tekrar göndermeyi önler             │
   └─────────────────────────────────────────┘
   │
   ▼
   ┌─────────────────────────────────────────┐
   │ B. Deduplication kontrolü               │
   │    - Callback ID cache'de var mı?       │
   │    - Varsa: return (tekrar işleme!)     │
   │    - Yoksa: cache'e ekle ✅             │
   └─────────────────────────────────────────┘
   │
   ▼
   ┌─────────────────────────────────────────┐
   │ C. Supabase'den digest'i getir          │
   │    - Status kontrolü: 'pending' mi?     │
   │    - Eğer 'posted' ise: HATA            │
   │    - Eğer 'rejected' ise: HATA          │
   └─────────────────────────────────────────┘
   │
   ▼
   ┌─────────────────────────────────────────┐
   │ D. n8n'e forward et                     │
   │    POST N8N_LINKEDIN_WORKFLOW_WEBHOOK   │
   │    Body: {                              │
   │      action: "approve",                 │
   │      digest_id: "abc-123-def-456",      │
   │      chat_id: 1925139795,               │
   │      message_id: 12345                  │
   │    }                                    │
   └─────────────────────────────────────────┘
   │
   ▼
6. n8n workflow:
   ┌─────────────────────────────────────────┐
   │ A. Callback'i parse et                  │
   │    - Action: approve                    │
   │    - Digest ID: abc-123-def-456         │
   └─────────────────────────────────────────┘
   │
   ▼
   ┌─────────────────────────────────────────┐
   │ B. Route to "Approve" branch            │
   │    - LinkedIn'e post et                 │
   │    - Supabase güncelle:                 │
   │      status = 'posted'                  │
   │      posted_at = NOW()                  │
   └─────────────────────────────────────────┘
   │
   ▼
   ┌─────────────────────────────────────────┐
   │ C. Telegram'a sonuç bildir              │
   │    "✅ Digest başarıyla paylaşıldı!"    │
   │    + LinkedIn post linki                │
   └─────────────────────────────────────────┘
   │
   ▼
7. Kullanıcı başarı mesajını görür ✅
```

---

## 🚨 Sorun Önleme Mekanizmaları

### 1. Callback Deduplication (Telegram Retry Loop Önleme)

```javascript
// api/telegram-webhook.js

const processedCallbacks = new Map();

if (processedCallbacks.has(callbackQueryId)) {
  console.log('⚠️ Already processed (deduplicated)');
  return res.status(200).json({ 
    success: true, 
    message: 'Already processed' 
  });
}

// Mark as processed (expires in 5 minutes)
processedCallbacks.set(callbackQueryId, Date.now());
setTimeout(() => processedCallbacks.delete(callbackQueryId), 300000);
```

**Neden Gerekli?**
- Telegram cevap almazsa mesajı tekrar gönderir
- Aynı buton 10 kere basılmış gibi işlenebilir
- Bu mekanizma tekrarları engeller

### 2. HEMEN ACK Gönderme

```javascript
// ÖNCE: Telegram'a "alındı" de
await fetch(`https://api.telegram.org/bot${TOKEN}/answerCallbackQuery`, {
  method: 'POST',
  body: JSON.stringify({
    callback_query_id: callbackQueryId,
    text: '⏳ İşleniyor...'
  })
});

// SONRA: İşlemleri yap
await processCallback(...);
```

**Neden Gerekli?**
- Telegram 10 saniye içinde cevap bekler
- Cevap gelmezse mesajı tekrar gönderir
- HEMEN ACK → Telegram bilir ki "alındı, bekle"

### 3. Status Validation (Double-Check)

```javascript
// Status kontrolü - KESİNLİKLE gerekli!
if (action === 'approve' && digest.status !== 'pending') {
  await sendTelegramMessage(
    '❌ Bu digest zaten paylaşılmış!\n' +
    'Tekrar paylaşılamaz.'
  );
  return res.status(200).json({ 
    success: false, 
    message: 'Already posted' 
  });
}
```

**Neden Gerekli?**
- Kullanıcı butona 2 kere basabilir
- Aynı digest 2 kere paylaşılmasın
- n8n'de de aynı kontrol yapılır (double-check)

### 4. Rate Limiting

```javascript
const rateLimitCache = new Map();

function checkRateLimit(userId, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const requests = rateLimitCache.get(userId) || [];
  
  // Son 1 dakikadaki istekleri say
  const recentRequests = requests.filter(time => now - time < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    return false; // Rate limit aşıldı
  }
  
  recentRequests.push(now);
  rateLimitCache.set(userId, recentRequests);
  return true;
}
```

**Neden Gerekli?**
- Spam önleme
- Telegram API limit'ini aşmama
- Vercel function execution limit'i

---

## 🔄 n8n Hesap Değişikliği: Ne Oluyor?

### Eski n8n Hesabı

```
Eski n8n webhook URL:
https://old-n8n.app.n8n.cloud/webhook/linkedin-digest
         ^^^
         Bu artık çalışmıyor!
```

### Sorun

```
1. Telegram hala ESKİ URL'i kullanıyor
   ↓
2. Vercel'deki N8N_LINKEDIN_WORKFLOW_WEBHOOK
   hala ESKİ URL'i gösteriyor
   ↓
3. Mesajlar gelince Vercel ESKİ URL'e forward ediyor
   ↓
4. ESKİ n8n cevap vermiyor → 500 error
   ↓
5. Telegram tekrar göndermeye çalışıyor
   ↓
6. Mesajlar kuyrukta SIKIŞıyor (pending updates)
```

### Çözüm: npm run telegram:reset

```
1. Pending updates'leri SİL
   (drop_pending_updates: true)
   ↓
2. Webhook'u YENİDEN KUR
   ↓
3. Vercel'de N8N_LINKEDIN_WORKFLOW_WEBHOOK'u GÜNCELLE
   ↓
4. Vercel'i YENİDEN DEPLOY et
   ↓
5. Test et: /menu
   ↓
6. ✅ Çalışıyor!
```

---

## 📋 Komutlar ve Ne Yaptıkları

### `npm run telegram:check`

```bash
# Mevcut durumu gösterir (hiçbir değişiklik yapmaz)
📊 Current Webhook Status:
   URL: https://cemkoyluoglu.codes/api/telegram-webhook
   Pending Updates: 23  ← SORUN VAR!
   Last Error: Wrong response from the webhook: 500
   Last Error Date: 2025-01-14 15:30:00
```

**Ne zaman kullanılır?**
- Günlük kontrol için
- Sorun olup olmadığını anlamak için
- Deploy sonrası doğrulama için

---

### `npm run telegram:reset`

```bash
# FULL RESET - Tüm kuyruğu temizler
🚀 TELEGRAM WEBHOOK RESET & CLEANUP

📋 Step 1: Checking current webhook status...
   Pending Updates: 47 ❌

📋 Step 2: Deleting webhook and clearing queue...
✅ Webhook deleted successfully!
✅ All pending updates cleared!

📋 Step 3: Verifying queue is clear...
   Pending Updates: 0 ✅

📋 Step 4: Setting up new webhook...
✅ Webhook set successfully!

📋 Step 5: Final verification...
   URL: https://cemkoyluoglu.codes/api/telegram-webhook
   Pending Updates: 0 ✅
   Last Error: None ✅

✅ WEBHOOK RESET COMPLETED SUCCESSFULLY!
```

**Ne zaman kullanılır?**
- Yeni n8n hesabına geçince
- Pending updates 10'dan fazla olunca
- Mesajlar cevap almamaya başlayınca
- Her büyük n8n değişikliğinden sonra

---

### `npm run telegram:webhook-setup`

```bash
# İlk kurulum için (sadece webhook'u kurar)
🔧 Setting up Telegram webhook...
✅ Webhook set successfully!
```

**Ne zaman kullanılır?**
- İlk kez webhook kurulumu
- Webhook tamamen silinmişse

---

### `npm run telegram:webhook-remove`

```bash
# Webhook'u tamamen kaldırır (polling mode'a geçer)
🗑️ Removing Telegram webhook...
✅ Webhook removed successfully!
```

**Ne zaman kullanılır?**
- Test için polling mode'a geçmek istersen
- Webhook'u geçici olarak devre dışı bırakmak için

---

## 🎓 Best Practices

### 1. Her n8n Değişikliğinde

```bash
# n8n'de değişiklik yaptınız
# Workflow'u deactive → edit → active yaptınız

# HEMEN SONRA:
npm run telegram:reset
```

### 2. Günlük Kontrol

```bash
# Her gün bir kontrol edin
npm run telegram:check

# Eğer pending updates > 10 ise:
npm run telegram:reset
```

### 3. Yeni n8n Hesabı

```bash
# 1. n8n'de workflow'u import et ve aktif et
# 2. Webhook URL'ini kopyala
# 3. .env'i güncelle
# 4. Vercel'i güncelle
# 5. Reset at
npm run telegram:reset
# 6. Test et
/menu
```

### 4. Deploy Sonrası

```bash
# Vercel'de deployment yapıldı
# Sonra:
npm run telegram:reset
# Test et
/menu
```

---

## 🐛 Debug: Sorun Giderme Akışı

```
Bot cevap vermiyor mu?
│
├─ 1. Webhook durumunu kontrol et
│     npm run telegram:check
│     │
│     ├─ Pending updates > 0 mı?
│     │   └─ npm run telegram:reset
│     │
│     └─ Last error var mı?
│         └─ Vercel logs'a bak
│             https://vercel.com/your-project/logs
│
├─ 2. Vercel env vars doğru mu?
│     https://vercel.com/your-project/settings/environment-variables
│     │
│     ├─ TELEGRAM_BOT_TOKEN ✅
│     ├─ TELEGRAM_CHAT_ID ✅
│     ├─ N8N_LINKEDIN_WORKFLOW_WEBHOOK ✅
│     └─ NEXT_PUBLIC_SUPABASE_URL ✅
│
├─ 3. n8n workflow aktif mi?
│     n8n dashboard → Workflows → Active? ✅
│
└─ 4. Test et
      /menu
      │
      ├─ Çalışıyor ✅
      └─ Hala çalışmıyor ❌
          └─ npm run telegram:reset (tekrar)
```

---

## 💡 Özet: Sistemin Gücü

### Eski Sistem
- ❌ Her değişiklikte manuel düzeltme
- ❌ Mesajlar sıkışınca çözüm yok
- ❌ n8n değişikliği = sorun

### Yeni Sistem
- ✅ Tek komut: `npm run telegram:reset`
- ✅ Otomatik kuyruk temizleme
- ✅ Güvenlik mekanizmaları (deduplication, rate limit, status check)
- ✅ Detaylı raporlama
- ✅ Her durumda çalışır

---

## 📚 İlgili Belgeler

- [TELEGRAM_RESET_GUIDE.md](./TELEGRAM_RESET_GUIDE.md) - Detaylı rehber
- [QUICK_FIX_TELEGRAM.md](./QUICK_FIX_TELEGRAM.md) - Hızlı çözüm
- [N8N_UNIFIED_WORKFLOW_GUIDE.md](./N8N_UNIFIED_WORKFLOW_GUIDE.md) - n8n workflow
- [LINKEDIN_DIGEST_SYSTEM.md](./LINKEDIN_DIGEST_SYSTEM.md) - LinkedIn sistem

---

**🎉 Artık Telegram webhook'larınız asla sıkışmayacak!**

