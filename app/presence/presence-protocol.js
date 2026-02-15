/**
 * presence-protocol.js
 * PRESENCE-STREAM-1 — Protocol constants, message envelope, refusal reasons.
 *
 * This file defines the wire format and budget constants for Relay's ephemeral
 * presence bus. No persistence, no schema expansion — ephemeral state only.
 *
 * Frozen contract: changes here require a new slice.
 */

// ── Budget caps ──
export const MAX_ROOM_PARTICIPANTS = 8;
export const MAX_JOINED_ROOMS_PER_USER = 2;

// ── Timing ──
export const TTL_MS = 15000;   // 15s — member expires if no heartbeat
export const HB_MS = 3000;     // 3s  — heartbeat interval

// ── WebSocket endpoint ──
export const WS_DEFAULT_URL = 'ws://127.0.0.1:4031/vis8';

// ── Message subtypes ──
export const MSG_JOIN = 'join';
export const MSG_LEAVE = 'leave';
export const MSG_HB = 'hb';
export const MSG_BIND = 'bind';
export const MSG_ERROR = 'error';
export const MSG_TYPE = 'presence';
export const MSG_RTC_TYPE = 'rtc-signal';
export const RTC_JOIN = 'join';
export const RTC_LEAVE = 'leave';
export const RTC_OFFER = 'offer';
export const RTC_ANSWER = 'answer';
export const RTC_ICE = 'ice';
export const RTC_MUTE = 'mute';
export const RTC_CAM = 'cam';

// ── Refusal reasons ──
export const REFUSAL_ROOM_CAP = 'PRESENCE_ROOM_CAP_EXCEEDED';
export const REFUSAL_USER_ROOM_CAP = 'PRESENCE_USER_ROOM_CAP_EXCEEDED';
export const REFUSAL_INVALID_ROOM = 'PRESENCE_INVALID_ROOM';
export const REFUSAL_PROTOCOL_VIOLATION = 'PRESENCE_PROTOCOL_VIOLATION';
export const REFUSAL_SCOPE_BIND_REFUSED = 'PRESENCE_SCOPE_BIND_REFUSED';
export const REFUSAL_VIS8_VIDEO_DECODE_BUDGET = 'VIS8_VIDEO_DECODE_BUDGET_EXCEEDED';
export const REFUSAL_VIS8_VIDEO_RENDER_BUDGET = 'VIS8_VIDEO_RENDER_BUDGET_EXCEEDED';
export const REFUSAL_VIS8_AUDIO_PERMISSION_DENIED = 'VIS8_AUDIO_PERMISSION_DENIED';
export const REFUSAL_VIS8_CAMERA_PERMISSION_DENIED = 'VIS8_CAMERA_PERMISSION_DENIED';
export const REFUSAL_VIS8_RTC_PROTOCOL_VIOLATION = 'VIS8_RTC_PROTOCOL_VIOLATION';
export const REFUSAL_VIS8_STAGE_PIN_LIMIT = 'VIS8_STAGE_PIN_LIMIT_EXCEEDED';

// ── PRESENCE-COMMIT-BOUNDARY-1: Call summary refusal reasons ──
export const REFUSAL_CALL_CONSENT_DENIED = 'CALL_COMMIT_CONSENT_DENIED';
export const REFUSAL_CALL_CONSENT_EXPIRED = 'CALL_COMMIT_CONSENT_EXPIRED';
export const REFUSAL_CALL_NOT_IN_ROOM = 'CALL_COMMIT_NOT_IN_ROOM';
export const REFUSAL_CALL_ROOM_EMPTY = 'CALL_COMMIT_ROOM_EMPTY';
export const REFUSAL_CALL_SCOPE_UNRESOLVED = 'CALL_COMMIT_SCOPE_UNRESOLVED';
export const REFUSAL_CALL_AUTHORITY_MISSING = 'CALL_COMMIT_AUTHORITY_MISSING';
export const REFUSAL_CALL_ALREADY_PENDING = 'CALL_COMMIT_ALREADY_PENDING';

// ── PRESENCE-COMMIT-BOUNDARY-1: Consent state machine constants ──
export const CONSENT_IDLE = 'IDLE';
export const CONSENT_REQUESTED = 'REQUESTED';
export const CONSENT_COLLECTING = 'COLLECTING';
export const CONSENT_GRANTED = 'GRANTED';
export const CONSENT_DENIED = 'DENIED';
export const CONSENT_EXPIRED = 'EXPIRED';
export const CONSENT_TTL_MS = 60000; // 60s default consent window

// ── PRESENCE-COMMIT-BOUNDARY-1: Call summary message subtype ──
export const MSG_CALL_SUMMARY = 'call-summary';

// ── Room ID derivation (deterministic, uses scopeId not just tier) ──
export function deriveRoomId(scopeId) {
    if (!scopeId || typeof scopeId !== 'string') return null;
    // FNV-1a 32-bit hash
    let h = 2166136261 >>> 0;
    for (let i = 0; i < scopeId.length; i++) {
        h ^= scopeId.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
    }
    return `room.${h.toString(16).padStart(8, '0')}`;
}

// ── Message envelope builder ──
export function buildMessage(subtype, roomId, userId, payload = {}) {
    return {
        type: MSG_TYPE,
        subtype,
        roomId: roomId || null,
        userId: userId || null,
        ts: Date.now(),
        payload
    };
}

// ── Convenience builders ──
export function buildJoin(roomId, userId, scopePayload) {
    return buildMessage(MSG_JOIN, roomId, userId, scopePayload);
}

export function buildLeave(roomId, userId, reason = 'manual') {
    return buildMessage(MSG_LEAVE, roomId, userId, { reason });
}

export function buildHeartbeat(roomId, userId) {
    return buildMessage(MSG_HB, roomId, userId, {});
}

export function buildBind(roomId, userId, bindPayload) {
    return buildMessage(MSG_BIND, roomId, userId, bindPayload);
}

export function buildError(roomId, userId, reason, detail = '') {
    return buildMessage(MSG_ERROR, roomId, userId, { reason, detail });
}

export function buildRtcSignal(subtype, roomId, userId, targetUserId = null, payload = {}) {
    return {
        type: MSG_RTC_TYPE,
        subtype,
        roomId: roomId || null,
        userId: userId || null,
        targetUserId: targetUserId || null,
        ts: Date.now(),
        payload
    };
}

// ── PRESENCE-COMMIT-BOUNDARY-1: SHA-256 hash helper (browser-native) ──
export async function sha256(text) {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        const data = new TextEncoder().encode(text);
        const buf = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // Fallback: FNV-1a 64-bit-ish for environments without SubtleCrypto
    let h = 2166136261 >>> 0;
    for (let i = 0; i < text.length; i++) {
        h ^= text.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
    }
    return `fnv-${h.toString(16).padStart(8, '0')}`;
}

export function canonicalJson(obj) {
    return JSON.stringify(obj, Object.keys(obj).sort());
}
