import { useState } from 'react';
import { Award } from 'lucide-react';
import {
  SKILL_CATEGORIES,
  METHODOLOGIES,
  CERTIFICATIONS,
  CERTIFICATION_THEMES,
} from '../lib/constants/skills';
import type { SkillCategory } from '../lib/constants/skills';

/* ─── Types ─── */
type TabId = 'skills' | 'methods' | 'certs';
type CategoryKey = 'all' | string;
type ThemeColor = 'primary' | 'secondary' | 'accent';

/* ─── Constants ─── */
const COLOR_CLASSES = {
  primary: {
    border: 'border-primary/20',
    borderStrong: 'border-primary/30',
    text: 'text-primary',
    chipBg: 'bg-primary/10',
    dotBg: 'bg-primary',
    gradientBg: 'from-primary/10 to-primary/5',
  },
  secondary: {
    border: 'border-secondary/20',
    borderStrong: 'border-secondary/30',
    text: 'text-secondary',
    chipBg: 'bg-secondary/10',
    dotBg: 'bg-secondary',
    gradientBg: 'from-secondary/10 to-secondary/5',
  },
  accent: {
    border: 'border-accent/20',
    borderStrong: 'border-accent/30',
    text: 'text-accent',
    chipBg: 'bg-accent/10',
    dotBg: 'bg-accent',
    gradientBg: 'from-accent/10 to-accent/5',
  },
} as const;

const MARQUEE_SPEEDS = [
  'animate-marquee-fast',
  'animate-marquee-med',
  'animate-marquee-slow',
  'animate-marquee-fast',
  'animate-marquee-med',
  'animate-marquee-slow',
  'animate-marquee-fast',
  'animate-marquee-med',
] as const;

const SORTED_CATEGORIES = [...SKILL_CATEGORIES].sort((a, b) => a.priority - b.priority);

const TOTAL_SKILL_COUNT = SKILL_CATEGORIES.reduce((sum, c) => sum + c.skills.length, 0);

const CATEGORY_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: `All (${TOTAL_SKILL_COUNT})` },
  ...SORTED_CATEGORIES.map((c) => ({
    key: c.title,
    label: c.title.replace(' & ', '/'),
  })),
];

function getColumnColor(index: number): ThemeColor {
  const cycle = index % 3;
  return cycle === 0 ? 'primary' : cycle === 1 ? 'secondary' : 'accent';
}

/* ═══════════════════════════════════════════
   MOBILE COMPONENTS (< 768px)
   ═══════════════════════════════════════════ */

function MarqueeRow({ category, index }: { category: SkillCategory; index: number }) {
  const color = getColumnColor(index);
  const classes = COLOR_CLASSES[color];
  const speed = MARQUEE_SPEEDS[index] || 'animate-marquee-med';
  const Icon = category.icon;
  const items = category.skills;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2 px-4">
        <Icon className={`w-3.5 h-3.5 ${classes.text}`} />
        <span className={`text-[11px] font-semibold ${classes.text} tracking-wide uppercase`}>
          {category.title}
        </span>
        <span className="text-[10px] text-muted-foreground font-mono">({items.length})</span>
      </div>
      <div className="marquee-mask overflow-hidden">
        <div className={`flex gap-2.5 w-max ${speed} hover:paused`}>
          {[...items, ...items].map((skill, idx) => (
            <div
              key={idx}
              aria-hidden={idx >= items.length}
              className={`flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${classes.gradientBg} border ${classes.border} backdrop-blur-sm`}
            >
              <span className="text-[11px] font-medium text-foreground">{skill.name}</span>
              <span className={`text-[9px] font-mono ${classes.text} opacity-80`}>{skill.years}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MethodologyMarquee() {
  const items = METHODOLOGIES;

  return (
    <div className="mt-6 mb-6">
      <div className="flex items-center gap-2 mb-2 px-4">
        <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-background" />
        </div>
        <span className="text-[11px] font-semibold text-secondary tracking-wide uppercase">
          Methodologies
        </span>
        <span className="text-[10px] text-muted-foreground font-mono">({items.length})</span>
      </div>
      <div className="marquee-mask overflow-hidden">
        <div className="flex gap-2.5 w-max animate-marquee-med hover:paused">
          {[...items, ...items].map((m, idx) => {
            const classes = COLOR_CLASSES[m.color];
            return (
              <div
                key={idx}
                aria-hidden={idx >= items.length}
                className={`flex shrink-0 items-center px-3 py-1.5 rounded-full bg-gradient-to-r ${classes.gradientBg} border ${classes.border} backdrop-blur-sm`}
              >
                <span className={`text-[11px] font-semibold ${classes.text}`}>{m.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CertCarousel() {
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3 px-4">
        <Award className="w-3.5 h-3.5 text-accent" />
        <span className="text-[11px] font-semibold text-accent tracking-wide uppercase">
          Certifications & Licenses
        </span>
        <span className="text-[10px] text-muted-foreground font-mono">({CERTIFICATIONS.length})</span>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-4 snap-x">
        {CERTIFICATIONS.map((cert) => {
          const theme = CERTIFICATION_THEMES[cert.color];
          return (
            <div
              key={`${cert.title}-${cert.year}`}
              className={`flex-shrink-0 w-[240px] snap-start rounded-2xl frosted-glass border ${theme.border} bg-background/60 p-4`}
            >
              <div className="flex items-center justify-between mb-2">
                <Award className={`w-4 h-4 ${theme.text}`} />
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${theme.badge}`}>
                  {cert.type}
                </span>
              </div>
              <h4 className="text-xs font-semibold text-foreground leading-snug mb-1.5 line-clamp-2">
                {cert.title}
              </h4>
              <p className={`text-[10px] ${theme.text} font-medium`}>{cert.issuer}</p>
              <div className="flex justify-between mt-2 pt-2 border-t border-current/10">
                <span className="text-[9px] font-mono text-muted-foreground">{cert.platform}</span>
                <span className="text-[9px] font-mono text-muted-foreground">{cert.year}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   DESKTOP COMPONENTS (>= 768px)
   ═══════════════════════════════════════════ */

function TabBar({ activeTab, onTabChange }: { activeTab: TabId; onTabChange: (t: TabId) => void }) {
  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'skills', label: 'Skills', count: TOTAL_SKILL_COUNT },
    { id: 'methods', label: 'Methodologies', count: METHODOLOGIES.length },
    { id: 'certs', label: 'Certifications', count: CERTIFICATIONS.length },
  ];

  return (
    <div className="flex justify-center mb-10">
      <div className="inline-flex gap-1 p-1.5 rounded-2xl frosted-glass border border-primary/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === tab.id
                ? 'bg-primary/12 text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 text-[10px] font-mono ${
              activeTab === tab.id ? 'text-primary/60' : 'text-muted-foreground/50'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CategoryFilters({
  activeCategory,
  onCategoryChange,
}: {
  activeCategory: CategoryKey;
  onCategoryChange: (c: CategoryKey) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2 mb-8">
      {CATEGORY_FILTERS.map((f) => {
        const isActive = activeCategory === f.key;
        return (
          <button
            key={f.key}
            onClick={() => onCategoryChange(f.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-mono transition-all duration-200 border ${
              isActive
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-primary/10 text-muted-foreground hover:border-primary/25 hover:text-foreground'
            }`}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

function SkillChipsGrid({ activeCategory }: { activeCategory: CategoryKey }) {
  const filteredCategories =
    activeCategory === 'all'
      ? SORTED_CATEGORIES
      : SORTED_CATEGORIES.filter((c) => c.title === activeCategory);

  return (
    <div className="flex flex-wrap justify-center gap-2.5">
      {filteredCategories.map((category, catIdx) => {
        const color = getColumnColor(SORTED_CATEGORIES.indexOf(category));
        const classes = COLOR_CLASSES[color];
        return category.skills.map((skill, skillIdx) => (
          <div
            key={`${category.title}-${skill.name}`}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl frosted-glass border ${classes.border} bg-background/60 text-sm font-medium animate-chip-in`}
            style={{ animationDelay: `${(catIdx * 7 + skillIdx) * 25}ms` }}
          >
            <span className="text-foreground">{skill.name}</span>
            <span className={`font-mono text-[11px] px-2 py-0.5 rounded-md ${classes.chipBg} ${classes.text}`}>
              {skill.years}
            </span>
          </div>
        ));
      })}
    </div>
  );
}

function MethodologyPills() {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {METHODOLOGIES.map((m, idx) => {
        const classes = COLOR_CLASSES[m.color];
        return (
          <div
            key={idx}
            className={`px-6 py-3 rounded-2xl frosted-glass border ${classes.border} text-sm font-semibold ${classes.text} bg-gradient-to-r ${classes.gradientBg}`}
          >
            {m.name}
          </div>
        );
      })}
    </div>
  );
}

function CertCompactList() {
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-2">
      {CERTIFICATIONS.map((cert) => {
        const theme = CERTIFICATION_THEMES[cert.color];
        return (
          <div
            key={`${cert.title}-${cert.year}`}
            className={`flex items-center gap-4 px-5 py-3.5 rounded-xl frosted-glass border ${theme.border} bg-background/60 transition-all duration-200 hover:border-primary/30`}
          >
            <span
              className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide border flex-shrink-0 w-[56px] text-center ${
                cert.type === 'License'
                  ? 'border-accent/30 text-accent'
                  : 'border-primary/30 text-primary'
              }`}
            >
              {cert.type === 'License' ? 'License' : 'Cert'}
            </span>
            <span className="text-sm font-medium text-foreground flex-1 truncate">{cert.title}</span>
            <span className={`text-xs ${theme.text} font-medium w-[140px] text-right truncate hidden lg:block`}>
              {cert.issuer}
            </span>
            <span className="text-xs font-mono text-muted-foreground px-3 py-1 rounded-lg bg-primary/5 flex-shrink-0 w-[80px] text-center">
              {cert.year}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */

export function Skills() {
  const [activeTab, setActiveTab] = useState<TabId>('skills');
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');

  return (
    <section id="skills" className="relative py-12 sm:py-20 overflow-hidden px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl liquid-morph" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl liquid-morph" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-16 space-y-4 sm:space-y-6">
          <div className="inline-flex items-center justify-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <div className="relative px-6 py-2 rounded-full liquid-glass-strong border border-primary/30 liquid-shimmer">
                <span className="text-sm font-mono text-primary tracking-wider">TECHNICAL SKILLS</span>
              </div>
            </div>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl">
            <span className="block bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent mb-2">
              Expertise & Tools
            </span>
          </h2>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Specializing in <span className="text-primary font-medium">Cloud Operations</span>,
            <span className="text-secondary font-medium"> Python Development</span>,
            <span className="text-accent font-medium"> AI/ML</span>, and
            <span className="text-primary font-medium"> Microsoft 365 Ecosystem</span>
          </p>
        </div>

        {/* ═══ MOBILE VIEW ═══ */}
        <div className="mobile-only">
          {SORTED_CATEGORIES.map((category, idx) => (
            <MarqueeRow key={category.title} category={category} index={idx} />
          ))}
          <MethodologyMarquee />
          <CertCarousel />
        </div>

        {/* ═══ DESKTOP VIEW ═══ */}
        <div className="desktop-only">
          <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

          {activeTab === 'skills' && (
            <div>
              <CategoryFilters activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
              <SkillChipsGrid activeCategory={activeCategory} />
            </div>
          )}

          {activeTab === 'methods' && <MethodologyPills />}

          {activeTab === 'certs' && <CertCompactList />}
        </div>
      </div>
    </section>
  );
}
