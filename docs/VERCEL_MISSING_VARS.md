# Vercel — eksik ortam değişkenleri kontrol listesi

**Önemli:** Bu dosyaya **asla** gerçek token, API anahtarı veya şifre yazmayın. Geçmişte burada sızan değerler geçersiz sayılmalı ve [rotasyon](#sızmış-anahtarlar-için-hızlı-rotasyon) yapılmalıdır.

Gerçek değerleri yalnızca şurada tutun:

- Vercel: **Project → Settings → Environment Variables**
- Yerel: `.env` / `.env.local` (`.gitignore` altında, commit edilmez)

Şablon için repodaki `.env.example` ve `SECURITY.md` dosyalarına bakın.

## Kontrol listesi (isimler — değer yok)

| Değişken | Not |
|----------|-----|
| `TELEGRAM_BOT_TOKEN` | @BotFather; sızmışsa `/revoke` ile iptal edip yeni token |
| `TELEGRAM_CHAT_ID` | Gizli değil; yine de dokümana gerçek ID yapıştırmak zorunlu değil |
| `TELEGRAM_CONTROL_API_SECRET` | `openssl rand -hex 32` |
| `GEMINI_API_KEY` / Google API anahtarları | Google Cloud Console → Credentials |
| `GROQ_API_KEY`, `FIRECRAWL_API_KEY`, … | İlgili panellerden |
| `SUPABASE_*`, `SENTRY_*`, … | `SECURITY.md` |

## Sızmış anahtarlar için hızlı rotasyon

1. **Telegram:** [@BotFather](https://t.me/BotFather) → botunuzu seçin → **API Token** → **Revoke** / yeni token alın → Vercel ve GitHub Actions secret’larını güncelleyin → webhook gerekiyorsa `npm run telegram:webhook-setup` (veya mevcut kurulumunuz) ile yeniden bağlayın.
2. **Google API key:** [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials** → anahtarı kısıtlayın veya silip yenisini oluşturun → Vercel’de `GEMINI_API_KEY` (veya kullandığınız isim) güncelleyin.
3. Tarama çıktıları (`gitleaks-report.json` vb.) **commit edilmemeli**; repoda `.gitignore` ile engellenmiştir.

Geçmiş commit’lerden kalıcı silme: [GitHub — Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository) (force-push ve işbirlikçi etkileri vardır; anahtar yine de **mutlaka** döndürülmelidir).

Genel rehber: [howtorotate.com](https://howtorotate.com/docs/introduction/getting-started/).
