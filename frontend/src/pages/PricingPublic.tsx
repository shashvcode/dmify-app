import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../lib/api';
import SEOHead from '../components/SEOHead';

interface PaymentPlan {
  plan_id: string;
  name: string;
  description: string;
  messages: number;
  amount: number;
  price_id: string;
}

const PricingPublic: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState('');
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      // Use a direct API call to get plans without auth for public access
      const response = await fetch('https://dmify-app.onrender.com/payments/plans');
      if (response.ok) {
        const plansData = await response.json();
        setPlans(plansData);
      } else {
        setError('Failed to load pricing plans');
      }
    } catch (error) {
      console.error('Failed to fetch payment plans:', error);
      setError('Failed to load pricing plans');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (planId: string) => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      navigate(`/login?returnTo=/pricing&plan=${planId}`);
      return;
    }

    setPurchasing(planId);
    setError('');

    try {
      const { checkout_url } = await apiService.createCheckoutSession(planId);
      window.location.href = checkout_url;
    } catch (error: any) {
      console.error('Failed to create checkout session:', error);
      setError(error.response?.data?.detail || 'Failed to start checkout process');
      setPurchasing('');
    }
  };

  const formatPrice = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const getPricePerMessage = (amount: number, messages: number) => {
    const pricePerMessage = amount / messages / 100;
    return `$${pricePerMessage.toFixed(3)} per message`;
  };

  // Map plan IDs to our custom names and features
  const getEnhancedPlanData = (plan: PaymentPlan) => {
    const planMapping: Record<string, { 
      name: string; 
      emoji: string; 
      features: string[]; 
      isPopular?: boolean;
      description: string;
    }> = {
      'plan_1': {
        name: 'Starter Plan',
        emoji: '🚀',
        description: 'Perfect for testing the waters',
        features: [
          '100 Monthly Messages',
          'AI-powered profile analysis',
          'Cancel anytime',
          'Resets every month'
        ]
      },
      'plan_2': {
        name: 'Growth Plan',
        emoji: '📈',
        description: 'Best value for growing brands',
        isPopular: true,
        features: [
          '500 Monthly Messages',
          'AI-powered profile analysis',
          'Cancel anytime',
          'Best value for growing brands'
        ]
      },
      'plan_3': {
        name: 'Pro Plan',
        emoji: '⚡',
        description: 'Scale your outreach empire',
        features: [
          '1500 Monthly Messages',
          'AI-powered profile analysis',
          'Priority support',
          'Cancel anytime'
        ]
      }
    };

    return planMapping[plan.plan_id] || {
      name: plan.name,
      emoji: '💎',
      description: plan.description,
      features: [
        `${plan.messages} Monthly Messages`,
        'AI-powered profile analysis',
        'Cancel anytime'
      ]
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-blue"></div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="DMify Pricing | AI Instagram DM Generator Plans"
        description="Choose the perfect plan for your Instagram outreach needs. Generate AI-powered personalized DMs with transparent pricing. 10 free messages included."
        keywords="DMify pricing, Instagram DM automation pricing, AI Instagram DM generator cost, Instagram outreach tool pricing"
        canonical="https://dmify.app/pricing"
      />
      
      <div className="min-h-screen bg-hero-gradient relative overflow-hidden">
        {/* Floating Orbs */}
        <div className="floating-orb bg-electric-blue w-64 h-64 top-20 left-20 blur-3xl"></div>
        <div className="floating-orb bg-neon-purple w-96 h-96 bottom-20 right-32 blur-3xl"></div>
        
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center">
                <span className="text-2xl font-black text-primary-text font-space">DMify</span>
              </Link>
              
              <div className="flex items-center space-x-4">
                {isAuthenticated ? (
                  <Link to="/app/dashboard" className="btn-primary">
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="text-secondary-text hover:text-primary-text font-medium transition-colors">
                      Sign In
                    </Link>
                    <Link to="/signup" className="btn-primary">
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Hero Section */}
          <div className={`text-center mb-16 transition-all duration-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-primary-text mb-6 font-space leading-tight">
              💡 Simple Monthly Plans —{' '}
              <span className="gradient-text">Scale Your Instagram Outreach</span>
            </h1>
            <h2 className="text-xl md:text-2xl text-secondary-text mb-8 max-w-4xl mx-auto leading-relaxed">
              Generate AI-powered, personalized Instagram DMs that convert. Monthly message allowances that reset every billing period.
            </h2>
            <div className="glass-card max-w-md mx-auto">
              <p className="text-electric-blue font-bold text-lg">🎉 Get 10 free messages when you sign up today!</p>
            </div>
          </div>

          {error && (
            <div className="mb-8 bg-red-50/80 backdrop-blur-glass border border-red-200 text-red-600 px-4 py-3 rounded-20 max-w-md mx-auto">
              {error}
            </div>
          )}

          {/* Pricing Cards */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20 transition-all duration-800 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {plans.map((plan) => {
              const enhancedPlan = getEnhancedPlanData(plan);
              const isPopular = enhancedPlan.isPopular;
              
              return (
                <div
                  key={plan.plan_id}
                  className={`glass-card relative transition-all duration-300 hover:scale-102 flex flex-col h-full ${
                    isPopular 
                      ? 'ring-2 ring-electric-blue shadow-glow animate-pulse' 
                      : 'hover:shadow-glass'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <span className="bg-cta-gradient text-white px-6 py-2 rounded-full text-sm font-bold shadow-glow">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center flex-1 flex flex-col pt-4">
                    <div className="text-4xl mb-4">{enhancedPlan.emoji}</div>
                    <h3 className="text-2xl font-bold text-primary-text mb-2 font-space">{enhancedPlan.name}</h3>
                    <div className="text-4xl font-black text-primary-text mb-2">
                      {formatPrice(plan.amount)}<span className="text-lg font-normal">/month</span>
                    </div>
                    <div className="text-sm text-secondary-text mb-6">
                      {getPricePerMessage(plan.amount, plan.messages)}
                    </div>
                    
                    <ul className="text-left space-y-3 mb-8 flex-1">
                      {enhancedPlan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <div className="w-5 h-5 bg-gradient-to-br from-electric-blue to-neon-purple rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-secondary-text">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <button
                      onClick={() => handlePurchase(plan.plan_id)}
                      disabled={purchasing === plan.plan_id}
                      className={`w-full py-4 px-6 rounded-full font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 ${
                        isPopular
                          ? 'bg-cta-gradient text-white hover:shadow-glow'
                          : 'border-2 border-electric-blue text-electric-blue bg-transparent hover:bg-electric-blue hover:text-white'
                      }`}
                    >
                      {purchasing === plan.plan_id ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        'Get Started'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Trust & Security Section */}
          <div className={`mb-16 transition-all duration-800 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-primary-text mb-4 font-space">
                Trusted by Marketers, Creators, and Agencies
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center group">
                <div className="glass-card hover:scale-105 transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-electric-blue to-neon-purple rounded-full flex items-center justify-center mx-auto mb-6 group-hover:shadow-glow transition-all duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-primary-text mb-3 font-space">🔒 Secure Payments</h3>
                  <p className="text-secondary-text leading-relaxed">
                    Powered by Stripe with enterprise-grade encryption. Your payment data is always protected.
                  </p>
                </div>
              </div>

              <div className="text-center group">
                <div className="glass-card hover:scale-105 transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-electric-blue to-neon-purple rounded-full flex items-center justify-center mx-auto mb-6 group-hover:shadow-glow transition-all duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-primary-text mb-3 font-space">📈 Proven Results</h3>
                  <p className="text-secondary-text leading-relaxed">
                    Users see up to 3x higher replies vs copy-paste DMs. Real results from real campaigns.
                  </p>
                </div>
              </div>

              <div className="text-center group">
                <div className="glass-card hover:scale-105 transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-electric-blue to-neon-purple rounded-full flex items-center justify-center mx-auto mb-6 group-hover:shadow-glow transition-all duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-primary-text mb-3 font-space">🤝 Cancel Anytime</h3>
                  <p className="text-secondary-text leading-relaxed">
                    No contracts or commitments. Cancel your subscription anytime with immediate effect.
                  </p>
                </div>
              </div>
            </div>
          </div>



          {/* Footer Note */}
          <div className="mt-12 text-center text-sm text-secondary-text">
            <p>Secure payment processing powered by Stripe</p>
            <p className="mt-2">
              Questions? <a href="mailto:support@dmify.app" className="text-electric-blue hover:text-neon-purple transition-colors">Contact our support team</a>
            </p>
          </div>
        </main>
      </div>
    </>
  );
};

export default PricingPublic;