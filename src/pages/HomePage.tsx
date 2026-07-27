import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { HeroSection } from '../sections/HeroSection';
import { StatsStrip } from '../sections/StatsStrip';
import { SystemsSection } from '../sections/SystemsSection';
import { WorkSection } from '../sections/WorkSection';
import { SignalSection } from '../sections/SignalSection';
import { ExperienceStackSection } from '../sections/ExperienceStackSection';
import { ServicesSection } from '../sections/ServicesSection';
import { ContactSection } from '../sections/ContactSection';
import { ProbeTree } from '../lib/perfProbe';
import { usePageContext } from '../lib/context/PageContext';
import { PERSONAL_INFO, EDUCATION } from '../lib/constants/personal';

/**
 * Home — the editorial / systems landing page.
 * Section order mirrors the design prototype: hero → stats → systems → work →
 * signal → experience+stack → services → contact.
 */
function HomePage() {
  const { setPageInfo } = usePageContext();
  const location = useLocation();

  // Support /#systems style links arriving from other routes: the global
  // scroll-to-top layout effect runs first, then this brings the target into
  // view once sections exist in the DOM.
  useEffect(() => {
    if (!location.hash) return;
    const target = document.querySelector(location.hash);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.hash]);

  useEffect(() => {
    setPageInfo({
      path: '/',
      title: `${PERSONAL_INFO.name} - ${PERSONAL_INFO.title}`,
      summary:
        `Portfolio homepage showcasing ${PERSONAL_INFO.name}'s AI engineering expertise, live automation systems, selected projects, work experience, services, and contact information.`,
      description:
        `This is the main landing page featuring comprehensive information about ${PERSONAL_INFO.name}, an ${PERSONAL_INFO.title} based in ${PERSONAL_INFO.location}.`,
      highlights: [
        `${PERSONAL_INFO.title} with ${EDUCATION.degree} (${EDUCATION.classification}, ${EDUCATION.grade}%)`,
        'Specializes in deepfake detection, computer vision, RAG and agentic workflows',
        'Published researcher — Springer CCIS, AICS 2025',
        'Available for both freelance projects and full-time opportunities',
        `Based in ${PERSONAL_INFO.location} with remote and on-site work options`,
      ],
      features: [
        'Hero section with 3D wireframe head and availability status',
        'Live systems overview (news scraper, agent layer, chatbot, deploy pipeline)',
        'Selected work — six real projects with links',
        'Signal — latest tech news from the automated pipeline',
        'Experience / Education timeline toggle and technology stack',
        'Fixed-scope service packages',
        'Direct contact channels (email, LinkedIn, GitHub, WhatsApp)',
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
        `The homepage provides a complete overview of ${PERSONAL_INFO.name.split(' ')[0]}'s professional profile, from his educational background (${EDUCATION.degree} from ${EDUCATION.institution}) to his technical expertise in deepfake detection, computer vision and AI automation. Visitors can explore his running systems, view selected projects, read the latest tech news, and get in touch via email (${PERSONAL_INFO.email}) or WhatsApp (${PERSONAL_INFO.phone}).`,
    });

    return () => setPageInfo(null);
  }, [setPageInfo]);

  return (
    <>
      <SEO
        title="Cem Koyluoglu - AI Engineer & Microsoft 365 Specialist | Dublin, Ireland"
        description="AI Engineer specializing in deepfake detection, computer vision, RAG and agentic workflows. Based in Dublin, Ireland. Available for freelance projects and full-time opportunities."
        ogTitle="Cem Koyluoglu - AI Engineer & Microsoft 365 Specialist"
        ogDescription="AI systems that survive production. MSc AI (First Class Honours), published researcher — Springer CCIS. Based in Dublin, Ireland."
      />
      <ProbeTree id="HeroSection"><HeroSection /></ProbeTree>
      <ProbeTree id="StatsStrip"><StatsStrip /></ProbeTree>
      <ProbeTree id="SystemsSection"><SystemsSection /></ProbeTree>
      <ProbeTree id="WorkSection"><WorkSection /></ProbeTree>
      <ProbeTree id="SignalSection"><SignalSection /></ProbeTree>
      <ProbeTree id="ExperienceStackSection"><ExperienceStackSection /></ProbeTree>
      <ProbeTree id="ServicesSection"><ServicesSection /></ProbeTree>
      <ProbeTree id="ContactSection"><ContactSection /></ProbeTree>
    </>
  );
}

export default HomePage;
