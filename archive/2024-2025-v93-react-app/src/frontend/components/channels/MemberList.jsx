/**
 * @fileoverview Member List Component
 * Displays a list of channel members with status and actions
 */
import React from 'react';
import MemberItem from './MemberItem.jsx';
import './MemberList.css';

const MemberList = ({
  members,
  onlineMembers,
  currentUserId,
  channelCreatorId,
  isAdmin,
  onMemberClick,
  onMemberAction
}) => {
  // Sort members: creator first, then online members, then offline
  const sortedMembers = [...members].sort((a, b) => {
    // Creator always first
    if (a.userId === channelCreatorId) return -1;
    if (b.userId === channelCreatorId) return 1;

    // Then by online status
    const aOnline = onlineMembers.includes(a.userId);
    const bOnline = onlineMembers.includes(b.userId);
    
    if (aOnline && !bOnline) return -1;
    if (!aOnline && bOnline) return 1;

    // Then alphabetically by display name or userId
    const aName = (a.displayName || a.userId).toLowerCase();
    const bName = (b.displayName || b.userId).toLowerCase();
    return aName.localeCompare(bName);
  });

  return (
    <div className="member-list">
      {sortedMembers.map(member => (
        <MemberItem
          key={member.userId}
          member={member}
          isOnline={onlineMembers.includes(member.userId)}
          isCurrentUser={member.userId === currentUserId}
          isCreator={member.userId === channelCreatorId}
          canManage={isAdmin && member.userId !== currentUserId}
          onClick={() => onMemberClick(member)}
          onAction={() => onMemberAction(member)}
        />
      ))}
    </div>
  );
};

export default MemberList;
