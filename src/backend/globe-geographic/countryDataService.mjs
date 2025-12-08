/**
 * Mock Country Data Service
 * 
 * Provides basic geographical data for testing purposes.
 */

export class CountryDataService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    this.initialized = true;
  }

  async getAllCountriesWithProvinces() {
    // Mock data structure matching expected format
    return [
      {
        name: 'United States',
        code: 'US',
        continent: 'North America',
        region: 'Americas',
        provinces: [
          {
            name: 'California',
            cities: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento']
          },
          {
            name: 'New York',
            cities: ['New York City', 'Albany', 'Buffalo', 'Rochester']
          },
          {
            name: 'Texas',
            cities: ['Houston', 'Dallas', 'Austin', 'San Antonio']
          }
        ]
      },
      {
        name: 'Canada',
        code: 'CA',
        continent: 'North America',
        region: 'Americas',
        provinces: [
          {
            name: 'Ontario',
            cities: ['Toronto', 'Ottawa', 'Hamilton', 'London']
          },
          {
            name: 'Quebec',
            cities: ['Montreal', 'Quebec City', 'Laval', 'Gatineau']
          }
        ]
      },
      {
        name: 'Germany',
        code: 'DE',
        continent: 'Europe',
        region: 'Europe',
        provinces: [
          {
            name: 'Bavaria',
            cities: ['Munich', 'Nuremberg', 'Augsburg', 'Regensburg']
          },
          {
            name: 'North Rhine-Westphalia',
            cities: ['Cologne', 'Düsseldorf', 'Dortmund', 'Essen']
          }
        ]
      },
      {
        name: 'China',
        code: 'CN',
        continent: 'Asia',
        region: 'Asia',
        provinces: [
          {
            name: 'Beijing',
            cities: ['Beijing', 'Chaoyang', 'Haidian', 'Dongcheng']
          },
          {
            name: 'Shanghai',
            cities: ['Shanghai', 'Pudong', 'Huangpu', 'Xuhui']
          }
        ]
      },
      {
        name: 'Brazil',
        code: 'BR',
        continent: 'South America',
        region: 'Americas',
        provinces: [
          {
            name: 'São Paulo',
            cities: ['São Paulo', 'Guarulhos', 'Campinas', 'São Bernardo']
          },
          {
            name: 'Rio de Janeiro',
            cities: ['Rio de Janeiro', 'São Gonçalo', 'Duque de Caxias', 'Nova Iguaçu']
          }
        ]
      }
    ];
  }
}

export class GlobeGeographicService {
  async getCityCentroid(cityName, countryCode) {
    // Mock centroids for testing
    const mockCentroids = {
      'Los Angeles': [-118.2437, 34.0522],
      'New York City': [-74.0060, 40.7128],
      'Toronto': [-79.3832, 43.6532],
      'Munich': [11.5820, 48.1351],
      'Beijing': [116.4074, 39.9042],
      'São Paulo': [-46.6333, -23.5505]
    };
    
    return mockCentroids[cityName] || null;
  }

  async getProvinceCentroid(provinceName, countryCode) {
    const mockCentroids = {
      'California': [-119.4179, 36.7783],
      'New York': [-74.9481, 43.2994],
      'Ontario': [-85.3206, 51.2538],
      'Bavaria': [11.4979, 48.7904],
      'Beijing': [116.4074, 39.9042],
      'São Paulo': [-46.6333, -23.5505]
    };
    
    return mockCentroids[provinceName] || null;
  }

  async getCountryCentroid(countryName) {
    const mockCentroids = {
      'United States': [-95.7129, 37.0902],
      'Canada': [-106.3468, 56.1304],
      'Germany': [10.4515, 51.1657],
      'China': [104.1954, 35.8617],
      'Brazil': [-51.9253, -14.2350]
    };
    
    return mockCentroids[countryName] || null;
  }
}