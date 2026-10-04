/**
 * IndexNow (Bing, Yandex, Seznam, Naver) submission payload. Google does not
 * use IndexNow; it discovers through the sitemap and Search Console.
 *
 * The key is public by design: the protocol verifies ownership by fetching
 * public/<key>.txt from the site, so it is not a secret.
 */

import { SITE_URL, absoluteUrl } from './siteMeta.js';

export const INDEXNOW_KEY = '7fdb15710394252f5593bc2fc34e78af';
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

export function buildIndexNowPayload(paths, key = INDEXNOW_KEY) {
  return {
    host: new URL(SITE_URL).host,
    key,
    keyLocation: `${SITE_URL}/${key}.txt`,
    urlList: [...new Set(paths)].map((p) => absoluteUrl(p)),
  };
}
