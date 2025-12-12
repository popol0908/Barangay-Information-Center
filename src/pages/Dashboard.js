import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSharedData, subscribeToChanges } from '../services/dataService';
import PageLoader from '../components/PageLoader';
import './Dashboard.css';

const Dashboard = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Subscribe to real-time announcements updates
    const unsubscribe = subscribeToChanges('announcements', (data) => {
      setAnnouncements(data.slice(0, 3));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);
  return (
    <PageLoader isLoading={isLoading} loadingMessage="Loading dashboard...">
      <div className="dashboard">
      {}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to Barangay Mabayuan</h1>
          <p className="hero-subtitle">Your gateway to community services and information</p>
        </div>
      </section>

      {}
      <section className="announcements-section">
        <div className="section-header">
          <h2 className="section-title">Recent Announcements</h2>
          <Link to="/announcements" className="view-all-link">
            View All →
          </Link>
        </div>
        
        {announcements.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📢</div>
            <h3>No Announcements Yet</h3>
            <p>Check back later for updates.</p>
          </div>
        ) : (
          <div className="announcements-grid">
            {announcements.map((announcement) => (
            <div key={announcement.id} className="announcement-card">
              <div className="announcement-image">
                {announcement.image ? (
                  announcement.image.startsWith('http') ? (
                    <img src={announcement.image} alt={announcement.title} className="announcement-photo" />
                  ) : (
                    <span className="announcement-icon">{announcement.image}</span>
                  )
                ) : (
                  <span className="announcement-icon">📢</span>
                )}
              </div>
              <div className="announcement-content">
                <h3 className="announcement-title">{announcement.title}</h3>
                <div className="announcement-dates-compact">
                  <span className="date-compact-item">
                    <strong>When:</strong> {new Date(announcement.whenDate || announcement.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  {announcement.datePosted && (
                    <span className="date-compact-item">
                      <strong>Posted:</strong> {new Date(announcement.datePosted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>
                <p className="announcement-description">{announcement.description}</p>
              </div>
            </div>
          ))}
          </div>
        )}
      </section>

      {}
      <section className="quick-actions-section">
        <div className="quick-actions">
          <h2 className="section-title">Quick Actions</h2>
          
          {/* Community Information */}
          <div className="action-group">
            <h3 className="action-group-title">
              <span className="group-icon">📢</span>
              Community Information
            </h3>
            <div className="action-buttons">
              <Link to="/announcements" className="action-card action-primary">
                <div className="action-card-icon">📢</div>
                <div className="action-card-content">
                  <h4 className="action-card-title">Announcements</h4>
                  <p className="action-card-description">Browse all community announcements and updates</p>
                </div>
                <div className="action-card-arrow">→</div>
              </Link>
              
              <Link to="/emergency-alerts" className="action-card action-danger">
                <div className="action-card-icon">🚨</div>
                <div className="action-card-content">
                  <h4 className="action-card-title">Emergency Alerts</h4>
                  <p className="action-card-description">View active emergency notifications and warnings</p>
                </div>
                <div className="action-card-arrow">→</div>
              </Link>
              
              <Link to="/officials" className="action-card action-info">
                <div className="action-card-icon">👥</div>
                <div className="action-card-content">
                  <h4 className="action-card-title">Barangay Officials</h4>
                  <p className="action-card-description">Meet your local government officials</p>
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
              <Link to="/vote" className="action-card action-success">
                <div className="action-card-icon">🗳️</div>
                <div className="action-card-content">
                  <h4 className="action-card-title">Voting & Surveys</h4>
                  <p className="action-card-description">Participate in community voting events</p>
                </div>
                <div className="action-card-arrow">→</div>
              </Link>
              
              <Link to="/events" className="action-card action-warning">
                <div className="action-card-icon">📅</div>
                <div className="action-card-content">
                  <h4 className="action-card-title">Community Events</h4>
                  <p className="action-card-description">View and join upcoming community events</p>
                </div>
                <div className="action-card-arrow">→</div>
              </Link>
              
              <Link to="/feedback" className="action-card action-secondary">
                <div className="action-card-icon">💬</div>
                <div className="action-card-content">
                  <h4 className="action-card-title">Submit Feedback</h4>
                  <p className="action-card-description">Share your thoughts and suggestions</p>
                </div>
                <div className="action-card-arrow">→</div>
              </Link>
              
              <Link to="/community-insights" className="action-card action-primary">
                <div className="action-card-icon">📊</div>
                <div className="action-card-content">
                  <h4 className="action-card-title">Community Insights</h4>
                  <p className="action-card-description">View aggregated community statistics</p>
                </div>
                <div className="action-card-arrow">→</div>
              </Link>
            </div>
          </div>

          {/* Personal */}
          <div className="action-group">
            <h3 className="action-group-title">
              <span className="group-icon">👤</span>
              Personal
            </h3>
            <div className="action-buttons">
              <Link to="/profile" className="action-card action-info">
                <div className="action-card-icon">👤</div>
                <div className="action-card-content">
                  <h4 className="action-card-title">My Profile</h4>
                  <p className="action-card-description">View and manage your account information</p>
                </div>
                <div className="action-card-arrow">→</div>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
    </PageLoader>
  );
};

export default Dashboard;
