# 🚨 ACIL: Telegram Webhook Sorunu Çözümü

## Durum
Yeni n8n hesabına geçtiniz ve Telegram mesajları kuyrukta sıkıştı.

## Hızlı Çözüm (5 Dakika)

### Adım 1: .env Dosyasını Doldurun

```bash
# .env dosyasını açın ve doldurun:
TELEGRAM_BOT_TOKEN=your_actual_bot_token
TELEGRAM_CHAT_ID=your_actual_chat_id
N8N_LINKEDIN_WORKFLOW_WEBHOOK=https://your-new-n8n-instance.app.n8n.cloud/webhook/linkedin-digest
```

**n8n webhook URL'inizi nasıl bulursunuz?**
1. n8n hesabınıza giriş yapın
2. LinkedIn workflow'unuzu açın
3. "Webhook Trigger (Manual + Callbacks)" node'una tıklayın
4. **Production URL** kısmını kopyalayın

### Adım 2: Vercel'i Güncelleyin

```bash
# Terminal'de:
cd /Users/dr.sam/Desktop/My-Site

# Vercel CLI ile env variable ekleyin (eğer yüklüyse):
vercel env add N8N_LINKEDIN_WORKFLOW_WEBHOOK

# VEYA Manuel:
# 1. https://vercel.com/dashboard adresine gidin
# 2. Projeniz > Settings > Environment Variables
# 3. N8N_LINKEDIN_WORKFLOW_WEBHOOK ekleyin/güncelleyin
# 4. Save > Redeploy
```

### Adım 3: Telegram Webhook'u Resetleyin

```bash
# Önce kontrol edin
npm run telegram:check

# Sonra resetleyin (TÜM pending updates temizlenir)
npm run telegram:reset
```

### Adım 4: Test Edin

Telegram'da botunuza mesaj gönderin:
```
/menu
```

✅ Bot cevap verirse başarılı!

## Sorun Hala Devam Ederse

### Kontrol Listesi:

```bash
# 1. Vercel env vars doğru mu?
echo "Check: https://vercel.com/your-project/settings/environment-variables"

# 2. n8n workflow aktif mi?
echo "Check: n8n dashboard > Workflows > LinkedIn Digest > Active"

# 3. Webhook URL doğru mu?
npm run telegram:check

# 4. Pending updates var mı?
npm run telegram:check
# Eğer Pending Updates > 0 ise:
npm run telegram:reset

# 5. Vercel deployment başarılı mı?
echo "Check: https://vercel.com/your-project/deployments"
```

### Acil Durum: Her Şeyi Sıfırla

```bash
# Webhook'u tamamen kaldır
npm run telegram:webhook-remove

# 10 saniye bekle
sleep 10

# Yeni webhook kur
npm run telegram:webhook-setup

# Durumu kontrol et
npm run telegram:check

# Telegram'da test et
# /menu
```

## Vercel'de Yeniden Deploy

```bash
# Boş commit ile yeniden deploy tetikle
git commit --allow-empty -m "fix: trigger redeploy for new n8n webhook"
git push origin main

# Deploy tamamlanana kadar bekleyin (2-3 dakika)
# Sonra webhook'u resetleyin:
npm run telegram:reset
```

## Başarı Kriterleri

✅ `npm run telegram:check` çıktısı:
```
📊 Current Webhook Status:
   URL: https://cemkoyluoglu.codes/api/telegram-webhook
   Pending Updates: 0 ✅
   Last Error: None ✅
```

✅ `/menu` komutu çalışıyor
✅ Butonlara basınca cevap geliyor  
✅ n8n'de execution'lar görünüyor

## İletişim İçin

- Telegram webhook logs: https://vercel.com/your-project/logs
- n8n execution logs: n8n dashboard > Executions
- Full guide: [TELEGRAM_RESET_GUIDE.md](./TELEGRAM_RESET_GUIDE.md)

