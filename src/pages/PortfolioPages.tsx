/**
 * /skills, /skills/:slug and /work/:slug — evidence pages for recruiters.
 *
 * Content comes only from the verified facts registry (lib/portfolio/facts.js);
 * scripts/prerender-static-shells.js writes the same facts as crawler-visible
 * HTML via lib/seo/portfolioPages.js, so both views always agree.
 */

import { useEffect, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { usePageContext } from '../lib/context/PageContext';
import {
  PROJECT_FACTS,
  SKILL_FACTS,
  projectBySlug,
  skillBySlug,
  type ProjectFact,
} from '../../lib/portfolio/facts.js';

/** Mirrors clipDescription in lib/seo/siteMeta.js so client and prerender agree. */
function clip(text: string, max = 160) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:.\-–—]+$/, '')}…`;
}

const PAGE = 'mx-auto max-w-[960px] px-[clamp(18px,4vw,52px)] pb-[clamp(64px,10vh,120px)]';
const MONO = 'font-mono text-[11px] font-medium tracking-[0.14em] uppercase';
const H2 = `mt-12 mb-4 ${MONO} text-ink-42`;

function Shell({ crumbs, children }: { crumbs: [string, string][]; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-background" style={{ paddingTop: 'calc(var(--nav-height, 64px) + 40px)' }}>
      <div className={PAGE}>
        <nav aria-label="Breadcrumb" className={`${MONO} text-ink-42`}>
          {crumbs.map(([name, to], i) => (
            <span key={to}>
              {i > 0 && ' / '}
              {i === crumbs.length - 1 ? (
                <span className="text-ink-62">{name}</span>
              ) : (
                <Link to={to} className="transition-colors hover:text-foreground">
                  {name}
                </Link>
              )}
            </span>
          ))}
        </nav>
        {children}
        <section className="mt-16 border-t border-hairline pt-8">
          <h2 className={H2}>Work together</h2>
          <p className="max-w-[62ch] text-ink-62">
            Open to AI engineering roles in Dublin, across Ireland and remote, and to freelance projects.{' '}
            <Link to="/#contact" className="text-signal hover:text-signal-hover">
              Get in touch →
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

function Title({ children }: { children: ReactNode }) {
  return (
    <h1 className="mt-6 font-sans text-[clamp(32px,4.5vw,52px)] font-medium leading-[1.08] tracking-[-0.02em]">
      {children}
    </h1>
  );
}

function Lede({ children }: { children: ReactNode }) {
  return <p className="mt-6 max-w-[62ch] text-lg leading-relaxed text-ink-62">{children}</p>;
}

function Bullets({ items }: { items: readonly string[] }) {
  return (
    <ul className="max-w-[68ch] list-disc space-y-2 pl-5 text-ink-62">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function ProjectCard({ project }: { project: ProjectFact }) {
  return (
    <Link
      to={`/work/${project.slug}`}
      className="block border-t border-hairline py-6 transition-colors hover:bg-[rgba(255,255,255,0.02)]"
    >
      <h3 className="font-sans text-2xl font-medium tracking-[-0.01em]">{project.title}</h3>
      <p className="mt-2 max-w-[68ch] text-sm leading-relaxed text-ink-55">{project.summary}</p>
      {project.metrics.length > 0 && <p className={`mt-3 ${MONO} text-signal`}>{project.metrics.join(' · ')}</p>}
    </Link>
  );
}

function usePortfolioContext(path: string, title: string, summary: string, highlights: string[]) {
  const { setPageInfo } = usePageContext();
  useEffect(() => {
    setPageInfo({ path, title, summary, highlights });
    return () => setPageInfo(null);
  }, [setPageInfo, path, title, summary, highlights]);
}

function NotFound({ kind }: { kind: string }) {
  return (
    <>
      <SEO title={`${kind} not found | Cem Koyluoglu`} robots="noindex, nofollow" />
      <Shell crumbs={[['Home', '/'], [kind, '/skills']]}>
        <Title>{kind} not found</Title>
        <Lede>
          <Link to="/skills" className="text-signal">
            See all skills →
          </Link>
        </Lede>
      </Shell>
    </>
  );
}

export function SkillsIndexPage() {
  usePortfolioContext(
    '/skills',
    'Skills',
    'AI engineering skills, each backed by shipped projects or verified experience.',
    SKILL_FACTS.map((s) => s.name),
  );

  return (
    <>
      <SEO
        title="Skills — AI Engineer in Dublin, Ireland | Cem Koyluoglu"
        description="AI engineering skills with evidence: RAG and grounded LLM systems, deepfake detection, computer vision, agentic LLM automation, Azure and Microsoft 365."
        canonicalPath="/skills"
      />
      <Shell crumbs={[['Home', '/'], ['Skills', '/skills']]}>
        <Title>AI engineering skills</Title>
        <Lede>Each skill below is backed by shipped projects or verified professional experience.</Lede>
        <div className="mt-10">
          {SKILL_FACTS.map((skill) => (
            <Link
              key={skill.slug}
              to={`/skills/${skill.slug}`}
              className="block border-t border-hairline py-6 transition-colors hover:bg-[rgba(255,255,255,0.02)]"
            >
              <h2 className="font-sans text-2xl font-medium tracking-[-0.01em]">{skill.name}</h2>
              <p className="mt-2 max-w-[68ch] text-sm leading-relaxed text-ink-55">{skill.summary}</p>
            </Link>
          ))}
        </div>
      </Shell>
    </>
  );
}

export function SkillPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const skill = skillBySlug(slug);
  const projects = (skill?.projectSlugs ?? []).map(projectBySlug).filter((p): p is ProjectFact => Boolean(p));
  usePortfolioContext(`/skills/${slug}`, skill?.name ?? 'Skill', skill?.summary ?? '', skill?.keywords ?? []);

  if (!skill) return <NotFound kind="Skill" />;

  return (
    <>
      <SEO
        title={`${skill.name} — AI Engineer in Dublin | Cem Koyluoglu`}
        description={clip(skill.summary)}
        canonicalPath={`/skills/${skill.slug}`}
      />
      <Shell crumbs={[['Home', '/'], ['Skills', '/skills'], [skill.name, `/skills/${skill.slug}`]]}>
        <Title>{skill.headline}</Title>
        <Lede>{skill.summary}</Lede>
        {projects.length > 0 && (
          <section>
            <h2 className={H2}>Evidence</h2>
            {projects.map((p) => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </section>
        )}
        {skill.experience.length > 0 && (
          <section>
            <h2 className={H2}>Experience</h2>
            <Bullets items={skill.experience} />
          </section>
        )}
        <section>
          <h2 className={H2}>Keywords</h2>
          <p className="text-ink-55">{skill.keywords.join(' · ')}</p>
        </section>
      </Shell>
    </>
  );
}

const LINK_LABEL: Record<string, string> = { github: 'Source code on GitHub', demo: 'Live demo', site: 'See it live' };

export function WorkPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const project = projectBySlug(slug);
  const skills = SKILL_FACTS.filter((s) => s.projectSlugs.includes(slug));
  usePortfolioContext(`/work/${slug}`, project?.title ?? 'Case study', project?.summary ?? '', project?.metrics ?? []);

  if (!project) return <NotFound kind="Project" />;
  const links = Object.entries(project.links).filter(([, url]) => Boolean(url)) as [string, string][];

  return (
    <>
      <SEO
        title={`${project.title} — Case Study | Cem Koyluoglu, AI Engineer`}
        description={clip(project.summary)}
        canonicalPath={`/work/${project.slug}`}
        type="article"
      />
      <Shell crumbs={[['Home', '/'], ['Work', '/#work'], [project.title, `/work/${project.slug}`]]}>
        <Title>{project.title}</Title>
        <Lede>{project.summary}</Lede>
        {project.metrics.length > 0 && <p className={`mt-6 ${MONO} text-signal`}>{project.metrics.join(' · ')}</p>}
        <section>
          <h2 className={H2}>Problem</h2>
          <p className="max-w-[68ch] text-ink-62">{project.problem}</p>
        </section>
        <section>
          <h2 className={H2}>Approach</h2>
          <Bullets items={project.approach} />
        </section>
        <section>
          <h2 className={H2}>Outcome</h2>
          <Bullets items={project.outcome} />
        </section>
        <section>
          <h2 className={H2}>Stack</h2>
          <p className="text-ink-55">{project.stack.join(' · ')}</p>
        </section>
        {links.length > 0 && (
          <section>
            <h2 className={H2}>Links</h2>
            <ul className="space-y-2">
              {links.map(([kind, url]) => (
                <li key={kind}>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-signal hover:text-signal-hover">
                    {LINK_LABEL[kind] ?? kind} ↗
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
        {skills.length > 0 && (
          <section>
            <h2 className={H2}>Related skills</h2>
            <ul className="space-y-2">
              {skills.map((s) => (
                <li key={s.slug}>
                  <Link to={`/skills/${s.slug}`} className="text-signal hover:text-signal-hover">
                    {s.name} →
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        <p className="mt-12 text-sm text-ink-42">
          More projects:{' '}
          {PROJECT_FACTS.filter((p) => p.slug !== project.slug)
            .slice(0, 3)
            .map((p, i) => (
              <span key={p.slug}>
                {i > 0 && ' · '}
                <Link to={`/work/${p.slug}`} className="hover:text-foreground">
                  {p.title}
                </Link>
              </span>
            ))}
        </p>
      </Shell>
    </>
  );
}

export default SkillPage;
