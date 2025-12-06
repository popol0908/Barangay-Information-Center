import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getSharedData, addItem, updateItem, deleteItem, subscribeToChanges } from '../../services/dataService';
import { useToast } from '../../contexts/ToastContext';
import { validateRequired, validateDate, validateUrl } from '../../utils/validation';
import AdminNavbar from '../../components/AdminNavbar';
import './ManageAnnouncements.css';

const ManageAnnouncements = () => {
  const { showToast } = useToast();
  const [announcements, setAnnouncements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    whenDate: new Date().toISOString().split('T')[0], 
    image: ''
  });
  const [errors, setErrors] = useState({
    title: '',
    description: '',
    whenDate: '',
    image: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all, upcoming, past

  useEffect(() => {
    // Subscribe to real-time announcements updates
    const unsubscribe = subscribeToChanges('announcements', (data) => {
      setAnnouncements(data);
    });

    return () => unsubscribe();
  }, []);

  const getFilteredAnnouncements = () => {
    return announcements.filter(announcement => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (announcement.description && announcement.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Date filter
      if (dateFilter === 'all') return matchesSearch;
      
      const announcementDate = new Date(announcement.whenDate || announcement.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      announcementDate.setHours(0, 0, 0, 0);
      
      if (dateFilter === 'upcoming') {
        return matchesSearch && announcementDate >= today;
      }
      if (dateFilter === 'past') {
        return matchesSearch && announcementDate < today;
      }
      
      return matchesSearch;
    });
  };

  const getStatistics = () => {
    const total = announcements.length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = announcements.filter(a => {
      const date = new Date(a.whenDate || a.date);
      date.setHours(0, 0, 0, 0);
      return date >= today;
    }).length;
    const past = total - upcoming;
    
    return { total, upcoming, past };
  };

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

  const validateForm = () => {
    const newErrors = {};
    
    
    const titleValidation = validateRequired(formData.title, 'Title');
    if (!titleValidation.isValid) {
      newErrors.title = titleValidation.error;
    }
    
    
    const descriptionValidation = validateRequired(formData.description, 'Description');
    if (!descriptionValidation.isValid) {
      newErrors.description = descriptionValidation.error;
    }
    
    
    const dateValidation = validateDate(formData.whenDate, false);
    if (!dateValidation.isValid) {
      newErrors.whenDate = '⚠️ Invalid Date Selection: Past dates are not allowed. Please select today or a future date.';
    }
    
    
    if (formData.image) {
      const urlValidation = validateUrl(formData.image);
      if (!urlValidation.isValid) {
        newErrors.image = urlValidation.error;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    
    if (!validateForm()) {
      showToast('Please complete all required fields correctly.', 'error');
      return;
    }
    
    try {
      if (selectedAnnouncement) {
        
        const updatedData = {
          ...formData,
          datePosted: selectedAnnouncement.datePosted 
        };
        updateItem('announcements', selectedAnnouncement.id, updatedData);
        showToast('Announcement updated successfully!', 'success');
      } else {
        
        const newAnnouncement = {
          ...formData,
          datePosted: new Date().toISOString() 
        };
        addItem('announcements', newAnnouncement);
        showToast('Announcement added successfully!', 'success');
      }
      closeModal();
    } catch (error) {
      console.error('Error saving announcement:', error);
      showToast('Something went wrong. Please try again.', 'error');
    }
  };

  const handleEdit = (announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      description: announcement.description,
      whenDate: announcement.whenDate || announcement.date, 
      image: announcement.image || ''
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      deleteItem('announcements', selectedAnnouncement.id);
      showToast('Announcement deleted successfully!', 'success');
      setShowDeleteDialog(false);
      setSelectedAnnouncement(null);
    } catch (error) {
      console.error('Error deleting announcement:', error);
      showToast('Error deleting announcement', 'error');
    }
  };

  const openDeleteDialog = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowDeleteDialog(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAnnouncement(null);
    setFormData({
      title: '',
      description: '',
      whenDate: new Date().toISOString().split('T')[0],
      image: ''
    });
    setErrors({
      title: '',
      description: '',
      whenDate: '',
      image: ''
    });
  };

  return (
    <div className="admin-dashboard">
      <AdminNavbar />

      {}
      <div className="admin-content">
        <div className="admin-container">
          <div className="page-header">
            <div>
              <h1 className="page-title">Manage Announcements</h1>
              <p className="page-subtitle">Create, edit, and manage barangay announcements</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <span className="btn-icon btn-icon-left">➕</span>
              Add New Announcement
            </button>
          </div>

          {/* Statistics */}
          {announcements.length > 0 && (
            <div className="stats-grid">
              <div className="stat-card stat-total">
                <div className="stat-icon">📢</div>
                <div className="stat-content">
                  <div className="stat-value">{getStatistics().total}</div>
                  <div className="stat-label">Total Announcements</div>
                </div>
              </div>
              <div className="stat-card stat-upcoming">
                <div className="stat-icon">📅</div>
                <div className="stat-content">
                  <div className="stat-value">{getStatistics().upcoming}</div>
                  <div className="stat-label">Upcoming</div>
                </div>
              </div>
              <div className="stat-card stat-past">
                <div className="stat-icon">📜</div>
                <div className="stat-content">
                  <div className="stat-value">{getStatistics().past}</div>
                  <div className="stat-label">Past</div>
                </div>
              </div>
            </div>
          )}

          {/* Filters and Search */}
          {announcements.length > 0 && (
            <div className="filters-section">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search announcements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Dates</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
              </select>
            </div>
          )}

          {}
          <div className="announcements-grid">
            {getFilteredAnnouncements().length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📢</span>
                <h3>
                  {announcements.length === 0 
                    ? 'No Announcements Yet' 
                    : 'No Announcements Match Your Filters'}
                </h3>
                <p>
                  {announcements.length === 0 
                    ? 'Click "Add New Announcement" to create your first announcement' 
                    : 'Try adjusting your search or filters.'}
                </p>
              </div>
            ) : (
              getFilteredAnnouncements().map(announcement => (
              <div key={announcement.id} className="announcement-card">
                <div className="announcement-image">
                  {announcement.image ? (
                    <img src={announcement.image} alt={announcement.title} />
                  ) : (
                    <div className="image-placeholder">📢</div>
                  )}
                </div>
                <div className="announcement-content">
                  <h3 className="announcement-title">{announcement.title}</h3>
                  <div className="announcement-dates">
                    <p className="announcement-when">
                      <strong>When:</strong> {new Date(announcement.whenDate || announcement.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    {announcement.datePosted && (
                      <p className="announcement-posted">
                        <strong>Posted:</strong> {new Date(announcement.datePosted).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                  <p className="announcement-description">{announcement.description}</p>
                </div>
                <div className="announcement-actions">
                  <button className="btn-edit" onClick={() => handleEdit(announcement)}>
                    <span className="action-icon">✏️</span>
                    Edit
                  </button>
                  <button className="btn-delete" onClick={() => openDeleteDialog(announcement)}>
                    <span className="action-icon">🗑️</span>
                    Delete
                  </button>
                </div>
              </div>
              ))
            )}
          </div>
        </div>
      </div>

      {}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {selectedAnnouncement ? 'Edit Announcement' : 'Add New Announcement'}
              </h2>
              <button className="modal-close" onClick={closeModal}>✖️</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`form-input ${errors.title ? 'input-error' : ''}`}
                  placeholder="Enter announcement title"
                />
                {errors.title && (
                  <span className="field-error">{errors.title}</span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">When *</label>
                <input
                  type="date"
                  name="whenDate"
                  value={formData.whenDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={`form-input ${errors.whenDate ? 'input-error' : ''}`}
                />
                {errors.whenDate && (
                  <span className="field-error">{errors.whenDate}</span>
                )}
                <small className="form-hint">The date of the event or announcement (e.g., October 15, 2025)</small>
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={`form-textarea ${errors.description ? 'input-error' : ''}`}
                  placeholder="Enter announcement description"
                  rows="5"
                />
                {errors.description && (
                  <span className="field-error">{errors.description}</span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Photo (Optional)</label>
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  className={`form-input ${errors.image ? 'input-error' : ''}`}
                  placeholder="https://example.com/image.jpg or leave empty for default"
                />
                {errors.image && (
                  <span className="field-error">{errors.image}</span>
                )}
                <small className="form-hint">Leave empty to use default announcement image (📢)</small>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  <span className="btn-icon btn-icon-left">✕</span>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <span className="btn-icon btn-icon-left">{selectedAnnouncement ? '💾' : '✨'}</span>
                  {selectedAnnouncement ? 'Update' : 'Create'} Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {showDeleteDialog && (
        <div className="modal-overlay" onClick={() => setShowDeleteDialog(false)}>
          <div className="delete-dialog" onClick={e => e.stopPropagation()}>
            <h3 className="dialog-title">
              <span className="warning-icon">⚠️</span>
              Confirm Deletion
            </h3>
            <p className="dialog-message">
              Are you sure you want to delete "{selectedAnnouncement?.title}"? This action cannot be undone.
            </p>
            <div className="dialog-actions">
              <button className="btn btn-secondary" onClick={() => setShowDeleteDialog(false)}>
                <span className="btn-icon btn-icon-left">✕</span>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                <span className="btn-icon btn-icon-left">🗑️</span>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageAnnouncements;
