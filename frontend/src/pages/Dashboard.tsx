import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../lib/api';

interface Project {
  id: string;
  name: string;
  product_info: string;
  offer_info: string;
  created_at: string;
}

interface Message {
  id: string;
  username: string;
  generated_message: string;
  created_at: string;
}

interface CreditInfo {
  credits: number;
  total_earned: number;
  total_used: number;
  subscription_remaining: number;
  has_subscription: boolean;
  total_remaining: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [credits, setCredits] = useState<CreditInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    document.title = "DMify - Dashboard";
    setIsVisible(true);
    
    const fetchDashboardData = async () => {
      try {
        const [projectsData, messagesData, creditsData] = await Promise.all([
          apiService.getProjects(),
          apiService.getAllMessages(),
          apiService.getUserCredits()
        ]);
        
        setProjects(projectsData);
        setRecentMessages(messagesData.slice(0, 6)); // Show last 6 messages
        setCredits(creditsData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Check for payment success
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      setPaymentSuccess(true);
      setTimeout(() => {
        setPaymentSuccess(false);
        window.history.replaceState({}, '', '/app/dashboard');
      }, 5000);
    }
  }, [searchParams]);

  const getProjectInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="dashboard-container min-h-screen">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="dashboard-container min-h-screen relative">
      {/* Success Toast */}
      {paymentSuccess && (
        <div className="fixed top-4 right-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-20 shadow-lg backdrop-blur-md z-50 transition-all duration-300">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Payment successful! Your subscription is now active.</span>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className={`mb-8 transition-all duration-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <h1 className="text-3xl font-black text-primary-text font-space mb-2">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-secondary-text text-lg">
          Here's what's happening with your Instagram outreach
        </p>
      </div>

      {/* KPI Tiles */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 transition-all duration-800 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Available Messages */}
        <div className="kpi-tile">
          <div className="flex items-start justify-between h-full">
            <div className="flex items-center">
              <div className="kpi-icon mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <p className="kpi-label mb-1">
                  {credits?.has_subscription ? 'Messages Remaining' : 'Available Credits'}
                </p>
                <p className="kpi-value">{credits?.total_remaining ?? 0}</p>
                {credits?.has_subscription && credits?.subscription_remaining > 0 && (
                  <p className="text-xs text-secondary-text mt-1">
                    {credits.subscription_remaining} from subscription
                    {credits.credits > 0 && `, ${credits.credits} bonus credits`}
                  </p>
                )}
              </div>
            </div>
            <Link to="/app/payments" className="kpi-link">
              {credits?.has_subscription ? 'Manage' : 'Subscribe'}
            </Link>
          </div>
        </div>

        {/* Total Projects */}
        <div className="kpi-tile">
          <div className="flex items-center h-full">
            <div className="kpi-icon mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <p className="kpi-label mb-1">Projects</p>
              <p className="kpi-value">{projects.length}</p>
            </div>
          </div>
        </div>

        {/* Messages Generated */}
        <div className="kpi-tile">
          <div className="flex items-center h-full">
            <div className="kpi-icon mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <p className="kpi-label mb-1">Messages Generated</p>
              <p className="kpi-value">{credits?.total_used ?? 0}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Main Content Grid */}
      <div className={`grid grid-cols-1 lg:grid-cols-5 gap-8 transition-all duration-800 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Projects Panel (2/5) */}
        <div className="lg:col-span-2">
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <div>
                <h3 className="dashboard-card-title">Your Projects</h3>
                <p className="text-xs text-secondary-text mt-1">Manage your outreach campaigns</p>
              </div>
              <div className="flex items-center gap-3">
                <Link to="/app/projects" className="dashboard-card-action">
                  View all
                </Link>
                <Link 
                  to="/app/projects" 
                  className="text-xs px-3 py-1 border border-electric-blue text-electric-blue rounded-full hover:bg-electric-blue hover:text-white transition-all duration-300"
                >
                  + New Project
                </Link>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {projects.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-electric-blue/20 to-neon-purple/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-secondary-text" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <p className="text-secondary-text mb-4">No projects yet</p>
                  <Link to="/app/projects" className="btn-primary">
                    Create your first project
                  </Link>
                </div>
              ) : (
                projects.slice(0, 4).map((project, index) => (
                  <div key={project.id} className="project-row" style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="project-avatar">
                      {getProjectInitial(project.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-primary-text truncate">{project.name}</h4>
                      <p className="text-sm text-secondary-text truncate">{project.product_info}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/app/projects/${project.id}`}
                        className="text-xs text-electric-blue hover:text-neon-purple font-medium transition-colors"
                      >
                        Open
                      </Link>
                      <button className="text-xs text-secondary-text hover:text-primary-text">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Messages Panel (3/5) */}
        <div className="lg:col-span-3">
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <div>
                <h3 className="dashboard-card-title">Recent Messages</h3>
                <p className="text-xs text-secondary-text mt-1">Your latest generated DMs</p>
              </div>
              <Link to="/app/messages" className="dashboard-card-action">
                View all
              </Link>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {recentMessages.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-electric-blue/20 to-neon-purple/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-secondary-text" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-secondary-text mb-4">No messages yet. Generate your first personalized DM.</p>
                  <button 
                    onClick={() => navigate('/app/projects')}
                    className="btn-primary"
                  >
                    Generate New DM
                  </button>
                </div>
              ) : (
                recentMessages.map((message, index) => (
                  <div key={message.id} className="message-row" style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <span className="font-semibold text-primary-text">@{message.username}</span>
                        <span className="inline-flex items-center px-2 py-1 ml-2 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Sent
                        </span>
                      </div>
                      <span className="text-xs text-secondary-text">
                        {formatDate(message.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-secondary-text leading-relaxed line-clamp-2">
                      {message.generated_message}
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <button className="text-xs text-electric-blue hover:text-neon-purple font-medium transition-colors">
                        Copy DM
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button - Desktop */}
      <div className="hidden md:block">
        <button 
          onClick={() => {
            if (projects.length > 0) {
              navigate(`/app/projects/${projects[0].id}`);
            } else {
              navigate('/app/projects');
            }
          }}
          className="fab"
          title="Create a personalized DM"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Generate New DM
        </button>
      </div>

      {/* Floating Action Bar - Mobile */}
      <div className="md:hidden fab-mobile">
        <button 
          onClick={() => {
            if (projects.length > 0) {
              navigate(`/app/projects/${projects[0].id}`);
            } else {
              navigate('/app/projects');
            }
          }}
          className="flex-1 bg-cta-gradient text-white py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105"
        >
          Generate DM
        </button>
        <button 
          onClick={() => navigate('/app/payments')}
          className="px-6 py-3 border border-electric-blue text-electric-blue rounded-full font-semibold hover:bg-electric-blue hover:text-white transition-all duration-300"
        >
          {credits?.has_subscription ? 'Manage Plan' : 'Subscribe'}
        </button>
      </div>
    </div>
  );
};

// Loading Skeleton Component
const DashboardSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="mb-8">
      <div className="skeleton h-8 w-64 mb-2"></div>
      <div className="skeleton h-4 w-96"></div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="skeleton h-24 rounded-20"></div>
      ))}
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      <div className="lg:col-span-2 skeleton h-96 rounded-20"></div>
      <div className="lg:col-span-3 skeleton h-96 rounded-20"></div>
    </div>
  </div>
);

export default Dashboard;