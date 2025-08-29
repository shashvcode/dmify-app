
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve payment success parameters when redirecting to login
    const paymentParams = new URLSearchParams();
    if (location.search.includes('payment=success')) {
      const params = new URLSearchParams(location.search);
      if (params.get('payment')) paymentParams.set('payment', params.get('payment')!);
      if (params.get('session_id')) paymentParams.set('session_id', params.get('session_id')!);
    }
    
    const loginUrl = paymentParams.toString() 
      ? `/login?${paymentParams.toString()}` 
      : '/login';
      
    return <Navigate to={loginUrl} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
