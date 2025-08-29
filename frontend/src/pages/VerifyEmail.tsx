import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const VerifyEmail: React.FC = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const { verifyEmail, resendVerification } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const email = location.state?.email || '';

  useEffect(() => {
    document.title = "DMify - Verify Email";
    if (!email) {
      navigate('/signup');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await verifyEmail(email, code);
      navigate('/login', { 
        state: { 
          message: 'Email verified successfully! You can now login.',
          email: email 
        } 
      });
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    
    try {
      await resendVerification(email);
      setResendCooldown(60);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    if (error) setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-black text-gray-900 font-inter">
            Verify your email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We sent a 6-digit code to <span className="font-medium">{email}</span>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 text-center">
              Verification Code
            </label>
            <input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              className="mt-2 w-full px-4 py-3 text-center text-2xl font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent tracking-widest"
              placeholder="000000"
              value={code}
              onChange={handleCodeChange}
            />
            <p className="mt-1 text-xs text-gray-500 text-center">
              Enter the 6-digit code from your email
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="btn-primary w-full flex justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Verify Email'
              )}
            </button>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Didn't receive the code?
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || resendCooldown > 0}
              className="text-blue-600 hover:text-blue-500 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending ? (
                'Sending...'
              ) : resendCooldown > 0 ? (
                `Resend in ${resendCooldown}s`
              ) : (
                'Resend code'
              )}
            </button>
          </div>

          <div className="text-center">
            <Link to="/signup" className="text-gray-600 hover:text-gray-500 text-sm">
              ← Back to signup
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyEmail;
