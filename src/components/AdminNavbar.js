import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLoading } from '../contexts/LoadingContext';
import './AdminNavbar.css';

const AdminNavbar = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { startLoading } = useLoading();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/announcements', label: 'Announcements', icon: '📢' },
    { path: '/admin/emergency-alerts', label: 'Emergency Alerts', icon: '🚨' },
    { path: '/admin/officials', label: 'Officials', icon: '👥' },
    { path: '/admin/residents', label: 'Resident Verification', icon: '✅' },
    { path: '/admin/voting', label: 'Voting & Surveys', icon: '🗳️' },
    { path: '/admin/feedback', label: 'Review Feedback', icon: '💬' },
    { path: '/admin/accounts', label: 'Admin Accounts', icon: '👤' },
  ];

  const handleLogout = async () => {
    try {
      startLoading('Logging out...');
      await logout();
      setShowLogoutDialog(false);
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNavClick = (e, path) => {
    // Only trigger loading if navigating to a different route
    if (location.pathname !== path) {
      startLoading('Loading page...');
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const toggleLogoutDialog = () => {
    setShowLogoutDialog(!showLogoutDialog);
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        className="mobile-hamburger"
        onClick={toggleSidebar}
        aria-label="Toggle navigation menu"
        title="Menu"
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>

      <div className="admin-sidebar-wrapper">
        {/* Sidebar */}
        <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : 'collapsed'}`}>
          {/* Sidebar Header */}
          {isSidebarOpen && (
            <div className="sidebar-header">
              <div className="sidebar-brand">
                <span className="brand-icon">🏛️</span>
                <span className="brand-text">Admin Portal</span>
              </div>
              <button
                className="sidebar-toggle"
                onClick={toggleSidebar}
                aria-label="Toggle sidebar"
                title="Collapse sidebar"
              >
                ◀
              </button>
            </div>
          )}

          {/* Collapse Toggle (when sidebar is collapsed) */}
          {!isSidebarOpen && (
            <div className="sidebar-header-collapsed">
              <button
                className="sidebar-toggle-collapsed"
                onClick={toggleSidebar}
                aria-label="Toggle sidebar"
                title="Expand sidebar"
              >
                ▶
              </button>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={(e) => handleNavClick(e, item.path)}
                className={`sidebar-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                title={!isSidebarOpen ? item.label : ''}
              >
                <span className="nav-icon">{item.icon}</span>
                {isSidebarOpen && <span className="nav-label">{item.label}</span>}
              </Link>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="sidebar-footer">
            <button
              className="sidebar-logout-btn"
              onClick={toggleLogoutDialog}
              title="Logout"
            >
              <span className="logout-icon">🚪</span>
              {isSidebarOpen && <span className="logout-label">Logout</span>}
            </button>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div
            className="sidebar-overlay"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Logout Dialog */}
      {showLogoutDialog && (
        <div className="logout-overlay" onClick={toggleLogoutDialog}>
          <div className="logout-dialog" onClick={e => e.stopPropagation()}>
            <h3 className="dialog-title">
              <span className="warning-icon">⚠️</span>
              Confirm Logout
            </h3>
            <p className="dialog-message">Are you sure you want to logout from the admin portal?</p>
            <div className="dialog-actions">
              <button className="btn btn-secondary" onClick={toggleLogoutDialog}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminNavbar;
