/**
 * URL helpers shared by tech-news-preflight (and tests). No side effects on import.
 */

const BLOCKED_SLUGS = new Set([
  'hesabim', 'my-account', 'giris', 'login', 'kayit', 'register',
  'sepet', 'cart', 'checkout', 'odeme', 'wp-admin', 'wp-login',
  'wp-register', 'feed', 'rss', 'sitemap', 'robots', 'favicon',
  'iletisim', 'contact', 'hakkimizda', 'about', 'gizlilik',
  'privacy', 'terms', 'kvkk', 'cerez', 'cookie', 'yazarlar',
  'author', 'profil', 'profile', 'ayarlar', 'settings',
  'abone', 'subscribe', 'newsletter', 'search', 'ara', 'category',
]);

export function isArticleUrl(href) {
  if (!href || !href.includes('nuvemmag.com/')) return false;
  try {
    const { pathname } = new URL(href);
    const clean = pathname.replace(/\/$/, '');
    const parts = clean.split('/').filter(Boolean);
    if (parts.length === 0) return false;
    if (parts.some(p => BLOCKED_SLUGS.has(p))) return false;
    if (/\.(jpg|jpeg|png|gif|svg|css|js|xml|json|pdf)$/i.test(clean)) return false;
    if (/^\/wp-content/i.test(clean)) return false;
    return /^\/[a-z0-9][a-z0-9%-]*\/?$/i.test(clean) || /^\/post\/[a-z0-9-]+\/?$/i.test(clean);
  } catch {
    return false;
  }
}

export function normalizeArticleUrl(url) {
  try {
    const u = new URL(url);
    u.hash = '';
    u.search = '';
    let path = u.pathname.replace(/\/+$/, '');
    if (!path) path = '';
    u.pathname = path || '/';
    return u.toString();
  } catch {
    return String(url).replace(/[?#].*$/, '').replace(/\/+$/, '');
  }
}

export function extractArticleUrlsFromHtml(html) {
  const found = new Set();
  const re = /\bhref\s*=\s*["'](https?:\/\/(?:www\.)?nuvemmag\.com\/[^"'#?]+)/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = m[1];
    if (isArticleUrl(href)) found.add(normalizeArticleUrl(href));
  }
  return [...found];
}
