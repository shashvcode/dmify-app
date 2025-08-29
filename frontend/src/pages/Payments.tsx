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
  subscription_remaining: number;
  has_subscription: boolean;
  total_remaining: number;
}

interface SubscriptionInfo {
  has_subscription: boolean;
  subscription_id?: string;
  plan_id?: string;
  status?: string;
  monthly_allowance?: number;
  used_this_month?: number;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
}

const Payments: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [credits, setCredits] = useState<CreditInfo | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState('');
  const [canceling, setCanceling] = useState(false);
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
      setTimeout(() => {
        fetchData(); // Refresh to show updated subscription
      }, 1000); // Small delay to allow webhook processing
    }
  }, [searchParams]);

  const fetchData = async () => {
    try {
      const [plansData, creditsData, subscriptionData] = await Promise.all([
        apiService.getPaymentPlans(),
        apiService.getUserCredits(),
        apiService.getUserSubscription()
      ]);
      
      setPlans(plansData);
      setCredits(creditsData);
      setSubscription(subscriptionData);
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

  const handleCancelSubscription = async () => {
    setCanceling(true);
    setError('');

    try {
      await apiService.cancelSubscription();
      await fetchData(); // Refresh subscription data
    } catch (error: any) {
      console.error('Failed to cancel subscription:', error);
      setError(error.response?.data?.detail || 'Failed to cancel subscription');
    } finally {
      setCanceling(false);
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

  const getPlanFeatures = (planId: string) => {
    const baseFeatures = [
      'Monthly message allowance',
      'Use across all projects',
      'AI analysis included'
    ];
    
    // Add Excel export for Growth and Pro plans (plan_2 and plan_3)
    if (planId === 'plan_2' || planId === 'plan_3') {
      baseFeatures.push('Excel export feature');
    }
    
    baseFeatures.push('Cancel anytime');
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
        <h1 className="credits-title">
          {subscription?.has_subscription ? 'Manage Your Plan' : 'Upgrade Your Account'}
        </h1>
        <p className="credits-subtitle">
          {subscription?.has_subscription 
            ? 'Manage your subscription and view message usage'
            : 'Upgrade to unlock unlimited message generation and premium features'
          }
        </p>
      </div>

      {/* Current Usage Summary */}
      {credits && (
        <div className="credits-summary-card">
          <div className="credits-summary-grid">
            {credits.has_subscription ? (
              <>
                <div className="credits-tile available">
                  <div className="credits-tile-label">Messages Remaining</div>
                  <div className="credits-tile-value">{credits.subscription_remaining}</div>
                  <div className="credits-tile-microcopy">This billing period</div>
                </div>
                <div className="credits-tile earned">
                  <div className="credits-tile-label">Monthly Allowance</div>
                  <div className="credits-tile-value">{subscription?.monthly_allowance || 0}</div>
                  <div className="credits-tile-microcopy">Resets monthly</div>
                </div>
                <div className="credits-tile used">
                  <div className="credits-tile-label">Used This Month</div>
                  <div className="credits-tile-value">{subscription?.used_this_month || 0}</div>
                  <div className="credits-tile-microcopy">1 DM = 1 message</div>
                </div>
              </>
            ) : (
              <>
                <div className="credits-tile available">
                  <div className="credits-tile-label">Free Messages</div>
                  <div className="credits-tile-value">{credits.credits}</div>
                  <div className="credits-tile-microcopy">Never expire</div>
                </div>
                <div className="credits-tile earned">
                  <div className="credits-tile-label">Messages Generated</div>
                  <div className="credits-tile-value">{credits.total_used}</div>
                  <div className="credits-tile-microcopy">All-time total</div>
                </div>
                <div className="credits-tile used">
                  <div className="credits-tile-label">Ready to Scale?</div>
                  <div className="credits-tile-value">⚡</div>
                  <div className="credits-tile-microcopy">Upgrade for unlimited</div>
                </div>
              </>
            )}
          </div>
          {credits.has_subscription && credits.credits > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💎 You also have <strong>{credits.credits} bonus messages</strong> that never expire!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Subscription Management / Plans */}
      {subscription?.has_subscription && (
        <div className="credits-plans-card">
          <div className="credits-plans-header">
            <h2 className="credits-plans-title">Current Subscription</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              subscription.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {subscription.status?.toUpperCase()}
            </span>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {plans.find(p => p.plan_id === subscription.plan_id)?.name || 'Current Plan'}
                </h3>
                <p className="text-gray-600">
                  {formatPrice(plans.find(p => p.plan_id === subscription.plan_id)?.amount || 0)} per month
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Next billing</p>
                <p className="font-medium">
                  {subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            
            {subscription.cancel_at_period_end ? (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
                <p className="font-medium">⚠️ Subscription will be canceled</p>
                <p className="text-sm">Your subscription will end on {new Date(subscription.current_period_end || '').toLocaleDateString()}. You'll still have access until then.</p>
              </div>
            ) : (
              <button
                onClick={handleCancelSubscription}
                disabled={canceling}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {canceling ? 'Canceling...' : 'Cancel Subscription'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Plans */}
      <div className="credits-plans-card">
        <div className="credits-plans-header">
          <h2 className="credits-plans-title">
            {subscription?.has_subscription ? 'Change Your Plan' : 'Upgrade Plans'}
          </h2>
          <a href="#" className="credits-plans-link">View billing history</a>
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
                    {formatPrice(plan.amount)}<span className="text-sm font-normal">/month</span>
                  </div>
                  <div className="credits-plan-price-per">
                    {getPricePerMessage(plan.amount, plan.messages)}
                  </div>
                  <div className="credits-plan-quantity">
                    {plan.messages} Messages/Month
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
                    disabled={purchasing === plan.plan_id || (subscription?.has_subscription && subscription.plan_id === plan.plan_id && !subscription.cancel_at_period_end)}
                    className={`credits-plan-button ${isPopular ? 'primary' : 'secondary'} ${
                      subscription?.has_subscription && subscription.plan_id === plan.plan_id && !subscription.cancel_at_period_end 
                        ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {purchasing === plan.plan_id ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Processing...
                      </div>
                    ) : subscription?.has_subscription && subscription.plan_id === plan.plan_id && !subscription.cancel_at_period_end ? (
                      'Current Plan'
                    ) : subscription?.has_subscription ? (
                      'Switch to This Plan'
                    ) : (
                      'Upgrade Now'
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
          <p>Cancel anytime. Upgrade or downgrade your plan as needed.</p>
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