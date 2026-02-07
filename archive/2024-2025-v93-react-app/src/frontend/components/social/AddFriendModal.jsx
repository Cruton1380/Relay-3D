/**
 * @fileoverview Add Friend Modal Component
 * Modal interface for discovering and adding new friends
 */
import React, { useState, useEffect } from 'react';
import { Button } from '../shared/index.js';
import { useSocialService } from '../../hooks/useSocial.js';
import ConfirmDialog from '../dialogs/ConfirmDialog.jsx';
import QRCodeGenerator from '../shared/QRCodeGenerator.jsx';
import './AddFriendModal.css';

const AddFriendModal = ({ onClose, onFriendAdded }) => {
  const socialService = useSocialService();
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [proximityUsers, setProximityUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [friendMessage, setFriendMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showMyQR, setShowMyQR] = useState(false);

  useEffect(() => {
    loadSuggestions();
    loadProximityUsers();
  }, []);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const result = await socialService.discoverUsers({
        mutualFriends: true,
        limit: 10
      });
      setSuggestions(result.users || []);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProximityUsers = async () => {
    try {
      const result = await socialService.discoverUsers({
        proximity: true,
        limit: 20
      });
      setProximityUsers(result.users || []);
    } catch (error) {
      console.error('Failed to load proximity users:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const result = await socialService.searchUsers(searchQuery);
      setSearchResults(result.users || []);
    } catch (error) {
      console.error('Failed to search users:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSendRequest = (user) => {
    setSelectedUser(user);
    setShowConfirm(true);
  };

  const handleConfirmRequest = async () => {
    if (!selectedUser) return;

    try {
      await socialService.sendFriendRequest(selectedUser.id, friendMessage);
      alert('Friend request sent successfully!');
      if (onFriendAdded) {
        onFriendAdded();
      }
    } catch (error) {
      console.error('Failed to send friend request:', error);
      alert('Failed to send friend request. Please try again.');
    } finally {
      setShowConfirm(false);
      setSelectedUser(null);
      setFriendMessage('');
    }
  };

  const handleCancelRequest = () => {
    setShowConfirm(false);
    setSelectedUser(null);
    setFriendMessage('');
  };

  const getFriendshipStatus = (user) => {
    if (socialService.isFriend(user.id)) return 'friends';
    if (socialService.isBlocked(user.id)) return 'blocked';
    // Check for pending requests would require additional API call
    return 'none';
  };

  const renderUserItem = (user, showMutual = false) => {
    const status = getFriendshipStatus(user);
    
    return (
      <div key={user.id} className="user-item">
        <div className="user-avatar">
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.name}
              className="avatar-image"
            />
          ) : (
            <div className="avatar-placeholder">
              {user.name?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          {user.isOnline && (
            <div className="presence-indicator online" />
          )}
        </div>

        <div className="user-info">
          <h4 className="user-name">{user.name || 'Unknown User'}</h4>
          {user.username && (
            <p className="user-username">@{user.username}</p>
          )}
          {showMutual && user.mutualFriends > 0 && (
            <p className="mutual-friends">
              {user.mutualFriends} mutual friend{user.mutualFriends !== 1 ? 's' : ''}
            </p>
          )}
          {user.distance && (
            <p className="user-distance">{user.distance}m away</p>
          )}
        </div>

        <div className="user-actions">
          {status === 'friends' && (
            <Button variant="ghost" size="small" disabled>
              Friends
            </Button>
          )}
          {status === 'blocked' && (
            <Button variant="ghost" size="small" disabled>
              Blocked
            </Button>
          )}
          {status === 'none' && (
            <>
              <Button
                variant="outline"
                size="small"
                onClick={() => handleSendFriendRequestViaQR(user)}
                disabled={loading}
              >
                📤 Share Request
              </Button>
              <Button
                variant="primary"
                size="small"
                onClick={() => handleSendRequest(user)}
                disabled={loading}
              >
                Add Friend
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  const handleShareMyProfile = () => {
    setShowMyQR(true);
  };

  const handleSendFriendRequestViaQR = (user) => {
    setSelectedUser(user);
    setShowQRCode(true);
  };

  return (
    <div className="add-friend-modal">
      <div className="add-friend-backdrop" onClick={onClose} />
      <div className="add-friend-content">
        <div className="add-friend-header">
          <h2>Add Friends</h2>
          <div className="header-actions">
            <Button 
              variant="outline" 
              size="small" 
              onClick={handleShareMyProfile}
              className="share-profile-btn"
            >
              📤 Share My Profile
            </Button>
            <Button variant="secondary" size="small" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <div className="modal-tabs">
          <button
            className={`modal-tab ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            Search
          </button>
          <button
            className={`modal-tab ${activeTab === 'suggestions' ? 'active' : ''}`}
            onClick={() => setActiveTab('suggestions')}
          >
            Suggestions
          </button>
          <button
            className={`modal-tab ${activeTab === 'nearby' ? 'active' : ''}`}
            onClick={() => setActiveTab('nearby')}
          >
            Nearby
          </button>
        </div>

        <div className="modal-content">
          {activeTab === 'search' && (
            <div className="search-tab">
              <div className="search-input-container">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search by name or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Button 
                  variant="primary" 
                  onClick={handleSearch}
                  disabled={!searchQuery.trim()}
                >
                  Search
                </Button>
              </div>

              <div className="search-results">
                {loading && (
                  <div className="loading-state">
                    <div className="spinner" />
                    <p>Searching...</p>
                  </div>
                )}

                {!loading && searchResults.length === 0 && searchQuery && (
                  <div className="empty-state">
                    <p>No users found matching "{searchQuery}"</p>
                  </div>
                )}

                {!loading && searchResults.length > 0 && (
                  <div className="users-list">
                    {searchResults.map(user => renderUserItem(user))}
                  </div>
                )}

                {!searchQuery && (
                  <div className="search-placeholder">
                    <div className="search-icon">
                      <svg viewBox="0 0 24 24">
                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                      </svg>
                    </div>
                    <p>Enter a name or username to search for friends</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'suggestions' && (
            <div className="suggestions-tab">
              {loading && (
                <div className="loading-state">
                  <div className="spinner" />
                  <p>Loading suggestions...</p>
                </div>
              )}

              {!loading && suggestions.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">
                    <svg viewBox="0 0 24 24">
                      <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2 .97L13.56 11l1.07 1.07L16 10.75V22h4z"/>
                    </svg>
                  </div>
                  <p>No friend suggestions available right now</p>
                </div>
              )}

              {!loading && suggestions.length > 0 && (
                <div className="users-list">
                  {suggestions.map(user => renderUserItem(user, true))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'nearby' && (
            <div className="nearby-tab">
              {proximityUsers.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">
                    <svg viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                  </div>
                  <p>No users found nearby</p>
                  <small>Make sure location services are enabled</small>
                </div>
              )}

              {proximityUsers.length > 0 && (
                <div className="users-list">
                  {proximityUsers.map(user => renderUserItem(user))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* My Profile QR Code Modal */}
        {showMyQR && (
          <QRCodeGenerator
            type="friend"
            data={{
              userId: socialService.currentUser,
              action: 'profile',
              message: 'Add me as a friend on Relay!'
            }}
            onClose={() => setShowMyQR(false)}
          />
        )}

        {/* Friend Request QR Code Modal */}
        {showQRCode && selectedUser && (
          <QRCodeGenerator
            type="friend"
            data={{
              userId: socialService.currentUser,
              targetUserId: selectedUser.id,
              targetUserName: selectedUser.name,
              action: 'request',
              message: friendMessage || `Friend request from ${socialService.currentUser}`
            }}
            onClose={() => {
              setShowQRCode(false);
              setSelectedUser(null);
            }}
          />
        )}

        {/* Friend Request Confirmation */}
        {showConfirm && selectedUser && (
          <ConfirmDialog
            title="Send Friend Request"
            message={
              <div className="friend-request-form">
                <p>Send a friend request to {selectedUser.name}?</p>
                <textarea
                  className="message-input"
                  placeholder="Add a message (optional)"
                  value={friendMessage}
                  onChange={(e) => setFriendMessage(e.target.value)}
                  maxLength={200}
                />
                <div className="character-count">
                  {friendMessage.length}/200
                </div>
              </div>
            }
            confirmText="Send Request"
            cancelText="Cancel"
            onConfirm={handleConfirmRequest}
            onCancel={handleCancelRequest}
            variant="primary"
          />
        )}
      </div>
    </div>
  );
};

export default AddFriendModal;
