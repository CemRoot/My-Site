/**
 * Minimal Google Search Console Search Analytics client using a service
 * account (no SDK): sign a JWT with the account's private key, exchange it for
 * an access token, query searchanalytics. The service account's email must be
 * added as a user on the Search Console property.
 */

import crypto from 'node:crypto';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

function base64url(value) {
  return Buffer.from(value).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export function signServiceAccountJwt({ client_email: email, private_key: key }, now = Math.floor(Date.now() / 1000)) {
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(JSON.stringify({ iss: email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }));
  const signature = crypto.createSign('RSA-SHA256').update(`${header}.${claims}`).sign(key);
  return `${header}.${claims}.${base64url(signature)}`;
}

export async function getAccessToken(serviceAccount) {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: signServiceAccountJwt(serviceAccount),
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`GSC token: ${data.error_description || data.error || response.status}`);
  return data.access_token;
}

/**
 * @param {object} opts
 * @param {string} opts.token
 * @param {string} opts.siteUrl - e.g. "https://cemkoyluoglu.tech/" or "sc-domain:cemkoyluoglu.tech"
 * @param {string} opts.startDate - YYYY-MM-DD
 * @param {string} opts.endDate - YYYY-MM-DD
 * @param {string[]} opts.dimensions
 */
export async function querySearchAnalytics({ token, siteUrl, startDate, endDate, dimensions, rowLimit = 25 }) {
  const response = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate, endDate, dimensions, rowLimit }),
    },
  );
  const data = await response.json();
  if (!response.ok) throw new Error(`GSC query: ${data.error?.message || response.status}`);
  return data.rows || [];
}

/** Pages with real impressions but weak CTR — the first candidates to rewrite. */
export function lowCtrPages(rows, { minImpressions = 50, maxCtr = 0.02 } = {}) {
  return rows
    .filter((r) => r.impressions >= minImpressions && r.ctr <= maxCtr)
    .sort((a, b) => b.impressions - a.impressions);
}
