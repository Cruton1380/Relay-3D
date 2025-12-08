/**
 * Regional Multi-Signature Service
 * Manages multi-signature governance for regional officials
 * Coordinates spending proposals, approvals, and treasury management
 */

import { BaseService } from '../utils/BaseService.mjs';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { getDataFilePath } from '../utils/storage/fileStorage.mjs';
import crypto from 'crypto';
import blockchain from '../blockchain-service/index.mjs';
import logger from '../utils/logging/logger.mjs';
import regionalGovernanceService from './regionalGovernanceService.mjs';

class RegionalMultiSigService extends BaseService {
    constructor() {
        super('regional-multisig');
        
        // Data file paths
        this.multiSigFile = getDataFilePath('regional-multisig.json');
        this.proposalsFile = getDataFilePath('regional-proposals.json');
        this.treasuryFile = getDataFilePath('regional-treasury.json');
        
        // In-memory state
        this.multiSigWallets = new Map(); // regionId -> wallet config
        this.proposals = new Map();
        this.treasuries = new Map();
        this.signatures = new Map();
        
        // Configuration
        this.config = {
            // Default approval thresholds
            defaultApprovalThreshold: 3, // At least 3 officials must approve
            maxOfficials: 5, // Maximum 5 officials per region
            proposalTimeoutDays: 30, // Proposals expire after 30 days
            minimumQuorum: 2, // Minimum officials needed for valid multisig
            treasuryReportInterval: 7 * 24 * 60 * 60 * 1000 // Weekly treasury reports
        };
    }

    async _initializeService() {
        await this.loadMultiSigData();
        await this.startProposalMonitoring();
        await this.startTreasuryReporting();
        this.logger.info('Regional Multi-Signature Service initialized');
    }

    /**
     * Load multi-signature data from disk
     */
    async loadMultiSigData() {
        try {
            // Load multi-sig wallets
            if (existsSync(this.multiSigFile)) {
                const multiSigData = JSON.parse(readFileSync(this.multiSigFile, 'utf8'));
                for (const wallet of multiSigData.wallets || []) {
                    this.multiSigWallets.set(wallet.regionId, wallet);
                }
            }

            // Load proposals
            if (existsSync(this.proposalsFile)) {
                const proposalsData = JSON.parse(readFileSync(this.proposalsFile, 'utf8'));
                for (const proposal of proposalsData.proposals || []) {
                    this.proposals.set(proposal.id, proposal);
                }
            }

            // Load treasuries
            if (existsSync(this.treasuryFile)) {
                const treasuryData = JSON.parse(readFileSync(this.treasuryFile, 'utf8'));
                for (const treasury of treasuryData.treasuries || []) {
                    this.treasuries.set(treasury.regionId, treasury);
                }
            }

            this.logger.info('Multi-sig data loaded', {
                wallets: this.multiSigWallets.size,
                proposals: this.proposals.size,
                treasuries: this.treasuries.size
            });
        } catch (error) {
            this.logger.error('Failed to load multi-sig data', { error: error.message });
            await this.saveMultiSigData();
        }
    }

    /**
     * Save multi-signature data to disk
     */
    async saveMultiSigData() {
        try {
            // Save multi-sig wallets
            const multiSigData = {
                lastUpdated: Date.now(),
                wallets: Array.from(this.multiSigWallets.values())
            };
            writeFileSync(this.multiSigFile, JSON.stringify(multiSigData, null, 2));

            // Save proposals
            const proposalsData = {
                lastUpdated: Date.now(),
                proposals: Array.from(this.proposals.values())
            };
            writeFileSync(this.proposalsFile, JSON.stringify(proposalsData, null, 2));

            // Save treasuries
            const treasuryData = {
                lastUpdated: Date.now(),
                treasuries: Array.from(this.treasuries.values())
            };
            writeFileSync(this.treasuryFile, JSON.stringify(treasuryData, null, 2));

        } catch (error) {
            this.logger.error('Failed to save multi-sig data', { error: error.message });
        }
    }

    /**
     * Create or update regional multi-signature wallet
     */
    async createRegionalMultiSig(regionId, officials) {
        try {
            this._trackOperation();

            if (!officials || officials.length < this.config.minimumQuorum) {
                throw new Error(`Minimum ${this.config.minimumQuorum} officials required for multi-sig`);
            }

            if (officials.length > this.config.maxOfficials) {
                throw new Error(`Maximum ${this.config.maxOfficials} officials allowed`);
            }            // Get regional approval threshold parameter for OFFICIAL ELECTIONS ONLY (default 60%)
            const approvalThresholdParam = regionalGovernanceService.getRegionalParameters(regionId).officialElectionApprovalThreshold || 0.6;
            const approvalThreshold = Math.max(2, Math.ceil(officials.length * approvalThresholdParam));

            const walletId = crypto.randomUUID();
            const multiSigWallet = {
                id: walletId,
                regionId,
                officials: officials.map(official => ({
                    userId: official.userId,
                    position: official.position,
                    publicKey: official.publicKey || this.generatePublicKey(official.userId),
                    electionDate: official.electedAt,
                    status: 'active'
                })),
                approvalThreshold,
                totalOfficials: officials.length,
                createdAt: Date.now(),
                lastUpdated: Date.now(),
                status: 'active',
                walletAddress: null, // Set when actual wallet is deployed
                totalFunds: 0,
                spendingHistory: []
            };

            this.multiSigWallets.set(regionId, multiSigWallet);

            // Initialize regional treasury if not exists
            if (!this.treasuries.has(regionId)) {
                await this.initializeRegionalTreasury(regionId);
            }

            await this.saveMultiSigData();

            // Record on blockchain
            await this.recordMultiSigEvent('multisig_created', { regionId, wallet: multiSigWallet });

            this.emit('multisig.created', { regionId, wallet: multiSigWallet });
            this.logger.info('Regional multi-sig wallet created', {
                regionId,
                walletId,
                officials: officials.length,
                threshold: approvalThreshold
            });

            return { success: true, wallet: multiSigWallet };
        } catch (error) {
            this._handleError('createRegionalMultiSig', error);
            throw error;
        }
    }

    /**
     * Update multi-signature wallet when officials change
     */
    async updateRegionalMultiSig(regionId, newOfficials) {
        try {
            this._trackOperation();

            const existingWallet = this.multiSigWallets.get(regionId);
            if (!existingWallet) {
                // Create new wallet if none exists
                return await this.createRegionalMultiSig(regionId, newOfficials);
            }

            // Update officials list
            existingWallet.officials = newOfficials.map(official => ({
                userId: official.userId,
                position: official.position,
                publicKey: official.publicKey || this.generatePublicKey(official.userId),
                electionDate: official.electedAt,
                status: 'active'
            }));            // Recalculate approval threshold using regional parameter for OFFICIAL ELECTIONS ONLY
            const approvalThresholdParam = regionalGovernanceService.getRegionalParameters(regionId).officialElectionApprovalThreshold || 0.6;
            existingWallet.totalOfficials = newOfficials.length;
            existingWallet.approvalThreshold = Math.max(2, Math.ceil(newOfficials.length * approvalThresholdParam));
            existingWallet.lastUpdated = Date.now();

            await this.saveMultiSigData();

            // Record on blockchain
            await this.recordMultiSigEvent('multisig_updated', { regionId, wallet: existingWallet });

            this.emit('multisig.updated', { regionId, wallet: existingWallet });
            this.logger.info('Regional multi-sig wallet updated', {
                regionId,
                officials: newOfficials.length,
                threshold: existingWallet.approvalThreshold
            });

            return { success: true, wallet: existingWallet };
        } catch (error) {
            this._handleError('updateRegionalMultiSig', error);
            throw error;
        }
    }

    /**
     * Create a spending proposal that requires multi-sig approval
     */
    async createSpendingProposal(proposalData) {
        try {
            this._trackOperation();

            const {
                regionId,
                proposerId,
                amount,
                currency,
                recipient,
                purpose,
                description,
                category,
                urgency = 'normal'
            } = proposalData;

            // Validate proposer is an official
            const wallet = this.multiSigWallets.get(regionId);
            if (!wallet) {
                throw new Error('No multi-sig wallet exists for this region');
            }

            const isOfficial = wallet.officials.some(official => 
                official.userId === proposerId && official.status === 'active'
            );
            
            if (!isOfficial) {
                throw new Error('Only regional officials can create spending proposals');
            }

            // Check treasury balance
            const treasury = this.treasuries.get(regionId);
            if (!treasury || treasury.balance < amount) {
                throw new Error('Insufficient treasury funds');
            }

            const proposalId = crypto.randomUUID();
            const proposal = {
                id: proposalId,
                regionId,
                walletId: wallet.id,
                proposerId,
                type: 'spending',
                amount,
                currency,
                recipient,
                purpose,
                description,
                category, // 'development', 'infrastructure', 'community', 'emergency'
                urgency, // 'low', 'normal', 'high', 'critical'
                status: 'pending',
                createdAt: Date.now(),
                expiresAt: Date.now() + (this.config.proposalTimeoutDays * 24 * 60 * 60 * 1000),
                approvals: [],
                rejections: [],
                requiredApprovals: wallet.approvalThreshold,
                currentApprovals: 0,
                executed: false,
                executedAt: null,
                transactionId: null
            };

            this.proposals.set(proposalId, proposal);
            await this.saveMultiSigData();

            // Record on blockchain
            await this.recordMultiSigEvent('proposal_created', { regionId, proposal });

            // Notify all officials
            await this.notifyOfficials(regionId, 'proposal_created', proposal);

            this.emit('proposal.created', { regionId, proposal });
            this.logger.info('Spending proposal created', {
                proposalId,
                regionId,
                amount,
                purpose
            });

            return { success: true, proposal };
        } catch (error) {
            this._handleError('createSpendingProposal', error);
            throw error;
        }
    }

    /**
     * Approve or reject a spending proposal
     */
    async voteOnProposal(proposalId, voterId, vote, signature) {
        try {
            this._trackOperation();

            const proposal = this.proposals.get(proposalId);
            if (!proposal) {
                throw new Error('Proposal not found');
            }

            if (proposal.status !== 'pending') {
                throw new Error('Proposal is not in pending status');
            }

            if (Date.now() > proposal.expiresAt) {
                throw new Error('Proposal has expired');
            }

            // Validate voter is an official
            const wallet = this.multiSigWallets.get(proposal.regionId);
            const official = wallet.officials.find(o => o.userId === voterId && o.status === 'active');
            
            if (!official) {
                throw new Error('Only regional officials can vote on proposals');
            }

            // Check if already voted
            const existingVote = [...proposal.approvals, ...proposal.rejections]
                .find(v => v.voterId === voterId);
            
            if (existingVote) {
                throw new Error('Official has already voted on this proposal');
            }

            // Validate signature
            const isValidSignature = await this.validateSignature(signature, voterId, proposalId, vote);
            if (!isValidSignature) {
                throw new Error('Invalid signature');
            }

            const voteRecord = {
                voterId,
                position: official.position,
                vote, // 'approve' or 'reject'
                signature,
                timestamp: Date.now(),
                reason: ''
            };

            // Add vote to appropriate array
            if (vote === 'approve') {
                proposal.approvals.push(voteRecord);
                proposal.currentApprovals = proposal.approvals.length;
            } else if (vote === 'reject') {
                proposal.rejections.push(voteRecord);
            }

            // Check if proposal has enough approvals
            if (proposal.currentApprovals >= proposal.requiredApprovals) {
                proposal.status = 'approved';
                
                // Auto-execute if approved
                await this.executeSpendingProposal(proposalId);
            } 
            // Check if proposal has been definitively rejected
            else if (proposal.rejections.length > wallet.totalOfficials - proposal.requiredApprovals) {
                proposal.status = 'rejected';
            }

            await this.saveMultiSigData();

            // Record on blockchain
            await this.recordMultiSigEvent('proposal_vote', { 
                regionId: proposal.regionId, 
                proposalId, 
                vote: voteRecord 
            });

            this.emit('proposal.vote', { proposal, vote: voteRecord });
            this.logger.info('Proposal vote recorded', {
                proposalId,
                voterId,
                vote,
                status: proposal.status
            });

            return { success: true, proposal, vote: voteRecord };
        } catch (error) {
            this._handleError('voteOnProposal', error);
            throw error;
        }
    }

    /**
     * Execute an approved spending proposal
     */
    async executeSpendingProposal(proposalId) {
        try {
            this._trackOperation();

            const proposal = this.proposals.get(proposalId);
            if (!proposal || proposal.status !== 'approved') {
                throw new Error('Proposal not approved for execution');
            }

            if (proposal.executed) {
                throw new Error('Proposal already executed');
            }

            // Get treasury
            const treasury = this.treasuries.get(proposal.regionId);
            if (!treasury || treasury.balance < proposal.amount) {
                throw new Error('Insufficient treasury funds');
            }

            // Execute the payment
            const paymentResult = await this.executePayment(proposal);
            
            if (paymentResult.success) {
                // Update proposal
                proposal.executed = true;
                proposal.executedAt = Date.now();
                proposal.transactionId = paymentResult.transactionId;
                proposal.status = 'executed';

                // Update treasury balance
                treasury.balance -= proposal.amount;
                treasury.spendingHistory.push({
                    proposalId,
                    amount: proposal.amount,
                    recipient: proposal.recipient,
                    purpose: proposal.purpose,
                    transactionId: paymentResult.transactionId,
                    timestamp: Date.now()
                });

                // Update wallet spending history
                const wallet = this.multiSigWallets.get(proposal.regionId);
                wallet.spendingHistory.push({
                    proposalId,
                    amount: proposal.amount,
                    transactionId: paymentResult.transactionId,
                    timestamp: Date.now()
                });

                await this.saveMultiSigData();

                // Record on blockchain
                await this.recordMultiSigEvent('proposal_executed', { 
                    regionId: proposal.regionId, 
                    proposal,
                    transactionId: paymentResult.transactionId
                });

                this.emit('proposal.executed', { proposal, paymentResult });
                this.logger.info('Spending proposal executed', {
                    proposalId,
                    amount: proposal.amount,
                    transactionId: paymentResult.transactionId
                });

                return { success: true, proposal, transactionId: paymentResult.transactionId };
            } else {
                proposal.status = 'execution_failed';
                proposal.error = paymentResult.error;
                
                await this.saveMultiSigData();
                
                this.logger.error('Proposal execution failed', {
                    proposalId,
                    error: paymentResult.error
                });

                return { success: false, error: paymentResult.error };
            }
        } catch (error) {
            this._handleError('executeSpendingProposal', error);
            throw error;
        }
    }

    /**
     * Initialize regional treasury
     */
    async initializeRegionalTreasury(regionId) {
        const treasury = {
            regionId,
            balance: 0,
            currency: 'satoshis',
            commissionRate: 0, // Regional commission rate (default 0%, votable)
            totalCommissionsReceived: 0,
            spendingHistory: [],
            created: Date.now(),
            lastUpdated: Date.now()
        };

        this.treasuries.set(regionId, treasury);
        
        this.logger.info('Regional treasury initialized', { regionId });
        return treasury;
    }

    /**
     * Add commission to regional treasury
     */
    async addCommissionToTreasury(regionId, amount, sourceData) {
        try {
            this._trackOperation();

            let treasury = this.treasuries.get(regionId);
            if (!treasury) {
                treasury = await this.initializeRegionalTreasury(regionId);
            }

            treasury.balance += amount;
            treasury.totalCommissionsReceived += amount;
            treasury.lastUpdated = Date.now();

            await this.saveMultiSigData();

            this.emit('treasury.commission.added', { regionId, amount, treasury });
            this.logger.info('Commission added to treasury', { regionId, amount });

            return { success: true, treasury };
        } catch (error) {
            this._handleError('addCommissionToTreasury', error);
            throw error;
        }
    }

    /**
     * Execute payment (placeholder for actual payment integration)
     */
    async executePayment(proposal) {
        try {
            // This would integrate with actual payment systems
            // For now, simulate the payment
            
            const transactionId = `regional_tx_${crypto.randomUUID()}`;
            
            this.logger.info('Regional payment executed (simulated)', {
                proposalId: proposal.id,
                amount: proposal.amount,
                recipient: proposal.recipient,
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
     * Validate cryptographic signature
     */
    async validateSignature(signature, userId, proposalId, vote) {
        // This would implement actual cryptographic signature validation
        // For now, basic validation
        return signature && signature.length > 10;
    }

    /**
     * Generate public key for user (placeholder)
     */
    generatePublicKey(userId) {
        // This would generate or retrieve actual public key
        return `pubkey_${crypto.createHash('sha256').update(userId).digest('hex').substring(0, 32)}`;
    }

    /**
     * Notify all officials in a region
     */
    async notifyOfficials(regionId, eventType, data) {
        try {
            const wallet = this.multiSigWallets.get(regionId);
            if (!wallet) return;

            for (const official of wallet.officials) {
                if (official.status === 'active') {
                    this.emit('official.notification', {
                        userId: official.userId,
                        regionId,
                        eventType,
                        data
                    });
                }
            }
        } catch (error) {
            this.logger.error('Failed to notify officials', { error: error.message });
        }
    }

    /**
     * Start monitoring proposals for expiration
     */
    async startProposalMonitoring() {
        setInterval(async () => {
            await this.checkExpiredProposals();
        }, 60 * 60 * 1000); // Check every hour
    }

    /**
     * Check for expired proposals
     */
    async checkExpiredProposals() {
        try {
            const now = Date.now();
            const expiredProposals = Array.from(this.proposals.values())
                .filter(p => p.status === 'pending' && p.expiresAt <= now);

            for (const proposal of expiredProposals) {
                proposal.status = 'expired';
                this.emit('proposal.expired', { proposal });
                this.logger.info('Proposal expired', { proposalId: proposal.id });
            }

            if (expiredProposals.length > 0) {
                await this.saveMultiSigData();
            }
        } catch (error) {
            this.logger.error('Error checking expired proposals', { error: error.message });
        }
    }

    /**
     * Start treasury reporting
     */
    async startTreasuryReporting() {
        setInterval(async () => {
            await this.generateTreasuryReports();
        }, this.config.treasuryReportInterval);
    }

    /**
     * Generate treasury reports for all regions
     */
    async generateTreasuryReports() {
        try {
            for (const [regionId, treasury] of this.treasuries) {
                const report = await this.generateTreasuryReport(regionId);
                this.emit('treasury.report', { regionId, report });
            }
        } catch (error) {
            this.logger.error('Error generating treasury reports', { error: error.message });
        }
    }

    /**
     * Generate treasury report for a region
     */
    async generateTreasuryReport(regionId) {
        const treasury = this.treasuries.get(regionId);
        const wallet = this.multiSigWallets.get(regionId);
        
        const proposals = Array.from(this.proposals.values())
            .filter(p => p.regionId === regionId);

        const report = {
            regionId,
            timestamp: Date.now(),
            treasury: {
                balance: treasury?.balance || 0,
                totalCommissions: treasury?.totalCommissionsReceived || 0,
                commissionRate: treasury?.commissionRate || 0
            },
            multisig: {
                officials: wallet?.totalOfficials || 0,
                approvalThreshold: wallet?.approvalThreshold || 0,
                status: wallet?.status || 'inactive'
            },
            proposals: {
                total: proposals.length,
                pending: proposals.filter(p => p.status === 'pending').length,
                approved: proposals.filter(p => p.status === 'approved').length,
                executed: proposals.filter(p => p.status === 'executed').length,
                rejected: proposals.filter(p => p.status === 'rejected').length,
                expired: proposals.filter(p => p.status === 'expired').length
            },
            spending: {
                totalSpent: treasury?.spendingHistory?.reduce((sum, s) => sum + s.amount, 0) || 0,
                recentSpending: treasury?.spendingHistory?.slice(-10) || []
            }
        };

        return report;
    }

    /**
     * Record multi-sig event on blockchain
     */
    async recordMultiSigEvent(eventType, data) {
        try {
            const blockData = {
                type: 'regional_multisig',
                eventType,
                regionId: data.regionId,
                timestamp: Date.now(),
                data
            };

            await blockchain.addTransaction('regional_multisig', blockData, crypto.randomUUID());
            await blockchain.mine();
        } catch (error) {
            this.logger.error('Failed to record multi-sig event on blockchain', { 
                eventType, 
                error: error.message 
            });
        }
    }

    /**
     * Get multi-sig wallet for region
     */
    getRegionalMultiSig(regionId) {
        return this.multiSigWallets.get(regionId);
    }

    /**
     * Get proposals for region
     */
    getRegionalProposals(regionId, status = null) {
        let proposals = Array.from(this.proposals.values())
            .filter(p => p.regionId === regionId);

        if (status) {
            proposals = proposals.filter(p => p.status === status);
        }

        return proposals.sort((a, b) => b.createdAt - a.createdAt);
    }

    /**
     * Get treasury for region
     */
    getRegionalTreasury(regionId) {
        return this.treasuries.get(regionId);
    }    /**
     * Get proposal by ID
     */
    getProposal(proposalId) {
        return this.proposals.get(proposalId);
    }

    /**
     * Convenience wrapper methods
     */

    /**
     * Sign a proposal (alias for voteOnProposal with 'approve')
     */
    async signProposal(proposalId, voterId, signature) {
        try {
            return await this.voteOnProposal(proposalId, voterId, 'approve', signature);
        } catch (error) {
            this.logger.error('Error signing proposal', { proposalId, voterId, error: error.message });
            throw error;
        }
    }
}

// Export both class and singleton instance
export { RegionalMultiSigService };
export default new RegionalMultiSigService();
