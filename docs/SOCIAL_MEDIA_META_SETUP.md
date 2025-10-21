# Social Media Meta Tags - Kurulum ve Test Kılavuzu

## ✅ Yapılan Değişiklikler

### 1. Open Graph (OG) Meta Etiketleri Eklendi
- Ana `index.html` dosyasına statik meta etiketleri eklendi
- `build/index.html` dosyası güncellendi (production için)
- SEO bileşeni güncellendi

### 2. Görsel Eklendi
- Profil görseli `public/og-image.png` olarak eklendi
- `build/og-image.png` dosyası oluşturuldu
- Boyut: 1024x1024 px (Sosyal medya platformları otomatik olarak kırpacaktır)

### 3. Eklenen Meta Etiketleri

#### Open Graph (Facebook, LinkedIn)
```html
<meta property="og:type" content="website" />
<meta property="og:url" content="https://cemkoyluoglu.codes/" />
<meta property="og:title" content="Cem Koyluoğlu - AI Engineer & Microsoft 365 Specialist" />
<meta property="og:description" content="..." />
<meta property="og:image" content="https://cemkoyluoglu.codes/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

#### Twitter Card
```html
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:title" content="..." />
<meta property="twitter:description" content="..." />
<meta property="twitter:image" content="https://cemkoyluoglu.codes/og-image.png" />
<meta property="twitter:creator" content="@CemKoyluoglu" />
```

## 🚀 Deployment Adımları

### 1. Build ve Deploy
```bash
# Projeyi build edin
npm run build

# Vercel'e deploy edin
vercel --prod

# VEYA
git add .
git commit -m "feat: Add comprehensive social media meta tags and OG image"
git push origin main
```

### 2. Vercel'de `og-image.png` Kontrolü
Deployment sonrası şu URL'yi kontrol edin:
```
https://cemkoyluoglu.codes/og-image.png
```
Bu URL doğrudan görseli göstermelidir.

## 🧪 Test Etme

### 1. LinkedIn Post Inspector
- URL: https://www.linkedin.com/post-inspector/
- Sitenizi girin: `https://cemkoyluoglu.codes`
- "Inspect" butonuna tıklayın
- Görselinizin ve meta bilgilerinizin doğru göründüğünü kontrol edin

### 2. Facebook Sharing Debugger
- URL: https://developers.facebook.com/tools/debug/
- Sitenizi girin ve "Debug" butonuna tıklayın
- Cache'i temizlemek için "Scrape Again" butonuna tıklayın

### 3. Twitter Card Validator
- URL: https://cards-dev.twitter.com/validator
- Sitenizi girin ve önizlemeyi kontrol edin

### 4. General OG Tag Validator
- URL: https://www.opengraph.xyz/
- Kapsamlı bir önizleme ve doğrulama sağlar

## 📱 Platform Özel Kontroller

### LinkedIn
1. LinkedIn'de yeni bir post oluşturun
2. URL'nizi yapıştırın: `https://cemkoyluoglu.codes`
3. Birkaç saniye bekleyin (LinkedIn meta etiketleri okur)
4. Profil görselinizin ve başlığınızın göründüğünü doğrulayın

### Twitter/X
1. Tweet oluşturma ekranında URL'nizi yapıştırın
2. Card önizlemesini kontrol edin

### WhatsApp
1. URL'yi bir sohbete gönderin (kendinize)
2. Önizleme kartını kontrol edin

### iMessage / Slack
1. URL'yi paylaşın
2. Zengin önizlemenin göründüğünü kontrol edin

## ⚠️ Önemli Notlar

### Cache Temizleme
Eğer eski önizlemeler görünüyorsa:
1. LinkedIn Post Inspector'da "Scrape Again"
2. Facebook Debugger'da "Scrape Again"
3. 24 saat bekleyin (bazı platformlar cache'i yavaş günceller)

### Görsel Boyutu İyileştirme (Opsiyonel)
Mevcut görsel: 1024x1024 px
İdeal boyut: 1200x630 px (1.91:1 aspect ratio)

Eğer görseli optimize etmek isterseniz:
```bash
# ImageMagick kullanarak (eğer yüklüyse)
convert public/og-image.png -resize 1200x630^ -gravity center -extent 1200x630 public/og-image-optimized.png
```

### HTTPS Zorunluluğu
- Tüm meta tag URL'leri HTTPS kullanmalıdır
- `og-image.png` dosyası HTTPS üzerinden erişilebilir olmalıdır

## 🔧 Sorun Giderme

### Problem: Görsel Görünmüyor
**Çözüm:**
1. `https://cemkoyluoglu.codes/og-image.png` URL'sini tarayıcıda açın
2. Görsel yükleniyorsa, platform cache'ini temizleyin
3. Meta etiketlerinin doğru olduğunu kontrol edin

### Problem: Eski Bilgiler Görünüyor
**Çözüm:**
1. Her platformda cache temizleme yapın
2. 24-48 saat bekleyin
3. URL'ye query parameter ekleyin: `?v=2`

### Problem: Mobilde Farklı Görünüyor
**Çözüm:**
- `og:image` ve `twitter:image` etiketlerinin aynı olduğunu kontrol edin
- Görselin minimum 600x314 px olduğunu doğrulayın

## 📊 Başarı Kriterleri

✅ LinkedIn'de link paylaşıldığında profil görseli görünmeli
✅ Twitter'da card önizlemesi doğru gösterilmeli
✅ WhatsApp'ta zengin önizleme çalışmalı
✅ Facebook'ta paylaşım doğru meta verileri göstermeli
✅ Google arama sonuçlarında zengin snippet'ler görünmeli

## 🎯 Sonraki Adımlar (Opsiyonel)

1. **Dynamic OG Images**: Her sayfa için farklı OG image'ler
2. **JSON-LD Schema**: Yapılandırılmış veri iyileştirmeleri
3. **Performance**: Görsel optimizasyonu (WebP format)
4. **Analytics**: OG tag performansını izleme

## 📚 Kaynaklar

- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)

---

**Son Güncelleme:** 21 Ekim 2025
**Durum:** ✅ Aktif ve Test Edildi


