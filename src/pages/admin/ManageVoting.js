import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getSharedData, addItem, updateItem, deleteItem, subscribeToChanges } from '../../services/dataService';
import { useToast } from '../../contexts/ToastContext';
import { validateDate } from '../../utils/validation';
import AdminNavbar from '../../components/AdminNavbar';
import './ManageVoting.css';

const ManageVoting = () => {
  const { showToast } = useToast();
  const { currentUser, userProfile } = useAuth();
  const [votingEvents, setVotingEvents] = useState([]);
  const [userVotes, setUserVotes] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteEventConfirmModal, setShowDeleteEventConfirmModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newOption, setNewOption] = useState('');
  const [newOptionDescription, setNewOptionDescription] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'candidate',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    resultVisibility: 'public',
    options: [],
    locked: false
  });
  const [errors, setErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'

  useEffect(() => {
    // Subscribe to real-time voting events
    const unsubscribeVoting = subscribeToChanges('voting', (votingData) => {
      setVotingEvents(votingData);
    });

    // Subscribe to real-time user votes
    const unsubscribeVotes = subscribeToChanges('userVotes', (votesData) => {
      setUserVotes(votesData);
    });

    return () => {
      unsubscribeVoting();
      unsubscribeVotes();
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddOption = () => {
    if (!newOption.trim()) {
      showToast('Please enter an option', 'error');
      return;
    }

    const option = {
      id: `opt-${Date.now()}`,
      text: newOption,
      description: newOptionDescription.trim() || '', // Optional description
      votes: 0
    };

    setFormData(prev => ({
      ...prev,
      options: [...prev.options, option]
    }));
    setNewOption('');
    setNewOptionDescription('');
  };

  const handleRemoveOption = (optionId) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter(opt => opt.id !== optionId)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (formData.options.length === 0) {
      newErrors.options = 'At least one option is required';
    }

    // Validate start date
    const startDateValidation = validateDate(formData.startDate, false);
    if (!startDateValidation.isValid) {
      newErrors.startDate = '⚠️ Invalid Date Selection: Past dates are not allowed. Please select today or a future date.';
    }

    // Validate end date
    const endDateValidation = validateDate(formData.endDate, false);
    if (!endDateValidation.isValid) {
      newErrors.endDate = '⚠️ Invalid Date Selection: Past dates are not allowed. Please select today or a future date.';
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (endDate <= startDate) {
      newErrors.endDate = 'End date must be after start date';
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
      if (selectedEvent) {
        // Update existing event
        await updateItem('voting', selectedEvent.id, {
          ...formData,
          updatedAt: new Date().toISOString()
        });
        showToast('Event updated successfully!', 'success');
      } else {
        // Create new event
        await addItem('voting', {
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        showToast('Event created successfully!', 'success');
      }

      resetForm();
      setShowCreateModal(false);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error submitting form:', error);
      showToast('Failed to save event', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'candidate',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      resultVisibility: 'public',
      options: [],
      locked: false
    });
    setNewOption('');
    setNewOptionDescription('');
    setErrors({});
    setSelectedEvent(null);
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setFormData(event);
    setShowEditModal(true);
  };

  const handleLockEvent = async (event) => {
    try {
      await updateItem('voting', event.id, {
        locked: !event.locked
      });
      showToast(event.locked ? 'Event unlocked' : 'Event locked', 'success');
    } catch (error) {
      console.error('Error toggling lock:', error);
      showToast('Failed to toggle lock', 'error');
    }
  };

  const getTotalVotes = (event) => {
    if (!event || !event.options) return 0;
    return event.options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
  };

  const getPercentage = (votes, total) => {
    return total === 0 ? 0 : Math.round((votes / total) * 100);
  };

  const getVoteDetails = (event) => {
    // Filter userVotes for this specific event
    if (!event || !userVotes) return [];
    return userVotes.filter(vote => vote.eventId === event.id);
  };

  const getEventStatus = (event) => {
    if (!event || !event.startDate || !event.endDate) return 'upcoming';
    
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    if (now > endDate) return 'closed';
    if (now >= startDate) return 'active';
    return 'upcoming';
  };

  const getFilteredEvents = () => {
    return votingEvents.filter(event => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Status filter
      const eventStatus = getEventStatus(event);
      const matchesStatus = statusFilter === 'all' || eventStatus === statusFilter;
      
      // Type filter
      const matchesType = typeFilter === 'all' || event.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  };

  const getStatistics = () => {
    const total = votingEvents.length;
    const active = votingEvents.filter(e => getEventStatus(e) === 'active').length;
    const upcoming = votingEvents.filter(e => getEventStatus(e) === 'upcoming').length;
    const closed = votingEvents.filter(e => getEventStatus(e) === 'closed').length;
    const totalVotes = votingEvents.reduce((sum, e) => sum + getTotalVotes(e), 0);
    
    return { total, active, upcoming, closed, totalVotes };
  };

  const handleDeleteEventClick = () => {
    // Open confirmation modal for deleting the entire event
    setShowDeleteEventConfirmModal(true);
  };

  const confirmDeleteEvent = async () => {
    if (!selectedEvent) return;

    setIsSubmitting(true);

    try {
      const archivedBy = currentUser?.uid || null;
      const archivedByEmail = currentUser?.email || userProfile?.email || null;
      // Delete the voting event from Firestore (will be archived first)
      await deleteItem('voting', selectedEvent.id, archivedBy, archivedByEmail);

      showToast('Voting event deleted successfully!', 'success');
      
      // Close modals
      setShowDetailsModal(false);
      setShowDeleteEventConfirmModal(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error deleting event:', error);
      showToast('Failed to delete voting event', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AdminNavbar />
      <div className="manage-voting-page">
        <div className="page-header">
          <h1 className="page-title">🗳️ Voting & Surveys Management</h1>
          <p className="page-subtitle">Create and manage voting events and surveys</p>
        </div>

        {/* Statistics Cards */}
        {votingEvents.length > 0 && (
          <div className="stats-grid">
            <div className="stat-card stat-total">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-value">{getStatistics().total}</div>
                <div className="stat-label">Total Events</div>
              </div>
            </div>
            <div className="stat-card stat-active">
              <div className="stat-icon">🟢</div>
              <div className="stat-content">
                <div className="stat-value">{getStatistics().active}</div>
                <div className="stat-label">Active</div>
              </div>
            </div>
            <div className="stat-card stat-upcoming">
              <div className="stat-icon">🔵</div>
              <div className="stat-content">
                <div className="stat-value">{getStatistics().upcoming}</div>
                <div className="stat-label">Upcoming</div>
              </div>
            </div>
            <div className="stat-card stat-closed">
              <div className="stat-icon">🔴</div>
              <div className="stat-content">
                <div className="stat-value">{getStatistics().closed}</div>
                <div className="stat-label">Closed</div>
              </div>
            </div>
            <div className="stat-card stat-votes">
              <div className="stat-icon">🗳️</div>
              <div className="stat-content">
                <div className="stat-value">{getStatistics().totalVotes}</div>
                <div className="stat-label">Total Votes</div>
              </div>
            </div>
          </div>
        )}

        <div className="voting-container">
          <div className="voting-header">
            <button
              className="btn btn-primary btn-create-event"
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
            >
              <span className="btn-icon btn-icon-left">➕</span>
              Create New Event
            </button>

            <div className="view-controls">
              <button
                className={`view-toggle ${viewMode === 'cards' ? 'active' : ''}`}
                onClick={() => setViewMode('cards')}
                title="Card View"
              >
                <span>📋</span>
              </button>
              <button
                className={`view-toggle ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                <span>📊</span>
              </button>
            </div>
          </div>

          {/* Filters and Search */}
          {votingEvents.length > 0 && (
            <div className="filters-section">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="filter-group">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="closed">Closed</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Types</option>
                  <option value="candidate">Candidate</option>
                  <option value="survey">Survey</option>
                </select>
              </div>
            </div>
          )}

          {getFilteredEvents().length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🗳️</div>
              <h3>
                {votingEvents.length === 0 
                  ? 'No Voting Events Yet' 
                  : 'No Events Match Your Filters'}
              </h3>
              <p>
                {votingEvents.length === 0 
                  ? 'Create your first voting event to get started.' 
                  : 'Try adjusting your search or filters.'}
              </p>
            </div>
          ) : viewMode === 'cards' ? (
            <div className="events-grid">
              {getFilteredEvents().map((event) => {
                const status = getEventStatus(event);
                return (
                  <div key={event.id} className="event-card">
                    <div className="event-card-header">
                      <div className="event-card-title-section">
                        <h3 className="event-card-title">{event.title}</h3>
                        <span className="event-card-type">
                          {event.type === 'candidate' ? '🗳️ Candidate' : '📊 Survey'}
                        </span>
                      </div>
                      <div className="event-card-status">
                        <span className={`status-badge status-${status}`}>
                          {status === 'active' ? '🟢' : status === 'upcoming' ? '🔵' : '🔴'} {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                        {event.locked && (
                          <span className="status-badge status-locked">
                            🔒 Locked
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {event.description && (
                      <p className="event-card-description">{event.description}</p>
                    )}
                    
                    <div className="event-card-stats">
                      <div className="event-stat">
                        <span className="stat-label">Votes:</span>
                        <span className="stat-value">{getTotalVotes(event)}</span>
                      </div>
                      <div className="event-stat">
                        <span className="stat-label">Options:</span>
                        <span className="stat-value">{event.options?.length || 0}</span>
                      </div>
                    </div>
                    
                    <div className="event-card-dates">
                      <div className="date-item">
                        <span className="date-label">📅 Start:</span>
                        <span className="date-value">{new Date(event.startDate).toLocaleDateString()}</span>
                      </div>
                      <div className="date-item">
                        <span className="date-label">📅 End:</span>
                        <span className="date-value">{new Date(event.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="event-card-actions">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowDetailsModal(true);
                        }}
                        title="View details"
                      >
                        <span className="btn-icon btn-icon-left">👁️</span>
                        View
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleEditEvent(event)}
                        disabled={event.locked}
                        title={event.locked ? 'Cannot edit locked event' : 'Edit'}
                      >
                        <span className="btn-icon btn-icon-left">✏️</span>
                        Edit
                      </button>
                      <button
                        className={`btn btn-sm ${event.locked ? 'btn-warning' : 'btn-secondary'}`}
                        onClick={() => handleLockEvent(event)}
                        title={event.locked ? 'Unlock event' : 'Lock event'}
                      >
                        <span className="btn-icon btn-icon-left">{event.locked ? '🔒' : '🔓'}</span>
                        {event.locked ? 'Locked' : 'Lock'}
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => {
                          setSelectedEvent(event);
                          handleDeleteEventClick();
                        }}
                        disabled={event.locked && status !== 'closed'}
                        title={
                          event.locked && status !== 'closed' 
                            ? 'Cannot delete locked event' 
                            : 'Delete'
                        }
                      >
                        <span className="btn-icon btn-icon-left">🗑️</span>
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="events-table-container">
              <table className="events-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Votes</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredEvents().map((event) => {
                    const status = getEventStatus(event);
                    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

                    return (
                      <tr key={event.id}>
                        <td>{event.title}</td>
                        <td>{event.type === 'candidate' ? '🗳️ Candidate' : '📊 Survey'}</td>
                        <td>
                          <span className={`status-badge status-${status}`}>
                            {status === 'active' ? '🟢' : status === 'upcoming' ? '🔵' : '🔴'} {statusLabel}
                          </span>
                          {event.locked && (
                            <span className="status-badge status-locked" style={{marginLeft: '0.5rem'}}>
                              🔒 Locked
                            </span>
                          )}
                        </td>
                        <td>{getTotalVotes(event)}</td>
                        <td>{new Date(event.startDate).toLocaleDateString()}</td>
                        <td>{new Date(event.endDate).toLocaleDateString()}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn btn-sm btn-secondary btn-action"
                              onClick={() => {
                                setSelectedEvent(event);
                                setShowDetailsModal(true);
                              }}
                              title="View details"
                            >
                              <span className="btn-icon">👁️</span>
                            </button>
                            <button
                              className="btn btn-sm btn-secondary btn-action"
                              onClick={() => handleEditEvent(event)}
                              disabled={event.locked}
                              title={event.locked ? 'Cannot edit locked event' : 'Edit'}
                            >
                              <span className="btn-icon">✏️</span>
                            </button>
                            <button
                              className={`btn btn-sm ${event.locked ? 'btn-warning' : 'btn-secondary'} btn-action`}
                              onClick={() => handleLockEvent(event)}
                              title={event.locked ? 'Unlock event' : 'Lock event'}
                            >
                              <span className="btn-icon">{event.locked ? '🔒' : '🔓'}</span>
                            </button>
                            <button
                              className="btn btn-sm btn-danger btn-action"
                              onClick={() => {
                                setSelectedEvent(event);
                                handleDeleteEventClick();
                              }}
                              disabled={event.locked && status !== 'closed'}
                              title={
                                event.locked && status !== 'closed' 
                                  ? 'Cannot delete locked event' 
                                  : 'Delete'
                              }
                            >
                              <span className="btn-icon">🗑️</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {(showCreateModal || showEditModal) && (
          <div className="modal-overlay" onClick={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            resetForm();
          }}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{selectedEvent ? 'Edit Event' : 'Create New Event'}</h2>
                <button
                  className="btn-close-modal"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <form id="event-form" onSubmit={handleSubmit} className="event-form">
                  <div className="form-group">
                  <label htmlFor="title">Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter event title..."
                    className={`form-control ${errors.title ? 'error' : ''}`}
                  />
                  {errors.title && <span className="error-text">{errors.title}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe the voting event..."
                    className={`form-control textarea ${errors.description ? 'error' : ''}`}
                    rows="3"
                  />
                  {errors.description && <span className="error-text">{errors.description}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="type">Type *</label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="form-control"
                    >
                      <option value="candidate">🗳️ Candidate-based</option>
                      <option value="survey">📊 Survey-based</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="resultVisibility">Result Visibility *</label>
                    <select
                      id="resultVisibility"
                      name="resultVisibility"
                      value={formData.resultVisibility}
                      onChange={handleInputChange}
                      className="form-control"
                    >
                      <option value="public">Public</option>
                      <option value="admin-only">Admin Only</option>
                      <option value="after-closing">After Closing</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="startDate">Start Date *</label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      className={`form-control ${errors.startDate ? 'error' : ''}`}
                    />
                    {errors.startDate && <span className="error-text">{errors.startDate}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="endDate">End Date *</label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      className={`form-control ${errors.endDate ? 'error' : ''}`}
                    />
                    {errors.endDate && <span className="error-text">{errors.endDate}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label>Options *</label>
                  <div className="options-input-group">
                    <div className="options-input">
                      <input
                        type="text"
                        value={newOption}
                        onChange={(e) => setNewOption(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOption())}
                        placeholder="Enter option title..."
                        className="form-control"
                      />
                    </div>
                    <div className="options-input">
                      <input
                        type="text"
                        value={newOptionDescription}
                        onChange={(e) => setNewOptionDescription(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOption())}
                        placeholder="Enter option description (optional)..."
                        className="form-control"
                      />
                      <button
                        type="button"
                        className="btn btn-success btn-add-option"
                        onClick={handleAddOption}
                      >
                        <span className="btn-icon btn-icon-left">➕</span>
                        Add
                      </button>
                    </div>
                  </div>
                  {errors.options && <span className="error-text">{errors.options}</span>}

                  <div className="options-list">
                    {formData.options.map((option) => (
                      <div key={option.id} className="option-tag">
                        <div className="option-tag-content">
                          <span className="option-title">{option.text}</span>
                          {option.description && (
                            <span className="option-description">{option.description}</span>
                          )}
                        </div>
                        <button
                          type="button"
                          className="btn-remove-option"
                          onClick={() => handleRemoveOption(option.id)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                </form>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                >
                  <span className="btn-icon btn-icon-left">✕</span>
                  Cancel
                </button>
                <button
                  type="submit"
                  form="event-form"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="btn-loading"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <span className="btn-icon btn-icon-left">💾</span>
                      Save Event
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedEvent && (
          <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
            <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{selectedEvent.title}</h2>
                <button
                  className="btn-close-modal"
                  onClick={() => setShowDetailsModal(false)}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="label">Type:</span>
                    <span className="value">{selectedEvent.type === 'candidate' ? '🗳️ Candidate' : '📊 Survey'}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Total Votes:</span>
                    <span className="value">{getTotalVotes(selectedEvent)}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Start Date:</span>
                    <span className="value">{new Date(selectedEvent.startDate).toLocaleString()}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">End Date:</span>
                    <span className="value">{new Date(selectedEvent.endDate).toLocaleString()}</span>
                  </div>
                </div>

                {selectedEvent.description && (
                  <div className="description-section">
                    <h3>Description</h3>
                    <p>{selectedEvent.description}</p>
                  </div>
                )}

                <div className="options-section">
                  <h3>Options & Results</h3>
                  <div className="options-results">
                    {selectedEvent.options.map((option) => {
                      const totalVotes = getTotalVotes(selectedEvent);
                      const percentage = getPercentage(option.votes || 0, totalVotes);
                      return (
                        <div key={option.id} className="option-result">
                          <div className="option-info">
                            <div className="option-header">
                              <span className="option-text">{option.text}</span>
                              <span className="vote-count">{option.votes || 0} votes</span>
                            </div>
                            {option.description && (
                              <span className="option-description">{option.description}</span>
                            )}
                          </div>
                          <div className="progress-container">
                            <div className="progress-bar">
                              <div className="progress-fill" style={{ width: `${percentage}%` }}></div>
                            </div>
                            <span className="percentage">{percentage}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {getVoteDetails(selectedEvent).length > 0 && (
                  <div className="voters-section">
                    <h3>Voters</h3>
                    <div className="voters-container">
                      <table className="voters-table">
                        <thead>
                          <tr>
                            <th>Email</th>
                            <th>Voted For</th>
                            <th>Voted At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getVoteDetails(selectedEvent).map((vote, index) => {
                            const option = selectedEvent.options.find(opt => opt.id === vote.optionId);
                            return (
                              <tr key={index}>
                                <td>{vote.userEmail}</td>
                                <td>{option?.text || 'Unknown'}</td>
                                <td>{new Date(vote.votedAt).toLocaleString()}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowDetailsModal(false)}
                >
                  <span className="btn-icon btn-icon-left">✕</span>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Event Confirmation Modal */}
        {showDeleteEventConfirmModal && selectedEvent && (
          <div className="modal-overlay" onClick={() => setShowDeleteEventConfirmModal(false)}>
            <div className="modal-content modal-confirm" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Confirm Delete Event</h2>
                <button
                  className="btn-close-modal"
                  onClick={() => setShowDeleteEventConfirmModal(false)}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <p className="confirm-message">
                  Are you sure you want to delete the voting event <strong>"{selectedEvent.title}"</strong>?
                </p>
                <p className="confirm-warning">
                  ⚠️ This action cannot be undone. All votes for this event will be deleted.
                </p>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteEventConfirmModal(false)}
                  disabled={isSubmitting}
                >
                  <span className="btn-icon btn-icon-left">✕</span>
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={confirmDeleteEvent}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="btn-loading"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <span className="btn-icon btn-icon-left">🗑️</span>
                      Delete Event
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ManageVoting;
