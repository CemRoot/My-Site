/**
 * Hero — status/field mono rows, the 3D wire head, and the display headline.
 * Ported 1:1 from the design prototype's #top section.
 */

import { useRef } from 'react';
import { HeroHeadCanvas } from '../features/hero-3d/HeroHeadCanvas';
import { useI18n } from '../features/i18n';

export function HeroSection() {
  const { t, lang } = useI18n();
  const sectionRef = useRef<HTMLElement>(null);

  const headline =
    lang === 'tr' ? (
      <>
        Üretimde
        <br />
        ayakta kalan
        <br />
        <span className="text-signal">AI sistemleri.</span>
      </>
    ) : (
      <>
        AI systems
        <br />
        that survive
        <br />
        <span className="text-signal">production.</span>
      </>
    );

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative overflow-hidden bg-[radial-gradient(120%_80%_at_50%_4%,#17181b_0%,#0a0a0b_60%)] pt-[clamp(28px,5vh,64px)]"
    >
      {/* Vertical grid lines */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:clamp(60px,7vw,98px)_100%]"
      />

      {/*
        3D wire head — a full-bleed layer with the same footprint as the grid
        overlay above, deliberately NOT an in-flow box. It used to be a
        446px-tall block inside the content column, which meant scattered bars
        were clipped at its edges and could never disperse across the hero.
        Spanning the section gives the debris the whole area to travel through.
        It sits under the copy (z-0) and never takes pointer events; the section
        itself drives the scatter.
      */}
      <HeroHeadCanvas className="absolute inset-0 z-0" pointerTargetRef={sectionRef} />

      {/*
        Padding lives on the SAME element as max-w-[1440px], matching every
        other section (Work, Services, Systems, Signal, …). It used to sit on
        the <section> with the column nested inside, which put the hero's copy
        52px left of every other section's — invisible until the header was
        aligned, then obvious on a wide display.
      */}
      <div className="relative z-10 mx-auto max-w-[1440px] px-[clamp(18px,4vw,52px)]">
        {/*
          Dual-column meta: 01 left / 02 right.
          w-full + justify-between span the row; wrap keeps 02 right-aligned
          (ml-auto + items-end) when it drops below on narrow viewports.
        */}
        <div
          data-hero-meta
          className="anim-fade flex w-full flex-row flex-wrap items-start justify-between gap-x-6 gap-y-5 font-mono text-[11px] leading-[1.7] text-ink-45 [animation-delay:0.1s]"
        >
          <div
            data-hero-status
            className="mr-auto max-w-[230px] shrink-0 text-left"
          >
            <div className="tracking-[0.12em] text-signal">
              {t({ en: '01 / STATUS', tr: '01 / DURUM' })}
            </div>
            <div>
              {t({
                en: 'Dublin, Ireland — open to full-time AI/ML engineering roles and freelance builds.',
                tr: 'Dublin, İrlanda — tam zamanlı AI/ML mühendisliği rollerine ve freelance işlere açık.',
              })}
            </div>
          </div>
          <div
            data-hero-field
            className="ml-auto flex max-w-[250px] shrink-0 flex-col items-end text-right"
          >
            <div className="tracking-[0.12em] text-signal">
              {t({ en: '02 / FIELD', tr: '02 / ALAN' })}
            </div>
            <div>
              {t({
                en: 'Deepfake detection · computer vision · RAG · agentic workflows · Azure & M365',
                tr: 'Deepfake tespiti · bilgisayarlı görü · RAG · agentic iş akışları · Azure & M365',
              })}
            </div>
          </div>
        </div>

        {/*
          Reserves the vertical room the canvas used to occupy in flow. The
          canvas is now absolutely positioned and contributes no height, so
          without this the hero would collapse and the headline would ride up
          into the bust.
        */}
        <div aria-hidden="true" className="h-[clamp(260px,48vh,430px)]" />

        {/* Headline */}
        <div className="anim-rise relative [animation-delay:0.1s]">
          <h1 className="m-0 font-sans text-[clamp(40px,8.2vw,112px)] font-bold leading-[0.86] tracking-[-0.05em] [text-wrap:balance]">
            {headline}
          </h1>
        </div>

        {/* Tagline + CTAs */}
        <div className="mt-[clamp(24px,3vh,40px)] flex flex-wrap items-end justify-between gap-[26px] border-t border-hairline pb-[clamp(28px,4vh,44px)] pt-[18px]">
          <p className="m-0 max-w-[440px] font-sans text-[clamp(13px,1.1vw,15px)] leading-[1.6] text-ink-62">
            {t({
              en: 'AI Engineer & System Operations Specialist. MSc Artificial Intelligence, First Class Honours — National College of Ireland.',
              tr: 'AI Mühendisi & Sistem Operasyonları Uzmanı. Yapay Zeka Yüksek Lisansı, First Class Honours — National College of Ireland.',
            })}
          </p>
          <div className="flex flex-wrap gap-2.5">
            <a
              href="#contact"
              className="bg-signal px-5 py-3.5 font-mono text-[11px] font-medium leading-none tracking-[0.1em] text-background hover:bg-signal-hover hover:text-background"
            >
              {t({ en: 'HIRE ME →', tr: 'İLETİŞİME GEÇ →' })}
            </a>
            <a
              href="#work"
              className="border border-hairline-strong px-5 py-3.5 font-mono text-[11px] font-medium leading-none tracking-[0.1em] text-foreground hover:border-[rgba(255,255,255,0.35)] hover:text-foreground"
            >
              {t({ en: 'SEE THE WORK', tr: 'ÇALIŞMALARA BAK' })}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
