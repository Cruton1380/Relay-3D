// frontend/services/locationAPI.js
import { apiGet, apiPost } from './apiClient';

export async function getRegionBoundaries() {
  return apiGet('/api/regions');
}

export async function saveRegionBoundary(regionData) {
  return apiPost('/api/regions', regionData);
}

export async function getRegionById(regionId) {
  return apiGet(`/api/regions/${regionId}`);
}

