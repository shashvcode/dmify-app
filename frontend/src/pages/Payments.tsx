import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '../lib/api';

interface PaymentPlan {
  plan_id: string;
  name: string;
  description: string;
  messages: number;
  amount: number;
  price_id: string;
}

interface CreditInfo {
  credits: number;
  total_earned: number;
  total_used: number;
}



const Payments: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [credits, setCredits] = useState<CreditInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState('');
  const [error, setError] = useState('');
  const [preSelectedPlan, setPreSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    document.title = "DMify - Upgrade";
    fetchData();
    
    // Check if a plan is pre-selected from URL
    const planId = searchParams.get('plan');
    if (planId) {
      setPreSelectedPlan(planId);
    }
    
    // Check for payment success and refresh data
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      // Refresh data after successful payment
      setTimeout(() => {
        fetchData();
      }, 1000);
    }
  }, [searchParams]);

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

  const getPricePerMessage = (amount: number, messages: number) => {
    const pricePerMessage = amount / messages / 100;
    return `$${pricePerMessage.toFixed(3)} / msg`;
  };

  const getMostPopularPlan = () => {
    // Identify the middle plan or plan_2 as most popular
    if (plans.length === 3) {
      return plans[1]; // Middle plan
    }
    return plans.find(plan => plan.plan_id === 'plan_2') || plans[1];
  };

  const getPlanFeatures = (_planId: string) => {
    const baseFeatures = [
      'Credits never expire',
      'Use across all projects',
      'AI analysis included',
      'Excel export feature',
      'No monthly fees'
    ];
    
    return baseFeatures;
  };

  if (loading) {
    return (
      <div className="credits-container">
        <PaymentsSkeleton />
      </div>
    );
  }

  const mostPopularPlan = getMostPopularPlan();

  return (
    <div className="credits-container">
      {/* Error Banner */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-20">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="credits-header">
        <h1 className="credits-title">Buy Message Credits</h1>
        <p className="credits-subtitle">
          Purchase message credits that never expire. Use them whenever you need to generate personalized DMs.
        </p>
      </div>

      {/* Current Usage Summary */}
      {credits && (
        <div className="credits-summary-card">
          <div className="credits-summary-grid">
            <div className="credits-tile available">
              <div className="credits-tile-label">Available Credits</div>
              <div className="credits-tile-value">{credits.credits}</div>
              <div className="credits-tile-microcopy">Never expire</div>
            </div>
            <div className="credits-tile earned">
              <div className="credits-tile-label">Total Purchased</div>
              <div className="credits-tile-value">{credits.total_earned}</div>
              <div className="credits-tile-microcopy">All-time total</div>
            </div>
            <div className="credits-tile used">
              <div className="credits-tile-label">Messages Generated</div>
              <div className="credits-tile-value">{credits.total_used}</div>
              <div className="credits-tile-microcopy">Successfully created</div>
            </div>
          </div>
        </div>
      )}



      {/* Plans */}
      <div className="credits-plans-card">
        <div className="credits-plans-header">
          <h2 className="credits-plans-title">Credit Packs</h2>
          <a href="#" className="credits-plans-link">View purchase history</a>
        </div>
        
        <div className="credits-plans-grid">
          {plans.map((plan) => {
            const isPopular = plan.plan_id === mostPopularPlan?.plan_id;
            const isSelected = plan.plan_id === preSelectedPlan;
            
            return (
              <div
                key={plan.plan_id}
                className={`credits-plan-card ${isPopular ? 'popular' : ''}`}
              >
                {(isPopular && !isSelected) && (
                  <div className="credits-plan-badge" aria-label="Most Popular">
                    Most Popular
                  </div>
                )}
                {isSelected && (
                  <div className="credits-plan-badge bg-green-500">
                    Selected Plan
                  </div>
                )}
                
                <div className="text-center">
                  <h3 className="credits-plan-title">{plan.name}</h3>
                  <div className="credits-plan-price">
                    {formatPrice(plan.amount)}<span className="text-sm font-normal"> one-time</span>
                  </div>
                  <div className="credits-plan-price-per">
                    {getPricePerMessage(plan.amount, plan.messages)}
                  </div>
                  <div className="credits-plan-quantity">
                    {plan.messages} Message Credits
                  </div>
                  
                  <div className="credits-plan-features">
                    {getPlanFeatures(plan.plan_id).map((feature, index) => (
                      <div key={index} className="credits-plan-feature">
                        <svg className="credits-plan-feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </div>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => handlePurchase(plan.plan_id)}
                    disabled={purchasing === plan.plan_id}
                    className={`credits-plan-button ${isPopular ? 'primary' : 'secondary'}`}
                  >
                    {purchasing === plan.plan_id ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      'Buy Credits'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="credits-promo-note">
          💰 Have a promo code? Enter it at checkout!
        </div>
        
        <div className="credits-trust-footer">
          <p>Secure payments via Stripe.</p>
          <p>Credits never expire. Purchase more anytime you need them.</p>
        </div>
      </div>
    </div>
  );
};

// Loading Skeleton Component
const PaymentsSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="credits-header">
      <div className="skeleton h-10 w-64 mb-2"></div>
      <div className="skeleton h-5 w-96"></div>
    </div>
    
    <div className="credits-summary-card">
      <div className="credits-summary-grid">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="credits-tile available">
            <div className="skeleton h-4 w-20 mb-2 mx-auto"></div>
            <div className="skeleton h-8 w-16 mb-1 mx-auto"></div>
            <div className="skeleton h-3 w-24 mx-auto"></div>
          </div>
        ))}
      </div>
    </div>
    
    <div className="credits-plans-card">
      <div className="credits-plans-header">
        <div className="skeleton h-6 w-40"></div>
        <div className="skeleton h-4 w-32"></div>
      </div>
      
      <div className="credits-plans-grid">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="credits-plan-card">
            <div className="text-center space-y-4">
              <div className="skeleton h-6 w-20 mx-auto"></div>
              <div className="skeleton h-12 w-24 mx-auto"></div>
              <div className="skeleton h-4 w-16 mx-auto"></div>
              <div className="skeleton h-6 w-28 mx-auto"></div>
              <div className="space-y-2">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="skeleton h-4 w-full"></div>
                ))}
              </div>
              <div className="skeleton h-12 w-full rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Payments;