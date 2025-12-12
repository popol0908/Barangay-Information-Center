import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getSharedData, addItem, updateItem, deleteItem, subscribeToChanges } from '../../services/dataService';
import { useToast } from '../../contexts/ToastContext';
import AdminNavbar from '../../components/AdminNavbar';
import './ManageOfficials.css';

const ManageOfficials = () => {
  const { showToast } = useToast();
  const { currentUser, userProfile } = useAuth();
  const [officials, setOfficials] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedOfficial, setSelectedOfficial] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    contact: '',
    email: '',
    image: 'male',
    color: '#4ECDC4'
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    // Subscribe to real-time officials updates
    const unsubscribe = subscribeToChanges('officials', (data) => {
      setOfficials(data);
    });

    return () => unsubscribe();
  }, []);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    }
    
    if (!formData.position.trim()) {
      errors.position = 'Position is required';
    }
    
    if (!formData.contact.trim()) {
      errors.contact = 'Contact number is required';
    } else if (!/^(\+63|0)[0-9]{10}$/.test(formData.contact.replace(/\s/g, ''))) {
      errors.contact = 'Please enter a valid Philippine contact number';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (selectedOfficial) {
      
      updateItem('officials', selectedOfficial.id, formData);
      showToast('Official updated successfully!', 'success');
    } else {
      
      addItem('officials', formData);
      showToast('Official added successfully!', 'success');
    }
    closeModal();
  };

  const handleEdit = (official) => {
    setSelectedOfficial(official);
    setFormData({
      name: official.name,
      position: official.position,
      contact: official.contact,
      email: official.email || '',
      image: official.image || 'male',
      color: official.color || '#4ECDC4'
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      const archivedBy = currentUser?.uid || null;
      const archivedByEmail = currentUser?.email || userProfile?.email || null;
      await deleteItem('officials', selectedOfficial.id, archivedBy, archivedByEmail);
      showToast('Official deleted successfully!', 'success');
      setShowDeleteDialog(false);
      setSelectedOfficial(null);
    } catch (error) {
      console.error('Error deleting official:', error);
      showToast('Error deleting official', 'error');
    }
  };

  const openDeleteDialog = (official) => {
    setSelectedOfficial(official);
    setShowDeleteDialog(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOfficial(null);
    setFormData({
      name: '',
      position: '',
      contact: '',
      email: '',
      image: 'male',
      color: '#4ECDC4'
    });
    setFormErrors({});
  };

  
  const filteredOfficials = officials.filter(official =>
    (official.name && official.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (official.position && official.position.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="admin-dashboard">
      <AdminNavbar />

      {}
      <div className="admin-content">
        <div className="admin-container">
          <div className="page-header">
            <div>
              <h1 className="page-title">Manage Barangay Officials</h1>
              <p className="page-subtitle">Add, edit, and manage barangay officials information</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <span className="btn-icon btn-icon-left">➕</span>
              Add New Official
            </button>
          </div>

          {}
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="🔍 Search by name or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {}
          <div className="officials-grid">
            {filteredOfficials.map(official => (
              <div key={official.id} className="official-card">
                <div className="official-photo">
                  <div className={`photo-avatar ${official.image === 'female' ? 'female' : 'male'}`}>
                    {official.image === 'female' ? '👩‍💼' : '👨‍💼'}
                  </div>
                </div>
                <div className="official-content">
                  <h3 className="official-name">{official.name}</h3>
                  <p className="official-position">{official.position}</p>
                  <p className="official-contact">
                    <span className="contact-icon">📞</span>
                    {official.contact}
                  </p>
                  {official.email && (
                    <p className="official-email">
                      <span className="contact-icon"></span>
                      {official.email}
                    </p>
                  )}
                </div>
                <div className="official-actions">
                  <button className="btn-edit" onClick={() => handleEdit(official)}>
                    <span className="action-icon">✏️</span>
                    Edit
                  </button>
                  <button className="btn-delete" onClick={() => openDeleteDialog(official)}>
                    <span className="action-icon">🗑️</span>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredOfficials.length === 0 && (
            <div className="empty-state">
              <span className="empty-icon">👥</span>
              <h3>
                {searchTerm ? 'No Officials Found' : 'No Officials Yet'}
              </h3>
              <p>
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Click "Add New Official" to add your first official'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {selectedOfficial ? 'Edit Official' : 'Add New Official'}
              </h2>
              <button className="modal-close" onClick={closeModal}>✖️</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`form-input ${formErrors.name ? 'error' : ''}`}
                  placeholder="Enter full name (e.g., Hon. Juan Dela Cruz)"
                />
                {formErrors.name && (
                  <span className="error-message">{formErrors.name}</span>
                )}
              </div>
              
              <div className="form-group">
                <label className="form-label">Position *</label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className={`form-input ${formErrors.position ? 'error' : ''}`}
                >
                  <option value="">Select position...</option>
                  <option value="Barangay Captain">Barangay Captain</option>
                  <option value="Barangay Kagawad - Peace & Order">Barangay Kagawad - Peace & Order</option>
                  <option value="Barangay Kagawad - Health">Barangay Kagawad - Health</option>
                  <option value="Barangay Kagawad - Education">Barangay Kagawad - Education</option>
                  <option value="Barangay Kagawad - Infrastructure">Barangay Kagawad - Infrastructure</option>
                  <option value="Barangay Kagawad - Agriculture">Barangay Kagawad - Agriculture</option>
                  <option value="Barangay Kagawad - Environment">Barangay Kagawad - Environment</option>
                  <option value="SK Chairman">SK Chairman</option>
                  <option value="Barangay Secretary">Barangay Secretary</option>
                  <option value="Barangay Treasurer">Barangay Treasurer</option>
                </select>
                {formErrors.position && (
                  <span className="error-message">{formErrors.position}</span>
                )}
              </div>
              
              <div className="form-group">
                <label className="form-label">Contact Number *</label>
                <input
                  type="tel"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  className={`form-input ${formErrors.contact ? 'error' : ''}`}
                  placeholder="+63 917 123 4567"
                />
                {formErrors.contact && (
                  <span className="error-message">{formErrors.contact}</span>
                )}
              </div>
              
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-input ${formErrors.email ? 'error' : ''}`}
                  placeholder="email@example.com"
                />
                {formErrors.email && (
                  <span className="error-message">{formErrors.email}</span>
                )}
                <small className="form-hint">Optional</small>
              </div>
              
              <div className="form-group">
                <label className="form-label">Photo *</label>
                <div className="photo-selector">
                  <label className={`photo-option ${formData.image === 'male' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="image"
                      value="male"
                      checked={formData.image === 'male'}
                      onChange={handleChange}
                    />
                    <div className="photo-preview">
                      <span className="photo-icon">👨‍💼</span>
                      <span className="photo-label">Male</span>
                    </div>
                  </label>
                  <label className={`photo-option ${formData.image === 'female' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="image"
                      value="female"
                      checked={formData.image === 'female'}
                      onChange={handleChange}
                    />
                    <div className="photo-preview">
                      <span className="photo-icon">👩‍💼</span>
                      <span className="photo-label">Female</span>
                    </div>
                  </label>
                </div>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  <span className="btn-icon btn-icon-left">✕</span>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <span className="btn-icon btn-icon-left">{selectedOfficial ? '💾' : '➕'}</span>
                  {selectedOfficial ? 'Save Changes' : 'Add Official'}
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
              Are you sure you want to remove <strong>{selectedOfficial?.fullName}</strong> from the list? This action cannot be undone.
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

export default ManageOfficials;
