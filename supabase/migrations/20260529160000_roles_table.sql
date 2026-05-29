-- Roles lookup table (platform + organization roles)

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  scope VARCHAR(20) NOT NULL CHECK (scope IN ('platform', 'organization')),
  hierarchy_level INTEGER NOT NULL DEFAULT 0,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS roles_scope_idx ON roles(scope);
CREATE INDEX IF NOT EXISTS roles_hierarchy_idx ON roles(hierarchy_level DESC);

INSERT INTO roles (slug, name, description, scope, hierarchy_level, permissions) VALUES
  (
    'SUPER_ADMIN',
    'Super Admin',
    'Platform operator who manages all customer organizations',
    'platform',
    100,
    '{"manage_platform": true, "manage_all_orgs": true}'::jsonb
  ),
  (
    'OWNER',
    'Organization Owner',
    'Created the organization; full control including inviting admins',
    'organization',
    80,
    '{"manage_team": true, "invite_admins": true, "manage_projects": true, "manage_tasks": true}'::jsonb
  ),
  (
    'ADMIN',
    'Organization Admin',
    'Manages team, projects, and tasks within the organization',
    'organization',
    60,
    '{"manage_team": true, "invite_members": true, "manage_projects": true, "manage_tasks": true}'::jsonb
  ),
  (
    'MANAGER',
    'Manager',
    'Manages projects and tasks; cannot invite or manage team',
    'organization',
    40,
    '{"manage_projects": true, "manage_tasks": true, "view_members": true}'::jsonb
  ),
  (
    'EMPLOYEE',
    'Employee',
    'Works on assigned tasks within the organization',
    'organization',
    20,
    '{"manage_own_tasks": true}'::jsonb
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  scope = EXCLUDED.scope,
  hierarchy_level = EXCLUDED.hierarchy_level,
  permissions = EXCLUDED.permissions,
  updated_at = NOW();

-- Link users to roles table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id);

UPDATE users u
SET role_id = r.id
FROM roles r
WHERE u.role_id IS NULL AND r.slug = u.role::text;

ALTER TABLE users ALTER COLUMN role_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS users_role_id_idx ON users(role_id);

-- Keep users.role enum in sync when role_id changes
CREATE OR REPLACE FUNCTION public.sync_user_role_from_role_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.role_id IS NOT NULL THEN
    SELECT slug::user_role INTO NEW.role FROM public.roles WHERE id = NEW.role_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_sync_role_from_role_id ON users;
CREATE TRIGGER users_sync_role_from_role_id
  BEFORE INSERT OR UPDATE OF role_id ON users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_role_from_role_id();

-- Invites reference roles (org roles only)
ALTER TABLE invites ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id);

UPDATE invites i
SET role_id = r.id
FROM roles r
WHERE i.role_id IS NULL AND r.slug = i.role::text;

-- role_id required for new invites; legacy rows backfilled above
ALTER TABLE invites ALTER COLUMN role_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS invites_role_id_idx ON invites(role_id);

CREATE OR REPLACE FUNCTION public.sync_invite_role_from_role_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.role_id IS NOT NULL THEN
    SELECT slug::user_role INTO NEW.role FROM public.roles WHERE id = NEW.role_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS invites_sync_role_from_role_id ON invites;
CREATE TRIGGER invites_sync_role_from_role_id
  BEFORE INSERT OR UPDATE OF role_id ON invites
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_invite_role_from_role_id();

-- RLS: authenticated users can read role definitions
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "roles_read_authenticated" ON roles;
CREATE POLICY "roles_read_authenticated" ON roles
  FOR SELECT
  TO authenticated
  USING (true);
