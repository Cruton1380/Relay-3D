/**
 * @fileoverview WebSocket adapter for handling voting
 */
import BaseAdapter from './adapterBase.mjs';
import voteService from '../vote-service/index.mjs';
import eventBus from '../event-bus/index.mjs';
import messageValidator from './messageValidator.mjs';
import logger from '../utils/logging/logger.mjs';

const voteLogger = logger.child({ module: 'vote-adapter' });

const VOTE_MESSAGE_SCHEMA = {
  type: 'object',
  properties: {
    action: { type: 'string', enum: ['submit', 'get', 'getActive', 'create'] },
    data: { type: 'object' }
  },
  required: ['action']
};

class VoteAdapter extends BaseAdapter {
  constructor() {
    super('vote');
    
    // Register for events from the event bus
    this.handleVoteCreated = this.handleVoteCreated.bind(this);
    this.handleVoteSubmitted = this.handleVoteSubmitted.bind(this);
    this.handleVoteCompleted = this.handleVoteCompleted.bind(this);
    
    // Track active votes
    this.activeVotes = new Map();
  }

  initialize(wsService) {
    super.initialize(wsService);
    
    // Register for events
    eventBus.on('vote.created', this.handleVoteCreated);
    eventBus.on('vote.submitted', this.handleVoteSubmitted);
    eventBus.on('vote.completed', this.handleVoteCompleted);
    
    voteLogger.info('Vote adapter initialized');
    
    return this;
  }

  shutdown() {
    // Unregister event listeners
    eventBus.off('vote.created', this.handleVoteCreated);
    eventBus.off('vote.submitted', this.handleVoteSubmitted);
    eventBus.off('vote.completed', this.handleVoteCompleted);
    
    voteLogger.info('Vote adapter shut down');
  }

  async handleMessage(client, message) {
    // Validate message format
    if (!messageValidator.validate(message, VOTE_MESSAGE_SCHEMA)) {
      this.service.sendToClient(client.id, {
        type: 'vote',
        action: 'error',
        data: { message: 'Invalid message format' }
      });
      return;
    }

    switch (message.action) {
      case 'submit':
        await this.handleVoteSubmit(client, message.data);
        break;
      case 'get':
        await this.handleGetVote(client, message.data);
        break;
      case 'getActive':
        await this.handleGetActiveVotes(client);
        break;
      case 'create':
        await this.handleCreateVote(client, message.data);
        break;
      default:
        this.service.sendToClient(client.id, {
          type: 'vote',
          action: 'error',
          data: { message: 'Unknown action' }
        });
    }
  }

  async handleVoteSubmit(client, data) {
    try {
      const { voteId, choice } = data;
      
      if (!voteId || choice === undefined) {
        this.service.sendToClient(client.id, {
          type: 'vote',
          action: 'error',
          data: { message: 'Missing required fields' }
        });
        return;
      }
      
      // Submit vote
      const result = await voteService.submitVote(voteId, client.userId, choice);
      
      // Send response
      this.service.sendToClient(client.id, {
        type: 'vote',
        action: 'submitResult',
        data: result
      });
      
      voteLogger.debug(`User ${client.userId} submitted vote for ${voteId}`);
    } catch (error) {
      voteLogger.error(`Error submitting vote:`, error);
      this.service.sendToClient(client.id, {
        type: 'vote',
        action: 'error',
        data: { message: 'Failed to submit vote' }
      });
    }
  }

  async handleGetVote(client, data) {
    try {
      const { voteId } = data;
      
      if (!voteId) {
        this.service.sendToClient(client.id, {
          type: 'vote',
          action: 'error',
          data: { message: 'Vote ID is required' }
        });
        return;
      }
      
      // Get vote details
      const vote = await voteService.getVoteById(voteId);
      
      if (!vote) {
        this.service.sendToClient(client.id, {
          type: 'vote',
          action: 'error',
          data: { message: 'Vote not found' }
        });
        return;
      }
      
      // Send response
      this.service.sendToClient(client.id, {
        type: 'vote',
        action: 'voteDetails',
        data: vote
      });
      
      voteLogger.debug(`Sent vote details for ${voteId} to user ${client.userId}`);
    } catch (error) {
      voteLogger.error(`Error getting vote:`, error);
      this.service.sendToClient(client.id, {
        type: 'vote',
        action: 'error',
        data: { message: 'Failed to get vote details' }
      });
    }
  }

  async handleGetActiveVotes(client) {
    try {
      // Get active votes
      const activeVotes = await voteService.getActiveVotes();
      
      // Send response
      this.service.sendToClient(client.id, {
        type: 'vote',
        action: 'activeVotes',
        data: { votes: activeVotes }
      });
      
      voteLogger.debug(`Sent active votes to user ${client.userId}`);
    } catch (error) {
      voteLogger.error(`Error getting active votes:`, error);
      this.service.sendToClient(client.id, {
        type: 'vote',
        action: 'error',
        data: { message: 'Failed to get active votes' }
      });
    }
  }

  async handleCreateVote(client, data) {
    try {
      const { title, description, options, endTime } = data;
      
      if (!title || !options || !Array.isArray(options) || options.length < 2) {
        this.service.sendToClient(client.id, {
          type: 'vote',
          action: 'error',
          data: { message: 'Invalid vote data' }
        });
        return;
      }
      
      // Create vote
      const vote = await voteService.createVote({
        title,
        description,
        options,
        endTime,
        createdBy: client.userId
      });
      
      // Send response
      this.service.sendToClient(client.id, {
        type: 'vote',
        action: 'voteCreated',
        data: { vote }
      });
      
      voteLogger.debug(`User ${client.userId} created vote ${vote.id}`);
    } catch (error) {
      voteLogger.error(`Error creating vote:`, error);
      this.service.sendToClient(client.id, {
        type: 'vote',
        action: 'error',
        data: { message: 'Failed to create vote' }
      });
    }
  }

  handleVoteCreated(vote) {
    // Add to active votes
    this.activeVotes.set(vote.id, vote);
    
    // Broadcast to all clients
    this.service.broadcast({
      type: 'vote',
      action: 'voteCreated',
      data: { vote }
    });
    
    voteLogger.debug(`Vote created: ${vote.id}`);
  }

  handleVoteSubmitted(data) {
    const { voteId, userId, totalVotes } = data;
    
    // Broadcast vote update
    this.service.broadcast({
      type: 'vote',
      action: 'voteUpdated',
      data: {
        voteId,
        totalVotes
      }
    });
    
    voteLogger.debug(`Vote submitted: ${voteId} by ${userId}`);
  }

  handleVoteCompleted(vote) {
    // Remove from active votes
    this.activeVotes.delete(vote.id);
    
    // Broadcast vote completion
    this.service.broadcast({
      type: 'vote',
      action: 'voteCompleted',
      data: { vote }
    });
    
    voteLogger.debug(`Vote completed: ${vote.id}`);
  }

  onClientConnect(client) {
    voteLogger.debug(`Client ${client.id} connected to vote service`);
  }

  onClientDisconnect(client) {
    voteLogger.debug(`Client ${client.id} disconnected from vote service`);
  }
}

export default new VoteAdapter();
