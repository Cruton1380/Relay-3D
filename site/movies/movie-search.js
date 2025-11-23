import {queryAllHybrid} from './plugin/query_tmdb.js';

class MovieSearch extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        this._debounce = null;
        this._page = 1;
        this._filterText = '';
        this._onInput = this._onInput.bind(this);
        this._onRefresh = this._onRefresh.bind(this);
        this._currentRun = 0;
    }

    connectedCallback() {

        this.shadowRoot.innerHTML = `
      <div class="searchbar">
        <input type="search" placeholder="Search movies (title or year)" aria-label="Search movies" />
      </div>
      <div class="results" aria-live="polite"></div>
      <div class="pager">
        <button id="prev">Prev</button>
        <span id="page">1</span>
        <button id="next">Next</button>
      </div>
    `;
        this.$input = this.shadowRoot.querySelector('input[type="search"]');
        this.$results = this.shadowRoot.querySelector('.results');
        this.$prev = this.shadowRoot.querySelector('#prev');
        this.$next = this.shadowRoot.querySelector('#next');
        this.$page = this.shadowRoot.querySelector('#page');
        this.$input.addEventListener('input', this._onInput);
        this.$prev.addEventListener('click', () => {
            if (this._page > 1) {
                this._page--;
                this._query();
            }
        });
        this.$next.addEventListener('click', () => {
            this._page++;
            this._query();
        });
        this.addEventListener('movie-search:refresh', this._onRefresh);
        this._query();
    }

    disconnectedCallback() {
        this.$input?.removeEventListener('input', this._onInput);
        this.removeEventListener('movie-search:refresh', this._onRefresh);
    }

    _onRefresh() {
        this._query();
    }

    _onInput(e) {
        this._filterText = e.target.value.trim();
        this._page = 1;
        clearTimeout(this._debounce);
        this._debounce = setTimeout(() => this._query(), 200);
    }

    _branch() {
        const meta = document.querySelector('meta[name="relay-branch"]');
        return meta?.getAttribute('content') || 'main';
    }

    _buildFilter() {
        // Server supports queryPolicy on title(eq,in), release_year(eq,gte,lte), genre(contains)
        // We will send minimal filters and do client-side fuzzy match for title substring.
        const f = {};
        const t = this._filterText;
        if (!t) return f;
        const year = (t.match(/\b(19\d{2}|20\d{2})\b/) || [])[0];
        if (year) f.release_year = {eq: parseInt(year, 10)};
        // For title, use eq if there are quotes, otherwise leave to client-side contains
        if (t.startsWith('"') && t.endsWith('"') && t.length > 2) {
            f.title = {eq: t.slice(1, -1)};
        }
        return f;
    }

    async _query() {
        const branch = this._branch();
        const run = ++this._currentRun;
        this.$page.textContent = String(this._page);
        this.$results.innerHTML = `<div class="empty">Searching…</div>`;
        const onPartial = (_src, _res) => {
            if (run !== this._currentRun) return; // stale
            this._render(_res.rows || []);
        };
        try {
            const res = await queryAllHybrid({
                text: this._filterText,
                page: this._page - 1,
                limit: 25,
                branch
            }, onPartial);
            if (run !== this._currentRun) return;
            // Client-side contains when unquoted
            const t = this._filterText.replace(/\"/g, '').toLowerCase();
            let items = res.rows || [];
            if (t && !(this._filterText.startsWith('"') && this._filterText.endsWith('"'))) {
                items = items.filter(it => String(it.title || '').toLowerCase().includes(t) || String(it.release_year || '') === t);
            }
            this._render(items);
        } catch (e) {
            console.error(e);
            if (run !== this._currentRun) return;
            this.$results.innerHTML = `<div class="empty">Query error.</div>`;
        }
    }

    _render(items) {
        this.$page.textContent = String(this._page);
        if (!items.length) {
            this.$results.innerHTML = `<div class="empty">No results.</div>`;
            return;
        }
        const html = items.map(it => {
            const title = it.title ?? '(untitled)';
            const year = it.release_year ?? '';
            const genres = Array.isArray(it.genre) ? it.genre.join(', ') : '';
            const dir = it.meta_dir || it._meta_dir || '';
            const source = it.source || (dir ? 'local' : 'tmdb');
            const dataId = it.id ? String(it.id) : (dir || `${title}::${year}`);
            return `
        <div class="item" data-source="${source}" data-id="${encodeURIComponent(dataId)}" data-dir="${dir}">
          <div class="row1"><strong>${title}</strong> ${year ? `(${year})` : ''} <span class="badge badge-${source}">${source}</span></div>
          ${genres ? `<div class="meta">${genres}</div>` : ''}
          ${dir ? `<div class="meta"><a href="/${dir}" target="_blank">/${dir}</a></div>` : ''}
        </div>`;
        }).join('');
        this.$results.innerHTML = html;
        // Click handlers to open viewer tabs
        this.$results.querySelectorAll('.item').forEach(el => {
            el.addEventListener('click', () => {
                const source = el.getAttribute('data-source') || 'local';
                const id = decodeURIComponent(el.getAttribute('data-id') || '');
                const meta_dir = el.getAttribute('data-dir') || '';
                const payload = {source, id, meta_dir};
                this.dispatchEvent(new CustomEvent('movie-search:open', {
                    detail: payload,
                    bubbles: true,
                    composed: true
                }));
            });
        });
    }
}

customElements.define('movie-search', MovieSearch);
