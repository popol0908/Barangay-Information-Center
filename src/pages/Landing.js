import React from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
  const features = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      ),
      title: 'Dashboard',
      description: 'Your personalized home page with quick access to all features and recent updates'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      ),
      title: 'Announcements',
      description: 'Stay updated with the latest barangay news, events, and important information'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1 12l9.29 8.14a2 2 0 0 0 2.82 0L23 12 13.11 3.86a2 2 0 0 0-2.82 0z"></path>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <line x1="12" y1="2" x2="12" y2="22"></line>
        </svg>
      ),
      title: 'Emergency Alerts',
      description: 'Receive real-time notifications about urgent safety and health alerts in your area'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
      title: 'Barangay Officials',
      description: 'View contact information and details of your barangay officials and leaders'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 11l3 3L22 4"></path>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
      ),
      title: 'Vote & Surveys',
      description: 'Participate in barangay surveys and voting to make your voice heard'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      ),
      title: 'Feedback & Concerns',
      description: 'Submit feedback, complaints, or suggestions directly to barangay administration'
    }
  ];

  return (
    <div className="landing-container">
      <header className="hero">
        <div className="hero-inner">
          <div className="hero-content">
            <h1 className="hero-title">Barangay Information Center</h1>
            <p className="hero-subtitle">Stay informed. Report issues. Connect with your barangay officials.</p>
          </div>
          
          <div className="access-points">
            <Link to="/login" className="access-card resident-card">
              <div className="access-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <h2 className="access-title">Resident Portal</h2>
              <p className="access-description">Access announcements, emergency alerts, and community services</p>
              <div className="access-button">
                <span>Resident Login</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"></path>
                </svg>
              </div>
            </Link>

            <Link to="/admin/login" className="access-card admin-card">
              <div className="access-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z"></path>
                </svg>
              </div>
              <h2 className="access-title">Admin Portal</h2>
              <p className="access-description">Manage announcements, alerts, and system administration</p>
              <div className="access-button">
                <span>Admin Login</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"></path>
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main className="landing-main">
        <section className="features-section">
          <div className="section-header">
            <h2 className="section-title">What Can Residents Do?</h2>
            <p className="section-subtitle">Explore the features available in the Resident Portal</p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon-wrapper">
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="about-landing">
          <h2>About Barangay Mabayuan</h2>
          <p>
            Barangay Mabayuan is a vibrant community committed to serving residents with
            timely announcements, emergency alerts, and easy access to services. Use this
            portal to view local news, report incidents, and connect with officials.
          </p>
          <div className="highlights">
            <div className="highlight">
              <div className="highlight-icon">🏛️</div>
              <div className="highlight-content">
                <strong>Community Services</strong>
                <p>Apply for clearances, request documents, and learn about local services.</p>
              </div>
            </div>
            <div className="highlight">
              <div className="highlight-icon">📢</div>
              <div className="highlight-content">
                <strong>Alerts & Announcements</strong>
                <p>Receive critical updates and stay informed about community activities.</p>
              </div>
            </div>
            <div className="highlight">
              <div className="highlight-icon">🤝</div>
              <div className="highlight-content">
                <strong>Report & Participate</strong>
                <p>Report issues and take part in barangay events and cleanups.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Landing;
