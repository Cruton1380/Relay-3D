// Enhanced Federation Content Control System
import { EventEmitter } from 'events';

export class FederationContentController extends EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.contentFilters = new Map();
        this.userSettings = new Map();
        this.channelPolicies = new Map();
        this.platformCapabilities = new Map();
        this.moderationPipeline = new ContentModerationPipeline();
        
        this.initializePlatformCapabilities();
        this.initializeDefaultPolicies();
    }

    initializePlatformCapabilities() {
        // Define what each platform supports
        this.platformCapabilities.set('mastodon', {
            contentTypes: ['text', 'images', 'video', 'polls'],
            maxTextLength: 500,
            imageFormats: ['jpg', 'png', 'gif', 'webp'],
            videoFormats: ['mp4', 'webm'],
            supportsRichText: true,
            supportsThreads: true,
            moderationSync: true,
            privacyLevels: ['public', 'unlisted', 'followers', 'direct']
        });

        this.platformCapabilities.set('bluesky', {
            contentTypes: ['text', 'images', 'external_links'],
            maxTextLength: 300,
            imageFormats: ['jpg', 'png', 'gif'],
            videoFormats: [],
            supportsRichText: false,
            supportsThreads: true,
            moderationSync: false,
            privacyLevels: ['public', 'followers']
        });

        this.platformCapabilities.set('threads', {
            contentTypes: ['text', 'images', 'video'],
            maxTextLength: 500,
            imageFormats: ['jpg', 'png'],
            videoFormats: ['mp4'],
            supportsRichText: true,
            supportsThreads: true,
            moderationSync: true,
            privacyLevels: ['public', 'followers']
        });

        this.platformCapabilities.set('activitypub_generic', {
            contentTypes: ['text', 'images', 'video', 'documents'],
            maxTextLength: 5000,
            imageFormats: ['jpg', 'png', 'gif', 'webp', 'svg'],
            videoFormats: ['mp4', 'webm', 'ogg'],
            supportsRichText: true,
            supportsThreads: true,
            moderationSync: true,
            privacyLevels: ['public', 'unlisted', 'followers', 'direct', 'custom']
        });
    }

    initializeDefaultPolicies() {
        // Default channel federation policies
        this.channelPolicies.set('default', {
            federation_enabled: true,
            allowed_platforms: ['mastodon', 'activitypub_generic'],
            content_filters: ['safety', 'spam'],
            privacy_level: 'public',
            moderation_sync: true,
            user_override_allowed: true
        });

        this.channelPolicies.set('governance', {
            federation_enabled: true,
            allowed_platforms: ['mastodon', 'bluesky', 'activitypub_generic'],
            content_filters: ['safety', 'spam', 'misinformation'],
            privacy_level: 'public',
            moderation_sync: true,
            user_override_allowed: false, // Governance content should be consistent
            transparency_required: true
        });

        this.channelPolicies.set('private', {
            federation_enabled: false,
            allowed_platforms: [],
            content_filters: ['safety'],
            privacy_level: 'private',
            moderation_sync: false,
            user_override_allowed: false
        });
    }

    // Set user-specific federation preferences
    setUserFederationSettings(userId, settings) {
        this.userSettings.set(userId, {
            global_federation: settings.enabled || false,
            platform_preferences: settings.platforms || {},
            content_type_restrictions: settings.contentTypes || [],
            privacy_default: settings.defaultPrivacy || 'followers',
            identity_protection: settings.identityProtection || 'partial',
            moderation_sync: settings.moderationSync !== false, // Default true
            updated_at: Date.now()
        });

        this.emit('user-settings-updated', { userId, settings });
    }

    // Determine if and how content should be federated
    async determineContentFederation(content, context) {
        const {
            authorId,
            channelId,
            postType,
            targetPlatforms,
            urgency = 'normal'
        } = context;

        const federationDecision = {
            shouldFederate: false,
            approvedPlatforms: [],
            contentModifications: {},
            restrictions: [],
            reasoning: []
        };

        // Check user preferences
        const userSettings = this.userSettings.get(authorId);
        if (!userSettings?.global_federation) {
            federationDecision.reasoning.push('User has disabled federation');
            return federationDecision;
        }

        // Check channel policy
        const channelPolicy = this.channelPolicies.get(channelId) || this.channelPolicies.get('default');
        if (!channelPolicy.federation_enabled) {
            federationDecision.reasoning.push('Channel policy disables federation');
            return federationDecision;
        }

        // Content safety and moderation check
        const moderationResult = await this.moderationPipeline.analyzeContent(content);
        if (moderationResult.risk === 'high') {
            federationDecision.reasoning.push('Content failed safety analysis');
            return federationDecision;
        }

        // Platform compatibility check
        const compatiblePlatforms = this.getCompatiblePlatforms(content, targetPlatforms);
        
        for (const platform of compatiblePlatforms) {
            const platformDecision = await this.evaluatePlatformSuitability(
                content, 
                platform, 
                userSettings, 
                channelPolicy,
                moderationResult
            );

            if (platformDecision.approved) {
                federationDecision.approvedPlatforms.push(platform);
                if (platformDecision.modifications) {
                    federationDecision.contentModifications[platform] = platformDecision.modifications;
                }
            } else {
                federationDecision.restrictions.push({
                    platform,
                    reason: platformDecision.reason
                });
            }
        }

        federationDecision.shouldFederate = federationDecision.approvedPlatforms.length > 0;
        federationDecision.reasoning.push(`Approved for ${federationDecision.approvedPlatforms.length} platforms`);

        return federationDecision;
    }

    async evaluatePlatformSuitability(content, platform, userSettings, channelPolicy, moderationResult) {
        const platformCaps = this.platformCapabilities.get(platform);
        if (!platformCaps) {
            return { approved: false, reason: 'Unknown platform' };
        }

        // Check user platform preferences
        const userPlatformSettings = userSettings.platform_preferences[platform];
        if (userPlatformSettings?.enabled === false) {
            return { approved: false, reason: 'User disabled this platform' };
        }

        // Check channel platform allowlist
        if (!channelPolicy.allowed_platforms.includes(platform)) {
            return { approved: false, reason: 'Platform not allowed by channel policy' };
        }

        // Content type compatibility
        if (!this.isContentTypeSupported(content, platformCaps)) {
            return { approved: false, reason: 'Content type not supported' };
        }

        // Content modifications needed
        const modifications = this.calculateContentModifications(content, platformCaps, userPlatformSettings);

        // Privacy level check
        const privacyCompatible = this.checkPrivacyCompatibility(
            content.privacy || 'public',
            platformCaps.privacyLevels,
            userPlatformSettings?.privacy_level
        );

        if (!privacyCompatible) {
            return { approved: false, reason: 'Privacy requirements not met' };
        }

        // Legal and jurisdiction compliance
        const complianceCheck = await this.checkJurisdictionCompliance(content, platform);
        if (!complianceCheck.compliant) {
            return { approved: false, reason: complianceCheck.reason };
        }

        return {
            approved: true,
            modifications,
            privacy_level: privacyCompatible.level,
            compliance: complianceCheck
        };
    }

    getCompatiblePlatforms(content, requestedPlatforms) {
        const allPlatforms = Array.from(this.platformCapabilities.keys());
        const targetPlatforms = requestedPlatforms || allPlatforms;

        return targetPlatforms.filter(platform => {
            const caps = this.platformCapabilities.get(platform);
            return caps && this.isContentTypeSupported(content, caps);
        });
    }

    isContentTypeSupported(content, platformCaps) {
        // Check text content
        if (content.text && content.text.length > platformCaps.maxTextLength) {
            return false;
        }

        // Check media content
        if (content.media) {
            for (const media of content.media) {
                if (media.type === 'image' && !platformCaps.imageFormats.includes(media.format)) {
                    return false;
                }
                if (media.type === 'video' && !platformCaps.videoFormats.includes(media.format)) {
                    return false;
                }
            }
        }

        return true;
    }

    calculateContentModifications(content, platformCaps, userSettings) {
        const modifications = {};

        // Text truncation
        if (content.text && content.text.length > platformCaps.maxTextLength) {
            modifications.text = content.text.substring(0, platformCaps.maxTextLength - 3) + '...';
            modifications.truncated = true;
        }

        // Media format conversion
        if (content.media) {
            modifications.media = content.media.map(media => {
                if (media.type === 'image' && !platformCaps.imageFormats.includes(media.format)) {
                    return { ...media, format: platformCaps.imageFormats[0], converted: true };
                }
                if (media.type === 'video' && platformCaps.videoFormats.length === 0) {
                    return null; // Remove video if not supported
                }
                return media;
            }).filter(Boolean);
        }

        // Rich text handling
        if (content.richText && !platformCaps.supportsRichText) {
            modifications.text = this.stripRichTextFormatting(content.richText);
            modifications.richTextStripped = true;
        }

        // Identity protection
        if (userSettings?.identity_protection === 'full_anonymity') {
            modifications.author = 'Anonymous Relay User';
            modifications.author_avatar = null;
            modifications.anonymized = true;
        } else if (userSettings?.identity_protection === 'pseudonym') {
            modifications.author = userSettings.platform_pseudonym || 'Relay User';
            modifications.pseudonymized = true;
        }

        return Object.keys(modifications).length > 0 ? modifications : null;
    }

    checkPrivacyCompatibility(contentPrivacy, platformPrivacyLevels, userPreference) {
        const preferredLevel = userPreference || contentPrivacy;
        
        if (platformPrivacyLevels.includes(preferredLevel)) {
            return { compatible: true, level: preferredLevel };
        }

        // Find closest compatible privacy level
        const privacyHierarchy = ['public', 'unlisted', 'followers', 'direct'];
        const contentIndex = privacyHierarchy.indexOf(preferredLevel);
        
        for (let i = contentIndex; i < privacyHierarchy.length; i++) {
            if (platformPrivacyLevels.includes(privacyHierarchy[i])) {
                return { compatible: true, level: privacyHierarchy[i] };
            }
        }

        return { compatible: false };
    }

    async checkJurisdictionCompliance(content, platform) {
        // Implement jurisdiction-specific compliance checks
        const compliance = {
            compliant: true,
            checks: [],
            restrictions: []
        };

        // GDPR compliance for EU platforms
        if (this.isEUPlatform(platform)) {
            const gdprCheck = await this.checkGDPRCompliance(content);
            compliance.checks.push(gdprCheck);
            if (!gdprCheck.compliant) {
                compliance.compliant = false;
                compliance.restrictions.push('GDPR non-compliance');
            }
        }

        // Content moderation laws
        if (content.type === 'political' || content.type === 'governance') {
            const politicalCheck = await this.checkPoliticalContentLaws(content, platform);
            compliance.checks.push(politicalCheck);
            if (!politicalCheck.compliant) {
                compliance.compliant = false;
                compliance.restrictions.push('Political content restrictions');
            }
        }

        return compliance;
    }

    isEUPlatform(platform) {
        // Determine if platform operates under EU jurisdiction
        const euPlatforms = ['mastodon']; // Many Mastodon instances are EU-based
        return euPlatforms.includes(platform);
    }

    async checkGDPRCompliance(content) {
        // Simplified GDPR compliance check
        return {
            compliant: !this.containsPersonalData(content),
            reason: this.containsPersonalData(content) ? 'Contains personal data without consent' : 'No personal data detected'
        };
    }

    containsPersonalData(content) {
        // Simple heuristic for personal data detection
        const personalDataPatterns = [
            /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email pattern
            /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/ // Credit card pattern
        ];

        return personalDataPatterns.some(pattern => pattern.test(content.text || ''));
    }

    async checkPoliticalContentLaws(content, platform) {
        // Check platform-specific political content regulations
        return { compliant: true, reason: 'No restrictions detected' };
    }

    stripRichTextFormatting(richText) {
        // Convert rich text to plain text
        return richText
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold
            .replace(/\*(.*?)\*/g, '$1') // Remove markdown italic
            .replace(/`(.*?)`/g, '$1'); // Remove markdown code
    }

    // Per-post visibility toggle implementation
    async setPostVisibility(postId, authorId, visibilitySettings) {
        const settings = {
            post_id: postId,
            author_id: authorId,
            federation_enabled: visibilitySettings.federation !== false,
            platform_specific: visibilitySettings.platforms || {},
            privacy_level: visibilitySettings.privacy || 'public',
            expiration: visibilitySettings.expiration || null,
            updated_at: Date.now()
        };

        // Store in post-specific visibility database
        await this.storePostVisibility(postId, settings);

        // If visibility changed, trigger federation update
        if (settings.federation_enabled) {
            await this.triggerFederationUpdate(postId, settings);
        } else {
            await this.triggerFederationRemoval(postId);
        }

        this.emit('post-visibility-updated', { postId, settings });
        return settings;
    }

    async storePostVisibility(postId, settings) {
        // Store in persistent storage (would be database in production)
        console.log(`📝 Stored visibility settings for post ${postId}:`, settings);
    }

    async triggerFederationUpdate(postId, settings) {
        // Update federated content across platforms
        console.log(`🔄 Updating federation for post ${postId}`);
        this.emit('federation-update-required', { postId, settings });
    }

    async triggerFederationRemoval(postId) {
        // Remove content from federated platforms
        console.log(`🗑️ Removing post ${postId} from federation`);
        this.emit('federation-removal-required', { postId });
    }

    // Get federation analytics and insights
    getFederationAnalytics() {
        return {
            total_users_with_federation: this.userSettings.size,
            platform_adoption: this.calculatePlatformAdoption(),
            content_success_rate: this.calculateContentSuccessRate(),
            moderation_sync_effectiveness: this.calculateModerationEffectiveness(),
            user_satisfaction: this.calculateUserSatisfaction()
        };
    }

    calculatePlatformAdoption() {
        const adoption = {};
        for (const platform of this.platformCapabilities.keys()) {
            let enabledCount = 0;
            for (const userSettings of this.userSettings.values()) {
                if (userSettings.platform_preferences[platform]?.enabled !== false) {
                    enabledCount++;
                }
            }
            adoption[platform] = {
                enabled_users: enabledCount,
                adoption_rate: this.userSettings.size > 0 ? (enabledCount / this.userSettings.size) * 100 : 0
            };
        }
        return adoption;
    }

    calculateContentSuccessRate() {
        // Would track successful vs failed federation attempts
        return 85.7; // Placeholder
    }

    calculateModerationEffectiveness() {
        // Would track moderation sync success across platforms
        return 92.3; // Placeholder
    }

    calculateUserSatisfaction() {
        // Would track user feedback on federation experience
        return 78.9; // Placeholder
    }
}

// Content Moderation Pipeline for Federation
export class ContentModerationPipeline {
    constructor() {
        this.filters = [
            new SafetyFilter(),
            new SpamFilter(),
            new MisinformationFilter(),
            new LegalComplianceFilter()
        ];
    }

    async analyzeContent(content) {
        const results = {
            risk: 'low',
            flags: [],
            modifications_required: [],
            platform_restrictions: []
        };

        for (const filter of this.filters) {
            const filterResult = await filter.analyze(content);
            
            if (filterResult.risk === 'high') {
                results.risk = 'high';
            } else if (filterResult.risk === 'medium' && results.risk === 'low') {
                results.risk = 'medium';
            }

            results.flags.push(...filterResult.flags);
            results.modifications_required.push(...filterResult.modifications);
            results.platform_restrictions.push(...filterResult.platform_restrictions);
        }

        return results;
    }
}

// Individual filter implementations
class SafetyFilter {
    async analyze(content) {
        // Implement safety analysis
        return {
            risk: 'low',
            flags: [],
            modifications: [],
            platform_restrictions: []
        };
    }
}

class SpamFilter {
    async analyze(content) {
        // Implement spam detection
        return {
            risk: 'low',
            flags: [],
            modifications: [],
            platform_restrictions: []
        };
    }
}

class MisinformationFilter {
    async analyze(content) {
        // Implement misinformation detection
        return {
            risk: 'low',
            flags: [],
            modifications: [],
            platform_restrictions: []
        };
    }
}

class LegalComplianceFilter {
    async analyze(content) {
        // Implement legal compliance checking
        return {
            risk: 'low',
            flags: [],
            modifications: [],
            platform_restrictions: []
        };
    }
}

// Usage example
export async function initializeFederationController(config) {
    const controller = new FederationContentController(config);
    
    // Set up event listeners
    controller.on('user-settings-updated', (event) => {
        console.log('🔧 User federation settings updated:', event);
    });

    controller.on('post-visibility-updated', (event) => {
        console.log('👁️ Post visibility updated:', event);
    });

    controller.on('federation-update-required', (event) => {
        console.log('🔄 Federation update required:', event);
    });

    return controller;
}
