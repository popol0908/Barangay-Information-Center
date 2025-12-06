import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { validateEmail, validatePassword } from '../utils/validation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const { login, error, setError } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  
  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (error) setError('');
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error;
    }
    
    
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.error;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      const result = await login(formData.email, formData.password);
      const { user } = result;

      let status = 'pending';
      try {
        const userRef = doc(db, 'users', user.uid);
        const snapshot = await getDoc(userRef);
        if (snapshot.exists()) {
          status = snapshot.data().status || 'pending';
        }
      } catch (profileError) {
        console.error('Error fetching user profile for login redirect:', profileError);
      }

      showToast('Login successful! Redirecting...', 'success');
      setTimeout(() => {
        if (status === 'verified') {
          navigate(from, { replace: true });
        } else if (status === 'declined') {
          navigate('/verification/declined', { replace: true });
        } else {
          navigate('/verification/pending', { replace: true });
        }
      }, 500);
    } catch (error) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        showToast('Incorrect email or password.', 'error');
        setError('Incorrect email or password.');
      } else if (error.code === 'auth/too-many-requests') {
        showToast('Too many failed attempts. Please try again later.', 'error');
        setError('Too many failed attempts. Please try again later.');
      } else {
        showToast('Login failed. Please try again.', 'error');
        setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.email.trim() !== '' && formData.password.trim() !== '';

  return (
    <div className="login-container">
      <div className="login-wrapper">
        {}
        <div className="login-form-section">
          <div className="login-header">
            <h1 className="login-title">Welcome</h1>
            <p className="login-subtitle">Sign in to your Barangay Information Center account</p>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">
                <span className="icon"></span>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${errors.email ? 'input-error' : ''}`}
                placeholder="Enter your email"
                disabled={loading}
              />
              {errors.email && (
                <span className="field-error">{errors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="icon"></span>
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${errors.password ? 'input-error' : ''}`}
                placeholder="Enter your password"
                disabled={loading}
              />
              {errors.password && (
                <span className="field-error">{errors.password}</span>
              )}
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
                onClick={() => {
                  
                  alert('Forgot password functionality will be implemented');
                }}
                disabled={loading}
              >
                <span className="btn-icon btn-icon-left">🔑</span>
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading || !isFormValid}
            >
              {loading ? (
                <>
                  <span className="btn-loading"></span>
                  Signing In...
                </>
              ) : (
                <>
                  <span className="btn-icon btn-icon-left">🔐</span>
                  Sign In
                </>
              )}
            </button>

            <div className="signup-prompt">
              <p>Don't have an account? <Link to="/signup" className="signup-link">Sign Up</Link></p>
            </div>
          </form>
        </div>

        {}
        <div className="about-section">
          <div className="about-content">
            <h2 className="about-title">About Barangay Mabayuan</h2>
            <p className="about-text">
              Barangay Mabayuan is a vibrant community in Olongapo City, committed to serving our residents with dedication and excellence.
              Our Barangay Information Center provides easy access to important announcements, services, and emergency alerts to keep our community informed and connected.
            </p>
            <div className="about-highlights">
              <div className="highlight-item">
                <span className="highlight-icon">🏠</span>
                <div>
                  <h4>Community Services</h4>
                  <p>Access barangay clearance, business permits, and other essential documents</p>
                </div>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">📢</span>
                <div>
                  <h4>Stay Informed</h4>
                  <p>Get the latest announcements and emergency alerts from your barangay officials</p>
                </div>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">👥</span>
                <div>
                  <h4>Meet Your Officials</h4>
                  <p>Connect with your barangay officials and learn about their roles</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
