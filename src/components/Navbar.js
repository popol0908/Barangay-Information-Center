import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: '🏠' },
    {
      label: 'Updates',
      icon: '📣',
      isDropdown: true,
      items: [
        { path: '/announcements', label: 'Announcements', icon: '📢' },
        { path: '/emergency-alerts', label: 'Emergency Alerts', icon: '🚨' },
      ]
    },
    {
      label: 'Community',
      icon: '👥',
      isDropdown: true,
      items: [
        { path: '/officials', label: 'Officials', icon: '👔' },
        { path: '/events', label: 'Events & Programs', icon: '📅' },
      ]
    },
    { path: '/vote', label: 'Participate', icon: '🗳️' },
    { path: '/feedback', label: 'Feedback', icon: '💬' },
  ];

  const toggleDropdown = (label) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const isItemActive = (item) => {
    if (item.path) {
      return location.pathname === item.path;
    }
    if (item.isDropdown) {
      return item.items.some(subItem => location.pathname === subItem.path);
    }
    return false;
  };

  const handleLogout = async () => {
    try {
      await logout();
      setShowLogoutDialog(false);
      // Navigate immediately without loading screen
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNavClick = (e, path) => {
    // Navigation without loading screen
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
        className={'mobile-hamburger'}
        onClick={toggleSidebar}
        aria-label="Toggle navigation menu"
        title="Menu"
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>

      <div className="sidebar-wrapper">
        {/* Sidebar */}
        <aside className={`sidebar ${isSidebarOpen ? 'open' : 'collapsed'}`}>
          {/* Sidebar Header */}
          {isSidebarOpen && (
            <div className="sidebar-header">
              <div className="sidebar-brand">
                <span className="brand-icon">🏛️</span>
                <span className="brand-text">Barangay</span>
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
              <div key={item.label} className="nav-item-container">
                {item.isDropdown ? (
                  <>
                    <button
                      onClick={() => toggleDropdown(item.label)}
                      className={`sidebar-nav-item dropdown-toggle ${isItemActive(item) ? 'active' : ''}`}
                      title={!isSidebarOpen ? item.label : ''}
                    >
                      <span className="nav-icon">{item.icon}</span>
                      {isSidebarOpen && (
                        <>
                          <span className="nav-label">{item.label}</span>
                          <span className={`dropdown-chevron ${openDropdown === item.label ? 'open' : ''}`}>
                            ▼
                          </span>
                        </>
                      )}
                    </button>
                    {isSidebarOpen && openDropdown === item.label && (
                      <div className="dropdown-menu">
                        {item.items.map((subItem) => (
                          <Link
                            key={subItem.path}
                            to={subItem.path}
                            onClick={(e) => handleNavClick(e, subItem.path)}
                            className={`dropdown-item ${location.pathname === subItem.path ? 'active' : ''}`}
                          >
                            <span className="nav-icon">{subItem.icon}</span>
                            <span className="nav-label">{subItem.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.path}
                    onClick={(e) => handleNavClick(e, item.path)}
                    className={`sidebar-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                    title={!isSidebarOpen ? item.label : ''}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {isSidebarOpen && <span className="nav-label">{item.label}</span>}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="sidebar-footer">
            <Link
              to="/profile"
              onClick={(e) => handleNavClick(e, '/profile')}
              className="sidebar-profile-btn"
              title="Profile"
            >
              <span className="profile-icon">👤</span>
              {isSidebarOpen && <span className="profile-label">Profile</span>}
            </Link>
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
            <p className="dialog-message">Are you sure you want to logout?</p>
            <div className="dialog-actions">
              <button className="btn btn-secondary" onClick={toggleLogoutDialog}>
                <span className="btn-icon btn-icon-left">✕</span>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleLogout}>
                <span className="btn-icon btn-icon-left">🚪</span>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
