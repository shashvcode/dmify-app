import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import SEOHead from '../components/SEOHead';

const ResetPassword: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get('token');

  useEffect(() => {
    setIsVisible(true);
    
    // If no token in URL, redirect to forgot password
    if (!token) {
      navigate('/forgot-password');
    }
  }, [token, navigate]);

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Za-z]/.test(password)) {
      return 'Password must contain at least one letter';
    }
    if (!/\d/.test(password)) {
      return 'Password must contain at least one number';
    }
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!formData.newPassword) {
      setError('New password is required');
      return;
    }
    
    const passwordError = validatePassword(formData.newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`https://dmify-app.onrender.com/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          token: token,
          new_password: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success - redirect to login with success message
        navigate('/login', {
          state: {
            message: 'Password updated successfully. Please sign in with your new password.',
            email: formData.email.trim()
          }
        });
      } else {
        setError(data.detail || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return null; // Will redirect in useEffect
  }

  return (
    <>
      <SEOHead
        title="Reset Password - DMify"
        description="Create a new password for your DMify account."
        keywords="DMify reset password, new password, account recovery"
        canonical="https://dmify-app-1.onrender.com/reset-password"
      />
      
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Floating Orbs */}
        <div className="floating-orb bg-electric-blue w-64 h-64 top-20 left-20 blur-3xl"></div>
        <div className="floating-orb bg-neon-purple w-96 h-96 bottom-20 right-32 blur-3xl"></div>
        
        <div className={`glass-card max-w-md w-full relative z-10 transition-all duration-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center mb-8">
            <Link to="/">
              <img 
                src="/dmifylogo.png" 
                alt="DMify" 
                className="h-12 w-auto mx-auto mb-6"
              />
            </Link>
            <h2 className="text-3xl font-black text-primary-text font-space">
              Reset Password
            </h2>
            <p className="mt-2 text-secondary-text">
              Enter your email and create a new password
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50/80 backdrop-blur-glass border border-red-200 text-red-600 px-4 py-3 rounded-20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-primary-text mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter your email address"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-bold text-primary-text mb-2">
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.newPassword}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter new password"
                disabled={loading}
              />
              <p className="text-xs text-secondary-text mt-1">
                Must be at least 8 characters with letters and numbers
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-bold text-primary-text mb-2">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input-field"
                placeholder="Confirm new password"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Updating Password...
                </div>
              ) : (
                'Update Password'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-secondary-text">
              Remember your password?{' '}
              <Link to="/login" className="text-electric-blue hover:text-neon-purple font-medium transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
