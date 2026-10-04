/**
 * Output checks for generated Engineer's Notes. A note is published only when
 * every blocking check passes; otherwise the generator retries with the issues
 * as fix hints, and finally gives up (nothing is published).
 *
 * The guard exists so automation can never put words in Cem's mouth:
 * - no first-person voice at all (related work is appended deterministically
 *   from lib/portfolio/facts.js, never written by the model);
 * - no mention of the site owner;
 * - every URL and every number must appear in the source text;
 * - no echoes of injected instructions from the source.
 */

export const REQUIRED_HEADINGS = ['## What happened', '## Why it matters in production', '## Engineering takeaways'];
const MIN_WORDS = 220;
const MAX_WORDS = 1100;

/** Text with quotations and code removed — quoting a source is allowed. */
function stripQuotedAndCode(text) {
  return String(text)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/"[^"\n]*"/g, ' ')
    .replace(/“[^”\n]*”/g, ' ')
    .replace(/^>.*$/gm, ' ');
}

const FIRST_PERSON = /\b(?:I|I'm|I’m|I've|I’ve|I'd|I’d|I'll|I’ll|me|my|mine|myself|we|we're|we’re|we've|we’ve|we'd|we'll|our|ours|ourselves|us)\b/g;
// "We"/"Our"/"Us" capitalised (sentence start) — but not the country "US".
const FIRST_PERSON_CAPS = /\b(?:We|We're|We’re|We've|We’ve|Our|Ours)\b/g;

const OWNER = /\b(?:Cem|Koyluoglu|Köylüoğlu|the author|this author|the site owner|the writer)\b/i;

const INJECTION_ECHO = [
  /ignore (?:all |any )?(?:previous|prior|above) (?:instructions|prompts)/i,
  /system prompt/i,
  /<\/?source>/i,
  /as an ai(?: language)? model/i,
  /\bI (?:cannot|can't|can’t|am unable to)\b/i,
  /developer mode/i,
  /new instructions?:/i,
];

const URL = /https?:\/\/[^\s)\]>"'`]+/gi;

function normaliseUrl(url) {
  return url.replace(/[.,;:!?]+$/, '').replace(/\/+$/, '').toLowerCase();
}

/** Numbers that carry a claim: 2+ digits, decimals, or anything with % / x / $. */
function claimNumbers(text) {
  const out = new Set();
  const re = /(?:\$\s?)?\d[\d,]*(?:\.\d+)?\s?(?:%|x\b|×)?/g;
  for (const match of stripQuotedAndCode(text).matchAll(re)) {
    const raw = match[0].trim();
    const digits = raw.replace(/[^\d.]/g, '').replace(/\.$/, '');
    if (!digits) continue;
    const isClaim = digits.replace('.', '').length >= 2 || /[%x×$.]/.test(raw);
    if (isClaim) out.add(digits.replace(/,/g, ''));
  }
  return out;
}

function sourceNumbers(sourceText) {
  const out = new Set();
  for (const match of String(sourceText).matchAll(/\d[\d,]*(?:\.\d+)?/g)) {
    out.add(match[0].replace(/,/g, '').replace(/\.$/, ''));
  }
  return out;
}

function wordCount(text) {
  return String(text).split(/\s+/).filter(Boolean).length;
}

/**
 * @param {object} note
 * @param {string} note.title
 * @param {string} note.description
 * @param {string} note.body - markdown body written by the model
 * @param {object} context
 * @param {string} context.sourceText - extracted source article text
 * @param {string} context.sourceUrl
 * @param {number[]} [context.allowedYears] - years that may appear without being in the source
 * @returns {{ ok: boolean, issues: Array<{ code: string, detail: string }> }}
 */
export function checkNote(note, { sourceText, sourceUrl, allowedYears = [] }) {
  const issues = [];
  const add = (code, detail) => issues.push({ code, detail });
  const title = String(note?.title || '').trim();
  const description = String(note?.description || '').trim();
  const body = String(note?.body || '').trim();
  const all = `${title}\n${description}\n${body}`;

  if (!title || title.length > 100) add('TITLE_LENGTH', `title must be 1-100 characters (got ${title.length})`);
  if (!description || description.length < 50 || description.length > 170) {
    add('DESCRIPTION_LENGTH', `description must be 50-170 characters (got ${description.length})`);
  }

  const words = wordCount(body);
  if (words < MIN_WORDS || words > MAX_WORDS) add('BODY_LENGTH', `body must be ${MIN_WORDS}-${MAX_WORDS} words (got ${words})`);

  for (const heading of REQUIRED_HEADINGS) {
    if (!body.includes(heading)) add('MISSING_HEADING', `missing "${heading}"`);
  }
  if (/^#\s/m.test(body)) add('H1_IN_BODY', 'body must not contain a level-1 heading');

  const voiceText = stripQuotedAndCode(all);
  const firstPerson = [...(voiceText.match(FIRST_PERSON) || []), ...(voiceText.match(FIRST_PERSON_CAPS) || [])];
  if (firstPerson.length) {
    add('FIRST_PERSON', `first-person voice is not allowed (found: ${[...new Set(firstPerson)].slice(0, 5).join(', ')})`);
  }

  if (OWNER.test(voiceText)) add('OWNER_MENTION', 'must not mention the site owner or "the author"');

  for (const pattern of INJECTION_ECHO) {
    if (pattern.test(all)) add('INJECTION_ECHO', `contains instruction-like text (${pattern.source})`);
  }

  const sourceUrls = new Set([...(String(sourceText).match(URL) || []), sourceUrl].filter(Boolean).map(normaliseUrl));
  for (const url of all.match(URL) || []) {
    if (!sourceUrls.has(normaliseUrl(url))) add('UNKNOWN_URL', `URL not present in the source: ${url}`);
  }

  const known = sourceNumbers(sourceText);
  const years = new Set(allowedYears.map(String));
  const ungrounded = [...claimNumbers(all)].filter((n) => !known.has(n) && !years.has(n));
  if (ungrounded.length) add('UNGROUNDED_NUMBER', `numbers not found in the source: ${ungrounded.slice(0, 8).join(', ')}`);

  return { ok: issues.length === 0, issues };
}

/** Human-readable fix list for a retry prompt. */
export function issuesAsFixHints(issues) {
  return issues.map((i) => `- ${i.code}: ${i.detail}`).join('\n');
}
