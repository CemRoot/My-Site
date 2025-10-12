import { Hero } from '../components/Hero';
import { Stats } from '../components/Stats';
import { About } from '../components/About';
import { Services } from '../components/Services';
import { Projects } from '../components/Projects';
import { Experience } from '../components/Experience';
import { Skills } from '../components/Skills';
import { CV } from '../components/CV';
import { Contact } from '../components/Contact';

/**
 * Home Page Component
 * Main portfolio landing page with all sections
 */
export function HomePage() {
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

