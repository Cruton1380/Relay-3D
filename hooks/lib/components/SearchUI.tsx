/**
 * SearchUI helper (TSX/JSX) - Handles search results structure and validation
 * Provides utility functions for creating search response objects
 * Used by get-client.tsx for /search/[query] routes
 * 
 * TSX is transpiled at runtime by RepoBrowser using @babel/standalone
 * with React context injected via window.__ctx__.React
 * 
 * Loaded via: helpers.loadModule('./lib/components/SearchUI.tsx')
 * Exports: createSearchUIResponse, createEmptySearchResponse, createSearchErrorResponse
 */
import type { TMDBMovie } from '../../types'

export function createSearchUIResponse(items: ReadonlyArray<unknown | TMDBMovie>, total: number, page: number, query: string, error: string | null = null) {
  return {
    type: 'search-ui',
    items: items || [],
    total: total || 0,
    page: page || 1,
    query: query || '',
    error: error || null,
  } as const;
}

export function createEmptySearchResponse(message: string | null = null) {
  return {
    type: 'search-ui',
    items: [],
    total: 0,
    message: message || 'Enter a search query above',
  } as const;
}

export function createSearchErrorResponse(error: string) {
  return {
    type: 'search-ui',
    items: [],
    total: 0,
    error: error || 'Search failed',
  } as const;
}
