
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/app/dashboard" className="flex items-center">
                <span className="text-2xl font-black text-gray-900 font-inter">DMify</span>
              </Link>
              
              <div className="ml-10 flex space-x-8">
                <Link
                  to="/app/dashboard"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    isActive('/app/dashboard')
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300'
                  }`}
                >
                  Dashboard
                </Link>
                
                <Link
                  to="/app/projects"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    isActive('/app/projects')
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300'
                  }`}
                >
                  Projects
                </Link>
                
                <Link
                  to="/app/messages"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    isActive('/app/messages')
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300'
                  }`}
                >
                  Messages
                </Link>
                
                <Link
                  to="/app/payments"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    isActive('/app/payments')
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300'
                  }`}
                >
                  Credits
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                <span className="hidden sm:inline">Welcome, </span>
                <span className="font-medium">{user?.name}</span>
              </div>
              
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
