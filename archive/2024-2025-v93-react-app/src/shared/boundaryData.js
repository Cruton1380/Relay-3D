/**
 * CENTRALIZED BOUNDARY DATA
 * Single source of truth for all country and province data
 * Used by both frontend and backend to ensure consistency
 */

export const BOUNDARY_DATA = {
  countries: [
    // North America
    { 
      name: 'United States', 
      code: 'US', 
      bounds: { north: 49.3457868, south: 24.7433195, east: -66.9513812, west: -124.7844079 }, 
      continent: 'North America' 
    },
    { 
      name: 'Canada', 
      code: 'CA', 
      bounds: { north: 83.6381, south: 41.6765559, east: -52.6480987, west: -141.0 }, 
      continent: 'North America' 
    },
    { 
      name: 'Mexico', 
      code: 'MX', 
      bounds: { north: 32.72083, south: 14.5388286, east: -86.811982, west: -118.453948 }, 
      continent: 'North America' 
    },

    // South America
    { 
      name: 'Brazil', 
      code: 'BR', 
      bounds: { north: 5.2717863, south: -33.7683777, east: -32.0953598, west: -73.9872354 }, 
      continent: 'South America' 
    },
    { 
      name: 'Argentina', 
      code: 'AR', 
      bounds: { north: -21.8323104, south: -55.1850761, east: -53.6374515, west: -73.4154357 }, 
      continent: 'South America' 
    },
    { 
      name: 'Chile', 
      code: 'CL', 
      bounds: { north: -17.498, south: -56.725, east: -66.417, west: -75.644 }, 
      continent: 'South America' 
    },

    // Europe
    { 
      name: 'United Kingdom', 
      code: 'GB', 
      bounds: { north: 60.91569999999999, south: 49.906193, east: 1.9134116, west: -7.6272211 }, 
      continent: 'Europe' 
    },
    { 
      name: 'France', 
      code: 'FR', 
      bounds: { north: 51.1, south: 41.3, east: 9.6, west: -5.6 }, 
      continent: 'Europe',
      provinces: [
        // Northern Regions
        { name: 'Hauts-de-France', bounds: { north: 51.1, south: 49.0, east: 4.0, west: 1.0 }, cities: ['Lille', 'Amiens', 'Calais'] },
        { name: 'Normandy', bounds: { north: 50.0, south: 48.0, east: 2.0, west: -2.0 }, cities: ['Rouen', 'Caen', 'Le Havre'] },
        { name: 'Brittany', bounds: { north: 49.0, south: 47.0, east: -1.0, west: -5.6 }, cities: ['Rennes', 'Brest', 'Nantes'] },
        { name: 'Pays de la Loire', bounds: { north: 48.5, south: 46.0, east: 1.0, west: -2.0 }, cities: ['Nantes', 'Angers', 'Le Mans'] },
        { name: 'Centre-Val de Loire', bounds: { north: 48.5, south: 46.5, east: 3.0, west: 0.0 }, cities: ['Orléans', 'Tours', 'Bourges'] },
        { name: 'Île-de-France', bounds: { north: 49.5, south: 48.0, east: 3.5, west: 1.5 }, cities: ['Paris', 'Versailles', 'Créteil'] },
        // Eastern Regions
        { name: 'Grand Est', bounds: { north: 50.0, south: 47.0, east: 8.0, west: 3.0 }, cities: ['Strasbourg', 'Nancy', 'Reims'] },
        { name: 'Bourgogne-Franche-Comté', bounds: { north: 48.0, south: 46.0, east: 7.0, west: 2.0 }, cities: ['Dijon', 'Besançon', 'Mâcon'] },
        { name: 'Auvergne-Rhône-Alpes', bounds: { north: 46.5, south: 44.0, east: 7.5, west: 2.0 }, cities: ['Lyon', 'Grenoble', 'Clermont-Ferrand'] },
        // Southern Regions
        { name: 'Occitanie', bounds: { north: 45.0, south: 42.0, east: 4.5, west: -1.0 }, cities: ['Toulouse', 'Montpellier', 'Nîmes'] },
        { name: 'Provence-Alpes-Côte d\'Azur', bounds: { north: 45.0, south: 43.0, east: 7.5, west: 4.5 }, cities: ['Marseille', 'Nice', 'Toulon'] },
        { name: 'Nouvelle-Aquitaine', bounds: { north: 47.0, south: 43.0, east: 2.0, west: -2.0 }, cities: ['Bordeaux', 'Poitiers', 'Limoges'] },
        { name: 'Corsica', bounds: { north: 43.0, south: 41.3, east: 9.6, west: 8.5 }, cities: ['Ajaccio', 'Bastia', 'Porto-Vecchio'] }
      ]
    },
    { 
      name: 'Germany', 
      code: 'DE', 
      bounds: { north: 55.0815, south: 47.2701114, east: 15.0418962, west: 5.8663425 }, 
      continent: 'Europe' 
    },
    { 
      name: 'Italy', 
      code: 'IT', 
      bounds: { north: 46.5, south: 37.5, east: 18.0, west: 7.5 }, 
      continent: 'Europe',
      provinces: [
        // Northern Regions
        { name: 'Piedmont', bounds: { north: 46.5, south: 44.0, east: 9.0, west: 6.5 }, cities: ['Turin', 'Alessandria', 'Novara'] },
        { name: 'Lombardy', bounds: { north: 46.5, south: 44.5, east: 11.0, west: 8.5 }, cities: ['Milan', 'Bergamo', 'Brescia'] },
        { name: 'Veneto', bounds: { north: 46.5, south: 44.5, east: 13.0, west: 10.5 }, cities: ['Venice', 'Verona', 'Padua'] },
        { name: 'Friuli-Venezia Giulia', bounds: { north: 46.5, south: 45.5, east: 13.5, west: 12.5 }, cities: ['Trieste', 'Udine', 'Pordenone'] },
        { name: 'Trentino-Alto Adige', bounds: { north: 47.0, south: 45.5, east: 12.0, west: 10.5 }, cities: ['Trento', 'Bolzano', 'Merano'] },
        { name: 'Emilia-Romagna', bounds: { north: 45.0, south: 43.0, east: 12.5, west: 9.5 }, cities: ['Bologna', 'Modena', 'Parma'] },
        { name: 'Liguria', bounds: { north: 44.5, south: 43.5, east: 10.0, west: 7.5 }, cities: ['Genoa', 'La Spezia', 'Savona'] },
        // Central Regions
        { name: 'Tuscany', bounds: { north: 44.5, south: 42.5, east: 12.0, west: 9.5 }, cities: ['Florence', 'Pisa', 'Siena'] },
        { name: 'Umbria', bounds: { north: 43.5, south: 42.5, east: 13.0, west: 11.5 }, cities: ['Perugia', 'Terni', 'Assisi'] },
        { name: 'Marche', bounds: { north: 44.0, south: 42.5, east: 14.0, west: 12.5 }, cities: ['Ancona', 'Pesaro', 'Macerata'] },
        { name: 'Lazio', bounds: { north: 43.0, south: 41.0, east: 13.5, west: 11.5 }, cities: ['Rome', 'Viterbo', 'Latina'] },
        { name: 'Abruzzo', bounds: { north: 43.0, south: 41.5, east: 14.5, west: 13.0 }, cities: ['L\'Aquila', 'Pescara', 'Chieti'] },
        { name: 'Molise', bounds: { north: 42.0, south: 41.5, east: 15.0, west: 14.0 }, cities: ['Campobasso', 'Isernia', 'Termoli'] },
        // Southern Regions
        { name: 'Campania', bounds: { north: 41.5, south: 39.5, east: 15.5, west: 13.5 }, cities: ['Naples', 'Salerno', 'Caserta'] },
        { name: 'Puglia', bounds: { north: 42.0, south: 39.5, east: 18.5, west: 15.0 }, cities: ['Bari', 'Lecce', 'Foggia'] },
        { name: 'Basilicata', bounds: { north: 41.0, south: 39.5, east: 16.5, west: 15.0 }, cities: ['Potenza', 'Matera', 'Policoro'] },
        { name: 'Calabria', bounds: { north: 40.0, south: 37.5, east: 17.0, west: 15.5 }, cities: ['Catanzaro', 'Reggio Calabria', 'Cosenza'] },
        // Islands
        { name: 'Sicily', bounds: { north: 38.5, south: 36.5, east: 15.0, west: 12.5 }, cities: ['Palermo', 'Catania', 'Messina'] },
        { name: 'Sardinia', bounds: { north: 41.5, south: 38.5, east: 10.0, west: 7.5 }, cities: ['Cagliari', 'Sassari', 'Nuoro'] },
        { name: 'Aosta Valley', bounds: { north: 46.5, south: 45.5, east: 8.0, west: 6.5 }, cities: ['Aosta', 'Courmayeur', 'Châtillon'] }
      ]
    },
    { 
      name: 'Spain', 
      code: 'ES', 
      bounds: { north: 43.8, south: 27.6, east: 3.3, west: -18.0 }, 
      continent: 'Europe',
      provinces: [
        // Northern Regions
        { name: 'Galicia', bounds: { north: 43.8, south: 41.8, east: -6.0, west: -9.3 }, cities: ['Santiago de Compostela', 'A Coruña', 'Vigo'] },
        { name: 'Asturias', bounds: { north: 43.6, south: 42.8, east: -4.5, west: -7.0 }, cities: ['Oviedo', 'Gijón', 'Avilés'] },
        { name: 'Cantabria', bounds: { north: 43.5, south: 42.8, east: -3.0, west: -4.5 }, cities: ['Santander', 'Torrelavega', 'Castro Urdiales'] },
        { name: 'Basque Country', bounds: { north: 43.4, south: 42.5, east: -1.0, west: -3.0 }, cities: ['Bilbao', 'Vitoria-Gasteiz', 'San Sebastián'] },
        { name: 'Navarre', bounds: { north: 43.2, south: 42.0, east: -0.5, west: -2.0 }, cities: ['Pamplona', 'Tudela', 'Estella'] },
        { name: 'La Rioja', bounds: { north: 42.5, south: 41.8, east: -1.5, west: -3.0 }, cities: ['Logroño', 'Calahorra', 'Arnedo'] },
        { name: 'Aragon', bounds: { north: 42.8, south: 40.0, east: 0.5, west: -1.5 }, cities: ['Zaragoza', 'Huesca', 'Teruel'] },
        { name: 'Catalonia', bounds: { north: 42.8, south: 40.5, east: 3.3, west: 0.5 }, cities: ['Barcelona', 'Girona', 'Lleida', 'Tarragona'] },
        // Central Regions
        { name: 'Castile and León', bounds: { north: 43.0, south: 40.0, east: -1.0, west: -6.0 }, cities: ['Valladolid', 'León', 'Burgos', 'Salamanca'] },
        { name: 'Madrid', bounds: { north: 41.0, south: 40.0, east: -3.0, west: -4.0 }, cities: ['Madrid', 'Alcalá de Henares', 'Getafe'] },
        { name: 'Castile-La Mancha', bounds: { north: 40.5, south: 38.5, east: -1.0, west: -4.0 }, cities: ['Toledo', 'Albacete', 'Ciudad Real'] },
        { name: 'Extremadura', bounds: { north: 40.5, south: 37.5, east: -4.5, west: -7.5 }, cities: ['Mérida', 'Badajoz', 'Cáceres'] },
        // Southern Regions
        { name: 'Andalusia', bounds: { north: 38.8, south: 36.0, east: -1.0, west: -7.5 }, cities: ['Seville', 'Málaga', 'Córdoba', 'Granada'] },
        { name: 'Murcia', bounds: { north: 38.5, south: 37.5, east: -0.5, west: -2.0 }, cities: ['Murcia', 'Cartagena', 'Lorca'] },
        { name: 'Valencia', bounds: { north: 40.5, south: 38.5, east: 0.5, west: -1.0 }, cities: ['Valencia', 'Alicante', 'Castellón'] },
        // Islands
        { name: 'Balearic Islands', bounds: { north: 40.0, south: 38.5, east: 3.3, west: 1.0 }, cities: ['Palma', 'Ibiza', 'Menorca'] },
        { name: 'Canary Islands', bounds: { north: 29.5, south: 27.6, east: -13.0, west: -18.0 }, cities: ['Las Palmas', 'Santa Cruz de Tenerife'] }
      ]
    },
    { 
      name: 'Russia', 
      code: 'RU', 
      bounds: { north: 81.2504, south: 41.1850968, east: -169.0500, west: 19.6389 }, 
      continent: 'Europe/Asia' 
    },
    { 
      name: 'Turkey', 
      code: 'TR', 
      bounds: { north: 42.107613, south: 35.815562, east: 44.834999, west: 25.668432 }, 
      continent: 'Asia' 
    },
    { 
      name: 'Poland', 
      code: 'PL', 
      bounds: { north: 54.8358, south: 49.0021, east: 24.1458, west: 14.1228 }, 
      continent: 'Europe' 
    },
    { 
      name: 'Netherlands', 
      code: 'NL', 
      bounds: { north: 53.5104, south: 50.7503, east: 7.2274, west: 3.3588 }, 
      continent: 'Europe' 
    },
    { 
      name: 'Belgium', 
      code: 'BE', 
      bounds: { north: 51.5051, south: 49.4969, east: 6.4081, west: 2.5419 }, 
      continent: 'Europe' 
    },
    { 
      name: 'Switzerland', 
      code: 'CH', 
      bounds: { north: 47.8084, south: 45.8179, east: 10.4923, west: 5.9559 }, 
      continent: 'Europe' 
    },
    { 
      name: 'Austria', 
      code: 'AT', 
      bounds: { north: 49.0205, south: 46.3722, east: 17.1608, west: 9.5307 }, 
      continent: 'Europe' 
    },
    { 
      name: 'Greece', 
      code: 'GR', 
      bounds: { north: 41.7488, south: 34.8021, east: 29.6469, west: 19.3736 }, 
      continent: 'Europe' 
    },
    { 
      name: 'Portugal', 
      code: 'PT', 
      bounds: { north: 42.1543, south: 36.9613, east: -6.1891, west: -9.5266 }, 
      continent: 'Europe' 
    },
    { 
      name: 'Czech Republic', 
      code: 'CZ', 
      bounds: { north: 51.0557, south: 48.5518, east: 18.8592, west: 12.0905 }, 
      continent: 'Europe' 
    },
    { 
      name: 'Hungary', 
      code: 'HU', 
      bounds: { north: 48.5853, south: 45.7370, east: 22.8977, west: 16.1138 }, 
      continent: 'Europe' 
    },
    { 
      name: 'Romania', 
      code: 'RO', 
      bounds: { north: 48.2658, south: 43.6187, east: 29.7151, west: 20.2619 }, 
      continent: 'Europe' 
    },
    { 
      name: 'Ukraine', 
      code: 'UA', 
      bounds: { north: 52.3791, south: 44.3865, east: 40.2275, west: 22.1371 }, 
      continent: 'Europe' 
    },
    { 
      name: 'Sweden', 
      code: 'SE', 
      bounds: { north: 69.0599, south: 55.3370, east: 24.1665, west: 11.1183 }, 
      continent: 'Europe' 
    },
    { 
      name: 'Norway', 
      code: 'NO', 
      bounds: { north: 71.1853, south: 57.9770, east: 31.0785, west: 4.6508 }, 
      continent: 'Europe' 
    },
    { 
      name: 'Denmark', 
      code: 'DK', 
      bounds: { north: 57.7509, south: 54.5596, east: 15.1935, west: 8.0761 }, 
      continent: 'Europe' 
    },
    { 
      name: 'Finland', 
      code: 'FI', 
      bounds: { north: 70.0922, south: 59.8089, east: 31.5867, west: 20.5465 }, 
      continent: 'Europe' 
    },
    { 
      name: 'Ireland', 
      code: 'IE', 
      bounds: { north: 55.3879, south: 51.4220, east: -5.9933, west: -10.4783 }, 
      continent: 'Europe' 
    },

    // Asia
    { 
      name: 'China', 
      code: 'CN', 
      bounds: { north: 53.5609739, south: 15.7754, east: 134.7754563, west: 73.4994136 }, 
      continent: 'Asia' 
    },
    { 
      name: 'Japan', 
      code: 'JP', 
      bounds: { north: 45.7112046, south: 20.2145811, east: 148.3249093, west: 122.7141754 }, 
      continent: 'Asia' 
    },
    { 
      name: 'India', 
      code: 'IN', 
      bounds: { north: 37.5, south: 6.4627, east: 97.395561, west: 68.1113787 }, 
      continent: 'Asia' 
    },
    { 
      name: 'South Korea', 
      code: 'KR', 
      bounds: { north: 38.6122, south: 33.1906, east: 131.8722, west: 124.6106 }, 
      continent: 'Asia' 
    },
    { 
      name: 'Indonesia', 
      code: 'ID', 
      bounds: { north: 6.2744, south: -11.1094, east: 141.0194, west: 95.0094 }, 
      continent: 'Asia' 
    },
    { 
      name: 'Thailand', 
      code: 'TH', 
      bounds: { north: 20.4648, south: 5.6133, east: 105.6394, west: 97.3456 }, 
      continent: 'Asia' 
    },
    { 
      name: 'Vietnam', 
      code: 'VN', 
      bounds: { north: 23.3926, south: 8.5596, east: 109.4644, west: 102.1444 }, 
      continent: 'Asia' 
    },
    { 
      name: 'Philippines', 
      code: 'PH', 
      bounds: { north: 21.3217, south: 4.6439, east: 126.6051, west: 116.9406 }, 
      continent: 'Asia' 
    },
    { 
      name: 'Malaysia', 
      code: 'MY', 
      bounds: { north: 7.3634, south: 0.8536, east: 119.2671, west: 99.6438 }, 
      continent: 'Asia' 
    },
    { 
      name: 'Singapore', 
      code: 'SG', 
      bounds: { north: 1.4707, south: 1.1579, east: 104.0943, west: 103.6050 }, 
      continent: 'Asia' 
    },
    { 
      name: 'Bangladesh', 
      code: 'BD', 
      bounds: { north: 26.6319, south: 20.7438, east: 92.6739, west: 88.0284 }, 
      continent: 'Asia' 
    },
    { 
      name: 'Pakistan', 
      code: 'PK', 
      bounds: { north: 37.0841, south: 23.6345, east: 77.8375, west: 60.8726 }, 
      continent: 'Asia' 
    },
    { 
      name: 'Saudi Arabia', 
      code: 'SA', 
      bounds: { north: 32.1543, south: 16.3791, east: 55.6667, west: 34.4957 }, 
      continent: 'Asia' 
    },
    { 
      name: 'Israel', 
      code: 'IL', 
      bounds: { north: 33.3356, south: 29.4969, east: 35.8763, west: 34.2674 }, 
      continent: 'Asia' 
    },
    { 
      name: 'Taiwan', 
      code: 'TW', 
      bounds: { north: 25.2954, south: 21.8971, east: 122.0066, west: 120.0385 }, 
      continent: 'Asia' 
    },

    // Africa
    { 
      name: 'South Africa', 
      code: 'ZA', 
      bounds: { north: -22.0913127, south: -47.1313489, east: 38.2898954, west: 16.2335213 }, 
      continent: 'Africa' 
    },
    { 
      name: 'Egypt', 
      code: 'EG', 
      bounds: { north: 31.8330854, south: 21.725389, east: 37.1153517, west: 24.6499112 }, 
      continent: 'Africa' 
    },
    { 
      name: 'Nigeria', 
      code: 'NG', 
      bounds: { north: 13.9571949, south: 4.0690959, east: 14.9994395, west: 2.6917 }, 
      continent: 'Africa' 
    },
    { 
      name: 'Kenya', 
      code: 'KE', 
      bounds: { north: 5.506, south: -4.8995204, east: 41.8550830, west: 33.8935689 }, 
      continent: 'Africa' 
    },
    { 
      name: 'Ghana', 
      code: 'GH', 
      bounds: { north: 11.1733, south: 4.7370, east: 1.1991, west: -3.2602 }, 
      continent: 'Africa' 
    },
    { 
      name: 'Morocco', 
      code: 'MA', 
      bounds: { north: 35.9224966, south: 21.0, east: -0.9969756, west: -17.2551456 }, 
      continent: 'Africa' 
    },

    // Oceania
    { 
      name: 'Australia', 
      code: 'AU', 
      bounds: { north: -9.0882278, south: -55.3228175, east: 159.5694794, west: 112.6997261 }, 
      continent: 'Oceania' 
    },
    { 
      name: 'New Zealand', 
      code: 'NZ', 
      bounds: { north: -34.3951, south: -47.2869, east: 178.5750, west: 166.4260 }, 
      continent: 'Oceania' 
    }
  ]
};

/**
 * Get all countries
 */
export function getAllCountries() {
  return BOUNDARY_DATA.countries;
}

/**
 * Get country by code
 */
export function getCountryByCode(code) {
  return BOUNDARY_DATA.countries.find(c => c.code === code);
}

/**
 * Get country by name
 */
export function getCountryByName(name) {
  return BOUNDARY_DATA.countries.find(c => c.name === name);
}

/**
 * Get all countries with provinces
 */
export function getCountriesWithProvinces() {
  return BOUNDARY_DATA.countries.filter(c => c.provinces && c.provinces.length > 0);
}

/**
 * Get provinces for a country
 */
export function getProvinces(countryCode) {
  const country = getCountryByCode(countryCode);
  return country?.provinces || [];
}

/**
 * Get all unique continents
 */
export function getContinents() {
  const continents = new Set();
  BOUNDARY_DATA.countries.forEach(c => continents.add(c.continent));
  return Array.from(continents).sort();
}

/**
 * Get countries by continent
 */
export function getCountriesByContinent(continent) {
  return BOUNDARY_DATA.countries.filter(c => c.continent === continent);
}
