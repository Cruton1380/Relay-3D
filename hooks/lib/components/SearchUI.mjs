/**
 * SearchUI helper — Handles search results structure and validation
 * Used by router.mjs for /search/[query] routes
 * Returns structured data for RepoBrowser to render
 */

export function createSearchUIResponse(items, total, page, query, error = null) {
  return {
    type: 'search-ui',
    items: items || [],
    total: total || 0,
    page: page || 1,
    query: query || '',
    error: error || null,
  };
}

export function createEmptySearchResponse(message = null) {
  return {
    type: 'search-ui',
    items: [],
    total: 0,
    message: message || 'Enter a search query above',
  };
}

export function createSearchErrorResponse(error) {
  return {
    type: 'search-ui',
    items: [],
    total: 0,
    error: error || 'Search failed',
  };
}
