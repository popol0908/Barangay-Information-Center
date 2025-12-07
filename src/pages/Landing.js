import React from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
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
                  <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" />
                </svg>
              </div>
              <h2 className="access-title">Resident Portal</h2>
              <p className="access-description">
                Access announcements, vote on community matters, report issues, and connect with barangay officials.
              </p>
              <div className="access-button">
                <span>Enter Portal</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            <Link to="/admin/login" className="access-card admin-card">
              <div className="access-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="access-title">Admin Portal</h2>
              <p className="access-description">
                Manage announcements, voting events, emergency alerts, and oversee community engagement.
              </p>
              <div className="access-button">
                <span>Enter Portal</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
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
            <p className="section-subtitle">Discover the features and services available to you</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                </svg>
              </div>
              <h3 className="feature-title">View Announcements</h3>
              <p className="feature-description">Stay updated with the latest news, events, and important information from your barangay.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 0 0 1.946-.806 3.42 3.42 0 0 1 4.438 0 3.42 3.42 0 0 0 1.946.806 3.42 3.42 0 0 1 3.138 3.138 3.42 3.42 0 0 0 .806 1.946 3.42 3.42 0 0 1 0 4.438 3.42 3.42 0 0 0-.806 1.946 3.42 3.42 0 0 1-3.138 3.138 3.42 3.42 0 0 0-1.946.806 3.42 3.42 0 0 1-4.438 0 3.42 3.42 0 0 0-1.946-.806 3.42 3.42 0 0 1-3.138-3.138 3.42 3.42 0 0 0-.806-1.946 3.42 3.42 0 0 1 0-4.438 3.42 3.42 0 0 0 .806-1.946 3.42 3.42 0 0 1 3.138-3.138z" />
                </svg>
              </div>
              <h3 className="feature-title">Participate in Voting</h3>
              <p className="feature-description">Cast your vote on important community decisions and make your voice heard.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="feature-title">Emergency Alerts</h3>
              <p className="feature-description">Receive critical emergency notifications and stay safe during urgent situations.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                </svg>
              </div>
              <h3 className="feature-title">Report Issues</h3>
              <p className="feature-description">Submit feedback and report community issues directly to barangay officials.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm6 3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                </svg>
              </div>
              <h3 className="feature-title">Connect with Officials</h3>
              <p className="feature-description">View contact information and connect with your barangay officials easily.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
                </svg>
              </div>
              <h3 className="feature-title">View Statistics</h3>
              <p className="feature-description">Access community statistics and insights about barangay activities and engagement.</p>
            </div>
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
