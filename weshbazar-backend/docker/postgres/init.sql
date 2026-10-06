-- =============================================================================
-- WeshBazar — PostgreSQL initialization (runs once on first container start).
-- Creates the application role, the development/test/shadow databases and the
-- pg_trgm extension required for marketplace search.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE ROLE weshbazar LOGIN PASSWORD 'weshbazar';

CREATE DATABASE weshbazar_dev OWNER weshbazar;
CREATE DATABASE weshbazar_test OWNER weshbazar;
CREATE DATABASE weshbazar_shadow OWNER weshbazar;

\connect weshbazar_test
CREATE EXTENSION IF NOT EXISTS pg_trgm;

\connect weshbazar_shadow
CREATE EXTENSION IF NOT EXISTS pg_trgm;
