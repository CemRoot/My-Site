# 🔔 Deployment Webhook Kurulum Rehberi

## 📋 Genel Bakış

Vercel deployment durumunu (başarılı, hatalı, iptal edildi) Telegram'a otomatik bildirmek için webhook sistemi kuruldu.

### Özellikler:
- ✅ Gerçek deployment durumu bildirimleri
- ✅ Build ve deployment ayrı mesajlar
- ❌ Error durumunda özel uyarı mesajı
- ⚙️ Build başladı/tamamlandı bildirimleri
- 🔗 Commit bilgileri ve linkler

---

## 🚀 Kurulum (Tamamlandı)

### ✅ Yapılanlar:

1. **Webhook endpoint oluşturuldu:** `api/deployment-webhook.js`
2. **Post-build script güncellendi:** Build ve deployment mesajları ayrıldı
3. **Webhook secret eklendi:** `DEPLOYMENT_WEBHOOK_SECRET`
4. **Dokümantasyon eklendi**

---

## 🔧 Vercel'de Webhook Ayarlama

### Manuel Kurulum Gerekli:

1. **Vercel Dashboard'a gidin:** https://vercel.com/dashboard
2. **Projenizi seçin:** my-portfolio
3. **Settings** → **Git** → **Deploy Hooks**
4. **Create Hook:**
   ```
   Name: Deployment Status Webhook
   Git Branch: main
   ```
5. Oluşan URL'yi not edin

6. **Alternatif: Webhooks Integration kullanın**
   - Settings → Integrations → Webhooks
   - Add webhook URL:
     ```
     https://cemkoyluoglu.codes/api/deployment-webhook?secret=fb71eba206124f445d4c3f1cedafd93b2cff96f895da17af17cf4650e7f2ee86
     ```
   - Events: `deployment.created`, `deployment.succeeded`, `deployment.failed`

---

## 📊 Mesaj Formatları

### ⚙️ Build Tamamlandı
```
⚙️ BUILD TAMAMLANDI

✅ Build süreci başarıyla tamamlandı
⏰ 22.10.2025 00:15:30
🔗 https://my-portfolio-xyz.vercel.app
📦 feat: Add deployment webhook

Bot menüsü güncellendi - /menu
⏳ Deployment durumu ayrıca bildirilecek...
```

### 🎉 Deployment Başarılı
```
🎉 DEPLOYMENT BAŞARILI

✅ Production deploy tamamlandı
⏰ 22.10.2025 00:15:45
🔗 https://my-portfolio-xyz.vercel.app
📝 feat: Add deployment webhook
🔖 Commit: dcb86f8

Site başarıyla güncellendi! 🚀
```

### ❌ Deployment Hatası
```
❌ DEPLOYMENT HATASI

🚨 Production deploy başarısız oldu
⏰ 22.10.2025 00:15:45
🔗 https://my-portfolio-xyz.vercel.app
📝 fix: Some bug fix
🔖 Commit: abc1234

Lütfen Vercel dashboard'da detayları kontrol edin.
https://vercel.com/my-portfolio
```

---

## 🧪 Test

### Manuel Test:

```bash
curl -X POST "https://cemkoyluoglu.codes/api/deployment-webhook?secret=fb71eba206124f445d4c3f1cedafd93b2cff96f895da17af17cf4650e7f2ee86" \
  -H "Content-Type: application/json" \
  -d '{
    "deployment": {
      "state": "READY",
      "url": "cemkoyluoglu.codes",
      "createdAt": "2025-10-22T00:00:00Z",
      "meta": {
        "githubCommitMessage": "Test webhook",
        "githubCommitSha": "test123"
      }
    },
    "project": {
      "name": "my-portfolio"
    }
  }'
```

---

## 🔒 Güvenlik

**Webhook Secret:**
```
fb71eba206124f445d4c3f1cedafd93b2cff96f895da17af17cf4650e7f2ee86
```

⚠️ **Bu secret'ı güvenli tutun! Webhook URL'de query parameter olarak kullanın.**

---

## 📁 Dosyalar

- `api/deployment-webhook.js` - Webhook handler
- `scripts/post-build-telegram.js` - Build notification script
- `docs/DEPLOYMENT_WEBHOOK_SETUP.md` - Bu dosya

---

🎯 **Sonraki Adım:** Vercel dashboard'da webhook'u configure edin!
