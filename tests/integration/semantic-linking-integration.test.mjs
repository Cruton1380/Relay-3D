/**
 * @fileoverview Semantic Linking Integration Tests
 * Tests the complete semantic linking pipeline from server parsing to client rendering
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import channelChatroomEngine from '../../src/backend/channel-service/channelChatroomEngine.mjs';
import dictionaryTextParser from '../../src/backend/dictionary/dictionaryTextParser.mjs';

// Test data
const mockChannelId = 'test-channel-123';
const mockUserId = 'user-456';

const mockSemanticMessage = {
  id: 'msg-789',
  channelId: mockChannelId,
  authorId: mockUserId,
  content: 'Democracy is crucial for freedom and justice in our society.',
  messageType: 'text',
  timestamp: Date.now(),
  reactions: new Map(),
  replies: [],
  metadata: {
    authorModerationStatus: {
      score: 75,
      percentile: 85,
      badge: '✓',
      status: 'verified',
      canDownvote: true
    },
    semanticData: {
      text: 'Democracy is crucial for freedom and justice in our society.',
      entities: [
        {
          text: 'Democracy',
          start: 0,
          end: 9,
          confidence: 0.95,
          category: 'political'
        },
        {
          text: 'freedom',
          start: 27,
          end: 34,
          confidence: 0.89,
          category: 'political'
        },
        {
          text: 'justice',
          start: 39,
          end: 46,
          confidence: 0.92,
          category: 'legal'
        }
      ]
    }
  },
  author: {
    id: mockUserId,
    score: 75,
    percentile: 85,
    badge: '✓',
    status: 'verified'
  }
};

// Mock event bus for testing
vi.mock('../../src/backend/event-bus/index.mjs', () => ({
  eventBus: {
    emit: vi.fn()
  }
}));

// Mock chat user voting service to avoid moderation issues
vi.mock('../../src/backend/channel-service/chatUserVoting.mjs', () => ({
  default: {
    getUserModerationStatus: vi.fn(() => ({
      score: 75,
      percentile: 85,
      badge: '✓',
      status: 'verified',
      canDownvote: true,
      isMuted: false // Allow posting
    })),
    updateMessageVisibility: vi.fn(() => Promise.resolve()),
    prepareSemanticLinks: vi.fn(() => ({})),
    searchChatroomMessages: vi.fn(() => Promise.resolve({ messages: [], totalCount: 0 })),
    getChannelFilterOptions: vi.fn(() => ({}))
  }
}));

describe('Semantic Linking Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Server-Side Preprocessing', () => {
    it('should parse message content during sendMessage', async () => {
      // Mock the parser
      const mockParseText = vi.spyOn(dictionaryTextParser, 'parseText')
        .mockResolvedValue(mockSemanticMessage.metadata.semanticData);

      // Create a mock chatroom engine
      const engine = channelChatroomEngine;
      engine.channels.set(mockChannelId, {
        id: mockChannelId,
        messages: [],
        messageCount: 0,
        participants: new Set([mockUserId])
      });

      // Send a message
      await engine.sendMessage(
        mockChannelId,
        mockUserId,
        'Democracy is crucial for freedom and justice in our society.',
        'text'
      );

      // Verify parsing was called with correct parameters
      expect(mockParseText).toHaveBeenCalledWith(
        'Democracy is crucial for freedom and justice in our society.',
        mockUserId,
        expect.objectContaining({
          maxDensity: 0.3,
          includePhraseTags: false,
          prioritizeImportant: true,
          respectLineBreaks: true
        })
      );
    });

    it('should handle parsing failures gracefully', async () => {
      // Mock parser to throw error
      const mockParseText = vi.spyOn(dictionaryTextParser, 'parseText')
        .mockRejectedValue(new Error('Parsing failed'));

      const engine = channelChatroomEngine;
      engine.channels.set(mockChannelId, {
        id: mockChannelId,
        messages: [],
        messageCount: 0,
        participants: new Set([mockUserId])
      });

      // Should not throw error
      await expect(engine.sendMessage(
        mockChannelId,
        mockUserId,
        'Test message content',
        'text'
      )).resolves.not.toThrow();

      expect(mockParseText).toHaveBeenCalled();
    });

    it('should include semantic data in message metadata', async () => {
      const mockParseText = vi.spyOn(dictionaryTextParser, 'parseText')
        .mockResolvedValue(mockSemanticMessage.metadata.semanticData);

      const engine = channelChatroomEngine;
      engine.channels.set(mockChannelId, {
        id: mockChannelId,
        messages: [],
        messageCount: 0,
        participants: new Set([mockUserId])
      });

      await engine.sendMessage(mockChannelId, mockUserId, 'Test content', 'text');

      // Check that message was stored with semantic data
      const storedMessages = Array.from(engine.messageStore.values());
      const lastMessage = storedMessages[storedMessages.length - 1];

      expect(lastMessage.metadata.semanticData).toBeDefined();
      expect(lastMessage.metadata.semanticData.entities).toEqual(
        mockSemanticMessage.metadata.semanticData.entities
      );
    });
  });



  describe('Progressive Enhancement', () => {
    it('should parse older messages without semantic data in background', async () => {
      const oldMessage = {
        ...mockSemanticMessage,
        metadata: {
          ...mockSemanticMessage.metadata,
          semanticData: null // No semantic data
        }
      };

      const mockParseText = vi.spyOn(dictionaryTextParser, 'parseText')
        .mockResolvedValue({
          text: oldMessage.content,
          entities: [
            {
              text: 'Democracy',
              start: 0,
              end: 9,
              confidence: 0.95,
              category: 'political'
            }
          ]
        });

      const engine = channelChatroomEngine;
      engine.channels.set(mockChannelId, {
        id: mockChannelId,
        messages: [oldMessage.id],
        messageCount: 1,
        participants: new Set([mockUserId])
      });
      engine.messageStore.set(oldMessage.id, oldMessage);

      // Get messages should trigger background parsing
      const result = await engine.getMessages(mockChannelId, {}, 50, 0);

      // Should have parsed the message
      expect(mockParseText).toHaveBeenCalledWith(
        oldMessage.content,
        oldMessage.authorId,
        expect.objectContaining({
          maxDensity: 0.2, // Lower density for background parsing
          includePhraseTags: false,
          prioritizeImportant: true,
          respectLineBreaks: true
        })
      );

      // Should include semantic data in result
      expect(result.messages[0].semanticData).toBeDefined();
      expect(result.messages[0].semanticData.entities).toHaveLength(1);
    });

    it('should include semantic statistics in message response', async () => {
      const engine = channelChatroomEngine;
      engine.channels.set(mockChannelId, {
        id: mockChannelId,
        messages: [mockSemanticMessage.id],
        messageCount: 1,
        participants: new Set([mockUserId])
      });
      engine.messageStore.set(mockSemanticMessage.id, mockSemanticMessage);

      const result = await engine.getMessages(mockChannelId, {}, 50, 0);

      // Should include semantic statistics
      expect(result.semanticStats).toBeDefined();
      expect(result.semanticStats.totalParsed).toBe(1);
      expect(result.semanticStats.totalEntities).toBe(3);
    });
  });
}); 