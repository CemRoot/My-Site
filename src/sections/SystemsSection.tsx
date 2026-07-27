/**
 * Systems — the automation that runs this site, as live status cards.
 */

import { SYSTEMS, SYSTEMS_INTRO, type SystemStatus } from '../lib/constants/systems';
import { useI18n } from '../features/i18n';

function StatusDot({ status, index }: { status: SystemStatus; index: number }) {
  if (status === 'build') {
    return <span className="h-1.5 w-1.5 rounded-full bg-signal" />;
  }
  return (
    <span
      className="anim-pulse h-1.5 w-1.5 rounded-full bg-live [animation-duration:2s]"
      style={{ animationDelay: `${index * 0.3}s` }}
    />
  );
}

export function SystemsSection() {
  const { t } = useI18n();

  return (
    <section
      id="systems"
      className="mx-auto max-w-[1440px] scroll-mt-20 px-[clamp(18px,4vw,52px)] pt-[clamp(44px,7vh,80px)]"
    >
      <div className="rv flex flex-wrap items-baseline justify-between gap-[18px] font-mono text-[11px] font-medium leading-none tracking-[0.14em] text-ink-42">
        <span className="text-signal">
          {t({
            en: 'LIVE SYSTEMS — WHAT RUNS THIS SITE',
            tr: 'CANLI SİSTEMLER — BU SİTEYİ ÇALIŞTIRANLAR',
          })}
        </span>
        <span>{t({ en: 'AUTOMATED · HUMAN-SUPERVISED', tr: 'OTOMATİK · İNSAN DENETİMLİ' })}</span>
      </div>

      <p className="rv mt-[18px] max-w-[620px] font-sans text-[clamp(14px,1.2vw,17px)] leading-[1.6] text-ink-70 [text-wrap:pretty]">
        {t(SYSTEMS_INTRO)}
      </p>

      <div className="mt-[26px] grid gap-px bg-surface sm:grid-cols-2 xl:grid-cols-5">
        {SYSTEMS.map((system, index) => (
          <div
            key={system.meta.en}
            className="rv bg-surface p-[22px_24px] outline-1 outline-hairline"
          >
            <div className="flex items-center gap-2 font-mono text-[10.5px] leading-none tracking-[0.1em] text-ink-45">
              <StatusDot status={system.status} index={index} />
              {t(system.statusLabel)}
            </div>
            <h3 className="mt-4 font-sans text-[19px] font-medium leading-[1.2] tracking-[-0.01em]">
              {t(system.title)}
            </h3>
            <p className="mt-2 font-sans text-[12.5px] leading-[1.6] text-ink-55">
              {t(system.description)}
            </p>
            <div className="mt-4 font-mono text-[10.5px] leading-[1.6] text-ink-38">
              {t(system.meta)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
