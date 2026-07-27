/**
 * Global footer bar — the closing hairline strip from the design.
 * Rendered on every route (the Contact section above it is Home-only).
 */

import { Link } from 'react-router-dom';
import { useI18n } from '../features/i18n';

export function SiteFooter() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-hairline px-[clamp(18px,4vw,52px)] py-[18px] font-mono text-[10.5px] leading-[1.6] tracking-[0.1em] text-ink-35">
      <span>© {year} CEM KÖYLÜOĞLU</span>
      <nav
        className="flex flex-wrap items-center gap-x-3 gap-y-1"
        aria-label={t({ en: 'Legal', tr: 'Yasal' })}
      >
        <Link to="/privacy-policy" className="hover:text-foreground">
          {t({ en: 'PRIVACY', tr: 'GİZLİLİK' })}
        </Link>
        <span aria-hidden="true">·</span>
        <Link to="/terms" className="hover:text-foreground">
          {t({ en: 'TERMS', tr: 'ŞARTLAR' })}
        </Link>
      </nav>
      <span>
        {t({
          en: 'BUILT BY HAND · CONTINUOUSLY DEPLOYED',
          tr: 'EL YAPIMI · SÜREKLİ YAYINDA',
        })}
      </span>
    </footer>
  );
}
