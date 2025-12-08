/**
 * ProvinceDataService - Comprehensive province data management
 * 
 * Provides authoritative province data for all countries worldwide
 * Uses Natural Earth data structure for consistency and completeness
 * 
 * This service ensures proper province-level clustering for all supported countries
 * 
 * Now uses hybrid approach:
 * - Fast hardcoded data for 8 most common countries (IT, ES, FR, US, CA, CN, JP, AU)
 * - Dynamic loader for remaining countries (downloads from Natural Earth, cached)
 */

import dynamicProvinceLoader from './dynamicProvinceLoader.mjs';

class ProvinceDataService {
  constructor() {
    this.initialized = false;
    this.countryData = new Map();
    this.provinceIndex = new Map(); // province name -> country mapping
    this.dynamicLoader = dynamicProvinceLoader;
    
    console.log('🗺️ ProvinceDataService: Initialized');
  }

  /**
   * Initialize with comprehensive Natural Earth-style data
   */
  async initialize() {
    if (this.initialized) return;
    
    console.log('🗺️ Loading comprehensive province data...');
    await this.loadNaturalEarthData();
    
    // Initialize dynamic loader for additional countries
    console.log('🗺️ Initializing dynamic province loader...');
    await this.dynamicLoader.initialize();
    
    this.initialized = true;
    
    const dynamicStats = this.dynamicLoader.getStatistics();
    console.log(`🗺️ Province data loaded: ${this.countryData.size} hardcoded + ${dynamicStats.totalCountries} dynamic = ${this.countryData.size + dynamicStats.totalCountries} countries`);
    console.log(`🗺️ Total provinces: ${this.provinceIndex.size} hardcoded + ${dynamicStats.totalProvinces} dynamic`);
  }

  /**
   * Load Natural Earth-style administrative data
   */
  async loadNaturalEarthData() {
    // Comprehensive province data for major countries
    const naturalEarthData = {
      // EUROPE
      'IT': {
        name: 'Italy',
        continent: 'Europe',
        bounds: { north: 47.1, south: 36.6, east: 18.7, west: 6.6 },
        provinces: [
          // Northern Italy
          { name: 'Piedmont', bounds: { north: 46.5, south: 44.0, east: 9.0, west: 6.5 }, centroid: [7.75, 45.25], cities: ['Turin', 'Alessandria', 'Novara', 'Cuneo', 'Asti'] },
          { name: 'Lombardy', bounds: { north: 46.5, south: 44.5, east: 11.0, west: 8.5 }, centroid: [9.75, 45.5], cities: ['Milan', 'Bergamo', 'Brescia', 'Como', 'Varese'] },
          { name: 'Veneto', bounds: { north: 46.5, south: 44.5, east: 13.0, west: 10.5 }, centroid: [11.75, 45.5], cities: ['Venice', 'Verona', 'Padua', 'Vicenza', 'Treviso'] },
          { name: 'Friuli-Venezia Giulia', bounds: { north: 46.6, south: 45.5, east: 13.9, west: 12.3 }, centroid: [13.1, 46.05], cities: ['Trieste', 'Udine', 'Pordenone', 'Gorizia'] },
          { name: 'Trentino-Alto Adige', bounds: { north: 47.1, south: 45.5, east: 12.5, west: 10.4 }, centroid: [11.45, 46.3], cities: ['Trento', 'Bolzano', 'Merano', 'Rovereto'] },
          { name: 'Liguria', bounds: { north: 44.6, south: 43.8, east: 10.0, west: 7.5 }, centroid: [8.75, 44.2], cities: ['Genoa', 'La Spezia', 'Savona', 'Imperia'] },
          { name: 'Emilia-Romagna', bounds: { north: 45.1, south: 43.7, east: 12.8, west: 9.2 }, centroid: [11.0, 44.4], cities: ['Bologna', 'Modena', 'Parma', 'Ravenna', 'Ferrara'] },
          
          // Central Italy
          { name: 'Tuscany', bounds: { north: 44.5, south: 42.2, east: 12.4, west: 9.7 }, centroid: [11.05, 43.35], cities: ['Florence', 'Pisa', 'Siena', 'Livorno', 'Arezzo'] },
          { name: 'Umbria', bounds: { north: 43.6, south: 42.4, east: 13.3, west: 11.9 }, centroid: [12.6, 43.0], cities: ['Perugia', 'Terni', 'Assisi', 'Foligno'] },
          { name: 'Marche', bounds: { north: 44.0, south: 42.7, east: 14.0, west: 12.2 }, centroid: [13.1, 43.35], cities: ['Ancona', 'Pesaro', 'Macerata', 'Ascoli Piceno'] },
          { name: 'Lazio', bounds: { north: 43.0, south: 40.8, east: 14.0, west: 11.5 }, centroid: [12.75, 41.9], cities: ['Rome', 'Viterbo', 'Latina', 'Frosinone', 'Rieti'] },
          { name: 'Abruzzo', bounds: { north: 42.9, south: 41.5, east: 14.8, west: 13.0 }, centroid: [13.9, 42.2], cities: ['L\'Aquila', 'Pescara', 'Chieti', 'Teramo'] },
          { name: 'Molise', bounds: { north: 42.0, south: 41.4, east: 15.2, west: 14.2 }, centroid: [14.7, 41.7], cities: ['Campobasso', 'Isernia', 'Termoli'] },
          
          // Southern Italy
          { name: 'Campania', bounds: { north: 41.5, south: 39.9, east: 15.8, west: 13.8 }, centroid: [14.8, 40.7], cities: ['Naples', 'Salerno', 'Caserta', 'Avellino', 'Benevento'] },
          { name: 'Puglia', bounds: { north: 42.0, south: 39.8, east: 18.5, west: 14.9 }, centroid: [16.7, 40.9], cities: ['Bari', 'Lecce', 'Foggia', 'Taranto', 'Brindisi'] },
          { name: 'Basilicata', bounds: { north: 41.1, south: 39.9, east: 16.9, west: 15.3 }, centroid: [16.1, 40.5], cities: ['Potenza', 'Matera', 'Policoro', 'Melfi'] },
          { name: 'Calabria', bounds: { north: 40.1, south: 37.9, east: 17.2, west: 15.6 }, centroid: [16.4, 39.0], cities: ['Catanzaro', 'Reggio Calabria', 'Cosenza', 'Crotone'] },
          
          // Islands
          { name: 'Sicily', bounds: { north: 38.3, south: 36.6, east: 15.6, west: 12.4 }, centroid: [14.0, 37.45], cities: ['Palermo', 'Catania', 'Messina', 'Syracuse', 'Trapani'] },
          { name: 'Sardinia', bounds: { north: 41.3, south: 38.9, east: 9.8, west: 8.1 }, centroid: [8.95, 40.1], cities: ['Cagliari', 'Sassari', 'Nuoro', 'Oristano'] }
        ]
      },

      'ES': {
        name: 'Spain',
        continent: 'Europe', 
        bounds: { north: 43.8, south: 27.6, east: 4.3, west: -18.2 },
        provinces: [
          // Northern Spain
          { name: 'Galicia', bounds: { north: 43.8, south: 41.8, east: -6.7, west: -9.3 }, centroid: [-8.0, 42.8], cities: ['Santiago de Compostela', 'A Coruña', 'Vigo', 'Ourense', 'Lugo'] },
          { name: 'Asturias', bounds: { north: 43.6, south: 42.8, east: -4.5, west: -7.1 }, centroid: [-5.8, 43.2], cities: ['Oviedo', 'Gijón', 'Avilés', 'Langreo'] },
          { name: 'Cantabria', bounds: { north: 43.5, south: 42.8, east: -3.2, west: -4.9 }, centroid: [-4.05, 43.15], cities: ['Santander', 'Torrelavega', 'Castro Urdiales'] },
          { name: 'Basque Country', bounds: { north: 43.4, south: 42.5, east: -1.8, west: -3.3 }, centroid: [-2.55, 42.95], cities: ['Bilbao', 'Vitoria-Gasteiz', 'San Sebastián'] },
          { name: 'Navarre', bounds: { north: 43.2, south: 42.0, east: -1.0, west: -2.7 }, centroid: [-1.85, 42.6], cities: ['Pamplona', 'Tudela', 'Estella'] },
          { name: 'La Rioja', bounds: { north: 42.7, south: 41.9, east: -1.7, west: -3.2 }, centroid: [-2.45, 42.3], cities: ['Logroño', 'Calahorra', 'Arnedo'] },
          { name: 'Aragon', bounds: { north: 42.9, south: 40.0, east: 0.8, west: -1.9 }, centroid: [-0.55, 41.45], cities: ['Zaragoza', 'Huesca', 'Teruel'] },
          { name: 'Catalonia', bounds: { north: 42.9, south: 40.5, east: 3.3, west: 0.2 }, centroid: [1.75, 41.7], cities: ['Barcelona', 'Girona', 'Lleida', 'Tarragona'] },
          
          // Central Spain
          { name: 'Castile and León', bounds: { north: 43.0, south: 40.1, east: -1.7, west: -6.9 }, centroid: [-4.3, 41.55], cities: ['Valladolid', 'León', 'Burgos', 'Salamanca', 'Palencia'] },
          { name: 'Madrid', bounds: { north: 41.2, south: 39.9, east: -3.1, west: -4.6 }, centroid: [-3.85, 40.55], cities: ['Madrid', 'Alcalá de Henares', 'Getafe'] },
          { name: 'Castile-La Mancha', bounds: { north: 40.6, south: 38.0, east: -1.1, west: -5.8 }, centroid: [-3.45, 39.3], cities: ['Toledo', 'Albacete', 'Ciudad Real', 'Cuenca'] },
          { name: 'Extremadura', bounds: { north: 40.5, south: 37.9, east: -4.4, west: -7.5 }, centroid: [-5.95, 39.2], cities: ['Mérida', 'Badajoz', 'Cáceres', 'Plasencia'] },
          
          // Southern Spain
          { name: 'Andalusia', bounds: { north: 38.7, south: 36.0, east: -1.6, west: -7.5 }, centroid: [-4.55, 37.35], cities: ['Seville', 'Málaga', 'Córdoba', 'Granada', 'Almería'] },
          { name: 'Murcia', bounds: { north: 38.7, south: 37.6, east: -0.6, west: -2.3 }, centroid: [-1.45, 38.15], cities: ['Murcia', 'Cartagena', 'Lorca'] },
          { name: 'Valencia', bounds: { north: 40.8, south: 38.2, east: 1.0, west: -1.6 }, centroid: [-0.3, 39.5], cities: ['Valencia', 'Alicante', 'Castellón'] },
          
          // Islands
          { name: 'Balearic Islands', bounds: { north: 40.1, south: 38.6, east: 4.3, west: 1.2 }, centroid: [2.75, 39.35], cities: ['Palma', 'Ibiza', 'Mahón'] },
          { name: 'Canary Islands', bounds: { north: 29.4, south: 27.6, east: -13.4, west: -18.2 }, centroid: [-15.8, 28.5], cities: ['Las Palmas', 'Santa Cruz de Tenerife'] }
        ]
      },

      'FR': {
        name: 'France',
        continent: 'Europe',
        bounds: { north: 51.1, south: 41.3, east: 9.6, west: -5.6 },
        provinces: [
          // Northern France
          { name: 'Hauts-de-France', bounds: { north: 51.1, south: 49.2, east: 4.2, west: 1.4 }, centroid: [2.8, 50.15], cities: ['Lille', 'Amiens', 'Calais', 'Dunkirk'] },
          { name: 'Normandy', bounds: { north: 49.7, south: 48.3, east: 1.8, west: -1.9 }, centroid: [-0.05, 49.0], cities: ['Rouen', 'Caen', 'Le Havre', 'Cherbourg'] },
          { name: 'Brittany', bounds: { north: 48.9, south: 47.3, east: -1.0, west: -5.1 }, centroid: [-3.05, 48.1], cities: ['Rennes', 'Brest', 'Nantes', 'Quimper'] },
          { name: 'Pays de la Loire', bounds: { north: 48.6, south: 46.2, east: 0.9, west: -2.4 }, centroid: [-0.75, 47.4], cities: ['Nantes', 'Angers', 'Le Mans', 'Laval'] },
          { name: 'Centre-Val de Loire', bounds: { north: 48.7, south: 46.4, east: 3.0, west: 0.1 }, centroid: [1.55, 47.55], cities: ['Orléans', 'Tours', 'Bourges', 'Blois'] },
          { name: 'Île-de-France', bounds: { north: 49.2, south: 48.1, east: 3.6, west: 1.4 }, centroid: [2.5, 48.65], cities: ['Paris', 'Versailles', 'Créteil', 'Nanterre'] },
          
          // Eastern France  
          { name: 'Grand Est', bounds: { north: 49.5, south: 47.4, east: 8.2, west: 4.8 }, centroid: [6.5, 48.45], cities: ['Strasbourg', 'Nancy', 'Reims', 'Metz'] },
          { name: 'Bourgogne-Franche-Comté', bounds: { north: 48.4, south: 46.2, east: 7.2, west: 2.8 }, centroid: [5.0, 47.3], cities: ['Dijon', 'Besançon', 'Mâcon', 'Chalon-sur-Saône'] },
          { name: 'Auvergne-Rhône-Alpes', bounds: { north: 46.4, south: 44.1, east: 7.2, west: 2.2 }, centroid: [4.7, 45.25], cities: ['Lyon', 'Grenoble', 'Clermont-Ferrand', 'Saint-Étienne'] },
          
          // Southern France
          { name: 'Occitanie', bounds: { north: 45.0, south: 42.3, east: 4.9, west: -0.3 }, centroid: [2.3, 43.65], cities: ['Toulouse', 'Montpellier', 'Nîmes', 'Perpignan'] },
          { name: 'Provence-Alpes-Côte d\'Azur', bounds: { north: 44.9, south: 42.9, east: 7.7, west: 4.2 }, centroid: [5.95, 43.9], cities: ['Marseille', 'Nice', 'Toulon', 'Avignon'] },
          { name: 'Nouvelle-Aquitaine', bounds: { north: 47.1, south: 43.2, east: 2.8, west: -1.8 }, centroid: [0.5, 45.15], cities: ['Bordeaux', 'Poitiers', 'Limoges', 'Pau'] },
          { name: 'Corsica', bounds: { north: 43.0, south: 41.3, east: 9.6, west: 8.5 }, centroid: [9.05, 42.15], cities: ['Ajaccio', 'Bastia', 'Porto-Vecchio'] }
        ]
      },

      // NORTH AMERICA
      'US': {
        name: 'United States',
        continent: 'North America',
        bounds: { north: 49.4, south: 24.4, east: -66.9, west: -124.8 },
        provinces: [
          // States by region
          { name: 'California', bounds: { north: 42.0, south: 32.5, east: -114.1, west: -124.4 }, centroid: [-119.25, 37.25], cities: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento'] },
          { name: 'Texas', bounds: { north: 36.5, south: 25.8, east: -93.5, west: -106.6 }, centroid: [-100.05, 31.15], cities: ['Houston', 'Dallas', 'Austin', 'San Antonio'] },
          { name: 'Florida', bounds: { north: 31.0, south: 24.4, east: -80.0, west: -87.6 }, centroid: [-83.8, 27.7], cities: ['Miami', 'Tampa', 'Orlando', 'Jacksonville'] },
          { name: 'New York', bounds: { north: 45.0, south: 40.5, east: -71.9, west: -79.8 }, centroid: [-75.85, 42.75], cities: ['New York City', 'Albany', 'Buffalo', 'Rochester'] },
          { name: 'Pennsylvania', bounds: { north: 42.3, south: 39.7, east: -74.7, west: -80.5 }, centroid: [-77.6, 41.0], cities: ['Philadelphia', 'Pittsburgh', 'Harrisburg', 'Allentown'] },
          { name: 'Illinois', bounds: { north: 42.5, south: 37.0, east: -87.0, west: -91.5 }, centroid: [-89.25, 39.75], cities: ['Chicago', 'Springfield', 'Peoria', 'Rockford'] },
          { name: 'Ohio', bounds: { north: 42.3, south: 38.4, east: -80.5, west: -84.8 }, centroid: [-82.65, 40.35], cities: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo'] },
          { name: 'Michigan', bounds: { north: 48.2, south: 41.7, east: -82.4, west: -90.4 }, centroid: [-86.4, 44.95], cities: ['Detroit', 'Grand Rapids', 'Lansing', 'Flint'] },
          { name: 'Georgia', bounds: { north: 35.0, south: 30.4, east: -81.0, west: -85.6 }, centroid: [-83.3, 32.7], cities: ['Atlanta', 'Augusta', 'Columbus', 'Savannah'] },
          { name: 'North Carolina', bounds: { north: 36.6, south: 33.8, east: -75.5, west: -84.3 }, centroid: [-79.9, 35.2], cities: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham'] },
          { name: 'Virginia', bounds: { north: 39.5, south: 36.5, east: -75.2, west: -83.7 }, centroid: [-79.45, 38.0], cities: ['Virginia Beach', 'Norfolk', 'Richmond', 'Newport News'] },
          { name: 'Washington', bounds: { north: 49.0, south: 45.5, east: -116.9, west: -124.8 }, centroid: [-120.85, 47.25], cities: ['Seattle', 'Spokane', 'Tacoma', 'Vancouver'] },
          { name: 'Arizona', bounds: { north: 37.0, south: 31.3, east: -109.0, west: -114.8 }, centroid: [-111.9, 34.15], cities: ['Phoenix', 'Tucson', 'Mesa', 'Chandler'] },
          { name: 'Massachusetts', bounds: { north: 42.9, south: 41.2, east: -69.9, west: -73.5 }, centroid: [-71.7, 42.05], cities: ['Boston', 'Worcester', 'Springfield', 'Cambridge'] },
          { name: 'Tennessee', bounds: { north: 36.7, south: 34.9, east: -81.6, west: -90.3 }, centroid: [-85.95, 35.8], cities: ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga'] }
        ]
      },

      'CA': {
        name: 'Canada', 
        continent: 'North America',
        bounds: { north: 83.6, south: 41.7, east: -52.6, west: -141.0 },
        provinces: [
          { name: 'British Columbia', bounds: { north: 60.0, south: 48.3, east: -114.0, west: -139.1 }, centroid: [-126.55, 54.15], cities: ['Vancouver', 'Victoria', 'Surrey', 'Burnaby'] },
          { name: 'Alberta', bounds: { north: 60.0, south: 49.0, east: -110.0, west: -120.0 }, centroid: [-115.0, 54.5], cities: ['Calgary', 'Edmonton', 'Red Deer', 'Lethbridge'] },
          { name: 'Saskatchewan', bounds: { north: 60.0, south: 49.0, east: -101.4, west: -110.0 }, centroid: [-105.7, 54.5], cities: ['Saskatoon', 'Regina', 'Prince Albert', 'Moose Jaw'] },
          { name: 'Manitoba', bounds: { north: 60.0, south: 49.0, east: -95.2, west: -101.4 }, centroid: [-98.3, 54.5], cities: ['Winnipeg', 'Brandon', 'Steinbach', 'Thompson'] },
          { name: 'Ontario', bounds: { north: 56.9, south: 41.7, east: -74.3, west: -95.2 }, centroid: [-84.75, 49.3], cities: ['Toronto', 'Ottawa', 'Hamilton', 'London'] },
          { name: 'Quebec', bounds: { north: 62.6, south: 45.0, east: -57.1, west: -79.8 }, centroid: [-68.45, 53.8], cities: ['Montreal', 'Quebec City', 'Laval', 'Gatineau'] },
          { name: 'New Brunswick', bounds: { north: 48.1, south: 44.6, east: -63.8, west: -69.1 }, centroid: [-66.45, 46.35], cities: ['Saint John', 'Moncton', 'Fredericton'] },
          { name: 'Nova Scotia', bounds: { north: 47.0, south: 43.4, east: -59.7, west: -66.4 }, centroid: [-63.05, 45.2], cities: ['Halifax', 'Cape Breton', 'Dartmouth'] },
          { name: 'Prince Edward Island', bounds: { north: 47.1, south: 45.9, east: -61.9, west: -64.4 }, centroid: [-63.15, 46.5], cities: ['Charlottetown', 'Summerside'] },
          { name: 'Newfoundland and Labrador', bounds: { north: 60.4, south: 46.6, east: -52.6, west: -67.8 }, centroid: [-60.2, 53.5], cities: ['St. John\'s', 'Mount Pearl', 'Corner Brook'] }
        ]
      },

      // ASIA
      'CN': {
        name: 'China',
        continent: 'Asia',
        bounds: { north: 53.6, south: 15.8, east: 134.8, west: 73.5 },
        provinces: [
          { name: 'Beijing', bounds: { north: 41.1, south: 39.4, east: 117.5, west: 115.4 }, centroid: [116.45, 40.25], cities: ['Beijing'] },
          { name: 'Shanghai', bounds: { north: 31.9, south: 30.7, east: 122.0, west: 120.9 }, centroid: [121.45, 31.3], cities: ['Shanghai'] },
          { name: 'Guangdong', bounds: { north: 25.3, south: 20.2, east: 117.2, west: 109.8 }, centroid: [113.5, 22.75], cities: ['Guangzhou', 'Shenzhen', 'Dongguan', 'Foshan'] },
          { name: 'Shandong', bounds: { north: 38.4, south: 34.4, east: 122.7, west: 114.8 }, centroid: [118.75, 36.4], cities: ['Jinan', 'Qingdao', 'Yantai', 'Weifang'] },
          { name: 'Jiangsu', bounds: { north: 35.1, south: 30.8, east: 121.9, west: 116.4 }, centroid: [119.15, 32.95], cities: ['Nanjing', 'Suzhou', 'Wuxi', 'Changzhou'] },
          { name: 'Zhejiang', bounds: { north: 31.4, south: 27.0, east: 123.2, west: 118.0 }, centroid: [120.6, 29.2], cities: ['Hangzhou', 'Ningbo', 'Wenzhou', 'Shaoxing'] },
          { name: 'Sichuan', bounds: { north: 34.3, south: 26.0, east: 108.5, west: 97.4 }, centroid: [102.95, 30.15], cities: ['Chengdu', 'Mianyang', 'Deyang', 'Nanchong'] },
          { name: 'Henan', bounds: { north: 36.4, south: 31.4, east: 116.4, west: 110.4 }, centroid: [113.4, 33.9], cities: ['Zhengzhou', 'Luoyang', 'Kaifeng', 'Anyang'] }
        ]
      },

      'JP': {
        name: 'Japan',
        continent: 'Asia', 
        bounds: { north: 45.7, south: 20.2, east: 148.3, west: 122.7 },
        provinces: [
          { name: 'Hokkaido', bounds: { north: 45.7, south: 41.4, east: 146.0, west: 139.3 }, centroid: [142.65, 43.55], cities: ['Sapporo', 'Hakodate', 'Asahikawa'] },
          { name: 'Honshu', bounds: { north: 41.6, south: 30.3, east: 141.9, west: 129.4 }, centroid: [135.65, 35.95], cities: ['Tokyo', 'Osaka', 'Kyoto', 'Hiroshima'] },
          { name: 'Kyushu', bounds: { north: 34.0, south: 31.0, east: 132.0, west: 129.7 }, centroid: [130.85, 32.5], cities: ['Fukuoka', 'Kumamoto', 'Kagoshima', 'Nagasaki'] },
          { name: 'Shikoku', bounds: { north: 34.4, south: 32.7, east: 134.8, west: 132.0 }, centroid: [133.4, 33.55], cities: ['Matsuyama', 'Takamatsu', 'Kochi', 'Tokushima'] },
          { name: 'Okinawa', bounds: { north: 26.9, south: 20.2, east: 131.3, west: 122.7 }, centroid: [127.0, 23.55], cities: ['Naha', 'Okinawa City', 'Urasoe'] }
        ]
      },

      // OCEANIA
      'AU': {
        name: 'Australia',
        continent: 'Oceania',
        bounds: { north: -9.1, south: -55.3, east: 159.6, west: 112.7 },
        provinces: [
          { name: 'New South Wales', bounds: { north: -28.2, south: -37.5, east: 159.1, west: 141.0 }, centroid: [150.05, -32.85], cities: ['Sydney', 'Newcastle', 'Wollongong', 'Wagga Wagga'] },
          { name: 'Victoria', bounds: { north: -34.0, south: -39.2, east: 150.0, west: 141.0 }, centroid: [145.5, -36.6], cities: ['Melbourne', 'Geelong', 'Ballarat', 'Bendigo'] },
          { name: 'Queensland', bounds: { north: -9.1, south: -29.2, east: 153.6, west: 138.0 }, centroid: [145.8, -19.15], cities: ['Brisbane', 'Gold Coast', 'Cairns', 'Townsville'] },
          { name: 'Western Australia', bounds: { north: -13.7, south: -35.1, east: 129.0, west: 112.7 }, centroid: [120.85, -24.4], cities: ['Perth', 'Fremantle', 'Bunbury', 'Geraldton'] },
          { name: 'South Australia', bounds: { north: -26.0, south: -38.1, east: 141.0, west: 129.0 }, centroid: [135.0, -32.05], cities: ['Adelaide', 'Mount Gambier', 'Whyalla'] },
          { name: 'Tasmania', bounds: { north: -40.0, south: -43.6, east: 148.5, west: 144.6 }, centroid: [146.55, -41.8], cities: ['Hobart', 'Launceston', 'Devonport'] },
          { name: 'Northern Territory', bounds: { north: -10.0, south: -26.0, east: 138.0, west: 129.0 }, centroid: [133.5, -18.0], cities: ['Darwin', 'Alice Springs', 'Katherine'] },
          { name: 'Australian Capital Territory', bounds: { north: -35.1, south: -35.9, east: 149.4, west: 148.8 }, centroid: [149.1, -35.5], cities: ['Canberra'] }
        ]
      }
    };

    // Load data into maps
    for (const [countryCode, countryInfo] of Object.entries(naturalEarthData)) {
      this.countryData.set(countryCode, countryInfo);
      
      // Index provinces for quick lookup
      if (countryInfo.provinces) {
        countryInfo.provinces.forEach(province => {
          const key = `${province.name}-${countryCode}`;
          this.provinceIndex.set(province.name, {
            ...province,
            countryCode,
            countryName: countryInfo.name
          });
        });
      }
    }
  }

  /**
   * Get country data by code or name
   */
  async getCountryData(countryIdentifier) {
    await this.initialize();
    
    // Try hardcoded data first (fast path)
    if (this.countryData.has(countryIdentifier)) {
      return this.countryData.get(countryIdentifier);
    }
    
    // Try by name in hardcoded data
    for (const [code, data] of this.countryData.entries()) {
      if (data.name.toLowerCase() === countryIdentifier.toLowerCase()) {
        return { ...data, code };
      }
    }
    
    // Fall back to dynamic loader for countries not hardcoded
    const dynamicData = this.dynamicLoader.getCountryData(countryIdentifier);
    if (dynamicData) {
      console.log(`🔄 [PROVINCE SERVICE] Using dynamic data for ${countryIdentifier}`);
      return { ...dynamicData, code: countryIdentifier };
    }
    
    return null;
  }

  /**
   * Get province data by name
   */
  async getProvinceData(provinceName) {
    await this.initialize();
    return this.provinceIndex.get(provinceName) || null;
  }

  /**
   * Generate coordinates within a specific province
   */
  async generateProvinceCoordinates(countryCode, provinceName) {
    await this.initialize();
    
    // Use getCountryData to include both hardcoded and dynamic data
    const country = await this.getCountryData(countryCode);
    if (!country || !country.provinces) {
      return null;
    }

    const province = country.provinces.find(p => p.name === provinceName);
    if (!province) {
      return null;
    }

    // Generate coordinates within province bounds, biased toward centroid
    const bounds = province.bounds;
    const centroid = province.centroid;
    
    // Use weighted random generation - 70% near centroid, 30% random in bounds
    const useProvinceCenter = Math.random() < 0.7;
    
    let lat, lng;
    if (useProvinceCenter && centroid) {
      // Generate near centroid with some spread
      const spread = 0.3; // degrees
      lat = centroid[1] + (Math.random() - 0.5) * spread;
      lng = centroid[0] + (Math.random() - 0.5) * spread;
      
      // Ensure still within bounds
      lat = Math.max(bounds.south, Math.min(bounds.north, lat));
      lng = Math.max(bounds.west, Math.min(bounds.east, lng));
    } else {
      // Random within province bounds
      lat = bounds.south + Math.random() * (bounds.north - bounds.south);
      lng = bounds.west + Math.random() * (bounds.east - bounds.west);
    }

    // Select random city from province
    const cities = province.cities || ['Unknown City'];
    const city = cities[Math.floor(Math.random() * cities.length)];

    return {
      location: { lat, lng },
      coordinates: [lng, lat], // Cesium format
      province: provinceName,
      city,
      country: countryCode,
      countryName: country.name,
      continent: country.continent,
      centroid: centroid,
      generatedNear: useProvinceCenter ? 'centroid' : 'random'
    };
  }

  /**
   * Get all countries with province data
   */
  async getCountriesWithProvinces() {
    await this.initialize();
    
    const result = [];
    
    // Add hardcoded countries
    for (const [code, data] of this.countryData.entries()) {
      result.push({
        code,
        name: data.name,
        continent: data.continent,
        hasProvinces: !!(data.provinces && data.provinces.length > 0),
        provinceCount: data.provinces ? data.provinces.length : 0,
        source: 'hardcoded'
      });
    }
    
    // Add dynamic countries (if not already in hardcoded)
    const dynamicCountries = this.dynamicLoader.getAllCountries();
    for (const country of dynamicCountries) {
      if (!this.countryData.has(country.code)) {
        result.push({
          ...country,
          hasProvinces: country.provinceCount > 0,
          source: 'dynamic'
        });
      }
    }
    
    return result.sort((a, b) => b.provinceCount - a.provinceCount);
  }

  /**
   * Get province centroid for clustering
   */
  async getProvinceCentroid(provinceName, countryCode = null) {
    await this.initialize();
    
    if (countryCode) {
      // Use getCountryData to include both hardcoded and dynamic data
      const country = await this.getCountryData(countryCode);
      if (country && country.provinces) {
        const province = country.provinces.find(p => p.name === provinceName);
        if (province && province.centroid) {
          return province.centroid;
        }
      }
    }
    
    // Fallback: search all countries (hardcoded only)
    const province = this.provinceIndex.get(provinceName);
    if (province && province.centroid) {
      return province.centroid;
    }
    
    return null;
  }

  /**
   * Get statistics
   */
  async getStatistics() {
    await this.initialize();
    
    let totalProvinces = 0;
    let countriesWithProvinces = 0;
    
    for (const [code, data] of this.countryData.entries()) {
      if (data.provinces && data.provinces.length > 0) {
        countriesWithProvinces++;
        totalProvinces += data.provinces.length;
      }
    }
    
    return {
      totalCountries: this.countryData.size,
      countriesWithProvinces,
      totalProvinces,
      initialized: this.initialized
    };
  }
}

// Export singleton instance
const provinceDataService = new ProvinceDataService();
export default provinceDataService;