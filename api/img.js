/**
 * Same-origin image proxy for tech-news images.
 *
 * Corporate networks often block third-party image CDNs (wsrv.nl) and the
 * publishers' own image hosts. Serving the bytes from our own domain makes
 * them load anywhere the site itself loads. Vercel's CDN caches the result.
 *
 * GET /api/img?url=<encoded remote image url>
 */
import dns from 'node:dns/promises';
import { isPrivateAddress, parseRemoteImageUrl } from '../lib/imageProxyGuard.js';

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 8000;

async function assertPublicHost(hostname) {
  const records = await dns.lookup(hostname, { all: true });
  if (!records.length || records.some((r) => isPrivateAddress(r.address))) {
    throw new Error('blocked host');
  }
}

async function fetchImage(startUrl) {
  let url = startUrl;
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    await assertPublicHost(url.hostname);
    const res = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; cemkoyluoglu.tech image proxy)',
        Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
      },
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      const next = parseRemoteImageUrl(new URL(res.headers.get('location'), url).toString());
      if (!next) throw new Error('bad redirect');
      url = next;
      continue;
    }
    return res;
  }
  throw new Error('too many redirects');
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).end();
  }
  const target = parseRemoteImageUrl(typeof req.query.url === 'string' ? req.query.url : '');
  if (!target) return res.status(400).send('Invalid url');

  try {
    const upstream = await fetchImage(target);
    const type = (upstream.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!upstream.ok || !type.startsWith('image/') || type.includes('svg')) {
      return res.status(502).send('Upstream is not a usable image');
    }
    const declared = Number(upstream.headers.get('content-length') || 0);
    if (declared > MAX_BYTES) return res.status(413).send('Image too large');

    const buf = Buffer.from(await upstream.arrayBuffer());
    if (buf.length > MAX_BYTES) return res.status(413).send('Image too large');

    res.setHeader('Content-Type', type);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800');
    return res.status(200).send(buf);
  } catch {
    return res.status(502).send('Image fetch failed');
  }
}
