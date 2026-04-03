/**
 * Detects likely mistranslated tech news rows (title vs body misalignment)
 * and optionally deletes them from tech_news_articles so they can be re-scraped.
 *
 * Usage:
 *   node scripts/delete-flawed-tech-news.mjs              # dry-run (default)
 *   node scripts/delete-flawed-tech-news.mjs --execute    # actually delete
 *   node scripts/delete-flawed-tech-news.mjs --since=2026-04-01T00:00:00Z
 */

import { supabase } from './lib/supabaseAdmin.js';
import { env, writeJsonArtifact } from './lib/config.js';

const STOPWORDS = new Set(
  `the a an and or but in on at to for of as is was are were be been being it this that these those with from by
   will would could should may might must can about into through over after before under again further then once
   here there when where why how all each both few more most other some such no nor not only own same so than too
   very just also now new get got two one three four five two new old any your you our their its his her them they
   we he she who which what whom whose if because while during about against between out up down off than`.split(
    /\s+/,
  ),
);

const KNOWN_BAD_TITLE_REGEXES = [
  /leave your car behind/i,
  /when you leave your car/i,
  /numbered glasses users to get/i,
  /numbered glasses users\b/i,
  /china'?s unintentionally opened/i,
  /\bunintentionally opened\b/i,
];

function getArg(name, def = null) {
  const prefix = `${name}=`;
  const raw = process.argv.find((a) => a === name || a.startsWith(prefix));
  if (!raw) return def;
  if (raw === name) return true;
  return raw.slice(prefix.length);
}

function tokenizeTitle(title) {
  const raw = String(title || '')
    .toLowerCase()
    .match(/[a-z0-9]+/g);
  if (!raw) return [];
  return raw.filter((t) => t.length >= 4 && !STOPWORDS.has(t));
}

function countTitleTokensInBody(titleTokens, description, content) {
  const body = `${description || ''} ${String(content || '').slice(0, 4500)}`.toLowerCase();
  let hits = 0;
  for (const t of titleTokens) {
    const esc = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${esc}\\b`, 'i').test(body)) hits++;
  }
  return { hits, total: titleTokens.length };
}

function isFlawed(row) {
  const reasons = [];
  const title = row.title || '';

  for (const re of KNOWN_BAD_TITLE_REGEXES) {
    if (re.test(title)) reasons.push(`known_bad_pattern:${re.source}`);
  }

  const tokens = tokenizeTitle(title);
  if (tokens.length >= 5) {
    const { hits, total } = countTitleTokensInBody(tokens, row.description, row.content);
    const ratio = hits / total;
    if (ratio < 0.28) {
      reasons.push(`low_title_body_overlap:${hits}/${total}=${ratio.toFixed(2)}`);
    }
  }

  return reasons.length ? reasons : null;
}

async function main() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    console.error('❌ SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY eksik (.env / .env.local)');
    process.exit(1);
  }

  const execute = process.argv.includes('--execute');
  const since =
    getArg('--since', '2026-04-01T00:00:00.000Z') || '2026-04-01T00:00:00.000Z';

  console.log(`📅 since=${since}  ${execute ? '⚠️ EXECUTE (silme yapılacak)' : '🔍 DRY-RUN'}`);

  const { data: rows, error } = await supabase
    .from('tech_news_articles')
    .select('id, slug, title, description, content, created_at, source_url')
    .gte('created_at', since)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Supabase okuma hatası:', error.message);
    process.exit(1);
  }

  const flagged = [];
  for (const row of rows || []) {
    const reasons = isFlawed(row);
    if (reasons) flagged.push({ ...row, reasons });
  }

  console.log(`\n📊 Toplam incelenen: ${(rows || []).length} | Şüpheli: ${flagged.length}\n`);

  for (const f of flagged) {
    console.log(`— ${f.slug}`);
    console.log(`  title: ${(f.title || '').slice(0, 90)}${(f.title || '').length > 90 ? '…' : ''}`);
    console.log(`  reasons: ${f.reasons.join(' | ')}`);
  }

  const artifactPath = await writeJsonArtifact('tech-news-flawed-delete-batch', {
    version: 1,
    type: 'tech-news-flawed-delete',
    since,
    execute,
    startedAt: new Date().toISOString(),
    flagged: flagged.map(({ id, slug, title, reasons, source_url, created_at }) => ({
      id,
      slug,
      title,
      reasons,
      source_url,
      created_at,
    })),
  });
  console.log(`\n🧾 Önizleme kaydı: ${artifactPath}`);

  if (flagged.length === 0) {
    console.log('\n✅ Silinecek kayıt yok.');
    return;
  }

  if (!execute) {
    console.log('\n💡 Gerçek silme için: node scripts/delete-flawed-tech-news.mjs --execute');
    return;
  }

  const ids = flagged.map((f) => f.id);
  const { data: deleted, error: delErr } = await supabase
    .from('tech_news_articles')
    .delete()
    .in('id', ids)
    .select('id, slug');

  if (delErr) {
    console.error('❌ Silme hatası:', delErr.message);
    process.exit(1);
  }

  console.log(`\n✅ Silinen satır: ${deleted?.length ?? 0}`);
  (deleted || []).forEach((d) => console.log(`   · ${d.slug}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
