# GitHub Student Pack - Bu Proje İçin Gerçekten İşe Yarayanlar

> **Not:** Vercel zaten hosting + monitoring + analytics yapıyor. Gereksiz tool eklemiyoruz!

---

## 🔥 Mutlaka Alın (Bu Hafta)

### 1. Sentry - Error Tracking ⭐⭐⭐⭐⭐
**Neden kritik:** Production'da kullanıcılar hata yaşadığında göremiyorsunuz. Vercel error logs'ları yetersiz.

**Bu projede ne sağlar:**
- Frontend hataları (React crashes)
- API hataları (newsletter, contact form)
- User session replay (ne yaptıklarını görürsünüz)
- Email notifications
- Stack trace + environment bilgileri

**Kurulum:**
```bash
npm install @sentry/react @sentry/vite-plugin
```

```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: import.meta.env.MODE,
});
```

**Değeri:** Vercel sadece build errors gösterir, runtime errors göstermez. Sentry kritik!

---

### 2. Imgbot - Auto Image Optimization ⭐⭐⭐⭐⭐
**Neden kolay:** Sadece GitHub'da install, sonra unutun. Otomatik çalışır.

**Bu projede ne sağlar:**
- `public/` ve `src/assets/` klasörlerindeki tüm resimleri optimize eder
- Her yeni resimde otomatik PR açar
- Web Vitals (LCP) skorunu düşürür
- Hiçbir kod değişikliği gerektirmez

**Kurulum:**
1. https://imgbot.net adresine git
2. "Install on GitHub" tıkla
3. Repo'nuzu seç
4. Bitti! İlk PR'ı birkaç dakika içinde açacak

**Değeri:** Zero-effort, huge impact. Mutlaka alın!

---

### 3. SimpleAnalytics - Privacy Analytics ⭐⭐⭐⭐
**Neden önemli:** Kaç kişi ziyaret ediyor, hangi sayfalar popüler bilmiyorsunuz.

**Bu projede ne sağlar:**
- Hangi sayfalar en çok ziyaret ediliyor
- /tech-news vs /contact hangisi popüler
- Newsletter'a nereden signup oluyor
- GDPR uyumlu (cookie banner gerektirmiyor)
- Google Analytics'ten daha hızlı

**Kurulum:**
```html
<!-- index.html içinde <head> tag'ine ekle -->
<script async defer src="https://scripts.simpleanalyticscdn.com/latest.js"></script>
<noscript><img src="https://queue.simpleanalyticscdn.com/noscript.gif" alt="" /></noscript>
```

**Alternatif:** Vercel Analytics da var ama limited. SimpleAnalytics daha detaylı.

---

## 💎 İyi Olur (Bu Ay)

### 4. .TECH Domain ⭐⭐⭐⭐
**Ne sağlar:** `yourname.tech` gibi profesyonel domain (1 yıl ücretsiz)

**Bu projede:**
- CV/Portfolio sitesi için profesyonel görünüm
- `.tech` extension cool görünüyor developer için

---

### 5. GitLens (VS Code Extension) ⭐⭐⭐⭐
**Ne sağlar:** 
- Hangi satırı kim yazdı
- Commit history inline görünür
- PR'ları VS Code'da görebilirsiniz

**Kurulum:** VS Code extensions'dan install et

---

### 6. 1Password - Password Manager ⭐⭐⭐
**Ne sağlar:**
- Tüm API keys güvenle
- Supabase, Vercel, EmailJS credentials
- Developer Tools (SSH keys, secrets)

**Bu projede:** Çok fazla API key var (Supabase, EmailJS, Telegram, LinkedIn, etc.)

---

### 7. BrowserStack - Cross-Browser Testing ⭐⭐⭐
**Ne sağlar:** 
- Sitenizi farklı cihazlarda test edin
- iPhone, Android, Safari, Chrome
- Real devices, not emulators

**Bu projede:** Mobile responsive test için iyi

---

## 🎨 Design Resources

### 8. Icons8 (3 ay ücretsiz) ⭐⭐⭐
- Icons, photos, illustrations, music
- UI için yüksek kaliteli assets

### 9. IconScout (60 premium icon/ay) ⭐⭐⭐
- Premium icons for professional look

---

## 📚 Öğrenme & Kariyer

### 10. FrontendMasters (6 ay ücretsiz) ⭐⭐⭐⭐
**Önerilen kurslar:**
- React Performance
- TypeScript Deep Dive
- Web Performance Optimization
- Complete Intro to React

### 11. Educative (6 ay ücretsiz + %30 indirim) ⭐⭐⭐
**Önerilen kurslar:**
- System Design
- Advanced JavaScript Patterns
- Grokking the Coding Interview (interview prep için)

### 12. GitHub Certification ⭐⭐⭐
- GitHub Foundations Exam (ücretsiz voucher)
- GitHub Copilot Certification
- CV'nize ekleyin

---

## 🔧 Development Tools (İhtiyaç Olursa)

### 13. Requestly - API Testing/Mocking
**Ne zaman:** API'ları test ederken, mock data ile çalışırken

### 14. DevCycle - Feature Flags
**Ne zaman:** A/B testing, feature toggle yapacaksanız

### 15. Codecov - Code Coverage
**Ne zaman:** Unit test yazmaya başladığınızda

---

## ❌ Bu Projede Gereksiz Olanlar

- ~~New Relic~~ → Vercel Analytics yeterli
- ~~Heroku~~ → Vercel serverless functions var
- ~~MongoDB Atlas~~ → Supabase kullanıyorsunuz
- ~~Doppler~~ → Vercel environment variables yeterli
- ~~Pageclip~~ → Kendi API'niz var (Supabase)
- ~~Microsoft Azure~~ → Vercel var
- ~~Travis CI~~ → GitHub Actions var
- ~~Most others~~ → Gereksiz complexity

---

## 🚀 Öncelik Sırası (Action Plan)

### Hemen (5 dakika):
1. ✅ **Imgbot** - GitHub'da install et (en kolay)

### Bu hafta (1 saat):
2. ✅ **Sentry** - Error tracking kur
3. ✅ **SimpleAnalytics** - Analytics ekle

### Bu ay:
4. ✅ **.TECH domain** - Al ve Vercel'e bağla
5. ✅ **GitLens** - VS Code extension
6. ✅ **1Password** - Setup yap

### Boş zamanında:
7. ✅ **FrontendMasters** - Kursları izle
8. ✅ **Icons8/IconScout** - Design resources
9. ✅ **BrowserStack** - Cross-browser test yap

---

## 💡 Özet

**Kritik 3'lü:**
1. Sentry (error tracking)
2. Imgbot (image optimization)
3. SimpleAnalytics (analytics)

**İyi olur:**
- .TECH domain
- GitLens
- 1Password
- FrontendMasters

**Gerisini atlayın** - zaten Vercel stack'inizde var veya bu proje için gereksiz.

---

## 📊 Maliyet Tasarrufu

Bu 3 kritik tool'un normal maliyeti:
- Sentry: ~$26/ay → **Ücretsiz** (öğrenci)
- SimpleAnalytics: ~$19/ay → **Ücretsiz** (öğrenci)
- Imgbot: ~$10/ay → **Ücretsiz** (öğrenci)

**Toplam tasarruf:** ~$660/yıl 🎉

