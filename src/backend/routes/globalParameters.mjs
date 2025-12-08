//backend/routes/global-parameters.mjs
/**
 * Global Parameters API routes for Relay platform
 */

import express from 'express';
import { 
  getAllGlobalParameters,
  getGlobalParameter,
  voteOnGlobalParameter,
  getGlobalParameterVotingStatus
} from '../api/globalParametersApi.mjs';
import { authenticate } from '../auth/middleware/index.mjs';

const router = express.Router();

// Get all global parameters - public
router.get('/', getAllGlobalParameters);

// Get a specific global parameter - public
router.get('/:paramName', getGlobalParameter);

// Vote on a global parameter - requires authentication
router.post('/vote', authenticate(), voteOnGlobalParameter);

// Get voting status for a global parameter - public
router.get('/:paramName/voting-status', getGlobalParameterVotingStatus);

export default router;
