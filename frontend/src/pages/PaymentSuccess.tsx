import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SEOHead from '../components/SEOHead';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    // Wait for auth to load, then redirect
    if (!authLoading) {
      const sessionId = searchParams.get('session_id');
      
      if (isAuthenticated) {
        // User is authenticated, redirect to dashboard with success params
        const redirectUrl = sessionId 
          ? `/app/dashboard?payment=success&session_id=${sessionId}`
          : '/app/dashboard?payment=success';
        
        // Delay redirect slightly to show success message
        setTimeout(() => {
          navigate(redirectUrl, { replace: true });
        }, 2000);
      } else {
        // User not authenticated, redirect to login with payment params preserved
        const loginParams = new URLSearchParams();
        loginParams.set('payment', 'success');
        if (sessionId) loginParams.set('session_id', sessionId);
        
        // Add current path as return URL
        loginParams.set('returnTo', '/payment-success');
        
        setTimeout(() => {
          navigate(`/login?${loginParams.toString()}`, { replace: true });
        }, 2000);
      }
    }
  }, [authLoading, isAuthenticated, searchParams, navigate]);

  return (
    <>
      <SEOHead
        title="Payment Successful - DMify"
        description="Your payment has been processed successfully"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-electric-blue/5 to-neon-purple/5 flex items-center justify-center px-4">
        <div className={`max-w-md w-full transition-all duration-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="bg-white/80 backdrop-blur-md rounded-30 shadow-xl p-8 text-center border border-white/20">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Success Message */}
            <h1 className="text-3xl font-black text-primary-text font-space mb-4">
              Payment Successful! 🎉
            </h1>
            
            <p className="text-secondary-text text-lg leading-relaxed mb-8">
              Thank you for your purchase! Your message credits have been added to your account.
            </p>

            {/* Loading State */}
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-electric-blue"></div>
              <span className="text-secondary-text">
                {isAuthenticated ? 'Redirecting to dashboard...' : 'Redirecting to login...'}
              </span>
            </div>

            {/* Manual Navigation */}
            <div className="mt-8 space-y-3">
              <p className="text-sm text-secondary-text">
                Taking too long?
              </p>
              <div className="space-y-2">
                {isAuthenticated ? (
                  <button
                    onClick={() => navigate('/app/dashboard')}
                    className="btn-primary w-full"
                  >
                    Go to Dashboard
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/login')}
                    className="btn-primary w-full"
                  >
                    Login to Access Dashboard
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentSuccess;
