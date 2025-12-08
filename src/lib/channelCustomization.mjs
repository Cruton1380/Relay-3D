/**
 * CHANNEL CUSTOMIZATION SYSTEM
 * Provides comprehensive channel setup and parameter management interface
 */

import { EventEmitter } from 'events';
import VoteDecayParameterization from './voteDecayParameterization.mjs';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class ChannelCustomization extends EventEmitter {
  constructor() {
    super();
    this.voteDecaySystem = new VoteDecayParameterization();
    this.channelConfigurations = new Map();
    this.loadChannelConfigurations();
  }

  loadChannelConfigurations() {
    try {
      const configPath = join(__dirname, '../data/channel-configurations.json');
      if (existsSync(configPath)) {
        const configs = JSON.parse(readFileSync(configPath, 'utf8'));
        this.channelConfigurations = new Map(Object.entries(configs));
      }
    } catch (error) {
      console.warn('Failed to load channel configurations, using defaults');
    }
  }

  saveChannelConfigurations() {
    try {
      const configPath = join(__dirname, '../data/channel-configurations.json');
      const configs = Object.fromEntries(this.channelConfigurations);
      writeFileSync(configPath, JSON.stringify(configs, null, 2));
    } catch (error) {
      console.error('Failed to save channel configurations:', error);
    }
  }

  /**
   * Create comprehensive channel configuration
   */
  async createChannelConfiguration(channelId, ownerId, customizationOptions) {
    const configuration = {
      channelId,
      ownerId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      
      // Basic Channel Settings
      basic: {
        name: customizationOptions.name,
        description: customizationOptions.description,
        type: customizationOptions.type, // 'proximity', 'regional', 'global'
        visibility: customizationOptions.visibility || 'public', // 'public', 'invite-only', 'private'
        location: customizationOptions.location || null
      },

      // Vote Decay Configuration
      voteDecay: customizationOptions.voteDecay || {
        enabled: true,
        type: 'linear',
        parameters: this.voteDecaySystem.getTypeSpecificDefaults('linear')
      },

      // Governance Structure
      governance: {
        // Which parameters are controlled by whom
        ownerControlled: customizationOptions.governance?.ownerControlled || [
          'basic.name',
          'basic.description',
          'moderation.rules'
        ],
        communityVoted: customizationOptions.governance?.communityVoted || [
          'voteDecay.parameters',
          'economics.commissionRates',
          'governance.electedPositions'
        ],
        hybrid: customizationOptions.governance?.hybrid || [
          'moderation.policies',
          'content.guidelines'
        ],
        
        // Voting requirements for parameter changes
        votingRequirements: {
          stabilizationPeriod: customizationOptions.governance?.votingRequirements?.stabilizationPeriod || (7 * 24 * 60 * 60 * 1000), // 7 days
          minimumParticipation: customizationOptions.governance?.votingRequirements?.minimumParticipation || 0.25, // 25%
          consensusThreshold: customizationOptions.governance?.votingRequirements?.consensusThreshold || 0.6 // 60%
        }
      },

      // Economic Settings
      economics: {
        commissionStructure: customizationOptions.economics?.commissionStructure || {
          enabled: true,
          channelCommissionRate: 0.5, // 0.5% default
          positionAllocations: {
            'moderator': 0.4,
            'developer': 0.4,
            'community-manager': 0.2
          }
        },
        
        donationSettings: {
          minimumDonation: customizationOptions.economics?.donationSettings?.minimumDonation || 100, // sats
          maximumDonation: customizationOptions.economics?.donationSettings?.maximumDonation || 1000000, // sats
          allowAnonymous: customizationOptions.economics?.donationSettings?.allowAnonymous ?? true
        }
      },

      // Content & Moderation
      content: {
        guidelines: customizationOptions.content?.guidelines || {
          allowedContentTypes: ['text', 'images', 'links', 'polls'],
          characterLimits: {
            post: 2000,
            comment: 500
          },
          mediaLimits: {
            maxFileSize: 10 * 1024 * 1024, // 10MB
            allowedFormats: ['jpg', 'png', 'gif', 'mp4', 'webm']
          }
        },

        moderation: {
          autoModeration: customizationOptions.content?.moderation?.autoModeration ?? true,
          communityModeration: customizationOptions.content?.moderation?.communityModeration ?? true,
          reportingThreshold: customizationOptions.content?.moderation?.reportingThreshold || 5,
          
          rules: customizationOptions.content?.moderation?.rules || [
            'Be respectful and civil',
            'No spam or self-promotion',
            'Stay on topic',
            'No hate speech or harassment'
          ]
        }
      },

      // Participation & Access
      participation: {
        joinRequirements: customizationOptions.participation?.joinRequirements || {
          requireInvite: false,
          requireProximity: true, // For proximity channels
          requireRegionalVerification: false, // For regional channels
          minimumAccountAge: 0, // days
          minimumTrustScore: 0.1
        },

        activeParticipationDefinition: {
          presenceRequirement: customizationOptions.participation?.activeParticipationDefinition?.presenceRequirement || 'weekly',
          activityTypes: customizationOptions.participation?.activeParticipationDefinition?.activityTypes || [
            'posting', 'commenting', 'voting', 'moderating'
          ],
          minimumActivityScore: customizationOptions.participation?.activeParticipationDefinition?.minimumActivityScore || 10
        }
      },

      // Advanced Features
      advanced: {
        // App add-ons and extensions
        enabledAddons: customizationOptions.advanced?.enabledAddons || [],
        
        // Integration settings
        integrations: customizationOptions.advanced?.integrations || {
          allowExternalBots: false,
          allowCrossPlatformSharing: true,
          enableAPIAccess: false
        },

        // Analytics and metrics
        analytics: {
          trackParticipation: customizationOptions.advanced?.analytics?.trackParticipation ?? true,
          trackVotingPatterns: customizationOptions.advanced?.analytics?.trackVotingPatterns ?? true,
          publicMetrics: customizationOptions.advanced?.analytics?.publicMetrics ?? [
            'memberCount', 'activityLevel', 'votingParticipation'
          ]
        }
      },

      // Notifications and Communications
      notifications: {
        channelUpdates: customizationOptions.notifications?.channelUpdates ?? true,
        governanceVotes: customizationOptions.notifications?.governanceVotes ?? true,
        newMemberAlerts: customizationOptions.notifications?.newMemberAlerts ?? false,
        
        frequency: customizationOptions.notifications?.frequency || 'daily', // 'immediate', 'daily', 'weekly'
        
        methods: customizationOptions.notifications?.methods || [
          'in-app', 'push'
        ]
      }
    };

    // Create vote decay configuration
    if (configuration.voteDecay.enabled) {
      await this.voteDecaySystem.createDecayConfiguration(
        channelId,
        ownerId,
        configuration.voteDecay
      );
    }

    this.channelConfigurations.set(channelId, configuration);
    this.saveChannelConfigurations();

    this.emit('channelConfigured', {
      channelId,
      ownerId,
      configuration
    });

    console.log(`[CHANNEL_CUSTOMIZATION] Created configuration for channel ${channelId}`);
    
    return configuration;
  }

  /**
   * Get channel customization interface for UI
   */
  getCustomizationInterface(channelType = 'proximity') {
    return {
      sections: [
        {
          id: 'basic',
          title: 'Basic Settings',
          description: 'Fundamental channel information',
          fields: [
            {
              id: 'name',
              type: 'text',
              label: 'Channel Name',
              required: true,
              maxLength: 50,
              placeholder: 'Enter channel name'
            },
            {
              id: 'description',
              type: 'textarea',
              label: 'Description',
              required: true,
              maxLength: 500,
              placeholder: 'Describe your channel purpose and community'
            },
            {
              id: 'visibility',
              type: 'select',
              label: 'Visibility',
              options: [
                { value: 'public', label: 'Public - Anyone can see and join' },
                { value: 'invite-only', label: 'Invite Only - Visible but requires approval' },
                { value: 'private', label: 'Private - Invitation required, not discoverable' }
              ],
              default: 'public'
            }
          ]
        },

        {
          id: 'voteDecay',
          title: 'Vote Decay Parameters',
          description: 'How voting power changes with member inactivity',
          fields: [
            {
              id: 'enabled',
              type: 'boolean',
              label: 'Enable Vote Decay',
              description: 'Members lose voting power when inactive',
              default: true
            },
            {
              id: 'inactivityThreshold',
              type: 'duration',
              label: 'Inactivity Threshold',
              description: 'Time before decay begins',
              options: [
                { value: 24 * 60 * 60 * 1000, label: '1 Day' },
                { value: 7 * 24 * 60 * 60 * 1000, label: '1 Week' },
                { value: 30 * 24 * 60 * 60 * 1000, label: '1 Month' }
              ],
              default: 7 * 24 * 60 * 60 * 1000
            },
            {
              id: 'decayType',
              type: 'select',
              label: 'Decay Type',
              options: [
                { value: 'linear', label: 'Linear - Steady decrease over time' },
                { value: 'exponential', label: 'Exponential - Gradual then rapid decline' },
                { value: 'step', label: 'Step - Discrete drops at intervals' },
                { value: 'custom', label: 'Custom - Mathematical expression' }
              ],
              default: 'linear',
              showSubfields: true
            }
          ]
        },

        {
          id: 'governance',
          title: 'Governance Structure',
          description: 'Who controls which channel parameters',
          fields: [
            {
              id: 'parameterControl',
              type: 'parameter-assignment',
              label: 'Parameter Control',
              description: 'Assign parameters to owner control, community voting, or hybrid',
              categories: ['ownerControlled', 'communityVoted', 'hybrid'],
              parameters: this.getAvailableParameters()
            },
            {
              id: 'votingRequirements',
              type: 'group',
              label: 'Community Voting Requirements',
              fields: [
                {
                  id: 'stabilizationPeriod',
                  type: 'duration',
                  label: 'Stabilization Period',
                  description: 'How long a vote must hold #1 position',
                  default: 7 * 24 * 60 * 60 * 1000
                },
                {
                  id: 'minimumParticipation',
                  type: 'percentage',
                  label: 'Minimum Participation',
                  description: 'Percentage of members who must vote',
                  default: 0.25,
                  min: 0.1,
                  max: 1.0
                }
              ]
            }
          ]
        },

        {
          id: 'economics',
          title: 'Economic Settings',
          description: 'Commission rates and fund distribution',
          fields: [
            {
              id: 'enableCommissions',
              type: 'boolean',
              label: 'Enable Channel Commissions',
              description: 'Channel receives percentage of donations',
              default: true
            },
            {
              id: 'commissionRate',
              type: 'percentage',
              label: 'Channel Commission Rate',
              description: 'Percentage of donations retained by channel',
              default: 0.005, // 0.5%
              min: 0.001,
              max: 0.05,
              step: 0.001
            },
            {
              id: 'positionAllocations',
              type: 'position-allocations',
              label: 'Position Fund Allocations',
              description: 'How channel commission is split among elected positions',
              positions: ['moderator', 'developer', 'community-manager']
            }
          ]
        },

        {
          id: 'participation',
          title: 'Participation & Access',
          description: 'Member requirements and activity definitions',
          fields: [
            {
              id: 'joinRequirements',
              type: 'group',
              label: 'Join Requirements',
              fields: [
                {
                  id: 'requireInvite',
                  type: 'boolean',
                  label: 'Require Invite',
                  default: channelType === 'private'
                },
                {
                  id: 'requireProximity',
                  type: 'boolean',
                  label: 'Require Physical Proximity',
                  default: channelType === 'proximity',
                  disabled: channelType !== 'proximity'
                },
                {
                  id: 'minimumTrustScore',
                  type: 'number',
                  label: 'Minimum Trust Score',
                  description: 'Required trust score to join',
                  default: 0.1,
                  min: 0,
                  max: 1,
                  step: 0.1
                }
              ]
            }
          ]
        },

        {
          id: 'advanced',
          title: 'Advanced Features',
          description: 'Add-ons, integrations, and analytics',
          fields: [
            {
              id: 'enabledAddons',
              type: 'addon-selector',
              label: 'Channel Add-ons',
              description: 'Community-developed extensions',
              availableAddons: this.getAvailableAddons()
            },
            {
              id: 'analytics',
              type: 'group',
              label: 'Analytics & Metrics',
              fields: [
                {
                  id: 'trackParticipation',
                  type: 'boolean',
                  label: 'Track Participation Metrics',
                  default: true
                },
                {
                  id: 'publicMetrics',
                  type: 'multi-select',
                  label: 'Public Metrics',
                  options: [
                    { value: 'memberCount', label: 'Member Count' },
                    { value: 'activityLevel', label: 'Activity Level' },
                    { value: 'votingParticipation', label: 'Voting Participation' },
                    { value: 'contentVolume', label: 'Content Volume' }
                  ],
                  default: ['memberCount', 'activityLevel']
                }
              ]
            }
          ]
        }
      ],

      governance: {
        title: 'Parameter Governance Setup',
        description: 'Choose how each channel parameter can be changed over time',
        options: [
          {
            id: 'ownerControlled',
            title: 'Owner Controlled',
            description: 'Channel owner can change these parameters at any time',
            icon: '👑',
            color: '#ff6b6b'
          },
          {
            id: 'communityVoted',
            title: 'Community Voted',
            description: 'Parameters can only be changed through community voting',
            icon: '🗳️',
            color: '#4ecdc4'
          },
          {
            id: 'hybrid',
            title: 'Hybrid Control',
            description: 'Owner sets initial values, community can vote to override',
            icon: '⚖️',
            color: '#45b7d1'
          }
        ]
      },

      decayVisualization: {
        title: 'Vote Decay Preview',
        description: 'See how voting power changes over time with your settings'
      }
    };
  }

  /**
   * Get available parameters for governance assignment
   */
  getAvailableParameters() {
    return [
      {
        category: 'Basic Settings',
        parameters: [
          { id: 'basic.name', label: 'Channel Name', recommended: 'ownerControlled' },
          { id: 'basic.description', label: 'Channel Description', recommended: 'ownerControlled' },
          { id: 'basic.visibility', label: 'Channel Visibility', recommended: 'communityVoted' }
        ]
      },
      {
        category: 'Vote Decay',
        parameters: [
          { id: 'voteDecay.type', label: 'Decay Type', recommended: 'communityVoted' },
          { id: 'voteDecay.inactivityThreshold', label: 'Inactivity Threshold', recommended: 'communityVoted' },
          { id: 'voteDecay.parameters', label: 'Decay Parameters', recommended: 'communityVoted' }
        ]
      },
      {
        category: 'Economics',
        parameters: [
          { id: 'economics.commissionRate', label: 'Commission Rate', recommended: 'communityVoted' },
          { id: 'economics.positionAllocations', label: 'Position Allocations', recommended: 'communityVoted' },
          { id: 'economics.donationLimits', label: 'Donation Limits', recommended: 'hybrid' }
        ]
      },
      {
        category: 'Governance',
        parameters: [
          { id: 'governance.votingRequirements', label: 'Voting Requirements', recommended: 'hybrid' },
          { id: 'governance.electedPositions', label: 'Elected Positions', recommended: 'communityVoted' }
        ]
      },
      {
        category: 'Content & Moderation',
        parameters: [
          { id: 'content.guidelines', label: 'Content Guidelines', recommended: 'hybrid' },
          { id: 'content.rules', label: 'Moderation Rules', recommended: 'ownerControlled' },
          { id: 'content.characterLimits', label: 'Character Limits', recommended: 'communityVoted' }
        ]
      }
    ];
  }

  /**
   * Get available add-ons for channels
   */
  getAvailableAddons() {
    return [
      {
        id: 'poll-creator',
        name: 'Advanced Poll Creator',
        description: 'Create polls with multiple question types and ranking options',
        category: 'voting',
        version: '1.2.0',
        author: 'Relay Community',
        verified: true
      },
      {
        id: 'event-scheduler',
        name: 'Event Scheduler',
        description: 'Schedule and manage community events with RSVP',
        category: 'organization',
        version: '2.1.0',
        author: 'EventFlow Team',
        verified: true
      },
      {
        id: 'content-analytics',
        name: 'Content Analytics Dashboard',
        description: 'Advanced analytics for channel engagement and growth',
        category: 'analytics',
        version: '1.0.5',
        author: 'DataViz Pro',
        verified: false
      },
      {
        id: 'reputation-tracker',
        name: 'Reputation Tracker',
        description: 'Track and display member reputation scores',
        category: 'moderation',
        version: '1.4.2',
        author: 'Relay Community',
        verified: true
      }
    ];
  }

  /**
   * Preview configuration changes
   */
  async previewConfiguration(channelId, ownerId, changes) {
    const currentConfig = this.channelConfigurations.get(channelId) || {};
    
    // Merge changes with current configuration
    const previewConfig = this.deepMerge(currentConfig, changes);
    
    // Generate preview data
    const preview = {
      configuration: previewConfig,
      changes: this.getConfigurationDiff(currentConfig, previewConfig),
      
      // Preview vote decay if changed
      voteDecayPreview: null,
      
      // Economic impact
      economicImpact: this.calculateEconomicImpact(currentConfig, previewConfig),
      
      // Governance changes
      governanceChanges: this.getGovernanceChanges(currentConfig, previewConfig)
    };

    // Generate vote decay visualization if decay settings changed
    if (changes.voteDecay) {
      preview.voteDecayPreview = this.voteDecaySystem.generateDecayVisualization(
        `preview-${channelId}`,
        90 // 90 days
      );
    }

    return preview;
  }

  /**
   * Apply configuration changes (with governance validation)
   */
  async applyConfigurationChanges(channelId, userId, changes) {
    const currentConfig = this.channelConfigurations.get(channelId);
    if (!currentConfig) {
      throw new Error('Channel configuration not found');
    }

    // Validate permissions for each change
    const permissionChecks = await this.validateChangePermissions(currentConfig, userId, changes);
    if (!permissionChecks.valid) {
      throw new Error(`Permission denied: ${permissionChecks.errors.join(', ')}`);
    }

    // Apply changes
    const updatedConfig = this.deepMerge(currentConfig, changes);
    updatedConfig.updatedAt = Date.now();

    this.channelConfigurations.set(channelId, updatedConfig);
    this.saveChannelConfigurations();

    // Update vote decay configuration if changed
    if (changes.voteDecay) {
      await this.voteDecaySystem.updateDecayConfiguration(
        channelId,
        userId,
        changes.voteDecay
      );
    }

    this.emit('configurationChanged', {
      channelId,
      userId,
      changes,
      newConfiguration: updatedConfig
    });

    return updatedConfig;
  }

  /**
   * Validate permissions for configuration changes
   */
  async validateChangePermissions(config, userId, changes) {
    const errors = [];
    const parameterPaths = this.flattenChanges(changes);

    for (const parameterPath of parameterPaths) {
      const canChange = await this.canChangeParameter(config, userId, parameterPath);
      if (!canChange) {
        errors.push(`Cannot change ${parameterPath}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if user can change a specific parameter
   */
  async canChangeParameter(config, userId, parameterPath) {
    // Owner can change owner-controlled parameters
    if (config.ownerId === userId && config.governance.ownerControlled.includes(parameterPath)) {
      return true;
    }

    // Community-voted parameters require active vote
    if (config.governance.communityVoted.includes(parameterPath)) {
      return await this.checkActiveVote(config.channelId, parameterPath);
    }

    // Hybrid parameters - owner can change, or community can vote to override
    if (config.governance.hybrid.includes(parameterPath)) {
      return config.ownerId === userId || await this.checkActiveVote(config.channelId, parameterPath);
    }

    return false;
  }

  /**
   * Check if there's an active community vote for parameter change
   */
  async checkActiveVote(channelId, parameterPath) {
    // Simplified implementation - integrate with main voting system in production
    console.log(`[CHANNEL_CUSTOMIZATION] Checking active vote for ${parameterPath} in ${channelId}`);
    return false; // Default to false until proper integration
  }

  /**
   * Helper methods
   */
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  flattenChanges(changes, prefix = '') {
    const paths = [];
    
    for (const [key, value] of Object.entries(changes)) {
      const path = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        paths.push(...this.flattenChanges(value, path));
      } else {
        paths.push(path);
      }
    }
    
    return paths;
  }

  getConfigurationDiff(oldConfig, newConfig) {
    // Implementation for configuration diffing
    return {
      added: [],
      modified: [],
      removed: []
    };
  }

  calculateEconomicImpact(oldConfig, newConfig) {
    // Implementation for economic impact calculation
    return {
      commissionRateChange: 0,
      expectedImpact: 'neutral'
    };
  }

  getGovernanceChanges(oldConfig, newConfig) {
    // Implementation for governance change analysis
    return {
      parameterControlChanges: [],
      votingRequirementChanges: []
    };
  }

  /**
   * Get channel configuration
   */
  getChannelConfiguration(channelId) {
    return this.channelConfigurations.get(channelId);
  }

  /**
   * Get vote power for a user in a channel
   */
  getUserVotePower(channelId, userId, lastActivityTime) {
    const config = this.channelConfigurations.get(channelId);
    if (!config || !config.voteDecay.enabled) {
      return 1.0;
    }

    return this.voteDecaySystem.calculateVotePower(channelId, userId, lastActivityTime);
  }
}

export default ChannelCustomization;
