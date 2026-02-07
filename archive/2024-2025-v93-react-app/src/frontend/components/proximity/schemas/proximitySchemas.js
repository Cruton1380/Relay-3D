// Proximity Schemas — Beacon Model + Commit Schemas
// Defines proximity beacons, presence detection, and privacy enforcement

/**
 * Proximity Beacon Structure
 */
export function createProximityBeacon(type, tier, location, options = {}) {
  return {
    beaconId: options.beaconId || `beacon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type, // 'user' | 'venue' | 'event'
    tier, // 0-6
    category: options.category,
    name: options.name,
    tags: options.tags || [],
    location, // { lat, lng }
    channels: options.channels || [],
    signal: {
      rssi: options.rssi || -60, // Signal strength
      timestamp: Date.now(),
      ttl: options.ttl || (type === 'user' ? 30000 : 300000), // 30s for users, 5min for venues
    },
    metadata: options.metadata || {},
  };
}

/**
 * Calculate distance between two points (Haversine formula)
 */
export function calculateDistance(point1, point2) {
  const R = 6371000; // Earth radius in meters
  const lat1 = (point1.lat * Math.PI) / 180;
  const lat2 = (point2.lat * Math.PI) / 180;
  const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
  const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Resolve visible tier based on beacon, distance, and user policy
 */
export function resolveVisibleTier(beacon, userDistance, userPolicy) {
  // 1. Beacon declares its max tier
  const beaconTier = beacon.tier;

  // 2. User policy may restrict visibility
  const userMaxTier = userPolicy.maxTierForProximity || 6;

  // 3. Distance gate (only if close enough)
  const maxRange = userPolicy.radius || 500; // meters
  if (userDistance > maxRange) {
    return 0; // Out of range = invisible
  }

  // 4. Return minimum (most restrictive)
  return Math.min(beaconTier, userMaxTier);
}

/**
 * Update presence beacons (remove expired, calculate opacity)
 */
export function updatePresence(beacons) {
  const now = Date.now();

  // Remove expired beacons
  const activeBeacons = beacons.filter((beacon) => {
    const age = now - beacon.signal.timestamp;
    return age < beacon.signal.ttl;
  });

  // Calculate opacity based on age
  return activeBeacons.map((beacon) => {
    const age = now - beacon.signal.timestamp;
    const opacity = 1 - age / beacon.signal.ttl; // Fade as it ages

    return {
      ...beacon,
      opacity: Math.max(0.3, opacity), // Minimum 30% opacity
    };
  });
}

/**
 * Detect nearby beacons within user's proximity radius
 */
export function detectNearbyBeacons(userPosition, allBeacons, settings) {
  const now = Date.now();

  // Filter by distance + TTL
  const nearbyBeacons = allBeacons.filter((beacon) => {
    // Check TTL
    const age = now - beacon.signal.timestamp;
    if (age > beacon.signal.ttl) return false;

    // Check distance
    const distance = calculateDistance(userPosition, beacon.location);
    if (distance > settings.radius) return false;

    return true;
  });

  // Apply privacy ladder
  return nearbyBeacons.map((beacon) => {
    const distance = calculateDistance(userPosition, beacon.location);
    const tier = resolveVisibleTier(beacon, distance, settings);

    return {
      ...beacon,
      visibleTier: tier,
      distance,
    };
  });
}

/**
 * Generate mock beacons for Seattle downtown area
 */
export function generateMockBeacons() {
  const baseLocation = { lat: 47.609, lng: -122.342 }; // Pike Place Market

  const beacons = [];

  // User beacons (L1-L2)
  const userCount = 15;
  for (let i = 0; i < userCount; i++) {
    const tier = i % 3 === 0 ? 2 : 1; // Some L2 (tags), most L1 (anonymous)
    const tags = tier === 2 ? getRandomTags() : [];

    beacons.push(
      createProximityBeacon('user', tier, {
        lat: baseLocation.lat + (Math.random() - 0.5) * 0.01,
        lng: baseLocation.lng + (Math.random() - 0.5) * 0.01,
      }, {
        tags,
        ttl: 30000, // 30 seconds
      })
    );
  }

  // Venue beacons (cafés, stores, etc.)
  const venues = [
    {
      name: 'Blue Bottle Coffee',
      category: 'cafe',
      location: { lat: 47.6095, lng: -122.3425 },
      channels: ['menu', 'offers'],
    },
    {
      name: 'Pike Place Market',
      category: 'market',
      location: { lat: 47.609, lng: -122.342 },
      channels: ['vendors', 'events'],
    },
    {
      name: 'Elliott Bay Book Company',
      category: 'bookstore',
      location: { lat: 47.6105, lng: -122.3430 },
      channels: ['catalog', 'events'],
    },
    {
      name: 'The Crocodile',
      category: 'venue',
      location: { lat: 47.6184, lng: -122.3481 },
      channels: ['events', 'tickets'],
    },
    {
      name: 'Seattle Art Museum',
      category: 'museum',
      location: { lat: 47.6073, lng: -122.3385 },
      channels: ['exhibits', 'tickets'],
    },
    {
      name: 'Starbucks Reserve Roastery',
      category: 'cafe',
      location: { lat: 47.6145, lng: -122.3405 },
      channels: ['menu', 'tours'],
    },
  ];

  venues.forEach((venue) => {
    beacons.push(
      createProximityBeacon('venue', 5, venue.location, {
        beaconId: `venue:${venue.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: venue.name,
        category: venue.category,
        channels: venue.channels,
        ttl: 300000, // 5 minutes
      })
    );
  });

  // Event beacons
  const events = [
    {
      name: 'Local Indie Band Concert',
      venue: 'The Crocodile',
      location: { lat: 47.6184, lng: -122.3481 },
      startTime: Date.now() + 3600000, // 1 hour from now
    },
    {
      name: 'Contemporary Art Exhibition',
      venue: 'Seattle Art Museum',
      location: { lat: 47.6073, lng: -122.3385 },
      startTime: Date.now() + 7200000, // 2 hours from now
    },
  ];

  events.forEach((event) => {
    beacons.push(
      createProximityBeacon('event', 5, event.location, {
        beaconId: `event:${event.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: event.name,
        category: 'event',
        metadata: {
          venue: event.venue,
          startTime: event.startTime,
        },
        ttl: 3600000, // 1 hour
      })
    );
  });

  return beacons;
}

/**
 * Get random tags for user beacons
 */
function getRandomTags() {
  const allTags = [
    'hiking',
    'jazz',
    'photography',
    'coffee',
    'design',
    'coding',
    'music',
    'art',
    'travel',
    'books',
    'tech',
    'food',
  ];

  const count = 2 + Math.floor(Math.random() * 2); // 2-3 tags
  const shuffled = allTags.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Generate walk path through Seattle downtown
 */
export function generateWalkPath() {
  return [
    { lat: 47.609, lng: -122.342, name: 'Pike Place Market' },
    { lat: 47.610, lng: -122.343, name: '1st Ave & Pike St' },
    { lat: 47.612, lng: -122.344, name: '1st Ave & Union St' },
    { lat: 47.614, lng: -122.345, name: '1st Ave & University St' },
    { lat: 47.616, lng: -122.346, name: '1st Ave & Seneca St' },
    { lat: 47.618, lng: -122.348, name: 'Seattle Center' },
  ];
}
