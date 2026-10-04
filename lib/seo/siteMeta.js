/**
 * Site-wide SEO constants and the JSON-LD nodes every page shares.
 *
 * Server-side (prerender, sitemap, article page function) reads these, so the
 * crawler-visible head never depends on React running. Keep the Person facts in
 * sync with src/lib/constants/personal.ts.
 */

export const SITE_URL = 'https://cemkoyluoglu.codes';
export const SITE_NAME = 'Cem Koyluoglu Portfolio';
export const AUTHOR_NAME = 'Cem Koyluoglu';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
export const TWITTER_HANDLE = '@CemKoyluoglu';

export const PERSON_ID = `${SITE_URL}/#person`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export const ROBOTS_INDEX = 'index, follow, max-image-preview:large';
export const ROBOTS_NOINDEX_FOLLOW = 'noindex, follow';
export const ROBOTS_NOINDEX = 'noindex, nofollow';

export const DEFAULT_TITLE = 'Cem Koyluoglu — AI Engineer in Dublin | RAG & Computer Vision';
export const DEFAULT_DESCRIPTION =
  'AI Engineer in Dublin, Ireland building production LLM, RAG and computer vision systems. MSc AI, First Class Honours. Open to AI/ML roles and freelance work.';

/** Absolute URL for a site path. Strips query/hash so canonicals stay clean. */
export function absoluteUrl(pathname = '/') {
  const clean = String(pathname || '/').split(/[?#]/)[0];
  const withSlash = clean.startsWith('/') ? clean : `/${clean}`;
  return `${SITE_URL}${withSlash}`;
}

export function websiteNode() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: SITE_NAME,
    description:
      'AI Engineer specializing in Large Language Models, NLP, Computer Vision, and Microsoft 365 solutions. Based in Dublin, Ireland.',
    publisher: { '@id': PERSON_ID },
    inLanguage: 'en-IE',
  };
}

export function personNode() {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: AUTHOR_NAME,
    url: `${SITE_URL}/`,
    image: `${SITE_URL}/portrait.webp`,
    jobTitle: 'AI Engineer',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Dublin',
      addressCountry: 'IE',
    },
    alumniOf: {
      '@type': 'CollegeOrUniversity',
      name: 'National College of Ireland',
    },
    knowsAbout: [
      'Artificial Intelligence',
      'Large Language Models',
      'Retrieval-Augmented Generation',
      'Agentic AI workflows',
      'Computer Vision',
      'Deepfake detection',
      'Natural Language Processing',
      'Microsoft Azure',
      'Microsoft 365',
    ],
    sameAs: ['https://github.com/CemRoot', 'https://www.linkedin.com/in/cem-koyluoglu/'],
  };
}

/** A complete JSON-LD document: the shared WebSite + Person nodes plus page nodes. */
export function siteGraph(extraNodes = []) {
  return {
    '@context': 'https://schema.org',
    '@graph': [websiteNode(), personNode(), ...extraNodes],
  };
}
