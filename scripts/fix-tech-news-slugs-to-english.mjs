/**
 * Rewrite tech_news_articles.slug from Nuvemmag Turkish URL segments to English slugs
 * derived from the stored English title (same rules as generateSlug / scraper).
 *
 * By default only rows that still look "Turkish-sourced" are touched (slug equals nuvemmag
 * path tail, or Turkish letters in slug). Use --normalize-all to re-slug every row from
 * title (can break existing English URLs — avoid unless you intend a full normalize).
 *
 * Usage:
 *   node scripts/fix-tech-news-slugs-to-english.mjs --dry-run
 *   node scripts/fix-tech-news-slugs-to-english.mjs --apply
 *   node scripts/fix-tech-news-slugs-to-english.mjs --apply --normalize-all
 */
import { supabase } from './lib/supabaseAdmin.js';
import { env } from './lib/config.js';
import { generateSlug, ensureUniqueSlug, extractSlugFromUrl } from './lib/scraper/database.js';

const DRY = !process.argv.includes('--apply');
const FULL_NORMALIZE = process.argv.includes('--normalize-all');

function stillTurkishSourcedSlug(row) {
  const slug = row.slug || '';
  if (/[ğüşıöçĞÜŞİÖÇ]/.test(slug)) return true;
  const u = row.source_url || '';
  if (!u.includes('nuvemmag.com')) return false;
  const tail = extractSlugFromUrl(u);
  return Boolean(tail && tail === slug);
}

/** Mirrors ensureUniqueSlug suffix logic using in-memory slug occupancy (for --dry-run). */
function ensureUniqueSlugVirtual(baseSlug, excludeId, slugById) {
  if (!baseSlug) return baseSlug;

  const takenByOther = (candidate) =>
    [...slugById.entries()].some(([id, s]) => id !== excludeId && s === candidate);

  let candidateSlug = baseSlug;
  let suffix = 2;

  while (suffix <= 25) {
    if (!takenByOther(candidateSlug)) {
      return candidateSlug;
    }
    const suffixText = `-${suffix}`;
    candidateSlug = `${baseSlug.substring(0, Math.max(1, 60 - suffixText.length))}${suffixText}`.replace(
      /-+$/g,
      ''
    );
    suffix++;
  }

  return `${baseSlug.substring(0, 56)}-alt`.replace(/-+$/g, '');
}

async function fetchAll() {
  const pageSize = 500;
  let from = 0;
  const all = [];
  for (;;) {
    const { data, error } = await supabase
      .from('tech_news_articles')
      .select('id, title, slug, source_url')
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data?.length) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

async function main() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const rows = await fetchAll();
  /** @type {Map<string, string>} */
  const slugById = new Map(rows.map((r) => [r.id, r.slug || '']));
  const plan = [];

  for (const r of rows) {
    if (!FULL_NORMALIZE && !stillTurkishSourcedSlug(r)) continue;
    const title = (r.title || '').trim();
    if (!title) continue;
    const base = generateSlug(title);
    if (!base) continue;
    const unique = ensureUniqueSlugVirtual(base, r.id, slugById);
    if (unique !== r.slug) {
      plan.push({ id: r.id, oldSlug: r.slug, newSlug: unique, title: title.slice(0, 70) });
      slugById.set(r.id, unique);
    }
  }

  console.log(
    JSON.stringify(
      {
        dryRun: DRY,
        fullNormalize: FULL_NORMALIZE,
        totalRows: rows.length,
        willUpdate: plan.length,
        preview: plan.slice(0, 15),
      },
      null,
      2
    )
  );

  if (DRY) {
    console.log('\nDry run only. Re-run with --apply to write changes.');
    return;
  }

  let ok = 0;
  let fail = 0;
  for (const r of rows) {
    if (!FULL_NORMALIZE && !stillTurkishSourcedSlug(r)) continue;
    const title = (r.title || '').trim();
    if (!title) continue;
    const base = generateSlug(title);
    if (!base) continue;
    const unique = await ensureUniqueSlug(base, r.id);
    if (unique === r.slug) continue;

    const { error } = await supabase.from('tech_news_articles').update({ slug: unique }).eq('id', r.id);
    if (error) {
      console.error('Update failed', r.id, error.message);
      fail++;
    } else {
      ok++;
      r.slug = unique;
    }
  }
  console.log(JSON.stringify({ updated: ok, failed: fail }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
