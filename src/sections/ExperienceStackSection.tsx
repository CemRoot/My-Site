/**
 * Experience + Stack — two editorial columns.
 * Experience rows are condensed from src/lib/constants/experience.ts facts;
 * stack chips live in src/lib/constants/stack.ts.
 */

import { STACK_GROUPS } from '../lib/constants/stack';
import { useI18n, type Tr } from '../features/i18n';

interface ExperienceRow {
  period: string;
  title: Tr;
  detail: Tr;
  accent?: boolean;
}

const ROWS: ExperienceRow[] = [
  {
    period: '2022 — 2025',
    title: {
      en: 'System Operations Engineer (Contractor)',
      tr: 'Sistem Operasyonları Mühendisi (Kontratlı)',
    },
    detail: {
      en: 'NDA client (EU) — Entra ID, Intune, Azure, Windows 365, PowerShell automation.',
      tr: 'NDA müşterisi (AB) — Entra ID, Intune, Azure, Windows 365, PowerShell otomasyonu.',
    },
    accent: true,
  },
  {
    period: '2024 — 2025',
    title: { en: 'MSc Artificial Intelligence — NCI', tr: 'MSc Yapay Zeka — NCI' },
    detail: {
      en: 'First Class Honours. Thesis: attention-based deepfake detection.',
      tr: 'First Class Honours. Tez: attention tabanlı deepfake tespiti.',
    },
  },
  {
    period: '2025',
    title: { en: 'Publication — Springer CCIS', tr: 'Yayın — Springer CCIS' },
    detail: {
      en: 'AICS 2025 · 33rd Irish Conference on AI & Cognitive Science.',
      tr: 'AICS 2025 · 33. İrlanda Yapay Zeka ve Bilişsel Bilim Konferansı.',
    },
  },
  {
    period: '2022 — 2023',
    title: { en: 'Junior Python Developer', tr: 'Junior Python Geliştirici' },
    detail: {
      en: 'Art-In Systems — Django dashboards and ETL for 100+ enterprise customers.',
      tr: "Art-In Systems — 100+ kurumsal müşteri için Django panelleri ve ETL.",
    },
  },
];

export function ExperienceStackSection() {
  const { t } = useI18n();
  const label =
    'font-mono text-[11px] font-medium leading-none tracking-[0.14em] text-ink-42';

  return (
    <section className="mx-auto grid max-w-[1440px] gap-[clamp(28px,5vw,64px)] px-[clamp(18px,4vw,52px)] pt-[clamp(44px,7vh,80px)] md:grid-cols-2">
      {/* Experience column */}
      <div>
        <div className={`rv ${label}`}>{t({ en: 'EXPERIENCE', tr: 'DENEYİM' })}</div>
        <div className="mt-5">
          {ROWS.map((row, i) => (
            <div
              key={row.period + row.title.en}
              className={`rv grid grid-cols-[96px_minmax(0,1fr)] gap-[18px] border-t border-hairline py-[18px] ${
                i === ROWS.length - 1 ? 'border-b' : ''
              }`}
            >
              <span
                className={`font-mono text-[11px] leading-[1.5] ${
                  row.accent ? 'text-signal' : 'text-ink-42'
                }`}
              >
                {row.period}
              </span>
              <div>
                <h4 className="m-0 font-sans text-[17px] font-medium leading-[1.3]">
                  {t(row.title)}
                </h4>
                <p className="mb-0 mt-1.5 font-sans text-[12.5px] leading-[1.6] text-ink-55">
                  {t(row.detail)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stack column */}
      <div>
        <div className={`rv ${label}`}>{t({ en: 'STACK', tr: 'STACK' })}</div>
        <div className="mt-5 flex flex-col gap-4">
          {STACK_GROUPS.map((group) => (
            <div key={group.label.en} className="rv border-t border-hairline pt-3.5">
              <div className="font-mono text-[10.5px] leading-none tracking-[0.1em] text-signal">
                {t(group.label)}
              </div>
              <div className="mt-[9px] flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <span
                    key={item}
                    className="border border-[rgba(255,255,255,0.15)] px-[11px] py-2 font-mono text-[11.5px] leading-none text-[rgba(237,237,234,0.75)]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
