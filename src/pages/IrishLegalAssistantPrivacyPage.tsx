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

        <LegalSection number="02" title="Categories of personal data">
          <p>
            The developer does not receive a separate copy of what you do in the plugin. The
            developer does not collect your prompts, the legal sources you upload, or the research
            outputs.
          </p>
          <p>Two limited cases are different:</p>
          <ul>
            <li>
              Inside ChatGPT or Codex, the text and files you choose to submit are processed by
              OpenAI so the plugin can answer you. The developer does not take a copy of that
              material.
            </li>
            <li>
              If you email the developer, the developer receives your email address and whatever you
              put in that message.
            </li>
          </ul>
          <p>
            The plugin does not ask for a profile, payment details, or account data. It does not
            collect IP addresses, timestamps, or query patterns of its own. Visiting this page can
            create ordinary hosting logs, which are covered by the website{' '}
            <Link to="/privacy-policy">Privacy Policy</Link>, not by a plugin profile.
          </p>
        </LegalSection>

        <LegalSection number="03" title="Purposes of use">
          <p>
            Information you submit in ChatGPT or Codex is used only to carry out the Irish
            legal-information research you asked for. That use happens inside the OpenAI product,
            under the{' '}
            <a href="https://openai.com/policies/terms-of-use" rel="noopener noreferrer">
              OpenAI Terms of Use
            </a>{' '}
            and the{' '}
            <a href="https://openai.com/policies/privacy-policy" rel="noopener noreferrer">
              OpenAI Privacy Policy
            </a>
            .
          </p>
          <p>
            Email you send to the developer is used only to answer that message. It is not used for
            advertising, marketing, or sale.
          </p>
        </LegalSection>

        <LegalSection number="04" title="Categories of recipients">
          <p>
            The developer does not sell personal data and does not share plugin activity with
            advertisers, data brokers, or other companies.
          </p>
          <p>
            OpenAI processes the prompts and files you submit inside ChatGPT or Codex. The developer
            does not operate a plugin backend and does not send a separate copy to anyone else.
          </p>
          <p>
            Email sent to the published address is delivered through the email service that hosts
            that inbox. The developer does not pass those messages to a marketing list.
          </p>
        </LegalSection>

        <LegalSection number="05" title="How long data is kept">
          <p>
            The developer does not keep plugin prompts, uploaded documents, or research outputs. How
            long that material stays in ChatGPT or Codex is controlled by your OpenAI account and
            OpenAI&apos;s privacy notice. The developer cannot delete it, because the developer does
            not hold it.
          </p>
          <p>
            Email sent to the developer is kept only to answer and follow up on that enquiry. It is
            deleted within 12 months after the last message in that exchange, unless the law
            requires a longer period.
          </p>
        </LegalSection>

        <LegalSection number="06" title="Controls available to you">
          <p>You decide what to type or upload. Do not include the restricted data listed below.</p>
          <p>You can review and delete ChatGPT or Codex history in the OpenAI product you used.</p>
          <p>
            You can email the developer to ask for access to, correction of, or deletion of an email
            you sent. Privacy and support questions go to{' '}
            <a href={`mailto:${PERSONAL_INFO.email}`}>{PERSONAL_INFO.email}</a>.
          </p>
          <p>
            Under the GDPR, where those rights apply, you may ask a controller for access,
            correction, deletion, restriction, or a portable copy of personal data it holds, and you
            may object to certain processing. For plugin activity held by OpenAI, use OpenAI&apos;s
            privacy notice. For an email you sent the developer, use the address above.
          </p>
          <p>
            You may lodge a complaint with the Irish Data Protection Commission:{' '}
            <a href="https://www.dataprotection.ie/" rel="noopener noreferrer">
              dataprotection.ie
            </a>
            .
          </p>
        </LegalSection>

        <LegalSection number="07" title="Data you should not provide">
          <p>The plugin does not need this information, and you must not enter it:</p>
          <ul>
            <li>special category personal data;</li>
            <li>health information;</li>
            <li>information about criminal convictions or offences;</li>
            <li>payment card or other payment details;</li>
            <li>
              government identifiers, such as a PPS number, passport number, or social security
              number;
            </li>
            <li>passwords, API keys, multi-factor or one-time codes, or other access secrets.</li>
          </ul>
        </LegalSection>

        <LegalSection number="08" title="No accounts, tracking, or commerce">
          <p>
            The developer does not provide a user account, a payment system, a subscription,
            tracking, analytics, or a profile for this plugin. The plugin does not track users,
            build behavioural profiles, or collect metadata such as timestamps, IP addresses, or
            query patterns.
          </p>
          <p>The plugin does not show advertisements and does not sell goods or services.</p>
        </LegalSection>

        <LegalSection number="09" title="Sources used for research">
          <p>
            The plugin may use legal sources you upload, and official web sources, to carry out the
            research you request. Those sources are used for that request inside ChatGPT or Codex.
            The developer does not keep a copy.
          </p>
        </LegalSection>

        <LegalSection number="10" title="General information only">
          <p>
            Irish Legal Assistant is for general research and information about Irish law. It does
            not give legal advice and it does not represent you. For important decisions, and for
            any legal step that has a deadline, consult a qualified Irish legal professional.
          </p>
        </LegalSection>
      </LegalPageShell>
    </>
  );
}

export default IrishLegalAssistantPrivacyPage;
