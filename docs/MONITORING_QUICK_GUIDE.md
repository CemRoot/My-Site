# 🔍 Frontend Monitoring Sistemi - Hızlı Kılavuz

## ✅ Kurulum Tamamlandı!

Frontend monitoring sistemi başarıyla kuruldu ve test edildi. Artık tüm hatalar Telegram'a bildirim olarak gelecek.

---

## 📱 Bildirim Aldığınızda Ne Yapmalısınız

### 1. Bildirimi Okuyun
- **Emoji** ile hata türünü anlayın (💥 Critical, 🚨 Error, 🐌 Warning)
- **Sayfa URL**'ini kontrol edin (hangi sayfa?)
- **Hata mesajını** okuyun (ne oldu?)
- **Zaman**ı not edin (ne zaman oldu?)

### 2. Supabase'de Detaylı Log'u İnceleyin

**Adımlar:**
1. https://supabase.com/dashboard - Projenizi açın
2. **Table Editor** → `frontend_error_logs` tablosunu açın
3. Son kayıtlara bakın (en yeni en üstte)
4. Detaylı bilgileri göreceksiniz:
   - `error_type`: error, crash, performance, network
   - `error_message`: Hata mesajı
   - `error_stack`: Stack trace (kod satırı)
   - `user_agent`: Kullanıcının tarayıcısı
   - `page_url`: Hangi sayfada oluştu
   - `timestamp`: Tam zaman
   - `additional_data`: Ekstra bilgiler (JSON)

### 3. Sorunu Çözün

**Black Screen (💥):**
- React render hatası
- Boş root element
- JavaScript çökmesi
- **Çözüm:** Console'da stack trace'i kontrol edin

**JavaScript Error (🚨):**
- Undefined değişken
- Type error
- **Çözüm:** Hata satırını stack trace'den bulun

**Network Error (🔌):**
- API çökmesi
- Sunucu hatası (5xx)
- **Çözüm:** Backend API'yi kontrol edin

**Performance Warning (🐌):**
- Yavaş yükleme (>5 saniye)
- **Çözüm:** Bundle size'ı azaltın, optimize edin

---

## 🧪 Test Komutları

### Production Test
```bash
npm run test:monitoring
```
- cemkoyluoglu.codes'u test eder
- 4 test senaryosu çalıştırır
- Telegram'a bildirim gönderir

### Local Test (Geliştirme)
```bash
npm run dev
# Başka terminal'de:
npm run test:monitoring-local
```
- localhost:5173'ü test eder
- Development ortamı

---

## 📊 Supabase Tablosu

### frontend_error_logs

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | UUID | Primary key |
| error_type | TEXT | error, crash, performance, network |
| error_message | TEXT | Hata mesajı |
| error_stack | TEXT | Stack trace |
| user_agent | TEXT | Tarayıcı bilgisi |
| page_url | TEXT | Sayfa URL'i |
| timestamp | TIMESTAMPTZ | Hata zamanı |
| additional_data | JSONB | Ekstra bilgiler |
| created_at | TIMESTAMPTZ | Kayıt zamanı |

### Örnek Sorgu (SQL Editor'da)

```sql
-- Son 10 hata
SELECT 
  error_type,
  error_message,
  page_url,
  timestamp,
  user_agent
FROM frontend_error_logs
ORDER BY timestamp DESC
LIMIT 10;

-- Sayfa bazında hata sayısı
SELECT 
  page_url,
  COUNT(*) as error_count
FROM frontend_error_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY page_url
ORDER BY error_count DESC;

-- Hata tipi bazında dağılım
SELECT 
  error_type,
  COUNT(*) as count
FROM frontend_error_logs
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY error_type;
```

---

## 🚨 Rate Limiting

- **5 bildirim / 5 dakika** per hata tipi
- Aynı hata tekrar tekrar gelmez
- Spam koruması

---

## ⚙️ Ortam Değişkenleri (Vercel)

Monitoring sistemi için gerekli env var'lar:

```bash
# Telegram
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHAT_ID=your_chat_id

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Sentry (opsiyonel)
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

## 📝 Monitoring Sistemi Ne Yapar?

### 1. JavaScript Hataları
- `window.addEventListener('error')`
- `window.addEventListener('unhandledrejection')`

### 2. React Render Hataları
- `ErrorBoundary` ile yakalanır
- Component stack trace ile

### 3. Siyah Ekran (Black Screen)
- 3 saniye sonra kontrol
- Root element boş mu?

### 4. Network Hataları
- `fetch()` wrapper
- 5xx hataları yakalar

### 5. Performans Sorunları
- Page load >5 saniye
- Performance API kullanır

---

## 🎯 Özet

✅ **Kurulum:** Tamamlandı  
✅ **Test:** Başarılı (4/4)  
✅ **Production:** Aktif  
✅ **Telegram:** Çalışıyor  
✅ **Supabase:** Loglama aktif

**Artık her hata anında haberdar olacaksınız! 🚀**

---

## 📞 Sorun Giderme

### Bildirim Gelmiyor?

1. **Vercel env var'ları kontrol edin:**
   - TELEGRAM_BOT_TOKEN
   - TELEGRAM_CHAT_ID
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY

2. **Supabase tablosu var mı?**
   - `frontend_error_logs` tablosu
   - RLS policies

3. **Vercel logs kontrol edin:**
   - https://vercel.com/dashboard
   - Functions → api/frontend-health-monitor

4. **Test tekrar çalıştırın:**
   ```bash
   npm run test:monitoring
   ```

### Log'lar Supabase'de görünmüyor?

- SUPABASE_SERVICE_ROLE_KEY doğru mu?
- Tablo permissions kontrol edin
- RLS policy'leri aktif mi?

---

🎉 **Tebrikler! Monitoring sisteminiz hazır!**

