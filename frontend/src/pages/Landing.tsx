import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import SEOHead from '../components/SEOHead';

// Alternating Timeline Component
const MomentumTimeline: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [animateNodes, setAnimateNodes] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const milestones = [
    { 
      number: '100%', 
      label: 'Message Success Rate', 
      microcopy: 'AI-crafted Instagram messages',
      delay: 0 
    },
    { 
      number: '137K+', 
      label: 'DMs Sent', 
      microcopy: 'Scaling outreach with automation',
      delay: 150 
    },
    { 
      number: '641+', 
      label: 'Businesses Helped', 
      microcopy: 'Using DMify daily',
      delay: 300 
    },
    { 
      number: '6.5×', 
      label: 'Response Rate Increase', 
      microcopy: 'Than static copy-paste DMs',
      delay: 450 
    },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setTimeout(() => setAnimateNodes(true), 600); // After line animation
        }
      },
      { threshold: 0.3 }
    );

    if (timelineRef.current) {
      observer.observe(timelineRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleNodeHover = (index: number) => {
    setHoveredNode(index);
  };

  const handleNodeLeave = () => {
    setHoveredNode(null);
  };

  return (
    <div ref={timelineRef} className="w-full">
      {/* Desktop Alternating Timeline */}
      <div className="hidden lg:block">
        <div className="relative max-w-5xl mx-auto py-16">
          {/* Central Timeline Track */}
          <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2">
            <div className={`timeline-track w-full transition-all duration-600 ${
              isVisible ? 'animate-draw-line' : 'w-0'
            }`}></div>
          </div>
          
          {/* Alternating Milestones */}
          <div className="relative flex justify-between items-center">
            {milestones.map((milestone, index) => {
              const isAbove = index % 2 === 0;
              return (
                <div key={index} className="flex flex-col items-center relative">
                  {/* Above-line milestone */}
                  {isAbove && (
                    <div className={`mb-8 text-center transition-all duration-400 ${
                      animateNodes ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`} style={{ transitionDelay: `${milestone.delay}ms` }}>
                      <div className="timeline-label mb-2">{milestone.label}</div>
                      <div className="timeline-microcopy">{milestone.microcopy}</div>
                      {/* Connector line */}
                      <div className="timeline-connector h-8 mx-auto mt-4"></div>
                    </div>
                  )}
                  
                  {/* Central Node */}
                  <button
                    className={`timeline-node transition-all duration-400 focus:outline-none focus:ring-2 focus:ring-neon-purple focus:ring-offset-2 ${
                      animateNodes ? 'animate-bounce-in' : 'opacity-0 scale-0'
                    } ${hoveredNode === index ? 'animate-pulse-glow' : ''}`}
                    style={{ 
                      animationDelay: `${milestone.delay}ms`,
                      transitionDelay: `${milestone.delay}ms`
                    }}
                    onMouseEnter={() => handleNodeHover(index)}
                    onMouseLeave={handleNodeLeave}
                    aria-label={`${milestone.number} ${milestone.label} milestone`}
                    tabIndex={0}
                  >
                    <div className={`timeline-node-number transition-all duration-300 ${
                      hoveredNode === index ? 'animate-count-up' : ''
                    }`}>
                      {milestone.number}
                    </div>
                  </button>
                  
                  {/* Below-line milestone */}
                  {!isAbove && (
                    <div className={`mt-8 text-center transition-all duration-400 ${
                      animateNodes ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`} style={{ transitionDelay: `${milestone.delay}ms` }}>
                      {/* Connector line */}
                      <div className="timeline-connector h-8 mx-auto mb-4"></div>
                      <div className="timeline-label mb-2">{milestone.label}</div>
                      <div className="timeline-microcopy">{milestone.microcopy}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Vertical Timeline */}
      <div className="lg:hidden">
        <div className="max-w-sm mx-auto py-8">
          {/* Vertical Track */}
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-1">
              <div className={`timeline-track h-full transition-all duration-600 ${
                isVisible ? 'h-full' : 'h-0'
              }`}></div>
            </div>
            
            {/* Mobile Milestones */}
            {milestones.map((milestone, index) => (
              <div key={index} className="flex items-start mb-12 last:mb-0 relative">
                {/* Node */}
                <button
                  className={`timeline-node mr-6 relative z-10 transition-all duration-400 focus:outline-none focus:ring-2 focus:ring-neon-purple focus:ring-offset-2 ${
                    animateNodes ? 'animate-bounce-in' : 'opacity-0 scale-0'
                  } ${hoveredNode === index ? 'animate-pulse-glow' : ''}`}
                  style={{ 
                    animationDelay: `${milestone.delay}ms`,
                    transitionDelay: `${milestone.delay}ms`
                  }}
                  onTouchStart={() => handleNodeHover(index)}
                  onTouchEnd={handleNodeLeave}
                  aria-label={`${milestone.number} ${milestone.label} milestone`}
                  tabIndex={0}
                >
                  <div className={`timeline-node-number transition-all duration-300 ${
                    hoveredNode === index ? 'animate-count-up' : ''
                  }`}>
                    {milestone.number}
                  </div>
                </button>
                
                {/* Content */}
                <div className={`flex-1 transition-all duration-400 ${
                  animateNodes ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                }`} style={{ transitionDelay: `${milestone.delay}ms` }}>
                  <div className="timeline-label mb-1">{milestone.label}</div>
                  <div className="timeline-microcopy">{milestone.microcopy}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Landing: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <>
      <SEOHead
        title="DMify - AI Instagram DM Generator"
        description="DMify is the best Instagram outreach tool for marketers. Generate AI-powered personalized Instagram DMs that get 3x higher responses. Try free today."
        keywords="AI Instagram DM generator, Instagram outreach tool, personalized DMs, Instagram DM automation, Instagram marketing, DM generator"
        canonical="https://dmify.app"
      />
      <div className="min-h-screen bg-off-white">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <img 
                  src="/dmifylogo.png" 
                  alt="DMify" 
                  className="h-10 sm:h-12 w-auto"
                />
              </Link>
            </div>
            <div className="flex items-center space-x-6">
              <Link
                to="/pricing"
                className="text-secondary-text hover:text-primary-text font-medium transition-colors"
              >
                Pricing
              </Link>
              <Link
                to="/login"
                className="text-secondary-text hover:text-primary-text font-medium transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="btn-primary"
              >
                Start Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section section-spacing relative min-h-screen flex items-center">
        {/* Floating Orbs */}
        <div className="floating-orb bg-electric-blue w-72 h-72 top-20 left-20 blur-3xl"></div>
        <div className="floating-orb bg-neon-purple w-96 h-96 top-40 right-32 blur-3xl"></div>
        <div className="floating-orb bg-electric-blue w-48 h-48 bottom-32 left-1/3 blur-2xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-primary-text mb-8 leading-tight">
                🚀 Generate AI-Powered 
                <span className="gradient-text block">
                  Instagram DMs That Actually Convert
                </span>
              </h1>
            </div>
            
            <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <h2 className="text-xl md:text-2xl text-secondary-text mb-12 max-w-4xl mx-auto leading-relaxed font-satoshi">
                DMify is the <strong className="text-primary-text">#1 Instagram outreach tool</strong> for marketers, entrepreneurs, and creators. 
                Use AI to craft <strong className="text-primary-text">personalized Instagram DMs at scale</strong> — no more ignored messages.
              </h2>
            </div>
            
            <div className={`transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="flex flex-col sm:flex-row gap-6 justify-center mb-20">
                <Link
                  to="/signup"
                  className="btn-primary"
                >
                  Start Free
                </Link>
                <button 
                  onClick={() => document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="btn-secondary"
                >
                  Read More ↓
                </button>
              </div>
            </div>

            {/* Demo Preview */}
            <div className={`transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="max-w-5xl mx-auto">
                <div className="glass-card overflow-hidden">
                  <div className="bg-white/10 px-8 py-6 border-b border-white/20">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-red-400 rounded-full"></div>
                      <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                      <div className="w-4 h-4 bg-green-400 rounded-full"></div>
                      <span className="ml-6 text-sm text-secondary-text font-mono">AI Instagram DM Generator</span>
                    </div>
                  </div>
                  <div className="p-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      <div>
                        <h3 className="text-xl font-bold text-primary-text mb-6 font-space">Input</h3>
                        <div className="bg-white/30 rounded-16 p-5 text-left backdrop-blur-glass border border-white/40 shadow-sm">
                          <div className="space-y-3">
                            <div className="bg-white/20 rounded-lg p-3 border border-white/30">
                              <p className="text-secondary-text text-sm"><span className="font-semibold text-primary-text">Target:</span> @elonmusk</p>
                            </div>
                            <div className="bg-white/20 rounded-lg p-3 border border-white/30">
                              <p className="text-secondary-text text-sm"><span className="font-semibold text-primary-text">Product:</span> AI SaaS Tool for Automation</p>
                            </div>
                            <div className="bg-white/20 rounded-lg p-3 border border-white/30">
                              <p className="text-secondary-text text-sm"><span className="font-semibold text-primary-text">Offer:</span> Free 30-day trial</p>
                            </div>
                            <div className="bg-white/20 rounded-lg p-3 border border-white/30">
                              <p className="text-secondary-text text-sm"><span className="font-semibold text-primary-text">Your Name:</span> John</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-primary-text mb-6 font-space">Generated Personalized DM</h3>
                        <div className="bg-gradient-to-br from-electric-blue/20 to-neon-purple/20 rounded-20 p-6 text-left backdrop-blur-glass border border-white/30">
                          <p className="text-primary-text leading-relaxed">
                            Hey Elon! 🚀 Love how you're revolutionizing multiple industries with Tesla, SpaceX, and Neuralink. 
                            Your vision for sustainable tech and space exploration is genuinely inspiring. I've been helping 
                            tech innovators like yourself streamline their AI workflows, and the productivity gains have been 
                            incredible. Would you be interested in a quick chat about how we're helping visionaries scale 
                            their operations? 
                            <br/><br/>
                            Best regards,<br/>
                            John
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why DMify Works Section */}
      <section id="features-section" className="section-spacing bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-primary-text mb-6 font-space">
              Why DMify is the Best Instagram Outreach Tool
            </h2>
            <p className="text-xl text-secondary-text max-w-3xl mx-auto leading-relaxed">
              Instagram DM automation that creates <strong className="text-primary-text">personalized Instagram messages</strong> for better connections and results
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="glass-card hover:scale-105 transition-all duration-300">
                <div className="w-20 h-20 bg-gradient-to-br from-electric-blue to-neon-purple rounded-full flex items-center justify-center mx-auto mb-8 group-hover:shadow-glow transition-all duration-300">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-primary-text mb-4 font-space">Smart AI Insights</h3>
                <p className="text-secondary-text leading-relaxed">
                  Analyze bios and posts to create <strong className="text-primary-text">personalized Instagram messages</strong> that connect
                </p>
              </div>
            </div>

            <div className="text-center group">
              <div className="glass-card hover:scale-105 transition-all duration-300">
                <div className="w-20 h-20 bg-gradient-to-br from-electric-blue to-neon-purple rounded-full flex items-center justify-center mx-auto mb-8 group-hover:shadow-glow transition-all duration-300">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-primary-text mb-4 font-space">Smart Personalized Messages</h3>
                <p className="text-secondary-text leading-relaxed">
                  Our messages build credibility by mentioning their interests and posts. <strong className="text-primary-text">AI Instagram outreach</strong> that feels natural and relevant
                </p>
              </div>
            </div>

            <div className="text-center group">
              <div className="glass-card hover:scale-105 transition-all duration-300">
                <div className="w-20 h-20 bg-gradient-to-br from-electric-blue to-neon-purple rounded-full flex items-center justify-center mx-auto mb-8 group-hover:shadow-glow transition-all duration-300">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-primary-text mb-4 font-space">Better Results</h3>
                <p className="text-secondary-text leading-relaxed">
                  Get significantly <strong className="text-primary-text">higher response rates</strong> with <strong className="text-primary-text">Instagram DM automation</strong> that works
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Momentum Timeline Section */}
      <section className="py-12 md:py-16 relative overflow-hidden">
        <div className="floating-orb bg-neon-purple w-64 h-64 top-10 right-20 blur-3xl"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <MomentumTimeline />
        </div>
      </section>



      {/* Final CTA Section */}
      <section className="bg-cta-gradient section-spacing relative overflow-hidden">
        <div className="floating-orb bg-white/20 w-96 h-96 top-20 left-20 blur-3xl"></div>
        <div className="floating-orb bg-white/10 w-64 h-64 bottom-20 right-32 blur-2xl"></div>
        
        <div className="max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 font-space">
            Ready to Scale Your Instagram Outreach with AI?
          </h2>
          <p className="text-xl text-white/90 mb-12 leading-relaxed max-w-3xl mx-auto">
            Join hundreds of entrepreneurs and agencies already using DMify to grow with <strong>personalized Instagram DMs</strong>.
          </p>
          <Link
            to="/signup"
            className="inline-block bg-white text-electric-blue hover:bg-white/90 px-12 py-6 rounded-full font-bold text-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl font-space"
          >
            Start Free →
          </Link>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-white/20 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0">
              <Link to="/" className="flex items-center mb-3">
                <img 
                  src="/dmifylogo.png" 
                  alt="DMify" 
                  className="h-10 sm:h-12 w-auto"
                />
              </Link>
              <p className="text-secondary-text text-lg">AI Instagram DM Generator</p>
            </div>
            <div className="flex space-x-8">
              <Link to="/pricing" className="text-secondary-text hover:text-primary-text font-medium transition-colors">Instagram DM Automation Pricing</Link>
              <Link to="/login" className="text-secondary-text hover:text-primary-text font-medium transition-colors">Sign In</Link>
              <Link to="/signup" className="text-secondary-text hover:text-primary-text font-medium transition-colors">Sign Up</Link>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/20 text-center text-secondary-text">
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-8 mb-4">
              <Link to="/terms" className="text-secondary-text hover:text-primary-text transition-colors">Terms of Service</Link>
              <Link to="/privacy" className="text-secondary-text hover:text-primary-text transition-colors">Privacy Policy</Link>
              <a href="mailto:support@dmify.app" className="text-secondary-text hover:text-primary-text transition-colors">Contact Support</a>
            </div>
            <p>&copy; 2024 DMify - The Best Instagram Outreach Tool for Personalized DMs. All rights reserved.</p>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
};

export default Landing;