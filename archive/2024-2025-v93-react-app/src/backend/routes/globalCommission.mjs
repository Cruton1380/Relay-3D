/**
 * Global Commission API Routes
 * Handles commission collection, founder payments, and transparency reporting
 */
import express from 'express';
import { authenticate as authMiddleware } from '../middleware/auth.mjs';
import logger from '../utils/logging/logger.mjs';

// Import global commission service
import globalCommissionService from '../services/globalCommissionService.mjs';

const router = express.Router();
const commissionLogger = logger.child({ module: 'commission-api' });

// ========================================
// COMMISSION COLLECTION
// ========================================

/**
 * Get commission collection status
 */
router.get('/status', async (req, res) => {
    try {
        const status = globalCommissionService.getCollectionStatus();
        res.json({ success: true, status });
    } catch (error) {
        commissionLogger.error('Error getting commission status:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Manually trigger commission collection (admin only)
 */
router.post('/collect', authMiddleware, async (req, res) => {
    try {
        // In production, add admin role check here
        const result = await globalCommissionService.collectCommissions();
        res.json({ success: true, result });
    } catch (error) {
        commissionLogger.error('Error collecting commissions:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get commission collection history
 */
router.get('/collections', async (req, res) => {
    try {
        const { limit, offset } = req.query;
        const collections = globalCommissionService.getCollectionHistory(
            parseInt(limit) || 50,
            parseInt(offset) || 0
        );
        res.json({ success: true, collections });
    } catch (error) {
        commissionLogger.error('Error getting collection history:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// FOUNDER ACCOUNT & PAYMENTS
// ========================================

/**
 * Get founder account status
 */
router.get('/founder/account', async (req, res) => {
    try {
        const account = globalCommissionService.getFounderAccount();
        res.json({ success: true, account });
    } catch (error) {
        commissionLogger.error('Error getting founder account:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Update founder account (founder only)
 */
router.put('/founder/account', authMiddleware, async (req, res) => {
    try {
        const { paymentAddress, contactInfo } = req.body;
        const founderId = req.user.id;

        // In production, verify founder identity
        const result = await globalCommissionService.updateFounderAccount(
            founderId, 
            { paymentAddress, contactInfo }
        );
        res.json({ success: true, account: result });
    } catch (error) {
        commissionLogger.error('Error updating founder account:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get payment history
 */
router.get('/payments', async (req, res) => {
    try {
        const { limit } = req.query;
        const payments = globalCommissionService.getPaymentHistory(
            parseInt(limit) || 100
        );
        res.json({ success: true, payments });
    } catch (error) {
        commissionLogger.error('Error getting payment history:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get specific payment details
 */
router.get('/payments/:paymentId', async (req, res) => {
    try {
        const { paymentId } = req.params;
        const payment = globalCommissionService.getPayment(paymentId);
        
        if (!payment) {
            return res.status(404).json({ success: false, error: 'Payment not found' });
        }

        res.json({ success: true, payment });
    } catch (error) {
        commissionLogger.error('Error getting payment:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// TRANSPARENCY & REPORTING
// ========================================

/**
 * Get comprehensive commission report
 */
router.get('/report', async (req, res) => {
    try {
        const { period } = req.query; // 'monthly', 'quarterly', 'yearly'
        
        const report = globalCommissionService.generateTransparencyReport(period || 'monthly');
        res.json({ success: true, report });
    } catch (error) {
        commissionLogger.error('Error generating report:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get commission metrics
 */
router.get('/metrics', async (req, res) => {
    try {
        const metrics = globalCommissionService.getCommissionMetrics();
        res.json({ success: true, metrics });
    } catch (error) {
        commissionLogger.error('Error getting metrics:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get regional commission breakdown
 */
router.get('/regions', async (req, res) => {
    try {
        const breakdown = globalCommissionService.getRegionalBreakdown();
        res.json({ success: true, breakdown });
    } catch (error) {
        commissionLogger.error('Error getting regional breakdown:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// SIMULATION & TESTING (DEV ONLY)
// ========================================

/**
 * Simulate commission collection (development only)
 */
router.post('/simulate', authMiddleware, async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({ 
                success: false, 
                error: 'Simulation endpoints not available in production' 
            });
        }

        const { amount, regionId } = req.body;
        const result = await globalCommissionService.simulateCommission(amount, regionId);
        res.json({ success: true, result });
    } catch (error) {
        commissionLogger.error('Error in simulation:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
