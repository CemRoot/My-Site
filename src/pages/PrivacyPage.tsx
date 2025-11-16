import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '../components/ui/button';
import { usePageContext } from '../lib/context/PageContext';

/**
 * Privacy Policy Page
 * GDPR-compliant privacy policy for Ireland-based business
 */
function PrivacyPage() {
  const { setPageInfo } = usePageContext();

  useEffect(() => {
    setPageInfo({
      path: '/privacy-policy',
      title: 'Privacy Policy',
      summary:
        'GDPR-compliant privacy policy detailing data collection, usage, retention, third-party services, cookies, and user rights for Cem Koyluoglu’s site.',
      highlights: [
        'Explains contact form, newsletter, and chat data handling',
        'Details legal bases, retention periods, and GDPR rights',
        'Lists third-party processors, security measures, and contact information',
      ],
      lastUpdated: 'October 12, 2025',
    });

    return () => setPageInfo(null);
  }, [setPageInfo]);

  return (
    <main
      className="min-h-screen bg-gradient-to-b from-background to-muted/20 px-4 pb-24"
      style={{ paddingTop: 'calc(var(--nav-height, 120px) + 56px)' }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link to="/">
          <Button variant="ghost" className="mb-8 hover:bg-primary/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        {/* Header */}
        <div className="relative group mb-12">
          <div className="absolute -inset-2 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 rounded-3xl blur-2xl opacity-50" />
          
          <div className="relative liquid-glass-strong rounded-3xl p-8 sm:p-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-[Hobo_BT]">Privacy Policy</h1>
            </div>
            <p className="text-muted-foreground">Last updated: October 12, 2025</p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary">GDPR Compliant</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Section */}
          <section className="liquid-glass rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl sm:text-2xl text-primary font-[Hobo_BT]">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              This Privacy Policy explains how Cem Koyluoglu ("we," "us," or "our") collects, uses, and protects your 
              personal information when you visit our website or use our services. We are committed to protecting your 
              privacy in accordance with the General Data Protection Regulation (GDPR) and Irish data protection laws.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              As a data controller based in Dublin, Ireland, we take your privacy seriously and ensure that all personal 
              data is processed lawfully, fairly, and transparently.
            </p>
          </section>

          {/* Section */}
          <section className="liquid-glass rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl sm:text-2xl text-primary font-[Hobo_BT]">2. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may collect the following types of personal information:
            </p>
            
            <div className="space-y-4 pl-4">
              <div>
                <h3 className="text-lg text-foreground mb-2">2.1 Information You Provide</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li><strong>Contact Forms:</strong> Name, email address, and message content</li>
                  <li><strong>Newsletter Subscriptions:</strong> Email address</li>
                  <li><strong>Chat Widget:</strong> Name, email address, and conversation content</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg text-foreground mb-2">2.2 Automatically Collected Information</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Browser type and version</li>
                  <li>Device information</li>
                  <li>IP address (anonymized where possible)</li>
                  <li>Pages visited and time spent on site</li>
                  <li>Referring website addresses</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section */}
          <section className="liquid-glass rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl sm:text-2xl text-primary font-[Hobo_BT]">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use your personal information for the following purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-4">
              <li><strong>Communication:</strong> To respond to your inquiries and messages</li>
              <li><strong>Newsletter:</strong> To send you tech news and updates (with your consent)</li>
              <li><strong>Service Improvement:</strong> To analyze website usage and improve user experience</li>
              <li><strong>Professional Opportunities:</strong> To contact you about potential collaborations or job opportunities (if you've expressed interest)</li>
              <li><strong>Legal Compliance:</strong> To comply with legal obligations and protect our rights</li>
            </ul>
          </section>

          {/* Section */}
          <section className="liquid-glass rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl sm:text-2xl text-primary font-[Hobo_BT]">4. Legal Basis for Processing (GDPR)</h2>
            <p className="text-muted-foreground leading-relaxed">
              Under GDPR, we process your personal data based on:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-4">
              <li><strong>Consent:</strong> Newsletter subscriptions and marketing communications</li>
              <li><strong>Legitimate Interest:</strong> Responding to inquiries and improving our services</li>
              <li><strong>Contractual Necessity:</strong> When providing services you've requested</li>
              <li><strong>Legal Obligation:</strong> When required by law</li>
            </ul>
          </section>

          {/* Section */}
          <section className="liquid-glass rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl sm:text-2xl text-primary font-[Hobo_BT]">5. Data Storage and Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal data:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-4">
              <li>Encrypted data transmission (HTTPS/SSL)</li>
              <li>Secure database storage with access controls</li>
              <li>Regular security audits and updates</li>
              <li>Limited access to personal data (need-to-know basis)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Your data is stored within the European Economic Area (EEA) and is subject to GDPR protections.
            </p>
          </section>

          {/* Section */}
          <section className="liquid-glass rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl sm:text-2xl text-primary font-[Hobo_BT]">6. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal data only for as long as necessary:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-4">
              <li><strong>Contact Form Submissions:</strong> 2 years from last contact</li>
              <li><strong>Newsletter Subscriptions:</strong> Until you unsubscribe</li>
              <li><strong>Chat Conversations:</strong> 1 year for quality assurance</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              After the retention period, data is securely deleted or anonymized.
            </p>
          </section>

          {/* Section */}
          <section className="liquid-glass rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl sm:text-2xl text-primary font-[Hobo_BT]">7. Your GDPR Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              As a data subject under GDPR, you have the following rights:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-4">
              <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
              <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
              <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
              <li><strong>Right to Data Portability:</strong> Receive your data in a structured format</li>
              <li><strong>Right to Object:</strong> Object to processing based on legitimate interests</li>
              <li><strong>Right to Withdraw Consent:</strong> Unsubscribe from newsletters at any time</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              To exercise any of these rights, please contact us at <a href="mailto:cemkoyluoglu@icloud.com" className="text-primary hover:underline">cemkoyluoglu@icloud.com</a>
            </p>
          </section>

          {/* Section */}
          <section className="liquid-glass rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl sm:text-2xl text-primary font-[Hobo_BT]">8. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may use the following third-party services that may collect data:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-4">
              <li><strong>Email Services:</strong> For newsletter delivery (GDPR-compliant providers)</li>
              <li><strong>Analytics:</strong> To understand website usage (anonymized data)</li>
              <li><strong>External Links:</strong> GitHub, LinkedIn, WhatsApp (subject to their privacy policies)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We ensure all third-party processors comply with GDPR requirements.
            </p>
          </section>

          {/* Section */}
          <section className="liquid-glass rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl sm:text-2xl text-primary font-[Hobo_BT]">9. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              This website uses minimal cookies for essential functionality:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-4">
              <li><strong>Essential Cookies:</strong> Required for website operation</li>
              <li><strong>Preference Cookies:</strong> Remember your settings</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              You can control cookies through your browser settings. Note that disabling cookies may affect website functionality.
            </p>
          </section>

          {/* Section */}
          <section className="liquid-glass rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl sm:text-2xl text-primary font-[Hobo_BT]">10. International Data Transfers</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data is primarily stored and processed within the European Economic Area (EEA). If data is transferred 
              outside the EEA, we ensure adequate safeguards are in place, such as Standard Contractual Clauses approved 
              by the European Commission.
            </p>
          </section>

          {/* Section */}
          <section className="liquid-glass rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl sm:text-2xl text-primary font-[Hobo_BT]">11. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              This website is not intended for children under 16 years of age. We do not knowingly collect personal 
              information from children. If you believe we have collected data from a child, please contact us immediately.
            </p>
          </section>

          {/* Section */}
          <section className="liquid-glass rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl sm:text-2xl text-primary font-[Hobo_BT]">12. Changes to Privacy Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated 
              "Last Updated" date. We encourage you to review this policy periodically.
            </p>
          </section>

          {/* Section */}
          <section className="liquid-glass rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl sm:text-2xl text-primary font-[Hobo_BT]">13. Contact & Data Protection Officer</h2>
            <p className="text-muted-foreground leading-relaxed">
              For any privacy-related questions, concerns, or to exercise your GDPR rights, please contact:
            </p>
            <div className="space-y-2 text-muted-foreground pl-4 mt-4">
              <p><strong>Cem Koyluoglu</strong></p>
              <p>Email: <a href="mailto:cemkoyluoglu@icloud.com" className="text-primary hover:underline">cemkoyluoglu@icloud.com</a></p>
              <p>Location: Dublin, Ireland</p>
            </div>
            <p className="text-muted-foreground leading-relaxed mt-4">
              You also have the right to lodge a complaint with the Irish Data Protection Commission (DPC) at{' '}
              <a href="https://www.dataprotection.ie" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                www.dataprotection.ie
              </a>
            </p>
          </section>
        </div>

        {/* Footer CTA */}
        <div className="mt-12 text-center">
          <Link to="/">
            <Button className="bg-primary hover:bg-primary/90 text-black">
              Return to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

export default PrivacyPage;
