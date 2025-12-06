import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { addItem, updateItem, subscribeToChanges } from '../services/dataService';
import './Vote.css';

const Vote = () => {
  const { currentUser, userProfile } = useAuth();
  const { showToast } = useToast();
  const [votingEvents, setVotingEvents] = useState([]);
  const [userVotes, setUserVotes] = useState({});
  const [allUserVotes, setAllUserVotes] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // active, upcoming, closed

  useEffect(() => {
    if (!currentUser?.uid) return;

    // Subscribe to voting events
    const unsubscribeVoting = subscribeToChanges('voting', (votingData) => {
      setVotingEvents(votingData);
    });

    // Subscribe to user votes
    const unsubscribeVotes = subscribeToChanges('userVotes', (votes) => {
      const userVotesMap = {};
      votes.forEach(vote => {
        if (vote.userId === currentUser?.uid) {
          userVotesMap[vote.eventId] = vote.optionId;
        }
      });
      setUserVotes(userVotesMap);
      setAllUserVotes(votes); // Store all votes for participant count
    });

    return () => {
      unsubscribeVoting();
      unsubscribeVotes();
    };
  }, [currentUser?.uid]);

  const getEventStatus = (event) => {
    if (!event || !event.startDate || !event.endDate) return 'upcoming';
    
    const now = new Date();
    
    // Handle Firestore Timestamp objects
    let startDate, endDate;
    
    if (event.startDate.toDate && typeof event.startDate.toDate === 'function') {
      startDate = event.startDate.toDate();
    } else if (typeof event.startDate === 'string') {
      // If it's a date string, parse it and set to start of day in local timezone
      const startStr = event.startDate.split('T')[0]; // Get date part only
      const [year, month, day] = startStr.split('-');
      startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0);
    } else {
      startDate = new Date(event.startDate);
    }
    
    if (event.endDate.toDate && typeof event.endDate.toDate === 'function') {
      endDate = event.endDate.toDate();
    } else if (typeof event.endDate === 'string') {
      // If it's a date string, parse it and set to end of day in local timezone
      const endStr = event.endDate.split('T')[0]; // Get date part only
      const [year, month, day] = endStr.split('-');
      endDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59);
    } else {
      endDate = new Date(event.endDate);
    }
    
    // Compare dates (only date part, ignore time)
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    if (nowDate < startDateOnly) return 'upcoming';
    if (nowDate > endDateOnly) return 'closed';
    return 'active';
  };

  const getFilteredEvents = () => {
    return votingEvents.filter(event => getEventStatus(event) === activeTab);
  };

  const canViewResults = (event) => {
    // Residents can only see results after voting is closed
    if (event.resultVisibility === 'public' && getEventStatus(event) === 'closed') return true;
    if (event.resultVisibility === 'after-closing' && getEventStatus(event) === 'closed') return true;
    return false;
  };

  const hasUserVoted = (eventId) => {
    return userVotes[eventId] !== undefined;
  };

  const handleVote = async (event, optionId) => {
    if (!currentUser?.uid) {
      showToast('Please login to vote', 'error');
      return;
    }

    if (event.locked) {
      showToast('This event is locked and cannot accept votes', 'error');
      return;
    }

    if (hasUserVoted(event.id)) {
      showToast('You have already voted in this event', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // Record the vote
      const newVote = {
        eventId: event.id,
        optionId: optionId,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        votedAt: new Date().toISOString()
      };

      const voteRecord = await addItem('userVotes', newVote);

      // Update vote count for the option
      const updatedEvent = { ...event };
      updatedEvent.options = updatedEvent.options.map(opt => {
        if (opt.id === optionId) {
          return {
            ...opt,
            votes: (opt.votes || 0) + 1
          };
        }
        return opt;
      });

      // Update the voting event in Firestore
      await updateItem('voting', event.id, {
        options: updatedEvent.options
      });

      // Update local state immediately to reflect the vote
      setUserVotes(prev => ({
        ...prev,
        [event.id]: optionId
      }));

      showToast('Vote submitted successfully!', 'success');
      setShowVoteModal(false);
      setSelectedEvent(null);
      setSelectedOption(null);
    } catch (error) {
      console.error('Error submitting vote:', error);
      showToast('Failed to submit vote. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTotalVotes = (event) => {
    if (!event || !event.options) return 0;
    return event.options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
  };

  const getPercentage = (votes, total) => {
    return total === 0 ? 0 : Math.round((votes / total) * 100);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return '🟢';
      case 'upcoming':
        return '🔵';
      case 'closed':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <div className="vote-page">
      <div className="page-header">
        <h1 className="page-title">🗳️ Voting & Surveys</h1>
        <p className="page-subtitle">Participate in community voting events</p>
      </div>

      <div className="vote-container">
        {/* Tabs */}
        <div className="tabs-section">
          <button
            className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            <span className="tab-icon">🟢</span> Active
          </button>
          <button
            className={`tab-button ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            <span className="tab-icon">🔵</span> Upcoming
          </button>
          <button
            className={`tab-button ${activeTab === 'closed' ? 'active' : ''}`}
            onClick={() => setActiveTab('closed')}
          >
            <span className="tab-icon">🔴</span> Closed
          </button>
        </div>

        {/* Events Grid */}
        <div className="events-grid">
          {getFilteredEvents().length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🗳️</div>
              <h3>No {activeTab} voting events</h3>
              <p>Check back later for new voting opportunities</p>
            </div>
          ) : (
            getFilteredEvents().map((event) => (
              <div key={event.id} className="event-card">
                <div className="event-header">
                  <div>
                    <h3 className="event-title">{event.title}</h3>
                    <p className="event-type">
                      {event.type === 'candidate' ? '🗳️ Candidate' : '📊 Survey'}
                    </p>
                  </div>
                  <span className={`status-badge status-${getEventStatus(event)}`}>
                    {getStatusIcon(getEventStatus(event))} {getEventStatus(event).toUpperCase()}
                  </span>
                </div>

                {event.description && (
                  <p className="event-description">{event.description}</p>
                )}

                <div className="event-meta">
                  <span className="meta-item">
                    📅 {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                  </span>
                  {hasUserVoted(event.id) && (
                    <span className="meta-item voted">✅ You voted</span>
                  )}
                  {event.locked && (
                    <span className="meta-item locked">🔒 Locked</span>
                  )}
                </div>

                <div className="event-actions">
                  {getEventStatus(event) === 'active' && !hasUserVoted(event.id) && !event.locked ? (
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowVoteModal(true);
                      }}
                    >
                      <span className="btn-icon btn-icon-left">🗳️</span>
                      Vote Now
                    </button>
                  ) : getEventStatus(event) === 'active' && event.locked ? (
                    <button className="btn btn-secondary" disabled title="Event is locked">
                      <span className="btn-icon btn-icon-left">🔒</span>
                      Locked
                    </button>
                  ) : getEventStatus(event) === 'active' && hasUserVoted(event.id) ? (
                    <button className="btn btn-secondary" disabled>
                      <span className="btn-icon btn-icon-left">✅</span>
                      Already Voted
                    </button>
                  ) : getEventStatus(event) === 'upcoming' ? (
                    <button className="btn btn-secondary" disabled>
                      <span className="btn-icon btn-icon-left">⏳</span>
                      Coming Soon
                    </button>
                  ) : null}

                  {canViewResults(event) && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowVoteModal(true);
                      }}
                    >
                      <span className="btn-icon btn-icon-left">📊</span>
                      View Results
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Vote/Results Modal */}
      {showVoteModal && selectedEvent && (
        <div className="modal-overlay" onClick={() => setShowVoteModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{getEventStatus(selectedEvent) === 'closed' ? 'Results' : 'Vote'}</h2>
              <button
                className="btn-close-modal"
                onClick={() => setShowVoteModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="event-info">
                <h3>{selectedEvent.title}</h3>
                <p>{selectedEvent.description}</p>
              </div>

              <div className="options-list">
                {selectedEvent.options.map((option) => {
                  const totalVotes = getTotalVotes(selectedEvent);
                  const percentage = getPercentage(option.votes || 0, totalVotes);
                  const isSelected = selectedOption?.id === option.id;

                  return (
                    <div
                      key={option.id}
                      className={`option-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        if (getEventStatus(selectedEvent) === 'active' && !hasUserVoted(selectedEvent.id)) {
                          setSelectedOption(option);
                        }
                      }}
                    >
                      {option.image && (
                        <div className="option-image">
                          {option.image.startsWith('http') ? (
                            <img src={option.image} alt={option.text} />
                          ) : (
                            <span className="option-icon">{option.image}</span>
                          )}
                        </div>
                      )}

                      <div className="option-content">
                        <span className="option-text">{option.text}</span>
                        {option.description && (
                          <span className="option-description">{option.description}</span>
                        )}
                        {canViewResults(selectedEvent) && (
                          <div className="option-stats">
                            <div className="progress-bar">
                              <div
                                className="progress-fill"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="stats-text">
                              {option.votes || 0} votes ({percentage}%)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="modal-footer">
              {getEventStatus(selectedEvent) === 'active' && !hasUserVoted(selectedEvent.id) && selectedOption && (
                <button
                  className="btn btn-primary"
                  onClick={() => handleVote(selectedEvent, selectedOption.id)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="btn-loading"></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <span className="btn-icon btn-icon-left">✓</span>
                      Submit Vote
                    </>
                  )}
                </button>
              )}
              <button
                className="btn btn-secondary"
                onClick={() => setShowVoteModal(false)}
              >
                <span className="btn-icon btn-icon-left">✕</span>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vote;
