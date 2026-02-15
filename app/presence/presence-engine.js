/**
 * presence-engine.js
 * PRESENCE-STREAM-1 — Ephemeral presence bus: rooms, join/leave/heartbeat,
 * TTL expiry, budget enforcement, scope binding, optional WebSocket transport.
 *
 * Purely ephemeral: in-memory maps only, no localStorage, no commit boundary.
 * Degrades gracefully to local-only if no WebSocket server is available.
 *
 * Frozen contract: changes here require a new slice.
 */

import {
    MAX_ROOM_PARTICIPANTS,
    MAX_JOINED_ROOMS_PER_USER,
    TTL_MS,
    HB_MS,
    WS_DEFAULT_URL,
    MSG_JOIN,
    MSG_LEAVE,
    MSG_HB,
    MSG_BIND,
    MSG_TYPE,
    MSG_RTC_TYPE,
    REFUSAL_ROOM_CAP,
    REFUSAL_USER_ROOM_CAP,
    REFUSAL_INVALID_ROOM,
    REFUSAL_PROTOCOL_VIOLATION,
    REFUSAL_SCOPE_BIND_REFUSED,
    deriveRoomId,
    buildJoin,
    buildLeave,
    buildHeartbeat,
    buildBind,
    buildError,
    buildRtcSignal
} from './presence-protocol.js';

/**
 * @typedef {Object} PresenceRecord
 * @property {string} userId
 * @property {number} lastSeenTs
 * @property {string} effectiveScope
 * @property {string|null} scopeId
 * @property {string|null} focusId
 * @property {Object|null} ride  — { filamentId, stepIndex, timeboxId }
 * @property {number} tier — always 0 in v0
 */

/**
 * @typedef {Object} PresenceEngineConfig
 * @property {number} [ttlMs=15000]
 * @property {number} [hbMs=3000]
 * @property {number} [maxRoomParticipants=8]
 * @property {number} [maxJoinedRoomsPerUser=2]
 * @property {string} [wsUrl]
 * @property {function} [log]  — logging function (receives string)
 * @property {function} [onRoomChange] — callback(roomId, members)
 * @property {function} [onMessage] — callback(parsed message)
 */

export class PresenceEngine {
    /**
     * @param {PresenceEngineConfig} config
     */
    constructor(config = {}) {
        this.ttlMs = config.ttlMs ?? TTL_MS;
        this.hbMs = config.hbMs ?? HB_MS;
        this.maxRoomParticipants = config.maxRoomParticipants ?? MAX_ROOM_PARTICIPANTS;
        this.maxJoinedRoomsPerUser = config.maxJoinedRoomsPerUser ?? MAX_JOINED_ROOMS_PER_USER;
        this.wsUrl = config.wsUrl ?? WS_DEFAULT_URL;
        this.log = config.log || ((msg) => console.log(msg));
        this.onRoomChange = config.onRoomChange || null;
        this.onMessage = config.onMessage || null;

        /** @type {Map<string, Map<string, PresenceRecord>>} roomId → Map(userId → record) */
        this.rooms = new Map();

        /** @type {Map<string, Set<string>>} userId → Set(roomId) */
        this.userRooms = new Map();

        /** @type {WebSocket|null} */
        this.ws = null;
        this.wsState = 'disconnected'; // disconnected | connecting | connected | error

        /** @type {number|null} */
        this._hbTimer = null;
        /** @type {number|null} */
        this._ttlTimer = null;

        this._localUserId = null;
        this._enabled = false;

        // Bind state for change detection
        this._lastBind = { scopeId: null, focusId: null, rideKey: null };
    }

    // ── Lifecycle ──

    /**
     * Enable the presence engine. Sets local user ID, starts timers.
     * @param {string} userId
     * @returns {{ ok: boolean }}
     */
    enable(userId) {
        if (!userId || typeof userId !== 'string') {
            this.log(`[REFUSAL] reason=${REFUSAL_PROTOCOL_VIOLATION} detail=missing_userId`);
            return { ok: false, reason: REFUSAL_PROTOCOL_VIOLATION };
        }
        this._localUserId = userId;
        this._enabled = true;

        // Start TTL sweep timer
        this._ttlTimer = setInterval(() => this._sweepTTL(), Math.max(1000, this.ttlMs / 3));

        this.log(`[PRESENCE] engine enabled=PASS ttlMs=${this.ttlMs} hbMs=${this.hbMs}`);
        return { ok: true };
    }

    /**
     * Disable the engine. Leaves all rooms, stops timers, disconnects WS.
     */
    disable() {
        this._enabled = false;
        // Leave all rooms for local user
        if (this._localUserId) {
            const rooms = this.getUserRooms(this._localUserId);
            for (const roomId of rooms) {
                this.leave(this._localUserId, roomId, 'disable');
            }
        }
        if (this._hbTimer) { clearInterval(this._hbTimer); this._hbTimer = null; }
        if (this._ttlTimer) { clearInterval(this._ttlTimer); this._ttlTimer = null; }
        this.wsDisconnect();
        this._localUserId = null;
        this.log('[PRESENCE] engine disabled=PASS');
    }

    /**
     * Get engine status snapshot.
     */
    getStatus() {
        return {
            enabled: this._enabled,
            userId: this._localUserId,
            wsState: this.wsState,
            roomCount: this.rooms.size,
            totalMembers: [...this.rooms.values()].reduce((s, m) => s + m.size, 0)
        };
    }

    // ── Room operations ──

    /**
     * Derive a deterministic roomId from a scopeId.
     * @param {string} scopeId
     * @returns {string|null}
     */
    resolveRoomId(scopeId) {
        const roomId = deriveRoomId(scopeId);
        if (!roomId) {
            this.log(`[REFUSAL] reason=${REFUSAL_INVALID_ROOM} detail=null_scopeId`);
            return null;
        }
        this.log(`[PRESENCE] room resolve scope=${scopeId} roomId=${roomId} result=PASS`);
        return roomId;
    }

    /**
     * Join a room. Enforces budget caps.
     * @param {string} userId
     * @param {string} roomId
     * @param {Object} [scopePayload={}] — { effectiveScope, scopeId, focusId, ride }
     * @returns {{ ok: boolean, reason?: string, members?: number }}
     */
    join(userId, roomId, scopePayload = {}) {
        if (!this._enabled) return { ok: false, reason: 'ENGINE_DISABLED' };
        if (!userId || !roomId) {
            this.log(`[REFUSAL] reason=${REFUSAL_PROTOCOL_VIOLATION} detail=missing_userId_or_roomId`);
            return { ok: false, reason: REFUSAL_PROTOCOL_VIOLATION };
        }
        if (!roomId.startsWith('room.')) {
            this.log(`[REFUSAL] reason=${REFUSAL_INVALID_ROOM} detail=bad_prefix roomId=${roomId}`);
            return { ok: false, reason: REFUSAL_INVALID_ROOM };
        }

        // Budget: per-user room cap
        const userRoomSet = this.userRooms.get(userId) || new Set();
        if (!userRoomSet.has(roomId) && userRoomSet.size >= this.maxJoinedRoomsPerUser) {
            const refLine = `[REFUSAL] reason=${REFUSAL_USER_ROOM_CAP} user=${userId} activeRooms=${userRoomSet.size} max=${this.maxJoinedRoomsPerUser}`;
            this.log(refLine);
            return { ok: false, reason: REFUSAL_USER_ROOM_CAP };
        }

        // Budget: per-room participant cap
        const room = this.rooms.get(roomId) || new Map();
        if (!room.has(userId) && room.size >= this.maxRoomParticipants) {
            const refLine = `[REFUSAL] reason=${REFUSAL_ROOM_CAP} room=${roomId} active=${room.size} max=${this.maxRoomParticipants}`;
            this.log(refLine);
            return { ok: false, reason: REFUSAL_ROOM_CAP };
        }

        // Create/update presence record
        const record = {
            userId,
            lastSeenTs: Date.now(),
            effectiveScope: scopePayload.effectiveScope || null,
            scopeId: scopePayload.scopeId || null,
            focusId: scopePayload.focusId || null,
            ride: scopePayload.ride || null,
            tier: 0
        };

        room.set(userId, record);
        this.rooms.set(roomId, room);

        userRoomSet.add(roomId);
        this.userRooms.set(userId, userRoomSet);

        const memberCount = room.size;
        this.log(`[PRESENCE] join user=${userId} room=${roomId} members=${memberCount} result=PASS`);

        // Send WS message
        this._wsSend(buildJoin(roomId, userId, scopePayload));

        // Start heartbeat timer for local user
        if (userId === this._localUserId && !this._hbTimer) {
            this._hbTimer = setInterval(() => this._sendHeartbeat(), this.hbMs);
        }

        // Notify
        if (this.onRoomChange) {
            try { this.onRoomChange(roomId, this.getRoomMembers(roomId)); } catch (_) {}
        }

        return { ok: true, members: memberCount };
    }

    /**
     * Leave a room.
     * @param {string} userId
     * @param {string} roomId
     * @param {string} [reason='manual']
     * @returns {{ ok: boolean }}
     */
    leave(userId, roomId, reason = 'manual') {
        const room = this.rooms.get(roomId);
        if (room) {
            room.delete(userId);
            if (room.size === 0) {
                this.rooms.delete(roomId);
            }
        }

        const userRoomSet = this.userRooms.get(userId);
        if (userRoomSet) {
            userRoomSet.delete(roomId);
            if (userRoomSet.size === 0) {
                this.userRooms.delete(userId);
            }
        }

        this.log(`[PRESENCE] leave user=${userId} room=${roomId} reason=${reason} result=PASS`);
        this._wsSend(buildLeave(roomId, userId, reason));

        // Stop heartbeat if local user left all rooms
        if (userId === this._localUserId) {
            const remaining = this.userRooms.get(userId);
            if (!remaining || remaining.size === 0) {
                if (this._hbTimer) { clearInterval(this._hbTimer); this._hbTimer = null; }
            }
        }

        if (this.onRoomChange) {
            try { this.onRoomChange(roomId, this.getRoomMembers(roomId)); } catch (_) {}
        }

        return { ok: true };
    }

    /**
     * Process a heartbeat for a user in a room.
     * @param {string} userId
     * @param {string} roomId
     * @returns {{ ok: boolean }}
     */
    heartbeat(userId, roomId) {
        const room = this.rooms.get(roomId);
        if (!room || !room.has(userId)) {
            return { ok: false, reason: 'NOT_IN_ROOM' };
        }
        const record = room.get(userId);
        const ageMs = Date.now() - record.lastSeenTs;
        record.lastSeenTs = Date.now();
        this.log(`[PRESENCE] hb user=${userId} room=${roomId} ageMs=${ageMs} result=PASS`);
        this._wsSend(buildHeartbeat(roomId, userId));
        return { ok: true };
    }

    /**
     * Bind presence to scope/focus/ride. Only sends if state actually changed.
     * @param {Object} bindPayload — { effectiveScope, scopeId, focusId, ride }
     * @returns {{ ok: boolean, changed: boolean, cause?: string }}
     */
    bind(bindPayload = {}) {
        if (!this._enabled || !this._localUserId) return { ok: false, reason: 'ENGINE_DISABLED' };

        const { effectiveScope, scopeId, focusId, ride } = bindPayload;

        // Validate scope
        if (!scopeId) {
            this.log(`[REFUSAL] reason=${REFUSAL_SCOPE_BIND_REFUSED} detail=missing_scopeId`);
            return { ok: false, reason: REFUSAL_SCOPE_BIND_REFUSED };
        }

        // Detect what changed
        const rideKey = ride ? `${ride.filamentId}:${ride.stepIndex}:${ride.timeboxId}` : null;
        let cause = null;
        if (scopeId !== this._lastBind.scopeId) cause = 'scope';
        else if (focusId !== this._lastBind.focusId) cause = 'focus';
        else if (rideKey !== this._lastBind.rideKey) cause = 'ride';

        if (!cause) return { ok: true, changed: false }; // no change

        this._lastBind = { scopeId, focusId, rideKey };

        // Update all rooms this user is in
        const userRoomSet = this.userRooms.get(this._localUserId) || new Set();
        for (const roomId of userRoomSet) {
            const room = this.rooms.get(roomId);
            if (room && room.has(this._localUserId)) {
                const record = room.get(this._localUserId);
                record.effectiveScope = effectiveScope || record.effectiveScope;
                record.scopeId = scopeId;
                record.focusId = focusId || null;
                record.ride = ride || null;
                record.lastSeenTs = Date.now();
            }

            // Send bind message
            const payload = { effectiveScope, scopeId, focusId: focusId || null };
            if (ride) payload.ride = ride;
            this._wsSend(buildBind(roomId, this._localUserId, payload));

            this.log(`[PRESENCE] bind user=${this._localUserId} room=${roomId} scope=${scopeId} focus=${focusId || 'null'} ride=${ride ? 'on' : 'off'} result=PASS`);
        }

        this.log(`[PRESENCE] bind-change cause=${cause} result=PASS`);

        if (this.onRoomChange) {
            for (const roomId of userRoomSet) {
                try { this.onRoomChange(roomId, this.getRoomMembers(roomId)); } catch (_) {}
            }
        }

        return { ok: true, changed: true, cause };
    }

    /**
     * Event-driven context bind hook with explicit cause.
     * Used by PRESENCE-RENDER-1 to avoid tight polling loops.
     * @param {'scope'|'focus'|'ride'|'safety'} cause
     * @param {Object} bindPayload
     */
    bindFromEvent(cause, bindPayload = {}) {
        const out = this.bind(bindPayload);
        if (out?.ok && out?.changed) {
            this.log(`[PRESENCE] bind-change cause=${cause} result=PASS`);
        }
        return out;
    }

    // ── Queries ──

    /**
     * Get members of a room as an array of PresenceRecords.
     */
    getRoomMembers(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return [];
        return [...room.values()];
    }

    /**
     * Get all room IDs a user has joined.
     */
    getUserRooms(userId) {
        return [...(this.userRooms.get(userId) || new Set())];
    }

    /**
     * Get the local user's current room IDs.
     */
    getLocalRooms() {
        return this._localUserId ? this.getUserRooms(this._localUserId) : [];
    }

    /**
     * Get a snapshot of all presence state (for HUD or debugging).
     */
    snapshot() {
        const localRooms = this.getLocalRooms();
        const primaryRoom = localRooms[0] || null;
        const members = primaryRoom ? this.getRoomMembers(primaryRoom) : [];
        return {
            enabled: this._enabled,
            userId: this._localUserId,
            wsState: this.wsState,
            primaryRoomId: primaryRoom,
            memberCount: members.length,
            maxMembers: this.maxRoomParticipants,
            members,
            roomCount: localRooms.length
        };
    }

    // ── WebSocket ──

    /**
     * Connect to the WebSocket endpoint. Degrades to local-only on failure.
     * @param {string} [url]
     * @returns {{ ok: boolean }}
     */
    wsConnect(url) {
        const target = url || this.wsUrl;
        if (this.ws && (this.ws.readyState === 0 || this.ws.readyState === 1)) {
            return { ok: true, state: 'already_connected' };
        }

        this.wsState = 'connecting';
        try {
            this.ws = new WebSocket(target);
        } catch (err) {
            this.wsState = 'error';
            this.log(`[PRESENCE] ws connect url=${target} result=FAIL error=${err.message}`);
            return { ok: false, reason: 'WS_CONNECT_FAILED' };
        }

        this.ws.onopen = () => {
            this.wsState = 'connected';
            this.log(`[PRESENCE] ws connect url=${target} result=PASS`);
        };

        this.ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === MSG_TYPE) {
                    this._handleRemoteMessage(msg);
                } else if (msg.type === MSG_RTC_TYPE && this.onMessage) {
                    try { this.onMessage(msg); } catch (_) {}
                }
            } catch (_) { /* ignore malformed */ }
        };

        this.ws.onerror = () => {
            this.wsState = 'error';
        };

        this.ws.onclose = () => {
            this.wsState = 'disconnected';
            this.ws = null;
        };

        return { ok: true };
    }

    /**
     * Disconnect WebSocket.
     */
    wsDisconnect() {
        if (this.ws) {
            try { this.ws.close(); } catch (_) {}
            this.ws = null;
        }
        this.wsState = 'disconnected';
    }

    /**
     * Send rtc-signal message over the same WS connection.
     */
    sendRtcSignal(subtype, roomId, userId, targetUserId = null, payload = {}) {
        this._wsSend(buildRtcSignal(subtype, roomId, userId, targetUserId, payload));
    }

    // ── Internal ──

    /** Send a message over WS if connected; no-op otherwise. */
    _wsSend(msg) {
        if (this.ws && this.ws.readyState === 1) {
            try {
                this.ws.send(JSON.stringify(msg));
            } catch (_) { /* silent fail — local state still correct */ }
        }
    }

    /** Send heartbeat for local user in all joined rooms. */
    _sendHeartbeat() {
        if (!this._localUserId) return;
        const rooms = this.getUserRooms(this._localUserId);
        for (const roomId of rooms) {
            this.heartbeat(this._localUserId, roomId);
        }
    }

    /** Sweep all rooms for TTL-expired members. */
    _sweepTTL() {
        const now = Date.now();
        const expired = [];

        for (const [roomId, room] of this.rooms) {
            for (const [userId, record] of room) {
                const age = now - record.lastSeenTs;
                if (age > this.ttlMs) {
                    expired.push({ roomId, userId, lastSeenMs: record.lastSeenTs });
                }
            }
        }

        for (const { roomId, userId, lastSeenMs } of expired) {
            this.log(`[PRESENCE] ttl-expire user=${userId} room=${roomId} lastSeenMs=${lastSeenMs} result=PASS`);
            this.leave(userId, roomId, 'ttl');
        }
    }

    /** Handle a remote message received via WS (from another user). */
    _handleRemoteMessage(msg) {
        if (this.onMessage) {
            try { this.onMessage(msg); } catch (_) {}
        }

        // Process remote join/leave/hb/bind
        const { subtype, roomId, userId, payload } = msg;
        if (!roomId || !userId) return;

        // Don't process own echoed messages
        if (userId === this._localUserId) return;

        switch (subtype) {
            case MSG_JOIN: {
                // Remote user joined — add to local room state
                const room = this.rooms.get(roomId) || new Map();
                room.set(userId, {
                    userId,
                    lastSeenTs: msg.ts || Date.now(),
                    effectiveScope: payload?.effectiveScope || null,
                    scopeId: payload?.scopeId || null,
                    focusId: payload?.focusId || null,
                    ride: payload?.ride || null,
                    tier: 0
                });
                this.rooms.set(roomId, room);
                const urs = this.userRooms.get(userId) || new Set();
                urs.add(roomId);
                this.userRooms.set(userId, urs);
                if (this.onRoomChange) {
                    try { this.onRoomChange(roomId, this.getRoomMembers(roomId)); } catch (_) {}
                }
                break;
            }
            case MSG_LEAVE: {
                this.leave(userId, roomId, payload?.reason || 'remote');
                break;
            }
            case MSG_HB: {
                this.heartbeat(userId, roomId);
                break;
            }
            case MSG_BIND: {
                const room = this.rooms.get(roomId);
                if (room && room.has(userId)) {
                    const record = room.get(userId);
                    if (payload?.effectiveScope) record.effectiveScope = payload.effectiveScope;
                    if (payload?.scopeId) record.scopeId = payload.scopeId;
                    record.focusId = payload?.focusId ?? record.focusId;
                    record.ride = payload?.ride ?? record.ride;
                    record.lastSeenTs = msg.ts || Date.now();
                }
                if (this.onRoomChange) {
                    try { this.onRoomChange(roomId, this.getRoomMembers(roomId)); } catch (_) {}
                }
                break;
            }
        }
    }
}
