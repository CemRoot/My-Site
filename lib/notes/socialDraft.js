/**
 * LinkedIn / X post drafts for a published Engineer's Note, assembled from the
 * note's own guarded text (title + takeaway bullets). No model call, so the
 * draft cannot say anything the published note does not. Sent to Telegram for
 * Cem to post manually — nothing is auto-posted.
 */

const MAX_X = 280;

/** Bullet lines under "## Engineering takeaways". */
export function takeaways(body, limit = 3) {
  const section = String(body).split(/^## Engineering takeaways\s*$/m)[1] || '';
  return section
    .split(/^## /m)[0]
    .split('\n')
    .map((line) => line.match(/^\s*[-*]\s+(.*)$/)?.[1]?.replace(/\*\*/g, '').trim())
    .filter(Boolean)
    .slice(0, limit);
}

export function linkedInDraft({ title, body, url, topicLabel }) {
  const points = takeaways(body).map((t) => `→ ${t}`);
  return [
    title,
    '',
    'Engineering takeaways:',
    ...points,
    '',
    `Full note: ${url}`,
    '',
    `#AIEngineering #${String(topicLabel || 'AI').replace(/[^A-Za-z0-9]/g, '')} #MLOps #Dublin`,
  ].join('\n');
}

export function xDraft({ title, url }) {
  const suffix = ` ${url}`;
  const room = MAX_X - suffix.length;
  const text = title.length > room ? `${title.slice(0, room - 1).trimEnd()}…` : title;
  return `${text}${suffix}`;
}

/**
 * Drafts are sent on request only: the "published" notification carries one
 * button per note, and the Telegram webhook answers a tap with this message.
 * callback_data is capped at 64 bytes, so it carries the note's UUID, not its slug.
 */
export const NOTE_DRAFT_CALLBACK_PREFIX = 'note_draft:';

export function noteDraftButton({ id, title }) {
  const label = title.length > 40 ? `${title.slice(0, 39).trimEnd()}…` : title;
  return [{ text: `💼 Draft: ${label}`, callback_data: `${NOTE_DRAFT_CALLBACK_PREFIX}${id}` }];
}

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function socialDraftMessage({ title, body, url, topicLabel }) {
  return [
    '💼 <b>LinkedIn draft</b> (copy &amp; post)',
    `<pre>${escapeHtml(linkedInDraft({ title, body, url, topicLabel }))}</pre>`,
    '𝕏 <b>X draft</b>',
    `<pre>${escapeHtml(xDraft({ title, url }))}</pre>`,
  ].join('\n');
}
