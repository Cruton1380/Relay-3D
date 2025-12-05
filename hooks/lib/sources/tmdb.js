#!/usr/bin/env node
// tmdb.js — TMDB API source plugin for GET and QUERY hooks (client-side friendly)

function env(name, def) {
  const v = typeof process !== 'undefined' && process && process.env ? process.env[name] : undefined
  return v == null ? def : v
}

// Load TMDB API credentials from environment (Node) or from /hooks/env.json (browser)
export async function getTmdbAuth() {
  try {
    const apiKey = env('RELAY_PUBLIC_TMDB_API_KEY') || env('TMDB_API_KEY')
    const bearerToken = env('RELAY_PUBLIC_TMDB_BEARER') || env('RELAY_PUBLIC_TMDB_READ_ACCESS_ID') || env('TMDB_BEARER_TOKEN')
    if (apiKey) return { type: 'key', apiKey }
    if (bearerToken) {
      const token = /^Bearer\s+/i.test(bearerToken) ? bearerToken : `Bearer ${bearerToken}`
      return { type: 'bearer', token }
    }
  } catch {}

  // Browser path: fetch env.json
  try {
    const resp = await fetch('/hooks/env.json')
    if (resp && resp.ok) {
      const envj = await resp.json()
      const apiKey = envj.RELAY_PUBLIC_TMDB_API_KEY || envj.TMDB_API_KEY
      const bearer = envj.RELAY_PUBLIC_TMDB_BEARER || envj.RELAY_PUBLIC_TMDB_READ_ACCESS_ID || envj.TMDB_BEARER_TOKEN
      if (apiKey) return { type: 'key', apiKey }
      if (bearer) {
        const token = /^Bearer\s+/i.test(bearer) ? bearer : `Bearer ${bearer}`
        return { type: 'bearer', token }
      }
    }
  } catch {}
  return null
}

function buildHeaders(auth) {
  const headers = { Accept: 'application/json' }
  if (!auth) return headers
  if (auth.type === 'bearer') headers['Authorization'] = auth.token
  return headers
}

function buildTmdbUrl(endpoint, auth, params = {}) {
  const base = `https://api.themoviedb.org/3${endpoint}`
  const qs = new URLSearchParams(params)
  if (auth && auth.type === 'key') qs.set('api_key', auth.apiKey)
  const url = qs.toString() ? `${base}?${qs.toString()}` : base
  return url
}

// Fetch a movie from TMDB by ID
export async function getFromTmdb(movieId) {
  if (!movieId) return null
  const auth = await getTmdbAuth()
  if (!auth) {
    console.error('TMDB: No API credentials found')
    return null
  }
  try {
    const url = buildTmdbUrl(`/movie/${encodeURIComponent(String(movieId).trim())}`, auth, { language: 'en-US' })
    const headers = buildHeaders(auth)
    const resp = await fetch(url, { headers })
    if (!resp.ok) {
      console.error(`TMDB: GET failed (${resp.status}): ${resp.statusText}`)
      return null
    }
    const movie = await resp.json()
    return mapTmdbMovie(movie)
  } catch (err) {
    console.error('TMDB: GET error:', err)
    return null
  }
}

// Search TMDB for movies by query
export async function queryFromTmdb(searchQuery, page = 0, limit = 10) {
  if (!searchQuery || typeof searchQuery !== 'string') {
    return { results: [], total: 0, page: 0 }
  }
  const auth = await getTmdbAuth()
  if (!auth) {
    console.error('TMDB: No API credentials found')
    return { results: [], total: 0, page: 0 }
  }
  try {
    const url = buildTmdbUrl('/search/movie', auth, {
      query: searchQuery.trim(),
      include_adult: 'false',
      language: 'en-US',
      page: String(Math.max(1, Number(page || 0) + 1)),
    })
    const headers = buildHeaders(auth)
    const resp = await fetch(url, { headers })
    if (!resp.ok) {
      console.error(`TMDB: QUERY failed (${resp.status}): ${resp.statusText}`)
      return { results: [], total: 0, page }
    }
    const data = await resp.json()
    const results = (Array.isArray(data.results) ? data.results : [])
      .slice(0, limit)
      .map((m) => mapTmdbMovie(m))
    return { results, total: data.total_results || 0, page: data.page || page }
  } catch (err) {
    console.error('TMDB: QUERY error:', err)
    return { results: [], total: 0, page }
  }
}

function mapTmdbMovie(movie) {
  return movie || {}
}
