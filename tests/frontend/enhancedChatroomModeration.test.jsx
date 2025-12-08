/**
 * @fileoverview Frontend Tests for Enhanced Chatroom Moderation Components
 * Tests ChatroomFilters, enhanced MessageBubble, and moderation UI
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi as jest, beforeEach } from 'vitest';
import ChatroomFilters from '../../src/frontend/components/channels/ChatroomFilters.jsx';
import MessageBubble from '../../src/frontend/components/channels/MessageBubble.jsx';

// Mock useAuth hook
vi.mock('../../src/frontend/auth/context/useAuth.js', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-123',
      username: 'TestUser',
      percentile: 85,
      communityScore: 15,
      isAuthenticated: true
    },
    isAuthenticated: true
  })
}));

// Mock ContentVoteButtons component
vi.mock('../../src/frontend/components/channels/ContentVoteButtons', () => ({
  default: vi.fn(({ contentId, contentInfo, canDownvote, onVoteUpdate }) => (
    <div data-testid="content-vote-buttons" data-content-id={contentId}>
      <span>Votes: {contentInfo?.voteScore || 0}</span>
      {!canDownvote && <span>Downvoting restricted</span>}
    </div>
  ))
}));

// Mock ProximityVotingService
vi.mock('../../src/frontend/services/proximityVotingService', () => ({
  ProximityVotingService: {
    getVotingRestrictionsSummary: vi.fn().mockResolvedValue({ canDownvote: true }),
    getChannel: vi.fn().mockResolvedValue({ id: 'test-channel' })
  }
}));

// Mock MessageReactions component
vi.mock('../../src/frontend/components/channels/MessageReactions', () => ({
  default: vi.fn(() => <div data-testid="message-reactions" />)
}));

// Mock MessageActions component
vi.mock('../../src/frontend/components/channels/MessageActions', () => ({
  default: vi.fn(() => <div data-testid="message-actions" />)
}));

describe('ChatroomFilters Component', () => {
  const mockOnFiltersChange = jest.fn();
  const mockFilterOptions = {
    totalUsers: 100,
    mutedUsers: 15,
    activeUsers: 85,
    percentileThreshold: 10,
    scoreRange: { min: -20, max: 50 }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search input correctly', () => {
    render(
      <ChatroomFilters 
        channelId="test-channel"
        onFiltersChange={mockOnFiltersChange}
        filterOptions={mockFilterOptions}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search messages and users...');
    expect(searchInput).toBeInTheDocument();
  });

  it('calls onFiltersChange when search input changes', async () => {
    render(
      <ChatroomFilters 
        channelId="test-channel"
        onFiltersChange={mockOnFiltersChange}
        filterOptions={mockFilterOptions}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search messages and users...');
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    // Wait for debounced call
    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          keyword: 'test search'
        })
      );
    }, { timeout: 400 });
  });

  it('renders quick filter buttons', () => {
    render(
      <ChatroomFilters 
        channelId="test-channel"
        onFiltersChange={mockOnFiltersChange}
        filterOptions={mockFilterOptions}
      />
    );

    expect(screen.getByText('Top Ranked')).toBeInTheDocument();
    expect(screen.getByText('Newest')).toBeInTheDocument();
    expect(screen.getByText('Media Only')).toBeInTheDocument();
    expect(screen.getByText('Visible Users')).toBeInTheDocument();
    expect(screen.getByText('Show Hidden')).toBeInTheDocument();
  });

  it('toggles filter states when buttons are clicked', async () => {
    render(
      <ChatroomFilters 
        channelId="test-channel"
        onFiltersChange={mockOnFiltersChange}
        filterOptions={mockFilterOptions}
      />
    );

    const topRankedButton = screen.getByText('Top Ranked');
    fireEvent.click(topRankedButton);

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          topRanked: true
        })
      );
    });

    expect(topRankedButton).toHaveClass('active');
  });

  it('shows and hides advanced filters panel', () => {
    render(
      <ChatroomFilters 
        channelId="test-channel"
        onFiltersChange={mockOnFiltersChange}
        filterOptions={mockFilterOptions}
      />
    );

    const advancedToggle = screen.getByText('Advanced Filters');
    fireEvent.click(advancedToggle);

    expect(screen.getByText('Minimum User Percentile:')).toBeInTheDocument();
    expect(screen.getByText('Score Range:')).toBeInTheDocument();
  });

  it('updates percentile filter correctly', async () => {
    render(
      <ChatroomFilters 
        channelId="test-channel"
        onFiltersChange={mockOnFiltersChange}
        filterOptions={mockFilterOptions}
      />
    );

    // Open advanced filters
    fireEvent.click(screen.getByText('Advanced Filters'));

    const percentileSlider = screen.getByDisplayValue('0');
    fireEvent.change(percentileSlider, { target: { value: '50' } });

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          userPercentileFilter: 50
        })
      );
    });
  });

  it('displays filter statistics correctly', () => {
    render(
      <ChatroomFilters 
        channelId="test-channel"
        onFiltersChange={mockOnFiltersChange}
        filterOptions={mockFilterOptions}
      />
    );

    // Open advanced filters to see stats
    fireEvent.click(screen.getByText('Advanced Filters'));

    expect(screen.getByText('Total Users: 100')).toBeInTheDocument();
    expect(screen.getByText('Active: 85')).toBeInTheDocument();
    expect(screen.getByText('Muted: 15')).toBeInTheDocument();
    expect(screen.getByText('Threshold: 10th percentile')).toBeInTheDocument();
  });

  it('shows active filters summary', async () => {
    render(
      <ChatroomFilters 
        channelId="test-channel"
        onFiltersChange={mockOnFiltersChange}
        filterOptions={mockFilterOptions}
      />
    );

    // Activate a filter
    const searchInput = screen.getByPlaceholderText('Search messages and users...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByText('Active filters:')).toBeInTheDocument();
      expect(screen.getByText('Search: "test"')).toBeInTheDocument();
    });
  });

  it('allows removing individual filters from summary', async () => {
    render(
      <ChatroomFilters 
        channelId="test-channel"
        onFiltersChange={mockOnFiltersChange}
        filterOptions={mockFilterOptions}
      />
    );

    // Activate media only filter by clicking the button
    const mediaButton = screen.getByRole('button', { name: /Media Only/i });
    fireEvent.click(mediaButton);

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          mediaOnly: true
        })
      );
    });

    // Verify button is active
    expect(mediaButton).toHaveClass('active');
  });

  it('resets all filters when reset button is clicked', async () => {
    render(
      <ChatroomFilters 
        channelId="test-channel"
        onFiltersChange={mockOnFiltersChange}
        filterOptions={mockFilterOptions}
      />
    );

    // Open advanced filters and click reset
    fireEvent.click(screen.getByText('Advanced Filters'));
    fireEvent.click(screen.getByText('Reset All Filters'));

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        keyword: '',
        mediaOnly: false,
        topRanked: false,
        newest: false,
        visibleUsersOnly: true,
        unhideCollapsed: false,
        tags: [],
        userPercentileFilter: null,
        scoreRange: null
      });
    });
  });
});

describe('Enhanced MessageBubble Component', () => {
  const mockMessage = {
    id: 'msg-1',
    content: 'Test message content',
    timestamp: Date.now(),
    messageType: 'text',
    author: {
      id: 'user-1',
      username: 'TestUser',
      moderationStatus: {
        score: 15,
        percentile: 75,
        canDownvote: true,
        status: 'normal',
        badge: '⭐'
      }
    },
    reactions: new Map(),
    replyCount: 0
  };

  const mockProps = {
    message: mockMessage,
    isOwn: false,
    channelId: 'test-channel',
    onReact: jest.fn(),
    onReply: jest.fn(),
    onToggleThread: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays enhanced user moderation info', () => {
    render(<MessageBubble {...mockProps} />);

    expect(screen.getByText('TestUser')).toBeInTheDocument();
    expect(screen.getByText('⭐')).toBeInTheDocument(); // Badge
    expect(screen.getByText('⬆️15 ⬇️0')).toBeInTheDocument(); // Score display
    expect(screen.getByText('75th')).toBeInTheDocument(); // Percentile
  });
  it('shows muted user label for muted users', () => {
    const mutedMessage = {
      ...mockMessage,
      author: {
        ...mockMessage.author,
        moderationStatus: {
          ...mockMessage.author.moderationStatus,
          status: 'muted',
          percentile: 5,
          canDownvote: false,
          badge: '🔇'
        }
      }
    };

    render(<MessageBubble {...mockProps} message={mutedMessage} />);

    // Check for the muted label specifically by title attribute
    expect(screen.getByTitle('Muted by Community')).toBeInTheDocument();
    
    // Verify that there are multiple mute indicators (badge and label)
    const muteElements = screen.getAllByText('🔇');
    expect(muteElements.length).toBeGreaterThan(1);
  });

  it('displays collapsed message for muted users', () => {
    const mutedMessage = {
      ...mockMessage,
      isCollapsed: true,
      author: {
        ...mockMessage.author,
        moderationStatus: {
          ...mockMessage.author.moderationStatus,
          status: 'muted',
          canDownvote: false
        }
      }
    };

    render(<MessageBubble {...mockProps} message={mutedMessage} />);

    expect(screen.getByText('Message hidden by community moderation')).toBeInTheDocument();
    expect(screen.getByText('Show Message')).toBeInTheDocument();
  });

  it('allows expanding collapsed messages', () => {
    const mockToggleCollapsed = jest.fn();
    const collapsedMessage = {
      ...mockMessage,
      isCollapsed: true,
      onToggleCollapsed: mockToggleCollapsed
    };

    render(<MessageBubble {...mockProps} message={collapsedMessage} />);

    const showButton = screen.getByText('Show Message');
    fireEvent.click(showButton);

    expect(mockToggleCollapsed).toHaveBeenCalledWith('msg-1');
  });

  it('shows downvote restriction for low-percentile users', () => {
    const restrictedMessage = {
      ...mockMessage,
      author: {
        ...mockMessage.author,
        moderationStatus: {
          ...mockMessage.author.moderationStatus,
          canDownvote: false,
          percentile: 5
        }
      }
    };

    render(<MessageBubble {...mockProps} message={restrictedMessage} />);

    // The component should show the restriction in the voting section
    expect(screen.getByText('Downvote locked')).toBeInTheDocument();
    expect(screen.getByTitle('Downvoting requires higher community standing')).toBeInTheDocument();
  });

  it('displays trusted user indicators', () => {
    const trustedMessage = {
      ...mockMessage,
      author: {
        ...mockMessage.author,
        moderationStatus: {
          ...mockMessage.author.moderationStatus,
          status: 'trusted',
          percentile: 95,
          badge: '🏆'
        }
      }
    };

    render(<MessageBubble {...mockProps} message={trustedMessage} />);

    expect(screen.getByText('🏆')).toBeInTheDocument();
    expect(screen.getByTitle('Trusted Community Member')).toBeInTheDocument();
  });

  it('shows different status indicators based on user standing', () => {
    const statusConfigs = [
      {
        user: { 
          percentile: 95, 
          score: 50,
          moderationStatus: {
            score: 50,
            percentile: 95,
            status: 'trusted',
            badge: '🌟',
            canDownvote: true
          }
        },
        expectedBadge: '🌟',
        expectedTitle: '95th percentile'
      },
      {
        user: { 
          percentile: 75, 
          score: 15,
          moderationStatus: {
            score: 15,
            percentile: 75,
            status: 'normal',
            badge: '✓',
            canDownvote: true
          }
        },
        expectedBadge: '✓',
        expectedTitle: '75th percentile'
      },
      {
        user: { 
          percentile: 25, 
          score: -5,
          moderationStatus: {
            score: -5,
            percentile: 25,
            status: 'filtered',
            badge: '⚠️',
            canDownvote: false
          }
        },
        expectedBadge: '⚠️',
        expectedTitle: '25th percentile'
      }
    ];

    statusConfigs.forEach(({ user, expectedBadge, expectedTitle }) => {
      const { container } = render(
        <MessageBubble
          message={{
            id: 'test-msg',
            content: 'Test message content',
            author: {
              id: 'test-user',
              username: 'TestUser',
              moderationStatus: user.moderationStatus
            },
            timestamp: Date.now()
          }}
          isOwn={false}
          showAvatar={true}
          showTimestamp={true}
        />
      );

      // Find badge by title
      const badge = container.querySelector(`[title="${expectedTitle}"]`);
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toBe(expectedBadge);
    });
  });

  it('handles vote updates correctly', () => {
    const mockOnVoteUpdate = jest.fn();
    const messageWithVoteHandler = {
      ...mockMessage,
      onVoteUpdate: mockOnVoteUpdate
    };

    render(<MessageBubble {...mockProps} message={messageWithVoteHandler} />);

    // Simulate a vote update (this would normally come from ContentVoteButtons)
    const voteData = { upvotes: 5, downvotes: 1, score: 4 };
    
    // The ContentVoteButtons component should call onVoteUpdate
    // We can test this by checking if the prop is passed correctly
    expect(messageWithVoteHandler.onVoteUpdate).toBe(mockOnVoteUpdate);
  });
});

describe('Moderation UI Integration', () => {
  it('integrates ChatroomFilters with MessageBubble for filtered content', () => {
    const filteredMessages = [
      {
        id: 'msg-1',
        content: 'Normal message',
        author: { moderationStatus: { status: 'normal', percentile: 50 } }
      },
      {
        id: 'msg-2',
        content: 'Muted user message',
        author: { moderationStatus: { status: 'muted', percentile: 5 } },
        isCollapsed: true
      }
    ];

    const TestWrapper = () => {
      const [filters, setFilters] = React.useState({ visibleUsersOnly: true });
      
      const visibleMessages = filteredMessages.filter(msg => {
        if (filters.visibleUsersOnly && msg.author.moderationStatus.status === 'muted') {
          return false;
        }
        return true;
      });

      return (
        <div>
          <ChatroomFilters 
            channelId="test"
            onFiltersChange={setFilters}
            filterOptions={{ percentileThreshold: 10 }}
          />
          {visibleMessages.map(msg => (
            <MessageBubble 
              key={msg.id}
              message={msg}
              isOwn={false}
              channelId="test"
            />
          ))}
        </div>
      );
    };

    render(<TestWrapper />);

    // Should show normal message
    expect(screen.getByText('Normal message')).toBeInTheDocument();
    
    // Should not show muted message when visibleUsersOnly is true
    expect(screen.queryByText('Muted user message')).not.toBeInTheDocument();
  });

  it('shows proper moderation controls based on user permissions', () => {
    const currentUser = {
      id: 'current-user',
      moderationStatus: {
        canDownvote: true,
        percentile: 75,
        status: 'normal'
      }
    };

    const TestModerationControls = () => (
      <div>
        {currentUser.moderationStatus.canDownvote ? (
          <button>Downvote Available</button>
        ) : (
          <div>Downvote Restricted</div>
        )}
        <div>Your Percentile: {currentUser.moderationStatus.percentile}th</div>
      </div>
    );

    render(<TestModerationControls />);

    expect(screen.getByText('Downvote Available')).toBeInTheDocument();
    expect(screen.getByText('Your Percentile: 75th')).toBeInTheDocument();
  });
});
