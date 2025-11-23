import { getTmdbById } from './plugin/get_tmdb.js';

const MOVIE_VIEWER_CSS_PATH = '/site/movies/movie-viewer.css';

async function ensureAdoptedStylesheet(path) {
  if (!('adoptedStyleSheets' in Document.prototype)) return;
  const key = `__sheet:${path}`;
  if (document[key]) return;
  try {
    const res = await fetch(path);
    const css = res.ok ? await res.text() : '';
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    document[key] = sheet;
  } catch {}
}

class MovieViewer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._tabs = [];
  }

  connectedCallback() {
    ensureAdoptedStylesheet(MOVIE_VIEWER_CSS_PATH);
    this.shadowRoot.innerHTML = `
      <div class="viewer">
        <div class="tabs" part="tabs"></div>
        <div class="panes" part="panes"></div>
      </div>
    `;
    this.$tabs = this.shadowRoot.querySelector('.tabs');
    this.$panes = this.shadowRoot.querySelector('.panes');
    // Listen globally for open events
    this._onOpen = (ev) => {
      const det = ev.detail || {};
      if (!det || (!det.id && !det.meta_dir)) return;
      this.openMovie(det);
    };
    document.addEventListener('movie-search:open', this._onOpen);
    this.addEventListener('movie-search:open', this._onOpen);
  }

  disconnectedCallback() {
    document.removeEventListener('movie-search:open', this._onOpen);
    this.removeEventListener('movie-search:open', this._onOpen);
  }

  async openMovie({ source = 'local', id, meta_dir }) {
    const key = source === 'local' && meta_dir ? `local:${meta_dir}` : `tmdb:${id}`;
    let tab = this._tabs.find(t => t.key === key);
    if (!tab) {
      tab = { key, title: 'Loading…', source, id, meta_dir, paneId: `pane-${Math.random().toString(36).slice(2)}` };
      this._tabs.push(tab);
      this._renderTabs();
      this._renderPanes();
    }
    this._activate(key);
    // Load data
    try {
      let data = null;
      if (source === 'local' && meta_dir) {
        const headers = {};
        const meta = document.querySelector('meta[name="relay-branch"]');
        const branch = meta?.getAttribute('content') || 'main';
        headers['X-Relay-Branch'] = branch;
        const res = await fetch(`/${meta_dir.replace(/^\/+/, '')}/meta.json`, { headers });
        data = res.ok ? await res.json() : null;
        if (data) data.source = 'local';
      } else if (source === 'tmdb' && id) {
        data = await getTmdbById(id);
      }
      if (!data) throw new Error('Not found');
      tab.data = data;
      tab.title = data.title || 'Untitled';
      this._renderTabs();
      this._renderPaneContent(tab);
    } catch (e) {
      tab.title = 'Error';
      this._renderTabs();
      const pane = this.shadowRoot.getElementById(tab.paneId);
      if (pane) pane.innerHTML = `<div class="meta">Failed to load movie details.</div>`;
    }
  }

  _activate(key) {
    this._tabs.forEach(t => t.active = (t.key === key));
    this._renderTabs();
    this._renderPanes();
  }

  _close(key) {
    const idx = this._tabs.findIndex(t => t.key === key);
    if (idx >= 0) this._tabs.splice(idx, 1);
    this._renderTabs();
    this._renderPanes();
  }

  _renderTabs() {
    this.$tabs.innerHTML = this._tabs.map(t => `
      <div class="tab ${t.active ? 'active' : ''}" data-key="${t.key}">
        <span>${t.title}</span>
        <button class="close" title="Close" aria-label="Close">×</button>
      </div>
    `).join('');
    this.$tabs.querySelectorAll('.tab').forEach(el => {
      const key = el.getAttribute('data-key');
      el.addEventListener('click', (ev) => {
        if (ev.target.classList.contains('close')) return; // handled below
        this._activate(key);
      });
      el.querySelector('.close')?.addEventListener('click', (ev) => {
        ev.stopPropagation();
        this._close(key);
      });
    });
  }

  _renderPanes() {
    const existing = new Set(this._tabs.map(t => t.paneId));
    // Remove panes not in tabs
    this.$panes.querySelectorAll('.pane').forEach(p => { if (!existing.has(p.id)) p.remove(); });
    // Ensure pane for each tab
    for (const t of this._tabs) {
      let pane = this.shadowRoot.getElementById(t.paneId);
      if (!pane) {
        pane = document.createElement('div');
        pane.id = t.paneId;
        pane.className = 'pane';
        this.$panes.appendChild(pane);
      }
      pane.classList.toggle('active', !!t.active);
      if (t.data) this._renderPaneContent(t);
      else pane.innerHTML = `<div class="meta">Loading…</div>`;
    }
  }

  _renderPaneContent(tab) {
    const d = tab.data || {};
    const pane = this.shadowRoot.getElementById(tab.paneId);
    if (!pane) return;
    const title = d.title || 'Untitled';
    const year = d.release_year || d.releaseYear || '';
    const genres = Array.isArray(d.genre) ? d.genre.join(', ') : '';
    const overview = d.overview || '';
    const urlPoster = d.url_poster || d.poster || '';
    const urlBackdrop = d.url_backdrop || '';
    pane.innerHTML = `
      <div class="grid">
        <div>
          ${urlPoster ? `<img class="poster" src="${urlPoster}" alt="Poster">` : ''}
        </div>
        <div>
          <h3 class="title">${title} ${year ? `(${year})` : ''}</h3>
          ${urlBackdrop ? `<img class="backdrop" src="${urlBackdrop}" alt="Backdrop">` : ''}
          ${genres ? `<div class="meta">Genres: ${genres}</div>` : ''}
          ${overview ? `<p class="meta">${overview}</p>` : ''}
          <div class="meta">Source: ${tab.source}</div>
          ${tab.source === 'local' && tab.meta_dir ? `<div class="meta"><a href="/${tab.meta_dir}" target="_blank">/${tab.meta_dir}</a></div>` : ''}
        </div>
      </div>
    `;
  }
}

customElements.define('movie-viewer', MovieViewer);
