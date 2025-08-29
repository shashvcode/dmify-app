import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';

const TermsOfService: React.FC = () => {
  return (
    <>
      <SEOHead
        title="Terms of Service - DMify"
        description="DMify Terms of Service and User Agreement. Learn about our terms and conditions for using our AI-powered Instagram DM automation service."
        keywords="DMify terms of service, user agreement, terms and conditions, Instagram DM automation terms"
        canonical="https://dmify-app-1.onrender.com/terms"
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
              <h1 className="text-4xl font-black text-primary-text mb-8 font-space">Terms of Service</h1>
              <p className="text-secondary-text mb-8">Last updated: {new Date().toLocaleDateString()}</p>

              <div className="prose prose-lg max-w-none">
                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-primary-text mb-4">1. Agreement to Terms</h2>
                  <p className="text-secondary-text mb-4">
                    By accessing and using DMify ("we," "our," or "us"), you accept and agree to be bound by the terms and provision of this agreement. 
                    If you do not agree to abide by the above, please do not use this service.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-primary-text mb-4">2. Description of Service</h2>
                  <p className="text-secondary-text mb-4">
                    DMify provides AI-powered Instagram direct message generation services. Our platform analyzes Instagram profiles to create 
                    personalized messages for outreach purposes. We use artificial intelligence to understand user interests and generate 
                    relevant, human-like messages.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-primary-text mb-4">3. User Accounts</h2>
                  <p className="text-secondary-text mb-4">
                    To access certain features of our service, you must register for an account. You are responsible for:
                  </p>
                  <ul className="list-disc pl-6 text-secondary-text mb-4">
                    <li>Maintaining the confidentiality of your account credentials</li>
                    <li>All activities that occur under your account</li>
                    <li>Providing accurate and complete information during registration</li>
                    <li>Promptly updating your account information if it changes</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-primary-text mb-4">4. Acceptable Use</h2>
                  <p className="text-secondary-text mb-4">You agree not to use DMify to:</p>
                  <ul className="list-disc pl-6 text-secondary-text mb-4">
                    <li>Send spam, unsolicited messages, or engage in harassment</li>
                    <li>Violate Instagram's Terms of Service or Community Guidelines</li>
                    <li>Send messages containing illegal, harmful, or offensive content</li>
                    <li>Impersonate others or misrepresent your identity</li>
                    <li>Attempt to gain unauthorized access to other users' accounts</li>
                    <li>Use our service for any illegal or unauthorized purpose</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-primary-text mb-4">5. Payment Terms</h2>
                  <p className="text-secondary-text mb-4">
                    Our services use a credit-based system with one-time purchases. Credits never expire and are non-refundable except as required by law. 
                    We reserve the right to change our pricing with 30 days' notice. You can purchase additional credits at any time through your account.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-primary-text mb-4">6. Intellectual Property</h2>
                  <p className="text-secondary-text mb-4">
                    DMify and its original content, features, and functionality are owned by us and are protected by international copyright, 
                    trademark, patent, trade secret, and other intellectual property laws. You retain ownership of any content you create using our service.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-primary-text mb-4">7. Privacy</h2>
                  <p className="text-secondary-text mb-4">
                    Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service, 
                    to understand our practices.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-primary-text mb-4">8. Disclaimers</h2>
                  <p className="text-secondary-text mb-4">
                    DMify is provided "as is" without warranties of any kind. We do not guarantee that our service will be uninterrupted, 
                    error-free, or completely secure. You use our service at your own risk.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-primary-text mb-4">9. Limitation of Liability</h2>
                  <p className="text-secondary-text mb-4">
                    In no event shall DMify be liable for any indirect, incidental, special, consequential, or punitive damages, 
                    including loss of profits, data, or goodwill, arising out of your use of our service.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-primary-text mb-4">10. Termination</h2>
                  <p className="text-secondary-text mb-4">
                    We may terminate or suspend your account immediately, without prior notice, for any reason, including if you breach these Terms. 
                    You may also terminate your account at any time through your account settings.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-primary-text mb-4">11. Changes to Terms</h2>
                  <p className="text-secondary-text mb-4">
                    We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through our service. 
                    Your continued use of DMify after such modifications constitutes acceptance of the updated terms.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-primary-text mb-4">12. Contact Information</h2>
                  <p className="text-secondary-text mb-4">
                    If you have any questions about these Terms of Service, please contact us at:
                  </p>
                  <p className="text-secondary-text">
                    Email: <a href="mailto:support@dmify.app" className="text-electric-blue hover:text-neon-purple">support@dmify.app</a>
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

export default TermsOfService;
