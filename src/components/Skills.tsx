import { useState } from 'react';
import { Award, Code2, Puzzle, ShieldCheck, ChevronDown } from 'lucide-react';
import {
  SKILL_CATEGORIES,
  METHODOLOGIES,
  CERTIFICATIONS,
  CERTIFICATION_THEMES,
} from '../lib/constants/skills';
import type { SkillCategory } from '../lib/constants/skills';

type ThemeColor = 'primary' | 'secondary' | 'accent';
type IconComponent = SkillCategory['icon'];

// ─── Static color maps (Tailwind needs static strings, no interpolation) ──────

const BORDER: Record<ThemeColor, string> = {
  primary:   'border-primary/20',
  secondary: 'border-secondary/20',
  accent:    'border-accent/20',
};

const TEXT: Record<ThemeColor, string> = {
  primary:   'text-primary',
  secondary: 'text-secondary',
  accent:    'text-accent',
};

const BADGE: Record<ThemeColor, string> = {
  primary:   'border-primary/20 bg-primary/10 text-primary',
  secondary: 'border-secondary/20 bg-secondary/10 text-secondary',
  accent:    'border-accent/20 bg-accent/10 text-accent',
};

const DOT_BG: Record<ThemeColor, string> = {
  primary:   'bg-primary',
  secondary: 'bg-secondary',
  accent:    'bg-accent',
};

const ICON_BG: Record<ThemeColor, string> = {
  primary:   'from-primary/20 to-primary/5',
  secondary: 'from-secondary/20 to-secondary/5',
  accent:    'from-accent/20 to-accent/5',
};

// Static group-hover text per color (must be complete strings for Tailwind scanning)
const HOVER_TEXT: Record<ThemeColor, string> = {
  primary:   'group-hover:text-primary',
  secondary: 'group-hover:text-secondary',
  accent:    'group-hover:text-accent',
};

// Static year text color per color
const YEAR_TEXT: Record<ThemeColor, string> = {
  primary:   'text-primary',
  secondary: 'text-secondary',
  accent:    'text-accent',
};

// ─── Derived data ─────────────────────────────────────────────────────────────

const SORTED_CATEGORIES = [...SKILL_CATEGORIES].sort((a, b) => a.priority - b.priority);
const TOTAL_SKILL_COUNT = SKILL_CATEGORIES.reduce((sum, c) => sum + c.skills.length, 0);

const OVERVIEW_METRICS: {
  label: string;
  value: string;
  icon: IconComponent;
  color: ThemeColor;
}[] = [
  { label: 'Capability Domains', value: String(SORTED_CATEGORIES.length), icon: Code2,      color: 'primary'   },
  { label: 'Tools & Frameworks', value: `${TOTAL_SKILL_COUNT}+`,          icon: ShieldCheck, color: 'secondary' },
  { label: 'Methods & Practices', value: String(METHODOLOGIES.length),    icon: Puzzle,      color: 'accent'    },
  { label: 'Credentials',         value: String(CERTIFICATIONS.length),   icon: Award,       color: 'primary'   },
];

// ─── Overview metric card ─────────────────────────────────────────────────────

function OverviewMetricCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: IconComponent;
  color: ThemeColor;
}) {
  return (
    <div className={`rounded-2xl border ${BORDER[color]} bg-white/5 p-4`}>
      <div className={`flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.16em] ${TEXT[color]} mb-2`}>
        <Icon className="h-3 w-3" />
        <span className="leading-tight">{label}</span>
      </div>
      <div className="text-2xl sm:text-3xl text-foreground font-semibold">{value}</div>
    </div>
  );
}

// ─── Accordion row for each skill category ────────────────────────────────────

function CategoryRow({
  category,
  index,
  defaultOpen = false,
}: {
  category: SkillCategory;
  index: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-white/10 last:border-b-0">
      {/* Header trigger */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="group w-full flex items-center justify-between gap-6 py-7 sm:py-8 text-left"
      >
        {/* Index + title */}
        <div className="flex items-baseline gap-5 min-w-0">
          <span className="shrink-0 font-mono text-[11px] tracking-[0.2em] text-muted-foreground/50 tabular-nums">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span
            className={`text-xl sm:text-2xl lg:text-3xl font-semibold text-foreground tracking-tight transition-colors duration-200 ${HOVER_TEXT[category.color]}`}
          >
            {category.title}
          </span>
        </div>

        {/* Right: count badge + chevron */}
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <span className="hidden sm:inline-flex font-mono text-[11px] tracking-[0.16em] text-muted-foreground/50 border border-white/10 rounded-full px-3 py-1">
            {category.skills.length} skills
          </span>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground/40 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Expandable body */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? 'max-h-[700px] opacity-100 mb-6' : 'max-h-0 opacity-0'
        }`}
      >
        {/* Summary text */}
        <p className="mb-5 text-sm leading-relaxed text-muted-foreground max-w-2xl pl-9 sm:pl-12">
          {category.summary}
        </p>

        {/* Skill pills */}
        <div className="flex flex-wrap gap-2 sm:gap-2.5 pl-9 sm:pl-12 pb-2">
          {category.skills.map((skill) => (
            <span
              key={skill.name}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-foreground/80 hover:border-white/20 hover:bg-white/10 transition-colors duration-150"
            >
              {skill.name}
              <span className={`font-mono text-[10px] ${YEAR_TEXT[category.color]} opacity-75`}>
                {skill.years}yr
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Methodologies ────────────────────────────────────────────────────────────

function MethodologiesBoard() {
  return (
    <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] items-start">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-4 py-2">
          <Puzzle className="h-4 w-4 text-secondary" />
          <span className="text-xs font-mono uppercase tracking-[0.24em] text-secondary">
            Delivery Approach
          </span>
        </div>

        <h3 className="text-2xl sm:text-3xl text-foreground leading-tight">
          Execution style built around clarity, iteration, and reliable delivery.
        </h3>

        <p className="max-w-2xl text-sm sm:text-base leading-relaxed text-muted-foreground">
          The work is not just about knowing tools. It is shaped by engineering habits that keep
          solutions maintainable, measurable, and easy to evolve after launch.
        </p>
      </div>

      <div className="rounded-[2rem] border border-secondary/15 p-5 sm:p-6 liquid-glass-strong">
        <div className="flex flex-wrap gap-3">
          {METHODOLOGIES.map((m) => (
            <div
              key={m.name}
              className={`inline-flex items-center gap-2 rounded-full border ${BORDER[m.color]} bg-white/5 px-4 py-2.5 text-sm`}
            >
              <span className={`h-2 w-2 rounded-full ${DOT_BG[m.color]}`} />
              <span className="text-foreground">{m.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Certifications ───────────────────────────────────────────────────────────

function CertificationsBoard() {
  return (
    <div>
      <div className="mb-6 space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-2">
          <ShieldCheck className="h-4 w-4 text-accent" />
          <span className="text-xs font-mono uppercase tracking-[0.24em] text-accent">
            Credentials
          </span>
        </div>

        <h3 className="text-2xl sm:text-3xl text-foreground leading-tight">
          Certifications and licenses that reinforce hands-on delivery.
        </h3>

        <p className="max-w-3xl text-sm sm:text-base leading-relaxed text-muted-foreground">
          A mix of AI, software engineering, security, and operations credentials that support both
          technical depth and production responsibility.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {CERTIFICATIONS.map((cert) => {
          const theme = CERTIFICATION_THEMES[cert.color];
          return (
            <article
              key={`${cert.title}-${cert.year}`}
              className={`rounded-3xl border ${theme.border} bg-background/60 p-5 frosted-glass`}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border ${theme.border} bg-gradient-to-br ${theme.iconBg}`}
                >
                  <Award className={`h-5 w-5 ${theme.text}`} />
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-mono uppercase tracking-wider ${theme.badge}`}
                >
                  {cert.type}
                </span>
              </div>

              <h4 className="mt-4 text-base sm:text-lg leading-snug text-foreground">
                {cert.title}
              </h4>
              <div className={`mt-2 text-sm font-medium ${theme.text}`}>{cert.issuer}</div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{cert.focus}</p>

              <div className="mt-4 flex items-center justify-between gap-4 border-t border-white/10 pt-4 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                <span>{cert.platform}</span>
                <span>{cert.year}</span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function Skills() {
  return (
    <section
      id="skills"
      className="relative overflow-hidden scroll-mt-40 px-4 py-16 sm:scroll-mt-48 sm:px-6 sm:py-20 lg:px-8 lg:py-28"
    >
      {/* Ambient background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-primary/8 blur-3xl liquid-morph" />
        <div
          className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-secondary/8 blur-3xl liquid-morph"
          style={{ animationDelay: '1s' }}
        />
        <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-accent/6 blur-3xl liquid-pulse" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">

        {/* ── Big editorial header ─────────────────────────────────────── */}
        <div className="border-b border-white/10 pb-10 sm:pb-14">
          <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-primary/80 mb-5">
            Technical Capabilities
          </div>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            {/* Giant title */}
            <h2 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-semibold tracking-tight leading-none text-foreground">
              Core Skills,<br />
              <span className="text-primary">Tools</span>{' '}&amp; Platforms
            </h2>

            {/* Metric cards 2×2 */}
            <div className="grid grid-cols-2 gap-2.5 lg:w-72 xl:w-80 shrink-0">
              {OVERVIEW_METRICS.map((metric) => (
                <OverviewMetricCard key={metric.label} {...metric} />
              ))}
            </div>
          </div>

          {/* Subtitle */}
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            A calmer view of the stack behind my work across AI systems, backend engineering,
            cloud operations, and enterprise Microsoft environments.
          </p>
        </div>

        {/* ── Accordion skill matrix ───────────────────────────────────── */}
        <div className="pt-10">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5">
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
                Skill Matrix
              </span>
            </div>
            <span className="hidden sm:block text-[11px] font-mono text-muted-foreground/40 tracking-wider">
              Click any category to expand
            </span>
          </div>

          <div>
            {SORTED_CATEGORIES.map((category, i) => (
              <CategoryRow
                key={category.title}
                category={category}
                index={i}
                defaultOpen={i === 0}
              />
            ))}
          </div>
        </div>

        {/* ── Methodologies ────────────────────────────────────────────── */}
        <div className="mt-14 sm:mt-16">
          <MethodologiesBoard />
        </div>

        {/* ── Certifications ───────────────────────────────────────────── */}
        <div className="mt-14 sm:mt-16">
          <CertificationsBoard />
        </div>
      </div>
    </section>
  );
}
