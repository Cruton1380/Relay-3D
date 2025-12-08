// backend/api/routes/filters.mjs
import express from 'express';
import { requireAuth } from '../../auth/middleware/index.mjs';
import filterRepository from '../../database/repositories/FilterRepository.mjs';
import { loggerService } from '../../di-container/services.mjs';

const router = express.Router();

// Get community filters with vote counts
router.get('/community-filters', requireAuth, async (req, res) => {
  try {
    const result = await filterRepository.getCommunityFiltersWithVotes();
    res.json(result);
  } catch (error) {
    loggerService.error('Failed to fetch community filters:', error);
    res.status(500).json({ error: 'Failed to fetch filters' });
  }
});

// Vote for a filter
router.post('/vote', requireAuth, async (req, res) => {
  try {
    const { filterId, voteType, userId } = req.body;
    
    const voteCount = await filterRepository.voteForFilter(filterId, userId, voteType);
    res.json(voteCount);
    
  } catch (error) {
    loggerService.error('Failed to vote for filter:', error);
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to process vote' });
  }
});

// Create new community filter
router.post('/create', requireAuth, async (req, res) => {
  try {
    const { name, description, criteria, createdBy } = req.body;
    
    const result = await filterRepository.createFilter({ name, description, criteria, createdBy });
    res.json(result);
    
  } catch (error) {
    loggerService.error('Failed to create filter:', error);
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to create filter' });
  }
});

// Apply filters to data
router.post('/apply', requireAuth, async (req, res) => {
  try {
    const { filterIds, dataType } = req.body;
    
    if (!filterIds || !Array.isArray(filterIds)) {
      return res.status(400).json({ error: 'Filter IDs must be an array' });
    }

    // Get the appropriate repository for the data type
    let dataRepo;
    switch (dataType) {
      case 'votes':
        dataRepo = getRepository('votes');
        break;
      case 'users':
        dataRepo = getRepository('users');
        break;
      case 'regions':
        dataRepo = getRepository('regions');
        break;
      default:
        return res.status(400).json({ error: 'Invalid data type' });
    }
    
    const result = await filterRepository.applyFilters(filterIds, dataType, dataRepo);
    res.json(result);
    
  } catch (error) {
    loggerService.error('Failed to apply filters:', error);
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to apply filters' });
  }
});

export default router;
