/**
 * @fileoverview Member Actions Component
 * Modal for admin actions on channel members (kick, ban, promote, etc.)
 */
import React, { useState } from 'react';
import { Button } from '../shared/index.js';
import ConfirmDialog from '../dialogs/ConfirmDialog.jsx';
import { useChannelService } from '../../hooks/useChannels.js';
import './MemberActions.css';

const MemberActions = ({
  member,
  channelId,
  channelData,
  currentUserId,
  isAdmin,
  isModerator,
  onClose
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const { channelService } = useChannelService(currentUserId);

  const displayName = member.displayName || member.userId;

  const handleKickMember = () => {
    setConfirmAction({
      type: 'kick',
      title: 'Kick Member',
      message: `Are you sure you want to kick ${displayName} from this channel?`,
      confirmText: 'Kick',
      variant: 'danger'
    });
    setShowConfirm(true);
  };

  const handleBanMember = () => {
    setConfirmAction({
      type: 'ban',
      title: 'Ban Member',
      message: `Are you sure you want to ban ${displayName} from this channel? They will not be able to rejoin.`,
      confirmText: 'Ban',
      variant: 'danger'
    });
    setShowConfirm(true);
  };

  const handlePromoteMember = () => {
    setConfirmAction({
      type: 'promote',
      title: 'Promote to Moderator',
      message: `Promote ${displayName} to moderator? They will be able to manage other members.`,
      confirmText: 'Promote',
      variant: 'primary'
    });
    setShowConfirm(true);
  };

  const handleDemoteMember = () => {
    setConfirmAction({
      type: 'demote',
      title: 'Remove Moderator',
      message: `Remove moderator privileges from ${displayName}?`,
      confirmText: 'Remove',
      variant: 'secondary'
    });
    setShowConfirm(true);
  };

  const handleTransferOwnership = () => {
    setConfirmAction({
      type: 'transfer',
      title: 'Transfer Ownership',
      message: `Transfer channel ownership to ${displayName}? You will lose admin privileges.`,
      confirmText: 'Transfer',
      variant: 'danger'
    });
    setShowConfirm(true);
  };
  const executeAction = async () => {
    if (!confirmAction || !channelService) return;

    setLoading(true);
    
    try {
      switch (confirmAction.type) {
        case 'kick':
          await channelService.kickMember(channelId, member.userId, 'Kicked by moderator');
          break;
        case 'ban':
          await channelService.banMember(channelId, member.userId, 'Banned by moderator');
          break;
        case 'promote':
          await channelService.promoteMember(channelId, member.userId);
          break;
        case 'demote':
          await channelService.demoteMember(channelId, member.userId);
          break;
        case 'transfer':
          await channelService.transferOwnership(channelId, member.userId);
          break;
      }
      
      onClose();    } catch (error) {
      console.error('Failed to execute member action:', error);
      // Display error notification to user
    } finally {
      setLoading(false);
      setShowConfirm(false);
      setConfirmAction(null);
    }
  };

  if (!isAdmin && !isModerator) {
    return null;
  }

  const isCreator = channelData?.creatorId === currentUserId;
  const isMemberModerator = member.role === 'moderator';
  const isMemberCreator = member.userId === channelData?.creatorId;

  return (
    <div className="member-actions-modal">
      <div className="member-actions-backdrop" onClick={onClose} />
      <div className="member-actions-content">
        <div className="member-actions-header">
          <h3>Member Actions</h3>
          <button className="close-button" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div className="member-actions-info">
          <div className="member-actions-avatar">
            <img
              src={member.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${member.userId}`}
              alt={displayName}
              onError={(e) => {
                e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${member.userId}`;
              }}
            />
          </div>
          <div className="member-actions-details">
            <h4>{displayName}</h4>
            <p className="member-id">ID: {member.userId}</p>
            {isMemberCreator && (
              <span className="member-badge creator">Channel Creator</span>
            )}
            {isMemberModerator && !isMemberCreator && (
              <span className="member-badge moderator">Moderator</span>
            )}
          </div>
        </div>

        <div className="member-actions-buttons">
          {/* Basic moderation actions */}
          {!isMemberCreator && (
            <>
              <Button
                variant="danger"
                onClick={handleKickMember}
                disabled={loading}
                className="action-button"
              >
                <svg viewBox="0 0 24 24" className="button-icon">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1V3H9V1L3 7V9H21ZM21 10H3V15H21V10Z"/>
                </svg>
                Kick from Channel
              </Button>

              <Button
                variant="danger"
                onClick={handleBanMember}
                disabled={loading}
                className="action-button"
              >
                <svg viewBox="0 0 24 24" className="button-icon">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM15.5 6L14 7.5L15.5 9L17 7.5L15.5 6Z"/>
                </svg>
                Ban from Channel
              </Button>
            </>
          )}

          {/* Moderator management (creator only) */}
          {isCreator && !isMemberCreator && (
            <>
              {!isMemberModerator ? (
                <Button
                  variant="primary"
                  onClick={handlePromoteMember}
                  disabled={loading}
                  className="action-button"
                >
                  <svg viewBox="0 0 24 24" className="button-icon">
                    <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
                  </svg>
                  Make Moderator
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={handleDemoteMember}
                  disabled={loading}
                  className="action-button"
                >
                  <svg viewBox="0 0 24 24" className="button-icon">
                    <path d="M12 2L10.91 8.26L2 9L10.91 9.74L12 16L13.09 9.74L22 9L13.09 8.26L12 2Z"/>
                  </svg>
                  Remove Moderator
                </Button>
              )}

              <Button
                variant="danger"
                onClick={handleTransferOwnership}
                disabled={loading}
                className="action-button transfer-ownership"
              >
                <svg viewBox="0 0 24 24" className="button-icon">
                  <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 7C13.1 7 14 7.9 14 9C14 10.1 13.1 11 12 11C10.9 11 10 10.1 10 9C10 7.9 10.9 7 12 7ZM18 17H6V15.5C6 13.5 10 12.5 12 12.5S18 13.5 18 15.5V17Z"/>
                </svg>
                Transfer Ownership
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && confirmAction && (
        <ConfirmDialog
          title={confirmAction.title}
          message={confirmAction.message}
          confirmText={confirmAction.confirmText}
          cancelText="Cancel"
          variant={confirmAction.variant}
          onConfirm={executeAction}
          onCancel={() => {
            setShowConfirm(false);
            setConfirmAction(null);
          }}
        />
      )}
    </div>
  );
};

export default MemberActions;
