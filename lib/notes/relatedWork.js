/**
 * Deterministic "Related work" section for an Engineer's Note. Built only from
 * lib/portfolio/facts.js — the model never writes this part, so a note can link
 * to Cem's work without anyone (or anything) inventing experience.
 */

import { projectsForTopic, skillsForTopic } from '../portfolio/facts.js';

export const AI_DISCLOSURE =
  '*This note was drafted with AI assistance from the primary source credited on this page, and automatically checked against that source before publishing.*';

export function relatedWorkMarkdown(topicId) {
  const skills = skillsForTopic(topicId).slice(0, 2);
  const projects = projectsForTopic(topicId).slice(0, 2);
  if (!skills.length && !projects.length) return '';

  const lines = ['## Related work on this site', ''];
  for (const skill of skills) {
    lines.push(`- **[${skill.name}](/skills/${skill.slug})** — ${skill.summary}`);
  }
  for (const project of projects) {
    lines.push(`- **[${project.title}](/work/${project.slug})** — ${project.summary}`);
  }
  return lines.join('\n');
}

/** Final article markdown: model body + deterministic related work + disclosure. */
export function composeNoteMarkdown({ body, topicId }) {
  return [body.trim(), relatedWorkMarkdown(topicId), '---', AI_DISCLOSURE].filter(Boolean).join('\n\n');
}
