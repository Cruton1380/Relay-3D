-- PostgreSQL + PostGIS Schema for Voter Storage
-- Run this after creating database and enabling PostGIS extension

-- Create voters table
CREATE TABLE IF NOT EXISTS voters (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  candidate_id VARCHAR(255) NOT NULL,
  channel_id VARCHAR(255) NOT NULL,
  privacy_level VARCHAR(20) NOT NULL CHECK (privacy_level IN ('gps', 'city', 'province', 'anonymous')),
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  city VARCHAR(255),
  province VARCHAR(255),
  country VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_voters_candidate ON voters(candidate_id);
CREATE INDEX IF NOT EXISTS idx_voters_channel ON voters(channel_id);
CREATE INDEX IF NOT EXISTS idx_voters_privacy ON voters(privacy_level);
CREATE INDEX IF NOT EXISTS idx_voters_location ON voters USING GIST(location); -- Spatial index
CREATE INDEX IF NOT EXISTS idx_voters_created ON voters(created_at DESC);

-- Optional: H3 clustering table (for future optimization)
CREATE TABLE IF NOT EXISTS voter_clusters (
  id SERIAL PRIMARY KEY,
  candidate_id VARCHAR(255) NOT NULL,
  h3_index VARCHAR(20) NOT NULL,
  resolution INT NOT NULL CHECK (resolution BETWEEN 0 AND 15),
  voter_count INT NOT NULL DEFAULT 0,
  visible_count INT NOT NULL DEFAULT 0,
  hidden_count INT NOT NULL DEFAULT 0,
  centroid_lat DOUBLE PRECISION,
  centroid_lng DOUBLE PRECISION,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(candidate_id, h3_index)
);

CREATE INDEX IF NOT EXISTS idx_clusters_candidate ON voter_clusters(candidate_id);
CREATE INDEX IF NOT EXISTS idx_clusters_h3 ON voter_clusters(h3_index);
CREATE INDEX IF NOT EXISTS idx_clusters_resolution ON voter_clusters(resolution);

-- Comments for documentation
COMMENT ON TABLE voters IS 'Stores individual voter data with spatial indexing';
COMMENT ON COLUMN voters.location IS 'PostGIS geography point (lat/lng)';
COMMENT ON COLUMN voters.privacy_level IS 'Data granularity: gps, city, province, or anonymous';

COMMENT ON TABLE voter_clusters IS 'Pre-computed H3 hexagon clusters for fast rendering';
COMMENT ON COLUMN voter_clusters.h3_index IS 'H3 hexagon identifier';
COMMENT ON COLUMN voter_clusters.resolution IS 'H3 resolution (0=continental, 15=meter-level)';

