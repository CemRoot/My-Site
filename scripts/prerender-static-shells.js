/**
 * Post-build static shell injection for FCP.
 * Injects visible HTML into #root for / and /tech-news before React boots.
 * No headless browser required — uses build-time tech-news-latest.json.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BUILD_DIR = path.join(ROOT, 'build');
const SNAPSHOT_PATH = path.join(BUILD_DIR, 'tech-news-latest.json');

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function readSnapshotArticles() {
  try {
    if (!fs.existsSync(SNAPSHOT_PATH)) return [];
    const json = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
    return Array.isArray(json?.data?.articles) ? json.data.articles.slice(0, 6) : [];
  } catch {
    return [];
  }
}

function homeShell() {
  return `
<div id="prerender-shell" style="min-height:100vh;background:#0a0a0b;color:#f4f4f5;font-family:system-ui,sans-serif;padding:2rem 1.25rem">
  <p style="font-size:0.85rem;letter-spacing:0.08em;text-transform:uppercase;opacity:0.7;margin:0 0 0.75rem">Portfolio</p>
  <h1 style="font-size:clamp(1.75rem,5vw,2.75rem);line-height:1.15;margin:0 0 0.75rem">Cem Koyluoglu</h1>
  <p style="max-width:36rem;opacity:0.85;margin:0;font-size:1.05rem">AI Engineer &amp; System Operations Specialist — Dublin, Ireland. LLMs, NLP, Computer Vision, Azure &amp; Microsoft 365.</p>
</div>`.trim();
}

function techNewsShell(articles) {
  const items = articles
    .map((article) => {
      const title = escapeHtml(article.title);
      const href = `/tech-news/${escapeHtml(article.slug)}`;
      const desc = escapeHtml((article.description || '').slice(0, 140));
      const category = escapeHtml(article.category || 'Tech');
      return `<li style="margin:0 0 1.25rem;list-style:none">
  <a href="${href}" style="color:inherit;text-decoration:none">
    <span style="display:inline-block;font-size:0.75rem;opacity:0.7;margin-bottom:0.25rem">${category}</span>
    <strong style="display:block;font-size:1.1rem;line-height:1.3;margin-bottom:0.35rem">${title}</strong>
    <span style="display:block;opacity:0.75;font-size:0.9rem">${desc}</span>
  </a>
</li>`;
    })
    .join('\n');

  return `
<div id="prerender-shell" style="min-height:100vh;background:#0a0a0b;color:#f4f4f5;font-family:system-ui,sans-serif;padding:2rem 1.25rem;max-width:48rem;margin:0 auto">
  <p style="font-size:0.85rem;letter-spacing:0.08em;text-transform:uppercase;opacity:0.7;margin:0 0 0.5rem">Tech News</p>
  <h1 style="font-size:clamp(1.5rem,4vw,2.25rem);margin:0 0 1.5rem">Latest Tech News</h1>
  <ul style="margin:0;padding:0">${items || '<li style="list-style:none;opacity:0.8">Loading curated technology articles…</li>'}</ul>
</div>`.trim();
}

function injectRoot(html, shellHtml) {
  if (!html.includes('id="root"')) {
    throw new Error('build/index.html missing #root');
  }
  // Prefer empty root replacement; Vite emits <div id="root"></div>
  if (html.includes('<div id="root"></div>')) {
    return html.replace(
      '<div id="root"></div>',
      `<div id="root">${shellHtml}</div>`,
    );
  }
  return html.replace(
    /<div id="root"[^>]*>[\s\S]*?<\/div>/,
    `<div id="root">${shellHtml}</div>`,
  );
}

function writeHtml(filePath, html) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, html, 'utf8');
}

function prerenderRoutes() {
  const indexPath = path.join(BUILD_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.warn('⚠️  build/index.html not found — skip prerender');
    return;
  }

  const baseHtml = fs.readFileSync(indexPath, 'utf8');
  const articles = readSnapshotArticles();

  const homeHtml = injectRoot(baseHtml, homeShell());
  writeHtml(indexPath, homeHtml);
  console.log('✅ Prerendered / (index.html shell)');

  const techNewsHtml = injectRoot(baseHtml, techNewsShell(articles));
  // Point canonical-ish title for list page
  const techNewsWithTitle = techNewsHtml.replace(
    /<title>[^<]*<\/title>/,
    '<title>Tech News | Cem Koyluoglu</title>',
  );
  writeHtml(path.join(BUILD_DIR, 'tech-news', 'index.html'), techNewsWithTitle);
  console.log(`✅ Prerendered /tech-news (${articles.length} article teasers)`);
}

try {
  prerenderRoutes();
} catch (error) {
  console.error('Prerender failed:', error.message);
  // Non-fatal: deploy should still succeed
  process.exitCode = 0;
}
