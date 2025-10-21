# 🔥 VERCEL'DE EKSİK ENVIRONMENT VARIABLE'LAR

## ⚠️ KRİTİK - BOT İÇİN ZORUNLU

Bu variable'lar **mutlaka** Vercel'e eklenmelidir, yoksa bot çalışmaz:

### 1️⃣ TELEGRAM_BOT_TOKEN
```
TELEGRAM_BOT_TOKEN=8205865020:AAGuLidnG6oS9GBQOW635fVlXGu-hX7mXVU
```
- **Nerede kullanılıyor:** `/api/telegram-webhook.js`, `/scripts/telegram-menu-handler.js`
- **Neden gerekli:** Telegram bot ile iletişim için

### 2️⃣ TELEGRAM_CHAT_ID
```
TELEGRAM_CHAT_ID=1925139795
```
- **Nerede kullanılıyor:** `/api/telegram-webhook.js`, `/scripts/telegram-menu-handler.js`
- **Neden gerekli:** Mesaj gönderilecek chat ID

### 3️⃣ N8N_LINKEDIN_WORKFLOW_WEBHOOK
```
N8N_LINKEDIN_WORKFLOW_WEBHOOK=https://your-n8n-instance.app.n8n.cloud/webhook/linkedin-digest
```
- **Nerede kullanılıyor:** `/api/telegram-webhook.js` (line 385), `/scripts/telegram-menu-handler.js` (line 644)
- **Neden gerekli:** LinkedIn digest oluşturma ve callback'ler için

---

## 📊 MANUEL HABER EKLEMESİ İÇİN GEREKLİ

Manuel haber ekleme özelliği için:

### 4️⃣ GITHUB_TOKEN
```
GITHUB_TOKEN=ghp_your_token_here
```
- **Nerede kullanılıyor:** `/scripts/telegram-menu-handler.js` (line 728)
- **Neden gerekli:** GitHub Actions workflow'unu tetiklemek için

### 5️⃣ GITHUB_REPOSITORY
```
GITHUB_REPOSITORY=CemRoot/My-Site
```
- **Nerede kullanılıyor:** `/scripts/telegram-menu-handler.js` (line 729)
- **Neden gerekli:** GitHub repository bilgisi

---

## ✅ MEVCUT (KONTROL ET)

Bu variable'lar zaten Vercel'de var, ama doğru değerlerde olduklarından emin ol:

- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- ✅ `GROQ_API_KEY` - Groq AI API key (optional for chat widget)

---

## 🔧 NASIL EKLENİR?

1. **Vercel Dashboard'a git:**
   https://vercel.com/your-team/cemkoyluoglu-codes/settings/environment-variables

2. **Her variable için:**
   - "Add" butonuna tıkla
   - Name: `VARIABLE_NAME`
   - Value: `actual_value`
   - Environment: **All Environments** (Production, Preview, Development)
   - Save

3. **Deployment yenile:**
   ```bash
   # Vercel CLI ile (veya Dashboard'dan "Redeploy")
   vercel --prod
   ```

4. **Test et:**
   - Telegram'dan `/menu` gönder
   - Bot'un cevap verdiğini gör

---

## 🚨 GÜVENLİK NOTU

- **ASLA** bu token'ları GitHub'a commit etme
- **ASLA** screenshot'larda paylaşma
- Her 90 günde bir rotate et
- 2FA aktif et tüm servislerde

---

## 📝 CHECKLIST

Vercel'e ekledikten sonra işaretle:

- [ ] `TELEGRAM_BOT_TOKEN`
- [ ] `TELEGRAM_CHAT_ID`
- [ ] `N8N_LINKEDIN_WORKFLOW_WEBHOOK`
- [ ] `GITHUB_TOKEN`
- [ ] `GITHUB_REPOSITORY`
- [ ] Redeploy yapıldı
- [ ] `/menu` ile test edildi
- [ ] Manuel haber ekleme test edildi
- [ ] LinkedIn digest test edildi

---

## 🎯 SONRAKI ADIM

Tüm variable'ları ekledikten sonra:

```bash
# Test et
curl -X POST "https://api.telegram.org/bot8205865020:AAGuLidnG6oS9GBQOW635fVlXGu-hX7mXVU/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "1925139795",
    "text": "🧪 Bot test - Webhook aktif!"
  }'
```

Sonra Telegram'dan `/menu` komutunu gönder!

