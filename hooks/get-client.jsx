/**
 * get-client.jsx — Repository-owned UI for GET routes
 * JSX is transpiled by RepoBrowser using @babel/standalone with classic runtime mapped to _jsx_
 */

console.log('[get-client] Module loaded')

let tmdbClient = null
let movieViewComponent = null
let createViewComponent = null
let layoutComponent = null

let genreCache = null

async function fetchTmdbCredentials() {
  try {
    const envResp = await fetch('/hooks/env.json');
    if (!envResp.ok) return null;
    const env = await envResp.json();
    return {
      apiKey: env.RELAY_PUBLIC_TMDB_API_KEY,
      bearerToken: env.RELAY_PUBLIC_TMDB_BEARER || env.RELAY_PUBLIC_TMDB_READ_ACCESS_ID,
    };
  } catch (err) {
    console.error('[getClient] Error fetching credentials:', err);
    return null;
  }
}

async function fetchGenres(apiKey, bearerToken) {
  if (genreCache) return genreCache;
  try {
    const params = new URLSearchParams({ language: 'en-US' });
    if (apiKey) params.set('api_key', apiKey);
    const url = `https://api.themoviedb.org/3/genre/movie/list?${params.toString()}`;
    const headers = {};
    if (bearerToken) headers['Authorization'] = bearerToken.startsWith('Bearer ') ? bearerToken : `Bearer ${bearerToken}`;
    const resp = await fetch(url, { headers });
    if (!resp.ok) return {};
    const data = await resp.json();
    genreCache = {};
    (data.genres || []).forEach((g) => { genreCache[g.id] = g.name; });
    return genreCache;
  } catch (err) {
    console.error('[getClient] Error fetching genres:', err);
    return {};
  }
}

async function fetchTmdbMovie(id, apiKey, bearerToken) {
  const params = new URLSearchParams({ language: 'en-US' });
  if (apiKey) params.set('api_key', apiKey);
  const url = `https://api.themoviedb.org/3/movie/${id}?${params.toString()}`;
  const headers = {};
  if (bearerToken) headers['Authorization'] = bearerToken.startsWith('Bearer ') ? bearerToken : `Bearer ${bearerToken}`;
  const resp = await fetch(url, { headers });
  if (!resp.ok) return null;
  return resp.json();
}

async function searchTmdb(query, apiKey, bearerToken) {
  const params = new URLSearchParams({
    query,
    include_adult: 'false',
    language: 'en-US',
    page: '1',
  });
  if (apiKey) params.set('api_key', apiKey);
  const url = `https://api.themoviedb.org/3/search/movie?${params.toString()}`;
  const headers = {};
  if (bearerToken) headers['Authorization'] = bearerToken.startsWith('Bearer ') ? bearerToken : `Bearer ${bearerToken}`;
  const resp = await fetch(url, { headers });
  if (!resp.ok) return { items: [], total: 0, page: 1 };
  const data = await resp.json();
  const genreMap = await fetchGenres(apiKey, bearerToken);
  const items = (data.results || []).map((item) => ({
    ...item,
    source: 'tmdb',
    poster_url: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
    backdrop_url: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
    genre_names: (item.genre_ids || []).map((genreId) => genreMap[genreId]).filter(Boolean),
  }));
  return { items, total: data.total_results || 0, page: data.page || 1 };
}

export default async function getClient(ctx) {
  try {
    console.log('[get-client] Hook called with ctx:', Object.keys(ctx))
    console.log('[get-client] ctx.React:', typeof ctx.React, ctx.React?.constructor?.name)
    const { React, createElement: h, FileRenderer, Layout, params, helpers } = ctx
    console.log('[get-client] After destructure - React:', typeof React, React?.constructor?.name)
    const path = (params?.path || '/').trim()
    console.log('[get-client] path:', path)

    async function fetchOptions() {
      try {
        const resp = await fetch('/', { method: 'OPTIONS' });
        if (!resp.ok) return {};
        return await resp.json();
      } catch {
        return {};
      }
    }

    async function lazyLoadComponents() {
      if (!tmdbClient) tmdbClient = await helpers.loadModule('./lib/sources/tmdb.js');
      if (!movieViewComponent) movieViewComponent = await helpers.loadModule('./lib/components/MovieView.jsx');
      if (!createViewComponent) createViewComponent = await helpers.loadModule('./lib/components/CreateView.jsx');
      if (!layoutComponent) layoutComponent = await helpers.loadModule('./lib/components/Layout.jsx');
    }

    async function wrap(element, options) {
      console.log('[wrap] Called with element:', element?.constructor?.name, 'options:', Object.keys(options || {}))
      // Lazy load layout if not already loaded
      if (!layoutComponent && typeof helpers?.loadModule === 'function') {
        try {
          console.log('[wrap] Layout not loaded, attempting lazy load...')
          layoutComponent = await helpers.loadModule('./lib/components/Layout.jsx');
          console.log('[wrap] Layout loaded successfully')
        } catch (err) {
          console.warn('[wrap] Failed to load Layout component:', err);
        }
      }
      const LayoutComp = (layoutComponent?.default || Layout || null)
      console.log('[wrap] LayoutComp:', LayoutComp?.name)
      if (!LayoutComp) {
        console.warn('No layout was found');
        return element;
      }
      console.log('[wrap] Creating LayoutComp with props')
      // Use h() directly instead of JSX to avoid transpilation issues in blob context
      // Pass children via props, not as a separate argument
      return h(LayoutComp, { h, params, helpers, options, children: element });
    }

    // View route
    const viewMatch = path.match(/^\/view\/([^/]+)\/(\d+)$/);
    if (viewMatch) {
      const [, source, rawId] = viewMatch;
      const id = String(rawId);
      console.debug('[getClient] View route matched:', { source, id });
      if (source === 'tmdb') {
        tmdbClient = tmdbClient || (await helpers.loadModule('./lib/sources/tmdb.js'));
        if (!movieViewComponent) movieViewComponent = await helpers.loadModule('./lib/components/MovieView.jsx');
        const renderView = movieViewComponent?.renderMovieView;
        const movie = await (tmdbClient?.getFromTmdb ? tmdbClient.getFromTmdb(id) : null);
        if (!movie) {
          return await wrap(<div className="p-8 text-red-500">{`TMDB unavailable or movie not found: ${id}`}</div>, await fetchOptions());
        }
        const onBack = () => { if (helpers.navigate) helpers.navigate('/'); else if (typeof window !== 'undefined') window.history.back(); };
        const onAddToLibrary = () => { if (helpers.navigate) helpers.navigate(`/create/tmdb/${id}`); };
        const content = renderView ? renderView(h, movie, onBack, onAddToLibrary) : (
          <div className="p-4">Movie view component missing</div>
        );
        return wrap(content, await fetchOptions());
      }
      if (source === 'local') {
        return wrap(<div className="p-8 text-yellow-500">Local source view not yet implemented</div>, await fetchOptions());
      }
      return wrap(<div className="p-8 text-red-500">{`Unknown source: ${source}`}</div>, await fetchOptions());
    }

    // Create from TMDB
    const createTmdbMatch = path.match(/^\/create\/tmdb\/(\d+)$/);
    if (createTmdbMatch) {
      const id = String(createTmdbMatch[1]);
      console.debug('[getClient] Create from TMDB route matched:', { id });
      const creds = await fetchTmdbCredentials();
      if (!creds || (!creds.apiKey && !creds.bearerToken)) {
        return wrap(<div className="p-8 text-red-500">TMDB credentials not configured</div>, await fetchOptions());
      }
      const movie = await fetchTmdbMovie(id, creds.apiKey || '', creds.bearerToken || '');
      if (!movie) {
        return wrap(<div className="p-8 text-red-500">{`Movie not found: ${id}`}</div>, await fetchOptions());
      }
      const onBack = () => { if (helpers.navigate) helpers.navigate(`/view/tmdb/${id}`); else if (typeof window !== 'undefined') window.history.back(); };
      const onSubmit = async (formData) => {
        console.debug('[getClient] Create form submitted:', formData);
        alert(`Movie "${formData.title}" would be saved to library!\n\nData: ${JSON.stringify(formData, null, 2)}`);
        if (helpers.navigate) helpers.navigate('/');
      };
      if (!createViewComponent) createViewComponent = await helpers.loadModule('./lib/components/CreateView.jsx');
      const content = createViewComponent?.renderCreateView
        ? createViewComponent.renderCreateView(h, movie, onBack, onSubmit)
        : (<div className="p-4">Create view component missing</div>);
      return wrap(content, await fetchOptions());
    }

    // Empty create
    if (path === '/create') {
      const onBack = () => { if (helpers.navigate) helpers.navigate('/'); else if (typeof window !== 'undefined') window.history.back(); };
      const onSubmit = async (formData) => { console.debug('[getClient] Create form submitted:', formData); alert('Saved (demo)'); if (helpers.navigate) helpers.navigate('/'); };
      if (!createViewComponent) createViewComponent = await helpers.loadModule('./lib/components/CreateView.jsx');
      const content = createViewComponent?.renderCreateView
        ? createViewComponent.renderCreateView(h, {}, onBack, onSubmit)
        : (<div className="p-4">Create view component missing</div>);
      return wrap(content, await fetchOptions());
    }

    // Search route delegates to query-client
    const searchMatch = path.match(/^\/search\/([^?]+)(?:\?(.*))?$/);
    if (searchMatch) {
      const query = decodeURIComponent(searchMatch[1] || '').trim();
      console.debug('[getClient] Search route matched with query:', query);
      try {
        const queryMod = await helpers.loadModule('./query-client.jsx');
        if (queryMod && typeof queryMod.default === 'function') {
          // Parse query parameters from the URL fragment (page, source, pageSize, etc.)
          const queryParams = new URLSearchParams(searchMatch[2] || '');
          const queryCtx = { 
            ...ctx, 
            params: { 
              ...ctx.params, 
              q: query,
              page: queryParams.get('page') || '1',
              source: queryParams.get('source') || 'tmdb',
              pageSize: queryParams.get('pageSize') || '20'
            } 
          };
          return wrap(await queryMod.default(queryCtx), await fetchOptions());
        }
      } catch (e) {
        console.error('[getClient] Failed to load query-client.jsx', e);
      }
      return wrap(<div className="p-4 text-red-500">Failed to load query module</div>, await fetchOptions());
    }

    // Default: file route
    if (FileRenderer) {
      await lazyLoadComponents();
      const opts = await fetchOptions();
      const element = <FileRenderer path={path} />;
      return wrap(element, opts);
    }

    return <div className="p-4">No renderer available</div>
  } catch (err) {
    console.error('[get-client] Error in hook:', err)
    return <div className="p-4 text-red-600">Error: {err && err.message ? err.message : String(err)}</div>
  }
}
