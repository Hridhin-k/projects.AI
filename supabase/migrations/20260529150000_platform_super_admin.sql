-- Platform super admin + org owner signup model

DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Super admins are not tied to a single organization
ALTER TABLE users ALTER COLUMN organization_id DROP NOT NULL;

-- Track whether an org is active on the platform
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS organizations_is_active_idx ON organizations(is_active);
