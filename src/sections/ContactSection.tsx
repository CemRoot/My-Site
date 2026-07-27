/**
 * Contact — the closing display headline plus direct channels.
 * Uses the real contact data (PERSONAL_INFO / SOCIAL_LINKS), not the
 * prototype's placeholder address.
 */

import { PERSONAL_INFO, SOCIAL_LINKS } from '../lib/constants/personal';
import { useI18n } from '../features/i18n';

export function ContactSection() {
  const { t, lang } = useI18n();

  const headline =
    lang === 'tr' ? (
      <>
        Hadi bir şey
        <br />
        yayına alalım.
      </>
    ) : (
      <>
        Let&apos;s ship
        <br />
        something.
      </>
    );

  return (
    <section
      id="contact"
      className="mt-[clamp(48px,8vh,96px)] scroll-mt-20 border-t border-hairline"
    >
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-end justify-between gap-8 px-[clamp(18px,4vw,52px)] py-[clamp(48px,8vh,92px)]">
        <h2 className="rv m-0 font-sans text-[clamp(38px,6vw,76px)] font-bold leading-[0.94] tracking-[-0.045em]">
          {headline}
        </h2>
        <div className="rv font-mono text-[12.5px] leading-loose text-ink-55">
          <div>
            <a href={`mailto:${PERSONAL_INFO.email}`} className="text-foreground hover:text-foreground">
              {PERSONAL_INFO.email}
            </a>
          </div>
          <div>
            <a href={SOCIAL_LINKS.linkedin.url} target="_blank" rel="noopener noreferrer">
              LINKEDIN
            </a>
            {' · '}
            <a href={SOCIAL_LINKS.github.url} target="_blank" rel="noopener noreferrer">
              GITHUB
            </a>
            {' · '}
            <a href={SOCIAL_LINKS.whatsapp.url} target="_blank" rel="noopener noreferrer">
              WHATSAPP
            </a>
          </div>
          <div>{t({ en: 'DUBLIN, IRELAND · UTC+1', tr: 'DUBLIN, İRLANDA · UTC+1' })}</div>
        </div>
      </div>
    </section>
  );
}
