/**
 * Experience + Stack — two editorial columns.
 * Left column toggles Experience / Education; stack chips live in
 * src/lib/constants/stack.ts.
 */

import { useState } from 'react';
import { STACK_GROUPS } from '../lib/constants/stack';
import { useI18n, type Tr } from '../features/i18n';

interface TimelineRow {
  period: string;
  title: Tr;
  detail: Tr;
  accent?: boolean;
}

type TimelineTab = 'experience' | 'education';

const EXPERIENCE_ROWS: TimelineRow[] = [
  {
    period: '2023 — Now',
    title: { en: 'Security Guard — RFC Security', tr: 'Güvenlik Görevlisi — RFC Security' },
    detail: {
      en: 'Dublin · Formal employment pathway toward Stamp 4 residency.',
      tr: 'Dublin · Stamp 4 ikamet yolu için yasal istihdam.',
    },
  },
  {
    period: '2022 — 2025',
    title: {
      en: 'System Operations Engineer — NDA',
      tr: 'Sistem Operasyonları Mühendisi — NDA',
    },
    detail: {
      en: 'EU remote · Microsoft 365 & Azure — Entra ID, Intune, Windows 365.',
      tr: 'AB remote · Microsoft 365 & Azure — Entra ID, Intune, Windows 365.',
    },
    accent: true,
  },
  {
    period: '2022 — 2023',
    title: { en: 'Junior Python Developer — Art-In', tr: 'Junior Python Geliştirici — Art-In' },
    detail: {
      en: 'Türkiye · Django + Oracle dashboards for 100+ enterprise customers.',
      tr: 'Türkiye · 100+ kurumsal müşteri için Django + Oracle panelleri.',
    },
  },
  {
    period: '2022',
    title: { en: 'Junior Back End Developer — Atolla', tr: 'Junior Back End Geliştirici — Atolla' },
    detail: {
      en: 'Türkiye remote · Internship — multithreading cut page loads ~45%.',
      tr: 'Türkiye remote · Staj — multithreading ile sayfa yükleme ~%45 azaldı.',
    },
  },
  {
    period: '2021 — 2022',
    title: { en: 'Start-up Owner — FlyBee Delivery', tr: 'Kurucu — FlyBee Delivery' },
    detail: {
      en: 'Aviation UAV courier concept — later paused for regulation.',
      tr: 'Havacılık UAV kurye konsepti — düzenleme nedeniyle durduruldu.',
    },
  },
];

const EDUCATION_ROWS: TimelineRow[] = [
  {
    period: '2024 — 2025',
    title: { en: 'MSc Artificial Intelligence — NCI', tr: 'MSc Yapay Zeka — NCI' },
    detail: {
      en: 'First Class Honours · 1:1 · GPA 3.1/4.',
      tr: 'First Class Honours · 1:1 · GPA 3.1/4.',
    },
    accent: true,
  },
  {
    period: '2024',
    title: { en: 'Business English — CES', tr: 'Business English — CES' },
    detail: {
      en: 'C1 · Professional writing, presentations, formal correspondence.',
      tr: 'C1 · Profesyonel yazışma, sunum ve resmi iletişim.',
    },
  },
  {
    period: '2019 — 2023',
    title: {
      en: 'BSc Software Engineering — KPI',
      tr: 'BSc Yazılım Mühendisliği — KPI',
    },
    detail: {
      en: 'Kyiv Polytechnic · Grade 93.4/100 · GPA 3.96/4 · DSC KPI.',
      tr: 'Kyiv Polytechnic · Not 93.4/100 · GPA 3.96/4 · DSC KPI.',
    },
  },
];

const TABS: { id: TimelineTab; label: Tr }[] = [
  { id: 'experience', label: { en: 'EXPERIENCE', tr: 'DENEYİM' } },
  { id: 'education', label: { en: 'EDUCATION', tr: 'EĞİTİM' } },
];

export function ExperienceStackSection() {
  const { t } = useI18n();
  const [tab, setTab] = useState<TimelineTab>('experience');
  const rows = tab === 'experience' ? EXPERIENCE_ROWS : EDUCATION_ROWS;
  const label =
    'font-mono text-[11px] font-medium leading-none tracking-[0.14em] text-ink-42';

  return (
    <section className="mx-auto grid max-w-[1440px] gap-[clamp(28px,5vw,64px)] px-[clamp(18px,4vw,52px)] pt-[clamp(44px,7vh,80px)] md:grid-cols-2">
      {/* Experience / Education column */}
      <div>
        <div
          className="rv flex gap-5"
          role="tablist"
          aria-label={t({ en: 'Experience or education', tr: 'Deneyim veya eğitim' })}
        >
          {TABS.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                id={`timeline-tab-${item.id}`}
                onClick={() => setTab(item.id)}
                className={`${label} cursor-pointer border-0 bg-transparent p-0 transition-colors ${
                  active ? 'text-signal' : 'text-ink-42 hover:text-[rgba(237,237,234,0.7)]'
                }`}
              >
                {t(item.label)}
              </button>
            );
          })}
        </div>
        <div
          className="mt-4"
          role="tabpanel"
          aria-labelledby={`timeline-tab-${tab}`}
        >
          {rows.map((row, i) => (
            <div
              key={row.period + row.title.en}
              className={`rv grid grid-cols-[72px_minmax(0,1fr)] gap-3.5 border-t border-hairline py-3 ${
                i === rows.length - 1 ? 'border-b' : ''
              }`}
            >
              <span
                className={`font-mono text-[10.5px] leading-[1.4] ${
                  row.accent ? 'text-signal' : 'text-ink-42'
                }`}
              >
                {row.period}
              </span>
              <div className="min-w-0">
                <h4 className="m-0 font-sans text-[15px] font-medium leading-[1.25]">
                  {t(row.title)}
                </h4>
                <p className="mb-0 mt-1 font-sans text-[12px] leading-[1.45] text-ink-55">
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
