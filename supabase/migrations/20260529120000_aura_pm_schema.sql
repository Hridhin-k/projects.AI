-- Projects.AI: Supabase schema
-- Run via Supabase CLI or Dashboard SQL editor

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('TO_DO', 'IN_PROGRESS', 'DONE', 'BLOCKED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('TRIAL', 'ACTIVE', 'CANCELLED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE plan AS ENUM ('FREE_TRIAL', 'BASIC', 'PRO', 'ENTERPRISE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE project_phase AS ENUM (
    'PLANNING', 'DESIGN', 'DEVELOPMENT', 'TESTING', 'STAGING',
    'DEPLOYMENT', 'DEPLOYED', 'MAINTENANCE', 'ARCHIVED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE deployment_environment AS ENUM ('DEVELOPMENT', 'STAGING', 'PRODUCTION');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE deployment_status AS ENUM ('PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED', 'ROLLED_BACK');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subscription_status subscription_status NOT NULL DEFAULT 'TRIAL',
  trial_start_date TIMESTAMPTZ NOT NULL,
  trial_end_date TIMESTAMPTZ NOT NULL,
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  plan plan NOT NULL DEFAULT 'FREE_TRIAL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'EMPLOYEE',
  tasks_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_organization_id_idx ON users(organization_id);
CREATE INDEX IF NOT EXISTS users_auth_user_id_idx ON users(auth_user_id);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  phase project_phase NOT NULL DEFAULT 'PLANNING',
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by_id UUID NOT NULL REFERENCES users(id),
  repository_url VARCHAR(500),
  deployment_url VARCHAR(500),
  tech_stack TEXT,
  start_date TIMESTAMPTZ,
  target_deploy_date TIMESTAMPTZ,
  deployed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS projects_organization_id_idx ON projects(organization_id);

-- Project milestones
CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  phase project_phase NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS project_milestones_project_id_idx ON project_milestones(project_id);

-- Deployments
CREATE TABLE IF NOT EXISTS deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  environment deployment_environment NOT NULL,
  version VARCHAR(100) NOT NULL,
  status deployment_status NOT NULL DEFAULT 'PENDING',
  notes TEXT,
  deployed_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  deployed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS deployments_project_id_idx ON deployments(project_id);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status task_status NOT NULL DEFAULT 'TO_DO',
  due_date VARCHAR(255) NOT NULL,
  priority task_priority DEFAULT 'MEDIUM',
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tasks_organization_id_idx ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS tasks_project_id_idx ON tasks(project_id);

-- Performance metrics
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  completion_rate INTEGER NOT NULL DEFAULT 0,
  average_time_days INTEGER NOT NULL DEFAULT 0,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  tasks_in_progress INTEGER NOT NULL DEFAULT 0,
  tasks_overdue INTEGER NOT NULL DEFAULT 0,
  last_ai_evaluation TEXT,
  evaluation_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invites
CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_by_id UUID NOT NULL REFERENCES users(id),
  token VARCHAR(255) NOT NULL UNIQUE,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Task comments
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS task_comments_task_id_idx ON task_comments(task_id);

-- Helper: current user's org id
CREATE OR REPLACE FUNCTION public.current_user_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- Organizations: members can read their org
DROP POLICY IF EXISTS "org_select" ON organizations;
CREATE POLICY "org_select" ON organizations FOR SELECT
  USING (id = public.current_user_org_id());

-- Users: same org
DROP POLICY IF EXISTS "users_select" ON users;
CREATE POLICY "users_select" ON users FOR SELECT
  USING (organization_id = public.current_user_org_id());

DROP POLICY IF EXISTS "users_update_self" ON users;
CREATE POLICY "users_update_self" ON users FOR UPDATE
  USING (auth_user_id = auth.uid());

-- Projects
DROP POLICY IF EXISTS "projects_org" ON projects;
CREATE POLICY "projects_org" ON projects FOR ALL
  USING (organization_id = public.current_user_org_id())
  WITH CHECK (organization_id = public.current_user_org_id());

-- Milestones (via project org)
DROP POLICY IF EXISTS "milestones_via_project" ON project_milestones;
CREATE POLICY "milestones_via_project" ON project_milestones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id AND p.organization_id = public.current_user_org_id()
    )
  );

-- Deployments
DROP POLICY IF EXISTS "deployments_via_project" ON deployments;
CREATE POLICY "deployments_via_project" ON deployments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id AND p.organization_id = public.current_user_org_id()
    )
  );

-- Tasks
DROP POLICY IF EXISTS "tasks_org" ON tasks;
CREATE POLICY "tasks_org" ON tasks FOR ALL
  USING (organization_id = public.current_user_org_id())
  WITH CHECK (organization_id = public.current_user_org_id());

-- Performance metrics
DROP POLICY IF EXISTS "metrics_org" ON performance_metrics;
CREATE POLICY "metrics_org" ON performance_metrics FOR ALL
  USING (organization_id = public.current_user_org_id());

-- Invites
DROP POLICY IF EXISTS "invites_org" ON invites;
CREATE POLICY "invites_org" ON invites FOR ALL
  USING (organization_id = public.current_user_org_id());

-- Public read invite by token (for acceptance page before full session)
DROP POLICY IF EXISTS "invites_token_read" ON invites;
CREATE POLICY "invites_token_read" ON invites FOR SELECT
  USING (used = false AND expires_at > NOW());

-- Task comments
DROP POLICY IF EXISTS "comments_via_task" ON task_comments;
CREATE POLICY "comments_via_task" ON task_comments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = task_id AND t.organization_id = public.current_user_org_id()
    )
  );

-- Service role bypasses RLS (used in server actions with manual org checks)
