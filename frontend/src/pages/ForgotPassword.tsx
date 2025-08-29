import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import SEOHead from '../components/SEOHead';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`https://dmify-app.onrender.com/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setEmail(''); // Clear form on success
      } else {
        setError(data.detail || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Forgot Password - DMify"
        description="Reset your DMify password. Enter your email to receive password reset instructions."
        keywords="DMify forgot password, reset password, account recovery"
        canonical="https://dmify.app/forgot-password"
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
              Forgot Password?
            </h2>
            <p className="mt-2 text-secondary-text">
              Enter your email address and we'll send you reset instructions
            </p>
          </div>

          {message && (
            <div className="mb-6 bg-green-50/80 backdrop-blur-glass border border-green-200 text-green-600 px-4 py-3 rounded-20">
              {message}
            </div>
          )}

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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="Enter your email address"
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
                  Sending...
                </div>
              ) : (
                'Send Reset Instructions'
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

export default ForgotPassword;
