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
