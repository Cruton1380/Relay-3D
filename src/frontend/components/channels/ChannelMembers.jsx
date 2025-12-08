/**
 * @fileoverview Channel Members Component
 * Main interface for viewing and managing channel members
 */
import React, { useState, useEffect } from 'react';
import { useChannelMembers } from '../../hooks/useChannels.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useSocialService } from '../../hooks/useSocial.js';
import { useChannelService } from '../../hooks/useChannels.js';
import MemberList from './MemberList.jsx';
import MemberActions from './MemberActions.jsx';
import ChannelMemberInteraction from './ChannelMemberInteraction.jsx';
import { Button } from '../shared/index.js';
import './ChannelMembers.css';

const ChannelMembers = ({ 
  channelId, 
  channelData,
  onClose,
  onMemberSelect
}) => {
  const { user } = useAuth();
  const { members, onlineMembers, loading, error } = useChannelMembers(
    channelId, 
    user?.id, 
    user?.token
  );
  const { socialService } = useSocialService(user?.id, user?.token);
  const { channelService } = useChannelService(user?.id, user?.token);

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [showMemberInteraction, setShowMemberInteraction] = useState(false);

  // Check if current user is admin/creator
  const isAdmin = channelData?.creatorId === user?.id;
  const isModerator = isAdmin; // For now, only creator has admin rights

  // Filter members based on active tab and search
  const filteredMembers = members.filter(member => {
    const matchesSearch = !searchQuery || 
      member.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.userId.toLowerCase().includes(searchQuery.toLowerCase());

    switch (activeTab) {
      case 'online':
        return matchesSearch && onlineMembers.includes(member.userId);
      case 'offline':
        return matchesSearch && !onlineMembers.includes(member.userId);
      default:
        return matchesSearch;
    }
  });

  const handleMemberClick = (member) => {
    setSelectedMember(member);
    // Only show member interaction for other users (not current user)
    if (member.userId !== user?.id) {
      setShowMemberInteraction(true);
    }
    onMemberSelect?.(member);
  };

  const handleMemberAction = (member) => {
    setSelectedMember(member);
    setShowActions(true);
  };

  if (loading) {
    return (
      <div className="channel-members">
        <div className="channel-members-header">
          <h3>Channel Members</h3>
          <Button variant="secondary" size="small" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="channel-members-loading">
          <div className="spinner" />
          <p>Loading members...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="channel-members">
        <div className="channel-members-header">
          <h3>Channel Members</h3>
          <Button variant="secondary" size="small" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="channel-members-error">
          <p>Error loading members: {error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="channel-members">
      {/* Header */}
      <div className="channel-members-header">
        <div className="channel-members-title">
          <h3>Channel Members</h3>
          <span className="member-count">
            {members.length} member{members.length !== 1 ? 's' : ''}
            {onlineMembers.length > 0 && (
              <span className="online-count">
                · {onlineMembers.length} online
              </span>
            )}
          </span>
        </div>
        <Button variant="secondary" size="small" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* Search Bar */}
      <div className="channel-members-search">
        <input
          type="text"
          placeholder="Search members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Tabs */}
      <div className="channel-members-tabs">
        {[
          { id: 'all', label: 'All', count: members.length },
          { id: 'online', label: 'Online', count: onlineMembers.length },
          { id: 'offline', label: 'Offline', count: members.length - onlineMembers.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
            <span className="tab-count">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Members List */}
      <div className="channel-members-content">
        {filteredMembers.length === 0 ? (
          <div className="channel-members-empty">
            <p>
              {searchQuery 
                ? `No members found matching "${searchQuery}"`
                : `No ${activeTab === 'all' ? '' : activeTab + ' '}members found`
              }
            </p>
          </div>
        ) : (
          <MemberList
            members={filteredMembers}
            onlineMembers={onlineMembers}
            currentUserId={user?.id}
            channelCreatorId={channelData?.creatorId}
            isAdmin={isAdmin}
            onMemberClick={handleMemberClick}
            onMemberAction={handleMemberAction}
          />
        )}
      </div>

      {/* Member Actions Modal */}
      {showActions && selectedMember && (
        <MemberActions
          member={selectedMember}
          channelId={channelId}
          channelData={channelData}
          currentUserId={user?.id}
          isAdmin={isAdmin}
          isModerator={isModerator}
          onClose={() => {
            setShowActions(false);
            setSelectedMember(null);
          }}
        />
      )}

      {/* Member Interaction Modal */}
      {showMemberInteraction && selectedMember && selectedMember.userId !== user?.id && (
        <ChannelMemberInteraction
          member={selectedMember}
          channelId={channelId}
          channelName={channelData?.name}
          socialService={socialService}
          channelService={channelService}
          onClose={() => {
            setShowMemberInteraction(false);
            setSelectedMember(null);
          }}
        />
      )}
    </div>
  );
};

export default ChannelMembers;
