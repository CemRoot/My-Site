import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env' });
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DRY_RUN = process.argv.includes('--dry-run');

const BAD_TITLE_PATTERNS = [
  /^\*{1,3}.{10,}\*{1,3}$/,
  /^.{150,}/,
  /__WIDGET_\d+__/,
  /\[\[EMBED:/,
];

const BAD_CONTENT_PATTERNS = [
  { pattern: /__WIDGET_\d+__/, label: '__WIDGET__ not restored' },
  { pattern: /We use cookies/i, label: 'cookie banner' },
  { pattern: /NecessaryAlways Active/i, label: 'cookie accordion' },
  { pattern: /CustomizeDeclineAccept/i, label: 'cookie buttons' },
];

function normalizeTitle(t) {
  return (t || '').toLowerCase().replace(/\*{1,3}/g, '').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

async function main() {
  console.log('\n🔍 Fetching articles...');
  const { data, error } = await supabase
    .from('tech_news_articles')
    .select('id, title, content, slug, created_at')
    .order('created_at', { ascending: true });

  if (error) { console.error('DB error:', error.message); process.exit(1); }
  console.log(`📊 Total: ${data.length}\n`);

  const toDelete = new Map();

  // Pass 1: bad content
  console.log('━━━ Pass 1: Bad content ━━━');
  for (const a of data) {
    for (const p of BAD_TITLE_PATTERNS) {
      if (p.test(a.title || '')) {
        toDelete.set(a.id, `Bad title: "${(a.title||'').substring(0,80)}"`);
        console.log(`  🚫 ${a.slug}`);
        console.log(`     → ${toDelete.get(a.id)}`);
        break;
      }
    }
    if (toDelete.has(a.id)) continue;
    for (const { pattern, label } of BAD_CONTENT_PATTERNS) {
      if (pattern.test(a.content || '')) {
        toDelete.set(a.id, `Content: ${label}`);
        console.log(`  🚫 ${a.slug}`);
        console.log(`     → ${label}`);
        break;
      }
    }
  }

  // Pass 2: duplicates
  console.log('\n━━━ Pass 2: Duplicates ━━━');
  const seen = new Map();
  for (const a of data) {
    if (toDelete.has(a.id)) continue;
    const hash = crypto.createHash('sha256').update(normalizeTitle(a.title)).digest('hex');
    if (seen.has(hash)) {
      const first = seen.get(hash);
      toDelete.set(a.id, `Duplicate of "${first.slug}"`);
      console.log(`  🔁 "${(a.title||'').substring(0,60)}"`);
      console.log(`     keep: ${first.slug} | remove: ${a.slug}`);
    } else {
      seen.set(hash, a);
    }
  }

  console.log(`\n${'━'.repeat(50)}`);
  console.log(`📋 To remove: ${toDelete.size} | To keep: ${data.length - toDelete.size}`);

  if (toDelete.size === 0) { console.log('\n✅ DB temiz!\n'); return; }

  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN — silme yapılmadı.');
    console.log('Silmek için: npm run cleanup:duplicates\n');
    return;
  }

  console.log('\n🗑️  Siliniyor...');
  const ids = [...toDelete.keys()];
  const { error: delErr } = await supabase
    .from('tech_news_articles').delete().in('id', ids);

  if (delErr) { console.error('❌ Delete error:', delErr.message); return; }
  console.log(`✅ ${ids.length} makale silindi. Kalan: ${data.length - ids.length}\n`);
}

main().catch(e => { console.error('💥', e.message); process.exit(1); });
