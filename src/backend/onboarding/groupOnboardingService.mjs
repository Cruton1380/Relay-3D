/**
 * Group Onboarding Service
 * Allows batch verification of multiple new users simultaneously
 */

import EventEmitter from 'events';
import crypto from 'crypto';
// import blockchainUserService from '../blockchain-service/blockchainUserService.mjs'; // REMOVED: Git-native backend

export class GroupOnboardingService extends EventEmitter {
    constructor(serviceRegistry) {
        super();
        this.serviceRegistry = serviceRegistry;
        this.proximityService = serviceRegistry.get('proximityEncounterManager');
        this.multiFactorService = serviceRegistry.get('multiFactorProximityService');
        this.blockchainUserService = blockchainUserService;
        
        this.groupSessions = new Map();
        this.config = {
            maxGroupSize: 20,
            minGroupSize: 2,
            sessionTimeout: 600000, // 10 minutes
            proximityRadius: 50, // meters
            requiredStability: 30000, // 30 seconds
            maxSimultaneousSessions: 5
        };
        
        this.startSessionCleanup();
    }    async createGroupSession(organizerId, sessionConfig = {}) {
        // Validate organizer permissions
        const organizer = await this.validateOrganizer(organizerId);
        if (!organizer) {
            throw new Error('Invalid organizer or insufficient permissions');
        }
        
        // Check session limits
        if (this.groupSessions.size >= this.config.maxSimultaneousSessions) {
            throw new Error('Maximum concurrent group sessions reached');
        }
        
        // Get organizer's actual current token count for proper token decay calculation
        const organizerTokens = await this.getOrganizerTokenCount(organizerId);
        
        const sessionId = crypto.randomUUID();        const session = {
            id: sessionId,
            organizerId,
            organizerInfo: organizer,
            organizerCurrentTokens: organizerTokens, // Store actual token count
            status: 'created',
            participants: new Map(),
            pendingInvites: new Set(),
            proximityData: new Map(),
            createdAt: Date.now(),
            expiresAt: Date.now() + this.config.sessionTimeout,
            config: {
                // Ensure maxSize doesn't exceed available tokens
                maxSize: Math.min(
                    sessionConfig.maxSize || 10, 
                    this.config.maxGroupSize,
                    organizerTokens // Cannot exceed organizer's token count
                ),
                requireApproval: sessionConfig.requireApproval || false,
                allowLateJoin: sessionConfig.allowLateJoin || false,
                proximityStrict: sessionConfig.proximityStrict || true,
                customMessage: sessionConfig.customMessage || ''
            },
            metrics: {
                invitesSent: 0,
                participantsJoined: 0,
                proximityChecks: 0,
                successfulOnboards: 0
            }
        };
        
        this.groupSessions.set(sessionId, session);
        
        this.emit('groupSessionCreated', {
            sessionId,
            organizerId,
            config: session.config
        });
        
        return session;
    }    async addParticipantsToGroup(sessionId, participants) {
        const session = this.groupSessions.get(sessionId);
        if (!session) {
            throw new Error('Group session not found');
        }
        
        if (session.status !== 'created' && session.status !== 'active') {
            throw new Error('Cannot add participants to inactive session');
        }
        
        // CRITICAL: Pre-check if organizer has enough tokens for ALL participants
        const currentParticipants = session.participants.size;
        const newParticipants = participants.length;
        const totalParticipants = currentParticipants + newParticipants;
        const tokensAvailable = session.organizerCurrentTokens;
        
        if (totalParticipants > tokensAvailable) {
            throw new Error(`Organizer has insufficient tokens for ${totalParticipants} participants. Available tokens: ${tokensAvailable}, Current participants: ${currentParticipants}, Requested new participants: ${newParticipants}`);
        }
        
        const results = [];
        
        for (const participant of participants) {
            try {
                const result = await this.addSingleParticipant(session, participant);
                results.push(result);
            } catch (error) {
                results.push({
                    participantId: participant.id,
                    success: false,
                    error: error.message
                });
                // Stop adding more participants if we hit a token limit
                if (error.message.includes('insufficient tokens')) {
                    break;
                }
            }
        }
        
        this.emit('participantsAdded', {
            sessionId,
            results,
            totalParticipants: session.participants.size,
            tokensRemaining: session.organizerCurrentTokens - session.participants.size
        });
        
        return results;
    }async addSingleParticipant(session, participantInfo) {
        // Check group size limits
        if (session.participants.size >= session.config.maxSize) {
            throw new Error('Group session is full');
        }
        
        // CRITICAL: Check if organizer has enough tokens for this participant
        const tokensAlreadyCommitted = session.participants.size; // Each participant commits 1 token
        const tokensAvailable = session.organizerCurrentTokens;
        
        if (tokensAlreadyCommitted >= tokensAvailable) {
            throw new Error(`Organizer has insufficient tokens. Available: ${tokensAvailable}, Already committed: ${tokensAlreadyCommitted}`);
        }
        
        // Validate participant
        const participant = await this.validateParticipant(participantInfo);
        if (!participant) {
            throw new Error('Invalid participant information');
        }
        
        // Check for duplicates
        if (session.participants.has(participant.id)) {
            throw new Error('Participant already in group');
        }
        
        const participantData = {
            id: participant.id,
            info: participant,
            status: 'invited',
            joinedAt: null,
            proximityConfirmed: false,
            onboardingComplete: false,
            inviteCode: this.generateInviteCode(session.id, participant.id),
            tokensReceived: 0
        };
        
        session.participants.set(participant.id, participantData);
        session.pendingInvites.add(participant.id);
        session.metrics.invitesSent++;
        
        return {
            participantId: participant.id,
            success: true,
            inviteCode: participantData.inviteCode
        };
    }

    async startGroupSession(sessionId) {
        const session = this.groupSessions.get(sessionId);
        if (!session) {
            throw new Error('Group session not found');
        }
        
        if (session.participants.size < this.config.minGroupSize) {
            throw new Error('Insufficient participants for group session');
        }
        
        session.status = 'active';
        session.startedAt = Date.now();
        
        // Start proximity monitoring for all participants
        await this.startGroupProximityMonitoring(session);
        
        this.emit('groupSessionStarted', {
            sessionId,
            participantCount: session.participants.size,
            organizerId: session.organizerId
        });
        
        return session;
    }

    async startGroupProximityMonitoring(session) {
        const centerLocation = await this.determineGroupCenterLocation(session);
        
        for (const [participantId, participant] of session.participants) {
            if (participant.status === 'invited') {
                try {
                    await this.monitorParticipantProximity(session, participantId, centerLocation);
                } catch (error) {
                    console.error(`Failed to start proximity monitoring for ${participantId}:`, error);
                }
            }
        }
    }

    async determineGroupCenterLocation(session) {
        // Use organizer's location as center point initially
        const organizerLocation = await this.getCurrentLocation(session.organizerId);
        
        if (!organizerLocation) {
            throw new Error('Cannot determine group center location');
        }
        
        return {
            latitude: organizerLocation.latitude,
            longitude: organizerLocation.longitude,
            radius: this.config.proximityRadius
        };
    }

    async monitorParticipantProximity(session, participantId, centerLocation) {
        const participant = session.participants.get(participantId);
        if (!participant) return;
        
        // Start multi-factor proximity detection
        const proximityData = await this.multiFactorService.getProximityStatus();
        
        session.proximityData.set(participantId, {
            lastUpdate: Date.now(),
            confidence: proximityData.overallConfidence,
            factors: proximityData.factors,
            location: await this.getCurrentLocation(participantId),
            withinRange: this.isWithinProximityRange(
                await this.getCurrentLocation(participantId),
                centerLocation
            )
        });
        
        // Check if proximity requirements are met
        await this.evaluateParticipantProximity(session, participantId);
    }

    async evaluateParticipantProximity(session, participantId) {
        const participant = session.participants.get(participantId);
        const proximityData = session.proximityData.get(participantId);
        
        if (!participant || !proximityData) return;
        
        const meetsProximity = proximityData.confidence > 0.7 && proximityData.withinRange;
        
        if (meetsProximity && !participant.proximityConfirmed) {
            participant.proximityConfirmed = true;
            participant.proximityConfirmedAt = Date.now();
            
            this.emit('participantProximityConfirmed', {
                sessionId: session.id,
                participantId,
                confidence: proximityData.confidence
            });
            
            // Auto-proceed with onboarding if approval not required
            if (!session.config.requireApproval) {
                await this.onboardParticipant(session.id, participantId);
            }
        }
        
        session.metrics.proximityChecks++;
    }

    async onboardParticipant(sessionId, participantId) {
        const session = this.groupSessions.get(sessionId);
        if (!session) {
            throw new Error('Group session not found');
        }
        
        const participant = session.participants.get(participantId);
        if (!participant) {
            throw new Error('Participant not found in session');
        }
        
        if (!participant.proximityConfirmed) {
            throw new Error('Participant proximity not confirmed');
        }
          try {
            // Calculate tokens based on group position and decay
            const tokenCount = this.calculateGroupTokens(session, participantId);
            
            // Perform onboarding through the onboarding service
            const onboardingService = this.serviceRegistry.get('proximityOnboardingService');
            const onboardingResult = await onboardingService.processProximityOnboarding({
                newUserId: participantId,
                vouchingUserId: session.organizerId,
                proximityData: session.proximityData.get(participantId),
                groupSession: true,
                groupSessionId: sessionId,
                initialTokens: tokenCount
            });
              // Register user on blockchain with their keypair and token count
            await this.blockchainUserService.initialize();
            const blockchainResult = await this.blockchainUserService.registerUser({
                userId: participantId,
                publicKey: onboardingResult.publicKey, // From onboarding result
                biometricHash: onboardingResult.biometricHash, // From onboarding result
                invitedBy: session.organizerId,
                initialTokens: tokenCount
            });
              // CRITICAL: Deduct 1 token from organizer's blockchain balance
            // This ensures the organizer can't onboard more users than their token count allows
            await this.blockchainUserService.adjustUserTokens(
                session.organizerId, 
                -1, 
                `Group onboarding: invited user ${participantId}`
            );
            
            participant.status = 'onboarded';
            participant.onboardingComplete = true;
            participant.onboardedAt = Date.now();
            participant.tokensReceived = tokenCount;
            participant.blockchainRegistered = blockchainResult.success;
            session.metrics.successfulOnboards++;
            
            session.pendingInvites.delete(participantId);
            
            this.emit('participantOnboarded', {
                sessionId,
                participantId,
                tokensReceived: tokenCount,
                onboardingResult
            });
            
            // Check if all participants are onboarded
            const allOnboarded = Array.from(session.participants.values())
                .every(p => p.onboardingComplete || p.status === 'declined');
            
            if (allOnboarded) {
                await this.completeGroupSession(sessionId);
            }
            
            return onboardingResult;
            
        } catch (error) {
            participant.status = 'failed';
            participant.error = error.message;
            
            this.emit('participantOnboardingFailed', {
                sessionId,
                participantId,
                error: error.message
            });
            
            throw error;
        }
    }    calculateGroupTokens(session, participantId) {
        // Get the order in which participants joined/were confirmed
        const confirmedParticipants = Array.from(session.participants.values())
            .filter(p => p.proximityConfirmed)
            .sort((a, b) => a.proximityConfirmedAt - b.proximityConfirmedAt);
        
        const participantIndex = confirmedParticipants.findIndex(p => p.id === participantId);
        
        // Use organizer's actual current token count stored during session creation
        const organizerTokens = session.organizerCurrentTokens;
        
        // Linear decay: each participant gets organizer's tokens minus their position in line
        // 1st participant: organizerTokens - 1
        // 2nd participant: organizerTokens - 2  
        // 3rd participant: organizerTokens - 3, etc.
        const tokenCount = Math.max(
            organizerTokens - (participantIndex + 1),
            1 // Minimum 1 token
        );
        
        // Additional safety check: ensure we don't give out more tokens than organizer had
        if (participantIndex >= organizerTokens) {
            throw new Error(`Cannot onboard participant at position ${participantIndex + 1}: organizer only has ${organizerTokens} tokens`);
        }
        
        return tokenCount;
    }

    async completeGroupSession(sessionId) {
        const session = this.groupSessions.get(sessionId);
        if (!session) return;
        
        session.status = 'completed';
        session.completedAt = Date.now();
        
        const summary = {
            sessionId,
            organizerId: session.organizerId,
            totalParticipants: session.participants.size,
            successfulOnboards: session.metrics.successfulOnboards,
            duration: session.completedAt - session.startedAt,
            metrics: session.metrics
        };
        
        this.emit('groupSessionCompleted', summary);
        
        // Archive session after delay
        setTimeout(() => {
            this.groupSessions.delete(sessionId);
        }, 300000); // Keep for 5 minutes
        
        return summary;
    }

    async cancelGroupSession(sessionId, reason = 'Cancelled by organizer') {
        const session = this.groupSessions.get(sessionId);
        if (!session) {
            throw new Error('Group session not found');
        }
        
        session.status = 'cancelled';
        session.cancelledAt = Date.now();
        session.cancelReason = reason;
        
        this.emit('groupSessionCancelled', {
            sessionId,
            reason,
            participantCount: session.participants.size
        });
        
        // Clean up immediately
        this.groupSessions.delete(sessionId);
        
        return session;
    }

    // Token availability methods
    getAvailableTokensForSession(sessionId) {
        const session = this.groupSessions.get(sessionId);
        if (!session) return 0;
        
        const tokensCommitted = session.participants.size;
        const tokensAvailable = session.organizerCurrentTokens;
        return Math.max(0, tokensAvailable - tokensCommitted);
    }
    
    canAddParticipants(sessionId, count = 1) {
        const availableTokens = this.getAvailableTokensForSession(sessionId);
        return availableTokens >= count;
    }
    
    getSessionTokenInfo(sessionId) {
        const session = this.groupSessions.get(sessionId);
        if (!session) return null;
        
        return {
            totalTokens: session.organizerCurrentTokens,
            tokensCommitted: session.participants.size,
            tokensAvailable: this.getAvailableTokensForSession(sessionId),
            participantCount: session.participants.size
        };
    }

    // Utility methods
    async validateOrganizer(organizerId) {
        // Implement organizer validation logic
        // Check permissions, trust level, etc.
        return {
            id: organizerId,
            trustLevel: 'high',
            permissions: ['group_onboarding']
        };
    }

    async validateParticipant(participantInfo) {
        // Implement participant validation logic
        return {
            id: participantInfo.id || crypto.randomUUID(),
            email: participantInfo.email,
            name: participantInfo.name
        };
    }

    generateInviteCode(sessionId, participantId) {
        const data = `${sessionId}:${participantId}:${Date.now()}`;
        return crypto.createHash('sha256').update(data).digest('hex').slice(0, 16);
    }

    async getCurrentLocation(userId) {
        // Mock location for now - in production, get from location service
        return {
            latitude: 40.7128 + (Math.random() - 0.5) * 0.01,
            longitude: -74.0060 + (Math.random() - 0.5) * 0.01,
            accuracy: 10
        };
    }

    isWithinProximityRange(location1, location2) {
        if (!location1 || !location2) return false;
        
        const distance = this.calculateDistance(
            location1.latitude, location1.longitude,
            location2.latitude, location2.longitude
        );
        
        return distance <= location2.radius;
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
    }

    getGroupSessionStatus(sessionId) {
        const session = this.groupSessions.get(sessionId);
        if (!session) return null;
        
        return {
            sessionId,
            status: session.status,
            organizerId: session.organizerId,
            participantCount: session.participants.size,
            metrics: session.metrics,
            timeRemaining: session.expiresAt - Date.now()
        };
    }

    getAllGroupSessions() {
        const sessions = [];
        for (const sessionId of this.groupSessions.keys()) {
            sessions.push(this.getGroupSessionStatus(sessionId));
        }
        return sessions;
    }    startSessionCleanup() {
        setInterval(() => {
            const now = Date.now();
            for (const [sessionId, session] of this.groupSessions) {
                if (session.expiresAt < now && session.status !== 'completed') {
                    this.cancelGroupSession(sessionId, 'Session expired');
                }
            }
        }, 60000); // Check every minute
    }

    async validateOrganizer(organizerId) {
        // Mock implementation - in production, this would validate organizer permissions
        // Check if user exists and has sufficient tokens/permissions
        return {
            id: organizerId,
            hasPermission: true,
            tokenCount: await this.getOrganizerTokenCount(organizerId)
        };
    }    async getOrganizerTokenCount(organizerId) {
        try {
            // First try to get token count from blockchain (authoritative source)
            await this.blockchainUserService.initialize();
            const blockchainTokens = await this.blockchainUserService.getUserTokenCount(organizerId);
            
            if (blockchainTokens > 0) {
                return blockchainTokens;
            }
            
            // Fallback: get from proximity onboarding service
            const onboardingService = this.serviceRegistry.get('proximityOnboardingService');
            if (onboardingService && onboardingService.getFounderTokenCount) {
                return await onboardingService.getFounderTokenCount(organizerId);
            }
            
            // Conservative default if no other source available
            return 50;
        } catch (error) {
            console.error('Error fetching organizer token count:', error);
            // Return conservative default if unable to fetch actual tokens
            return 50;
        }
    }
}

export default GroupOnboardingService;
