/**
 * Stats strip — four hairline-separated cells under the hero.
 * Values come from the design prototype ("follow the design exactly");
 * edit them here when the numbers change.
 */

import { useI18n, type Tr } from '../features/i18n';
import { SPRINGER_CCIS_BOOK_URL } from '../lib/constants/urls';

interface StatCell {
  value: string;
  label: Tr;
  accent?: boolean;
  /** Optional external link for the value (opens in a new tab). */
  href?: string;
  /** Letter-clipped RTL shine on the value (CSS-only). */
  shimmer?: boolean;
}

const STATS: StatCell[] = [
  { value: '97%', label: { en: 'DEEPFAKE DETECTION ACCURACY', tr: 'DEEPFAKE TESPİT DOĞRULUĞU' } },
  { value: '58', label: { en: 'PUBLIC REPOSITORIES', tr: 'AÇIK DEPOLAR' } },
  { value: '20h', label: { en: 'AUTOMATED PER WEEK', tr: 'HAFTADA OTOMASYON' } },
  {
    // Conference brand in the value; CCIS is the Springer book series (vol. 2950).
    value: 'AICS',
    label: { en: 'SPRINGER · CCIS 2025', tr: 'SPRINGER · CCIS 2025' },
    accent: true,
    href: SPRINGER_CCIS_BOOK_URL,
    shimmer: true,
  },
];

export function StatsStrip() {
  const { t } = useI18n();

  return (
    <section className="mx-auto grid max-w-[1440px] grid-cols-2 border-y border-hairline lg:grid-cols-4">
      {STATS.map((stat, index) => {
        const valueClass = [
          'font-sans text-[clamp(30px,3vw,40px)] font-bold leading-none tracking-[-0.03em]',
          stat.accent && !stat.shimmer ? 'text-signal' : '',
          stat.shimmer ? 'stat-shimmer' : '',
          stat.href && !stat.shimmer ? 'transition-colors hover:text-signal-hover' : '',
        ]
          .filter(Boolean)
          .join(' ');

        const value = stat.href ? (
          <a
            href={stat.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${valueClass} inline-block`}
            aria-label={t({
              en: 'AICS 2025 proceedings — Springer CCIS',
              tr: 'AICS 2025 bildiriler kitabı — Springer CCIS',
            })}
          >
            {stat.value}
          </a>
        ) : (
          <div className={valueClass}>{stat.value}</div>
        );

        return (
          <div
            key={stat.value}
            className={`border-hairline p-6 sm:px-[clamp(18px,3vw,32px)] ${
              index % 2 === 0 ? 'border-r' : 'lg:border-r'
            } ${index < 2 ? 'border-b lg:border-b-0' : ''} ${index === 3 ? 'lg:border-r-0' : ''}`}
          >
            {value}
            <div className="mt-2 font-mono text-[10.5px] leading-[1.4] tracking-[0.1em] text-ink-42">
              {t(stat.label)}
            </div>
          </div>
        );
      })}
    </section>
  );
}
