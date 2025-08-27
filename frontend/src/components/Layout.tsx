import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../lib/api';

interface CreditInfo {
  credits: number;
  total_earned: number;
  total_used: number;
}

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [credits, setCredits] = useState<CreditInfo | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteCheckbox, setDeleteCheckbox] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch user credits
  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const creditsData = await apiService.getUserCredits();
        setCredits(creditsData);
      } catch (error) {
        console.error('Failed to fetch credits:', error);
      }
    };

    if (user) {
      fetchCredits();
    }
  }, [user]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showProfileMenu]);

  // Handle keyboard navigation in profile menu
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showProfileMenu && event.key === 'Escape') {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showProfileMenu]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmation !== user.email || !deleteCheckbox) return;

    setIsDeleting(true);
    try {
      await apiService.deleteAccount();
      await logout();
      navigate('/goodbye');
    } catch (error) {
      console.error('Failed to delete account:', error);
      // Handle error - could show toast
    } finally {
      setIsDeleting(false);
    }
  };

  const isDeleteValid = deleteConfirmation === user?.email && deleteCheckbox;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`} role="navigation" aria-label="Primary">
        <div className="navbar-container">
          {/* Logo */}
          <Link to="/app/dashboard" className="navbar-logo">
            DMify
          </Link>

          {/* Primary Navigation */}
          <div className="navbar-nav">
            <Link
              to="/app/dashboard"
              className={`navbar-link ${isActive('/app/dashboard') ? 'active' : ''}`}
            >
              Dashboard
            </Link>
            
            <Link
              to="/app/projects"
              className={`navbar-link ${isActive('/app/projects') ? 'active' : ''}`}
            >
              Projects
            </Link>
            
            <Link
              to="/app/messages"
              className={`navbar-link ${isActive('/app/messages') ? 'active' : ''}`}
            >
              Messages
            </Link>
            
            <Link
              to="/app/payments"
              className={`navbar-link ${isActive('/app/payments') ? 'active' : ''}`}
            >
              Credits
            </Link>
          </div>

          {/* Profile Section */}
          <div className="navbar-profile">
            {/* Profile Menu */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="navbar-avatar"
                aria-haspopup="menu"
                aria-expanded={showProfileMenu}
                aria-label="Open profile menu"
              >
                {getInitials(user?.name || 'User')}
              </button>

              {showProfileMenu && (
                <div className="profile-menu" role="menu">
                  {/* User Info Section */}
                  <div className="profile-menu-section">
                    <div className="profile-menu-user">
                      <div className="profile-menu-name">{user?.name}</div>
                      <div className="profile-menu-email">{user?.email}</div>
                    </div>
                  </div>

                  {/* Navigation Section */}
                  <div className="profile-menu-section">
                    <Link
                      to="/app/account"
                      className="profile-menu-item"
                      role="menuitem"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <svg className="profile-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Account
                    </Link>
                    
                    <Link
                      to="/app/settings"
                      className="profile-menu-item"
                      role="menuitem"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <svg className="profile-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </Link>
                  </div>

                  {/* Help Section */}
                  <div className="profile-menu-section">
                    <a
                      href="/docs"
                      className="profile-menu-item"
                      role="menuitem"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <svg className="profile-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Help & Support
                    </a>
                  </div>

                  {/* Danger Section */}
                  <div className="profile-menu-section">
                    <button
                      onClick={() => {
                        setShowDeleteModal(true);
                        setShowProfileMenu(false);
                      }}
                      className="profile-menu-item destructive w-full"
                      role="menuitem"
                    >
                      <svg className="profile-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete account...
                    </button>
                  </div>

                  {/* Auth Section */}
                  <div className="profile-menu-section">
                    <button
                      onClick={handleLogout}
                      className="profile-menu-item w-full"
                      role="menuitem"
                    >
                      <svg className="profile-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="delete-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="delete-modal-title">Delete your DMify account?</h2>
            <p className="delete-modal-description">
              This permanently deletes your account, projects, and messages. This action cannot be undone.
            </p>

            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">
                Type your email address to confirm:
              </label>
              <input
                type="email"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder={user?.email}
                className="delete-modal-input"
                disabled={isDeleting}
              />
            </div>

            <div className="delete-modal-checkbox">
              <input
                type="checkbox"
                id="delete-understand"
                checked={deleteCheckbox}
                onChange={(e) => setDeleteCheckbox(e.target.checked)}
                className="mt-1"
                disabled={isDeleting}
              />
              <label htmlFor="delete-understand" className="text-sm text-secondary-text">
                I understand this cannot be undone and all my data will be permanently deleted.
              </label>
            </div>

            <div className="delete-modal-actions">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="delete-modal-cancel"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="delete-modal-confirm"
                disabled={!isDeleteValid || isDeleting}
              >
                {isDeleting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </div>
                ) : (
                  'Delete Account'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;