import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { usePageContext } from '../lib/context/PageContext';
import { SEO } from '../components/SEO';

const AUTH_CALLBACK_URL = 'https://auth.cemkoyluoglu.codes';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PAGE =
  'mx-auto max-w-[1440px] px-[clamp(18px,4vw,52px)] pb-[clamp(64px,10vh,120px)]';
const MONO = 'font-mono text-[11px] font-medium tracking-[0.14em]';

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Watch',
    description: 'Open any video with subtitles on YouTube or supported sites.',
  },
  {
    step: '02',
    title: 'Click',
    description: 'Tap an unknown word in the subtitles. The video pauses and AI enriches it in context.',
  },
  {
    step: '03',
    title: 'Review',
    description: 'Save to your journal and reinforce vocabulary on iOS with FSRS spaced repetition.',
  },
];

const PLATFORMS = [
  {
    title: 'Chrome extension',
    description:
      'Side panel journal, subtitle overlay, and one-click capture while you watch.',
    tags: ['Manifest V3', 'YouTube', 'Side panel'],
  },
  {
    title: 'iOS app',
    description:
      'Review saved words with sentence-focused cards, streaks, and adaptive scheduling.',
    tags: ['FSRS', 'Light / dark', 'Journal search'],
  },
  {
    title: 'Smart enrichment',
    description:
      'Definitions, translations, synonyms, etymology, and IPA — grounded in the sentence you clicked.',
    tags: ['LLM', 'Context-aware', 'Multi-language'],
  },
];

const VERIFIED_STEPS = [
  {
    title: 'Open the extension',
    description: 'Click the puzzle icon in Chrome and select Learn English.',
  },
  {
    title: 'Sign in',
    description: 'Use the email and password you registered with.',
  },
  {
    title: 'Start learning',
    description: 'Click any subtitle word on a video to save it to your journal.',
  },
];

function safeEmail(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim().slice(0, 254);
  return EMAIL_PATTERN.test(trimmed) ? trimmed : null;
}

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append('action', 'reset-password');
      form.append('password', password);
      form.append('password_confirm', confirm);

      const res = await fetch(AUTH_CALLBACK_URL, {
        method: 'POST',
        body: form,
        credentials: 'include',
      });
      const data = (await res.json()) as { ok?: boolean; redirect?: string; error?: string };

      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Could not update password. Request a new reset email.');
        return;
      }

      if (data.redirect) {
        window.location.href = data.redirect;
        return;
      }

      navigate('/english-learning?status=password-updated', { replace: true });
    } catch {
      setError('Network error. Try again or request a new reset email from the extension.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-10 max-w-[420px] border border-hairline bg-surface p-6 sm:p-8"
    >
      <label
        htmlFor="new-password"
        className={`${MONO} mb-2 block text-ink-42`}
      >
        NEW PASSWORD
      </label>
      <input
        id="new-password"
        type="password"
        minLength={6}
        autoComplete="new-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-5 w-full border border-hairline-strong bg-background px-4 py-3 font-sans text-[15px] text-foreground outline-none focus:border-signal"
      />
      <label
        htmlFor="confirm-password"
        className={`${MONO} mb-2 block text-ink-42`}
      >
        CONFIRM PASSWORD
      </label>
      <input
        id="confirm-password"
        type="password"
        minLength={6}
        autoComplete="new-password"
        required
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="mb-6 w-full border border-hairline-strong bg-background px-4 py-3 font-sans text-[15px] text-foreground outline-none focus:border-signal"
      />
      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center border border-hairline-strong bg-signal px-5 py-3 font-mono text-[11px] font-medium tracking-[0.14em] text-background transition-colors hover:bg-signal-hover disabled:opacity-50"
      >
        {loading ? 'UPDATING…' : 'UPDATE PASSWORD'}
      </button>
      {error ? (
        <p className="mt-4 font-sans text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}

function EnglishLearningPage() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const isVerified = status === 'verified';
  const isResetPassword = status === 'reset-password';
  const isPasswordUpdated = status === 'password-updated';
  const isPrivateFlow = isVerified || isResetPassword || isPasswordUpdated;

  const email = useMemo(
    () => safeEmail(searchParams.get('email')),
    [searchParams],
  );

  const pageTitle = isPasswordUpdated
    ? 'Password updated'
    : isResetPassword
      ? 'Reset password'
      : isVerified
        ? 'Email verified'
        : 'Learn English';

  const pageDescription = isPasswordUpdated
    ? 'Your Learn English password was changed. Sign in with your new password.'
    : isResetPassword
      ? 'Choose a new password for your Learn English account.'
      : isVerified
        ? 'Your Learn English account is confirmed. Sign in from the Chrome extension to start saving vocabulary from video subtitles.'
        : 'Contextual vocabulary learning from video subtitles — Chrome extension and iOS spaced repetition app.';

  const highlights = useMemo(() => {
    if (isPasswordUpdated) {
      return ['Open the Chrome extension', 'Sign in with your new password'];
    }
    if (isResetPassword) {
      return ['Choose a strong password', 'Sign in again from the extension'];
    }
    if (isVerified) {
      return VERIFIED_STEPS.map((step) => step.description);
    }
    return HOW_IT_WORKS.map((item) => item.description);
  }, [isPasswordUpdated, isResetPassword, isVerified]);

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

  const eyebrow = isPasswordUpdated
    ? 'ACCOUNT · PASSWORD UPDATED'
    : isResetPassword
      ? 'ACCOUNT · RESET PASSWORD'
      : isVerified
        ? 'ACCOUNT · EMAIL VERIFIED'
        : 'PRODUCT · LEARN ENGLISH';

  return (
    <>
      <SEO
        title={`${pageTitle} | Cem Koyluoglu`}
        description={pageDescription}
        ogTitle={`${pageTitle} | Learn English`}
        ogDescription={pageDescription}
        robots={isPrivateFlow ? 'noindex, nofollow' : 'index, follow'}
      />
      <div
        className={PAGE}
        style={{ paddingTop: 'calc(var(--nav-height, 64px) + 40px)' }}
      >
        <Link
          to="/"
          className={`${MONO} text-ink-42 transition-colors hover:text-foreground`}
        >
          ← BACK
        </Link>

        <header className="mt-8 border-b border-hairline pb-8">
          <p className={`${MONO} text-signal`}>{eyebrow}</p>
          {isPasswordUpdated ? (
            <>
              <h1 className="mt-3 font-sans text-[clamp(32px,5vw,52px)] font-bold leading-[0.96] tracking-[-0.04em]">
                Password updated
              </h1>
              <p className="mt-4 max-w-[640px] font-sans text-[clamp(14px,1.2vw,16px)] leading-[1.65] text-ink-62">
                Your password has been changed. Sign in from the Chrome extension with your new
                password.
              </p>
            </>
          ) : isResetPassword ? (
            <>
              <h1 className="mt-3 font-sans text-[clamp(32px,5vw,52px)] font-bold leading-[0.96] tracking-[-0.04em]">
                Choose a new password
              </h1>
              <p className="mt-4 max-w-[640px] font-sans text-[clamp(14px,1.2vw,16px)] leading-[1.65] text-ink-62">
                Enter a new password for your account. This page is secure — your session is stored
                in an HttpOnly cookie, not in the page source.
              </p>
            </>
          ) : isVerified ? (
            <>
              <h1 className="mt-3 font-sans text-[clamp(32px,5vw,52px)] font-bold leading-[0.96] tracking-[-0.04em]">
                You&apos;re all set
              </h1>
              <p className="mt-4 max-w-[640px] font-sans text-[clamp(14px,1.2vw,16px)] leading-[1.65] text-ink-62">
                Your email is confirmed. Sign in from the Chrome extension and start saving words
                from subtitles.
              </p>
              {email ? (
                <p className={`${MONO} mt-5 text-ink-70`}>{email}</p>
              ) : null}
            </>
          ) : (
            <>
              <h1 className="mt-3 font-sans text-[clamp(32px,5vw,52px)] font-bold leading-[0.96] tracking-[-0.04em]">
                Learn words in context
              </h1>
              <p className="mt-4 max-w-[640px] font-sans text-[clamp(14px,1.2vw,16px)] leading-[1.65] text-ink-62">
                Pause the video, click a subtitle word, and build a personal vocabulary journal.
                Review on iOS with spaced repetition.
              </p>
              <p className={`${MONO} mt-6 text-ink-42`}>
                CHROME EXTENSION · iOS APP · FSRS REVIEW · AI ENRICHMENT
              </p>
            </>
          )}
        </header>

        {isResetPassword ? (
          <ResetPasswordForm />
        ) : isPasswordUpdated ? (
          <section className="mt-10 border-t border-hairline">
            <div className="grid gap-px bg-hairline sm:grid-cols-2">
              {[
                { title: 'Open the extension', desc: 'Click the puzzle icon in Chrome.' },
                { title: 'Sign in', desc: 'Use your email and new password.' },
              ].map((step, index) => (
                <div key={step.title} className="bg-background p-6 sm:p-7">
                  <p className={`${MONO} text-signal`}>STEP {String(index + 1).padStart(2, '0')}</p>
                  <h2 className="mt-3 font-sans text-lg font-medium tracking-[-0.02em]">
                    {step.title}
                  </h2>
                  <p className="mt-2 font-sans text-[14px] leading-[1.65] text-ink-62">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : isVerified ? (
          <section className="mt-10 border-t border-hairline">
            <div className="grid gap-px bg-hairline sm:grid-cols-3">
              {VERIFIED_STEPS.map((step, index) => (
                <div key={step.title} className="bg-background p-6 sm:p-7">
                  <p className={`${MONO} text-signal`}>STEP {String(index + 1).padStart(2, '0')}</p>
                  <h2 className="mt-3 font-sans text-lg font-medium tracking-[-0.02em]">
                    {step.title}
                  </h2>
                  <p className="mt-2 font-sans text-[14px] leading-[1.65] text-ink-62">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <>
            <section className="mt-12 border-t border-hairline pt-10">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <h2 className="font-sans text-[clamp(22px,2.8vw,28px)] font-medium tracking-[-0.025em]">
                  How it works
                </h2>
                <p className={`${MONO} text-ink-42`}>THREE STEPS</p>
              </div>
              <div className="mt-6 grid gap-px bg-hairline sm:grid-cols-3">
                {HOW_IT_WORKS.map((item) => (
                  <div key={item.step} className="bg-background p-6 sm:p-7">
                    <p className={`${MONO} text-signal`}>{item.step}</p>
                    <h3 className="mt-3 font-sans text-xl font-medium tracking-[-0.02em]">
                      {item.title}
                    </h3>
                    <p className="mt-2 font-sans text-[14px] leading-[1.65] text-ink-62">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-14 border-t border-hairline pt-10">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <h2 className="font-sans text-[clamp(22px,2.8vw,28px)] font-medium tracking-[-0.025em]">
                  Built for learners
                </h2>
                <p className={`${MONO} text-ink-42`}>EXTENSION · iOS · AI</p>
              </div>
              <div className="mt-6 grid gap-px bg-hairline lg:grid-cols-3">
                {PLATFORMS.map((platform) => (
                  <div key={platform.title} className="bg-background p-6 sm:p-7">
                    <h3 className="font-sans text-lg font-medium tracking-[-0.02em]">
                      {platform.title}
                    </h3>
                    <p className="mt-2 font-sans text-[14px] leading-[1.65] text-ink-62">
                      {platform.description}
                    </p>
                    <p className={`${MONO} mt-5 text-ink-42`}>
                      {platform.tags.map((tag) => tag.toUpperCase()).join(' · ')}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {!isResetPassword ? (
          <section className="mt-14 border-t border-hairline pt-10">
            <p className={`${MONO} text-signal`}>
              {isPasswordUpdated ? 'NEXT' : isVerified ? 'READY' : 'GET STARTED'}
            </p>
            <h2 className="mt-3 font-sans text-[clamp(22px,2.8vw,28px)] font-medium tracking-[-0.025em]">
              {isPasswordUpdated
                ? 'All done'
                : isVerified
                  ? 'Ready when you are'
                  : 'Install and confirm'}
            </h2>
            <p className="mt-3 max-w-[560px] font-sans text-[15px] leading-[1.65] text-ink-62">
              {isPasswordUpdated
                ? 'You can close this tab and sign in from the extension.'
                : isVerified
                  ? 'Open the Learn English extension, sign in, and click your first subtitle word.'
                  : 'Install the Chrome extension, create an account, and confirm your email to unlock subtitle capture.'}
            </p>
            <Link
              to="/"
              className="mt-8 inline-flex items-center border border-hairline-strong bg-signal px-5 py-3 font-mono text-[11px] font-medium tracking-[0.14em] text-background transition-colors hover:bg-signal-hover"
            >
              RETURN HOME →
            </Link>
          </section>
        ) : null}
      </div>
    </>
  );
}

export default EnglishLearningPage;
