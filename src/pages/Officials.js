import React, { useState, useEffect } from 'react';
import { getSharedData, subscribeToChanges } from '../services/dataService';
import PageLoader from '../components/PageLoader';
import './Officials.css';

const Officials = () => {
  const [officials, setOfficials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Subscribe to real-time officials updates
    const unsubscribe = subscribeToChanges('officials', (data) => {
      setOfficials(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);
  return (
    <PageLoader isLoading={isLoading} loadingMessage="Loading officials...">
      <div className="officials-page">
      {}
      <div className="page-header">
        <h1 className="page-title">Barangay Officials</h1>
      </div>

      {}
      <div className="officials-container">
        {officials.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No Officials Listed Yet</h3>
            <p>Official information will be available soon.</p>
          </div>
        ) : (
          <div className="officials-grid">
            {officials.map((official) => (
            <div key={official.id} className="official-card">
              <div className={`official-avatar ${official.image === 'female' ? 'female' : 'male'}`}>
                <span className="avatar-icon">
                  {official.image === 'female' ? '👩‍💼' : '👨‍💼'}
                </span>
              </div>
              <div className="official-info">
                <h3 className="official-name">{official.name}</h3>
                <p className="official-position">{official.position}</p>
                <div className="official-contact">
                  <span className="contact-icon">📞</span>
                  <span className="contact-number">{official.contact}</span>
                </div>
                {official.email && (
                  <div className="official-email">
                    <span className="email-icon">✉️</span>
                    <span className="email-address">{official.email}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          </div>
        )}
      </div>

      {}
      <div className="office-info">
        <div className="info-card">
          <div className="info-header">
            <h3 className="info-title">Barangay Hall Information</h3>
          </div>
          <div className="info-content">
            <div className="info-item">
              <span className="info-icon">📍</span>
              <div className="info-text">
                <strong>Location:</strong> Barangay Mabayuan Hall, Mabayuan Street, Olongapo City
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">🕐</span>
              <div className="info-text">
                <strong>Office Hours:</strong> Monday - Friday, 8:00 AM - 5:00 PM
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">📞</span>
              <div className="info-text">
                <strong>Main Contact:</strong> (02) 123-4567
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">✉️</span>
              <div className="info-text">
                <strong>Email:</strong> info@barangaymabayan.gov.ph
              </div>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="committees-section">
        <h3 className="section-title">Committee Assignments</h3>
        <div className="committees-grid">
          <div className="committee-card">
            <h4 className="committee-title">Peace & Order</h4>
            <p className="committee-description">Ensuring public safety and maintaining peace in the community</p>
          </div>
          <div className="committee-card">
            <h4 className="committee-title">Health & Sanitation</h4>
            <p className="committee-description">Promoting health awareness and proper waste management</p>
          </div>
          <div className="committee-card">
            <h4 className="committee-title">Education & Youth</h4>
            <p className="committee-description">Supporting educational programs and youth development</p>
          </div>
          <div className="committee-card">
            <h4 className="committee-title">Infrastructure</h4>
            <p className="committee-description">Overseeing community infrastructure and development projects</p>
          </div>
        </div>
      </div>
    </div>
    </PageLoader>
  );
};

export default Officials;
