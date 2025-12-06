import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getSharedData, subscribeToChanges } from '../../services/dataService';
import AdminNavbar from '../../components/AdminNavbar';
import PageLoader from '../../components/PageLoader';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalResidents: 0,
    recentAnnouncements: 0,
    activeAlerts: 0,
    activeVoting: 0,
    pendingFeedback: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const updateStats = async () => {
    try {
      const announcements = await getSharedData('announcements');
      const recentAnnouncements = announcements.length;

      const alerts = await getSharedData('emergencyAlerts');
      const activeAlerts = alerts.filter(alert => alert.status === 'Active').length;
      
      const voting = await getSharedData('voting');
      const activeVoting = voting.filter(v => {
        const now = new Date();
        const start = new Date(v.startDate);
        const end = new Date(v.endDate);
        return now >= start && now <= end;
      }).length;
      
      const feedback = await getSharedData('feedback');
      const pendingFeedback = feedback.filter(f => f.status === 'pending' || !f.status).length;

      setStats({
        totalResidents: 1250, 
        recentAnnouncements,
        activeAlerts,
        activeVoting,
        pendingFeedback
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    updateStats();
    
    // Subscribe to all collections for stats updates
    const unsubscribeAnnouncements = subscribeToChanges('announcements', () => {
      updateStats();
    });
    const unsubscribeAlerts = subscribeToChanges('emergencyAlerts', () => {
      updateStats();
    });
    const unsubscribeVoting = subscribeToChanges('voting', () => {
      updateStats();
    });
    const unsubscribeFeedback = subscribeToChanges('feedback', () => {
      updateStats();
    });

    return () => {
      unsubscribeAnnouncements();
      unsubscribeAlerts();
      unsubscribeVoting();
      unsubscribeFeedback();
    };
  }, []);

  return (
    <PageLoader isLoading={isLoading} loadingMessage="Loading dashboard...">
      <div className="admin-dashboard">
        <AdminNavbar />

      {}
      <div className="admin-content">
        <div className="admin-container">
          <div className="dashboard-header-container">
            <div className="dashboard-header">
              <h1 className="dashboard-title">📊 Dashboard Overview</h1>
              <p className="dashboard-subtitle">Welcome back, Admin</p>
            </div>
          </div>

          {}
          <div className="summary-cards">
            <div className="summary-card card-blue">
              <div className="card-icon">👥</div>
              <div className="card-content">
                <h3 className="card-value">{stats.totalResidents.toLocaleString()}</h3>
                <p className="card-label">Total Residents</p>
              </div>
            </div>

            <div className="summary-card card-green">
              <div className="card-icon">📢</div>
              <div className="card-content">
                <h3 className="card-value">{stats.recentAnnouncements}</h3>
                <p className="card-label">Total Announcements</p>
              </div>
            </div>

            <div className="summary-card card-red">
              <div className="card-icon">🚨</div>
              <div className="card-content">
                <h3 className="card-value">{stats.activeAlerts}</h3>
                <p className="card-label">Active Emergency Alerts</p>
              </div>
            </div>

            <div className="summary-card card-purple">
              <div className="card-icon">🗳️</div>
              <div className="card-content">
                <h3 className="card-value">{stats.activeVoting}</h3>
                <p className="card-label">Active Voting Events</p>
              </div>
            </div>

            <div className="summary-card card-orange">
              <div className="card-icon">💬</div>
              <div className="card-content">
                <h3 className="card-value">{stats.pendingFeedback}</h3>
                <p className="card-label">Pending Feedback</p>
              </div>
            </div>
          </div>

          {}
          <div className="quick-actions">
            <h2 className="section-title">Quick Actions</h2>
            
            {/* Content Management */}
            <div className="action-group">
              <h3 className="action-group-title">
                <span className="group-icon">📢</span>
                Content Management
              </h3>
              <div className="action-buttons">
                <Link to="/admin/announcements" className="action-card action-primary">
                  <div className="action-card-icon">📢</div>
                  <div className="action-card-content">
                    <h4 className="action-card-title">Announcements</h4>
                    <p className="action-card-description">Create and manage community announcements</p>
                  </div>
                  <div className="action-card-arrow">→</div>
                </Link>
                
                <Link to="/admin/emergency-alerts" className="action-card action-danger">
                  <div className="action-card-icon">🚨</div>
                  <div className="action-card-content">
                    <h4 className="action-card-title">Emergency Alerts</h4>
                    <p className="action-card-description">Post urgent alerts and warnings</p>
                  </div>
                  <div className="action-card-arrow">→</div>
                </Link>
                
                <Link to="/admin/officials" className="action-card action-info">
                  <div className="action-card-icon">👥</div>
                  <div className="action-card-content">
                    <h4 className="action-card-title">Barangay Officials</h4>
                    <p className="action-card-description">Manage official profiles and information</p>
                  </div>
                  <div className="action-card-arrow">→</div>
                </Link>
              </div>
            </div>

            {/* Community Engagement */}
            <div className="action-group">
              <h3 className="action-group-title">
                <span className="group-icon">🗳️</span>
                Community Engagement
              </h3>
              <div className="action-buttons">
                <Link to="/admin/voting" className="action-card action-success">
                  <div className="action-card-icon">🗳️</div>
                  <div className="action-card-content">
                    <h4 className="action-card-title">Voting & Surveys</h4>
                    <p className="action-card-description">Create and manage voting events</p>
                  </div>
                  <div className="action-card-arrow">→</div>
                </Link>
                
                <Link to="/admin/feedback" className="action-card action-warning">
                  <div className="action-card-icon">💬</div>
                  <div className="action-card-content">
                    <h4 className="action-card-title">Review Feedback</h4>
                    <p className="action-card-description">View and respond to resident feedback</p>
                  </div>
                  <div className="action-card-arrow">→</div>
                </Link>
              </div>
            </div>

            {/* System Management */}
            <div className="action-group">
              <h3 className="action-group-title">
                <span className="group-icon">⚙️</span>
                System Management
              </h3>
              <div className="action-buttons">
                <Link to="/admin/residents" className="action-card action-info">
                  <div className="action-card-icon">✅</div>
                  <div className="action-card-content">
                    <h4 className="action-card-title">Resident Verification</h4>
                    <p className="action-card-description">Verify and manage resident accounts</p>
                  </div>
                  <div className="action-card-arrow">→</div>
                </Link>
                
                <Link to="/admin/accounts" className="action-card action-secondary">
                  <div className="action-card-icon">👤</div>
                  <div className="action-card-content">
                    <h4 className="action-card-title">Admin Accounts</h4>
                    <p className="action-card-description">Manage administrator accounts</p>
                  </div>
                  <div className="action-card-arrow">→</div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      </div>
    </PageLoader>
  );
};

export default AdminDashboard;
