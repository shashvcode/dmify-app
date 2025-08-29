import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';

const PrivacyPolicy: React.FC = () => {
  return (
    <>
      <SEOHead
        title="Privacy Policy - DMify"
        description="DMify Privacy Policy. Learn how we collect, use, and protect your personal information when using our AI-powered Instagram DM automation service."
        keywords="DMify privacy policy, data protection, privacy, Instagram DM automation privacy"
        canonical="https://dmify.app/privacy"
      />
      
      <div className="min-h-screen bg-hero-gradient">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center">
                <img 
                  src="/dmifylogo.png" 
                  alt="DMify" 
                  className="h-9 sm:h-10 w-auto"
                />
              </Link>
              
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-secondary-text hover:text-primary-text font-medium transition-colors">
                  Sign In
                </Link>
                <Link to="/signup" className="btn-primary">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="glass-card">
            <div className="p-8 md:p-12">
              <h1 className="text-4xl font-black text-primary-text mb-8 font-space">Privacy Policy</h1>
              <p className="text-secondary-text mb-8">Last updated: {new Date().toLocaleDateString()}</p>

              <div className="prose prose-lg max-w-none">
                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-primary-text mb-4">1. Introduction</h2>
                  <p className="text-secondary-text mb-4">
                    DMify ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, 
                    use, disclose, and safeguard your information when you use our AI-powered Instagram DM generation service.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-primary-text mb-4">2. Information We Collect</h2>
                  
                  <h3 className="text-xl font-semibold text-primary-text mb-3">Personal Information</h3>
                  <p className="text-secondary-text mb-4">When you create an account, we collect:</p>
                  <ul className="list-disc pl-6 text-secondary-text mb-4">
                    <li>Name and email address</li>
                    <li>Account credentials (encrypted)</li>
                    <li>Payment information (processed securely through Stripe)</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-primary-text mb-3">Usage Information</h3>
                  <p className="text-secondary-text mb-4">We automatically collect:</p>
                  <ul className="list-disc pl-6 text-secondary-text mb-4">
                    <li>Project information and campaign details you provide</li>
                    <li>Generated messages and outreach data</li>
                    <li>Usage patterns and feature interactions</li>
                    <li>Device information and IP address</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-primary-text mb-3">Instagram Data</h3>
                  <p className="text-secondary-text mb-4">
                    To provide our service, we analyze publicly available Instagram profile information including usernames, 
                    bios, and recent posts. We do not store Instagram passwords or access private accounts.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-primary-text mb-4">3. How We Use Your Information</h2>
                  <p className="text-secondary-text mb-4">We use your information to:</p>
                  <ul className="list-disc pl-6 text-secondary-text mb-4">
                    <li>Provide and improve our AI-powered message generation service</li>
                    <li>Process payments and manage subscriptions</li>
                    <li>Send important account and service updates</li>
                    <li>Provide customer support and respond to inquiries</li>
                    <li>Analyze usage patterns to improve our service</li>
                    <li>Ensure security and prevent fraud</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-primary-text mb-4">4. Information Sharing</h2>
                  <p className="text-secondary-text mb-4">We do not sell your personal information. We may share information with:</p>
                  
                  <h3 className="text-xl font-semibold text-primary-text mb-3">Service Providers</h3>
                  <ul className="list-disc pl-6 text-secondary-text mb-4">
                    <li>Stripe for payment processing</li>
                    <li>Mailgun for email delivery</li>
                    <li>OpenAI for AI message generation</li>
                    <li>Apify for Instagram profile analysis</li>
                    <li>MongoDB Atlas for secure data storage</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-primary-text mb-3">Legal Requirements</h3>
                  <p className="text-secondary-text mb-4">
                    We may disclose information if required by law, court order, or to protect our rights and safety.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-primary-text mb-4">5. Data Security</h2>
                  <p className="text-secondary-text mb-4">We protect your information using:</p>
                  <ul className="list-disc pl-6 text-secondary-text mb-4">
                    <li>Encryption in transit and at rest</li>
                    <li>Secure authentication and access controls</li>
                    <li>Regular security audits and monitoring</li>
                    <li>Industry-standard security practices</li>
                  </ul>
                  <p className="text-secondary-text mb-4">
                    However, no internet transmission is 100% secure. We cannot guarantee absolute security of your information.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-primary-text mb-4">6. Data Retention</h2>
                  <p className="text-secondary-text mb-4">
                    We retain your information for as long as your account is active or as needed to provide services. 
                    When you delete your account, we permanently remove your personal data within 30 days, except where 
                    required by law to retain certain information.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-primary-text mb-4">7. Your Rights</h2>
                  <p className="text-secondary-text mb-4">You have the right to:</p>
                  <ul className="list-disc pl-6 text-secondary-text mb-4">
                    <li>Access and update your personal information</li>
                    <li>Delete your account and personal data</li>
                    <li>Opt out of marketing communications</li>
                    <li>Request a copy of your data</li>
                    <li>Restrict processing of your information</li>
                  </ul>
                  <p className="text-secondary-text mb-4">
                    To exercise these rights, contact us at support@dmify.app or use your account settings.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-primary-text mb-4">8. Cookies and Tracking</h2>
                  <p className="text-secondary-text mb-4">
                    We use essential cookies to provide our service and improve user experience. We do not use 
                    third-party tracking cookies for advertising purposes. You can control cookie settings in your browser.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-primary-text mb-4">9. International Data Transfers</h2>
                  <p className="text-secondary-text mb-4">
                    Your information may be processed in countries other than your own. We ensure appropriate safeguards 
                    are in place to protect your data in accordance with this privacy policy.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-primary-text mb-4">10. Children's Privacy</h2>
                  <p className="text-secondary-text mb-4">
                    Our service is not intended for users under 18. We do not knowingly collect personal information 
                    from children under 18. If you believe we have collected such information, please contact us immediately.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-primary-text mb-4">11. Changes to This Policy</h2>
                  <p className="text-secondary-text mb-4">
                    We may update this Privacy Policy periodically. We will notify you of material changes via email 
                    or through our service. Your continued use after such changes constitutes acceptance of the updated policy.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-primary-text mb-4">12. Contact Us</h2>
                  <p className="text-secondary-text mb-4">
                    If you have questions about this Privacy Policy or our data practices, contact us:
                  </p>
                  <p className="text-secondary-text mb-2">
                    Email: <a href="mailto:support@dmify.app" className="text-electric-blue hover:text-neon-purple">support@dmify.app</a>
                  </p>
                  <p className="text-secondary-text">
                    Subject line: "Privacy Policy Inquiry"
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;
