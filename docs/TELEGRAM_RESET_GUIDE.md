# 🔄 Telegram Webhook Reset Rehberi

## 🎯 Ne Zaman Kullanılır?

Bu rehberi şu durumlarda kullanın:

- ✅ Yeni bir n8n hesabına geçiş yaptığınızda
- ✅ Telegram mesajları kuyrukta sıkıştığında
- ✅ Webhook değişikliklerinden sonra mesajlar gelmediğinde
- ✅ n8n workflow'unu yeniden aktif ettiğinizde
- ✅ Pending updates 10'dan fazla olduğunda

## 🚀 Hızlı Çözüm (3 Adım)

### 1️⃣ Mevcut Durumu Kontrol Et

```bash
npm run telegram:check
```

Bu komut size şunları gösterir:
- ✅ Webhook URL'i
- ✅ Pending updates sayısı
- ✅ Son hata mesajı (varsa)
- ✅ Webhook ayarları

### 2️⃣ Webhook'u Resetle ve Kuyruğu Temizle

```bash
npm run telegram:reset
```

Bu komut:
- 🗑️ Eski webhook'u siler
- 🧹 TÜM pending updates'leri temizler
- 🔧 Yeni webhook'u kurar
- ✅ Durumu doğrular

### 3️⃣ Test Et

Telegram botunuza bir mesaj gönderin:
```
/menu
```

Eğer bot cevap verirse ✅ başarılı!

---

## 🔧 Yeni n8n Hesabına Geçiş

Yeni n8n hesabına geçiş yaptıysanız şu adımları takip edin:

### Adım 1: Yeni n8n Webhook URL'ini Al

1. n8n'de workflow'unuzu açın
2. "Webhook Trigger (Manual + Callbacks)" node'una tıklayın
3. Production URL'i kopyalayın:
   ```
   https://your-n8n-instance.app.n8n.cloud/webhook/linkedin-digest
   ```

### Adım 2: Vercel Environment Variable'ını Güncelle

1. [Vercel Dashboard](https://vercel.com/dashboard)'a gidin
2. Projenizi seçin
3. `Settings` > `Environment Variables` bölümüne gidin
4. `N8N_LINKEDIN_WORKFLOW_WEBHOOK` değişkenini bulun
5. **Edit** butonuna tıklayın
6. Yeni webhook URL'ini yapıştırın
7. **Save** butonuna tıklayın
8. **ÖNEMLI:** Değişikliğin etkili olması için yeniden deploy gerekebilir:
   ```bash
   # Vercel'de otomatik deploy için:
   git commit --allow-empty -m "Trigger deploy for new n8n webhook"
   git push
   ```

### Adım 3: Telegram Webhook'u Resetle

```bash
npm run telegram:reset
```

### Adım 4: n8n Workflow'unu Aktif Et

1. n8n'de workflow'unuzu açın
2. Sağ üstteki **Inactive** butonuna tıklayın
3. **Active** yapın

### Adım 5: Test Et

```bash
# Telegram'da test et
/menu

# Veya webhook'u doğrudan test et
npm run test:webhook
```

---

## 📊 Sorun Giderme

### ❌ Sorun: "Pending Update Count: 50+"

**Çözüm:**
```bash
npm run telegram:reset
```
Bu komut TÜM pending updates'leri temizler.

---

### ❌ Sorun: "Last Error: Wrong response from the webhook: 500"

**Sebep:** Vercel'deki webhook endpoint'i hata veriyor.

**Çözüm:**
1. Vercel loglarını kontrol edin:
   ```
   https://vercel.com/your-project/deployments
   ```
2. `N8N_LINKEDIN_WORKFLOW_WEBHOOK` doğru mu kontrol edin
3. n8n workflow'u aktif mi kontrol edin
4. Sonra webhook'u resetleyin:
   ```bash
   npm run telegram:reset
   ```

---

### ❌ Sorun: "URL: (empty) - NO WEBHOOK SET"

**Sebep:** Webhook hiç kurulmamış.

**Çözüm:**
```bash
npm run telegram:webhook-setup
```

---

### ❌ Sorun: Bot mesajlara hala cevap vermiyor

**Çözüm Adımları:**

1. **Telegram Bot Token'ı kontrol et:**
   ```bash
   # .env dosyasında
   TELEGRAM_BOT_TOKEN=your_token_here
   ```

2. **Chat ID doğru mu kontrol et:**
   ```bash
   # .env dosyasında
   TELEGRAM_CHAT_ID=your_chat_id
   ```

3. **Vercel Environment Variables'ları kontrol et:**
   - `TELEGRAM_BOT_TOKEN` ✅
   - `TELEGRAM_CHAT_ID` ✅
   - `N8N_LINKEDIN_WORKFLOW_WEBHOOK` ✅
   - `NEXT_PUBLIC_SUPABASE_URL` ✅
   - `SUPABASE_SERVICE_ROLE_KEY` ✅

4. **Webhook'u resetle:**
   ```bash
   npm run telegram:reset
   ```

5. **Vercel deployment loglarını kontrol et:**
   ```
   https://vercel.com/your-project/deployments/latest
   ```

---

## 🎓 Gelişmiş Kullanım

### Manuel Webhook Kontrolü

```bash
# Mevcut webhook bilgisini al
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"

# Webhook'u manuel sil (pending updates'leri TUT)
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook"

# Webhook'u manuel sil (pending updates'leri SİL)
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook" \
  -H "Content-Type: application/json" \
  -d '{"drop_pending_updates": true}'

# Yeni webhook kur
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://cemkoyluoglu.codes/api/telegram-webhook",
    "allowed_updates": ["callback_query", "message"],
    "drop_pending_updates": true
  }'
```

### Script Komutları

```bash
# Tam reset (önerilen)
npm run telegram:reset

# Sadece durum kontrolü
npm run telegram:check

# Webhook kur (ilk kurulum için)
npm run telegram:webhook-setup

# Webhook'u tamamen kaldır
npm run telegram:webhook-remove

# Yardım
node scripts/reset-telegram-webhook.js help
```

---

## 📋 Checklist: Yeni n8n Hesabı Kurulumu

- [ ] Yeni n8n hesabı oluşturuldu
- [ ] n8n workflow import edildi
- [ ] n8n workflow aktif edildi
- [ ] Production webhook URL'i kopyalandı
- [ ] Vercel'de `N8N_LINKEDIN_WORKFLOW_WEBHOOK` güncellendi
- [ ] Vercel'de deployment yapıldı
- [ ] `npm run telegram:reset` çalıştırıldı
- [ ] `/menu` komutuyla test edildi
- [ ] `npm run telegram:check` ile doğrulandı
- [ ] Pending updates = 0 olarak görünüyor

---

## 💡 En İyi Pratikler

1. **Her n8n değişikliğinden sonra:**
   ```bash
   npm run telegram:reset
   ```

2. **Günlük kontrol:**
   ```bash
   npm run telegram:check
   ```

3. **Pending updates 10'u geçerse hemen:**
   ```bash
   npm run telegram:reset
   ```

4. **Environment variable değişikliklerinden sonra:**
   - Vercel'de yeniden deploy
   - Webhook reset

5. **Bot cevap vermiyorsa sırasıyla:**
   - n8n workflow aktif mi?
   - Vercel env vars doğru mu?
   - Pending updates var mı?
   - Webhook URL doğru mu?

---

## 🆘 Acil Durum: Her Şeyi Sıfırla

Eğer hiçbir şey çalışmıyorsa, her şeyi sıfırla:

```bash
# 1. Webhook'u tamamen kaldır
npm run telegram:webhook-remove

# 2. 10 saniye bekle
sleep 10

# 3. Yeni webhook kur ve testi yap
npm run telegram:webhook-setup

# 4. Durumu kontrol et
npm run telegram:check

# 5. Test et
# Telegram'da: /menu
```

---

## 📞 Destek

Sorun devam ederse:

1. **Vercel Logs:** https://vercel.com/your-project/deployments
2. **n8n Execution Logs:** n8n dashboard > Executions
3. **Telegram Bot Logs:** Vercel > Functions > `telegram-webhook`
4. **Webhook Info:** `npm run telegram:check`

---

## 🎉 Başarı Kriterleri

Webhook başarıyla çalışıyorsa:

✅ `npm run telegram:check` çıktısı:
```
📊 Current Webhook Status:
   URL: https://cemkoyluoglu.codes/api/telegram-webhook
   Pending Updates: 0 ✅
   Last Error: None ✅
   Max Connections: 40
   Allowed Updates: ["callback_query","message"]
```

✅ Telegram'da `/menu` komutu çalışıyor
✅ Butonlara basılınca cevap geliyor
✅ n8n'de execution'lar görünüyor

---

## 📚 İlgili Belgeler

- [N8N_UNIFIED_WORKFLOW_GUIDE.md](./N8N_UNIFIED_WORKFLOW_GUIDE.md)
- [LINKEDIN_DIGEST_SYSTEM.md](./LINKEDIN_DIGEST_SYSTEM.md)
- [VERCEL_ENV_CHECKLIST.md](./VERCEL_ENV_CHECKLIST.md)
- [DEPLOYMENT_WEBHOOK_SETUP.md](./DEPLOYMENT_WEBHOOK_SETUP.md)

---

**Son Güncelleme:** 2025-01-14
**Versiyon:** 1.0.0

