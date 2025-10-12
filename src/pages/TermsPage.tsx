import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Scale } from 'lucide-react';
import { Button } from '../components/ui/button';
import { usePageContext } from '../lib/context/PageContext';

/**
 * Terms & Conditions Page
 * GDPR-compliant terms for Ireland-based business
 */
export function TermsPage() {
  const { setPageInfo } = usePageContext();

  useEffect(() => {
    setPageInfo({
      path: '/terms',
      title: 'Terms & Conditions',
      summary:
        'Detailed terms and conditions for Cem Koyluoglu’s portfolio site, covering services, newsletter, communications, IP, and legal compliance.',
      highlights: [
        'Overview of professional services and newsletter expectations',
        'Guidelines for contact forms and communication response times',
        'Intellectual property, liability limitations, external links, and Irish jurisdiction',
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
                <Scale className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl sm:text-4xl">Terms & Conditions</h1>
            </div>
            <p className="text-muted-foreground">Last updated: October 12, 2025</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Section */}
          <section className="liquid-glass rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl sm:text-2xl text-primary">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to the personal portfolio and professional website of Cem Koyluoglu ("we," "us," or "our"). 
              By accessing or using our website located at this domain, you agree to be bound by these Terms and Conditions. 
              This website is operated from Dublin, Ireland, and is subject to Irish and European Union law, including the 
              General Data Protection Regulation (GDPR).
            </p>
          </section>

          {/* Section */}
          <section className="liquid-glass rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl sm:text-2xl text-primary">2. Services Provided</h2>
            <p className="text-muted-foreground leading-relaxed">
              This website provides information about professional services including AI Engineering, System Operations, 
              and software development consultancy. We may also offer:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-4">
              <li>Tech news and insights via newsletter subscription</li>
              <li>Contact forms for professional inquiries</li>
              <li>Portfolio showcase of completed projects</li>
              <li>Professional background and experience information</li>
            </ul>
          </section>

          {/* Section */}
          <section className="liquid-glass rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl sm:text-2xl text-primary">3. Newsletter Subscription</h2>
            <p className="text-muted-foreground leading-relaxed">
              By subscribing to our newsletter, you consent to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-4">
              <li>Receiving periodic emails with tech news, insights, and updates</li>
              <li>Storage of your email address in our database for communication purposes</li>
              <li>Occasional messages about professional opportunities or collaborations</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              You may unsubscribe at any time by clicking the unsubscribe link in any email or by contacting us directly. 
              Your data will be handled in accordance with our <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          {/* Section */}
          <section className="liquid-glass rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl sm:text-2xl text-primary">4. Contact Forms and Communications</h2>
            <p className="text-muted-foreground leading-relaxed">
              When you use our contact forms or chat features, you agree that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-4">
              <li>The information you provide is accurate and truthful</li>
              <li>We may store your contact details and message content for response and record-keeping purposes</li>
              <li>We will respond to inquiries on a best-effort basis, typically within 1-2 business days</li>
              <li>Your data will be processed in compliance with GDPR requirements</li>
            </ul>
          </section>

          {/* Section */}
          <section className="liquid-glass rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl sm:text-2xl text-primary">5. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              All content on this website, including but not limited to text, graphics, logos, code, and design elements, 
              is the property of Cem Koyluoglu and protected by international copyright laws. You may not reproduce, 
              distribute, or create derivative works without explicit written permission.
            </p>
          </section>

          {/* Section */}
          <section className="liquid-glass rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl sm:text-2xl text-primary">6. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              This website and its content are provided "as is" without warranties of any kind. We are not liable for 
              any damages arising from the use or inability to use this website, including but not limited to direct, 
              indirect, incidental, or consequential damages.
            </p>
          </section>

          {/* Section */}
          <section className="liquid-glass rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl sm:text-2xl text-primary">7. External Links</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our website may contain links to third-party websites or services (e.g., GitHub, LinkedIn, WhatsApp). 
              We are not responsible for the content, privacy practices, or terms of service of these external sites. 
              Your use of third-party services is at your own risk.
            </p>
          </section>

          {/* Section */}
          <section className="liquid-glass rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl sm:text-2xl text-primary">8. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms and Conditions are governed by and construed in accordance with the laws of Ireland. 
              Any disputes shall be subject to the exclusive jurisdiction of the courts of Ireland.
            </p>
          </section>

          {/* Section */}
          <section className="liquid-glass rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl sm:text-2xl text-primary">9. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these Terms and Conditions at any time. Changes will be effective immediately 
              upon posting to this page. Your continued use of the website after changes constitutes acceptance of the 
              modified terms.
            </p>
          </section>

          {/* Section */}
          <section className="liquid-glass rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl sm:text-2xl text-primary">10. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms and Conditions, please contact us:
            </p>
            <div className="space-y-2 text-muted-foreground pl-4">
              <p>Email: <a href="mailto:cemkoyluoglu@icloud.com" className="text-primary hover:underline">cemkoyluoglu@icloud.com</a></p>
              <p>Location: Dublin, Ireland</p>
            </div>
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
