/**
 * Remove NuvemMag footer / source social link leaks from tech_news_articles.content
 *
 * Usage:
 *   node scripts/cleanup-source-social-leaks.mjs           # dry-run
 *   node scripts/cleanup-source-social-leaks.mjs --execute # apply updates
 */

import { supabase } from './lib/supabaseAdmin.js';
import { env, writeJsonArtifact } from './lib/config.js';
import { stripSourceSocialLeaks, hasSourceSocialLeak } from './embeds/cleanMarkdownEmbeds.js';

const execute = process.argv.includes('--execute');

const LEAK_OR =
  'content.ilike.%nuvem.mag%,content.ilike.%nuvem-mag%,content.ilike.%Nuvem_tv%,' +
  'content.ilike.%Tweet by @%,content.ilike.%Instagram post by%,content.ilike.%LinkedIn post by%,' +
  'content.ilike.%[TWEET:%,content.ilike.%following links were%';

async function main() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing SUPABASE credentials');
    process.exit(1);
  }

  const { data: rows, error } = await supabase
    .from('tech_news_articles')
    .select('id, slug, content, created_at')
    .or(LEAK_OR)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Supabase read error:', error.message);
    process.exit(1);
  }

  const plan = [];
  for (const row of rows || []) {
    const cleaned = stripSourceSocialLeaks(row.content);
    if (cleaned === row.content) continue;
    plan.push({
      id: row.id,
      slug: row.slug,
      beforeLen: row.content.length,
      afterLen: cleaned.length,
      stillLeaks: hasSourceSocialLeak(cleaned),
      cleaned,
    });
  }

  console.log(`🔍 Candidates: ${rows?.length ?? 0} | Would update: ${plan.length}`);
  plan.forEach((p) => console.log(`  · ${p.slug} (${p.beforeLen} → ${p.afterLen} chars)${p.stillLeaks ? ' ⚠️ STILL LEAKS' : ''}`));

  const artifactPath = await writeJsonArtifact('tech-news-source-social-cleanup', {
    execute,
    scanned: rows?.length ?? 0,
    plannedUpdates: plan.map(({ id, slug, beforeLen, afterLen, stillLeaks }) => ({
      id, slug, beforeLen, afterLen, stillLeaks,
    })),
  });
  console.log(`🧾 Plan: ${artifactPath}`);

  if (plan.some((p) => p.stillLeaks)) {
    console.error('❌ Refusing to apply — stripper left leaks in at least one article');
    process.exit(1);
  }

  if (!execute) {
    console.log('\n💡 Apply: node scripts/cleanup-source-social-leaks.mjs --execute');
    return;
  }

  for (const p of plan) {
    const { error: updErr } = await supabase
      .from('tech_news_articles')
      .update({ content: p.cleaned })
      .eq('id', p.id);
    if (updErr) {
      console.error(`❌ Failed ${p.slug}:`, updErr.message);
      process.exit(1);
    }
  }

  console.log(`\n✅ Updated ${plan.length} article(s)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
