/**
 * Individual Candidate Card Component
 * Handles: Single candidate display, voting UI, descriptions
 */
import React from 'react';
import AnimatedVoteCounter from './AnimatedVoteCounter.jsx';

const CandidateCard = ({ 
  candidate, 
  position, 
  voteCount, 
  totalVotes,
  isVoted, 
  isVoting,
  onVote,
  dynamicWidth,
  channelId,
  channelCategory, // **NEW: Channel category to display**
  onCardClick // **NEW: Callback when card is clicked (not vote button)**
}) => {
  
  // Debug: Log when isVoted prop changes
  React.useEffect(() => {
    console.log(`🎴 [CandidateCard ${candidate.name || candidate.username || candidate.id}] isVoted=${isVoted}, isVoting=${isVoting}`);
  }, [isVoted, isVoting, candidate.name, candidate.username, candidate.id]);
  
  const handleCardClick = (e) => {
    // Only trigger if not clicking on vote button or other interactive elements
    if (e.target.closest('button') || e.target.closest('[data-interactive]')) {
      return; // Let button handle its own click
    }
    
    if (onCardClick) {
      console.log(`🎯 Candidate card clicked: ${candidate.name}`);
      onCardClick(candidate);
    }
  };
  
  return (
    <div
      data-candidate-card="true"
      onClick={handleCardClick}
      style={{
        width: `${dynamicWidth}px`,
        minWidth: '280px',
        maxWidth: '400px',
        flex: `0 0 ${dynamicWidth}px`,
        minHeight: '100%',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 8,
        border: isVoted ? '2px solid #00ff00' : isVoting ? '2px solid #ff6b35' : '2px solid rgba(255, 255, 255, 0.3)',
        transition: 'all 0.3s ease',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transform: isVoted ? 'scale(1.02)' : 'scale(1)',
        boxShadow: isVoted ? '0 8px 25px rgba(0, 255, 0, 0.3)' : '0 4px 15px rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(10px)',
        boxSizing: 'border-box'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)';
        e.currentTarget.style.boxShadow = isVoted ? '0 8px 25px rgba(0, 255, 0, 0.3)' : '0 8px 25px rgba(255, 255, 255, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = isVoted ? 'scale(1.02)' : 'scale(1)';
        e.currentTarget.style.boxShadow = isVoted ? '0 8px 25px rgba(0, 255, 0, 0.3)' : '0 4px 15px rgba(0, 0, 0, 0.2)';
      }}
    >
      {/* Vote Status Indicator */}
      {isVoted && (
        <div style={{
          position: 'absolute',
          top: -8,
          right: -8,
          background: '#10b981',
          color: '#fff',
          borderRadius: '50%',
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 'bold',
          zIndex: 10,
          animation: 'pulse 2s infinite'
        }}>
          ✓
        </div>
      )}
      
      {/* Candidate Info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
        flexShrink: 0,
        minHeight: '40px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 14,
          fontWeight: 600,
          color: '#ffffff'
        }}>
          <span style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '120px'
          }}>
            @{candidate.username}
          </span>
        </div>
        <div style={{
          fontSize: 12,
          color: '#cccccc'
        }}>
          {candidate.location && typeof candidate.location.lat === 'number' && typeof candidate.location.lng === 'number' 
            ? `${candidate.location.lat.toFixed(2)}, ${candidate.location.lng.toFixed(2)}`
            : 'Location unavailable'
          }
        </div>
      </div>

      {/* Tags */}
      <div style={{
        display: 'flex',
        gap: 4,
        marginBottom: 6,
        flexShrink: 0,
        minHeight: '24px',
        flexWrap: 'wrap'
      }}>
        {channelCategory && (
          <span style={{
            background: 'rgba(33, 150, 243, 0.25)',
            color: '#60a5fa',
            padding: '3px 8px',
            borderRadius: 6,
            fontSize: 10,
            fontWeight: 600,
            border: '1px solid rgba(33, 150, 243, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}>
            <span>🏷️</span>
            {channelCategory}
          </span>
        )}
        <span style={{
          background: 'rgba(0, 255, 0, 0.2)',
          color: '#00ff00',
          padding: '2px 6px',
          borderRadius: 4,
          fontSize: 10,
          fontWeight: 500
        }}>
          {candidate.province}
        </span>
        <span style={{
          background: 'rgba(255, 107, 53, 0.2)',
          color: '#ff6b35',
          padding: '2px 6px',
          borderRadius: 4,
          fontSize: 10,
          fontWeight: 500
        }}>
          {candidate.type}
        </span>
      </div>

      {/* Image Window */}
      <div style={{
        width: '100%',
        height: '120px',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 8,
        marginBottom: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        color: '#94a3b8',
        flexShrink: 0,
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {candidate.imageUrl ? (
          <img 
            src={candidate.imageUrl} 
            alt={candidate.username}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '8px' }}>
            <div style={{ fontSize: '32px', marginBottom: '4px' }}>👤</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>No image</div>
          </div>
        )}
      </div>

      {/* Description with Fixed Scrollbar */}
      <div 
        className="candidate-description" 
        style={{
          fontSize: 11,
          lineHeight: 1.3,
          color: '#cccccc',
          marginBottom: 6,
          flex: '1 1 auto',
          minHeight: '60px',
          maxHeight: '120px', // FIXED: Force scrolling
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: '#666666 rgba(255, 255, 255, 0.05)',
          paddingRight: '4px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '4px',
          padding: '6px',
          background: 'rgba(0, 0, 0, 0.2)',
          boxSizing: 'border-box',
          wordWrap: 'break-word'
        }}
      >
        {candidate.description || 'A passionate advocate for transparent, inclusive, and effective governance. This candidate brings years of experience and is dedicated to building bridges between different perspectives. They believe in the power of community engagement and work tirelessly to ensure every voice is heard in the democratic process.'}
      </div>

      {/* Vote Stats and Button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 'auto',
        minHeight: '60px',
        flexShrink: 0,
        paddingTop: '8px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12,
          color: '#cccccc'
        }}>
          <span>#{position}</span>
          <span>•</span>
          <span>
            <AnimatedVoteCounter value={voteCount} duration={150} /> votes
          </span>
          <span>•</span>
          <span>{totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : '0.0'}%</span>
        </div>
        <button
          onClick={() => onVote(candidate.id)}
          disabled={isVoted || isVoting}
          style={{
            background: isVoted ? '#00ff00' : isVoting ? '#ff6b35' : 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            borderRadius: 6,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 500,
            cursor: (isVoted || isVoting) ? 'default' : 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          {isVoted ? '✓ Voted' : isVoting ? 'Voting...' : 'Vote'}
        </button>
      </div>
    </div>
  );
};

export default CandidateCard;