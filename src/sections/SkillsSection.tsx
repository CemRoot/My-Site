/**
 * Skills on the home page. Plain sentences, then the project or job that
 * proves each one. Detail pages stay at /skills/:slug.
 */

import { Link } from 'react-router-dom';
import { projectBySlug } from '../../lib/portfolio/facts.js';
import { useI18n, type Tr } from '../features/i18n';

interface SkillRow {
  slug: string;
  title: Tr;
  line: Tr;
  /** Shown when this skill has no project to point at. */
  where?: Tr;
  projectSlugs: string[];
}

/** Official titles that are too long to read in a "seen in" line. */
const SHORT_PROJECT: Record<string, Tr> = {
  'ai-news-pipeline': { en: "this site's news pipeline", tr: 'bu sitedeki haber hattı' },
};

const ROWS: SkillRow[] = [
  {
    slug: 'rag-systems',
    title: { en: 'Answers from the source', tr: 'Kaynağa dayalı cevaplar' },
    line: {
      en: 'Assistants and chat that read the document or the video transcript, instead of guessing.',
      tr: 'Belgeyi ya da videonun yazısını okuyup cevap verir. Ezberden tahmin etmez.',
    },
    projectSlugs: ['ireland-expat-assistant', 'youtube-ai-summarizer', 'ai-news-pipeline'],
  },
  {
    slug: 'deepfake-detection',
    title: { en: 'Deepfake detection', tr: 'Deepfake tespiti' },
    line: {
      en: 'Tells a real image from a synthetic one. MSc thesis, 97% accuracy.',
      tr: 'Gerçek görüntüyü sentetik olandan ayırır. Yüksek lisans tezi, %97 doğruluk.',
    },
    projectSlugs: ['deepfake-detection-framework'],
  },
  {
    slug: 'computer-vision',
    title: { en: 'Computer vision', tr: 'Bilgisayarlı görü' },
    line: {
      en: 'The image side of that thesis: classification, a check against simpler models, then an app people can open.',
      tr: 'Aynı tezin görüntü tarafı: sınıflandırma, daha basit modellerle karşılaştırma, sonra açılabilen bir uygulama.',
    },
    projectSlugs: ['deepfake-detection-framework'],
  },
  {
    slug: 'agentic-workflows',
    title: { en: 'Automation that runs itself', tr: 'Kendi kendine çalışan otomasyon' },
    line: {
      en: 'Jobs on a schedule. If a model fails, another takes over. The output is checked, and a break sends an alert.',
      tr: 'Zamanı gelince çalışan işler. Bir model düşerse diğeri devralır. Çıktı kontrol edilir, bozulursa haber verir.',
    },
    projectSlugs: ['ai-news-pipeline', 'youtube-ai-summarizer'],
  },
  {
    slug: 'azure-microsoft-365',
    title: { en: 'Azure & Microsoft 365', tr: 'Azure & Microsoft 365' },
    line: {
      en: 'Three years running sign-in, devices and Cloud PCs for an EU client.',
      tr: 'Üç yıl boyunca bir AB müşterisi için oturum açma, cihazlar ve Cloud PC.',
    },
    where: {
      en: 'System Operations Engineer, EU client, 2022–2025',
      tr: 'Sistem Operasyonları Mühendisi, AB müşterisi, 2022–2025',
    },
    projectSlugs: [],
  },
];

export function SkillsSection() {
  const { t } = useI18n();

  return (
    <section
      id="skills"
      className="mx-auto max-w-[1440px] scroll-mt-20 px-[clamp(18px,4vw,52px)] pt-[clamp(44px,7vh,80px)]"
    >
      <div className="rv font-mono text-[11px] font-medium leading-none tracking-[0.14em] text-ink-42">
        {t({ en: 'SKILLS', tr: 'YETENEKLER' })}
      </div>
      <p className="rv mt-4 max-w-[62ch] font-sans text-[15px] leading-[1.6] text-ink-62">
        {t({
          en: 'Not a list of tools. Each line is a kind of work, and where you can see it.',
          tr: 'Araç listesi değil. Her satır bir iş türü ve onu nerede görebilirsin.',
        })}
      </p>

      <div className="mt-8">
        {ROWS.map((row, i) => {
          const isLast = i === ROWS.length - 1;
          const projects = row.projectSlugs
            .map((slug) => {
              const short = SHORT_PROJECT[slug];
              if (short) return t(short);
              return projectBySlug(slug)?.title;
            })
            .filter((title): title is string => Boolean(title));
          const where = projects.length > 0 ? projects.join(' · ') : row.where ? t(row.where) : '';

          return (
            <Link
              key={row.slug}
              to={`/skills/${row.slug}`}
              className={`rv grid grid-cols-[44px_minmax(0,1fr)] items-start gap-[clamp(14px,2vw,26px)] border-t border-hairline py-[26px] text-foreground ${
                isLast ? 'border-b' : ''
              }`}
            >
              <span className="font-mono text-xs leading-[1.4] text-signal">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="max-w-[68ch]">
                <h3 className="m-0 font-sans text-[clamp(22px,2.4vw,28px)] font-medium leading-[1.08] tracking-[-0.02em]">
                  {t(row.title)}
                </h3>
                <p className="m-0 mt-2 font-sans text-[15px] leading-[1.6] text-ink-62">{t(row.line)}</p>
                {where && (
                  <p className="m-0 mt-3 font-sans text-[13px] leading-[1.6] text-ink-42">
                    {projects.length > 0
                      ? `${t({ en: 'Seen in', tr: 'Görüldüğü yer' })} ${where}`
                      : where}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
