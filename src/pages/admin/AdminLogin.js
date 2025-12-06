import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase';
import './AdminLogin.css';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [loading, setLoading] = useState(false);

  const { login, error, setError, currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  // Redirect to admin dashboard if already logged in as admin
  useEffect(() => {
    if (currentUser && userProfile?.role === 'admin') {
      navigate('/admin/dashboard');
    }
  }, [currentUser, userProfile, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');
      
      // Attempt login
      const result = await login(formData.email, formData.password);
      console.log('Login successful. User UID:', result.user.uid);
      
      // Wait a moment for Firestore to sync
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if user has admin role
      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);
      
      console.log('User profile exists:', userSnap.exists());
      console.log('User data:', userSnap.data());
      
      if (userSnap.exists() && userSnap.data().role === 'admin') {
        console.log('Admin role confirmed. Redirecting to dashboard.');
        navigate('/admin/dashboard');
      } else if (!userSnap.exists()) {
        // Sign out the user since their profile doesn't exist
        await signOut(auth);
        setError('User profile not found. Please contact the administrator.');
        console.error('User profile document does not exist in Firestore');
      } else {
        // User is not an admin, sign them out and deny access
        await signOut(auth);
        setError('Access denied. This account does not have admin privileges.');
        console.warn('User is not an admin. Access denied.');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      if (error.code === 'auth/user-not-found') {
        setError('Email not found.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-wrapper">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <div className="admin-logo">
              <span className="logo-icon">🏛️</span>
            </div>
            <h1 className="admin-login-title">Admin Portal</h1>
            <p className="admin-login-subtitle">Barangay Information Center</p>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="admin-login-form">
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon"></span>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="admin@barangay.gov"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="label-icon"></span>
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>

            <div className="form-options">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  disabled={loading}
                />
                <span className="checkmark"></span>
                Remember me
              </label>
              <button
                type="button"
                className="forgot-password-link"
                onClick={() => alert('Password reset functionality will be implemented')}
                disabled={loading}
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Signing In...
                </>
              ) : (
                'Login to Admin Portal'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
