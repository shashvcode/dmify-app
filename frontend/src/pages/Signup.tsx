import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SEOHead from '../components/SEOHead';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  agreeToTerms?: string;
  submit?: string;
}

const sampleDMs = [
  {
    username: "@elonmusk",
    message: "Hey Elon! 🚀 Your vision for sustainable tech with Tesla and SpaceX is genuinely inspiring. I've been helping visionaries like yourself streamline their AI workflows. Would love to share how we're helping innovators scale their operations..."
  },
  {
    username: "@garyvee",
    message: "Gary! Your content on entrepreneurship and hustle culture has been a game-changer for so many. I've been working with content creators to amplify their personal brand reach. Quick question about your latest post on AI in marketing..."
  },
  {
    username: "@mkbhd",
    message: "Marques! Your tech reviews are always so thorough and unbiased - huge respect. I noticed your recent coverage of AI tools, and I've been helping tech reviewers like yourself discover cutting-edge automation solutions..."
  }
];

const Signup: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [currentDMIndex, setCurrentDMIndex] = useState(0);
  
  const { signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
    
    // Rotate sample DMs every 7 seconds
    const interval = setInterval(() => {
      setCurrentDMIndex((prev) => (prev + 1) % sampleDMs.length);
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string; show: boolean } => {
    if (!password.length) {
      return {
        strength: 0,
        label: '',
        color: 'bg-gray-200',
        show: false
      };
    }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const colors = ['bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500', 'bg-emerald-500'];
    
    return {
      strength,
      label: labels[strength] || 'Weak',
      color: colors[strength] || 'bg-orange-500',
      show: true
    };
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'That email looks off — try again?';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords don\'t match';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'Please agree to our terms to continue';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});
    
    try {
      await signup(formData.email, formData.password, formData.name);
      navigate('/verify-email', { state: { email: formData.email } });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail;
      
      if (errorMessage?.includes('already exists') || errorMessage?.includes('User already registered')) {
        setErrors({ submit: 'An account with this email already exists. Try signing in instead.' });
      } else if (errorMessage?.includes('email')) {
        setErrors({ submit: 'Please enter a valid email address.' });
      } else if (errorMessage?.includes('password')) {
        setErrors({ submit: 'Password doesn\'t meet requirements. Please try a stronger password.' });
      } else if (errorMessage?.includes('name')) {
        setErrors({ submit: 'Please enter a valid name.' });
      } else {
        setErrors({ submit: errorMessage || 'Something went wrong. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    // Clear field-specific errors when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    
    // Clear submit error when user makes any changes
    if (errors.submit) {
      setErrors(prev => ({ ...prev, submit: undefined }));
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const currentDM = sampleDMs[currentDMIndex];

  return (
    <>
      <SEOHead
        title="DMify - Sign Up"
        description="Sign up to DMify — the AI Instagram outreach tool that creates personalized DMs at scale and boosts response rates. Start your free trial today."
        keywords="DMify signup, AI Instagram DM generator, Instagram outreach tool, personalized DMs, Instagram DM automation, create account"
        canonical="https://dmify.app/signup"
      />
      <div className="min-h-screen bg-hero-gradient relative overflow-hidden">
      {/* Floating Orbs */}
      <div className="floating-orb bg-electric-blue w-64 h-64 top-10 left-10 blur-3xl"></div>
      <div className="floating-orb bg-neon-purple w-96 h-96 bottom-20 right-20 blur-3xl"></div>
      
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-white/20 relative z-50">
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
              <Link to="/login" className="text-secondary-text hover:text-primary-text font-medium transition-colors">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Mobile Layout */}
        <div className="lg:hidden">
          <div className={`transition-all duration-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="glass-card max-w-md mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-black text-primary-text mb-3 font-space">Create your account</h1>
                <p className="text-secondary-text">Start generating AI-powered personalized Instagram DMs in minutes.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="mobileName" className="block text-sm font-medium text-primary-text mb-2">
                    Full name
                  </label>
                  <input
                    id="mobileName"
                    name="name"
                    type="text"
                    required
                    className="input-field"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="mobileEmail" className="block text-sm font-medium text-primary-text mb-2">
                    Email address
                  </label>
                  <input
                    id="mobileEmail"
                    name="email"
                    type="email"
                    required
                    className="input-field"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="mobilePassword" className="block text-sm font-medium text-primary-text mb-2">
                    Password
                  </label>
                  <input
                    id="mobilePassword"
                    name="password"
                    type="password"
                    required
                    className="input-field"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  {passwordStrength.show && (
                    <div className="mt-2">
                      <div className="flex space-x-1 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded ${
                              i < passwordStrength.strength ? passwordStrength.color : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-secondary-text">{passwordStrength.label}</p>
                    </div>
                  )}
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>

                <div>
                  <label htmlFor="mobileConfirmPassword" className="block text-sm font-medium text-primary-text mb-2">
                    Confirm password
                  </label>
                  <input
                    id="mobileConfirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className="input-field"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>

                <div className="flex items-start">
                  <input
                    id="mobileAgreeToTerms"
                    name="agreeToTerms"
                    type="checkbox"
                    className="mt-1 h-4 w-4 text-electric-blue focus:ring-neon-purple border-gray-300 rounded"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                  />
                  <label htmlFor="mobileAgreeToTerms" className="ml-3 text-sm text-secondary-text">
                    I agree to the{' '}
                    <Link to="/terms" className="text-electric-blue hover:text-neon-purple font-medium">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-electric-blue hover:text-neon-purple font-medium">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
                {errors.agreeToTerms && <p className="text-sm text-red-600">{errors.agreeToTerms}</p>}

                {errors.submit && (
                  <div className="bg-red-50/80 backdrop-blur-glass border border-red-200 text-red-600 px-4 py-3 rounded-20 text-sm">
                    <p>{errors.submit}</p>
                    {(errors.submit.includes('already exists') || errors.submit.includes('sign in')) && (
                      <p className="mt-2">
                        <Link to="/login" className="text-electric-blue hover:text-neon-purple font-medium transition-colors">
                          Sign in instead →
                        </Link>
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating account...
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </button>

                <p className="text-center text-sm text-secondary-text">
                  No credit card needed • We never message anyone without your action
                </p>
              </form>

              <div className="mt-8 text-center">
                <p className="text-secondary-text text-sm">
                  Already have an account?{' '}
                  <Link to="/login" className="text-electric-blue hover:text-neon-purple font-medium">
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-5 lg:gap-12 lg:items-start">
          {/* Left Column - Sign Up (60%) */}
          <div className={`lg:col-span-3 transition-all duration-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="glass-card max-w-lg">
              <div className="mb-8">
                <h1 className="text-4xl font-black text-primary-text mb-4 font-space">
                  <span className="gradient-text">Create your account</span>
                </h1>
                <p className="text-lg text-secondary-text">
                  Start generating AI-powered personalized Instagram DMs in minutes.
                </p>
              </div>



              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-primary-text mb-2">
                    Full name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="input-field focus:ring-2 focus:ring-offset-2 focus:ring-neon-purple"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-primary-text mb-2">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
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
                    required
                    className="input-field focus:ring-2 focus:ring-offset-2 focus:ring-neon-purple"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  {passwordStrength.show && (
                    <div className="mt-3">
                      <div className="flex space-x-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                              i < passwordStrength.strength ? passwordStrength.color : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-secondary-text">{passwordStrength.label}</p>
                    </div>
                  )}
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-primary-text mb-2">
                    Confirm password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className="input-field focus:ring-2 focus:ring-offset-2 focus:ring-neon-purple"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>

                <div className="flex items-start">
                  <input
                    id="agreeToTerms"
                    name="agreeToTerms"
                    type="checkbox"
                    className="mt-1 h-4 w-4 text-electric-blue focus:ring-neon-purple border-gray-300 rounded"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                  />
                  <label htmlFor="agreeToTerms" className="ml-3 text-sm text-secondary-text">
                    I agree to the{' '}
                    <Link to="/terms" className="text-electric-blue hover:text-neon-purple font-medium transition-colors">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-electric-blue hover:text-neon-purple font-medium transition-colors">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
                {errors.agreeToTerms && <p className="text-sm text-red-600">{errors.agreeToTerms}</p>}

                {errors.submit && (
                  <div className="bg-red-50/80 backdrop-blur-glass border border-red-200 text-red-600 px-4 py-3 rounded-20 text-sm">
                    <p>{errors.submit}</p>
                    {(errors.submit.includes('already exists') || errors.submit.includes('sign in')) && (
                      <p className="mt-2">
                        <Link to="/login" className="text-electric-blue hover:text-neon-purple font-medium transition-colors">
                          Sign in instead →
                        </Link>
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating account...
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </button>

                <p className="text-center text-sm text-secondary-text">
                  No credit card needed • We never message anyone without your action
                </p>
              </form>
            </div>
          </div>

          {/* Right Column - Benefits & Social Proof (40%) */}
          <div className={`lg:col-span-2 space-y-8 transition-all duration-800 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Benefits Card */}
            <div className="glass-card">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-primary-text mb-3 font-space">Why join 500+ marketers?</h2>
                <p className="text-secondary-text">See what makes DMify the #1 choice for Instagram outreach</p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gradient-to-br from-electric-blue to-neon-purple rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-primary-text mb-2 font-space">10x Faster Outreach</h3>
                    <p className="text-secondary-text text-sm leading-relaxed">
                      Generate personalized DMs in seconds instead of spending hours researching and writing each message manually.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gradient-to-br from-electric-blue to-neon-purple rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-primary-text mb-2 font-space">3x Higher Response Rate</h3>
                    <p className="text-secondary-text text-sm leading-relaxed">
                      Our AI analyzes profiles to create authentic, personalized messages that actually get responses and build relationships.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gradient-to-br from-electric-blue to-neon-purple rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-primary-text mb-2 font-space">Scale Without Limits</h3>
                    <p className="text-secondary-text text-sm leading-relaxed">
                      From 10 DMs to 1000+, maintain quality and personalization at any scale with our AI-powered automation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/20 text-center">
                <p className="text-sm text-secondary-text">
                  Already have an account?{' '}
                  <Link to="/login" className="text-electric-blue hover:text-neon-purple font-medium transition-colors">
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>

            {/* Social Proof Card */}
            <div className="glass-card">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-primary-text mb-3 font-space">See a generated DM</h3>
                <div className="bg-gradient-to-br from-electric-blue/20 to-neon-purple/20 rounded-20 p-4 backdrop-blur-glass border border-white/30 transition-all duration-500">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-electric-blue to-neon-purple rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {currentDM.username.charAt(1).toUpperCase()}
                      </span>
                    </div>
                    <span className="ml-2 font-semibold text-primary-text">{currentDM.username}</span>
                  </div>
                  <p className="text-sm text-primary-text leading-relaxed">
                    {currentDM.message}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-center space-x-2 text-xs text-secondary-text">
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    Profile analyzed
                  </span>
                  <span>•</span>
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                    Interests detected
                  </span>
                  <span>•</span>
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-1"></div>
                    Tone matched
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center text-sm text-secondary-text">
                  <svg className="w-4 h-4 mr-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  3x higher replies vs templates
                </div>
                <div className="flex items-center text-sm text-secondary-text">
                  <svg className="w-4 h-4 mr-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  10K+ personalized DMs sent
                </div>
                <div className="flex items-center text-sm text-secondary-text">
                  <svg className="w-4 h-4 mr-3 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Works for creators, e-com, agencies
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center">
                <div className="flex items-center text-sm text-secondary-text">
                  <div className="flex text-yellow-400 mr-2">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  4.9/5 from 500+ users
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-white/20 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-secondary-text">
            <div className="mb-4 md:mb-0">
              <p>We never message anyone without your action.</p>
            </div>
            <div className="flex space-x-6">
              <Link to="/terms" className="hover:text-primary-text transition-colors">Terms</Link>
              <Link to="/privacy" className="hover:text-primary-text transition-colors">Privacy</Link>
              <Link to="/dpa" className="hover:text-primary-text transition-colors">DPA</Link>
              <Link to="/pricing" className="hover:text-primary-text transition-colors">Instagram DM Automation Pricing</Link>
              <Link to="/how-it-works" className="hover:text-primary-text transition-colors">AI Instagram DM Generator</Link>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
};

export default Signup;