-- ============================================================================
-- RELAY MIGRATION: 20261106_initial_relay_schema.sql
-- Description: Complete relational schema for RELAY continuity platform
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Organizations & Users
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    system_role VARCHAR(50) DEFAULT 'MEMBER' CHECK (system_role IN ('GLOBAL_ADMIN', 'MEMBER')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    repository_url TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED', 'PAUSED')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(org_id, slug)
);

CREATE TABLE IF NOT EXISTS project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    project_role VARCHAR(50) DEFAULT 'INCOMING_MEMBER' CHECK (project_role IN ('ADMIN', 'REVIEWER', 'INCOMING_MEMBER')),
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(project_id, user_id)
);

-- 2. Sources & Ingestion
CREATE TABLE IF NOT EXISTS sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('GITLAB', 'GITHUB', 'DOCUMENT', 'TXT_UPLOAD')),
    name VARCHAR(255) NOT NULL,
    external_id TEXT,
    external_url TEXT,
    default_access_level VARCHAR(50) DEFAULT 'INTERNAL' CHECK (default_access_level IN ('PUBLIC', 'INTERNAL', 'RESTRICTED', 'CONFIDENTIAL')),
    last_synced_at TIMESTAMPTZ,
    sync_status VARCHAR(50) DEFAULT 'IDLE' CHECK (sync_status IN ('IDLE', 'SYNCING', 'SUCCESS', 'FAILED')),
    sync_error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS source_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES sources(id) ON DELETE CASCADE NOT NULL,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('COMMIT', 'ISSUE', 'MERGE_REQUEST', 'ISSUE_COMMENT', 'DOCUMENT_CHUNK')),
    external_reference_id VARCHAR(255) NOT NULL,
    title TEXT NOT NULL,
    content_body TEXT NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    author_email VARCHAR(255),
    access_level VARCHAR(50) DEFAULT 'INTERNAL' CHECK (access_level IN ('PUBLIC', 'INTERNAL', 'RESTRICTED', 'CONFIDENTIAL')),
    activity_timestamp TIMESTAMPTZ NOT NULL,
    external_url TEXT,
    content_hash VARCHAR(64),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Claims & Evidence
CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    claim_code VARCHAR(50) UNIQUE NOT NULL,
    claim_text TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('DECISION', 'TASK', 'RISK', 'DEPENDENCY', 'OWNERSHIP', 'UNRESOLVED_QUESTION')),
    verification_status VARCHAR(50) DEFAULT 'UNVERIFIED' CHECK (verification_status IN ('VERIFIED', 'UNCERTAIN', 'CONFLICTING', 'UNVERIFIED')),
    confidence_score NUMERIC(4,3) DEFAULT 0.500,
    inference_type VARCHAR(50) DEFAULT 'DIRECT_EVIDENCE',
    conflict_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS claim_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID REFERENCES claims(id) ON DELETE CASCADE NOT NULL,
    activity_id UUID REFERENCES source_activities(id) ON DELETE CASCADE NOT NULL,
    excerpt TEXT NOT NULL,
    line_reference VARCHAR(100),
    relevance_explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Handovers
CREATE TABLE IF NOT EXISTS handovers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    target_role VARCHAR(50) DEFAULT 'INCOMING_DEVELOPER',
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'ACKNOWLEDGED')),
    scope VARCHAR(100) DEFAULT 'FULL_PROJECT',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS handover_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    handover_id UUID REFERENCES handovers(id) ON DELETE CASCADE NOT NULL,
    section_key VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content_markdown TEXT NOT NULL,
    section_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
