-- Require every task to belong to a project

-- Backfill: attach orphan tasks to the oldest project in the same org
UPDATE tasks t
SET project_id = (
  SELECT p.id
  FROM projects p
  WHERE p.organization_id = t.organization_id
  ORDER BY p.created_at ASC
  LIMIT 1
)
WHERE t.project_id IS NULL;

-- Remove tasks that still have no project (org had no projects)
DELETE FROM tasks WHERE project_id IS NULL;

ALTER TABLE tasks
  ALTER COLUMN project_id SET NOT NULL;
