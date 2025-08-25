import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../lib/api';

interface PaymentPlan {
  plan_id: string;
  name: string;
  description: string;
  credits: number;
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

  useEffect(() => {
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

  const getPricePerCredit = (amount: number, credits: number) => {
    const pricePerCredit = amount / credits / 100;
    return `$${pricePerCredit.toFixed(3)} per message`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-black text-gray-900 font-inter">DMify</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <Link to="/app/dashboard" className="btn-primary">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="text-gray-600 hover:text-gray-900">
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
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-gray-900 font-inter mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Pay only for what you use. Generate personalized Instagram DMs with our AI-powered platform.
          </p>
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-blue-800 font-medium">🎉 New users get 10 free messages to start!</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg max-w-md mx-auto">
            {error}
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.plan_id}
              className={`bg-white rounded-lg shadow-lg p-8 relative ${
                plan.plan_id === 'plan_2' 
                  ? 'border-2 border-blue-500 transform scale-105' 
                  : 'border border-gray-200'
              }`}
            >
              {plan.plan_id === 'plan_2' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="text-4xl font-black text-gray-900 mb-1">
                  {formatPrice(plan.amount)}
                </div>
                <div className="text-sm text-gray-500 mb-4">
                  {getPricePerCredit(plan.amount, plan.credits)}
                </div>
                <div className="text-lg text-blue-600 font-semibold mb-6">
                  {plan.credits} Messages
                </div>
                
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Personalized Instagram DMs
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    AI-powered profile analysis
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    High conversion rates
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Credits never expire
                  </li>
                </ul>
                
                <button
                  onClick={() => handlePurchase(plan.plan_id)}
                  disabled={purchasing === plan.plan_id}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                    plan.plan_id === 'plan_2'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {purchasing === plan.plan_id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
                      Processing...
                    </div>
                  ) : isAuthenticated ? (
                    'Purchase Credits'
                  ) : (
                    'Sign Up & Purchase'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Why Choose DMify?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">🎯 Higher Response Rates</h4>
                <p className="text-gray-600 text-sm">Our AI analyzes profiles to create personalized messages that actually get responses.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">⚡ Save Time</h4>
                <p className="text-gray-600 text-sm">Generate perfect DMs in seconds instead of spending hours crafting messages.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">🔒 Secure & Safe</h4>
                <p className="text-gray-600 text-sm">Your data is protected with enterprise-grade security. We never store your Instagram credentials.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">📈 Proven Results</h4>
                <p className="text-gray-600 text-sm">Join thousands of users who have increased their conversion rates by 300%+.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Secure payment processing powered by Stripe</p>
          <p className="mt-1">
            Questions? <Link to="mailto:support@dmify.com" className="text-blue-600 hover:text-blue-500">Contact our support team</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default PricingPublic;
