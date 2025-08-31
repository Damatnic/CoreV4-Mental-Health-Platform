-- Mental Health Platform Database Schema
-- PostgreSQL 15+ with HIPAA-compliant encryption and audit logging

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS encrypted;

-- Set default search path
SET search_path TO app, public;

-- =====================================================
-- ENUM TYPES
-- =====================================================

CREATE TYPE user_role AS ENUM (
    'patient',
    'therapist',
    'psychiatrist',
    'admin',
    'crisis_counselor',
    'moderator'
);

CREATE TYPE appointment_status AS ENUM (
    'scheduled',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled',
    'no_show'
);

CREATE TYPE appointment_type AS ENUM (
    'initial',
    'followup',
    'crisis',
    'group'
);

CREATE TYPE appointment_format AS ENUM (
    'in_person',
    'video',
    'phone'
);

CREATE TYPE crisis_severity AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);

CREATE TYPE crisis_status AS ENUM (
    'waiting',
    'active',
    'resolved',
    'escalated'
);

CREATE TYPE payment_method AS ENUM (
    'insurance',
    'self_pay',
    'sliding_scale'
);

CREATE TYPE payment_status AS ENUM (
    'pending',
    'paid',
    'failed',
    'refunded'
);

CREATE TYPE notification_priority AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);

CREATE TYPE post_visibility AS ENUM (
    'public',
    'group',
    'connections',
    'private'
);

-- =====================================================
-- USERS AND AUTHENTICATION
-- =====================================================

CREATE TABLE app.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'patient',
    
    -- Profile data (encrypted)
    profile_data JSONB,
    
    -- Account status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    
    -- Indexes
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email ON app.users(email);
CREATE INDEX idx_users_username ON app.users(username);
CREATE INDEX idx_users_role ON app.users(role);
CREATE INDEX idx_users_active ON app.users(is_active) WHERE is_active = true;

-- User sessions for authentication
CREATE TABLE app.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_token UNIQUE(token_hash)
);

CREATE INDEX idx_sessions_user ON app.user_sessions(user_id);
CREATE INDEX idx_sessions_token ON app.user_sessions(token_hash);
CREATE INDEX idx_sessions_expires ON app.user_sessions(expires_at);

-- =====================================================
-- MENTAL HEALTH DATA
-- =====================================================

-- Mood tracking
CREATE TABLE app.mood_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    mood_value INTEGER NOT NULL CHECK (mood_value BETWEEN 1 AND 5),
    emotions JSONB,
    triggers TEXT[],
    activities TEXT[],
    notes TEXT,
    location VARCHAR(255),
    weather_data JSONB,
    sleep_data JSONB,
    medication_data JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Partitioning by month for performance
    CONSTRAINT mood_entry_date CHECK (created_at >= '2024-01-01')
) PARTITION BY RANGE (created_at);

-- Create partitions for mood entries
CREATE TABLE app.mood_entries_2024_08 PARTITION OF app.mood_entries
    FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');
CREATE TABLE app.mood_entries_2024_09 PARTITION OF app.mood_entries
    FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');
CREATE TABLE app.mood_entries_2024_10 PARTITION OF app.mood_entries
    FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');

CREATE INDEX idx_mood_user_date ON app.mood_entries(user_id, created_at DESC);

-- Safety plans
CREATE TABLE app.safety_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    warning_signals TEXT[],
    coping_strategies JSONB,
    distractions TEXT[],
    support_contacts JSONB,
    professional_contacts JSONB,
    safe_environment JSONB,
    reasons_to_live TEXT[],
    shared_with UUID[],
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_reviewed TIMESTAMPTZ,
    
    CONSTRAINT one_plan_per_user UNIQUE(user_id)
);

CREATE INDEX idx_safety_plans_user ON app.safety_plans(user_id);

-- =====================================================
-- CRISIS SUPPORT
-- =====================================================

CREATE TABLE app.crisis_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    counselor_id UUID REFERENCES app.users(id),
    severity crisis_severity NOT NULL,
    status crisis_status NOT NULL DEFAULT 'waiting',
    session_type VARCHAR(20) NOT NULL DEFAULT 'chat',
    
    -- Encrypted transcript
    transcript_encrypted BYTEA,
    
    outcome JSONB,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_scheduled TIMESTAMPTZ,
    
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMPTZ,
    
    -- Geolocation for emergency services
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    
    CONSTRAINT counselor_role_check CHECK (
        counselor_id IS NULL OR 
        EXISTS (SELECT 1 FROM app.users WHERE id = counselor_id AND role IN ('crisis_counselor', 'therapist', 'psychiatrist'))
    )
);

CREATE INDEX idx_crisis_user ON app.crisis_sessions(user_id);
CREATE INDEX idx_crisis_counselor ON app.crisis_sessions(counselor_id);
CREATE INDEX idx_crisis_status ON app.crisis_sessions(status);
CREATE INDEX idx_crisis_severity ON app.crisis_sessions(severity);
CREATE INDEX idx_crisis_active ON app.crisis_sessions(status) WHERE status IN ('waiting', 'active');

-- =====================================================
-- PROFESSIONAL SUPPORT
-- =====================================================

CREATE TABLE app.therapists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    
    -- Credentials (encrypted)
    credentials_encrypted BYTEA NOT NULL,
    
    specializations TEXT[],
    languages TEXT[],
    insurance_accepted TEXT[],
    
    -- Availability
    availability JSONB,
    accepting_new_clients BOOLEAN DEFAULT true,
    
    -- Rates
    session_rate DECIMAL(10, 2),
    sliding_scale BOOLEAN DEFAULT false,
    sliding_scale_min DECIMAL(10, 2),
    sliding_scale_max DECIMAL(10, 2),
    
    -- Verification
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    license_expiry DATE,
    
    -- Statistics
    total_sessions INTEGER DEFAULT 0,
    average_rating DECIMAL(3, 2),
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT therapist_user_unique UNIQUE(user_id),
    CONSTRAINT therapist_role_check CHECK (
        EXISTS (SELECT 1 FROM app.users WHERE id = user_id AND role IN ('therapist', 'psychiatrist'))
    )
);

CREATE INDEX idx_therapists_user ON app.therapists(user_id);
CREATE INDEX idx_therapists_verified ON app.therapists(is_verified);
CREATE INDEX idx_therapists_accepting ON app.therapists(accepting_new_clients);
CREATE INDEX idx_therapists_specializations ON app.therapists USING GIN(specializations);

-- Therapist ratings
CREATE TABLE app.therapist_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    therapist_id UUID NOT NULL REFERENCES app.therapists(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT one_rating_per_user UNIQUE(therapist_id, user_id)
);

CREATE INDEX idx_ratings_therapist ON app.therapist_ratings(therapist_id);
CREATE INDEX idx_ratings_user ON app.therapist_ratings(user_id);

-- =====================================================
-- APPOINTMENTS
-- =====================================================

CREATE TABLE app.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    therapist_id UUID NOT NULL REFERENCES app.therapists(id) ON DELETE CASCADE,
    
    scheduled_time TIMESTAMPTZ NOT NULL,
    duration INTEGER NOT NULL DEFAULT 50, -- minutes
    type appointment_type NOT NULL,
    format appointment_format NOT NULL,
    status appointment_status NOT NULL DEFAULT 'scheduled',
    
    -- Video call info
    video_room_id VARCHAR(255),
    video_url TEXT,
    
    -- Notes (encrypted)
    notes_encrypted BYTEA,
    
    -- Payment
    payment_data JSONB,
    
    -- Reminders
    reminder_settings JSONB,
    reminder_sent BOOLEAN DEFAULT false,
    
    -- Cancellation
    cancelled_by UUID REFERENCES app.users(id),
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT appointment_time_check CHECK (scheduled_time > created_at),
    CONSTRAINT duration_check CHECK (duration > 0 AND duration <= 180)
);

CREATE INDEX idx_appointments_patient ON app.appointments(patient_id);
CREATE INDEX idx_appointments_therapist ON app.appointments(therapist_id);
CREATE INDEX idx_appointments_scheduled ON app.appointments(scheduled_time);
CREATE INDEX idx_appointments_status ON app.appointments(status);
CREATE INDEX idx_appointments_upcoming ON app.appointments(scheduled_time) 
    WHERE status IN ('scheduled', 'confirmed') AND scheduled_time > CURRENT_TIMESTAMP;

-- =====================================================
-- COMMUNITY FEATURES
-- =====================================================

CREATE TABLE app.support_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    
    moderator_ids UUID[],
    member_ids UUID[],
    
    rules TEXT[],
    is_private BOOLEAN DEFAULT false,
    requires_approval BOOLEAN DEFAULT false,
    
    meeting_schedule JSONB,
    resources JSONB,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT group_name_unique UNIQUE(name)
);

CREATE INDEX idx_groups_category ON app.support_groups(category);
CREATE INDEX idx_groups_private ON app.support_groups(is_private);
CREATE INDEX idx_groups_members ON app.support_groups USING GIN(member_ids);

CREATE TABLE app.community_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES app.support_groups(id) ON DELETE CASCADE,
    
    title VARCHAR(255),
    content TEXT NOT NULL,
    tags TEXT[],
    post_type VARCHAR(50),
    visibility post_visibility NOT NULL DEFAULT 'public',
    
    likes UUID[] DEFAULT '{}',
    
    is_reported BOOLEAN DEFAULT false,
    is_moderated BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_posts_author ON app.community_posts(author_id);
CREATE INDEX idx_posts_group ON app.community_posts(group_id);
CREATE INDEX idx_posts_created ON app.community_posts(created_at DESC);
CREATE INDEX idx_posts_tags ON app.community_posts USING GIN(tags);
CREATE INDEX idx_posts_visible ON app.community_posts(visibility, is_deleted) 
    WHERE is_deleted = false;

CREATE TABLE app.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES app.community_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES app.comments(id) ON DELETE CASCADE,
    
    content TEXT NOT NULL,
    likes UUID[] DEFAULT '{}',
    
    is_reported BOOLEAN DEFAULT false,
    is_hidden BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_comments_post ON app.comments(post_id);
CREATE INDEX idx_comments_author ON app.comments(author_id);
CREATE INDEX idx_comments_parent ON app.comments(parent_id);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

CREATE TABLE app.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB,
    
    priority notification_priority DEFAULT 'medium',
    
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ
);

CREATE INDEX idx_notifications_user ON app.notifications(user_id);
CREATE INDEX idx_notifications_unread ON app.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created ON app.notifications(created_at DESC);

-- =====================================================
-- AUDIT LOGGING (HIPAA Compliance)
-- =====================================================

CREATE TABLE audit.access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    ip_address INET,
    user_agent TEXT,
    
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    
    request_method VARCHAR(10),
    request_path TEXT,
    request_body JSONB,
    
    response_status INTEGER,
    response_time_ms INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Create partitions for audit logs
CREATE TABLE audit.access_logs_2024_08 PARTITION OF audit.access_logs
    FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');
CREATE TABLE audit.access_logs_2024_09 PARTITION OF audit.access_logs
    FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');

CREATE INDEX idx_audit_user ON audit.access_logs(user_id);
CREATE INDEX idx_audit_created ON audit.access_logs(created_at DESC);
CREATE INDEX idx_audit_action ON audit.access_logs(action);

-- Data change audit
CREATE TABLE audit.data_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    user_id UUID,
    
    operation VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    changed_fields TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

CREATE TABLE audit.data_changes_2024_08 PARTITION OF audit.data_changes
    FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');

CREATE INDEX idx_changes_table ON audit.data_changes(table_name);
CREATE INDEX idx_changes_record ON audit.data_changes(record_id);
CREATE INDEX idx_changes_user ON audit.data_changes(user_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON app.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_therapists_updated_at BEFORE UPDATE ON app.therapists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON app.appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Audit logging trigger
CREATE OR REPLACE FUNCTION audit_data_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit.data_changes (
        table_name,
        record_id,
        user_id,
        operation,
        old_data,
        new_data
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        current_setting('app.current_user_id', true)::UUID,
        TG_OP,
        to_jsonb(OLD),
        to_jsonb(NEW)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_users_changes AFTER INSERT OR UPDATE OR DELETE ON app.users
    FOR EACH ROW EXECUTE FUNCTION audit_data_change();
CREATE TRIGGER audit_appointments_changes AFTER INSERT OR UPDATE OR DELETE ON app.appointments
    FOR EACH ROW EXECUTE FUNCTION audit_data_change();
CREATE TRIGGER audit_crisis_sessions_changes AFTER INSERT OR UPDATE OR DELETE ON app.crisis_sessions
    FOR EACH ROW EXECUTE FUNCTION audit_data_change();

-- Update therapist rating average
CREATE OR REPLACE FUNCTION update_therapist_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE app.therapists
    SET average_rating = (
        SELECT AVG(rating)::DECIMAL(3,2)
        FROM app.therapist_ratings
        WHERE therapist_id = NEW.therapist_id
    )
    WHERE id = NEW.therapist_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_therapist_avg_rating AFTER INSERT OR UPDATE ON app.therapist_ratings
    FOR EACH ROW EXECUTE FUNCTION update_therapist_rating();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE app.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.safety_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.appointments ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY users_own_data ON app.users
    FOR ALL USING (id = current_setting('app.current_user_id', true)::UUID);

CREATE POLICY mood_entries_own_data ON app.mood_entries
    FOR ALL USING (user_id = current_setting('app.current_user_id', true)::UUID);

CREATE POLICY safety_plans_own_data ON app.safety_plans
    FOR ALL USING (
        user_id = current_setting('app.current_user_id', true)::UUID OR
        current_setting('app.current_user_id', true)::UUID = ANY(shared_with)
    );

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Full text search indexes
CREATE INDEX idx_posts_search ON app.community_posts 
    USING GIN(to_tsvector('english', title || ' ' || content));

CREATE INDEX idx_groups_search ON app.support_groups 
    USING GIN(to_tsvector('english', name || ' ' || description));

-- =====================================================
-- INITIAL DATA AND PERMISSIONS
-- =====================================================

-- Create default admin user (password should be changed immediately)
INSERT INTO app.users (email, username, password_hash, role, is_verified, is_active)
VALUES (
    'admin@mentalhealth.app',
    'admin',
    crypt('ChangeMe123!', gen_salt('bf')),
    'admin',
    true,
    true
) ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT USAGE ON SCHEMA app TO authenticated;
GRANT USAGE ON SCHEMA audit TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA app TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA audit TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA app TO authenticated;

-- Create read-only role for analytics
CREATE ROLE analytics_reader;
GRANT USAGE ON SCHEMA app TO analytics_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA app TO analytics_reader;

-- =====================================================
-- MAINTENANCE PROCEDURES
-- =====================================================

-- Procedure to clean up old audit logs
CREATE OR REPLACE PROCEDURE cleanup_old_audit_logs(days_to_keep INTEGER DEFAULT 90)
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM audit.access_logs WHERE created_at < CURRENT_DATE - INTERVAL '1 day' * days_to_keep;
    DELETE FROM audit.data_changes WHERE created_at < CURRENT_DATE - INTERVAL '1 day' * days_to_keep;
END;
$$;

-- Procedure to anonymize deleted user data
CREATE OR REPLACE PROCEDURE anonymize_deleted_users()
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE app.users
    SET 
        email = 'deleted_' || id || '@deleted.com',
        username = 'deleted_' || id,
        profile_data = NULL
    WHERE deleted_at IS NOT NULL 
    AND deleted_at < CURRENT_DATE - INTERVAL '30 days';
END;
$$;