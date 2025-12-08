/**
 * @fileoverview Phase 2: WebAuthn Integration for Secure Identity Verification
 * Secure authentication for moderators, channel owners, and governance
 */

import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { isoUint8Array } from '@simplewebauthn/server/helpers';
import crypto from 'crypto';
import logger from '../utils/logging/logger.mjs';

const webauthnLogger = logger.child({ module: 'webauthn-integration' });

/**
 * WebAuthn Integration for Relay Network
 * Provides secure, phishing-resistant authentication for moderators and governance
 */
export class WebAuthnManager {
    constructor(options = {}) {
        this.options = {
            rpName: options.rpName || 'Relay Network',
            rpID: options.rpID || 'relay.network',
            origin: options.origin || 'https://relay.network',
            requireUserVerification: options.requireUserVerification !== false,
            timeout: options.timeout || 60000,
            attestationType: options.attestationType || 'none',
            enableFallback: options.enableFallback !== false,
            credentialRotationDays: options.credentialRotationDays || 90,
            ...options
        };

        // Enhanced storage for production
        this.users = new Map();
        this.authenticators = new Map();
        this.challenges = new Map();
        
        // Multi-credential system for resilience
        this.primaryCredentials = new Map();
        this.backupCredentials = new Map();
        this.recoveryTokens = new Map();
        
        // Attestation verification system
        this.attestationChains = new Map();
        this.trustedAttestors = new Set();
        
        // Role-based access control with granular permissions
        this.rolePermissions = {
            super_moderator: [
                'moderate_all_channels',
                'resolve_disputes',
                'audit_events',
                'manage_governance',
                'ban_users',
                'system_administration'
            ],
            moderator: [
                'moderate_assigned_channels',
                'resolve_minor_disputes',
                'view_audit_events',
                'participate_governance'
            ],
            channel_owner: [
                'manage_owned_channels',
                'set_channel_policies',
                'approve_members',
                'export_channel_data',
                'delegate_moderation'
            ],
            governance_member: [
                'vote_proposals',
                'submit_proposals',
                'view_analytics',
                'participate_discussions'
            ],
            auditor: [
                'view_all_audit_logs',
                'generate_compliance_reports',
                'verify_integrity',
                'audit_financial_records'
            ],
            regional_coordinator: [
                'coordinate_regional_nodes',
                'manage_local_disputes',
                'optimize_network_topology',
                'regional_governance'
            ]
        };

        // Credential lifecycle management
        this.credentialMetrics = {
            registrations: 0,
            authentications: 0,
            failures: 0,
            rotations: 0,
            recoveries: 0
        };
    }

    /**
     * Initialize WebAuthn manager
     */
    async initialize() {
        webauthnLogger.info('Initializing WebAuthn Manager with enhanced features');
        
        // Set up credential rotation monitoring
        this.startCredentialMonitoring();
        
        // Initialize fallback mechanisms
        if (this.options.enableFallback) {
            await this.initializeFallbackMethods();
        }
        
        webauthnLogger.info('WebAuthn Manager initialized successfully');
    }

    /**
     * Register new WebAuthn credential for user
     */
    async registerCredential(userId, username, role = 'governance_member') {
        try {
            webauthnLogger.info('Starting WebAuthn registration', {
                userId,
                username,
                role
            });

            // Check if user already exists
            let user = this.users.get(userId);
            if (!user) {
                user = {
                    id: userId,
                    username,
                    role,
                    createdAt: new Date().toISOString(),
                    authenticators: [],
                    identityAnchor: this.generateIdentityAnchor(userId)
                };
                this.users.set(userId, user);
                this.identityAnchors.set(user.identityAnchor, userId);
            }

            // Generate registration options
            const registrationOptions = await generateRegistrationOptions({
                rpName: this.options.rpName,
                rpID: this.options.rpID,
                userID: isoUint8Array.fromUTF8String(userId),
                userName: username,
                userDisplayName: `${username} (${role})`,
                
                // Exclude existing authenticators to prevent duplicate registrations
                excludeCredentials: user.authenticators.map(auth => ({
                    id: isoUint8Array.fromUTF8String(auth.credentialID),
                    type: 'public-key',
                    transports: auth.transports
                })),

                // Authenticator selection criteria
                authenticatorSelection: {
                    userVerification: this.options.requireUserVerification ? 'required' : 'preferred',
                    requireResidentKey: false,
                    residentKey: 'discouraged'
                },

                attestationType: this.options.attestationType,
                timeout: this.options.timeout
            });

            // Store challenge for verification
            this.challenges.set(userId, {
                challenge: registrationOptions.challenge,
                type: 'registration',
                createdAt: Date.now(),
                userId,
                role
            });

            webauthnLogger.info('Registration options generated', {
                userId,
                challengeId: registrationOptions.challenge
            });

            return {
                registrationOptions,
                identityAnchor: user.identityAnchor,
                supportedRoles: Object.keys(this.rolePermissions)
            };

        } catch (error) {
            webauthnLogger.error('WebAuthn registration failed', {
                userId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Verify WebAuthn registration response
     */
    async verifyRegistration(userId, registrationResponse) {
        try {
            webauthnLogger.info('Verifying WebAuthn registration', { userId });

            const user = this.users.get(userId);
            const challengeInfo = this.challenges.get(userId);

            if (!user || !challengeInfo || challengeInfo.type !== 'registration') {
                throw new Error('Invalid registration attempt');
            }

            // Verify the registration response
            const verification = await verifyRegistrationResponse({
                response: registrationResponse,
                expectedChallenge: challengeInfo.challenge,
                expectedOrigin: this.options.origin,
                expectedRPID: this.options.rpID,
                requireUserVerification: this.options.requireUserVerification
            });

            if (!verification.verified || !verification.registrationInfo) {
                throw new Error('Registration verification failed');
            }

            // Store the new authenticator
            const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;
            
            const newAuthenticator = {
                credentialID: isoUint8Array.toUTF8String(credentialID),
                credentialPublicKey,
                counter,
                transports: registrationResponse.response.transports || [],
                registeredAt: new Date().toISOString(),
                lastUsed: null,
                nickname: `${user.role}-key-${user.authenticators.length + 1}`
            };

            user.authenticators.push(newAuthenticator);
            this.authenticators.set(newAuthenticator.credentialID, {
                ...newAuthenticator,
                userId,
                role: user.role
            });

            // Generate backup codes
            const backupCodes = this.generateBackupCodes(userId);
            this.backupCodes.set(userId, {
                codes: backupCodes,
                createdAt: new Date().toISOString(),
                used: []
            });

            // Clean up challenge
            this.challenges.delete(userId);

            webauthnLogger.info('WebAuthn registration successful', {
                userId,
                credentialId: newAuthenticator.credentialID,
                role: user.role
            });

            return {
                verified: true,
                authenticator: newAuthenticator,
                backupCodes,
                identityAnchor: user.identityAnchor,
                permissions: this.rolePermissions[user.role] || []
            };

        } catch (error) {
            webauthnLogger.error('Registration verification failed', {
                userId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Generate authentication challenge
     */
    async generateAuthenticationChallenge(userIdentifier, requiredRole = null) {
        try {
            // Support authentication by userId, username, or identity anchor
            const user = this.findUser(userIdentifier);
            
            if (!user) {
                throw new Error('User not found');
            }

            // Check role permissions if required
            if (requiredRole && user.role !== requiredRole && !this.hasPermission(user.role, requiredRole)) {
                throw new Error(`Insufficient permissions. Required: ${requiredRole}, User has: ${user.role}`);
            }

            // Generate authentication options
            const authenticationOptions = await generateAuthenticationOptions({
                rpID: this.options.rpID,
                allowCredentials: user.authenticators.map(auth => ({
                    id: isoUint8Array.fromUTF8String(auth.credentialID),
                    type: 'public-key',
                    transports: auth.transports
                })),
                userVerification: this.options.requireUserVerification ? 'required' : 'preferred',
                timeout: this.options.timeout
            });

            // Store challenge for verification
            this.challenges.set(user.id, {
                challenge: authenticationOptions.challenge,
                type: 'authentication',
                createdAt: Date.now(),
                userId: user.id,
                requiredRole
            });

            webauthnLogger.info('Authentication challenge generated', {
                userId: user.id,
                requiredRole,
                challengeId: authenticationOptions.challenge
            });

            return {
                authenticationOptions,
                userId: user.id,
                username: user.username,
                role: user.role,
                permissions: this.rolePermissions[user.role] || []
            };

        } catch (error) {
            webauthnLogger.error('Failed to generate authentication challenge', {
                userIdentifier,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Verify authentication response
     */
    async verifyAuthentication(userId, authenticationResponse) {
        try {
            webauthnLogger.info('Verifying WebAuthn authentication', { userId });

            const user = this.users.get(userId);
            const challengeInfo = this.challenges.get(userId);

            if (!user || !challengeInfo || challengeInfo.type !== 'authentication') {
                throw new Error('Invalid authentication attempt');
            }

            // Find the authenticator being used
            const credentialID = isoUint8Array.toUTF8String(authenticationResponse.rawId);
            const authenticator = user.authenticators.find(auth => 
                auth.credentialID === credentialID
            );

            if (!authenticator) {
                throw new Error('Authenticator not found');
            }

            // Verify the authentication response
            const verification = await verifyAuthenticationResponse({
                response: authenticationResponse,
                expectedChallenge: challengeInfo.challenge,
                expectedOrigin: this.options.origin,
                expectedRPID: this.options.rpID,
                authenticator: {
                    credentialID: isoUint8Array.fromUTF8String(authenticator.credentialID),
                    credentialPublicKey: authenticator.credentialPublicKey,
                    counter: authenticator.counter,
                    transports: authenticator.transports
                },
                requireUserVerification: this.options.requireUserVerification
            });

            if (!verification.verified) {
                throw new Error('Authentication verification failed');
            }

            // Update authenticator counter and last used
            authenticator.counter = verification.authenticationInfo.newCounter;
            authenticator.lastUsed = new Date().toISOString();

            // Generate session token
            const sessionToken = this.generateSessionToken(user, challengeInfo.requiredRole);

            // Clean up challenge
            this.challenges.delete(userId);

            webauthnLogger.info('WebAuthn authentication successful', {
                userId,
                credentialId: authenticator.credentialID,
                role: user.role,
                sessionDuration: '1 hour'
            });

            return {
                verified: true,
                sessionToken,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    identityAnchor: user.identityAnchor
                },
                permissions: this.rolePermissions[user.role] || [],
                authenticator: {
                    nickname: authenticator.nickname,
                    lastUsed: authenticator.lastUsed
                }
            };

        } catch (error) {
            webauthnLogger.error('Authentication verification failed', {
                userId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Rotate user credentials (for backup/recovery)
     */
    async rotateCredentials(userId, oldCredentialId, newRegistrationResponse) {
        try {
            const user = this.users.get(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Remove old authenticator
            user.authenticators = user.authenticators.filter(auth => 
                auth.credentialID !== oldCredentialId
            );
            this.authenticators.delete(oldCredentialId);

            // Add new authenticator (reuse registration verification logic)
            const verification = await this.verifyRegistration(userId, newRegistrationResponse);

            webauthnLogger.info('Credentials rotated successfully', {
                userId,
                oldCredentialId,
                newCredentialId: verification.authenticator.credentialID
            });

            return verification;

        } catch (error) {
            webauthnLogger.error('Credential rotation failed', {
                userId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Backup code authentication (fallback for non-WebAuthn clients)
     */
    async authenticateWithBackupCode(userId, backupCode) {
        try {
            const user = this.users.get(userId);
            const userBackupCodes = this.backupCodes.get(userId);

            if (!user || !userBackupCodes) {
                throw new Error('Invalid backup code authentication');
            }

            const codeIndex = userBackupCodes.codes.indexOf(backupCode);
            if (codeIndex === -1 || userBackupCodes.used.includes(backupCode)) {
                throw new Error('Invalid or already used backup code');
            }

            // Mark code as used
            userBackupCodes.used.push(backupCode);

            // Generate limited session token
            const sessionToken = this.generateSessionToken(user, null, {
                backup: true,
                duration: '30m' // Shorter session for backup codes
            });

            webauthnLogger.info('Backup code authentication successful', {
                userId,
                remainingCodes: userBackupCodes.codes.length - userBackupCodes.used.length
            });

            return {
                verified: true,
                sessionToken,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                },
                backup: true,
                remainingCodes: userBackupCodes.codes.length - userBackupCodes.used.length
            };

        } catch (error) {
            webauthnLogger.error('Backup code authentication failed', {
                userId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Register moderator with WebAuthn credential and backup systems
     */
    async registerModerator(userId, userInfo, role = 'moderator') {
        try {
            webauthnLogger.info('Registering moderator with enhanced WebAuthn', {
                userId,
                username: userInfo.displayName,
                role
            });

            // Validate role permissions
            if (!this.rolePermissions[role]) {
                throw new Error(`Invalid role: ${role}`);
            }

            // Create or update user
            let user = this.users.get(userId);
            if (!user) {
                user = {
                    id: userId,
                    username: userInfo.displayName,
                    role,
                    email: userInfo.email,
                    createdAt: new Date().toISOString(),
                    primaryCredential: null,
                    backupCredentials: [],
                    identityAnchor: this.generateIdentityAnchor(userId),
                    credentialRotationDue: this.calculateRotationDate(),
                    permissions: this.rolePermissions[role],
                    lastAuthentication: null,
                    authenticationHistory: []
                };
                this.users.set(userId, user);
            }

            // Generate primary credential registration
            const primaryOptions = await this.generateRegistrationOptions(userId, 'primary');
            
            // Store challenge for verification
            this.challenges.set(primaryOptions.challenge, {
                userId,
                type: 'registration',
                credentialType: 'primary',
                timestamp: Date.now(),
                expiresAt: Date.now() + this.options.timeout
            });

            this.credentialMetrics.registrations++;

            return {
                registrationOptions: primaryOptions,
                identityAnchor: user.identityAnchor,
                requiredBackups: 2, // Require 2 backup credentials
                credentialRotationDue: user.credentialRotationDue
            };

        } catch (error) {
            webauthnLogger.error('Moderator registration failed', { userId, error: error.message });
            throw error;
        }
    }

    /**
     * Generate registration options with enhanced security
     */
    async generateRegistrationOptions(userId, credentialType = 'primary') {
        const user = this.users.get(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Get existing authenticators to prevent duplicate registrations
        const existingAuthenticators = this.getExistingAuthenticators(userId);

        const options = await generateRegistrationOptions({
            rpName: this.options.rpName,
            rpID: this.options.rpID,
            userID: isoUint8Array.fromUTF8String(userId),
            userName: user.username,
            userDisplayName: user.username,
            timeout: this.options.timeout,
            attestationType: this.options.attestationType,
            
            // Enhanced security options
            authenticatorSelection: {
                authenticatorAttachment: credentialType === 'primary' ? 'platform' : 'cross-platform',
                userVerification: 'required',
                requireResidentKey: true
            },

            // Exclude existing authenticators
            excludeCredentials: existingAuthenticators.map(auth => ({
                id: auth.credentialID,
                type: 'public-key',
                transports: auth.transports
            })),

            // Enhanced attestation for high-privilege roles
            extensions: user.role.includes('moderator') || user.role === 'auditor' ? {
                credProps: true,
                largeBlob: { support: 'required' }
            } : undefined
        });

        return options;
    }

    /**
     * Verify registration response with attestation validation
     */
    async verifyRegistrationResponse(userId, registrationResponse) {
        try {
            const challenge = this.challenges.get(registrationResponse.response.clientDataJSON);
            if (!challenge || challenge.userId !== userId) {
                throw new Error('Invalid challenge');
            }

            const user = this.users.get(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Verify the registration
            const verification = await verifyRegistrationResponse({
                response: registrationResponse,
                expectedChallenge: challenge.challenge,
                expectedOrigin: this.options.origin,
                expectedRPID: this.options.rpID,
                requireUserVerification: true
            });

            if (!verification.verified) {
                throw new Error('Registration verification failed');
            }

            // Create authenticator record
            const authenticator = {
                credentialID: verification.registrationInfo.credentialID,
                credentialPublicKey: verification.registrationInfo.credentialPublicKey,
                counter: verification.registrationInfo.counter,
                credentialDeviceType: verification.registrationInfo.credentialDeviceType,
                credentialBackedUp: verification.registrationInfo.credentialBackedUp,
                transports: registrationResponse.response.transports || [],
                createdAt: new Date().toISOString(),
                type: challenge.credentialType,
                aaguid: verification.registrationInfo.aaguid,
                attestationObject: registrationResponse.response.attestationObject
            };

            // Store authenticator
            const authId = crypto.randomBytes(16).toString('hex');
            this.authenticators.set(authId, authenticator);

            // Update user record
            if (challenge.credentialType === 'primary') {
                user.primaryCredential = authId;
            } else {
                user.backupCredentials.push(authId);
            }

            // Validate attestation for high-privilege roles
            if (user.role.includes('moderator') || user.role === 'auditor') {
                await this.validateAttestation(authenticator, user);
            }

            // Clean up challenge
            this.challenges.delete(challenge.challenge);

            webauthnLogger.info('Registration verified successfully', {
                userId,
                credentialType: challenge.credentialType,
                deviceType: authenticator.credentialDeviceType
            });

            return {
                verified: true,
                authenticatorId: authId,
                credentialType: challenge.credentialType,
                requiresBackup: challenge.credentialType === 'primary' && user.backupCredentials.length < 2
            };

        } catch (error) {
            webauthnLogger.error('Registration verification failed', { userId, error: error.message });
            throw error;
        }
    }

    /**
     * Authenticate moderator with fallback support
     */
    async authenticateModerator(userId, credentialId = null) {
        try {
            const user = this.users.get(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Check credential rotation requirements
            if (this.needsCredentialRotation(user)) {
                webauthnLogger.warn('Credential rotation required', { userId });
                return {
                    verified: false,
                    reason: 'credential_rotation_required',
                    rotationDue: user.credentialRotationDue
                };
            }

            // Generate authentication options
            const authOptions = await this.generateAuthenticationOptions(userId, credentialId);

            // Store challenge
            this.challenges.set(authOptions.challenge, {
                userId,
                type: 'authentication',
                timestamp: Date.now(),
                expiresAt: Date.now() + this.options.timeout
            });

            return {
                authenticationOptions: authOptions,
                fallbackAvailable: this.options.enableFallback && user.backupCredentials.length > 0
            };

        } catch (error) {
            webauthnLogger.error('Authentication initiation failed', { userId, error: error.message });
            
            // Provide fallback if enabled
            if (this.options.enableFallback) {
                return await this.initiateFallbackAuthentication(userId);
            }
            
            throw error;
        }
    }

    /**
     * Generate authentication options with credential selection
     */
    async generateAuthenticationOptions(userId, credentialId = null) {
        const user = this.users.get(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Get available authenticators
        const userAuthenticators = this.getUserAuthenticators(userId);
        
        if (userAuthenticators.length === 0) {
            throw new Error('No registered authenticators found');
        }

        // Filter by specific credential if requested
        let allowCredentials = userAuthenticators;
        if (credentialId) {
            allowCredentials = userAuthenticators.filter(auth => 
                Buffer.from(auth.credentialID).toString('hex') === credentialId
            );
            if (allowCredentials.length === 0) {
                throw new Error('Specified credential not found');
            }
        }

        const options = await generateAuthenticationOptions({
            rpID: this.options.rpID,
            timeout: this.options.timeout,
            userVerification: 'required',
            allowCredentials: allowCredentials.map(auth => ({
                id: auth.credentialID,
                type: 'public-key',
                transports: auth.transports
            }))
        });

        return options;
    }

    /**
     * Helper methods
     */
    generateIdentityAnchor(userId) {
        return crypto.createHash('sha256')
            .update(userId + this.options.rpID + Date.now())
            .digest('hex')
            .substr(0, 16);
    }

    generateBackupCodes(userId, count = 10) {
        const codes = [];
        for (let i = 0; i < count; i++) {
            const code = crypto.randomBytes(4).toString('hex').toUpperCase();
            codes.push(code.match(/.{2}/g).join('-'));
        }
        return codes;
    }

    generateSessionToken(user, requiredRole = null, options = {}) {
        const payload = {
            userId: user.id,
            username: user.username,
            role: user.role,
            permissions: this.rolePermissions[user.role] || [],
            identityAnchor: user.identityAnchor,
            issuedAt: Date.now(),
            expiresAt: Date.now() + (options.backup ? 30 * 60 * 1000 : 60 * 60 * 1000), // 30min or 1 hour
            requiredRole,
            backup: options.backup || false
        };

        // In production, use proper JWT signing
        return Buffer.from(JSON.stringify(payload)).toString('base64');
    }

    findUser(identifier) {
        // Search by userId
        if (this.users.has(identifier)) {
            return this.users.get(identifier);
        }

        // Search by identity anchor
        if (this.identityAnchors.has(identifier)) {
            const userId = this.identityAnchors.get(identifier);
            return this.users.get(userId);
        }

        // Search by username
        for (const [userId, user] of this.users) {
            if (user.username === identifier) {
                return user;
            }
        }

        return null;
    }

    hasPermission(userRole, requiredRole) {
        // Role hierarchy: auditor > moderator > channel_owner > governance_member
        const hierarchy = {
            'governance_member': 1,
            'channel_owner': 2,
            'moderator': 3,
            'auditor': 4
        };

        return (hierarchy[userRole] || 0) >= (hierarchy[requiredRole] || 0);
    }

    /**
     * Get user and system statistics
     */
    getStats() {
        const now = Date.now();
        const activeChallenges = Array.from(this.challenges.values())
            .filter(c => now - c.createdAt < this.options.timeout);

        const roleDistribution = {};
        for (const [userId, user] of this.users) {
            roleDistribution[user.role] = (roleDistribution[user.role] || 0) + 1;
        }

        return {
            users: {
                total: this.users.size,
                withAuthenticators: Array.from(this.users.values())
                    .filter(u => u.authenticators.length > 0).length,
                roleDistribution
            },
            authenticators: {
                total: this.authenticators.size,
                recentlyUsed: Array.from(this.authenticators.values())
                    .filter(a => a.lastUsed && now - new Date(a.lastUsed).getTime() < 24 * 60 * 60 * 1000).length
            },
            challenges: {
                active: activeChallenges.length,
                registration: activeChallenges.filter(c => c.type === 'registration').length,
                authentication: activeChallenges.filter(c => c.type === 'authentication').length
            },
            backupCodes: {
                totalUsers: this.backupCodes.size,
                averageRemaining: this.backupCodes.size > 0 
                    ? Array.from(this.backupCodes.values())
                        .reduce((sum, bc) => sum + (bc.codes.length - bc.used.length), 0) / this.backupCodes.size
                    : 0
            }
        };
    }
}

export default RelayWebAuthnService;
