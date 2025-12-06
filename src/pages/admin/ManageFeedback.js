import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getSharedData, updateItem, subscribeToChanges } from '../../services/dataService';
import { useToast } from '../../contexts/ToastContext';
import AdminNavbar from '../../components/AdminNavbar';
import './ManageFeedback.css';

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

const ManageFeedback = () => {
  const { showToast } = useToast();
  const [feedback, setFeedback] = useState([]);
  const [filteredFeedback, setFilteredFeedback] = useState([]);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Subscribe to real-time feedback updates
    const unsubscribe = subscribeToChanges('feedback', (feedbackData) => {
      setFeedback(feedbackData);
      applyFilters(feedbackData, filterCategory, filterStatus);
    });

    return () => unsubscribe();
  }, [filterCategory, filterStatus]);

  const applyFilters = (data, category, status) => {
    let filtered = data;

    if (category !== 'All') {
      filtered = filtered.filter(item => item.category === category);
    }

    if (status !== 'All') {
      filtered = filtered.filter(item => item.status === status);
    }

    setFilteredFeedback(filtered);
  };

  const handleCategoryFilter = (e) => {
    const category = e.target.value;
    setFilterCategory(category);
    applyFilters(feedback, category, filterStatus);
  };

  const handleStatusFilter = (e) => {
    const status = e.target.value;
    setFilterStatus(status);
    applyFilters(feedback, filterCategory, status);
  };

  const handleStatusChange = async (feedbackItem, newStatus) => {
    setIsUpdating(true);
    try {
      await updateItem('feedback', feedbackItem.id, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      showToast(`Status updated to ${newStatus}`, 'success');
      setSelectedFeedback(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Failed to update status', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim()) {
      showToast('Please enter a reply', 'error');
      return;
    }

    setIsUpdating(true);
    try {
      // Initialize replies array if it doesn't exist
      const replies = selectedFeedback.replies || [];

      // Add admin reply to replies array
      const adminReplyObj = {
        id: Date.now().toString(),
        author: 'Admin',
        message: replyText,
        createdAt: new Date().toISOString(),
      };

      replies.push(adminReplyObj);

      // Update feedback in Firestore
      await updateItem('feedback', selectedFeedback.id, {
        adminReply: replyText,
        replies: replies
      });

      showToast('Reply sent successfully', 'success');
      setSelectedFeedback(prev => ({
        ...prev,
        adminReply: replyText,
        replies: replies
      }));
      setReplyText('');
      setShowReplyModal(false);
    } catch (error) {
      console.error('Error sending reply:', error);
      showToast('Failed to send reply', 'error');
    } finally {
      setIsUpdating(false);
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

  return (
    <>
      <AdminNavbar />
      <div className="manage-feedback-page">
        <div className="page-header">
          <h1 className="page-title">Review Feedback & Concerns</h1>
          <p className="page-subtitle">Manage resident feedback and concerns</p>
        </div>

        <div className="feedback-container">
          {/* Filters */}
          <div className="filters-section">
            <div className="filter-group">
              <label htmlFor="category-filter">Category:</label>
              <select
                id="category-filter"
                value={filterCategory}
                onChange={handleCategoryFilter}
                className="filter-select"
              >
                <option value="All">All Categories</option>
                <option value="Complaint">Complaint</option>
                <option value="Suggestion">Suggestion</option>
                <option value="Inquiry">Inquiry</option>
                <option value="Service Evaluation">Service Evaluation</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="status-filter">Status:</label>
              <select
                id="status-filter"
                value={filterStatus}
                onChange={handleStatusFilter}
                className="filter-select"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Review">In Review</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div className="filter-info">
              <span className="info-text">Total: {filteredFeedback.length} feedback</span>
            </div>
          </div>

          {/* Feedback Table */}
          <div className="feedback-table-wrapper">
            {filteredFeedback.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>No Feedback Found</h3>
                <p>No feedback matches the selected filters.</p>
              </div>
            ) : (
              <table className="feedback-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>From</th>
                    <th>Message</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFeedback.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className="category-badge">{item.category}</span>
                      </td>
                      <td>
                        <div className="user-info">
                          <div className="user-name">{item.fullName}</div>
                          <div className="user-email">{item.userEmail}</div>
                        </div>
                      </td>
                      <td>
                        <div className="message-preview">{item.message ? item.message.substring(0, 50) + '...' : 'No message'}</div>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusBadgeClass(item.status)}`}>
                          {getStatusIcon(item.status)} {item.status}
                        </span>
                      </td>
                      <td className="date-cell">
                        {formatDateOnly(item.createdAt)}
                      </td>
                      <td>
                        <button
                          className="btn-view"
                          onClick={() => {
                            setSelectedFeedback(item);
                            setShowDetailsModal(true);
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedFeedback && (
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
                <div className="detail-section">
                  <h3>Feedback Information</h3>
                  <div className="detail-row">
                    <span className="detail-label">Category:</span>
                    <span className="category-badge">{selectedFeedback.category}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Status:</span>
                    <div className="status-controls">
                      <select
                        value={selectedFeedback.status}
                        onChange={(e) => handleStatusChange(selectedFeedback, e.target.value)}
                        className="status-select"
                        disabled={isUpdating}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Review">In Review</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </div>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Submitted:</span>
                    <span className="detail-value">
                      {formatDate(selectedFeedback.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Resident Information</h3>
                  <div className="detail-row">
                    <span className="detail-label">Full Name:</span>
                    <span className="detail-value">{selectedFeedback.fullName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{selectedFeedback.userEmail}</span>
                  </div>
                  {selectedFeedback.address && (
                    <div className="detail-row">
                      <span className="detail-label">Address:</span>
                      <span className="detail-value">{selectedFeedback.address}</span>
                    </div>
                  )}
                </div>

                <div className="detail-section">
                  <h3>Message</h3>
                  <div className="message-box">
                    <p>{selectedFeedback.message}</p>
                  </div>
                </div>

                {selectedFeedback.attachment && selectedFeedback.attachment.url && (
                  <div className="detail-section">
                    <h3>Attachment</h3>
                    <div className="attachment-info">
                      <span className="attachment-icon">📎</span>
                      <div className="attachment-details">
                        <span className="attachment-name">{selectedFeedback.attachment.name}</span>
                        <span className="attachment-size">
                          ({(selectedFeedback.attachment.size / 1024).toFixed(2)} KB)
                        </span>
                      </div>
                      <a
                        href={selectedFeedback.attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-download-attachment"
                        title="Open attachment"
                      >
                        🔗 Open
                      </a>
                    </div>
                  </div>
                )}

                {selectedFeedback.adminReply && (
                  <div className="detail-section admin-reply-section">
                    <h3>Admin Reply</h3>
                    <div className="reply-box">
                      <p>{selectedFeedback.adminReply}</p>
                    </div>
                  </div>
                )}

                {/* Conversation Thread */}
                {selectedFeedback.replies && selectedFeedback.replies.length > 0 && (
                  <div className="detail-section replies-section">
                    <h3>Conversation Thread</h3>
                    <div className="replies-list">
                      {selectedFeedback.replies.map((reply, index) => (
                        <div key={index} className={`reply-item reply-${reply.author.toLowerCase()}`}>
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
              </div>

              <div className="modal-footer">
                {!selectedFeedback.adminReply ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowReplyModal(true)}
                  >
                    Send Reply
                  </button>
                ) : (
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowReplyModal(true)}
                  >
                    Edit Reply
                  </button>
                )}
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

        {/* Reply Modal */}
        {showReplyModal && selectedFeedback && (
          <div className="modal-overlay" onClick={() => setShowReplyModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Send Reply</h2>
                <button
                  className="btn-close-modal"
                  onClick={() => setShowReplyModal(false)}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="reply-form">
                  <label htmlFor="reply-text">Your Reply:</label>
                  <textarea
                    id="reply-text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply here..."
                    className="reply-textarea"
                    rows="6"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowReplyModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleReplySubmit}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ManageFeedback;
