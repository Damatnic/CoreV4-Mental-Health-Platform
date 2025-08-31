-- Migration: 001_initial_schema
-- Description: Initial database schema for Mental Health Platform
-- Author: System
-- Date: 2024-08-31

-- This migration creates the initial database schema
-- It should be run after db-init.sql for new installations

BEGIN;

-- Migration tracking table
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(64)
);

-- Record this migration
INSERT INTO migrations (version, description, checksum)
VALUES (
    '001_initial_schema',
    'Initial database schema setup',
    md5('001_initial_schema')::VARCHAR(64)
);

-- Add any additional initial setup here

COMMIT;