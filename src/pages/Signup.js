import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateName,
  validatePhoneNumber,
  validateRequired
} from '../utils/validation';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import './Signup.css';

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'dypfxfpfz'; // Replace with your Cloudinary Cloud Name
const CLOUDINARY_UPLOAD_PRESET = 'barangay_proofs'; // You'll need to create this in Cloudinary

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthday: '',
    purok: '',
    houseNumber: '',
    contactNumber: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthday: '',
    purok: '',
    houseNumber: '',
    contactNumber: '',
    proofFile: ''
  });
  const [proofFile, setProofFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup, error, setError } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) {
      setProofFile(null);
      setErrors(prev => ({ ...prev, proofFile: 'Proof of residency is required.' }));
      setFileError('Proof of residency is required.');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      const message = 'Invalid file type. Accepted: JPG, PNG, JPEG, PDF.';
      setProofFile(null);
      setErrors(prev => ({ ...prev, proofFile: message }));
      setFileError(message);
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      const message = 'File size must not exceed 5MB.';
      setProofFile(null);
      setErrors(prev => ({ ...prev, proofFile: message }));
      setFileError(message);
      return;
    }

    setProofFile(file);
    setErrors(prev => ({ ...prev, proofFile: '' }));
    setFileError('');
  };

  const validateForm = () => {
    const newErrors = {};
    
    
    const nameValidation = validateName(formData.name);
    if (!nameValidation.isValid) {
      newErrors.name = nameValidation.error;
    }
    
    
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error;
    }
    
    
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.error;
    }
    
    
    const confirmPasswordValidation = validateConfirmPassword(formData.password, formData.confirmPassword);
    if (!confirmPasswordValidation.isValid) {
      newErrors.confirmPassword = confirmPasswordValidation.error;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadToCloudinary = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload proof. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    
    if (!validateForm()) {
      showToast('Please fix the errors in the form.', 'error');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const result = await signup(formData.email, formData.password);
      const { user } = result;

      let proofUrl = '';
      if (proofFile) {
        proofUrl = await uploadToCloudinary(proofFile);
      }

      await setDoc(doc(db, 'users', user.uid), {
        fullName: formData.name,
        email: formData.email,
        birthday: formData.birthday,
        purok: formData.purok,
        houseNumber: formData.houseNumber,
        address: `${formData.purok} ${formData.houseNumber}`.trim(),
        contactNumber: formData.contactNumber,
        proofUrl,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      showToast('Registration successful! Your account is pending verification.', 'success');

      setTimeout(() => {
        navigate('/verification/pending');
      }, 1500);
    } catch (error) {
      console.error('Signup error:', error);
      if (error.code === 'auth/email-already-in-use') {
        showToast('This email is already registered.', 'error');
        setErrors(prev => ({ ...prev, email: 'This email is already registered.' }));
      } else if (error.code === 'auth/invalid-email') {
        showToast('Please enter a valid email address.', 'error');
        setErrors(prev => ({ ...prev, email: 'Please enter a valid email address.' }));
      } else if (error.code === 'auth/weak-password') {
        showToast('Password is too weak.', 'error');
        setErrors(prev => ({ ...prev, password: 'Password is too weak.' }));
      } else if (error.message.includes('upload')) {
        showToast(error.message, 'error');
      } else {
        showToast('Signup failed. Please try again.', 'error');
        setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.name.trim() !== '' && 
                      formData.email.trim() !== '' && 
                      formData.password.trim() !== '' && 
                      formData.confirmPassword.trim() !== '' &&
                      formData.birthday.trim() !== '' &&
                      formData.purok.trim() !== '' &&
                      formData.houseNumber.trim() !== '' &&
                      formData.contactNumber.trim() !== '' &&
                      !!proofFile &&
                      !fileError;

  return (
    <div className="signup-container">
      <div className="signup-wrapper">
        {}
        <div className="about-section">
          <div className="about-content">
            <h2 className="about-title">Join Our Community</h2>
            <p className="about-text">
              Create an account to access all the features of Barangay Mabayuan Information Center.
              Stay connected with your community and never miss important updates.
            </p>
            <div className="about-highlights">
              <div className="highlight-item">
                <span className="highlight-icon">📢</span>
                <div>
                  <h4>Get Instant Updates</h4>
                  <p>Receive real-time notifications about barangay announcements and events</p>
                </div>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">📋</span>
                <div>
                  <h4>Easy Document Requests</h4>
                  <p>Submit requests for barangay clearance, permits, and certificates online</p>
                </div>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">🚨</span>
                <div>
                  <h4>Emergency Alerts</h4>
                  <p>Get immediate notifications during emergencies and important situations</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="signup-form-section">
          <div className="signup-header">
            <h1 className="signup-title">Create Account</h1>
            <p className="signup-subtitle">Join the Barangay Mabayuan Information Center</p>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="signup-form">
            <div className="form-group">
              <label className="form-label">
                <span className="icon"></span>
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`form-input ${errors.name ? 'input-error' : ''}`}
                placeholder="Enter your full name"
                disabled={loading}
              />
              {errors.name && (
                <span className="field-error">{errors.name}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="icon"></span>
                Birthday
              </label>
              <input
                type="date"
                name="birthday"
                value={formData.birthday}
                onChange={handleChange}
                className={`form-input ${errors.birthday ? 'input-error' : ''}`}
                disabled={loading}
              />
              {errors.birthday && (
                <span className="field-error">{errors.birthday}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="icon"></span>
                Address (Purok)
              </label>
              <input
                type="text"
                name="purok"
                value={formData.purok}
                onChange={handleChange}
                className={`form-input ${errors.purok ? 'input-error' : ''}`}
                placeholder="Enter your Purok"
                disabled={loading}
              />
              {errors.purok && (
                <span className="field-error">{errors.purok}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="icon"></span>
                House Number
              </label>
              <input
                type="text"
                name="houseNumber"
                value={formData.houseNumber}
                onChange={handleChange}
                className={`form-input ${errors.houseNumber ? 'input-error' : ''}`}
                placeholder="Enter your house number"
                disabled={loading}
              />
              {errors.houseNumber && (
                <span className="field-error">{errors.houseNumber}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="icon"></span>
                Contact Number
              </label>
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                className={`form-input ${errors.contactNumber ? 'input-error' : ''}`}
                placeholder="09XXXXXXXXX"
                disabled={loading}
              />
              {errors.contactNumber && (
                <span className="field-error">{errors.contactNumber}</span>
              )}
            </div>

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
                placeholder="Create a password (min. 8 characters)"
                disabled={loading}
              />
              {errors.password && (
                <span className="field-error">{errors.password}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="icon"></span>
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="Confirm your password"
                disabled={loading}
              />
              {errors.confirmPassword && (
                <span className="field-error">{errors.confirmPassword}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="icon"></span>
                Proof of Residency (JPG, PNG, PDF, max 5MB)
              </label>
              <input
                type="file"
                name="proofFile"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                className={`form-input ${errors.proofFile ? 'input-error' : ''}`}
                disabled={loading}
              />
              {errors.proofFile && (
                <span className="field-error">{errors.proofFile}</span>
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
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading || !isFormValid}
            >
              {loading ? (
                <>
                  <span className="btn-loading"></span>
                  Creating Account...
                </>
              ) : (
                <>
                  <span className="btn-icon btn-icon-left">✨</span>
                  Create Account
                </>
              )}
            </button>

            <div className="login-prompt">
              <p>Already have an account? <Link to="/login" className="login-link">Login</Link></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
