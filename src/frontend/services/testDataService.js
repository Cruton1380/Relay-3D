const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

export const fetchTestData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/channels/test-channels`);
    if (!response.ok) {
      throw new Error('Failed to fetch test data');
    }
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to load test data');
    }
    return {
      channels: data.channels || []
    };
  } catch (error) {
    console.error('Error fetching test data:', error);
    throw error;
  }
}; 