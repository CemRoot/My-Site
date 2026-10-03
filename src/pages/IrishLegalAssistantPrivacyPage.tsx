import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePageContext } from '../lib/context/PageContext';
import { PERSONAL_INFO } from '../lib/constants/personal';
import { SEO } from '../components/SEO';
import { LegalPageShell, LegalSection } from '../sections/LegalPageShell';

/**
 * Privacy notice for the Irish Legal Assistant plugin only.
 * Direct URL: /privacy. Not linked from site navigation or the sitemap.
 */
const PAGE_TITLE = 'Irish Legal Assistant Privacy Policy';
const LAST_UPDATED = '3 October 2026';
const DESCRIPTION =
  'Privacy notice for the Irish Legal Assistant skills-only plugin in ChatGPT and Codex: no separate developer backend, no independent storage of prompts, and how to contact the developer.';

function IrishLegalAssistantPrivacyPage() {
  const { setPageInfo } = usePageContext();

  useEffect(() => {
    setPageInfo({
      path: '/privacy',
      title: PAGE_TITLE,
      summary: DESCRIPTION,
      highlights: [
        'Applies only to the Irish Legal Assistant plugin',
        'The developer does not run a separate plugin backend',
        'ChatGPT and Codex processing follows OpenAI notices',
      ],
      lastUpdated: LAST_UPDATED,
    });

    return () => setPageInfo(null);
  }, [setPageInfo]);

  return (
    <>
      <SEO
        title={`${PAGE_TITLE} | ${PERSONAL_INFO.name}`}
        description={DESCRIPTION}
        ogTitle={`${PAGE_TITLE} | ${PERSONAL_INFO.name}`}
        ogDescription="How the Irish Legal Assistant plugin handles privacy: OpenAI processes activity inside ChatGPT and Codex, and the developer does not keep a separate copy."
        keywords="Irish Legal Assistant, privacy policy, ChatGPT plugin, Codex, Ireland"
      />
      <LegalPageShell title={PAGE_TITLE} lastUpdated={LAST_UPDATED}>
        <LegalSection number="01" title="Scope">
          <p>Last updated: {LAST_UPDATED}.</p>
          <p>
            This notice applies only to Irish Legal Assistant, a skills-only plugin for ChatGPT and
            Codex, published by {PERSONAL_INFO.name} (&quot;the developer&quot;).
          </p>
          <p>
            It does not describe this portfolio website. The website has a separate{' '}
            <Link to="/privacy-policy">Privacy Policy</Link>.
          </p>
        </LegalSection>

        <LegalSection number="02" title="What the plugin is for">
          <p>
            Irish Legal Assistant is for general research and information about Irish law. It does
            not give legal advice and it does not represent you.
          </p>
        </LegalSection>

        <LegalSection number="03" title="No separate plugin backend">
          <p>
            The developer does not operate a separate backend for this plugin. The plugin runs
            inside ChatGPT or Codex.
          </p>
        </LegalSection>

        <LegalSection number="04" title="Prompts, documents, and research outputs">
          <p>
            The developer does not independently collect, store, sell, or share your prompts, source
            documents you upload, or research outputs on the developer&apos;s own systems. The
            developer does not use that information for advertising or marketing.
          </p>
          <p>
            Information handled inside ChatGPT or Codex is subject to the applicable OpenAI product
            terms and privacy notices, including the{' '}
            <a href="https://openai.com/policies/terms-of-use" rel="noopener noreferrer">
              OpenAI Terms of Use
            </a>{' '}
            and the{' '}
            <a href="https://openai.com/policies/privacy-policy" rel="noopener noreferrer">
              OpenAI Privacy Policy
            </a>
            .
          </p>
        </LegalSection>

        <LegalSection number="05" title="Information you should not enter">
          <p>Do not enter:</p>
          <ul>
            <li>special category personal data;</li>
            <li>health data;</li>
            <li>information about criminal convictions or offences;</li>
            <li>payment details;</li>
            <li>passwords, API keys, or other secrets.</li>
          </ul>
        </LegalSection>

        <LegalSection number="06" title="Sources used for research">
          <p>
            The plugin may use legal sources you upload, and official web sources, to carry out the
            research you request.
          </p>
        </LegalSection>

        <LegalSection number="07" title="Accounts, payments, and tracking">
          <p>
            The developer does not provide a user account, a payment system, tracking or analytics,
            or a profile system for this plugin.
          </p>
        </LegalSection>

        <LegalSection number="08" title="General information only">
          <p>
            The plugin produces general information. For important decisions, and for any legal step
            that has a deadline, consult a qualified Irish legal professional.
          </p>
        </LegalSection>

        <LegalSection number="09" title="Your rights and how to ask a question">
          <p>
            Privacy questions about this plugin can be sent to{' '}
            <a href={`mailto:${PERSONAL_INFO.email}`}>{PERSONAL_INFO.email}</a>.
          </p>
          <p>
            Under the GDPR, where those rights apply, you may ask a controller for access to
            personal data it holds about you, and you may ask for that data to be corrected,
            deleted, or restricted. You may also object to certain processing, and you may ask for
            personal data you provided to be given to you in a portable form.
          </p>
          <p>
            The developer does not independently hold plugin prompts, uploaded documents, or
            research outputs. Requests about that activity should be made to OpenAI under its
            privacy notice. If you email the developer, that message is used to reply to you.
          </p>
          <p>
            You may lodge a complaint with the Irish Data Protection Commission:{' '}
            <a href="https://www.dataprotection.ie/" rel="noopener noreferrer">
              dataprotection.ie
            </a>
            .
          </p>
        </LegalSection>
      </LegalPageShell>
    </>
  );
}

export default IrishLegalAssistantPrivacyPage;
