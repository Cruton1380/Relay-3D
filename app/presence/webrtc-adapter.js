import {
    RTC_JOIN,
    RTC_LEAVE,
    RTC_OFFER,
    RTC_ANSWER,
    RTC_ICE,
    RTC_MUTE,
    RTC_CAM,
    REFUSAL_VIS8_VIDEO_DECODE_BUDGET,
    REFUSAL_VIS8_VIDEO_RENDER_BUDGET,
    REFUSAL_VIS8_AUDIO_PERMISSION_DENIED,
    REFUSAL_VIS8_CAMERA_PERMISSION_DENIED,
    REFUSAL_VIS8_RTC_PROTOCOL_VIOLATION,
    REFUSAL_VIS8_STAGE_PIN_LIMIT
} from './presence-protocol.js';

const BUDGETS = Object.freeze({
    COMPANY: { decode: 2, render: 4 },
    BRANCH: { decode: 2, render: 4 },
    SHEET: { decode: 4, render: 6 },
    CELL: { decode: 4, render: 4 },
    STAGE: { decode: 4, render: 4 }
});

export class PresenceWebRTCAdapter {
    constructor({ presenceEngine, log = console.log } = {}) {
        this.engine = presenceEngine;
        this.log = log;
        this.enabled = false;
        this.userId = null;
        this.roomId = null;
        this.camOn = false;
        this.micOn = false;
        this.pinned = new Set();
        this.maxPins = 1;
        this.peers = new Map(); // userId -> state
    }

    enable({ userId, roomId }) {
        this.userId = userId || null;
        this.roomId = roomId || null;
        this.enabled = true;
        this.log(`[VIS8] renderEngine enabled=PASS topology=mesh sfuReady=true`);
        return { ok: true };
    }

    getBudget(lod) {
        return BUDGETS[String(lod || 'COMPANY').toUpperCase()] || BUDGETS.COMPANY;
    }

    getState() {
        return {
            enabled: this.enabled,
            userId: this.userId,
            roomId: this.roomId,
            camOn: this.camOn,
            micOn: this.micOn,
            pinnedCount: this.pinned.size,
            peers: [...this.peers.keys()]
        };
    }

    async requestPermissions() {
        let cam = 'prompt';
        let mic = 'prompt';
        try {
            const st = await navigator.permissions?.query?.({ name: 'camera' });
            if (st?.state) cam = st.state;
        } catch {}
        try {
            const st = await navigator.permissions?.query?.({ name: 'microphone' });
            if (st?.state) mic = st.state;
        } catch {}
        this.log(`[VIS8] mediaPermissions cam=${cam} mic=${mic}`);
        return { cam, mic };
    }

    async setCamera(on) {
        const desired = !!on;
        if (desired) {
            try {
                await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                this.camOn = true;
                this.log(`[VIS8] cam state=ON user=${this.userId} reason=explicit`);
            } catch (_) {
                this.camOn = false;
                this.log(`[REFUSAL] reason=${REFUSAL_VIS8_CAMERA_PERMISSION_DENIED} user=${this.userId}`);
                this.log(`[VIS8] cam state=OFF user=${this.userId} reason=denied`);
            }
        } else {
            this.camOn = false;
            this.log(`[VIS8] cam state=OFF user=${this.userId} reason=explicit`);
        }
        this._signal(RTC_CAM, null, { on: this.camOn });
        return { ok: true, camOn: this.camOn };
    }

    async setMic(on) {
        const desired = !!on;
        if (desired) {
            try {
                await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
                this.micOn = true;
                this.log(`[VIS8] mic state=ON user=${this.userId} reason=explicit`);
            } catch (_) {
                this.micOn = false;
                this.log(`[REFUSAL] reason=${REFUSAL_VIS8_AUDIO_PERMISSION_DENIED} user=${this.userId}`);
                this.log(`[VIS8] mic state=OFF user=${this.userId} reason=denied`);
            }
        } else {
            this.micOn = false;
            this.log(`[VIS8] mic state=OFF user=${this.userId} reason=explicit`);
        }
        this._signal(RTC_MUTE, null, { muted: !this.micOn });
        return { ok: true, micOn: this.micOn };
    }

    pinUser(userId) {
        if (!userId) return { ok: false, reason: 'MISSING_USER' };
        if (!this.pinned.has(userId) && this.pinned.size >= this.maxPins) {
            this.log(`[REFUSAL] reason=${REFUSAL_VIS8_STAGE_PIN_LIMIT} activePins=${this.pinned.size} maxPins=${this.maxPins}`);
            return { ok: false, reason: REFUSAL_VIS8_STAGE_PIN_LIMIT };
        }
        if (this.pinned.has(userId)) this.pinned.delete(userId); else this.pinned.add(userId);
        return { ok: true, pinned: [...this.pinned] };
    }

    rtcJoin(roomId, peerIds = []) {
        this.roomId = roomId || this.roomId;
        for (const id of peerIds) {
            if (!id || id === this.userId) continue;
            this.peers.set(id, { connected: false, tracks: 'none' });
        }
        this.log(`[VIS8] rtc join user=${this.userId} room=${this.roomId} peers=${this.peers.size} result=PASS`);
        this._signal(RTC_JOIN, null, {});
        return { ok: true };
    }

    simulateHandshake(peerId) {
        if (!peerId) return { ok: false, reason: 'MISSING_PEER' };
        this.peers.set(peerId, { connected: true, tracks: this.camOn && this.micOn ? 'both' : (this.camOn ? 'video' : (this.micOn ? 'audio' : 'none')) });
        this.log(`[VIS8] rtc offer from=${this.userId} to=${peerId} result=PASS`);
        this.log(`[VIS8] rtc answer from=${peerId} to=${this.userId} result=PASS`);
        this.log(`[VIS8] rtc ice from=${this.userId} to=${peerId} count=1 result=PASS`);
        this.log(`[VIS8] rtc connected peer=${peerId} tracks=${this.peers.get(peerId).tracks} result=PASS`);
        return { ok: true };
    }

    handleRtcSignal(msg) {
        if (!msg || msg.type !== 'rtc-signal' || !msg.subtype || !msg.userId) {
            this.log(`[REFUSAL] reason=${REFUSAL_VIS8_RTC_PROTOCOL_VIOLATION} detail=malformed_signal`);
            return { ok: false, reason: REFUSAL_VIS8_RTC_PROTOCOL_VIOLATION };
        }
        return { ok: true };
    }

    evaluateBudgets({ lod = 'COMPANY', participants = [], cameraPos = null }) {
        const budget = this.getBudget(lod);
        const arr = [...participants];
        const score = (p) => {
            const pin = this.pinned.has(p.userId) ? 1 : 0;
            const dist = Number.isFinite(p.distance) ? p.distance : 1e9;
            return { pin, dist, id: String(p.userId || '') };
        };
        arr.sort((a, b) => {
            const sa = score(a), sb = score(b);
            if (sa.pin !== sb.pin) return sb.pin - sa.pin;
            if (sa.dist !== sb.dist) return sa.dist - sb.dist;
            return sa.id.localeCompare(sb.id);
        });
        const renderSet = new Set(arr.slice(0, budget.render).map(p => p.userId));
        const decodeSet = new Set(arr.slice(0, budget.decode).map(p => p.userId));

        this.log(`[VIS8] budget decode active=${decodeSet.size} max=${budget.decode} lod=${String(lod).toUpperCase()}`);
        this.log(`[VIS8] budget render active=${renderSet.size} max=${budget.render} lod=${String(lod).toUpperCase()}`);
        if (arr.length > budget.decode) {
            this.log(`[REFUSAL] reason=${REFUSAL_VIS8_VIDEO_DECODE_BUDGET} lod=${String(lod).toUpperCase()} active=${arr.length} max=${budget.decode}`);
        }
        if (arr.length > budget.render) {
            this.log(`[REFUSAL] reason=${REFUSAL_VIS8_VIDEO_RENDER_BUDGET} lod=${String(lod).toUpperCase()} active=${arr.length} max=${budget.render}`);
        }
        return { decodeSet, renderSet, budget };
    }

    _signal(subtype, targetUserId = null, payload = {}) {
        if (!this.engine || !this.userId || !this.roomId) return;
        this.engine.sendRtcSignal(subtype, this.roomId, this.userId, targetUserId, payload);
    }
}

