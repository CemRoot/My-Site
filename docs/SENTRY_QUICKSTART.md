# 🚀 Sentry Hızlı Başlangıç - 5 Dakikada Kurulum

## ✅ Tamamlanan İşlemler

Sentry başarıyla entegre edildi! Şunlar eklendi:

- ✅ Frontend error tracking (React)
- ✅ Backend error tracking (Vercel Serverless Functions)
- ✅ Performance monitoring
- ✅ Session replay (hatalı oturumlar için)
- ✅ Error Boundary with Turkish/English support
- ✅ Source maps support (production)
- ✅ Automatic error capture
- ✅ User context tracking

---

## 🔑 Hemen Yapmanız Gerekenler

### 1. Sentry DSN'inizi Alın

1. [sentry.io](https://sentry.io) hesabınıza giriş yapın
2. Project Settings → Client Keys (DSN) bölümüne gidin
3. DSN'i kopyalayın (örnek: `https://abc123@o123.ingest.sentry.io/456`)

### 2. Vercel'de Environment Variables Ekleyin

Vercel Dashboard → Project Settings → Environment Variables:

```bash
# Frontend (ZORUNLU)
VITE_SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project
VITE_SENTRY_ENVIRONMENT=production
VITE_APP_VERSION=1.0.0

# Backend (ZORUNLU)
SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project
SENTRY_ENVIRONMENT=production

# Source Maps (OPSİYONEL ama önerilir)
SENTRY_AUTH_TOKEN=your_auth_token
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
```

**Not:** Auth token için: Sentry → Settings → Developer Settings → Auth Tokens → Create New Token

### 3. Deploy Edin

```bash
git add .
git commit -m "feat: Add Sentry error tracking"
git push
```

Vercel otomatik olarak deploy edecek ve Sentry aktif olacak!

---

## 🧪 Test Edin

### Frontend Testi:

1. Production sitesini açın
2. Browser console'u açın (F12)
3. Şunu yazın:
   ```javascript
   throw new Error('Sentry test')
   ```
4. Sentry dashboard'da görünmeli (1-2 dakika içinde)

### Backend Testi:

API endpoint'lerinize hatalı request gönderin ve Sentry'de görün.

---

## 📂 Eklenen Dosyalar

```
src/
├── lib/
│   └── sentry.ts                    # Frontend Sentry config
├── components/
│   └── ErrorBoundary.tsx            # Error UI component
└── main.tsx                         # Updated with Sentry

lib/
└── sentry-server.js                 # Backend Sentry config

api/
└── chat.js                          # Updated with withSentry

docs/
├── SENTRY_SETUP.md                  # Detaylı dokümantasyon
└── SENTRY_QUICKSTART.md            # Bu dosya

vite.config.ts                       # Updated with Sentry plugin
.env.example                         # Environment variables template
```

---

## 🔧 Diğer API Route'ları Nasıl Eklerim?

Çok basit! Her API dosyasına şunu ekleyin:

```javascript
import { withSentry } from '../lib/sentry-server.js';

export default withSentry(async function handler(req, res) {
  // Mevcut kodunuz
});
```

Örnek eklenmiş dosya: `api/chat.js`

---

## 📊 Sentry Dashboard'da Neler Göreceğim?

1. **Issues**: Tüm hatalar, gruplanmış halde
2. **Performance**: Yavaş sayfalar ve API call'lar
3. **Releases**: Her deploy'un hata durumu
4. **Session Replay**: Hata oluştuğunda kullanıcının yaptıkları (video gibi)
5. **Breadcrumbs**: Hata öncesi timeline

---

## 💰 Limitler (Developer Plan)

- **5,000 errors/ay** - Normal kullanım için yeterli
- **50 replays/ay** - Sadece hatalı oturumlar kaydediliyor
- **5M spans/ay** - Performance tracking için
- **5 GB logs/ay** - Loglama için

---

## 🔒 Güvenlik

- ✅ Passwords/sensitive data kaydedilmiyor
- ✅ Session replay'de text maskeleniyor
- ✅ Development'ta Sentry'ye gönderilmiyor
- ✅ API keys filtreleniyor

---

## ❓ Sorun mu var?

### DSN hatası alıyorum:
- Environment variables'ların doğru girildiğinden emin olun
- `VITE_` prefix'i frontend için şart!

### Hatalar Sentry'de görünmüyor:
- Development'ta console'da görünür ama Sentry'ye gönderilmez
- Production'da 1-2 dakika gecikme olabilir

### Çok fazla event gönderiliyor:
`src/lib/sentry.ts` ve `lib/sentry-server.js` dosyalarında `tracesSampleRate` değerini düşürün (örn: 0.1 = %10)

---

## 📚 Daha Fazla Bilgi

Detaylı dokümantasyon için: `docs/SENTRY_SETUP.md`

---

## ✨ Özet

1. ✅ Sentry entegre edildi
2. 🔑 Sadece environment variables ekleyin
3. 🚀 Deploy edin
4. 🎉 Hatalarınız otomatik izleniyor!

**Hepsi bu kadar! 🎊**

