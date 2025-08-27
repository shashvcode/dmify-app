import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../lib/api';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
          <Link to="/" className="navbar-logo">
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
                <>
                  {/* Invisible backdrop to close menu when clicking outside */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <div className="profile-menu" role="menu">
                  {/* User Info Section */}
                  <div className="profile-menu-section">
                    <div className="profile-menu-user">
                      <div className="profile-menu-name">{user?.name}</div>
                      <div className="profile-menu-email">{user?.email}</div>
                    </div>
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
                      Delete account
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
                </>
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