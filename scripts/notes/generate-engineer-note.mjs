/**
 * Engineer's Notes generator — the first-party, indexable tech-news stream.
 *
 *   node scripts/notes/generate-engineer-note.mjs [--dry-run] [--max=1]
 *
 * 1. Reads primary-source feeds (lib/notes/feeds.js) and keeps recent items on
 *    the site's focus topics (lib/notes/topics.js) that are not published yet.
 * 2. Fetches the source article and asks Groq for a structured briefing.
 * 3. Runs the claim guard (lib/notes/claimGuard.js); failed drafts are retried
 *    with the issues as fix hints, and dropped if they still fail.
 * 4. Appends the deterministic related-work section + AI disclosure and saves
 *    the note as source_kind='original' (indexable), then pings IndexNow and
 *    reports to Telegram.
 *
 * Fully automatic by design; the guard is what makes that safe. Nothing is
 * published that uses first-person voice, mentions the site owner, or contains
 * a URL or number that is not in the source.
 */

import crypto from 'node:crypto';
import Groq from 'groq-sdk';
import { env, writeJsonArtifact } from '../lib/config.js';
import { supabase } from '../lib/supabaseAdmin.js';
import { notifyTelegram } from '../lib/telegram.js';
import { generateSlug } from '../lib/scraper/slugUtils.js';
import { GROQ_FALLBACK_MODEL, GROQ_PRIMARY_MODEL } from '../../lib/groqModels.js';
import { NOTE_FEEDS, extractArticleText, ogImage, parseFeed } from '../../lib/notes/feeds.js';
import { MIN_TOPIC_SCORE, scoreItem } from '../../lib/notes/topics.js';
import { checkNote, issuesAsFixHints } from '../../lib/notes/claimGuard.js';
import { NOTE_SYSTEM_PROMPT, buildNoteUserPrompt } from '../../lib/notes/prompt.js';
import { composeNoteMarkdown } from '../../lib/notes/relatedWork.js';
import { noteDraftButton } from '../../lib/notes/socialDraft.js';
import { SOURCE_KIND_ORIGINAL } from '../../lib/seo/indexability.js';
import { INDEXNOW_ENDPOINT, buildIndexNowPayload } from '../../lib/seo/indexNow.js';
import { SITE_URL } from '../../lib/seo/siteMeta.js';

export const NOTES_CATEGORY = "Engineer's Notes";
const MAX_AGE_DAYS = 10;
const MIN_SOURCE_CHARS = 800;
const MAX_ATTEMPTS = 3;
const MAX_CANDIDATES_TRIED = 4;
const USER_AGENT = 'Mozilla/5.0 (compatible; CemKoyluogluNotes/1.0; +https://cemkoyluoglu.tech)';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const MAX_NOTES = Number((args.find((a) => a.startsWith('--max=')) || '--max=1').split('=')[1]) || 1;

async function fetchText(url, timeoutMs = 20000) {
  const response = await fetch(url, { headers: { 'user-agent': USER_AGENT }, signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.text();
}

async function collectCandidates() {
  const cutoff = Date.now() - MAX_AGE_DAYS * 86400_000;
  const candidates = [];

  for (const feed of NOTE_FEEDS) {
    try {
      const items = parseFeed(await fetchText(feed.url));
      for (const item of items) {
        const published = item.published ? Date.parse(item.published) : NaN;
        if (Number.isFinite(published) && published < cutoff) continue;
        const { topic, score } = scoreItem(item);
        if (!topic || score < MIN_TOPIC_SCORE) continue;
        candidates.push({ ...item, sourceName: feed.name, topic, score, publishedAt: Number.isFinite(published) ? published : 0 });
      }
    } catch (error) {
      console.warn(`⚠️  Feed failed (${feed.name}): ${error.message}`);
    }
  }

  candidates.sort((a, b) => b.score - a.score || b.publishedAt - a.publishedAt);
  return candidates;
}

async function dropPublished(candidates) {
  if (!candidates.length) return candidates;
  const links = candidates.map((c) => c.link);
  const { data, error } = await supabase.from('tech_news_articles').select('source_url').in('source_url', links);
  if (error) throw new Error(`Supabase duplicate check failed: ${error.message}`);
  const seen = new Set((data || []).map((r) => r.source_url));
  return candidates.filter((c) => !seen.has(c.link));
}

function parseModelJson(raw) {
  const text = String(raw || '').trim();
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(text.slice(start, end + 1));
    throw new Error('model did not return JSON');
  }
}

async function draftNote(groq, model, candidate, sourceText, fixHints) {
  const completion = await groq.chat.completions.create({
    model,
    temperature: 0.3,
    max_completion_tokens: 8000,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: NOTE_SYSTEM_PROMPT },
      {
        role: 'user',
        content: buildNoteUserPrompt({
          sourceTitle: candidate.title,
          sourceName: candidate.sourceName,
          published: candidate.published,
          topicLabel: candidate.topic.label,
          sourceText,
          fixHints,
        }),
      },
    ],
  });
  const parsed = parseModelJson(completion.choices?.[0]?.message?.content);
  return { title: parsed.title, description: parsed.description, body: parsed.body };
}

/** Draft → guard → retry with fix hints. Returns the passing note or the last failure. */
export async function writeGuardedNote({ groq, candidate, sourceText, models = [GROQ_FALLBACK_MODEL, GROQ_PRIMARY_MODEL] }) {
  const year = new Date().getUTCFullYear();
  const allowedYears = [year, year - 1, year + 1];
  let fixHints = null;
  let last = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const model = models[Math.min(attempt - 1, models.length - 1)];
    try {
      const note = await draftNote(groq, model, candidate, sourceText, fixHints);
      const verdict = checkNote(note, { sourceText, sourceUrl: candidate.link, allowedYears });
      last = { note, verdict, attempt, model };
      console.log(`   ✍️  attempt ${attempt} (${model}): ${verdict.ok ? 'PASS' : verdict.issues.map((i) => i.code).join(', ')}`);
      if (verdict.ok) return { ok: true, ...last };
      fixHints = issuesAsFixHints(verdict.issues);
    } catch (error) {
      console.warn(`   ⚠️  attempt ${attempt} (${model}) errored: ${error.message}`);
      last = { note: null, verdict: { ok: false, issues: [{ code: 'MODEL_ERROR', detail: error.message }] }, attempt, model };
    }
  }
  return { ok: false, ...last };
}

async function uniqueSlug(base) {
  for (let n = 1; n <= 25; n += 1) {
    const slug = n === 1 ? base : `${base}-${n}`;
    const { data, error } = await supabase.from('tech_news_articles').select('id').eq('slug', slug).limit(1);
    if (error) throw new Error(`slug check failed: ${error.message}`);
    if (!data?.length) return slug;
  }
  return `${base}-${Date.now()}`;
}

async function saveNote({ candidate, result, imageUrl }) {
  const content = composeNoteMarkdown({ body: result.note.body, topicId: candidate.topic.id });
  const slug = await uniqueSlug(generateSlug(result.note.title));
  const row = {
    title: result.note.title.trim(),
    description: result.note.description.trim(),
    content,
    original_title: candidate.title,
    image_url: imageUrl,
    date: new Date().toISOString().slice(0, 10),
    category: NOTES_CATEGORY,
    source_url: candidate.link,
    original_source: candidate.link,
    slug,
    content_hash: crypto.createHash('sha256').update(candidate.link).digest('hex'),
    importance_score: Math.min(95, 60 + candidate.score * 3),
    source_kind: SOURCE_KIND_ORIGINAL,
    publish_status: 'published',
    review_state: 'auto_pass',
    quality_flags: {
      pipeline: 'engineer-notes',
      topic: candidate.topic.id,
      source: candidate.sourceName,
      guard: 'pass',
      attempts: result.attempt,
      model: result.model,
    },
  };

  const { data, error } = await supabase.from('tech_news_articles').insert([row]).select('id, slug').single();
  if (error) throw new Error(`insert failed: ${error.message}`);
  return data;
}

async function pingIndexNow(paths) {
  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(buildIndexNowPayload(paths)),
      signal: AbortSignal.timeout(15000),
    });
    console.log(`📡 IndexNow → HTTP ${response.status}`);
  } catch (error) {
    console.warn(`⚠️  IndexNow failed: ${error.message}`);
  }
}

function escapeTelegram(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function main() {
  if (!env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not set');
  const groq = new Groq({ apiKey: env.GROQ_API_KEY });

  const candidates = await dropPublished(await collectCandidates());
  console.log(`🧭 ${candidates.length} unpublished on-topic candidate(s)`);

  const published = [];
  const rejected = [];

  for (const candidate of candidates.slice(0, MAX_CANDIDATES_TRIED)) {
    if (published.length >= MAX_NOTES) break;
    console.log(`\n📰 [${candidate.topic.id} · ${candidate.score}] ${candidate.title}\n   ${candidate.link}`);

    let html;
    try {
      html = await fetchText(candidate.link);
    } catch (error) {
      console.warn(`   ⚠️  source fetch failed: ${error.message}`);
      continue;
    }
    const sourceText = extractArticleText(html);
    if (sourceText.length < MIN_SOURCE_CHARS) {
      console.warn(`   ⚠️  source text too short (${sourceText.length} chars) — skipping`);
      continue;
    }

    const result = await writeGuardedNote({ groq, candidate, sourceText });
    if (!result.ok) {
      rejected.push({ candidate: candidate.link, issues: result.verdict.issues });
      continue;
    }

    if (DRY_RUN) {
      console.log('\n──── DRY RUN: note that would be published ────');
      console.log(`# ${result.note.title}\n> ${result.note.description}\n`);
      console.log(composeNoteMarkdown({ body: result.note.body, topicId: candidate.topic.id }));
      published.push({ slug: '(dry-run)', title: result.note.title });
      continue;
    }

    const saved = await saveNote({ candidate, result, imageUrl: ogImage(html) });
    published.push({
      ...saved,
      title: result.note.title,
      body: result.note.body,
      source: candidate.sourceName,
      topic: candidate.topic.label,
    });
    console.log(`   ✅ published /tech-news/${saved.slug}`);
  }

  await writeJsonArtifact('engineer-notes-run', { at: new Date().toISOString(), dryRun: DRY_RUN, published, rejected }).catch(() => {});

  if (DRY_RUN) return;

  if (published.length) {
    await pingIndexNow(published.map((p) => `/tech-news/${p.slug}`));
    // Social drafts are on demand: each note gets a button and the webhook
    // replies with its LinkedIn/X draft only when tapped.
    await notifyTelegram(
      [
        "📝 <b>Engineer's Notes published</b>",
        ...published.map((p) => `• <a href="${SITE_URL}/tech-news/${p.slug}">${escapeTelegram(p.title)}</a> — ${escapeTelegram(p.topic)} (${escapeTelegram(p.source)})`),
      ].join('\n'),
      { reply_markup: { inline_keyboard: published.map((p) => noteDraftButton(p)) } },
    );
  } else {
    await notifyTelegram(
      [
        "ℹ️ <b>Engineer's Notes — nothing published</b>",
        `Candidates: ${candidates.length}. Rejected by guard: ${rejected.length}.`,
        ...rejected.slice(0, 3).map((r) => `• ${escapeTelegram(r.candidate)}: ${escapeTelegram(r.issues.map((i) => i.code).join(', '))}`),
      ].join('\n'),
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(async (error) => {
    console.error('❌ Engineer notes run failed:', error);
    await notifyTelegram(`❌ <b>Engineer's Notes failed</b>\n${escapeTelegram(error.message)}`);
    process.exit(1);
  });
}
