import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getSharedData, addItem, subscribeToChanges, subscribeToFilteredData } from '../services/dataService';
import { validateRequired } from '../utils/validation';
import './Feedback.css';

// Helper function to format dates from Firestore
const formatDate = (dateValue) => {
  if (!dateValue) return 'Invalid date';
  
  // If it's a Firestore Timestamp object
  if (dateValue.toDate && typeof dateValue.toDate === 'function') {
    return new Date(dateValue.toDate()).toLocaleString();
  }
  
  // If it's an ISO string
  if (typeof dateValue === 'string') {
    return new Date(dateValue).toLocaleString();
  }
  
  // If it's already a Date object
  if (dateValue instanceof Date) {
    return dateValue.toLocaleString();
  }
  
  return 'Invalid date';
};

const formatDateOnly = (dateValue) => {
  if (!dateValue) return 'Invalid date';
  
  // If it's a Firestore Timestamp object
  if (dateValue.toDate && typeof dateValue.toDate === 'function') {
    return new Date(dateValue.toDate()).toLocaleDateString();
  }
  
  // If it's an ISO string
  if (typeof dateValue === 'string') {
    return new Date(dateValue).toLocaleDateString();
  }
  
  // If it's already a Date object
  if (dateValue instanceof Date) {
    return dateValue.toLocaleDateString();
  }
  
  return 'Invalid date';
};

const Feedback = () => {
  const { currentUser, userProfile } = useAuth();
  const { showToast } = useToast();
  const [submissions, setSubmissions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isReplySubmitting, setIsReplySubmitting] = useState(false);

  const [formData, setFormData] = useState({
    category: 'Complaint',
    fullName: userProfile?.fullName || '',
    address: userProfile?.address || '',
    message: '',
    attachment: null,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!currentUser?.uid) return;

    // Subscribe to real-time feedback updates filtered by userId
    const unsubscribe = subscribeToFilteredData('feedback', ['userId', '==', currentUser.uid], (userFeedback) => {
      setSubmissions(userFeedback);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, attachment: 'Only images and PDFs are allowed' }));
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, attachment: 'File size must be less than 10MB' }));
        return;
      }

      // Upload to Cloudinary
      setFormData(prev => ({
        ...prev,
        attachment: {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          uploading: true
        }
      }));

      try {
        const formDataCloudinary = new FormData();
        formDataCloudinary.append('file', file);
        formDataCloudinary.append('upload_preset', 'barangay_feedback'); // You'll need to set this in Cloudinary

        const response = await fetch(
          'https://api.cloudinary.com/v1_1/dypfxfpfz/auto/upload',
          {
            method: 'POST',
            body: formDataCloudinary
          }
        );

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();

        setFormData(prev => ({
          ...prev,
          attachment: {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            url: data.secure_url,
            cloudinaryId: data.public_id,
            uploading: false
          }
        }));
        setErrors(prev => ({ ...prev, attachment: '' }));
        showToast('File uploaded successfully!', 'success');
      } catch (error) {
        console.error('Upload error:', error);
        setErrors(prev => ({ ...prev, attachment: 'Failed to upload file. Please try again.' }));
        setFormData(prev => ({
          ...prev,
          attachment: null
        }));
        showToast('Failed to upload file', 'error');
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    const messageValidation = validateRequired(formData.message, 'Message');
    if (!messageValidation.isValid) {
      newErrors.message = messageValidation.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const newFeedback = {
        category: formData.category,
        fullName: formData.fullName || userProfile?.fullName || 'Anonymous',
        address: formData.address || userProfile?.address || '',
        message: formData.message,
        attachment: formData.attachment,
        userId: currentUser?.uid,
        userEmail: currentUser?.email,
        status: 'Pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        adminReply: null,
        replies: [],
      };

      await addItem('feedback', newFeedback);
      showToast('Feedback submitted successfully!', 'success');
      
      setFormData({
        category: 'Complaint',
        fullName: userProfile?.fullName || '',
        address: userProfile?.address || '',
        message: '',
        attachment: null,
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showToast('Failed to submit feedback. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending':
        return 'status-pending';
      case 'In Review':
        return 'status-in-review';
      case 'Resolved':
        return 'status-resolved';
      default:
        return 'status-pending';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return '⏳';
      case 'In Review':
        return '👀';
      case 'Resolved':
        return '✅';
      default:
        return '⏳';
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();

    if (!replyText.trim()) {
      showToast('Please enter a reply', 'error');
      return;
    }

    if (!selectedSubmission) {
      showToast('Error: No feedback selected', 'error');
      return;
    }

    setIsReplySubmitting(true);
    try {
      const { updateItem } = await import('../services/dataService');

      // Add reply to replies array
      const replies = selectedSubmission.replies || [];
      const newReply = {
        id: Date.now().toString(),
        author: 'Resident',
        message: replyText,
        createdAt: new Date().toISOString(),
      };

      replies.push(newReply);

      // Update feedback in Firestore
      await updateItem('feedback', selectedSubmission.id, {
        replies: replies
      });

      // Update selected submission for modal
      setSelectedSubmission(prev => ({
        ...prev,
        replies: replies
      }));
      setReplyText('');
      showToast('Reply sent successfully!', 'success');
    } catch (error) {
      console.error('Error sending reply:', error);
      showToast('Failed to send reply', 'error');
    } finally {
      setIsReplySubmitting(false);
    }
  };

  return (
    <div className="feedback-page">
      <div className="page-header">
        <h1 className="page-title">Feedback & Concerns</h1>
        <p className="page-subtitle">Share your feedback, suggestions, or concerns with the barangay</p>
      </div>

      <div className="feedback-container">
        {/* Submit New Feedback Button */}
        {!showForm && (
          <button
            className="btn-submit-feedback"
            onClick={() => setShowForm(true)}
          >
            ➕ Submit New Feedback
          </button>
        )}

        {/* Feedback Form */}
        {showForm && (
          <div className="feedback-form-card">
            <div className="form-header">
              <h2>Submit Your Feedback</h2>
              <button
                className="btn-close-form"
                onClick={() => setShowForm(false)}
                title="Close form"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="feedback-form">
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value="Complaint">Complaint</option>
                  <option value="Suggestion">Suggestion</option>
                  <option value="Inquiry">Inquiry</option>
                  <option value="Service Evaluation">Service Evaluation</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address">Address</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Your address"
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="message">Message or Detailed Concern *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Please provide details about your feedback, concern, or suggestion..."
                  className={`form-control textarea ${errors.message ? 'error' : ''}`}
                  rows="6"
                />
                {errors.message && <span className="error-text">{errors.message}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="attachment">Attachment (Optional - Max 10MB)</label>
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    id="attachment"
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                    className="file-input"
                  />
                  <label htmlFor="attachment" className="file-input-label">
                    📎 Choose file (Images or PDF, max 10MB)
                  </label>
                  {formData.attachment && (
                    <div className="file-info">
                      <span className="file-name">{formData.attachment.name}</span>
                      {formData.attachment.uploading ? (
                        <span className="upload-status">⏳ Uploading...</span>
                      ) : formData.attachment.url ? (
                        <span className="upload-status">✅ Uploaded</span>
                      ) : null}
                      <button
                        type="button"
                        className="btn-remove-file"
                        onClick={() => setFormData(prev => ({ ...prev, attachment: null }))}
                        disabled={formData.attachment.uploading}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
                {errors.attachment && <span className="error-text">{errors.attachment}</span>}
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Submissions List */}
        <div className="submissions-section">
          <h2 className="section-title">Your Submissions</h2>
          {submissions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>No Submissions Yet</h3>
              <p>Submit your first feedback to get started.</p>
            </div>
          ) : (
            <div className="submissions-list">
              {submissions.map((submission) => (
                <div key={submission.id} className="submission-card">
                  <div className="submission-header">
                    <div className="submission-info">
                      <div className="category-badge">{submission.category}</div>
                      <span className={`status-badge ${getStatusBadgeClass(submission.status)}`}>
                        {getStatusIcon(submission.status)} {submission.status}
                      </span>
                    </div>
                    <button
                      className="btn-view-details"
                      onClick={() => {
                        setSelectedSubmission(submission);
                        setShowDetailsModal(true);
                      }}
                    >
                      View Details →
                    </button>
                  </div>
                  <p className="submission-message">{submission.message ? submission.message.substring(0, 150) + '...' : 'No message'}</p>
                  <div className="submission-meta">
                    <span className="meta-item">
                      📅 {formatDateOnly(submission.createdAt)}
                    </span>
                    {submission.adminReply && (
                      <span className="meta-item has-reply">💬 Admin Reply</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedSubmission && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Feedback Details</h2>
              <button
                className="btn-close-modal"
                onClick={() => setShowDetailsModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-label">Category:</span>
                <span className="detail-value">{selectedSubmission.category}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className={`status-badge ${getStatusBadgeClass(selectedSubmission.status)}`}>
                  {getStatusIcon(selectedSubmission.status)} {selectedSubmission.status}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Submitted:</span>
                <span className="detail-value">
                  {formatDate(selectedSubmission.createdAt)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Full Name:</span>
                <span className="detail-value">{selectedSubmission.fullName}</span>
              </div>
              {selectedSubmission.address && (
                <div className="detail-row">
                  <span className="detail-label">Address:</span>
                  <span className="detail-value">{selectedSubmission.address}</span>
                </div>
              )}
              <div className="detail-row full-width">
                <span className="detail-label">Message:</span>
                <p className="detail-message">{selectedSubmission.message}</p>
              </div>
              {selectedSubmission.attachment && selectedSubmission.attachment.url && (
                <div className="detail-row">
                  <span className="detail-label">Attachment:</span>
                  <div className="attachment-display">
                    <span className="detail-value">📎 {selectedSubmission.attachment.name}</span>
                    <a
                      href={selectedSubmission.attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-download-file"
                      title="Open attachment"
                    >
                      🔗 Open
                    </a>
                  </div>
                </div>
              )}
              {selectedSubmission.adminReply && (
                <div className="admin-reply-section">
                  <h3>Admin Reply</h3>
                  <p className="admin-reply-text">{selectedSubmission.adminReply}</p>
                </div>
              )}

              {/* Conversation Thread */}
              {selectedSubmission.replies && selectedSubmission.replies.length > 0 && (
                <div className="replies-section">
                  <h3>Conversation</h3>
                  <div className="replies-list">
                    {selectedSubmission.replies.map((reply, index) => (
                      <div key={index} className="reply-item">
                        <div className="reply-header">
                          <span className="reply-author">{reply.author}</span>
                          <span className="reply-date">{formatDate(reply.createdAt)}</span>
                        </div>
                        <p className="reply-message">{reply.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reply Form - Only show if admin has replied */}
              {selectedSubmission.adminReply && (
                <form onSubmit={handleReplySubmit} className="reply-form">
                  <div className="form-group">
                    <label htmlFor="replyText">Your Reply</label>
                    <textarea
                      id="replyText"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply here..."
                      rows="4"
                      disabled={isReplySubmitting}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isReplySubmitting || !replyText.trim()}
                  >
                    {isReplySubmitting ? 'Sending...' : 'Send Reply'}
                  </button>
                </form>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feedback;
