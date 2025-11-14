# 🤖 n8n Trial Management System

## 📋 Genel Bakış

Bu sistem, n8n deneme sürenizi (14 gün) otomatik olarak takip eder ve Telegram üzerinden yönetmenizi sağlar. Artık bilgisayarınıza erişiminiz olmasa bile tüm işlemleri Telegram'dan yapabilirsiniz!

## 🎯 Özellikler

✅ **Otomatik Deneme Takibi**
- Her gün 09:00 UTC'de otomatik kontrol
- Kalan gün bilgisi
- Uyarı mesajları (3 gün kala)
- Süre bitince "Yeniden Başlat" butonu

✅ **Telegram Entegrasyonu**
- Telegram'dan n8n durumu görüntüleme
- Trial süresi sıfırlama
- Webhook reset işlemi
- Tüm işlemler GitHub Actions ile

✅ **Webhook Yönetimi**
- Telegram'dan webhook reset
- Kuyrukta sıkışan mesajları temizleme
- Bilgisayar erişimi gerekmez

## 🚀 Hızlı Başlangıç

### 1. Supabase Kurulumu

İlk olarak Supabase'de `system_settings` tablosunu oluşturun:

```bash
# Supabase SQL Editor'da çalıştırın:
# docs/supabase-schema.sql dosyasındaki system_settings bölümünü
```

Veya:

```sql
-- Sadece system_settings tablosu
CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initial data
INSERT INTO system_settings (setting_key, setting_value, description, updated_by) VALUES
  ('n8n_trial_start_date', '2025-01-14', 'n8n trial başlangıç tarihi (14 günlük deneme)', 'system'),
  ('n8n_trial_duration_days', '14', 'n8n deneme süresi (gün cinsinden)', 'system'),
  ('webhook_last_reset_date', '2025-01-14', 'Telegram webhook son reset tarihi', 'system')
ON CONFLICT (setting_key) DO NOTHING;
```

### 2. GitHub Secrets Kontrolü

Bu environment variable'ların GitHub Secrets'ta olduğundan emin olun:

- ✅ `TELEGRAM_BOT_TOKEN`
- ✅ `TELEGRAM_CHAT_ID`
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `GITHUB_TOKEN` (otomatik olarak mevcuttur)

### 3. İlk Test

Telegram'da `/menu` yazın ve yeni "Sistem Yönetimi" butonunu test edin!

## 📱 Telegram'dan Kullanım

### Ana Menü

```
/menu
```

Yeni organize edilmiş menüde:
- 📰 İçerik Yönetimi
- 📱 LinkedIn
- **🔧 Sistem Yönetimi** [YENİ!]
- 📊 Raporlar
- ℹ️ Yardım

### Sistem Yönetimi Menüsü

**🔧 Sistem Yönetimi** butonuna basarak:

#### 1. 🤖 n8n Durumu
- Kalan gün bilgisi
- İlerleme çubuğu
- Geçen/kalan gün detayları
- Süre bitince "Yeniden Başlat" butonu

#### 2. 🔄 Webhook Reset
- GitHub Actions ile otomatik reset
- Kuyrukta sıkışan mesajları temizler
- Bilgisayara erişim gerekmez
- 1-2 dakikada tamamlanır

#### 3. 🏥 Sağlık Kontrolü
- Tüm sistemleri kontrol eder
- API durumları
- Veritabanı bağlantısı

#### 4. 🔧 GitHub Actions
- Workflow durumları
- Manuel tetikleme

## 🔧 Terminal'den Kullanım

### n8n Trial Komutları

```bash
# Durum kontrolü (sadece göster, bildirim gönderme)
npm run n8n:status

# Kontrol et ve Telegram'a bildirim gönder
npm run n8n:check

# Trial süresini sıfırla (yeni 14 gün başlat)
npm run n8n:reset
```

### Webhook Komutları

```bash
# Webhook durumu kontrol et
npm run telegram:check

# Webhook'u resetle (kuyruk temizle)
npm run telegram:reset
```

## 🤖 Otomatik Sistemler

### 1. Günlük Trial Kontrolü

**GitHub Action:** `n8n-trial-tracker.yml`
- **Çalışma:** Her gün 09:00 UTC
- **Ne yapar:**
  - Kalan günleri hesaplar
  - Uygun mesajı Telegram'a gönderir
  - 3 gün kala uyarı verir
  - Süre bitince "Yeniden Başlat" butonu ekler

**Log'lar:** GitHub Actions > n8n Trial Tracker

### 2. Manuel Tetikleme

Her iki GitHub Action da Telegram'dan tetiklenebilir:

```
Telegram > Sistem Yönetimi > n8n Durumu  → n8n-trial-tracker.yml
Telegram > Sistem Yönetimi > Webhook Reset → telegram-webhook-reset.yml
```

## 📊 Bildirim Senaryoları

### Scenario 1: Normal Durum (Kalan > 3 gün)

```
✅ n8n Deneme Süresi Durumu

📅 Tarih Bilgileri:
Başlangıç: 2025-01-14
Bitiş: 2025-01-28
Toplam süre: 14 gün

📊 İlerleme:
▓▓▓▓░░░░░░ 42%
✅ Geçen: 6 gün
⏳ Kalan: 8 gün

🔔 Durum:
✅ Her şey yolunda! 8 gün kaldı.

💚 Her şey yolunda!
```

### Scenario 2: Uyarı (Kalan ≤ 3 gün)

```
⚠️ n8n Deneme Süresi Uyarısı

📊 Durum:
⏳ Kalan: 2 gün
✅ Geçen: 12 gün

💡 Hatırlatma:
Deneme süreniz 2 gün içinde sona erecek. 
Yeni n8n hesabı için hazırlık yapmayı unutmayın.
```

### Scenario 3: Kritik (Kalan ≤ 1 gün)

```
⚠️ n8n DENEME SÜRESİ YARIN BİTİYOR!

🚨 ACİL! Yeni n8n hesabı için hazırlık yapın:
1. Yeni n8n hesabı oluşturun
2. Workflow'u export edin
3. Yeni hesaba import edin
4. Webhook URL'lerini güncelleyin
```

### Scenario 4: Süresi Dolmuş (Kalan ≤ 0)

```
🚨 n8n DENEME SÜRESİ BİTTİ!

📊 Durum:
❌ Deneme süresi 2 gün önce sona erdi

⚠️ Yapılması Gerekenler:
1. Yeni n8n hesabı oluştur
2. Workflow'u yeni hesaba aktar
3. Vercel'de webhook URL'ini güncelle
4. Aşağıdaki butona basarak deneme süresini sıfırla

[🔄 14 Günü Yeniden Başlat] [📊 Detaylı Durum]
```

## 🔄 Yeni n8n Hesabına Geçiş

### Adım Adım Rehber

#### 1. Yeni n8n Hesabı Oluştur
```
https://n8n.io → Sign Up
```

#### 2. Eski Workflow'u Export Et
```
Eski n8n → Workflow → ... → Download
```

#### 3. Yeni Hesaba Import Et
```
Yeni n8n → Import from File → n8n-linkedin-unified-workflow.json
```

#### 4. Webhook URL'ini Kopyala
```
Yeni n8n → Webhook Trigger node → Production URL
Örnek: https://new-n8n.app.n8n.cloud/webhook/linkedin-digest
```

#### 5. Vercel'i Güncelle
```
Vercel Dashboard → Settings → Environment Variables
N8N_LINKEDIN_WORKFLOW_WEBHOOK = yeni_url
Save → Redeploy
```

#### 6. Telegram Webhook'u Resetle
```
Telegram → Sistem Yönetimi → Webhook Reset
```

#### 7. Trial Süresini Sıfırla
```
Telegram → Sistem Yönetimi → n8n Durumu → 14 Günü Yeniden Başlat
```

#### 8. Test Et
```
Telegram → /menu → LinkedIn → Create Digest
```

## 🛠️ Sorun Giderme

### Sorun 1: "n8n Durumu Alınamadı"

**Sebep:** Supabase bağlantı sorunu

**Çözüm:**
```bash
# 1. Supabase'de system_settings tablosu var mı?
SELECT * FROM system_settings;

# 2. Environment variables doğru mu?
# Vercel → Settings → Environment Variables
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY

# 3. Tabloyu oluştur
# docs/supabase-schema.sql → system_settings bölümü
```

### Sorun 2: "Webhook Reset Başlatılamadı"

**Sebep:** GITHUB_TOKEN eksik veya hatalı

**Çözüm:**
```bash
# GitHub Secrets'ta GITHUB_TOKEN var mı kontrol et
# (Normalde otomatik olmalı)

# Alternatif: Lokal reset
npm run telegram:reset
```

### Sorun 3: GitHub Action Çalışmıyor

**Sebep:** Secrets eksik

**Çözüm:**
```
GitHub → Settings → Secrets and Variables → Actions

Gerekli secrets:
- TELEGRAM_BOT_TOKEN
- TELEGRAM_CHAT_ID
- NEXT_PUBLIC_SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
```

### Sorun 4: Trial Sıfırlama Çalışmıyor

**Sebep:** Supabase RLS policies

**Çözüm:**
```sql
-- Supabase SQL Editor'da
-- system_settings tablosu için policies kontrol et
SELECT * FROM pg_policies WHERE tablename = 'system_settings';

-- Gerekirse policy'leri yeniden oluştur
-- docs/supabase-schema.sql'den
```

## 📈 En İyi Pratikler

### 1. Günlük Kontrol
```
Her gün Telegram'dan "n8n Durumu" kontrol edin
Özellikle kalan gün 7'nin altına düştüğünde
```

### 2. Yedekleme
```
Her hafta workflow'unuzu export edin
Lokal bilgisayarınızda saklayın
```

### 3. Hazırlık
```
Kalan 7 gün olunca:
- Yeni n8n hesabı oluşturun
- Workflow'u test edin
- Hazır olun
```

### 4. Smooth Transition
```
Son gün:
- Sabah yeni hesabı aktif edin
- Vercel'i güncelleyin
- Webhook'u resetleyin
- Trial'ı sıfırlayın
- Test edin
```

## 🔗 İlgili Belgeler

- [TELEGRAM_RESET_GUIDE.md](./TELEGRAM_RESET_GUIDE.md) - Webhook reset detaylı rehber
- [TELEGRAM_WEBHOOK_SYSTEM_EXPLAINED.md](./TELEGRAM_WEBHOOK_SYSTEM_EXPLAINED.md) - Sistem açıklamaları
- [N8N_UNIFIED_WORKFLOW_GUIDE.md](./N8N_UNIFIED_WORKFLOW_GUIDE.md) - n8n workflow rehberi
- [VERCEL_ENV_CHECKLIST.md](./VERCEL_ENV_CHECKLIST.md) - Environment variables

## 📊 Sistem Mimarisi

```
┌─────────────────────────────────────────────┐
│  GÜNLÜK OTOMAT İK KONTROL                   │
│  (Her gün 09:00 UTC)                        │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  GitHub Action: n8n-trial-tracker.yml       │
│  - Supabase'den tarihi al                   │
│  - Kalan günü hesapla                       │
│  - Telegram'a bildirim gönder               │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Supabase: system_settings                  │
│  - n8n_trial_start_date: 2025-01-14         │
│  - n8n_trial_duration_days: 14              │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  TELEGRAM MENÜSÜ                            │
│  Sistem Yönetimi > n8n Durumu               │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Vercel: api/telegram-webhook.js            │
│  - Callback'i al                            │
│  - Handler'ı çağır                          │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  scripts/telegram-menu-handler.js           │
│  - handleN8nStatusAction()                  │
│  - calculateRemainingDays()                 │
│  - Telegram'a mesaj gönder                  │
└─────────────────────────────────────────────┘
```

## 🎓 Sık Sorulan Sorular

### S: Trial süresi otomatik olarak sıfırlanır mı?
**C:** Hayır. Güvenlik için manuel olarak sıfırlamanız gerekir. Telegram'da butona basarak yapabilirsiniz.

### S: Bilgisayarıma erişimim yoksa ne yapabilirim?
**C:** Her şeyi Telegram'dan yapabilirsiniz! Webhook reset ve trial reset için GitHub Actions kullanılır.

### S: Günlük bildirimleri kapatabilir miyim?
**C:** Hayır, ama planı değiştirebilirsiniz:
```yaml
# .github/workflows/n8n-trial-tracker.yml
# Kalan gün > 3 olduğunda bildirim göndermeme mantığı eklenebilir
```

### S: Birden fazla n8n hesabı takip edebilir miyim?
**C:** Şu anda tek hesap destekleniyor. Çoklu hesap için `system_settings` tablosuna yeni kayıtlar eklenebilir.

### S: Trial süresi 14 günden farklı olabilir mi?
**C:** Evet! Supabase'de `n8n_trial_duration_days` değerini değiştirin:
```sql
UPDATE system_settings 
SET setting_value = '30' 
WHERE setting_key = 'n8n_trial_duration_days';
```

## 🎉 Özet

Artık n8n deneme sürenizi **hiçbir yere gitmeden** yönetebilirsiniz:

✅ Telegram'dan her şeyi kontrol edin
✅ Otomatik günlük takip
✅ GitHub Actions ile webhook reset
✅ Bilgisayar erişimi gereksiz
✅ Mesajlar asla kuyrukta sıkışmaz

**Kurulum:** 5 dakika
**Kullanım:** Telegram'dan tek buton
**Sorun:** Sıfır!

---

**Son Güncelleme:** 2025-01-14
**Versiyon:** 1.0.0

