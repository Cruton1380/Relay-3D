/**
 * @fileoverview Social Hub Component
 * Main interface for managing friends, requests, and social interactions
 */
import React, { useState } from 'react';
import { useSocial, useFriendRequests, useFriends, useBlockedUsers } from '../../hooks/useSocial.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import { Button } from '../shared/index.js';
import FriendRequestsList from './FriendRequestsList.jsx';
import FriendsList from './FriendsList.jsx';
import BlockedUsersList from './BlockedUsersList.jsx';
import AddFriendModal from './AddFriendModal.jsx';
import './SocialHub.css';

const SocialHub = ({ onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('friends');
  const [showAddFriend, setShowAddFriend] = useState(false);

  const { isConnected, error } = useSocial(user?.id, user?.token);
  const { 
    pendingRequests, 
    sentRequests, 
    acceptFriendRequest, 
    declineFriendRequest,
    loading: requestsLoading 
  } = useFriendRequests(user?.id, user?.token);
  
  const { 
    friends, 
    friendPresence, 
    removeFriend,
    loading: friendsLoading 
  } = useFriends(user?.id, user?.token);
  
  const { 
    blockedUsers, 
    blockUser, 
    unblockUser,
    loading: blockedLoading 
  } = useBlockedUsers(user?.id, user?.token);

  const tabs = [
    { 
      id: 'friends', 
      label: 'Friends', 
      count: friends.length,
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2 .97L13.56 11l1.07 1.07L16 10.75V22h4zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zm1.5 1h-3c-1.1 0-2 .9-2 2v5.5h2V22h3v-2.5h2V14c0-1.1-.9-2-2-2z"/>
        </svg>
      )
    },
    { 
      id: 'requests', 
      label: 'Requests', 
      count: pendingRequests.length + sentRequests.length,
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
      )
    },
    { 
      id: 'blocked', 
      label: 'Blocked', 
      count: blockedUsers.length,
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z"/>
        </svg>
      )
    }
  ];

  if (!isConnected) {
    return (
      <div className="social-hub">
        <div className="social-hub-header">
          <h2>Social Hub</h2>
          <Button variant="secondary" size="small" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="social-hub-loading">
          <div className="spinner" />
          <p>Connecting to social service...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="social-hub">
        <div className="social-hub-header">
          <h2>Social Hub</h2>
          <Button variant="secondary" size="small" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="social-hub-error">
          <p>Error: {error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="social-hub">
      {/* Header */}
      <div className="social-hub-header">
        <h2>Social Hub</h2>
        <div className="social-hub-actions">
          <Button 
            variant="primary" 
            size="small" 
            onClick={() => setShowAddFriend(true)}
          >
            Add Friend
          </Button>
          <Button variant="secondary" size="small" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="social-hub-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`social-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <div className="tab-icon">{tab.icon}</div>
            <span className="tab-label">{tab.label}</span>
            {tab.count > 0 && (
              <span className="tab-badge">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="social-hub-content">
        {activeTab === 'friends' && (
          <FriendsList
            friends={friends}
            friendPresence={friendPresence}
            onRemoveFriend={removeFriend}
            onBlockUser={blockUser}
            loading={friendsLoading}
          />
        )}

        {activeTab === 'requests' && (
          <FriendRequestsList
            pendingRequests={pendingRequests}
            sentRequests={sentRequests}
            onAcceptRequest={acceptFriendRequest}
            onDeclineRequest={declineFriendRequest}
            loading={requestsLoading}
          />
        )}

        {activeTab === 'blocked' && (
          <BlockedUsersList
            blockedUsers={blockedUsers}
            onUnblockUser={unblockUser}
            loading={blockedLoading}
          />
        )}
      </div>

      {/* Add Friend Modal */}
      {showAddFriend && (
        <AddFriendModal
          onClose={() => setShowAddFriend(false)}
          onFriendAdded={() => {
            setShowAddFriend(false);
            setActiveTab('requests');
          }}
        />
      )}
    </div>
  );
};

export default SocialHub;
