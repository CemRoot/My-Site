import { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Brain,
  CheckCircle2,
  Globe,
  LogIn,
  MousePointerClick,
  PlayCircle,
  Puzzle,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { usePageContext } from '../lib/context/PageContext';
import { SEO } from '../components/SEO';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Watch',
    description: 'Open any video with subtitles on YouTube or supported sites.',
    icon: PlayCircle,
    color: 'primary' as const,
  },
  {
    step: '02',
    title: 'Click',
    description: 'Tap an unknown word in the subtitles. The video pauses and AI enriches it in context.',
    icon: MousePointerClick,
    color: 'secondary' as const,
  },
  {
    step: '03',
    title: 'Review',
    description: 'Save to your journal and reinforce vocabulary on iOS with FSRS spaced repetition.',
    icon: Brain,
    color: 'accent' as const,
  },
];

const PLATFORMS = [
  {
    title: 'Chrome extension',
    description:
      'Side panel journal, subtitle overlay, and one-click capture while you watch.',
    icon: Globe,
    tags: ['Manifest V3', 'YouTube', 'Side panel'],
    color: 'from-primary/20 to-primary/5 border-primary/20',
    iconColor: 'text-primary',
  },
  {
    title: 'iOS app',
    description:
      'Review saved words with sentence-focused cards, streaks, and adaptive scheduling.',
    icon: Smartphone,
    tags: ['FSRS', 'Light / dark', 'Journal search'],
    color: 'from-secondary/20 to-secondary/5 border-secondary/20',
    iconColor: 'text-secondary',
  },
  {
    title: 'Smart enrichment',
    description:
      'Definitions, translations, synonyms, etymology, and IPA — grounded in the sentence you clicked.',
    icon: Sparkles,
    tags: ['LLM', 'Context-aware', 'Multi-language'],
    color: 'from-accent/20 to-accent/5 border-accent/20',
    iconColor: 'text-accent',
  },
];

const VERIFIED_STEPS = [
  {
    title: 'Open the extension',
    description: 'Click the puzzle icon in Chrome and select Learn English.',
    icon: Puzzle,
  },
  {
    title: 'Sign in',
    description: 'Use the email and password you registered with.',
    icon: LogIn,
  },
  {
    title: 'Start learning',
    description: 'Click any subtitle word on a video to save it to your journal.',
    icon: MousePointerClick,
  },
];

function safeEmail(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim().slice(0, 254);
  return EMAIL_PATTERN.test(trimmed) ? trimmed : null;
}

function EnglishLearningPage() {
  const [searchParams] = useSearchParams();
  const isVerified = searchParams.get('status') === 'verified';
  const email = useMemo(
    () => safeEmail(searchParams.get('email')),
    [searchParams],
  );

  const pageTitle = isVerified ? 'Email verified' : 'Learn English';
  const pageDescription = isVerified
    ? 'Your Learn English account is confirmed. Sign in from the Chrome extension to start saving vocabulary from video subtitles.'
    : 'Contextual vocabulary learning from video subtitles — Chrome extension and iOS spaced repetition app.';

  const highlights = useMemo(() => {
    if (isVerified) {
      return VERIFIED_STEPS.map((step) => step.description);
    }
    return HOW_IT_WORKS.map((item) => item.description);
  }, [isVerified]);

  const { setPageInfo } = usePageContext();

  useEffect(() => {
    setPageInfo({
      path: '/english-learning',
      title: pageTitle,
      summary: pageDescription,
      highlights,
      lastUpdated: 'July 2026',
    });

    return () => setPageInfo(null);
  }, [setPageInfo, pageTitle, pageDescription, highlights]);

  useEffect(() => {
    if (!email) return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has('email')) return;
    url.searchParams.delete('email');
    const query = url.searchParams.toString();
    window.history.replaceState(null, '', query ? `${url.pathname}?${query}` : url.pathname);
  }, [email]);

  return (
    <>
      <SEO
        title={`${pageTitle} | Cem Koyluoglu`}
        description={pageDescription}
        ogTitle={`${pageTitle} | Learn English`}
        ogDescription={pageDescription}
        robots={isVerified ? 'noindex, nofollow' : 'index, follow'}
      />
      <main
        className="relative min-h-screen overflow-hidden px-4 sm:px-6 lg:px-8 pb-24"
        style={{ paddingTop: 'calc(var(--nav-height, 120px) + 40px)' }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 -left-24 w-[420px] h-[420px] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-20 right-0 w-[360px] h-[360px] rounded-full bg-secondary/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <Link to="/">
            <Button variant="ghost" className="mb-8 hover:bg-primary/10 rounded-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>

          <div className="text-center mb-12 sm:mb-14">
            <div className="inline-flex items-center justify-center mb-5">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity" />
                <div className="relative px-5 py-2 rounded-full liquid-glass-strong border border-primary/30">
                  <span className="text-xs font-mono tracking-[0.2em] text-primary uppercase">
                    Learn English
                  </span>
                </div>
              </div>
            </div>

            {isVerified ? (
              <>
                <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center shadow-[0_0_40px_rgba(52,211,153,0.15)]">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <h1 className="text-4xl sm:text-5xl mb-4 font-[Hobo_BT]">
                  <span className="bg-gradient-to-r from-emerald-300 via-primary to-secondary bg-clip-text text-transparent">
                    You&apos;re all set
                  </span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Your email is confirmed. Sign in from the Chrome extension and start saving words from subtitles.
                </p>
                {email ? (
                  <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full liquid-glass border border-emerald-400/20">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-sm text-emerald-300/90 break-all">{email}</span>
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl mb-5 font-[Hobo_BT] leading-tight">
                  <span className="bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent">
                    Learn words in context
                  </span>
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Pause the video, click a subtitle word, and build a personal vocabulary journal.
                  Review on iOS with spaced repetition.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
                  {['Chrome extension', 'iOS app', 'FSRS review', 'AI enrichment'].map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="rounded-full px-3 py-1 border-white/10 bg-background/40"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </>
            )}
          </div>

          {isVerified ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mb-10">
              {VERIFIED_STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative h-full liquid-glass rounded-2xl p-6 border border-white/5">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-xs font-mono text-primary/70 tracking-widest">
                          STEP {index + 1}
                        </span>
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <h2 className="text-lg font-[Hobo_BT] mb-2">{step.title}</h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              <section className="mb-12 sm:mb-16">
                <div className="text-center mb-8">
                  <h2 className="text-2xl sm:text-3xl font-[Hobo_BT] mb-2">How it works</h2>
                  <p className="text-muted-foreground">Three steps from watching to remembering</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  {HOW_IT_WORKS.map((item) => {
                    const Icon = item.icon;
                    const glow =
                      item.color === 'primary'
                        ? 'from-primary/20'
                        : item.color === 'secondary'
                          ? 'from-secondary/20'
                          : 'from-accent/20';
                    return (
                      <div key={item.step} className="relative group">
                        <div className={`absolute -inset-1 bg-gradient-to-br ${glow} to-transparent rounded-3xl blur-xl opacity-60`} />
                        <div className="relative liquid-glass-strong rounded-2xl p-6 sm:p-7 h-full">
                          <div className="flex items-center justify-between mb-5">
                            <span className="text-3xl font-[Hobo_BT] text-white/10">{item.step}</span>
                            <div className="w-10 h-10 rounded-xl bg-background/50 border border-white/10 flex items-center justify-center">
                              <Icon className="w-5 h-5 text-primary" />
                            </div>
                          </div>
                          <h3 className="text-xl font-[Hobo_BT] mb-2">{item.title}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="mb-10">
                <div className="text-center mb-8">
                  <h2 className="text-2xl sm:text-3xl font-[Hobo_BT] mb-2">Built for learners</h2>
                  <p className="text-muted-foreground">Extension, mobile review, and AI in one flow</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
                  {PLATFORMS.map((platform) => {
                    const Icon = platform.icon;
                    return (
                      <div
                        key={platform.title}
                        className={`relative rounded-2xl p-6 sm:p-7 liquid-glass border bg-gradient-to-br ${platform.color} h-full`}
                      >
                        <div className="w-12 h-12 rounded-2xl bg-background/40 border border-white/10 flex items-center justify-center mb-5">
                          <Icon className={`w-6 h-6 ${platform.iconColor}`} />
                        </div>
                        <h3 className="text-lg font-[Hobo_BT] mb-2">{platform.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                          {platform.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {platform.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="rounded-full text-[11px] border-white/10 bg-background/30"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}

          <div className="relative group max-w-3xl mx-auto">
            <div className="absolute -inset-2 bg-gradient-to-r from-primary/15 via-secondary/15 to-accent/15 rounded-3xl blur-2xl opacity-70" />
            <div className="relative liquid-glass-strong rounded-3xl p-6 sm:p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl sm:text-2xl font-[Hobo_BT] mb-2">
                {isVerified ? 'Ready when you are' : 'Get started'}
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
                {isVerified
                  ? 'Open the Learn English extension, sign in, and click your first subtitle word. You can close this tab anytime.'
                  : 'Install the Chrome extension, create an account, and confirm your email to unlock subtitle capture and your vocabulary journal.'}
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default EnglishLearningPage;
