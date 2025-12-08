/**
 * Global Commission Service
 * Manages automated collection and distribution of global commissions
 * Handles founder account management and transparent fund allocation
 */

import { BaseService } from '../utils/BaseService.mjs';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { getDataFilePath } from '../utils/storage/fileStorage.mjs';
import crypto from 'crypto';
import blockchain from '../blockchain-service/index.mjs';
import logger from '../utils/logging/logger.mjs';

class GlobalCommissionService extends BaseService {
    constructor() {
        super('global-commission');
        
        // Data file paths
        this.commissionsFile = getDataFilePath('global-commissions.json');
        this.founderAccountFile = getDataFilePath('founder-account.json');
        this.paymentHistoryFile = getDataFilePath('commission-payments.json');
        
        // In-memory state
        this.commissions = new Map();
        this.paymentHistory = new Map();
        this.founderAccount = null;
        
        // Configuration - starts at default values, changed by community votes
        this.config = {
            globalCommissionRate: 1.0, // 1% default (votable parameter)
            founderAccountId: null,
            founderAccountAddress: null,
            processingInterval: 60 * 1000, // Process every minute
            minimumTransferAmount: 1000, // Minimum satoshis before transfer
            transparencyReportInterval: 24 * 60 * 60 * 1000 // Daily reports
        };
        
        // Commission collection queue
        this.pendingCommissions = new Map();
        this.processingQueue = [];
    }

    async _initializeService() {
        await this.loadCommissionData();
        await this.initializeFounderAccount();
        await this.startCommissionProcessing();
        await this.startTransparencyReporting();
        this.logger.info('Global Commission Service initialized');
    }

    /**
     * Load commission data from disk
     */
    async loadCommissionData() {
        try {
            // Load commission history
            if (existsSync(this.commissionsFile)) {
                const commissionsData = JSON.parse(readFileSync(this.commissionsFile, 'utf8'));
                for (const commission of commissionsData.commissions || []) {
                    this.commissions.set(commission.id, commission);
                }
            }

            // Load founder account data
            if (existsSync(this.founderAccountFile)) {
                const founderData = JSON.parse(readFileSync(this.founderAccountFile, 'utf8'));
                this.founderAccount = founderData;
                this.config.founderAccountId = founderData.userId;
                this.config.founderAccountAddress = founderData.walletAddress;
            }

            // Load payment history
            if (existsSync(this.paymentHistoryFile)) {
                const paymentData = JSON.parse(readFileSync(this.paymentHistoryFile, 'utf8'));
                for (const payment of paymentData.payments || []) {
                    this.paymentHistory.set(payment.id, payment);
                }
            }

            this.logger.info('Commission data loaded', {
                commissions: this.commissions.size,
                payments: this.paymentHistory.size,
                founderAccount: !!this.founderAccount
            });
        } catch (error) {
            this.logger.error('Failed to load commission data', { error: error.message });
            await this.saveCommissionData();
        }
    }

    /**
     * Save commission data to disk
     */
    async saveCommissionData() {
        try {
            // Save commissions
            const commissionsData = {
                lastUpdated: Date.now(),
                commissions: Array.from(this.commissions.values())
            };
            writeFileSync(this.commissionsFile, JSON.stringify(commissionsData, null, 2));

            // Save founder account
            if (this.founderAccount) {
                writeFileSync(this.founderAccountFile, JSON.stringify(this.founderAccount, null, 2));
            }

            // Save payment history
            const paymentData = {
                lastUpdated: Date.now(),
                payments: Array.from(this.paymentHistory.values())
            };
            writeFileSync(this.paymentHistoryFile, JSON.stringify(paymentData, null, 2));

        } catch (error) {
            this.logger.error('Failed to save commission data', { error: error.message });
        }
    }

    /**
     * Initialize founder account if not exists
     */
    async initializeFounderAccount() {
        if (!this.founderAccount) {
            // Create default founder account structure
            this.founderAccount = {
                userId: 'relay-founder',
                accountId: crypto.randomUUID(),
                walletAddress: null, // Set by founder
                totalCommissionsCollected: 0,
                totalPaymentsProcessed: 0,
                accountCreated: Date.now(),
                lastActivity: Date.now(),
                status: 'active',
                permissions: {
                    collectCommissions: true,
                    manageBounties: true,
                    approveGlobalProposals: true,
                    systemAdministration: true
                }
            };

            this.config.founderAccountId = this.founderAccount.userId;
            await this.saveCommissionData();
            
            this.logger.info('Founder account initialized', { 
                accountId: this.founderAccount.accountId 
            });
        }
    }

    /**
     * Start automated commission processing
     */
    async startCommissionProcessing() {
        setInterval(async () => {
            await this.processCommissionQueue();
        }, this.config.processingInterval);

        this.logger.info('Commission processing started', {
            interval: this.config.processingInterval
        });
    }

    /**
     * Start transparency reporting
     */
    async startTransparencyReporting() {
        setInterval(async () => {
            await this.generateTransparencyReport();
        }, this.config.transparencyReportInterval);
    }

    /**
     * Process a channel donation and calculate global commission
     */
    async processChannelDonation(donationData) {
        try {
            this._trackOperation();

            const {
                donationId,
                channelId,
                amount,
                currency,
                regionId,
                timestamp = Date.now()
            } = donationData;

            // Get current global commission rate (from community-voted parameter)
            const globalRate = await this.getGlobalCommissionRate();
            
            if (globalRate === 0) {
                // No commission to collect
                this.logger.debug('Global commission rate is 0%, skipping collection', { donationId });
                return { success: true, commission: 0 };
            }

            // Calculate commission amount
            const commissionAmount = Math.floor(amount * (globalRate / 100));
            
            if (commissionAmount < this.config.minimumTransferAmount) {
                // Too small to process individually, add to pending
                this.addToPendingCommissions(donationData, commissionAmount);
                return { success: true, commission: commissionAmount, queued: true };
            }

            // Create commission record
            const commissionId = crypto.randomUUID();
            const commission = {
                id: commissionId,
                donationId,
                channelId,
                regionId,
                sourceAmount: amount,
                currency,
                commissionRate: globalRate,
                commissionAmount,
                status: 'pending',
                createdAt: timestamp,
                processedAt: null,
                transferTxId: null,
                founderAccountId: this.config.founderAccountId
            };

            this.commissions.set(commissionId, commission);
            this.processingQueue.push(commissionId);

            await this.saveCommissionData();

            // Record on blockchain for transparency
            await this.recordCommissionOnBlockchain(commission);

            this.emit('commission.created', { commission });
            this.logger.info('Global commission created', { 
                commissionId, 
                donationId, 
                amount: commissionAmount,
                rate: globalRate 
            });

            return { success: true, commission: commissionAmount, commissionId };
        } catch (error) {
            this._handleError('processChannelDonation', error);
            throw error;
        }
    }

    /**
     * Add small commissions to pending queue for batch processing
     */
    addToPendingCommissions(donationData, commissionAmount) {
        const key = `${donationData.currency}-${donationData.regionId || 'global'}`;
        
        if (!this.pendingCommissions.has(key)) {
            this.pendingCommissions.set(key, {
                currency: donationData.currency,
                regionId: donationData.regionId,
                totalAmount: 0,
                donations: [],
                lastUpdated: Date.now()
            });
        }

        const pending = this.pendingCommissions.get(key);
        pending.totalAmount += commissionAmount;
        pending.donations.push({
            donationId: donationData.donationId,
            channelId: donationData.channelId,
            amount: commissionAmount,
            timestamp: donationData.timestamp || Date.now()
        });
        pending.lastUpdated = Date.now();

        // If accumulated amount is large enough, process it
        if (pending.totalAmount >= this.config.minimumTransferAmount) {
            this.processPendingCommissions(key);
        }
    }

    /**
     * Process accumulated pending commissions
     */
    async processPendingCommissions(key) {
        try {
            const pending = this.pendingCommissions.get(key);
            if (!pending || pending.totalAmount === 0) return;

            // Create batch commission record
            const commissionId = crypto.randomUUID();
            const commission = {
                id: commissionId,
                type: 'batch',
                donationIds: pending.donations.map(d => d.donationId),
                sourceAmount: pending.donations.reduce((sum, d) => sum + d.amount, 0),
                currency: pending.currency,
                regionId: pending.regionId,
                commissionAmount: pending.totalAmount,
                donationCount: pending.donations.length,
                status: 'pending',
                createdAt: Date.now(),
                processedAt: null,
                transferTxId: null,
                founderAccountId: this.config.founderAccountId
            };

            this.commissions.set(commissionId, commission);
            this.processingQueue.push(commissionId);

            // Clear pending
            this.pendingCommissions.delete(key);

            await this.saveCommissionData();
            await this.recordCommissionOnBlockchain(commission);

            this.logger.info('Batch commission created from pending', {
                commissionId,
                amount: pending.totalAmount,
                donationCount: pending.donations.length
            });
        } catch (error) {
            this.logger.error('Failed to process pending commissions', { error: error.message });
        }
    }

    /**
     * Process commission payment queue
     */
    async processCommissionQueue() {
        try {
            if (this.processingQueue.length === 0) return;

            const commissionId = this.processingQueue.shift();
            const commission = this.commissions.get(commissionId);
            
            if (!commission || commission.status !== 'pending') return;

            // Process the payment
            const paymentResult = await this.transferCommissionToFounder(commission);
            
            if (paymentResult.success) {
                commission.status = 'completed';
                commission.processedAt = Date.now();
                commission.transferTxId = paymentResult.transactionId;

                // Update founder account
                this.founderAccount.totalCommissionsCollected += commission.commissionAmount;
                this.founderAccount.totalPaymentsProcessed += 1;
                this.founderAccount.lastActivity = Date.now();

                // Record payment in history
                const paymentId = crypto.randomUUID();
                const payment = {
                    id: paymentId,
                    commissionId,
                    amount: commission.commissionAmount,
                    currency: commission.currency,
                    transactionId: paymentResult.transactionId,
                    timestamp: Date.now(),
                    founderAccount: this.config.founderAccountId
                };

                this.paymentHistory.set(paymentId, payment);

                await this.saveCommissionData();

                this.emit('commission.processed', { commission, payment });
                this.logger.info('Commission payment processed', {
                    commissionId,
                    amount: commission.commissionAmount,
                    transactionId: paymentResult.transactionId
                });
            } else {
                commission.status = 'failed';
                commission.error = paymentResult.error;
                this.logger.error('Commission payment failed', {
                    commissionId,
                    error: paymentResult.error
                });
            }
        } catch (error) {
            this.logger.error('Error processing commission queue', { error: error.message });
        }
    }

    /**
     * Transfer commission to founder account
     */
    async transferCommissionToFounder(commission) {
        try {
            // This would integrate with actual payment processing
            // For now, simulate the transfer
            
            if (!this.config.founderAccountAddress) {
                return {
                    success: false,
                    error: 'Founder wallet address not configured'
                };
            }

            // Simulate payment processing
            const transactionId = `tx_${crypto.randomUUID()}`;
            
            // In real implementation, this would:
            // 1. Connect to payment gateway / crypto wallet
            // 2. Create transaction to founder's address
            // 3. Wait for confirmation
            // 4. Return transaction ID
            
            this.logger.info('Commission transfer simulated', {
                amount: commission.commissionAmount,
                currency: commission.currency,
                founderAddress: this.config.founderAccountAddress,
                transactionId
            });

            return {
                success: true,
                transactionId,
                timestamp: Date.now()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get current global commission rate from parameters
     */
    async getGlobalCommissionRate() {
        try {
            // This would integrate with parameter governance service
            // For now, return configured rate
            return this.config.globalCommissionRate;
        } catch (error) {
            this.logger.warn('Could not get global commission rate, using default', { error: error.message });
            return this.config.globalCommissionRate;
        }
    }

    /**
     * Update global commission rate (called when parameter changes)
     */
    async updateGlobalCommissionRate(newRate, proposalId) {
        try {
            const oldRate = this.config.globalCommissionRate;
            this.config.globalCommissionRate = newRate;

            await this.saveCommissionData();

            // Record rate change on blockchain
            await this.recordRateChangeOnBlockchain(oldRate, newRate, proposalId);

            this.emit('commission.rate.changed', { oldRate, newRate, proposalId });
            this.logger.info('Global commission rate updated', { oldRate, newRate, proposalId });

            return { success: true };
        } catch (error) {
            this._handleError('updateGlobalCommissionRate', error);
            throw error;
        }
    }

    /**
     * Set founder wallet address
     */
    async setFounderWalletAddress(walletAddress, currency = 'BTC') {
        try {
            if (!this.founderAccount) {
                throw new Error('Founder account not initialized');
            }

            this.founderAccount.walletAddress = walletAddress;
            this.founderAccount.currency = currency;
            this.config.founderAccountAddress = walletAddress;

            await this.saveCommissionData();

            this.emit('founder.wallet.updated', { walletAddress, currency });
            this.logger.info('Founder wallet address updated', { currency, addressPrefix: walletAddress.substring(0, 10) });

            return { success: true };
        } catch (error) {
            this._handleError('setFounderWalletAddress', error);
            throw error;
        }
    }

    /**
     * Generate transparency report
     */
    async generateTransparencyReport() {
        try {
            const now = Date.now();
            const oneDayAgo = now - (24 * 60 * 60 * 1000);

            // Get recent commissions
            const recentCommissions = Array.from(this.commissions.values())
                .filter(c => c.createdAt >= oneDayAgo);

            // Get recent payments
            const recentPayments = Array.from(this.paymentHistory.values())
                .filter(p => p.timestamp >= oneDayAgo);

            const report = {
                reportId: crypto.randomUUID(),
                timestamp: now,
                period: '24h',
                globalCommissionRate: this.config.globalCommissionRate,
                founderAccount: {
                    accountId: this.founderAccount?.accountId,
                    totalCollected: this.founderAccount?.totalCommissionsCollected || 0,
                    totalPayments: this.founderAccount?.totalPaymentsProcessed || 0
                },
                summary: {
                    commissionsCreated: recentCommissions.length,
                    commissionsProcessed: recentCommissions.filter(c => c.status === 'completed').length,
                    commissionsFailed: recentCommissions.filter(c => c.status === 'failed').length,
                    totalCommissionAmount: recentCommissions.reduce((sum, c) => sum + c.commissionAmount, 0),
                    totalPaymentAmount: recentPayments.reduce((sum, p) => sum + p.amount, 0),
                    pendingCommissions: this.processingQueue.length
                },
                details: {
                    recentCommissions: recentCommissions.map(c => ({
                        id: c.id,
                        amount: c.commissionAmount,
                        currency: c.currency,
                        status: c.status,
                        createdAt: c.createdAt
                    })),
                    recentPayments: recentPayments.map(p => ({
                        id: p.id,
                        amount: p.amount,
                        currency: p.currency,
                        transactionId: p.transactionId,
                        timestamp: p.timestamp
                    }))
                }
            };

            // Record report on blockchain for transparency
            await this.recordTransparencyReport(report);

            this.emit('transparency.report', { report });
            this.logger.info('Transparency report generated', {
                reportId: report.reportId,
                commissionsCreated: report.summary.commissionsCreated,
                totalAmount: report.summary.totalCommissionAmount
            });

            return report;
        } catch (error) {
            this.logger.error('Failed to generate transparency report', { error: error.message });
        }
    }

    /**
     * Record commission on blockchain for transparency
     */
    async recordCommissionOnBlockchain(commission) {
        try {
            const blockData = {
                type: 'global_commission',
                commissionId: commission.id,
                sourceAmount: commission.sourceAmount,
                commissionAmount: commission.commissionAmount,
                commissionRate: commission.commissionRate,
                currency: commission.currency,
                timestamp: commission.createdAt,
                founderAccount: commission.founderAccountId
            };

            await blockchain.addTransaction('global_commission', blockData, crypto.randomUUID());
            await blockchain.mine();
        } catch (error) {
            this.logger.error('Failed to record commission on blockchain', { error: error.message });
        }
    }

    /**
     * Record rate change on blockchain
     */
    async recordRateChangeOnBlockchain(oldRate, newRate, proposalId) {
        try {
            const blockData = {
                type: 'commission_rate_change',
                oldRate,
                newRate,
                proposalId,
                timestamp: Date.now(),
                changedBy: 'community_vote'
            };

            await blockchain.addTransaction('commission_rate_change', blockData, crypto.randomUUID());
            await blockchain.mine();
        } catch (error) {
            this.logger.error('Failed to record rate change on blockchain', { error: error.message });
        }
    }

    /**
     * Record transparency report on blockchain
     */
    async recordTransparencyReport(report) {
        try {
            const blockData = {
                type: 'transparency_report',
                reportId: report.reportId,
                timestamp: report.timestamp,
                summary: report.summary,
                globalCommissionRate: report.globalCommissionRate
            };

            await blockchain.addTransaction('transparency_report', blockData, crypto.randomUUID());
            await blockchain.mine();
        } catch (error) {
            this.logger.error('Failed to record transparency report on blockchain', { error: error.message });
        }
    }

    /**
     * Get commission statistics
     */
    getCommissionStats() {
        const allCommissions = Array.from(this.commissions.values());
        const allPayments = Array.from(this.paymentHistory.values());

        return {
            totalCommissions: allCommissions.length,
            totalCommissionAmount: allCommissions.reduce((sum, c) => sum + c.commissionAmount, 0),
            completedCommissions: allCommissions.filter(c => c.status === 'completed').length,
            pendingCommissions: allCommissions.filter(c => c.status === 'pending').length,
            failedCommissions: allCommissions.filter(c => c.status === 'failed').length,
            totalPayments: allPayments.length,
            totalPaymentAmount: allPayments.reduce((sum, p) => sum + p.amount, 0),
            currentRate: this.config.globalCommissionRate,
            founderAccount: this.founderAccount
        };
    }

    /**
     * Get commission by ID
     */
    getCommission(commissionId) {
        return this.commissions.get(commissionId);
    }    /**
     * Get payment history
     */
    getPaymentHistory(limit = 100) {
        return Array.from(this.paymentHistory.values())
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }
}

// Export both class and singleton instance
export { GlobalCommissionService };
export default new GlobalCommissionService();
