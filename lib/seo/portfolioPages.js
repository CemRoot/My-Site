/**
 * Skill (/skills/:slug), skills index (/skills) and case-study (/work/:slug)
 * pages, built from the verified facts registry (lib/portfolio/facts.js).
 *
 * Used twice: the postbuild prerender writes them as static HTML with full
 * crawler-visible content, and the sitemap lists them. The React pages render
 * the same facts, so what crawlers and visitors see cannot drift apart.
 */

import { PROJECT_FACTS, SKILL_FACTS, projectBySlug } from '../portfolio/facts.js';
import { escapeHtml } from './renderHead.js';
import { PERSON_ID, ROBOTS_INDEX, absoluteUrl } from './siteMeta.js';

const S = {
  page: "max-width:52rem;margin:0 auto;padding:6rem 1.25rem 4rem;font-family:'Space Grotesk',ui-sans-serif,system-ui,sans-serif;color:#ededea;line-height:1.7",
  crumb: "font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(237,237,234,0.45)",
  h1: 'font-size:clamp(1.9rem,4.5vw,3rem);line-height:1.1;margin:1rem 0',
  lede: 'font-size:1.15rem;color:rgba(237,237,234,0.8);margin:0 0 2rem',
  link: 'color:inherit',
};

const list = (items) => (items.length ? `<ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>` : '');

function breadcrumb(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: absoluteUrl(path),
    })),
  };
}

function crumbHtml(items) {
  return `<nav aria-label="Breadcrumb" style="${S.crumb}">${items
    .map(([name, path], i) => (i === items.length - 1 ? escapeHtml(name) : `<a href="${path}" style="${S.link}">${escapeHtml(name)}</a>`))
    .join(' / ')}</nav>`;
}

const CONTACT_HTML = `<h2>Work together</h2><p>Open to AI engineering roles in Dublin, across Ireland and remote, and to freelance projects. <a href="/#contact" style="${S.link}">Get in touch</a>.</p>`;

export function skillPath(slug) {
  return `/skills/${slug}`;
}

export function workPath(slug) {
  return `/work/${slug}`;
}

export function skillPage(skill) {
  const path = skillPath(skill.slug);
  const projects = skill.projectSlugs.map(projectBySlug).filter(Boolean);
  const crumbs = [['Home', '/'], ['Skills', '/skills'], [skill.name, path]];

  const evidence = projects
    .map(
      (p) =>
        `<li><a href="${workPath(p.slug)}" style="${S.link}"><strong>${escapeHtml(p.title)}</strong></a> — ${escapeHtml(p.summary)}${
          p.metrics.length ? ` <em>(${escapeHtml(p.metrics.join(' · '))})</em>` : ''
        }</li>`,
    )
    .join('');

  const bodyHtml = `<main id="prerender-shell" style="${S.page}">
${crumbHtml(crumbs)}
<h1 style="${S.h1}">${escapeHtml(skill.headline)}</h1>
<p style="${S.lede}">${escapeHtml(skill.summary)}</p>
${evidence ? `<h2>Evidence</h2><ul>${evidence}</ul>` : ''}
${skill.experience.length ? `<h2>Experience</h2>${list(skill.experience)}` : ''}
<h2>Keywords</h2><p>${escapeHtml(skill.keywords.join(' · '))}</p>
${CONTACT_HTML}
</main>`;

  return {
    path,
    title: `${skill.name} — AI Engineer in Dublin | Cem Koyluoglu`,
    description: `${skill.summary}`.slice(0, 160),
    robots: ROBOTS_INDEX,
    changefreq: 'monthly',
    priority: '0.8',
    jsonLdNodes: [
      {
        '@type': 'WebPage',
        '@id': `${absoluteUrl(path)}#webpage`,
        url: absoluteUrl(path),
        name: skill.headline,
        description: skill.summary,
        about: { '@type': 'DefinedTerm', name: skill.name },
        mainEntity: { '@id': PERSON_ID },
        keywords: skill.keywords.join(', '),
        hasPart: projects.map((p) => ({ '@id': `${absoluteUrl(workPath(p.slug))}#work` })),
      },
      breadcrumb(crumbs),
    ],
    bodyHtml,
  };
}

export function skillsIndexPage() {
  const crumbs = [['Home', '/'], ['Skills', '/skills']];
  const items = SKILL_FACTS.map(
    (s) => `<li><a href="${skillPath(s.slug)}" style="${S.link}"><strong>${escapeHtml(s.name)}</strong></a> — ${escapeHtml(s.summary)}</li>`,
  ).join('');

  return {
    path: '/skills',
    title: 'Skills — AI Engineer in Dublin, Ireland | Cem Koyluoglu',
    description:
      'AI engineering skills with evidence: RAG and grounded LLM systems, deepfake detection, computer vision, agentic LLM automation, Azure and Microsoft 365.',
    robots: ROBOTS_INDEX,
    changefreq: 'monthly',
    priority: '0.9',
    jsonLdNodes: [
      {
        '@type': 'CollectionPage',
        '@id': `${absoluteUrl('/skills')}#webpage`,
        url: absoluteUrl('/skills'),
        name: 'Skills',
        mainEntity: { '@id': PERSON_ID },
        hasPart: SKILL_FACTS.map((s) => ({ '@type': 'WebPage', url: absoluteUrl(skillPath(s.slug)), name: s.name })),
      },
      breadcrumb(crumbs),
    ],
    bodyHtml: `<main id="prerender-shell" style="${S.page}">
${crumbHtml(crumbs)}
<h1 style="${S.h1}">AI engineering skills</h1>
<p style="${S.lede}">Each skill below is backed by shipped projects or verified professional experience.</p>
<ul>${items}</ul>
${CONTACT_HTML}
</main>`,
  };
}

export function workPage(project) {
  const path = workPath(project.slug);
  const crumbs = [['Home', '/'], ['Work', '/#work'], [project.title, path]];
  const links = Object.entries(project.links || {}).filter(([, url]) => url);
  const linkLabel = { github: 'Source code on GitHub', demo: 'Live demo', site: 'See it live' };
  const skills = SKILL_FACTS.filter((s) => s.projectSlugs.includes(project.slug));

  const bodyHtml = `<main id="prerender-shell" style="${S.page}">
${crumbHtml(crumbs)}
<h1 style="${S.h1}">${escapeHtml(project.title)}</h1>
<p style="${S.lede}">${escapeHtml(project.summary)}</p>
${project.metrics.length ? `<p><strong>${escapeHtml(project.metrics.join(' · '))}</strong></p>` : ''}
<h2>Problem</h2><p>${escapeHtml(project.problem)}</p>
<h2>Approach</h2>${list(project.approach)}
<h2>Outcome</h2>${list(project.outcome)}
<h2>Stack</h2><p>${escapeHtml(project.stack.join(' · '))}</p>
${links.length ? `<h2>Links</h2><ul>${links.map(([k, url]) => `<li><a href="${escapeHtml(url)}" rel="noopener" style="${S.link}">${escapeHtml(linkLabel[k] || k)}</a></li>`).join('')}</ul>` : ''}
${skills.length ? `<h2>Related skills</h2><ul>${skills.map((s) => `<li><a href="${skillPath(s.slug)}" style="${S.link}">${escapeHtml(s.name)}</a></li>`).join('')}</ul>` : ''}
${CONTACT_HTML}
</main>`;

  const node = {
    '@type': project.links?.github ? 'SoftwareSourceCode' : 'CreativeWork',
    '@id': `${absoluteUrl(path)}#work`,
    name: project.title,
    description: project.summary,
    url: absoluteUrl(path),
    author: { '@id': PERSON_ID },
    creator: { '@id': PERSON_ID },
    keywords: project.stack.join(', '),
  };
  if (project.links?.github) node.codeRepository = project.links.github;
  if (project.links?.demo) node.sameAs = [project.links.demo];

  return {
    path,
    title: `${project.title} — Case Study | Cem Koyluoglu, AI Engineer`,
    description: project.summary.slice(0, 160),
    robots: ROBOTS_INDEX,
    changefreq: 'monthly',
    priority: '0.7',
    ogType: 'article',
    jsonLdNodes: [node, breadcrumb(crumbs)],
    bodyHtml,
  };
}

/** Every portfolio page, for prerender and sitemap. */
export function portfolioPages() {
  return [skillsIndexPage(), ...SKILL_FACTS.map(skillPage), ...PROJECT_FACTS.map(workPage)];
}

