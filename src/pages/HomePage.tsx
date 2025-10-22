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
      title: 'Cem Koyluoglu - AI Engineer & System Operations Specialist',
      summary:
        "Portfolio homepage showcasing Cem Koyluoglu's AI engineering expertise, professional services, signature projects, work experience, technical skills, and contact information.",
      description:
        'This is the main landing page featuring comprehensive information about Cem Koyluoglu, an AI Engineer and System Operations Specialist based in Dublin, Ireland with 3+ years of Python experience.',
      highlights: [
        'AI Engineer & System Operations Specialist with MSc in AI (First Class Honours, 71.4%)',
        'Specializes in LLMs, NLP, Computer Vision, and Cloud Solutions',
        'Available for both freelance projects and full-time opportunities',
        'Based in Dublin, Ireland with remote and on-site work options',
        '100% client satisfaction rate with 5+ professional certifications',
      ],
      features: [
        'Hero section with real-time availability status',
        'Professional statistics and achievements',
        'About section with background and education',
        'Service offerings (AI/ML solutions, system operations, automation)',
        'Project portfolio with real-world applications',
        'Detailed work experience timeline',
        'Comprehensive skills matrix (Python, TensorFlow, PyTorch, Azure, etc.)',
        'CV/Resume download option',
        'Direct contact form and communication channels',
      ],
      technologies: [
        'Python',
        'TensorFlow',
        'PyTorch',
        'LangChain',
        'Azure',
        'Microsoft 365',
        'RAG',
        'NLP',
        'Computer Vision',
        'Deep Learning',
      ],
      content:
        "The homepage provides a complete overview of Cem's professional profile, from his educational background (MSc in AI from National College of Ireland) to his technical expertise in Large Language Models, Natural Language Processing, and Cloud Solutions. Visitors can explore his services, view his project portfolio, understand his career journey, and easily get in touch via email (cemkoyluoglu@icloud.com) or WhatsApp (+353 87 344 5918).",
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
