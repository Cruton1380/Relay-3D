/**
 * @fileoverview Chatroom API Routes
 * REST endpoints for chatroom functionality
 */

import express from 'express';
import logger from '../utils/logging/logger.mjs';
import channelChatroomEngine from '../channel-service/channelChatroomEngine.mjs';
import { asyncHandler } from '../utils/middleware/asyncHandler.mjs';

const router = express.Router();
const chatroomLogger = logger.child({ module: 'chatroom-api' });

/**
 * Join a chatroom
 * POST /api/chatroom/:channelId/join
 */
router.post('/:channelId/join', asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const { userId } = req.body;
  
  try {
    const result = await channelChatroomEngine.joinChatroom(channelId, userId);
    
    chatroomLogger.info('User joined chatroom', { 
      channelId, 
      userId,
      activeUsers: result.activeUsers?.length 
    });

    res.json({
      success: true,
      data: result,
      message: 'Successfully joined chatroom'
    });
  } catch (error) {
    chatroomLogger.error('Error joining chatroom', { 
      channelId, 
      userId, 
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

/**
 * Leave a chatroom
 * POST /api/chatroom/:channelId/leave
 */
router.post('/:channelId/leave', asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const { userId } = req.body;
  
  try {
    const result = await channelChatroomEngine.leaveChatroom(channelId, userId);
    
    chatroomLogger.info('User left chatroom', { 
      channelId, 
      userId,
      activeUsers: result.activeUsers?.length 
    });

    res.json({
      success: true,
      data: result,
      message: 'Successfully left chatroom'
    });
  } catch (error) {
    chatroomLogger.error('Error leaving chatroom', { 
      channelId, 
      userId, 
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

/**
 * Send a message
 * POST /api/chatroom/:channelId/message
 */
router.post('/:channelId/message', asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const { userId, content, messageType = 'text', replyTo } = req.body;
  
  try {
    // Prepare metadata with replyTo if provided
    const metadata = replyTo ? { replyTo } : {};
    
    const result = await channelChatroomEngine.sendMessage(
      channelId, 
      userId, 
      content, 
      messageType, 
      metadata
    );
    
    chatroomLogger.info('Message sent', { 
      channelId, 
      userId,
      messageId: result.message?.id 
    });

    res.json({
      success: true,
      data: result,
      message: 'Message sent successfully'
    });
  } catch (error) {
    chatroomLogger.error('Error sending message', { 
      channelId, 
      userId, 
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

/**
 * Get messages for a chatroom
 * GET /api/chatroom/:channelId/messages
 */
router.get('/:channelId/messages', asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const { limit = 50, offset = 0, ...filters } = req.query;
  
  try {
    const result = await channelChatroomEngine.getMessages(
      channelId, 
      filters,
      parseInt(limit),
      parseInt(offset)
    );
    
    chatroomLogger.info('Messages retrieved', { 
      channelId, 
      messageCount: result.messages?.length 
    });

    res.json({
      success: true,
      data: result,
      message: 'Messages retrieved successfully'
    });
  } catch (error) {
    chatroomLogger.error('Error retrieving messages', { 
      channelId, 
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

/**
 * Vote on a message (currently routes to user voting)
 * POST /api/chatroom/:channelId/message/:messageId/vote
 */
router.post('/:channelId/message/:messageId/vote', asyncHandler(async (req, res) => {
  const { channelId, messageId } = req.params;
  const { userId, voteType } = req.body; // 'upvote' or 'downvote'
  
  try {
    // For now, we'll route message votes to user votes (vote on the message author)
    // This is a simplified implementation - in production you'd want dedicated message voting
    const result = await channelChatroomEngine.voteOnUser(
      channelId, 
      userId, 
      messageId, // Using messageId as targetUserId temporarily
      voteType === 'upvote' ? 'positive' : 'negative',
      messageId
    );
    
    chatroomLogger.info('Message vote cast (routed to user vote)', { 
      channelId, 
      messageId,
      userId,
      voteType 
    });

    res.json({
      success: true,
      data: result,
      message: 'Vote cast successfully'
    });
  } catch (error) {
    chatroomLogger.error('Error voting on message', { 
      channelId, 
      messageId,
      userId,
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

/**
 * Get chatroom status and settings
 * GET /api/chatroom/:channelId/status
 */
router.get('/:channelId/status', asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  
  try {
    // Get basic chatroom info by creating/accessing it
    const chatroom = await channelChatroomEngine.createChatroom(channelId, { 
      name: `Channel ${channelId}` 
    });
    
    res.json({
      success: true,
      data: {
        channelId,
        exists: !!chatroom,
        settings: chatroom?.settings || {},
        activeUsers: chatroom?.activeUsers || [],
        messageCount: chatroom?.messageCount || 0
      },
      message: 'Chatroom status retrieved successfully'
    });
  } catch (error) {
    chatroomLogger.error('Error getting chatroom status', { 
      channelId, 
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

/**
 * Update chatroom settings
 * PUT /api/chatroom/:channelId/settings
 */
router.put('/:channelId/settings', asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const settings = req.body;
  
  try {
    const result = await channelChatroomEngine.updateModerationSettings(channelId, settings);
    
    chatroomLogger.info('Chatroom settings updated', { 
      channelId, 
      settings 
    });

    res.json({
      success: true,
      data: result,
      message: 'Chatroom settings updated successfully'
    });
  } catch (error) {
    chatroomLogger.error('Error updating chatroom settings', { 
      channelId, 
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

/**
 * Get active users in chatroom
 * GET /api/chatroom/:channelId/users
 */
router.get('/:channelId/users', asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  
  try {
    // Get chatroom info which includes active users
    const chatroom = await channelChatroomEngine.createChatroom(channelId, { 
      name: `Channel ${channelId}` 
    });
    
    res.json({
      success: true,
      data: {
        activeUsers: chatroom?.activeUsers || [],
        totalCount: chatroom?.activeUsers?.length || 0
      },
      message: 'Active users retrieved successfully'
    });
  } catch (error) {
    chatroomLogger.error('Error getting active users', { 
      channelId, 
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

export default router;
