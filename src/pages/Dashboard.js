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
        <div className="section-header">
          <h2 className="section-title">Quick Actions</h2>
        </div>
        
        <div className="quick-actions-grid">
          <Link to="/emergency-alerts" className="quick-action-card emergency-card">
            <div className="quick-action-icon">🚨</div>
            <h3>Emergency Alerts</h3>
            <p>View active emergency notifications</p>
          </Link>
          
          <Link to="/officials" className="quick-action-card">
            <div className="quick-action-icon">👥</div>
            <h3>Barangay Officials</h3>
            <p>Meet your local government officials</p>
          </Link>
          
          <Link to="/announcements" className="quick-action-card">
            <div className="quick-action-icon">📢</div>
            <h3>All Announcements</h3>
            <p>Browse all community announcements</p>
          </Link>
        </div>
      </section>
    </div>
    </PageLoader>
  );
};

export default Dashboard;
