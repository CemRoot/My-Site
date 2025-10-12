import { useEffect } from 'react';
import { Hero } from '../components/Hero';
import { Stats } from '../components/Stats';
import { About } from '../components/About';
import { Services } from '../components/Services';
import { Projects } from '../components/Projects';
import { Experience } from '../components/Experience';
import { Skills } from '../components/Skills';
import { CV } from '../components/CV';
import { Contact } from '../components/Contact';
import { usePageContext } from '../lib/context/PageContext';

/**
 * Home Page Component
 * Main portfolio landing page with all sections
 */
export function HomePage() {
  const { setPageInfo } = usePageContext();

  useEffect(() => {
    setPageInfo({
      path: '/',
      title: 'Cem Koyluoglu Portfolio',
      summary:
        'Landing page highlighting Cem Koyluoglu’s AI engineering expertise, services, signature projects, experience, skills, and contact details.',
      highlights: [
        'Hero section with availability and quick contact options',
        'Service offerings covering AI solutions, system operations, and automation',
        'Project portfolio, career timeline, skills matrix, and direct contact form',
      ],
    });

    return () => setPageInfo(null);
  }, [setPageInfo]);

  return (
    <>
      <Hero />
      <Stats />
      <About />
      <Services />
      <Projects />
      <Experience />
      <Skills />
      <CV />
      <Contact />
    </>
  );
}
