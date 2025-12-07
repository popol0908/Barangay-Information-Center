import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSharedData } from '../services/dataService';
import './Landing.css';

const Landing = () => {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getSharedData('announcements');
        if (mounted) {
          // show most recent 3
          const sorted = data
            .slice()
            .sort((a, b) => {
              const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
              const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
              return tb - ta;
            })
            .slice(0, 3);
          setAnnouncements(sorted);
        }
      } catch (e) {
        console.error('Failed to load announcements for landing:', e);
      }
    })();

    return () => { mounted = false; };
  }, []);

  return (
    <div className="landing-container">
      <header className="hero">
        <div className="hero-inner">
          <h1>Barangay Information Center</h1>
          <p className="hero-sub">Stay informed. Report issues. Connect with your barangay officials.</p>
          <div className="hero-ctas">
            <Link to="/login" className="btn btn-primary">Sign In</Link>
            <Link to="/signup" className="btn btn-outline">Sign Up</Link>
          </div>
        </div>
      </header>

      <main className="landing-main">
        <section className="announcements-preview">
          <div className="section-header">
            <h2>Latest Announcements</h2>
            <Link to="/announcements" className="view-all">View all</Link>
          </div>

          {announcements.length === 0 ? (
            <p className="muted">No public announcements yet.</p>
          ) : (
            <ul className="announcement-list">
              {announcements.map(item => (
                <li key={item.id} className="announcement-item">
                  <h3 className="announcement-title">{item.title}</h3>
                  <p className="announcement-body">{item.body?.length > 140 ? item.body.slice(0, 140) + '…' : item.body}</p>
                  <div className="announcement-meta">
                    <span>{item.author || 'Barangay Office'}</span>
                    <span className="dot">•</span>
                    <span>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : ''}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
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
              <strong>Community Services</strong>
              <p>Apply for clearances, request documents, and learn about local services.</p>
            </div>
            <div className="highlight">
              <strong>Alerts & Announcements</strong>
              <p>Receive critical updates and stay informed about community activities.</p>
            </div>
            <div className="highlight">
              <strong>Report & Participate</strong>
              <p>Report issues and take part in barangay events and cleanups.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Landing;
