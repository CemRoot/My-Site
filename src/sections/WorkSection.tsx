/**
 * Work — the six real projects from src/lib/constants/projects.ts rendered as
 * numbered editorial rows (repo constants are the single source of truth;
 * nothing invented from the design mock).
 */

import { PROJECTS } from '../lib/constants/projects';
import { SOCIAL_LINKS } from '../lib/constants/personal';
import { useI18n } from '../features/i18n';

interface WorkRow {
  index: string;
  title: string;
  description: string;
  metaTop: string;
  metaBottom: string;
  href?: string;
}

const ROWS: WorkRow[] = PROJECTS.map((project, i) => ({
  index: String(i + 1).padStart(2, '0'),
  title: project.title,
  description: project.description,
  metaTop: project.tags.slice(0, 2).join(' · ').toUpperCase(),
  metaBottom: (project.stats[0] ?? '').toUpperCase(),
  href: ('github' in project && project.github) || ('link' in project && project.link) || undefined,
}));

export function WorkSection() {
  const { t } = useI18n();

  return (
    <section
      id="work"
      className="mx-auto max-w-[1440px] scroll-mt-20 px-[clamp(18px,4vw,52px)] pt-[clamp(44px,7vh,80px)]"
    >
      <div className="rv flex flex-wrap items-baseline justify-between gap-[18px] font-mono text-[11px] font-medium leading-none tracking-[0.14em] text-ink-42">
        <span>{t({ en: 'SELECTED WORK', tr: 'SEÇİLİ ÇALIŞMALAR' })}</span>
        <span>2021 — 2026</span>
      </div>

      <div className="mt-6">
        {ROWS.map((row, i) => {
          const isLast = i === ROWS.length - 1;
          const content = (
            <>
              <span className="font-mono text-xs leading-[1.4] text-signal">{row.index}</span>
              <div className="grid items-baseline gap-[clamp(12px,2vw,26px)] md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,0.6fr)]">
                <h3 className="m-0 font-sans text-[clamp(24px,2.6vw,32px)] font-medium leading-[1.08] tracking-[-0.02em]">
                  {row.title}
                </h3>
                <p className="m-0 font-sans text-[13px] leading-[1.6] text-ink-55">
                  {row.description}
                </p>
                <span className="font-mono text-[11px] leading-[1.7] text-ink-42">
                  {row.metaTop}
                  {row.metaBottom && (
                    <>
                      <br />
                      {row.metaBottom}
                    </>
                  )}
                </span>
              </div>
            </>
          );

          const rowClasses = `rv grid grid-cols-[44px_minmax(0,1fr)] items-start gap-[clamp(14px,2vw,26px)] border-t border-hairline py-[26px] text-foreground hover:text-foreground ${
            isLast ? 'border-b' : ''
          }`;

          return row.href ? (
            <a
              key={row.index}
              href={row.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`${rowClasses} group`}
            >
              {content}
            </a>
          ) : (
            <div key={row.index} className={rowClasses}>
              {content}
            </div>
          );
        })}
      </div>

      <a
        href={SOCIAL_LINKS.github.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-[22px] inline-block border-b border-[rgba(255,74,28,0.5)] pb-1 font-mono text-[11px] font-medium leading-none tracking-[0.12em] text-signal hover:text-signal-hover"
      >
        {t({ en: 'ALL REPOSITORIES ON GITHUB →', tr: "TÜM REPOLAR GITHUB'DA →" })}
      </a>
    </section>
  );
}
