import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { PERSONAL_INFO } from '../lib/constants/personal';
import './not-found-duck.css';

type NotFoundPageProps = {
  /** Root ErrorBoundary: no SiteHeader, reduce top padding */
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
        className="not-found-page flex min-h-screen items-center justify-center px-[clamp(18px,4vw,52px)] pb-24"
        style={{
          paddingTop: bare ? '2rem' : 'calc(var(--nav-height, 64px) + 40px)',
        }}
      >
        <div className="not-found-duck w-full max-w-[600px]">
          <div className="stage">
            <div className="orb orb--1" />
            <div className="orb orb--2" />
            <div className="orb orb--3" />
            <div className="orb orb--4" />

            <div className="error-container">
              <p className="error-label">ERROR · SIGNAL LOST</p>
              <div className="error-code" aria-hidden="true">
                404
              </div>
              <h1 className="error-msg">Nothing to see here.</h1>
              <Link to="/" className="home-btn">
                RETURN HOME →
              </Link>
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
