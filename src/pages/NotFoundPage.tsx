import { SEO } from '../components/SEO';
import { PERSONAL_INFO } from '../lib/constants/personal';
import './not-found-duck.css';

type NotFoundPageProps = {
  /** Kök ErrorBoundary: Navbar yok, üst boşluk azaltılır */
  bare?: boolean;
};

export default function NotFoundPage({ bare }: NotFoundPageProps = {}) {
  return (
    <>
      <SEO
        title={`404 | ${PERSONAL_INFO.name}`}
        description="This page does not exist."
        robots="noindex, nofollow"
        ogTitle="404 — Page not found"
        ogDescription="This page does not exist."
      />
      <div
        className="min-h-screen bg-background flex items-center justify-center px-4 pb-24"
        style={{
          paddingTop: bare ? '2rem' : 'calc(var(--nav-height, 120px) + 56px)',
        }}
      >
        <div className="not-found-duck w-full flex justify-center">
          <div className="card">
            <div className="orb orb--1" />
            <div className="orb orb--2" />
            <div className="orb orb--3" />
            <div className="orb orb--4" />

            <div className="error-container">
              <div className="error-code">404</div>
              <div className="error-msg">Nothing to see here.</div>
              <a href="/" className="home-btn">
                Go Home
              </a>
            </div>

            <div className="duck__wrapper">
              <div className="duck">
                <div className="duck__inner">
                  <div className="duck__mouth" />
                  <div className="duck__head">
                    <div className="duck__eye" />
                    <div className="duck__white" />
                  </div>
                  <div className="duck__body" />
                  <div className="duck__wing" />
                </div>
                <div className="duck__foot duck__foot--1" />
                <div className="duck__foot duck__foot--2" />
                <div className="surface" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
