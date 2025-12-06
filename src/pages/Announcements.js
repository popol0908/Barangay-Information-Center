import React, { useState, useEffect } from 'react';
import { getSharedData, subscribeToChanges } from '../services/dataService';
import PageLoader from '../components/PageLoader';
import './Announcements.css';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Subscribe to real-time announcements updates
    const unsubscribe = subscribeToChanges('announcements', (data) => {
      setAnnouncements(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <PageLoader isLoading={isLoading} loadingMessage="Loading announcements...">
      <div className="announcements-page">
      {}
      <div className="page-header">
        <h1 className="page-title">Barangay Announcements</h1>
      </div>

      {}
      <div className="announcements-container">
        {announcements.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📢</div>
            <h3>No Announcements Yet</h3>
            <p>Check back later for updates from the barangay.</p>
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
                  <span className="announcement-icon default-icon">📢</span>
                )}
              </div>
              <div className="announcement-content">
                <h3 className="announcement-title">{announcement.title}</h3>
                <div className="announcement-dates-info">
                  <div className="date-info-item">
                    <span className="date-info-label">When:</span>
                    <span className="date-info-value">
                      {new Date(announcement.whenDate || announcement.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  {announcement.datePosted && (
                    <div className="date-info-item">
                      <span className="date-info-label">Date Posted:</span>
                      <span className="date-info-value">
                        {new Date(announcement.datePosted).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                </div>
                <p className="announcement-description">{announcement.description}</p>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>

    </div>
    </PageLoader>
  );
};

export default Announcements;
