-- Relay Platform Production Database Schema
-- PostgreSQL implementation for biometric password dance and trust system

-- Create database and user (run as postgres superuser)
-- CREATE DATABASE relay_db;
-- CREATE USER relay_user WITH ENCRYPTED PASSWORD 'your_secure_password';
-- GRANT ALL PRIVILEGES ON DATABASE relay_db TO relay_user;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table with enhanced security
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    trust_level VARCHAR(50) DEFAULT 'probationary',
    trust_score INTEGER DEFAULT 0,
    device_binding_id UUID UNIQUE,
    location_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    verification_due TIMESTAMP WITH TIME ZONE
);

-- Biometric password dance enrollments
CREATE TABLE password_dance_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phrase_hash VARCHAR(255) NOT NULL,
    gesture_type VARCHAR(50) NOT NULL,
    audio_vector_encrypted BYTEA NOT NULL,
    gesture_vector_encrypted BYTEA NOT NULL,
    combined_vector_hash VARCHAR(255) NOT NULL,
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verification_count INTEGER DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    security_level VARCHAR(20) DEFAULT 'standard'
);

-- Trust activity tracking
CREATE TABLE trust_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    points_awarded INTEGER NOT NULL,
    details JSONB,
    location_context VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_by UUID REFERENCES users(id)
);

-- Verification attempts and results
CREATE TABLE verification_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    verification_type VARCHAR(50) NOT NULL, -- 'password_dance', 'biometric', 'hotspot'
    challenge_data JSONB,
    result BOOLEAN NOT NULL,
    confidence_score DECIMAL(5,3),
    risk_factors JSONB,
    ip_address INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community hotspots
CREATE TABLE community_hotspots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    radius_meters INTEGER DEFAULT 50,
    operator_user_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    verification_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hotspot check-ins
CREATE TABLE hotspot_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hotspot_id UUID NOT NULL REFERENCES community_hotspots(id) ON DELETE CASCADE,
    checkin_method VARCHAR(50) NOT NULL, -- 'bluetooth', 'qr', 'nfc'
    dwell_time_seconds INTEGER,
    verification_completed BOOLEAN DEFAULT false,
    trust_points_awarded INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API rate limiting tracking
CREATE TABLE rate_limit_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier VARCHAR(255) NOT NULL, -- IP address or user ID
    endpoint VARCHAR(255) NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    blocked_until TIMESTAMP WITH TIME ZONE
);

-- Security audit log
CREATE TABLE security_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    event_type VARCHAR(100) NOT NULL,
    event_details JSONB,
    risk_level VARCHAR(20) DEFAULT 'low',
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_trust_level ON users(trust_level);
CREATE INDEX idx_users_trust_score ON users(trust_score);
CREATE INDEX idx_password_dance_user_id ON password_dance_enrollments(user_id);
CREATE INDEX idx_trust_activities_user_id ON trust_activities(user_id);
CREATE INDEX idx_trust_activities_timestamp ON trust_activities(timestamp);
CREATE INDEX idx_verification_attempts_user_id ON verification_attempts(user_id);
CREATE INDEX idx_verification_attempts_timestamp ON verification_attempts(timestamp);
CREATE INDEX idx_hotspot_checkins_user_id ON hotspot_checkins(user_id);
CREATE INDEX idx_hotspot_checkins_hotspot_id ON hotspot_checkins(hotspot_id);
CREATE INDEX idx_rate_limit_identifier ON rate_limit_tracking(identifier, endpoint);
CREATE INDEX idx_security_audit_timestamp ON security_audit_log(timestamp);

-- Triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hotspots_updated_at BEFORE UPDATE ON community_hotspots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for development
INSERT INTO community_hotspots (name, description, latitude, longitude, radius_meters) VALUES
('Central Library', 'Downtown public library with community meeting rooms', 40.7589, -73.9851, 30),
('Community Center', 'Local community center with verified meeting space', 40.7614, -73.9776, 25),
('Tech Hub Cafe', 'Coffee shop popular with local tech community', 40.7505, -73.9934, 40);

-- Views for common queries
CREATE VIEW user_trust_summary AS
SELECT 
    u.id,
    u.username,
    u.trust_level,
    u.trust_score,
    COUNT(ta.id) as total_activities,
    MAX(ta.timestamp) as last_activity,
    CASE WHEN pd.id IS NOT NULL THEN true ELSE false END as has_password_dance
FROM users u
LEFT JOIN trust_activities ta ON u.id = ta.user_id
LEFT JOIN password_dance_enrollments pd ON u.id = pd.user_id AND pd.is_active = true
GROUP BY u.id, u.username, u.trust_level, u.trust_score, pd.id;

CREATE VIEW recent_security_events AS
SELECT 
    sal.timestamp,
    sal.event_type,
    sal.risk_level,
    u.username,
    sal.ip_address,
    sal.event_details
FROM security_audit_log sal
LEFT JOIN users u ON sal.user_id = u.id
WHERE sal.timestamp > NOW() - INTERVAL '24 hours'
ORDER BY sal.timestamp DESC;
