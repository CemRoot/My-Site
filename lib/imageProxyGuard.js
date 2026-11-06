/**
 * SSRF guard for the same-origin image proxy (api/img.js).
 * Only public http(s) hosts are allowed; IP literals and internal names are not.
 */
import net from 'node:net';

const BLOCKED_HOST_SUFFIXES = ['.local', '.internal', '.localhost', '.lan', '.home', '.corp'];

export function isPrivateAddress(ip) {
  const family = net.isIP(ip);
  if (family === 4) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }
  if (family === 6) {
    const v = ip.toLowerCase();
    if (v.startsWith('::ffff:')) return isPrivateAddress(v.slice(7));
    return (
      v === '::' ||
      v === '::1' ||
      v.startsWith('fc') ||
      v.startsWith('fd') ||
      v.startsWith('fe8') ||
      v.startsWith('fe9') ||
      v.startsWith('fea') ||
      v.startsWith('feb')
    );
  }
  return true;
}

/** Returns a parsed URL when the input is an acceptable remote image URL, else null. */
export function parseRemoteImageUrl(input) {
  if (typeof input !== 'string' || input.length > 2048) return null;
  let url;
  try {
    url = new URL(input);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  if (!host || host === 'localhost' || net.isIP(host.replace(/^\[|\]$/g, ''))) return null;
  if (!host.includes('.')) return null;
  if (BLOCKED_HOST_SUFFIXES.some((s) => host.endsWith(s))) return null;
  return url;
}
