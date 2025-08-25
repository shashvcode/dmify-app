import { useState, useEffect } from 'react';
import { apiService } from '../lib/api';

interface PaymentPlan {
  plan_id: string;
  name: string;
  description: string;
  credits: number;
  amount: number;
  price_id: string;
}

interface CreditInfo {
  credits: number;
  total_earned: number;
  total_used: number;
}

const Payments: React.FC = () => {
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [credits, setCredits] = useState<CreditInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plansData, creditsData] = await Promise.all([
        apiService.getPaymentPlans(),
        apiService.getUserCredits()
      ]);
      
      setPlans(plansData);
      setCredits(creditsData);
    } catch (error: any) {
      console.error('Failed to fetch payment data:', error);
      setError('Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (planId: string) => {
    setPurchasing(planId);
    setError('');

    try {
      const { checkout_url } = await apiService.createCheckoutSession(planId);
      
      // Redirect to Stripe checkout
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 font-inter">Message Credits</h1>
        <p className="mt-2 text-gray-600">
          Purchase credits to generate personalized Instagram DMs
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Current Credits */}
      {credits && (
        <div className="mb-8 card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Credits</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{credits.credits}</div>
              <div className="text-sm text-gray-600">Available Credits</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{credits.total_earned}</div>
              <div className="text-sm text-gray-600">Total Earned</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{credits.total_used}</div>
              <div className="text-sm text-gray-600">Total Used</div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Plans */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Purchase Credits</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.plan_id}
              className={`border rounded-lg p-6 relative ${
                plan.plan_id === 'plan_2' 
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : 'border-gray-200'
              }`}
            >
              {plan.plan_id === 'plan_2' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{plan.name}</h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {formatPrice(plan.amount)}
                </div>
                <div className="text-sm text-gray-500 mb-4">
                  {getPricePerCredit(plan.amount, plan.credits)}
                </div>
                <div className="text-lg text-blue-600 font-medium mb-4">
                  {plan.credits} Messages
                </div>
                <p className="text-sm text-gray-600 mb-6">{plan.description}</p>
                
                <button
                  onClick={() => handlePurchase(plan.plan_id)}
                  disabled={purchasing === plan.plan_id}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    plan.plan_id === 'plan_2'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {purchasing === plan.plan_id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    'Purchase Credits'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Secure payment processing powered by Stripe</p>
          <p className="mt-1">Credits never expire and can be used across all your projects</p>
        </div>
      </div>
    </div>
  );
};

export default Payments;
