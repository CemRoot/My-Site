/**
 * Primary-source feeds for Engineer's Notes and a small RSS/Atom parser.
 * Primary sources only (vendor engineering blogs), never aggregators: the
 * point is first-hand material to analyse, not other people's rewrites.
 */

import { load } from 'cheerio/slim';

export const NOTE_FEEDS = [
  { name: 'Hugging Face Blog', url: 'https://huggingface.co/blog/feed.xml' },
  { name: 'OpenAI', url: 'https://openai.com/news/rss.xml' },
  { name: 'Google AI Blog', url: 'https://blog.google/technology/ai/rss/' },
  { name: 'Google DeepMind', url: 'https://deepmind.google/blog/rss.xml' },
  { name: 'AWS Machine Learning Blog', url: 'https://aws.amazon.com/blogs/machine-learning/feed/' },
  { name: 'Microsoft AI Blog', url: 'https://www.microsoft.com/en-us/ai/blog/feed/' },
  { name: 'Microsoft Azure Blog', url: 'https://azure.microsoft.com/en-us/blog/feed/' },
  { name: 'NVIDIA Technical Blog', url: 'https://developer.nvidia.com/blog/feed/' },
];

function text(value) {
  return load(`<x>${value || ''}</x>`)('x').text().replace(/\s+/g, ' ').trim();
}

/** @returns {Array<{ title: string, link: string, summary: string, published: string|null }>} */
export function parseFeed(xml) {
  const $ = load(xml, { xml: true });
  const items = [];

  $('item').each((_, el) => {
    const node = $(el);
    items.push({
      title: text(node.children('title').first().text()),
      link: node.children('link').first().text().trim(),
      summary: text(node.children('description').first().text()),
      published: node.children('pubDate').first().text().trim() || null,
    });
  });

  $('entry').each((_, el) => {
    const node = $(el);
    const link =
      node.children('link[rel="alternate"]').attr('href') || node.children('link').first().attr('href') || '';
    items.push({
      title: text(node.children('title').first().text()),
      link: link.trim(),
      summary: text(node.children('summary').first().text() || node.children('content').first().text()),
      published: (node.children('published').first().text() || node.children('updated').first().text()).trim() || null,
    });
  });

  return items.filter((i) => i.title && /^https?:\/\//.test(i.link));
}

/**
 * Readable article text from a page: drops chrome, keeps headings, paragraphs
 * and list items in order. Capped so prompts stay small.
 */
export function extractArticleText(html, maxChars = 12000) {
  const $ = load(html);
  $('script, style, noscript, nav, header, footer, aside, form, iframe, svg, [aria-hidden="true"]').remove();
  const root = $('article').first().length ? $('article').first() : $('main').first().length ? $('main').first() : $('body');

  const blocks = [];
  root.find('h1, h2, h3, p, li, blockquote, pre').each((_, el) => {
    const value = $(el).text().replace(/\s+/g, ' ').trim();
    if (value.length >= 3) blocks.push(value);
  });

  const deduped = blocks.filter((b, i) => blocks.indexOf(b) === i);
  return deduped.join('\n').slice(0, maxChars);
}

export function ogImage(html) {
  const $ = load(html);
  const value = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content') || '';
  return /^https:\/\//.test(value) ? value : null;
}
