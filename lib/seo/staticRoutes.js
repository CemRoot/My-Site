/**
 * Crawlable static routes. One manifest feeds both the postbuild prerender
 * (per-route <head>) and the sitemap, so they cannot disagree.
 *
 * Titles and descriptions mirror the <SEO> props on each page component; keep
 * them in sync when page copy changes.
 */

import { DEFAULT_TITLE, ROBOTS_INDEX } from './siteMeta.js';

export const STATIC_ROUTES = [
  {
    path: '/',
    title: DEFAULT_TITLE,
    description:
      'AI Engineer specializing in deepfake detection, computer vision, RAG and agentic workflows. Based in Dublin, Ireland. Available for freelance projects and full-time opportunities.',
    robots: ROBOTS_INDEX,
    changefreq: 'weekly',
    priority: '1.0',
  },
  {
    path: '/tech-news',
    // Rendered per request by api/seo-page.js (kind=list), not at build time.
    dynamic: true,
    title: 'Tech News | Cem Koyluoglu',
    description:
      'Latest technology news, translated and summarized by AI. Stay up to date with AI, tech, startups, and software engineering news.',
    robots: ROBOTS_INDEX,
    changefreq: 'daily',
    priority: '0.8',
  },
  {
    path: '/english-learning',
    title: 'Learn English | Cem Koyluoglu',
    description:
      'Contextual vocabulary learning from video subtitles — Chrome extension and iOS spaced repetition app.',
    robots: ROBOTS_INDEX,
    changefreq: 'monthly',
    priority: '0.5',
  },
  {
    path: '/privacy-policy',
    title: 'Privacy Policy | Cem Koyluoglu',
    description:
      "Privacy Policy for Cem Koyluoglu's Ireland-based portfolio: chatbot data, processors, retention, and GDPR rights.",
    robots: ROBOTS_INDEX,
    changefreq: 'yearly',
    priority: '0.2',
  },
  {
    path: '/terms',
    title: 'Terms & Conditions | Cem Koyluoglu',
    description:
      "Binding terms for Cem Koyluoglu's portfolio under Irish law: IP, chatbot use, disclaimers, and liability limits.",
    robots: ROBOTS_INDEX,
    changefreq: 'yearly',
    priority: '0.2',
  },
];

