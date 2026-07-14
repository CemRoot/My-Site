import { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle2, Globe, Smartphone } from 'lucide-react';
import { Button } from '../components/ui/button';
import { usePageContext } from '../lib/context/PageContext';
import { SEO } from '../components/SEO';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
      return [
        'Open the Learn English Chrome extension from the puzzle icon',
        'Sign in with your email and password',
        'Click any word in video subtitles to save it to your journal',
      ];
    }
    return [
      'Chrome extension captures subtitle context while you watch videos',
      'LLM enrichment adds definitions, translations, and etymology',
      'iOS app reviews saved words with FSRS spaced repetition',
    ];
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
        className="min-h-screen bg-gradient-to-b from-background to-muted/20 px-4 pb-24"
        style={{ paddingTop: 'calc(var(--nav-height, 120px) + 56px)' }}
      >
        <div className="max-w-3xl mx-auto">
          <Link to="/">
            <Button variant="ghost" className="mb-8 hover:bg-primary/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>

          <div className="relative group mb-10">
            <div className="absolute -inset-2 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 rounded-3xl blur-2xl opacity-50" />
            <div className="relative liquid-glass-strong rounded-3xl p-8 sm:p-12">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 flex items-center justify-center">
                  {isVerified ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <BookOpen className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-primary/80 mb-1">
                    Learn English
                  </p>
                  <h1 className="text-3xl sm:text-4xl font-[Hobo_BT]">{pageTitle}</h1>
                </div>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                {isVerified
                  ? 'Your account is ready. Sign in from the Chrome extension to start learning.'
                  : 'Click unknown words in video subtitles to pause, translate, and save vocabulary. Review on iOS with spaced repetition.'}
              </p>

              {isVerified && email ? (
                <p className="mt-4 text-sm text-emerald-400 break-all">Confirmed: {email}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            {isVerified ? (
              <section className="liquid-glass rounded-2xl p-6 sm:p-8 space-y-4">
                <h2 className="text-xl text-primary font-[Hobo_BT]">Next steps</h2>
                <ol className="space-y-3 text-muted-foreground list-decimal list-inside">
                  {highlights.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <p className="text-sm text-muted-foreground pt-2">
                  You can close this tab after signing in.
                </p>
              </section>
            ) : (
              <>
                <section className="liquid-glass rounded-2xl p-6 sm:p-8 flex gap-4 items-start">
                  <Globe className="w-5 h-5 text-primary mt-1 shrink-0" />
                  <div>
                    <h2 className="text-lg text-primary font-[Hobo_BT] mb-2">Chrome extension</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Works on YouTube and other video sites. Click a subtitle word to enrich it with
                      AI and save it to your journal.
                    </p>
                  </div>
                </section>
                <section className="liquid-glass rounded-2xl p-6 sm:p-8 flex gap-4 items-start">
                  <Smartphone className="w-5 h-5 text-primary mt-1 shrink-0" />
                  <div>
                    <h2 className="text-lg text-primary font-[Hobo_BT] mb-2">iOS app</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Review saved words with FSRS spaced repetition, streak stats, and sentence-focused
                      flashcards.
                    </p>
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

export default EnglishLearningPage;
