/**
 * Regional Election Service
 * Manages democratic elections for regional officials
 * Implements complete candidate registration, voting periods, and winner promotion
 */

import { BaseService } from '../utils/BaseService.mjs';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { getDataFilePath } from '../utils/storage/fileStorage.mjs';
import crypto from 'crypto';
import blockchain from '../blockchain-service/index.mjs';
import logger from '../utils/logging/logger.mjs';

/**
 * Regional Position Definitions
 */
export const REGIONAL_POSITIONS = {
    GOVERNOR: {
        id: 'regional-governor',
        name: 'Regional Governor',
        description: 'Overall coordination, external relations, strategic planning',
        required: false,
        votingWeight: 2.0
    },
    TECHNICAL_LEAD: {
        id: 'technical-lead',
        name: 'Technical Lead',
        description: 'Development priorities, infrastructure management, code oversight',
        required: false,
        votingWeight: 1.5
    },
    FINANCIAL_STEWARD: {
        id: 'financial-steward',
        name: 'Financial Steward',
        description: 'Budget management, fund allocation, economic policy',
        required: false,
        votingWeight: 1.5
    },
    COMMUNITY_LIAISON: {
        id: 'community-liaison',
        name: 'Community Liaison',
        description: 'Inter-channel communication, conflict resolution',
        required: false,
        votingWeight: 1.0
    },
    SECURITY_OFFICER: {
        id: 'security-officer',
        name: 'Security Officer',
        description: 'Regional security policies, incident response, privacy oversight',
        required: false,
        votingWeight: 1.5
    }
};

class RegionalElectionService extends BaseService {
    constructor() {
        super('regional-election');
        
        // Data file paths
        this.electionsFile = getDataFilePath('regional-elections.json');
        this.candidatesFile = getDataFilePath('regional-candidates.json');
        this.officialsFile = getDataFilePath('regional-officials.json');
        
        // In-memory state
        this.elections = new Map();
        this.candidates = new Map();
        this.officials = new Map();
        this.voters = new Map();
        
        // Configuration
        this.config = {
            // Vote duration is now a regional parameter (not fixed)
            defaultVoteDuration: 7 * 24 * 60 * 60 * 1000, // 7 days fallback
            candidateRegistrationPeriod: 24 * 60 * 60 * 1000, // 24 hours
            minimumVotersForElection: 5,
            stabilityCheckInterval: 60 * 60 * 1000, // 1 hour
            // Commission starts at 0% by default (votable parameter)
            defaultRegionalCommission: 0
        };
    }

    async _initializeService() {
        await this.loadElectionData();
        await this.startElectionMonitoring();
        this.logger.info('Regional Election Service initialized');
    }

    /**
     * Load election data from disk
     */
    async loadElectionData() {
        try {
            // Load elections
            if (existsSync(this.electionsFile)) {
                const electionsData = JSON.parse(readFileSync(this.electionsFile, 'utf8'));
                for (const election of electionsData.elections || []) {
                    this.elections.set(election.id, election);
                }
            }

            // Load candidates
            if (existsSync(this.candidatesFile)) {
                const candidatesData = JSON.parse(readFileSync(this.candidatesFile, 'utf8'));
                for (const candidate of candidatesData.candidates || []) {
                    this.candidates.set(candidate.id, candidate);
                }
            }

            // Load current officials
            if (existsSync(this.officialsFile)) {
                const officialsData = JSON.parse(readFileSync(this.officialsFile, 'utf8'));
                for (const official of officialsData.officials || []) {
                    const key = `${official.regionId}-${official.position}`;
                    this.officials.set(key, official);
                }
            }

            this.logger.info('Election data loaded', {
                elections: this.elections.size,
                candidates: this.candidates.size,
                officials: this.officials.size
            });
        } catch (error) {
            this.logger.error('Failed to load election data', { error: error.message });
            // Initialize with empty data
            await this.saveElectionData();
        }
    }

    /**
     * Save election data to disk
     */
    async saveElectionData() {
        try {
            // Save elections
            const electionsData = {
                lastUpdated: Date.now(),
                elections: Array.from(this.elections.values())
            };
            writeFileSync(this.electionsFile, JSON.stringify(electionsData, null, 2));

            // Save candidates
            const candidatesData = {
                lastUpdated: Date.now(),
                candidates: Array.from(this.candidates.values())
            };
            writeFileSync(this.candidatesFile, JSON.stringify(candidatesData, null, 2));

            // Save officials
            const officialsData = {
                lastUpdated: Date.now(),
                officials: Array.from(this.officials.values())
            };
            writeFileSync(this.officialsFile, JSON.stringify(officialsData, null, 2));

        } catch (error) {
            this.logger.error('Failed to save election data', { error: error.message });
        }
    }

    /**
     * Start monitoring active elections for completion
     */
    async startElectionMonitoring() {
        setInterval(async () => {
            await this.checkElectionStability();
        }, this.config.stabilityCheckInterval);
    }

    /**
     * Initiate a regional election for a specific position
     */
    async initiateElection(regionId, position, initiatorId) {
        try {
            this._trackOperation();

            // Validate position
            const positionConfig = Object.values(REGIONAL_POSITIONS).find(p => p.id === position);
            if (!positionConfig) {
                throw new Error(`Invalid position: ${position}`);
            }

            // Check if election already exists for this position
            const existingElection = Array.from(this.elections.values())
                .find(e => e.regionId === regionId && e.position === position && e.status !== 'completed');
            
            if (existingElection) {
                throw new Error(`Election already active for ${position} in region ${regionId}`);
            }

            // Get regional vote duration parameter
            const voteDuration = await this.getRegionalVoteDuration(regionId);

            const electionId = crypto.randomUUID();
            const election = {
                id: electionId,
                regionId,
                position,
                positionConfig,
                initiatorId,
                status: 'candidate_registration',
                createdAt: Date.now(),
                candidateRegistrationEnds: Date.now() + this.config.candidateRegistrationPeriod,
                votingPeriod: voteDuration,
                votingStartsAt: null,
                votingEndsAt: null,
                candidates: [],
                totalVotes: 0,
                results: null,
                winner: null
            };

            this.elections.set(electionId, election);
            await this.saveElectionData();

            // Record on blockchain
            await this.recordElectionEvent('election_initiated', election);

            this.emit('election.initiated', { election });
            this.logger.info('Regional election initiated', { electionId, regionId, position });

            return { success: true, election };
        } catch (error) {
            this._handleError('initiateElection', error);
            throw error;
        }
    }

    /**
     * Register a candidate for an election
     * This happens automatically when users create candidate channels and rank in topic rows
     */
    async registerCandidate(electionId, candidateData) {
        try {
            this._trackOperation();

            const election = this.elections.get(electionId);
            if (!election) {
                throw new Error('Election not found');
            }

            if (election.status !== 'candidate_registration') {
                throw new Error('Candidate registration period has ended');
            }

            // Validate candidate eligibility
            const eligibility = await this.validateCandidateEligibility(candidateData, election);
            if (!eligibility.eligible) {
                throw new Error(`Candidate not eligible: ${eligibility.reasons.join(', ')}`);
            }

            const candidateId = crypto.randomUUID();
            const candidate = {
                id: candidateId,
                electionId,
                userId: candidateData.userId,
                channelId: candidateData.channelId, // Candidate's channel
                regionId: election.regionId,
                position: election.position,
                platform: candidateData.platform || '',
                qualifications: candidateData.qualifications || '',
                registeredAt: Date.now(),
                votes: 0,
                voteHistory: [],
                rank: 0 // Will be updated based on channel topic row ranking
            };

            this.candidates.set(candidateId, candidate);
            election.candidates.push(candidateId);
            
            await this.saveElectionData();

            // Record on blockchain
            await this.recordElectionEvent('candidate_registered', { election, candidate });

            this.emit('candidate.registered', { election, candidate });
            this.logger.info('Candidate registered', { candidateId, electionId });

            return { success: true, candidate };
        } catch (error) {
            this._handleError('registerCandidate', error);
            throw error;
        }
    }

    /**
     * Start the voting period for an election
     */
    async startVotingPeriod(electionId) {
        try {
            this._trackOperation();

            const election = this.elections.get(electionId);
            if (!election) {
                throw new Error('Election not found');
            }

            if (election.status !== 'candidate_registration') {
                throw new Error('Election not in candidate registration phase');
            }

            if (Date.now() < election.candidateRegistrationEnds) {
                throw new Error('Candidate registration period not yet ended');
            }

            if (election.candidates.length === 0) {
                // No candidates - cancel election
                election.status = 'cancelled';
                election.cancelReason = 'No candidates registered';
                await this.saveElectionData();
                this.emit('election.cancelled', { election });
                return { success: true, cancelled: true };
            }

            // Transition to voting
            election.status = 'voting';
            election.votingStartsAt = Date.now();
            election.votingEndsAt = Date.now() + election.votingPeriod;

            await this.saveElectionData();

            // Record on blockchain
            await this.recordElectionEvent('voting_started', election);

            this.emit('voting.started', { election });
            this.logger.info('Voting period started', { electionId });

            return { success: true, election };
        } catch (error) {
            this._handleError('startVotingPeriod', error);
            throw error;
        }
    }

    /**
     * Record a vote for a candidate
     * Votes are tracked through channel topic row ranking system
     */
    async recordVote(electionId, voterId, candidateId, proximityProof, biometricProof) {
        try {
            this._trackOperation();

            const election = this.elections.get(electionId);
            if (!election || election.status !== 'voting') {
                throw new Error('Election not in voting phase');
            }

            const candidate = this.candidates.get(candidateId);
            if (!candidate || candidate.electionId !== electionId) {
                throw new Error('Invalid candidate for this election');
            }

            // Verify voter eligibility
            const eligibility = await this.verifyVoterEligibility(voterId, election, proximityProof, biometricProof);
            if (!eligibility.eligible) {
                throw new Error(`Voter not eligible: ${eligibility.reasons.join(', ')}`);
            }

            // Check for duplicate voting
            const voterKey = `${electionId}-${voterId}`;
            if (this.voters.has(voterKey)) {
                throw new Error('Voter has already voted in this election');
            }

            // Record the vote
            const voteRecord = {
                electionId,
                candidateId,
                voterId,
                timestamp: Date.now(),
                proximityVerified: eligibility.proximityVerified,
                biometricVerified: eligibility.biometricVerified,
                votingPower: eligibility.votingPower
            };

            // Update candidate vote count
            candidate.votes += eligibility.votingPower;
            candidate.voteHistory.push(voteRecord);

            // Track voter
            this.voters.set(voterKey, voteRecord);

            // Update election totals
            election.totalVotes += eligibility.votingPower;

            await this.saveElectionData();

            // Record vote on blockchain (encrypted)
            await this.recordElectionVote(voteRecord);

            this.emit('vote.recorded', { election, candidate, voteRecord });
            
            return { success: true, voteRecord };
        } catch (error) {
            this._handleError('recordVote', error);
            throw error;
        }
    }

    /**
     * Check election stability and finalize if conditions met
     */
    async checkElectionStability() {
        try {
            const activeElections = Array.from(this.elections.values())
                .filter(e => e.status === 'voting');

            for (const election of activeElections) {
                // Check if voting period has ended
                if (Date.now() >= election.votingEndsAt) {
                    await this.finalizeElection(election.id);
                }
            }
        } catch (error) {
            this.logger.error('Error checking election stability', { error: error.message });
        }
    }

    /**
     * Finalize an election and promote the winner
     */
    async finalizeElection(electionId) {
        try {
            this._trackOperation();

            const election = this.elections.get(electionId);
            if (!election || election.status !== 'voting') {
                throw new Error('Election not in voting phase');
            }

            // Calculate results
            const results = await this.calculateElectionResults(election);
            
            election.results = results;
            election.status = 'completed';
            election.completedAt = Date.now();

            if (results.winner) {
                // Promote winner to official position
                await this.promoteToOfficial(election, results.winner);
                election.winner = results.winner.id;
            }

            await this.saveElectionData();

            // Record on blockchain
            await this.recordElectionEvent('election_completed', election);

            this.emit('election.completed', { election, results });
            this.logger.info('Election completed', { electionId, winner: results.winner?.id });

            return { success: true, election, results };
        } catch (error) {
            this._handleError('finalizeElection', error);
            throw error;
        }
    }

    /**
     * Calculate election results
     */
    async calculateElectionResults(election) {
        const candidates = election.candidates.map(id => this.candidates.get(id));
        
        // Sort by vote count (descending)
        candidates.sort((a, b) => b.votes - a.votes);
        
        const results = {
            totalVotes: election.totalVotes,
            candidateCount: candidates.length,
            rankings: candidates.map((candidate, index) => ({
                rank: index + 1,
                candidateId: candidate.id,
                userId: candidate.userId,
                votes: candidate.votes,
                percentage: election.totalVotes > 0 ? (candidate.votes / election.totalVotes) * 100 : 0
            })),
            winner: candidates.length > 0 ? candidates[0] : null,
            margin: candidates.length > 1 ? candidates[0].votes - candidates[1].votes : 0,
            stable: true // Election is stable after vote duration ends
        };

        return results;
    }

    /**
     * Promote election winner to official position
     */
    async promoteToOfficial(election, winner) {
        try {
            const officialKey = `${election.regionId}-${election.position}`;
            
            // Remove existing official if any
            const existingOfficial = this.officials.get(officialKey);
            if (existingOfficial) {
                this.logger.info('Replacing existing official', { 
                    regionId: election.regionId, 
                    position: election.position,
                    previousOfficial: existingOfficial.userId
                });
            }

            // Create new official record
            const official = {
                id: crypto.randomUUID(),
                regionId: election.regionId,
                position: election.position,
                positionConfig: election.positionConfig,
                userId: winner.userId,
                channelId: winner.channelId,
                electionId: election.id,
                electedAt: Date.now(),
                termStarted: Date.now(),
                votes: winner.votes,
                status: 'active',
                permissions: this.generateOfficialPermissions(election.position)
            };

            this.officials.set(officialKey, official);

            // Update regional multi-sig if needed
            await this.updateRegionalMultiSig(election.regionId);

            this.emit('official.promoted', { election, official });
            this.logger.info('Candidate promoted to official', { 
                regionId: election.regionId,
                position: election.position,
                userId: winner.userId
            });

            return official;
        } catch (error) {
            this.logger.error('Failed to promote official', { error: error.message });
            throw error;
        }
    }

    /**
     * Get regional vote duration parameter
     */
    async getRegionalVoteDuration(regionId) {
        try {
            // This would integrate with regional governance service to get vote duration parameter
            // For now, return default
            return this.config.defaultVoteDuration;
        } catch (error) {
            this.logger.warn('Could not get regional vote duration, using default', { regionId });
            return this.config.defaultVoteDuration;
        }
    }

    /**
     * Validate candidate eligibility
     */
    async validateCandidateEligibility(candidateData, election) {
        const reasons = [];
        
        // Basic validation
        if (!candidateData.userId) reasons.push('No user ID provided');
        if (!candidateData.channelId) reasons.push('No channel ID provided');
        
        // Region verification - candidate must be active in the region
        const isRegionalMember = await this.verifyRegionalMembership(candidateData.userId, election.regionId);
        if (!isRegionalMember) reasons.push('Not an active member of the region');
        
        // Check for duplicate candidacy
        const existingCandidate = Array.from(this.candidates.values())
            .find(c => c.userId === candidateData.userId && c.electionId === election.id);
        if (existingCandidate) reasons.push('Already registered as candidate');

        return {
            eligible: reasons.length === 0,
            reasons
        };
    }

    /**
     * Verify voter eligibility
     */
    async verifyVoterEligibility(voterId, election, proximityProof, biometricProof) {
        const reasons = [];
        
        // Regional membership verification
        const isRegionalMember = await this.verifyRegionalMembership(voterId, election.regionId);
        if (!isRegionalMember) reasons.push('Not a regional member');
        
        // Proximity verification
        const proximityVerified = await this.verifyProximityProof(proximityProof, election.regionId);
        if (!proximityVerified) reasons.push('Proximity verification failed');
        
        // Biometric verification
        const biometricVerified = await this.verifyBiometricProof(biometricProof, voterId);
        if (!biometricVerified) reasons.push('Biometric verification failed');
        
        // Calculate voting power
        const votingPower = await this.calculateVotingPower(voterId, election.regionId);

        return {
            eligible: reasons.length === 0,
            reasons,
            proximityVerified,
            biometricVerified,
            votingPower
        };
    }

    /**
     * Verify regional membership
     */
    async verifyRegionalMembership(userId, regionId) {
        // This would integrate with regional governance service
        // For now, return true for basic implementation
        return true;
    }

    /**
     * Verify proximity proof
     */
    async verifyProximityProof(proximityProof, regionId) {
        // This would integrate with proximity verification service
        // Verify user is physically present in the region
        return proximityProof && proximityProof.regionId === regionId;
    }

    /**
     * Verify biometric proof
     */
    async verifyBiometricProof(biometricProof, userId) {
        // This would integrate with biometric service
        // Verify user identity through biometric authentication
        return biometricProof && biometricProof.userId === userId;
    }

    /**
     * Calculate voting power based on user activity and reputation
     */
    async calculateVotingPower(userId, regionId) {
        // Basic implementation - could be enhanced with:
        // - Proximity verification score
        // - Account age
        // - Regional activity level
        // - Contribution score
        return 1.0;
    }

    /**
     * Record election event on blockchain
     */
    async recordElectionEvent(eventType, data) {
        try {
            const blockData = {
                type: 'election_event',
                eventType,
                regionId: data.regionId || data.election?.regionId,
                timestamp: Date.now(),
                data: {
                    electionId: data.id || data.election?.id,
                    position: data.position || data.election?.position,
                    details: data
                }
            };

            await blockchain.addTransaction('election_event', blockData, crypto.randomUUID());
            await blockchain.mine();
        } catch (error) {
            this.logger.error('Failed to record election event on blockchain', { 
                eventType, 
                error: error.message 
            });
        }
    }

    /**
     * Record encrypted vote on blockchain
     */
    async recordElectionVote(voteRecord) {
        try {
            // Create encrypted vote record for blockchain
            const encryptedVote = {
                type: 'election_vote',
                electionId: voteRecord.electionId,
                timestamp: voteRecord.timestamp,
                voterHash: crypto.createHash('sha256').update(voteRecord.voterId).digest('hex'), // Anonymous
                candidateHash: crypto.createHash('sha256').update(voteRecord.candidateId).digest('hex'),
                votingPower: voteRecord.votingPower,
                verified: voteRecord.proximityVerified && voteRecord.biometricVerified
            };

            await blockchain.addTransaction('election_vote', encryptedVote, crypto.randomUUID());
            await blockchain.mine();
        } catch (error) {
            this.logger.error('Failed to record vote on blockchain', { error: error.message });
        }
    }

    /**
     * Generate permissions for an official position
     */
    generateOfficialPermissions(position) {
        const basePermissions = {
            view_regional_data: true,
            participate_in_governance: true,
            create_proposals: true
        };

        const positionPermissions = {
            'regional-governor': {
                ...basePermissions,
                approve_spending: true,
                external_relations: true,
                strategic_planning: true
            },
            'technical-lead': {
                ...basePermissions,
                manage_infrastructure: true,
                approve_development: true,
                technical_oversight: true
            },
            'financial-steward': {
                ...basePermissions,
                manage_budget: true,
                approve_spending: true,
                financial_reporting: true
            },
            'community-liaison': {
                ...basePermissions,
                resolve_conflicts: true,
                inter_channel_communication: true,
                community_outreach: true
            },
            'security-officer': {
                ...basePermissions,
                security_policies: true,
                incident_response: true,
                privacy_oversight: true
            }
        };

        return positionPermissions[position] || basePermissions;
    }

    /**
     * Update regional multi-signature configuration
     */
    async updateRegionalMultiSig(regionId) {
        // Get all active officials for this region
        const regionOfficials = Array.from(this.officials.values())
            .filter(official => official.regionId === regionId && official.status === 'active');

        this.emit('multisig.update', { regionId, officials: regionOfficials });
        this.logger.info('Regional multi-sig updated', { regionId, officialCount: regionOfficials.length });
    }

    /**
     * Get election by ID
     */
    getElection(electionId) {
        return this.elections.get(electionId);
    }

    /**
     * Get elections for a region
     */
    getRegionElections(regionId) {
        return Array.from(this.elections.values())
            .filter(election => election.regionId === regionId);
    }

    /**
     * Get current officials for a region
     */
    getRegionOfficials(regionId) {
        return Array.from(this.officials.values())
            .filter(official => official.regionId === regionId && official.status === 'active');    }
    
    /**
     * Get candidate information
     */
    getCandidate(candidateId) {
        return this.candidates.get(candidateId);
    }
}

// Export both class and singleton instance
export { RegionalElectionService };
export default new RegionalElectionService();
