//backend/routes/index.mjs
// Central router file to organize and export all route modules

import { Router } from 'express';
import authRoutes from './auth.mjs';
import userRoutes from './user.mjs';
import locationRoutes from './location.mjs';
import votingRoutes from './vote.mjs';
import contentRoutes from './content.mjs';
import notificationRoutes from './notifications.mjs';
// Add the new biometrics route
import biometricsRoutes from '../api/biometricsApi.mjs';
import keySpaceRoutes from './keySpace.mjs';
import healthApi from '../api/healthApi.mjs';
// Add missing routes
import globalParametersRoutes from './globalParameters.mjs';
import inviteRoutes from './invite.mjs';
// import blockchainRoutes from './blockchain.mjs'; // File not found - commented out
import recoveryRoutes from './recovery.mjs';
import privacyRoutes from './privacy.mjs';
// Add new production routes
import regionalRoutes from './regional.mjs';
import globalCommissionRoutes from './globalCommission.mjs';
import microshardingRoutes from './microsharding.mjs';
// Add onboarding routes
import onboardingRoutes from './onboarding.mjs';
// Add new trust and verification routes
import trustRoutes from './trust.mjs';
import hotspotRoutes from './hotspots.mjs';
import verificationRoutes from './verification.mjs';
// Add category routes
import categoryRoutes from './categories.mjs';
// Add vote counts routes  
import voteCountsRoutes from './voteCounts.mjs';

const router = Router();

// Register routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/location', locationRoutes);
router.use('/vote', votingRoutes);
router.use('/content', contentRoutes);
router.use('/notifications', notificationRoutes);
// Add the biometrics route
router.use('/biometrics', biometricsRoutes);
router.use('/keyspace', keySpaceRoutes);
// Add missing routes
router.use('/global-parameters', globalParametersRoutes);
router.use('/invites', inviteRoutes);
router.use('/system-parameters', globalParametersRoutes); // Alias for system parameters
// router.use('/blockchain', blockchainRoutes); // File not found - commented out
router.use('/recovery', recoveryRoutes);
router.use('/privacy', privacyRoutes);
// Add new production routes
router.use('/regional', regionalRoutes);
router.use('/commission', globalCommissionRoutes);
router.use('/microsharding', microshardingRoutes);
// Add onboarding routes
router.use('/onboarding', onboardingRoutes);
// Add new trust and verification routes
router.use('/trust', trustRoutes);
router.use('/hotspots', hotspotRoutes);
router.use('/verification', verificationRoutes);
// Add category routes
router.use('/categories', categoryRoutes);
// Add vote counts routes
router.use('/vote-counts', voteCountsRoutes);

/**
 * Register API routes
 * @param {express.Application} app - Express application
 */
export function registerRoutes(app) {
  // ...existing routes
  
  // Health API routes
  app.use('/api/health', healthApi);
  
  // ...other routes
}

export default router;
