/**
 * Backfill tech_news_articles.importance_score using keyword heuristic only
 * (no Gemini — cheap, immediate LEAD ranking improvement).
 *
 * Usage: node scripts/backfill-importance-scores.js [--dry-run]
 */

import { supabase } from './lib/supabaseAdmin.js';
import { env } from './lib/config.js';
import { keywordImportanceScore } from './lib/scraper/importanceScore.js';

const BATCH = 100;
const dryRun = process.argv.includes('--dry-run');

async function backfill() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  console.log(`🔄 Backfilling importance_score (keyword heuristic)${dryRun ? ' [DRY RUN]' : ''}…`);

  let from = 0;
  let updated = 0;
  let scanned = 0;

  while (true) {
    const { data, error } = await supabase
      .from('tech_news_articles')
      .select('id, title, description, content, importance_score')
      .order('created_at', { ascending: false })
      .range(from, from + BATCH - 1);

    if (error) {
      console.error('❌ Fetch failed:', error.message);
      process.exit(1);
    }

    if (!data?.length) break;

    for (const row of data) {
      scanned += 1;
      const score = keywordImportanceScore({
        title: row.title,
        description: row.description,
        content: row.content,
      });

      if (row.importance_score === score) continue;

      if (dryRun) {
        console.log(`   would update ${row.id}: ${row.importance_score ?? 50} → ${score} | ${String(row.title).slice(0, 60)}`);
        updated += 1;
        continue;
      }

      const { error: updateError } = await supabase
        .from('tech_news_articles')
        .update({ importance_score: score })
        .eq('id', row.id);

      if (updateError) {
        console.error(`   ❌ ${row.id}: ${updateError.message}`);
      } else {
        updated += 1;
      }
    }

    if (data.length < BATCH) break;
    from += BATCH;
  }

  console.log(`✅ Done. Scanned ${scanned}, ${dryRun ? 'would update' : 'updated'} ${updated}.`);
}

backfill().catch((err) => {
  console.error(err);
  process.exit(1);
});
