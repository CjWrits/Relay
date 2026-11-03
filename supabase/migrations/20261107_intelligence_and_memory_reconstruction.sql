-- ============================================================================
-- RELAY FORWARD MIGRATION: 20261107_intelligence_and_memory_reconstruction.sql
-- Description: Schema extensions for Phase 3: Intelligence & Project Memory Reconstruction
-- ============================================================================

-- 1. Analysis Runs Table
CREATE TABLE IF NOT EXISTS analysis_runs (
    id VARCHAR(255) PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('DETERMINISTIC', 'LLM_ASSISTED')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED')),
    activities_processed INT NOT NULL DEFAULT 0,
    entities_discovered INT NOT NULL DEFAULT 0,
    claims_created INT NOT NULL DEFAULT 0,
    conflicts_discovered INT NOT NULL DEFAULT 0,
    knowledge_gaps_discovered INT NOT NULL DEFAULT 0,
    error_message TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Reconstructed Entities Table
CREATE TABLE IF NOT EXISTS reconstructed_entities (
    id VARCHAR(255) PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    properties JSONB DEFAULT '{}'::jsonb,
    source_activity_ids TEXT[] DEFAULT '{}',
    confidence NUMERIC(4,3) DEFAULT 0.900,
    is_hypothesis BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Entity Relationships Table
CREATE TABLE IF NOT EXISTS entity_relationships (
    id VARCHAR(255) PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    source_entity_id VARCHAR(255) NOT NULL,
    target_entity_id VARCHAR(255) NOT NULL,
    relationship_type VARCHAR(50) NOT NULL,
    evidence_activity_ids TEXT[] DEFAULT '{}',
    is_hypothesis BOOLEAN DEFAULT FALSE,
    rationale TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Knowledge Gaps Table
CREATE TABLE IF NOT EXISTS knowledge_gaps (
    id VARCHAR(255) PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    affected_entity_id VARCHAR(255),
    impact TEXT,
    source_activity_ids TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Claim History Table (Audit of Verification Status Transitions)
CREATE TABLE IF NOT EXISTS claim_history (
    id VARCHAR(255) PRIMARY KEY,
    claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
    analysis_run_id VARCHAR(255) NOT NULL,
    previous_status VARCHAR(50) NOT NULL,
    new_status VARCHAR(50) NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. Enable Row-Level Security
ALTER TABLE analysis_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconstructed_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_history ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
-- Analysis Runs
CREATE POLICY "analysis_runs_member_select" ON analysis_runs
    FOR SELECT USING (has_project_membership(project_id));

CREATE POLICY "analysis_runs_admin_write" ON analysis_runs
    FOR ALL USING (get_user_project_role(project_id, auth.uid()) = 'ADMIN');

-- Reconstructed Entities
CREATE POLICY "reconstructed_entities_member_select" ON reconstructed_entities
    FOR SELECT USING (has_project_membership(project_id));

CREATE POLICY "reconstructed_entities_admin_reviewer_write" ON reconstructed_entities
    FOR ALL USING (get_user_project_role(project_id, auth.uid()) IN ('ADMIN', 'REVIEWER'));

-- Entity Relationships
CREATE POLICY "entity_relationships_member_select" ON entity_relationships
    FOR SELECT USING (has_project_membership(project_id));

CREATE POLICY "entity_relationships_admin_reviewer_write" ON entity_relationships
    FOR ALL USING (get_user_project_role(project_id, auth.uid()) IN ('ADMIN', 'REVIEWER'));

-- Knowledge Gaps
CREATE POLICY "knowledge_gaps_member_select" ON knowledge_gaps
    FOR SELECT USING (has_project_membership(project_id));

CREATE POLICY "knowledge_gaps_admin_reviewer_write" ON knowledge_gaps
    FOR ALL USING (get_user_project_role(project_id, auth.uid()) IN ('ADMIN', 'REVIEWER'));

-- Claim History
CREATE POLICY "claim_history_member_select" ON claim_history
    FOR SELECT USING (TRUE);
