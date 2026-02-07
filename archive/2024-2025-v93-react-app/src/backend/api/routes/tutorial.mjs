// backend/api/routes/tutorial.mjs
import express from 'express';
import { requireAuth } from '../../auth/middleware/index.mjs';
import tutorialRepository from '../../database/repositories/TutorialRepository.mjs';
import { loggerService } from '../../di-container/services.mjs';

const router = express.Router();

// Get user tutorial status
router.get('/status/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await tutorialRepository.getUserTutorialStatus(userId);
    res.json(result);
    
  } catch (error) {
    loggerService.error('Failed to get tutorial status:', error);
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to get tutorial status' });
  }
});

// Mark tutorial as complete
router.post('/complete', requireAuth, async (req, res) => {
  try {
    const { userId, completedAt, interactionData } = req.body;
    
    const result = await tutorialRepository.completeTutorial(userId, completedAt, interactionData);
    res.json(result);
    
  } catch (error) {
    loggerService.error('Failed to mark tutorial as complete:', error);
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to complete tutorial' });
  }
});

// Get tutorial analytics (admin only)
router.get('/analytics', requireAuth, async (req, res) => {
  try {
    const result = await tutorialRepository.getTutorialAnalytics(req.user);
    res.json(result);
    
  } catch (error) {
    loggerService.error('Failed to get tutorial analytics:', error);
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to get analytics' });
  }
});

// Update tutorial step interaction
router.post('/interaction', requireAuth, async (req, res) => {
  try {
    const { userId, stepId, action, data } = req.body;
    
    const result = await tutorialRepository.logInteraction(userId, stepId, action, data);
    res.json(result);
    
  } catch (error) {
    loggerService.error('Failed to log tutorial interaction:', error);
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to log interaction' });
  }
});

export default router;
