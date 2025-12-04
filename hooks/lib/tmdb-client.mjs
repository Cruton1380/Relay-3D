/**
 * Client-side TMDB API utilities
 * Runs in the browser and fetches data from TMDB API
 */

let genreCache = null;

export async function fetchTmdbCredentials() {
  try {
    const envResp = await fetch('/hooks/env.json');
    if (!envResp.ok) return null;
    const env = await envResp.json();
    return {
      apiKey: env.RELAY_PUBLIC_TMDB_API_KEY,
      bearerToken: env.RELAY_PUBLIC_TMDB_BEARER || env.RELAY_PUBLIC_TMDB_READ_ACCESS_ID,
    };
  } catch (err) {
    console.error('[tmdb-client] Error fetching credentials:', err);
    return null;
  }
}

export async function fetchGenres(apiKey, bearerToken) {
  if (genreCache) return genreCache;

  try {
    const params = new URLSearchParams({ language: 'en-US' });
    if (apiKey) params.set('api_key', apiKey);

    const url = `https://api.themoviedb.org/3/genre/movie/list?${params.toString()}`;
    const headers = {};
    if (bearerToken) {
      headers['Authorization'] = bearerToken.startsWith('Bearer ') ? bearerToken : `Bearer ${bearerToken}`;
    }

    const resp = await fetch(url, { headers });
    if (!resp.ok) return {};

    const data = await resp.json();
    genreCache = {};
    (data.genres || []).forEach((g) => { genreCache[g.id] = g.name; });
    return genreCache;
  } catch (err) {
    console.error('[tmdb-client] Error fetching genres:', err);
    return {};
  }
}

export async function fetchTmdbMovie(id, apiKey, bearerToken) {
  const params = new URLSearchParams({ language: 'en-US' });
  if (apiKey) params.set('api_key', apiKey);

  const url = `https://api.themoviedb.org/3/movie/${id}?${params.toString()}`;
  const headers = {};
  if (bearerToken) {
    headers['Authorization'] = bearerToken.startsWith('Bearer ') ? bearerToken : `Bearer ${bearerToken}`;
  }

  const resp = await fetch(url, { headers });
  if (!resp.ok) return null;
  return resp.json();
}

export async function searchTmdb(query, apiKey, bearerToken) {
  const params = new URLSearchParams({
    query,
    include_adult: 'false',
    language: 'en-US',
    page: '1',
  });
  if (apiKey) params.set('api_key', apiKey);

  const url = `https://api.themoviedb.org/3/search/movie?${params.toString()}`;
  const headers = {};
  if (bearerToken) {
    headers['Authorization'] = bearerToken.startsWith('Bearer ') ? bearerToken : `Bearer ${bearerToken}`;
  }

  const resp = await fetch(url, { headers });
  if (!resp.ok) return { items: [], total: 0 };

  const data = await resp.json();
  const genreMap = await fetchGenres(apiKey, bearerToken);

  const items = (data.results || []).map((item) => ({
    ...item,
    source: 'tmdb',
    poster_url: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
    backdrop_url: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
    genre_names: (item.genre_ids || []).map((id) => genreMap[id]).filter(Boolean),
  }));

  return { items, total: data.total_results || 0, page: data.page || 1 };
}
