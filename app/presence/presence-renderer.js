export class PresenceRenderer {
    constructor({ log = console.log, containerId = 'presenceOverlay' } = {}) {
        this.log = log;
        this.containerId = containerId;
        this.lastLodByUser = new Map();
        this.stagePinnedUserId = null;
        this._ensureDom();
    }

    _ensureDom() {
        let root = document.getElementById(this.containerId);
        if (!root) {
            root = document.createElement('div');
            root.id = this.containerId;
            root.style.position = 'fixed';
            root.style.top = '10px';
            root.style.right = '10px';
            root.style.zIndex = '1200';
            root.style.pointerEvents = 'none';
            root.style.display = 'flex';
            root.style.flexDirection = 'column';
            root.style.gap = '6px';
            document.body.appendChild(root);
        }
        this.root = root;
    }

    setPinned(userId) {
        this.stagePinnedUserId = userId || null;
    }

    render({ participants = [], lod = 'COMPANY', decodeSet = new Set(), renderSet = new Set(), camOn = false }) {
        this._ensureDom();
        this.root.innerHTML = '';
        const hasStage = !!this.stagePinnedUserId;
        for (const p of participants) {
            const uid = String(p.userId || '');
            const prev = this.lastLodByUser.get(uid) || 'dot';
            const next = hasStage && uid === this.stagePinnedUserId ? 'stage' : 'billboard';
            if (prev !== next) {
                this.log(`[VIS8] lodSwitch user=${uid} from=${prev} to=${next} trigger=${hasStage ? 'pin' : 'scope'}`);
            }
            this.lastLodByUser.set(uid, next);

            const renderVideo = renderSet.has(uid) && decodeSet.has(uid) && camOn;
            const reason = !camOn ? 'consent'
                : !renderSet.has(uid) ? 'budget'
                : !decodeSet.has(uid) ? 'budget'
                : (hasStage && uid === this.stagePinnedUserId ? 'pin' : 'distance');
            this.log(`[VIS8] renderCard user=${uid} lod=${next} video=${renderVideo ? 'on' : 'off'} reason=${reason}`);

            const card = document.createElement('div');
            card.setAttribute('data-presence-user', uid);
            card.setAttribute('data-presence-lod', next);
            card.style.pointerEvents = 'auto';
            card.style.border = '1px solid #2f4a66';
            card.style.background = renderVideo ? 'linear-gradient(135deg,#1f6fb0,#4ab5ff)' : '#1d2a36';
            card.style.color = '#cde6ff';
            card.style.padding = next === 'stage' ? '12px' : '6px';
            card.style.minWidth = next === 'stage' ? '260px' : '150px';
            card.style.fontSize = next === 'stage' ? '12px' : '10px';
            card.style.borderRadius = '6px';
            card.textContent = `${uid} · ${next} · ${renderVideo ? 'video' : 'fallback'}`;
            this.root.appendChild(card);
        }
    }
}

