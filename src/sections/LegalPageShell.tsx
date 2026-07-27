/**
 * Shared editorial chrome for Privacy / Terms — hairline layout, mono labels,
 * no legacy liquid-glass cards.
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../features/i18n';

interface LegalPageShellProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

export function LegalPageShell({ title, lastUpdated, children }: LegalPageShellProps) {
  const { t } = useI18n();

  return (
    <div
      className="mx-auto max-w-[1440px] px-[clamp(18px,4vw,52px)] pb-[clamp(64px,10vh,120px)]"
      style={{ paddingTop: 'calc(var(--nav-height, 64px) + 40px)' }}
    >
      <Link
        to="/"
        className="font-mono text-[11px] font-medium tracking-[0.14em] text-ink-42 transition-colors hover:text-foreground"
      >
        {t({ en: '← BACK', tr: '← GERİ' })}
      </Link>

      <header className="mt-8 border-b border-hairline pb-8">
        <p className="font-mono text-[10.5px] tracking-[0.14em] text-ink-42">
          {t({ en: 'LAST UPDATED', tr: 'SON GÜNCELLEME' })} · {lastUpdated}
        </p>
        <h1 className="mt-3 font-sans text-[clamp(32px,5vw,52px)] font-bold leading-[0.96] tracking-[-0.04em]">
          {title}
        </h1>
      </header>

      <div className="mt-10 max-w-[720px] space-y-10">{children}</div>

      <div className="mt-14 border-t border-hairline pt-8">
        <Link
          to="/"
          className="inline-flex items-center border border-hairline-strong bg-signal px-5 py-3 font-mono text-[11px] font-medium tracking-[0.14em] text-background transition-colors hover:bg-signal-hover"
        >
          {t({ en: 'RETURN HOME →', tr: 'ANA SAYFAYA DÖN →' })}
        </Link>
      </div>
    </div>
  );
}

interface LegalSectionProps {
  number: string;
  title: string;
  children: ReactNode;
}

export function LegalSection({ number, title, children }: LegalSectionProps) {
  return (
    <section className="space-y-3 border-t border-hairline pt-8 first:border-t-0 first:pt-0">
      <h2 className="font-sans text-[clamp(18px,2.2vw,22px)] font-bold tracking-[-0.02em]">
        <span className="mr-2 font-mono text-[12px] font-medium tracking-[0.12em] text-signal">
          {number}
        </span>
        {title}
      </h2>
      <div className="space-y-3 font-sans text-[15px] leading-[1.65] text-ink-70 [&_a]:text-signal [&_a]:underline-offset-4 hover:[&_a]:underline [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
