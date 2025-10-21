# 🚨 Vercel Status Monitor Kurulum Rehberi

Vercel'de sorun olduğunda otomatik Telegram bildirimi alan sistem.

---

## 📋 ÖZELLİKLER

- ✅ **RSS Feed Monitoring:** Vercel status RSS'ini her 30 dakikada kontrol eder
- ✅ **Akıllı Bildirimler:** Sadece yeni incident'ler için bildirim gönderir (duplicate yok)
- ✅ **Detaylı Raporlar:** Incident başlığı, durum, güncellemeler
- ✅ **System Health Integration:** Günlük health check'lerde Vercel durumu da kontrol edilir
- ✅ **Supabase Tracking:** Bildirilen incident'ler kaydedilir (yineleme önleme)

---

## 🚀 KURULUM ADIMLARI

### 1️⃣ Supabase Tablosunu Oluştur

Supabase SQL Editor'da şu komutu çalıştır:

```sql
-- docs/vercel-status-schema.sql dosyasındaki SQL'i çalıştır
```

Veya direkt:

```sql
CREATE TABLE IF NOT EXISTS vercel_status_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id TEXT NOT NULL UNIQUE,
  incident_title TEXT NOT NULL,
  notified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vercel_status_incident_id ON vercel_status_notifications(incident_id);
CREATE INDEX idx_vercel_status_notified_at ON vercel_status_notifications(notified_at DESC);

ALTER TABLE vercel_status_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access"
  ON vercel_status_notifications FOR ALL
  USING (true) WITH CHECK (true);
```

---

### 2️⃣ Dependency Kur

```bash
npm install xml2js
```

(Zaten `package.json`'a eklendi, sadece `npm install` yeterli)

---

### 3️⃣ GitHub Secrets Kontrol Et

GitHub → Settings → Secrets → Actions:

- ✅ `TELEGRAM_BOT_TOKEN`
- ✅ `TELEGRAM_CHAT_ID`
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

(Bunlar zaten mevcut olmalı)

---

### 4️⃣ GitHub Actions Workflow'unu Aktifleştir

Workflow dosyası zaten eklendi: `.github/workflows/vercel-status-monitor.yml`

**Otomatik çalışma:**
- Her 30 dakikada bir

**Manuel çalıştırma:**
```bash
# GitHub Actions → Vercel Status Monitor → Run workflow
```

---

## 🧪 TEST ETME

### Lokal Test:

```bash
npm run vercel:status
```

Çıktı:
```
🚀 Vercel Status Monitor started
⏰ Checking incidents from last 1 hour(s)
📡 Fetching Vercel status RSS feed...
📊 Found X total incidents in RSS feed
🔥 0 incidents in last 1 hour(s)
✅ No recent incidents found
```

---

### System Health Check ile Test:

```bash
npm run health:check
```

Raporun sonunda şöyle bir bölüm göreceksin:

```
☁️ Vercel Platform
✅ Durum: Tüm sistemler çalışıyor
🔗 Status Page
```

---

## 📊 NASIL ÇALIŞIR?

### 1. RSS Feed Monitoring (Her 30 Dakika)

```
GitHub Actions
    ↓
vercel-status-monitor.js
    ↓
Vercel RSS Feed (https://www.vercel-status.com/history.rss)
    ↓
Yeni incident var mı? (Son 1 saat)
    ↓
Evet → Telegram bildirim gönder
    ↓
Supabase'e kaydet (duplicate önleme)
```

### 2. Daily Health Check (Her Gün 08:00 UTC)

```
system-health-check.js
    ↓
checkVercelStatus()
    ↓
RSS feed'i kontrol et
    ↓
Raporda göster: ✅ veya ⚠️
```

---

## 📱 BİLDİRİM ÖRNEĞİ

Vercel'de sorun olduğunda şöyle bir mesaj alacaksın:

```
🔍 VERCEL STATUS ALERT

📋 Elevated errors across multiple services

🔴 Status: Investigating
📅 21.10.2025 10:30

💬 We are investigating reports of elevated errors...

📜 Son Güncellemeler:
• Oct 21, 10:30 UTC - Investigating
• Oct 21, 10:25 UTC - Identified
• Oct 21, 10:15 UTC - Monitoring

🔗 Detaylı Bilgi
📊 Vercel Status Page
```

---

## 🔧 YAPILANDIRMA

### Kontrol Sıklığını Değiştir

`.github/workflows/vercel-status-monitor.yml`:

```yaml
schedule:
  - cron: '*/15 * * * *'  # Her 15 dakika
  - cron: '0 * * * *'     # Her saat başı
```

### Kontrol Penceresini Değiştir

`scripts/vercel-status-monitor.js`:

```javascript
const CONFIG = {
  // ...
  CHECK_HOURS: 2,  // Son 2 saat (varsayılan: 1)
};
```

---

## 🐛 SORUN GİDERME

### Problem: "No incidents found but Vercel is down"

**Çözüm:** RSS feed'in güncellenmesi 5-10 dakika sürebilir. Manual olarak kontrol et:
```bash
curl https://www.vercel-status.com/history.rss
```

### Problem: "Duplicate notifications"

**Çözüm:** Supabase tablosunu kontrol et:
```sql
SELECT * FROM vercel_status_notifications ORDER BY notified_at DESC LIMIT 10;
```

Duplicate varsa temizle:
```sql
DELETE FROM vercel_status_notifications WHERE notified_at < NOW() - INTERVAL '30 days';
```

### Problem: "GitHub Actions workflow fails"

**Çözüm:** GitHub Actions logs'u kontrol et:
```
GitHub → Actions → Vercel Status Monitor → Latest run → Logs
```

---

## 📈 İSTATİSTİKLER

Bildirim geçmişini gör:

```sql
SELECT 
  incident_title,
  notified_at,
  DATE_TRUNC('day', notified_at) as day
FROM vercel_status_notifications
ORDER BY notified_at DESC
LIMIT 20;
```

Aylık özet:

```sql
SELECT 
  DATE_TRUNC('month', notified_at) as month,
  COUNT(*) as incident_count
FROM vercel_status_notifications
GROUP BY month
ORDER BY month DESC;
```

---

## 🎯 SONRAKI ADIMLAR

1. ✅ Supabase tablosu oluşturuldu
2. ✅ Scripts hazır
3. ✅ GitHub Actions workflow hazır
4. ⏳ `npm install` çalıştır (xml2js için)
5. ⏳ Lokal test yap: `npm run vercel:status`
6. ⏳ GitHub Actions'ı manuel tetikle
7. ⏳ 30 dakika bekle, otomatik çalıştığını gör

---

## 📚 İLGİLİ DOSYALAR

- `scripts/vercel-status-monitor.js` - Ana monitor script
- `scripts/system-health-check.js` - Günlük health check (Vercel dahil)
- `.github/workflows/vercel-status-monitor.yml` - GitHub Actions workflow
- `docs/vercel-status-schema.sql` - Supabase tablo şeması
- `package.json` - npm scripts (`vercel:status`, `health:check`)

---

## 💡 İPUÇLARI

1. **İlk kez test ederken** Vercel'in şu an bir problemi olmayabilir. Workflow'un çalıştığını görmek için logs'u kontrol et.

2. **False alarm önleme:** Script sadece "Investigating", "Identified", "Monitoring" durumlarında bildirim gönderir. "Resolved" için bildirim göndermez (30 dakikadan eskiyse).

3. **Rate limiting:** Birden fazla incident varsa, her biri arasında 2 saniye bekler.

4. **Cleanup:** Eski bildirimleri ayda bir temizle (30 günden eski).

---

## ✅ KURULUM TAMAMLANDI!

Artık Vercel'de sorun olduğunda otomatik bildirim alacaksın! 🎉

