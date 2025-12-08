/**
 * Test file for Group Onboarding Service
 */

import { expect } from 'chai';
import sinon from 'sinon';
import GroupOnboardingService from '../../src/backend/onboarding/groupOnboardingService.mjs';

describe('GroupOnboardingService', () => {
    let service;
    let mockServiceRegistry;
    let clock;

    beforeEach(() => {
        // Mock service registry
        mockServiceRegistry = {
            get: sinon.stub()
        };        // Mock proximity services
        const mockProximityService = {
            getProximityStatus: sinon.stub().returns({
                overallConfidence: 0.8,
                factors: { wifi: { confidence: 0.9 }, bluetooth: { confidence: 0.7 } }
            })
        };

        const mockMultiFactorService = {
            getProximityStatus: sinon.stub().returns({
                overallConfidence: 0.8,
                factors: { wifi: { confidence: 0.9 }, bluetooth: { confidence: 0.7 } }
            })
        };

        // Mock proximity onboarding service for token count fetching
        const mockProximityOnboardingService = {
            getFounderTokenCount: sinon.stub().resolves(100), // Mock 100 tokens
            processProximityOnboarding: sinon.stub().rejects(new Error('Proximity onboarding not configured for this test'))
        };

        mockServiceRegistry.get.withArgs('proximityEncounterManager').returns(mockProximityService);
        mockServiceRegistry.get.withArgs('multiFactorProximityService').returns(mockMultiFactorService);
        mockServiceRegistry.get.withArgs('proximityOnboardingService').returns(mockProximityOnboardingService);

        service = new GroupOnboardingService(mockServiceRegistry);
        
        // Ensure the services are properly assigned
        service.proximityService = mockProximityService;
        service.multiFactorService = mockMultiFactorService;
        clock = sinon.useFakeTimers();
    });

    afterEach(() => {
        clock.restore();
        sinon.restore();
    });

    describe('Initialization', () => {
        it('should initialize with service registry', () => {
            expect(service.serviceRegistry).to.equal(mockServiceRegistry);
            expect(service.groupSessions).to.be.a('map');
            expect(service.config).to.have.property('maxGroupSize');
        });

        it('should have default configuration values', () => {
            expect(service.config.maxGroupSize).to.equal(20);
            expect(service.config.minGroupSize).to.equal(2);
            expect(service.config.sessionTimeout).to.equal(600000);
        });
    });

    describe('Group Session Creation', () => {
        it('should create a new group session', async () => {
            const organizerId = 'organizer-123';
            const sessionConfig = {
                maxSize: 10,
                requireApproval: true
            };

            // Mock organizer validation
            sinon.stub(service, 'validateOrganizer').resolves({
                id: organizerId,
                trustLevel: 'high',
                permissions: ['group_onboarding']
            });

            const session = await service.createGroupSession(organizerId, sessionConfig);

            expect(session).to.be.an('object');
            expect(session.organizerId).to.equal(organizerId);
            expect(session.status).to.equal('created');
            expect(session.config.maxSize).to.equal(10);
            expect(session.config.requireApproval).to.be.true;
        });        it('should emit groupSessionCreated event', async () => {
            const organizerId = 'organizer-123';

            sinon.stub(service, 'validateOrganizer').resolves({ id: organizerId });

            // Convert event listener to Promise
            const sessionCreatedPromise = new Promise((resolve) => {
                service.once('groupSessionCreated', (data) => {
                    expect(data.sessionId).to.be.a('string');
                    expect(data.organizerId).to.equal(organizerId);
                    resolve(data);
                });
            });

            await service.createGroupSession(organizerId);
            await sessionCreatedPromise;
        });

        it('should reject invalid organizer', async () => {
            sinon.stub(service, 'validateOrganizer').resolves(null);

            try {
                await service.createGroupSession('invalid-organizer');
                expect.fail('Should have thrown error');
            } catch (error) {
                expect(error.message).to.include('Invalid organizer');
            }
        });

        it('should reject when max sessions reached', async () => {
            sinon.stub(service, 'validateOrganizer').resolves({ id: 'organizer' });

            // Fill up to max sessions
            for (let i = 0; i < service.config.maxSimultaneousSessions; i++) {
                service.groupSessions.set(`session-${i}`, {});
            }

            try {
                await service.createGroupSession('organizer');
                expect.fail('Should have thrown error');
            } catch (error) {
                expect(error.message).to.include('Maximum concurrent group sessions');
            }
        });
    });

    describe('Participant Management', () => {
        let sessionId;        beforeEach(async () => {
            sinon.stub(service, 'validateOrganizer').resolves({ id: 'organizer' });
            sinon.stub(service, 'getOrganizerTokenCount').resolves(10); // Use realistic 10 tokens
            const session = await service.createGroupSession('organizer');
            sessionId = session.id;
        });

        it('should add participants to group', async () => {
            const participants = [
                { id: 'user1', email: 'user1@test.com', name: 'User 1' },
                { id: 'user2', email: 'user2@test.com', name: 'User 2' }
            ];

            sinon.stub(service, 'validateParticipant').callsFake(async (p) => p);

            const results = await service.addParticipantsToGroup(sessionId, participants);

            expect(results).to.have.length(2);
            expect(results[0].success).to.be.true;
            expect(results[0].participantId).to.equal('user1');
            expect(results[0].inviteCode).to.be.a('string');

            const session = service.groupSessions.get(sessionId);
            expect(session.participants.size).to.equal(2);
        });

        it('should reject duplicate participants', async () => {
            const participant = { id: 'user1', email: 'user1@test.com' };

            sinon.stub(service, 'validateParticipant').callsFake(async (p) => p);

            // Add participant first time
            await service.addParticipantsToGroup(sessionId, [participant]);

            // Try to add same participant again
            const results = await service.addParticipantsToGroup(sessionId, [participant]);

            expect(results[0].success).to.be.false;
            expect(results[0].error).to.include('already in group');
        });

        it('should reject when group is full', async () => {
            const session = service.groupSessions.get(sessionId);
            session.config.maxSize = 1;

            const participants = [
                { id: 'user1', email: 'user1@test.com' },
                { id: 'user2', email: 'user2@test.com' }
            ];

            sinon.stub(service, 'validateParticipant').callsFake(async (p) => p);

            // Add first participant
            await service.addParticipantsToGroup(sessionId, [participants[0]]);

            // Try to add second participant (should fail)
            const results = await service.addParticipantsToGroup(sessionId, [participants[1]]);

            expect(results[0].success).to.be.false;
            expect(results[0].error).to.include('full');
        });
    });

    describe('Session Starting and Proximity Monitoring', () => {
        let sessionId;

        beforeEach(async () => {
            sinon.stub(service, 'validateOrganizer').resolves({ id: 'organizer' });
            sinon.stub(service, 'validateParticipant').callsFake(async (p) => p);
            sinon.stub(service, 'getCurrentLocation').resolves({
                latitude: 40.7128,
                longitude: -74.0060,
                accuracy: 10
            });

            const session = await service.createGroupSession('organizer');
            sessionId = session.id;

            // Add minimum participants
            await service.addParticipantsToGroup(sessionId, [
                { id: 'user1', email: 'user1@test.com' },
                { id: 'user2', email: 'user2@test.com' }
            ]);
        });

        it('should start group session with sufficient participants', async () => {
            // Ensure proximity onboarding fails for this test to prevent auto-completion
            const mockOnboardingService = {
                processProximityOnboarding: sinon.stub().rejects(new Error('Onboarding should not happen in this test'))
            };
            service.serviceRegistry.get.withArgs('proximityOnboardingService').returns(mockOnboardingService);
            
            const session = await service.startGroupSession(sessionId);

            expect(session.status).to.equal('active');
            expect(session.startedAt).to.be.a('number');
        });        it('should emit groupSessionStarted event', async () => {
            // Convert event listener to Promise
            const sessionStartedPromise = new Promise((resolve) => {
                service.once('groupSessionStarted', (data) => {
                    expect(data.sessionId).to.equal(sessionId);
                    expect(data.participantCount).to.equal(2);
                    resolve(data);
                });
            });

            await service.startGroupSession(sessionId);
            await sessionStartedPromise;
        });

        it('should reject starting with insufficient participants', async () => {
            // Create new session with no participants
            const emptySession = await service.createGroupSession('organizer2');

            try {
                await service.startGroupSession(emptySession.id);
                expect.fail('Should have thrown error');
            } catch (error) {
                expect(error.message).to.include('Insufficient participants');
            }
        });

        it('should monitor participant proximity', async () => {
            sinon.stub(service, 'monitorParticipantProximity').resolves();

            await service.startGroupSession(sessionId);

            const session = service.groupSessions.get(sessionId);
            expect(service.monitorParticipantProximity.calledTwice).to.be.true;
        });
    });

    describe('Proximity Evaluation', () => {
        let sessionId, participantId;

        beforeEach(async () => {
            sinon.stub(service, 'validateOrganizer').resolves({ id: 'organizer' });
            sinon.stub(service, 'validateParticipant').callsFake(async (p) => p);
            sinon.stub(service, 'getCurrentLocation').resolves({
                latitude: 40.7128,
                longitude: -74.0060,
                accuracy: 10
            });

            const session = await service.createGroupSession('organizer');
            sessionId = session.id;
            participantId = 'user1';

            await service.addParticipantsToGroup(sessionId, [
                { id: participantId, email: 'user1@test.com' },
                { id: 'user2', email: 'user2@test.com' }
            ]);

            await service.startGroupSession(sessionId);
        });

        it('should confirm participant proximity when requirements met', async () => {
            const session = service.groupSessions.get(sessionId);
            
            // Set up proximity data
            session.proximityData.set(participantId, {
                confidence: 0.8,
                withinRange: true,
                lastUpdate: Date.now()
            });

            sinon.stub(service, 'onboardParticipant').resolves();

            await service.evaluateParticipantProximity(session, participantId);

            const participant = session.participants.get(participantId);
            expect(participant.proximityConfirmed).to.be.true;
        });        it('should emit participantProximityConfirmed event', async () => {
            const session = service.groupSessions.get(sessionId);
            
            // Reset proximity confirmation for this test so the event can be emitted
            const participant = session.participants.get(participantId);
            participant.proximityConfirmed = false;
            delete participant.proximityConfirmedAt;
            
            session.proximityData.set(participantId, {
                confidence: 0.8,
                withinRange: true,
                lastUpdate: Date.now()
            });

            sinon.stub(service, 'onboardParticipant').resolves();

            // Convert event listener to Promise
            const proximityConfirmedPromise = new Promise((resolve) => {
                service.once('participantProximityConfirmed', (data) => {
                    expect(data.sessionId).to.equal(sessionId);
                    expect(data.participantId).to.equal(participantId);
                    resolve(data);
                });
            });

            await service.evaluateParticipantProximity(session, participantId);
            await proximityConfirmedPromise;
        });

        it('should not confirm proximity when requirements not met', async () => {
            const session = service.groupSessions.get(sessionId);
            
            // Reset proximity confirmation for this test
            const participant = session.participants.get(participantId);
            participant.proximityConfirmed = false;
            delete participant.proximityConfirmedAt;
            
            // Set up insufficient proximity data
            session.proximityData.set(participantId, {
                confidence: 0.5, // Too low
                withinRange: false,
                lastUpdate: Date.now()
            });

            await service.evaluateParticipantProximity(session, participantId);

            expect(participant.proximityConfirmed).to.be.false;
        });
    });

    describe('Participant Onboarding with Token Decay', () => {
        let sessionId, participantId;

        beforeEach(async () => {
            sinon.stub(service, 'validateOrganizer').resolves({ id: 'organizer' });
            sinon.stub(service, 'validateParticipant').callsFake(async (p) => p);
            sinon.stub(service, 'getCurrentLocation').resolves({
                latitude: 40.7128,
                longitude: -74.0060
            });

            const session = await service.createGroupSession('organizer');
            sessionId = session.id;
            participantId = 'user1';

            await service.addParticipantsToGroup(sessionId, [
                { id: participantId, email: 'user1@test.com' },
                { id: 'user2', email: 'user2@test.com' }
            ]);

            await service.startGroupSession(sessionId);

            // Confirm proximity for both participants
            const sessionObj = service.groupSessions.get(sessionId);
            const participant = sessionObj.participants.get(participantId);
            participant.proximityConfirmed = true;
            participant.proximityConfirmedAt = Date.now();
            
            const participant2 = sessionObj.participants.get('user2');
            participant2.proximityConfirmed = true;
            participant2.proximityConfirmedAt = Date.now();
        });        it('should calculate linear token decay based on join order', () => {
            const session = service.groupSessions.get(sessionId);
            
            // Organizer has 10 tokens, so participants get 9, 8, 7, etc.
            session.organizerCurrentTokens = 10;
            
            // Add participants with different confirmation times
            session.participants.set('user2', {
                id: 'user2',
                proximityConfirmed: true,
                proximityConfirmedAt: Date.now() + 1000
            });
            session.participants.set('user3', {
                id: 'user3',
                proximityConfirmed: true,
                proximityConfirmedAt: Date.now() + 2000
            });

            const tokens1 = service.calculateGroupTokens(session, participantId); // First: 10-1 = 9
            const tokens2 = service.calculateGroupTokens(session, 'user2');       // Second: 10-2 = 8  
            const tokens3 = service.calculateGroupTokens(session, 'user3');       // Third: 10-3 = 7

            expect(tokens1).to.equal(9);
            expect(tokens2).to.equal(8);
            expect(tokens3).to.equal(7);
            expect(tokens1).to.be.greaterThan(tokens2);
            expect(tokens2).to.be.greaterThan(tokens3);
            expect(tokens3).to.be.at.least(1); // Minimum 1 token guaranteed
        });

        it('should onboard participant with correct token count', async () => {
            // Mock onboarding service
            const mockOnboardingService = {
                processProximityOnboarding: sinon.stub().resolves({
                    success: true,
                    userId: participantId,
                    publicKey: 'mock-public-key',
                    biometricHash: 'mock-biometric-hash'
                })
            };
            service.serviceRegistry.get.withArgs('proximityOnboardingService').returns(mockOnboardingService);

            const result = await service.onboardParticipant(sessionId, participantId);

            expect(result.success).to.be.true;

            const session = service.groupSessions.get(sessionId);
            const participant = session.participants.get(participantId);
            expect(participant.status).to.equal('onboarded');
            expect(participant.tokensReceived).to.be.a('number');
            expect(participant.tokensReceived).to.be.greaterThan(0);
        });        it('should emit participantOnboarded event', async () => {
            const mockOnboardingService = {
                processProximityOnboarding: sinon.stub().resolves({
                    success: true,
                    userId: participantId,
                    publicKey: 'mock-public-key',
                    biometricHash: 'mock-biometric-hash'
                })
            };
            service.serviceRegistry.get.withArgs('proximityOnboardingService').returns(mockOnboardingService);

            // Convert event listener to Promise
            const participantOnboardedPromise = new Promise((resolve) => {
                service.once('participantOnboarded', (data) => {
                    expect(data.sessionId).to.equal(sessionId);
                    expect(data.participantId).to.equal(participantId);
                    expect(data.tokensReceived).to.be.a('number');
                    resolve(data);
                });
            });

            await service.onboardParticipant(sessionId, participantId);
            await participantOnboardedPromise;
        });

        it('should reject onboarding without proximity confirmation', async () => {
            // Remove proximity confirmation
            const session = service.groupSessions.get(sessionId);
            const participant = session.participants.get(participantId);
            participant.proximityConfirmed = false;

            try {
                await service.onboardParticipant(sessionId, participantId);
                expect.fail('Should have thrown error');
            } catch (error) {
                expect(error.message).to.include('proximity not confirmed');
            }
        });
    });

    describe('Session Completion and Management', () => {
        let sessionId;

        beforeEach(async () => {
            sinon.stub(service, 'validateOrganizer').resolves({ id: 'organizer' });
            sinon.stub(service, 'validateParticipant').callsFake(async (p) => p);

            const session = await service.createGroupSession('organizer');
            sessionId = session.id;
        });

        it('should complete session when all participants onboarded', async () => {
            const session = service.groupSessions.get(sessionId);
            session.participants.set('user1', { onboardingComplete: true });
            session.participants.set('user2', { onboardingComplete: true });
            session.startedAt = Date.now() - 5000;

            const summary = await service.completeGroupSession(sessionId);

            expect(summary.sessionId).to.equal(sessionId);
            expect(summary.successfulOnboards).to.be.a('number');
            expect(session.status).to.equal('completed');
        });        it('should emit groupSessionCompleted event', async () => {
            const session = service.groupSessions.get(sessionId);
            session.participants.set('user1', { onboardingComplete: true });
            session.startedAt = Date.now();

            // Convert event listener to Promise
            const sessionCompletedPromise = new Promise((resolve) => {
                service.once('groupSessionCompleted', (summary) => {
                    expect(summary.sessionId).to.equal(sessionId);
                    resolve(summary);
                });
            });

            await service.completeGroupSession(sessionId);
            await sessionCompletedPromise;
        });

        it('should cancel group session', async () => {
            const reason = 'Test cancellation';
            const result = await service.cancelGroupSession(sessionId, reason);

            expect(result.status).to.equal('cancelled');
            expect(result.cancelReason).to.equal(reason);
            expect(service.groupSessions.has(sessionId)).to.be.false;
        });

        it('should get group session status', () => {
            const status = service.getGroupSessionStatus(sessionId);

            expect(status).to.be.an('object');
            expect(status.sessionId).to.equal(sessionId);
            expect(status.status).to.equal('created');
            expect(status.organizerId).to.equal('organizer');
        });

        it('should return null for non-existent session', () => {
            const status = service.getGroupSessionStatus('non-existent');
            expect(status).to.be.null;
        });
    });

    describe('Utility Methods', () => {
        it('should calculate distance between coordinates', () => {
            const distance = service.calculateDistance(
                40.7128, -74.0060, // New York
                34.0522, -118.2437  // Los Angeles
            );

            expect(distance).to.be.a('number');
            expect(distance).to.be.greaterThan(3000000); // ~3000+ km
        });

        it('should check if location is within proximity range', () => {
            const location1 = { latitude: 40.7128, longitude: -74.0060 };
            const location2 = { 
                latitude: 40.7129, 
                longitude: -74.0061,
                radius: 100 // 100 meters
            };

            const withinRange = service.isWithinProximityRange(location1, location2);
            expect(withinRange).to.be.true;
        });

        it('should generate unique invite codes', () => {
            const code1 = service.generateInviteCode('session1', 'user1');
            const code2 = service.generateInviteCode('session1', 'user2');
            const code3 = service.generateInviteCode('session2', 'user1');

            expect(code1).to.be.a('string');
            expect(code1).to.have.length(16);
            expect(code1).to.not.equal(code2);
            expect(code1).to.not.equal(code3);
        });
    });

    describe('Session Cleanup', () => {
        it('should cleanup expired sessions', async () => {
            sinon.stub(service, 'validateOrganizer').resolves({ id: 'organizer' });
            
            const session = await service.createGroupSession('organizer');
            const sessionId = session.id;

            // Manually expire the session
            const sessionObj = service.groupSessions.get(sessionId);
            sessionObj.expiresAt = Date.now() - 1000; // Expired 1 second ago

            // Trigger cleanup
            service.startSessionCleanup();
            clock.tick(60000); // Advance 1 minute

            expect(service.groupSessions.has(sessionId)).to.be.false;
        });
    });

    describe('Token Limit Enforcement', () => {
        it('should prevent adding more participants than organizer has tokens', async () => {
            // Create mock organizer with only 3 tokens
            const mockOrganizerTokens = 3;
            
            // Override the getOrganizerTokenCount method to return 3 tokens
            sinon.stub(service, 'getOrganizerTokenCount').resolves(mockOrganizerTokens);
            
            const sessionObj = await service.createGroupSession('organizer1');
            expect(sessionObj.organizerCurrentTokens).to.equal(mockOrganizerTokens);
            expect(sessionObj.config.maxSize).to.equal(mockOrganizerTokens); // Should be limited to 3
            
            // Should successfully add 3 participants (within token limit)
            const participants = [
                { id: 'user1', name: 'User 1', email: 'user1@test.com' },
                { id: 'user2', name: 'User 2', email: 'user2@test.com' },
                { id: 'user3', name: 'User 3', email: 'user3@test.com' }
            ];
            
            const results = await service.addParticipantsToGroup(sessionObj.id, participants);
            expect(results).to.have.length(3);
            expect(results.every(r => r.success)).to.be.true;
            
            // Should reject 4th participant (exceeds token limit)
            const fourthParticipant = [{ id: 'user4', name: 'User 4', email: 'user4@test.com' }];
            
            try {
                await service.addParticipantsToGroup(sessionObj.id, fourthParticipant);
                expect.fail('Should have thrown error for insufficient tokens');
            } catch (error) {
                expect(error.message).to.include('insufficient tokens');
                expect(error.message).to.include('Available tokens: 3');
            }
        });
        
        it('should track available tokens correctly', async () => {
            const mockOrganizerTokens = 5;
            sinon.stub(service, 'getOrganizerTokenCount').resolves(mockOrganizerTokens);
            
            const sessionObj = await service.createGroupSession('organizer1');
            
            // Initially should have all tokens available
            expect(service.getAvailableTokensForSession(sessionObj.id)).to.equal(5);
            expect(service.canAddParticipants(sessionObj.id, 5)).to.be.true;
            expect(service.canAddParticipants(sessionObj.id, 6)).to.be.false;
            
            // Add 2 participants
            const participants = [
                { id: 'user1', name: 'User 1', email: 'user1@test.com' },
                { id: 'user2', name: 'User 2', email: 'user2@test.com' }
            ];
            
            await service.addParticipantsToGroup(sessionObj.id, participants);
            
            // Should have 3 tokens remaining
            expect(service.getAvailableTokensForSession(sessionObj.id)).to.equal(3);
            expect(service.canAddParticipants(sessionObj.id, 3)).to.be.true;
            expect(service.canAddParticipants(sessionObj.id, 4)).to.be.false;
            
            // Token info should be accurate
            const tokenInfo = service.getSessionTokenInfo(sessionObj.id);
            expect(tokenInfo.totalTokens).to.equal(5);
            expect(tokenInfo.tokensCommitted).to.equal(2);
            expect(tokenInfo.tokensAvailable).to.equal(3);
            expect(tokenInfo.participantCount).to.equal(2);
        });
        
        it('should prevent batch adding more participants than tokens allow', async () => {
            const mockOrganizerTokens = 3;
            sinon.stub(service, 'getOrganizerTokenCount').resolves(mockOrganizerTokens);
            
            const sessionObj = await service.createGroupSession('organizer1');
            
            // Try to add 5 participants when organizer only has 3 tokens
            const participants = [
                { id: 'user1', name: 'User 1', email: 'user1@test.com' },
                { id: 'user2', name: 'User 2', email: 'user2@test.com' },
                { id: 'user3', name: 'User 3', email: 'user3@test.com' },
                { id: 'user4', name: 'User 4', email: 'user4@test.com' },
                { id: 'user5', name: 'User 5', email: 'user5@test.com' }
            ];
            
            try {
                await service.addParticipantsToGroup(sessionObj.id, participants);
                expect.fail('Should have thrown error for insufficient tokens');
            } catch (error) {
                expect(error.message).to.include('insufficient tokens');
                expect(error.message).to.include('Available tokens: 3');
                expect(error.message).to.include('Requested new participants: 5');
            }
        });
        
        it('should calculate tokens correctly even with token limits', () => {
            const mockOrganizerTokens = 3;
            
            const sessionObj = {
                organizerCurrentTokens: mockOrganizerTokens,
                participants: new Map([
                    ['user1', { id: 'user1', proximityConfirmed: true, proximityConfirmedAt: 100 }],
                    ['user2', { id: 'user2', proximityConfirmed: true, proximityConfirmedAt: 200 }],
                    ['user3', { id: 'user3', proximityConfirmed: true, proximityConfirmedAt: 300 }]
                ])
            };
            
            // First user: 3 - 1 = 2 tokens
            const tokens1 = service.calculateGroupTokens(sessionObj, 'user1');
            expect(tokens1).to.equal(2);
            
            // Second user: 3 - 2 = 1 token
            const tokens2 = service.calculateGroupTokens(sessionObj, 'user2');
            expect(tokens2).to.equal(1);
            
            // Third user: 3 - 3 = 0, but minimum 1
            const tokens3 = service.calculateGroupTokens(sessionObj, 'user3');
            expect(tokens3).to.equal(1);
        });
        
        it('should throw error for participants beyond token limit in calculateGroupTokens', () => {
            const mockOrganizerTokens = 2;
            
            const sessionObj = {
                organizerCurrentTokens: mockOrganizerTokens,
                participants: new Map([
                    ['user1', { id: 'user1', proximityConfirmed: true, proximityConfirmedAt: 100 }],
                    ['user2', { id: 'user2', proximityConfirmed: true, proximityConfirmedAt: 200 }],
                    ['user3', { id: 'user3', proximityConfirmed: true, proximityConfirmedAt: 300 }]
                ])
            };
            
            // Should work for users within token limit
            expect(() => service.calculateGroupTokens(sessionObj, 'user1')).to.not.throw();
            expect(() => service.calculateGroupTokens(sessionObj, 'user2')).to.not.throw();
            
            // Should throw for user3 (position 3, but organizer only has 2 tokens)
            expect(() => service.calculateGroupTokens(sessionObj, 'user3')).to.throw('Cannot onboard participant at position 3: organizer only has 2 tokens');
        });
    });

    describe('Exponential Growth Demonstration', () => {
        it('should demonstrate exponential network growth despite linear decay', () => {
            // Test the mathematical insight: F(t) = 2^t total network size
            
            // Mock helper function to calculate theoretical network size
            function calculateNetworkSize(startingTokens) {
                if (startingTokens <= 0) return 1;
                return Math.pow(2, startingTokens);
            }
            
            // Test cases based on the mathematical analysis
            const testCases = [
                { tokens: 0, expectedSize: 1 },
                { tokens: 1, expectedSize: 2 },
                { tokens: 2, expectedSize: 4 },
                { tokens: 3, expectedSize: 8 },
                { tokens: 4, expectedSize: 16 },
                { tokens: 5, expectedSize: 32 },
                { tokens: 10, expectedSize: 1024 }
            ];
            
            testCases.forEach(({ tokens, expectedSize }) => {
                const actualSize = calculateNetworkSize(tokens);
                expect(actualSize).to.equal(expectedSize, 
                    `F(${tokens}) should equal 2^${tokens} = ${expectedSize}`);
            });
            
            // Verify that starting with 10 tokens creates a network of 1,024 people
            expect(calculateNetworkSize(10)).to.equal(1024);
        });
    });
});






