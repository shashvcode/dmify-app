import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SEOHead from '../components/SEOHead';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  
  const { login, isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    setIsVisible(true);
    
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      setFormData(prev => ({ ...prev, email: location.state.email || '' }));
    }
  }, [location.state]);

  useEffect(() => {
    // Only navigate if user is authenticated AND auth context is not loading
    if (isAuthenticated && !authLoading && user) {
      // Check for return URL with plan parameter
      const returnTo = searchParams.get('returnTo');
      const planId = searchParams.get('plan');
      
      // Check for payment success parameters
      const paymentStatus = searchParams.get('payment');
      const sessionId = searchParams.get('session_id');
      
      if (returnTo === '/pricing' && planId) {
        // Redirect to payments page with the selected plan
        navigate(`/app/payments?plan=${planId}`, { replace: true });
      } else if (returnTo === '/payment-success' && paymentStatus === 'success') {
        // Redirect back to payment success page to handle the redirect properly
        const successParams = new URLSearchParams();
        successParams.set('payment', 'success');
        if (sessionId) successParams.set('session_id', sessionId);
        navigate(`/payment-success?${successParams.toString()}`, { replace: true });
      } else if (paymentStatus === 'success' && sessionId) {
        // Redirect to dashboard with payment success parameters
        navigate(`/app/dashboard?payment=success&session_id=${sessionId}`, { replace: true });
      } else {
        const from = location.state?.from?.pathname || '/app/dashboard';
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, authLoading, user, navigate, location.state, searchParams]);

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'That email looks off — try again?';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setSuccessMessage('');
    setErrors({}); // Clear any existing errors
    
    try {
      await login(formData.email, formData.password);
      // On success, the useEffect will handle navigation
      // Set loading to false so button returns to normal state during navigation
      setLoading(false);
    } catch (error: any) {
      // Always set loading to false when there's an error
      setLoading(false);
      
      const errorMessage = error.response?.data?.detail;
      
      if (errorMessage === 'Please verify your email before logging in') {
        // This is the only case where we want to navigate on error
        navigate('/verify-email', { state: { email: formData.email } });
        return;
      } else if (errorMessage === 'Incorrect email or password') {
        setErrors({ submit: 'Invalid email or password. Please check your credentials and try again.' });
      } else if (errorMessage?.includes('email')) {
        setErrors({ submit: 'Invalid email address. Please check and try again.' });
      } else if (errorMessage?.includes('User not found')) {
        setErrors({ submit: 'No account found with this email. Try signing up instead?' });
      } else {
        setErrors({ submit: errorMessage || 'Something went wrong. Please try again.' });
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field-specific errors when user starts typing
    if (errors[name]) {
      setErrors((prev: any) => ({ ...prev, [name]: '' }));
    }
    
    // Only clear submit errors when user types in the email or password field (the main fields)
    if (errors.submit && (name === 'email' || name === 'password')) {
      setErrors((prev: any) => ({ ...prev, submit: '' }));
    }
  };

  return (
    <>
      <SEOHead
        title="DMify - Sign In"
        description="Sign in to DMify — access your AI Instagram DM generator and continue creating personalized Instagram outreach messages that get results."
        keywords="DMify login, sign in, AI Instagram DM generator, Instagram outreach tool, personalized DMs, Instagram DM automation"
        canonical="https://dmify.app/login"
      />
      <div className="min-h-screen bg-hero-gradient relative overflow-hidden flex items-center justify-center">
      {/* Floating Orbs */}
      <div className="floating-orb bg-electric-blue w-64 h-64 top-20 left-20 blur-3xl"></div>
      <div className="floating-orb bg-neon-purple w-96 h-96 bottom-20 right-32 blur-3xl"></div>
      
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-white/20 fixed top-0 left-0 right-0 z-50">
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
              <Link to="/pricing" className="text-secondary-text hover:text-primary-text font-medium transition-colors">
                Pricing
              </Link>
              <Link to="/signup" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="w-full max-w-md px-4 relative z-10">
        <div className={`transition-all duration-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="glass-card">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-primary-text mb-3 font-space">
                <span className="gradient-text">Welcome back</span>
              </h1>
              <p className="text-secondary-text text-lg">
                Sign in to your DMify account
              </p>
            </div>
            
            {successMessage && (
              <div className="bg-green-50/80 backdrop-blur-glass border border-green-200 text-green-600 px-4 py-3 rounded-20 text-sm text-center mb-6">
                {successMessage}
              </div>
            )}
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-primary-text mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input-field focus:ring-2 focus:ring-offset-2 focus:ring-neon-purple"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-primary-text mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="input-field focus:ring-2 focus:ring-offset-2 focus:ring-neon-purple"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-electric-blue focus:ring-neon-purple border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-secondary-text">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link to="/forgot-password" className="text-electric-blue hover:text-neon-purple font-medium transition-colors">
                    Forgot your password?
                  </Link>
                </div>
              </div>

              {errors.submit && (
                <div className="bg-red-50/80 backdrop-blur-glass border border-red-200 text-red-600 px-4 py-3 rounded-20 text-sm">
                  <p>{errors.submit}</p>
                  {(errors.submit.includes('No account found') || errors.submit.includes('sign up')) && (
                    <p className="mt-2">
                      <Link to="/signup" className="text-electric-blue hover:text-neon-purple font-medium transition-colors">
                        Create an account instead →
                      </Link>
                    </p>
                  )}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>

              <div className="text-center">
                <span className="text-secondary-text">Don't have an account? </span>
                <Link to="/signup" className="text-electric-blue hover:text-neon-purple font-medium transition-colors">
                  Sign up
                </Link>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-white/20 text-center text-sm text-secondary-text">
              <p>We never message anyone without your action.</p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default Login;