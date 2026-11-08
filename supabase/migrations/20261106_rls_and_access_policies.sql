-- ============================================================================
-- RELAY FORWARD MIGRATION: 20261106_rls_and_access_policies.sql
-- Description: Enforces Row-Level Security (RLS), project membership checks,
--              role-based permissions, and ingestion job history audit logging.
-- ============================================================================

-- 1. Create Ingestion Jobs Table (if not exists)
CREATE TABLE IF NOT EXISTS ingestion_jobs (
    id VARCHAR(255) PRIMARY KEY,
    source_id VARCHAR(255) NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED')),
    records_fetched INT NOT NULL DEFAULT 0,
    records_imported INT NOT NULL DEFAULT 0,
    duplicates_skipped INT NOT NULL DEFAULT 0,
    error_message TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Enable Row-Level Security across all domain tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE handover_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_jobs ENABLE ROW LEVEL SECURITY;

-- 3. Security Helper Functions
CREATE OR REPLACE FUNCTION get_user_project_role(p_project_id UUID, p_user_id UUID)
RETURNS VARCHAR AS $$
    SELECT project_role 
    FROM project_members 
    WHERE project_id = p_project_id AND user_id = p_user_id 
    LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION has_project_membership(p_project_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM project_members 
        WHERE project_id = p_project_id 
          AND user_id = auth.uid()
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION can_view_source_activity(p_access_level VARCHAR, p_project_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_role VARCHAR;
BEGIN
    -- Check if user is even a member of the project
    SELECT project_role INTO v_role 
    FROM project_members 
    WHERE project_id = p_project_id AND user_id = auth.uid();

    IF v_role IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Admin and Reviewer can see all access levels (PUBLIC, INTERNAL, RESTRICTED, CONFIDENTIAL)
    IF v_role IN ('ADMIN', 'REVIEWER') THEN
        RETURN TRUE;
    END IF;

    -- Incoming members cannot view RESTRICTED or CONFIDENTIAL records
    IF v_role = 'INCOMING_MEMBER' AND p_access_level IN ('RESTRICTED', 'CONFIDENTIAL') THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4. Projects RLS Policies
CREATE POLICY "projects_membership_select" ON projects
    FOR SELECT USING (
        has_project_membership(id)
    );

-- 5. Sources RLS Policies
CREATE POLICY "sources_member_select" ON sources
    FOR SELECT USING (
        has_project_membership(project_id)
    );

CREATE POLICY "sources_admin_insert" ON sources
    FOR INSERT WITH CHECK (
        get_user_project_role(project_id, auth.uid()) = 'ADMIN'
    );

CREATE POLICY "sources_admin_update" ON sources
    FOR UPDATE USING (
        get_user_project_role(project_id, auth.uid()) = 'ADMIN'
    );

CREATE POLICY "sources_admin_delete" ON sources
    FOR DELETE USING (
        get_user_project_role(project_id, auth.uid()) = 'ADMIN'
    );

-- 6. Source Activities RLS Policies (Classification leak protection)
CREATE POLICY "source_activities_classified_select" ON source_activities
    FOR SELECT USING (
        can_view_source_activity(access_level, (SELECT project_id FROM sources WHERE sources.id = source_activities.source_id))
    );

CREATE POLICY "source_activities_admin_insert" ON source_activities
    FOR INSERT WITH CHECK (
        get_user_project_role((SELECT project_id FROM sources WHERE sources.id = source_activities.source_id), auth.uid()) = 'ADMIN'
    );

-- 7. Claims RLS Policies (Governance protection)
CREATE POLICY "claims_member_select" ON claims
    FOR SELECT USING (
        has_project_membership(project_id)
    );

CREATE POLICY "claims_admin_reviewer_write" ON claims
    FOR ALL USING (
        get_user_project_role(project_id, auth.uid()) IN ('ADMIN', 'REVIEWER')
    );

-- 8. Handover Packages RLS Policies
CREATE POLICY "handovers_member_select" ON handovers
    FOR SELECT USING (
        has_project_membership(project_id)
    );

CREATE POLICY "handovers_admin_reviewer_write" ON handovers
    FOR ALL USING (
        get_user_project_role(project_id, auth.uid()) IN ('ADMIN', 'REVIEWER')
    );

-- 9. Ingestion Jobs History Policies
CREATE POLICY "ingestion_jobs_member_select" ON ingestion_jobs
    FOR SELECT USING (
        has_project_membership(project_id)
    );

CREATE POLICY "ingestion_jobs_admin_write" ON ingestion_jobs
    FOR ALL USING (
        get_user_project_role(project_id, auth.uid()) = 'ADMIN'
    );
