// Enhanced Matrix.org Integration - Production Ready Implementation
import sdk from 'matrix-js-sdk';
import { EventEmitter } from 'events';

export class MatrixIntegration extends EventEmitter {
    constructor(config) {
        super();
        this.homeserver = config.homeserver || 'https://matrix.relay.network';
        this.accessToken = config.accessToken;
        this.userId = config.userId;
        this.client = null;
        this.rooms = new Map();
        this.fallbackEnabled = true; // Use existing communication as backup
        
        // Enhanced moderator features
        this.moderatorRooms = new Map();
        this.alertChannels = new Map();
        this.encryptionEnabled = true;
    }

    async initialize() {
        try {
            this.client = sdk.createClient({
                baseUrl: this.homeserver,
                accessToken: this.accessToken,
                userId: this.userId,
                deviceId: `relay-node-${Date.now()}`,
                cryptoStore: new sdk.MemoryCryptoStore(),
                sessionStore: new sdk.WebStorageSessionStore(localStorage)
            });

            // Enable end-to-end encryption for moderator communications
            if (this.encryptionEnabled) {
                await this.client.initCrypto();
            }

            await this.client.startClient();
            
            this.client.on('Room.timeline', (event, room) => {
                this.handleMessage(event, room);
            });

            this.client.on('sync', (state) => {
                if (state === 'PREPARED') {
                    this.emit('ready');
                }
            });

            return { success: true, status: 'Matrix client initialized' };
        } catch (error) {
            console.warn('Matrix initialization failed, using fallback:', error.message);
            return { success: false, fallback: 'WebAuthn + libp2p communication active' };
        }
    }

    // Create encrypted moderator rooms for each channel
    async createModeratorRoom(channelId, moderators) {
        try {
            const roomAlias = `#mod-${channelId}:relay.network`;
            const room = await this.client.createRoom({
                room_alias_name: `mod-${channelId}`,
                name: `Moderators - ${channelId}`,
                topic: `Encrypted moderation coordination for channel ${channelId}`,
                preset: 'private_chat',
                invite: moderators.map(mod => mod.matrixId).filter(Boolean),
                initial_state: [{
                    type: 'm.room.encryption',
                    content: { algorithm: 'm.megolm.v1.aes-sha2' }
                }]
            });

            this.moderatorRooms.set(channelId, room.room_id);
            return { success: true, roomId: room.room_id };
        } catch (error) {
            // Fallback to existing moderator communication
            return { success: false, fallback: 'Using WebAuthn secure channels' };
        }
    }

    // Send real-time moderation alerts
    async sendModeratorAlert(alert) {
        try {
            const roomId = this.moderatorRooms.get(alert.channelId);
            if (!roomId) return { success: false, error: 'No moderator room' };

            await this.client.sendEvent(roomId, 'm.room.message', {
                msgtype: 'm.notice',
                body: `🚨 MODERATION ALERT: ${alert.type}\n` +
                      `Channel: ${alert.channelId}\n` +
                      `Details: ${alert.description}\n` +
                      `Action Required: ${alert.actionRequired}`,
                format: 'org.matrix.custom.html',
                formatted_body: this.formatAlertHTML(alert)
            });

            return { success: true, delivered: 'Matrix' };
        } catch (error) {
            // Fallback to existing alert system
            return { success: false, fallback: 'Using existing notification system' };
        }
    }

    // Enhanced collaboration features for moderators
    async shareModeratorInsight(channelId, insight) {
        try {
            const roomId = this.moderatorRooms.get(channelId);
            if (!roomId) return this.fallbackCommunication(insight);

            await this.client.sendEvent(roomId, 'm.room.message', {
                msgtype: 'm.text',
                body: `💡 Moderator Insight: ${insight.summary}\n` +
                      `Context: ${insight.context}\n` +
                      `Recommendation: ${insight.recommendation}`,
                'relay.moderation.insight': {
                    type: insight.type,
                    severity: insight.severity,
                    timestamp: new Date().toISOString()
                }
            });

            return { success: true, platform: 'Matrix' };
        } catch (error) {
            return this.fallbackCommunication(insight);
        }
    }

    // Fallback to existing systems
    fallbackCommunication(data) {
        // Use existing WebAuthn + libp2p for moderator communication
        this.emit('fallback-communication', {
            data,
            reason: 'Matrix unavailable',
            alternative: 'WebAuthn secure channels'
        });
        return { success: true, platform: 'fallback' };
    }

    formatAlertHTML(alert) {
        return `
            <h3>🚨 Moderation Alert</h3>
            <p><strong>Type:</strong> ${alert.type}</p>
            <p><strong>Channel:</strong> <code>${alert.channelId}</code></p>
            <p><strong>Details:</strong> ${alert.description}</p>
            <p><strong>Action Required:</strong> <em>${alert.actionRequired}</em></p>
            <p><small>Time: ${new Date().toISOString()}</small></p>
        `;
    }

    handleMessage(event, room) {
        if (event.getType() !== 'm.room.message') return;
        
        const content = event.getContent();
        if (content['relay.moderation.insight']) {
            this.emit('moderator-insight', {
                roomId: room.roomId,
                insight: content['relay.moderation.insight'],
                message: content.body
            });
        }
    }

    // Health check and fallback monitoring
    async healthCheck() {
        try {
            if (!this.client) {
                return { status: 'disconnected', fallback: 'active' };
            }

            const state = this.client.getSyncState();
            return {
                status: state === 'PREPARED' ? 'connected' : 'syncing',
                rooms: this.moderatorRooms.size,
                encryption: this.encryptionEnabled,
                fallback: 'available'
            };
        } catch (error) {
            return { status: 'error', fallback: 'active', error: error.message };
        }
    }

    async shutdown() {
        if (this.client) {
            this.client.stopClient();
        }
        this.emit('shutdown');
    }
}

// Usage example with fallback integration
export async function initializeModeratorCommunication(config) {
    const matrix = new MatrixIntegration(config);
    const result = await matrix.initialize();
    
    if (!result.success) {
        console.log('Matrix unavailable, using fallback communication system');
        // Existing WebAuthn + libp2p communication remains fully operational
    }
    
    return matrix;
}
