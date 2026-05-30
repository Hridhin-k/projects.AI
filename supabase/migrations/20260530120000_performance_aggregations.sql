-- Performance: SQL aggregations for project stats + indexes for role-based task queries

CREATE OR REPLACE FUNCTION public.get_org_project_task_counts(p_org_id UUID)
RETURNS TABLE (
  project_id UUID,
  total BIGINT,
  done BIGINT,
  in_progress BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    t.project_id,
    COUNT(*)::BIGINT AS total,
    COUNT(*) FILTER (WHERE t.status = 'DONE')::BIGINT AS done,
    COUNT(*) FILTER (WHERE t.status IN ('IN_PROGRESS', 'BLOCKED'))::BIGINT AS in_progress
  FROM tasks t
  WHERE t.organization_id = p_org_id
  GROUP BY t.project_id;
$$;

CREATE OR REPLACE FUNCTION public.get_project_milestone_progress(p_project_ids UUID[])
RETURNS TABLE (
  project_id UUID,
  total BIGINT,
  completed BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.project_id,
    COUNT(*)::BIGINT AS total,
    COUNT(*) FILTER (WHERE m.completed)::BIGINT AS completed
  FROM project_milestones m
  WHERE m.project_id = ANY(p_project_ids)
  GROUP BY m.project_id;
$$;

CREATE INDEX IF NOT EXISTS tasks_org_assignee_idx ON tasks(organization_id, assignee_id);
CREATE INDEX IF NOT EXISTS tasks_org_project_idx ON tasks(organization_id, project_id);
CREATE INDEX IF NOT EXISTS tasks_org_created_by_idx ON tasks(organization_id, created_by_id);
