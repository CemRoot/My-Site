/**
 * Services — three fixed-scope packages, ported from the design prototype.
 */

import { useI18n, type Tr } from '../features/i18n';

interface ServicePackage {
  meta: Tr;
  title: Tr;
  description: Tr;
}

const PACKAGES: ServicePackage[] = [
  {
    meta: { en: '01 · 2 WEEKS', tr: '01 · 2 HAFTA' },
    title: { en: 'AI prototype sprint', tr: "AI prototip sprint'i" },
    description: {
      en: 'One idea to a working, measurable demo — real enough to decide on.',
      tr: 'Bir fikri çalışan, ölçülebilir bir demoya dönüştürürüm — karar verebileceğin kadar gerçek.',
    },
  },
  {
    meta: { en: '02 · 4—8 WEEKS', tr: '02 · 4—8 HAFTA' },
    title: { en: 'Vision & detection systems', tr: 'Görü & tespit sistemleri' },
    description: {
      en: 'Training, evaluation and deployment with honest metrics for security-critical work.',
      tr: 'Eğitim, değerlendirme ve dağıtım — güvenlik açısından kritik işler için dürüst metriklerle.',
    },
  },
  {
    meta: { en: '03 · RETAINER', tr: '03 · RETAINER' },
    title: { en: 'Automation & M365 ops', tr: 'Otomasyon & M365 operasyonu' },
    description: {
      en: 'Agentic workflows, tenant hygiene and integrations that give your team the week back.',
      tr: 'Agent iş akışları, tenant düzeni ve ekibinizin haftasını geri kazandıran entegrasyonlar.',
    },
  },
];

export function ServicesSection() {
  const { t } = useI18n();

  return (
    <section
      id="services"
      className="mx-auto max-w-[1440px] scroll-mt-20 px-[clamp(18px,4vw,52px)] pt-[clamp(44px,7vh,80px)]"
    >
      <div className="rv flex flex-wrap items-baseline justify-between gap-[18px] font-mono text-[11px] font-medium leading-none tracking-[0.14em] text-ink-42">
        <span>{t({ en: 'SERVICES', tr: 'HİZMETLER' })}</span>
        <span>{t({ en: 'FIXED SCOPE, FIXED WINDOW', tr: 'SABİT KAPSAM, SABİT SÜRE' })}</span>
      </div>

      <div className="mt-6 grid gap-px bg-background md:grid-cols-3">
        {PACKAGES.map((pkg) => (
          <div
            key={pkg.meta.en}
            className="rv bg-background p-[28px_26px] outline-1 outline-hairline"
          >
            <div className="font-mono text-[10.5px] leading-none tracking-[0.1em] text-signal">
              {t(pkg.meta)}
            </div>
            <h3 className="mb-0 mt-3.5 font-sans text-[22px] font-medium leading-[1.2] tracking-[-0.015em]">
              {t(pkg.title)}
            </h3>
            <p className="mb-0 mt-2.5 font-sans text-[13px] leading-[1.65] text-ink-55">
              {t(pkg.description)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
