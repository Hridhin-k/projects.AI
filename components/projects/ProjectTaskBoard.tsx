"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { fetchTasks, updateTaskAction, fetchMembers } from "@/lib/db/actions";
import type { Task } from "@/lib/db/schema";
import TaskFilters, { type FilterState } from "@/components/tasks/TaskFilters";
import TaskCard from "@/components/tasks/TaskCard";
import TaskDetailModal from "@/components/tasks/TaskDetailModal";
import QuickAddTask from "@/components/tasks/QuickAddTask";
import EmptyState from "@/components/ui/EmptyState";
import { KanbanColumnSkeleton } from "@/components/ui/Skeleton";
import { useNotification } from "@/components/ui/useNotification";
import Notification from "@/components/ui/Notification";
import AIChatFAB from "@/components/ai/AIChatFAB";

type TaskStatus = "TO_DO" | "IN_PROGRESS" | "DONE" | "BLOCKED";

const STATUSES: TaskStatus[] = ["TO_DO", "IN_PROGRESS", "DONE", "BLOCKED"];
const STATUS_LABELS: Record<TaskStatus, string> = {
  TO_DO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
  BLOCKED: "Blocked",
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  TO_DO: "border-gray-500 bg-gray-800/50",
  IN_PROGRESS: "border-purple-700/50 bg-purple-900/30",
  DONE: "border-teal-700/50 bg-teal-900/30",
  BLOCKED: "border-red-800/50 bg-red-900/30",
};

interface ProjectTaskBoardProps {
  projectId: string;
  projectName: string;
  canManage: boolean;
}

export default function ProjectTaskBoard({ projectId, projectName, canManage }: ProjectTaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Array<{ id: string; name: string }>>([]);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "ALL",
    priority: "ALL",
    assignee: "ALL",
  });
  const { notification, showNotification, clearNotification } = useNotification();

  const loadData = useCallback(async () => {
    try {
      const [fetchedTasks, fetchedMembers] = await Promise.all([
        fetchTasks(projectId),
        fetchMembers(),
      ]);
      setTasks(fetchedTasks);
      setMembers(fetchedMembers.map((m) => ({ id: m.id, name: m.name })));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
    const onCreated = () => loadData();
    window.addEventListener("taskCreated", onCreated);
    return () => window.removeEventListener("taskCreated", onCreated);
  }, [loadData]);

  const filteredTasks = useMemo(() => {
    const searchLower = filters.search?.toLowerCase() || "";
    return tasks.filter((task) => {
      if (searchLower) {
        const titleMatch = task.title.toLowerCase().includes(searchLower);
        const descMatch = task.description?.toLowerCase().includes(searchLower);
        if (!titleMatch && !descMatch) return false;
      }
      if (filters.status !== "ALL" && task.status !== filters.status) return false;
      if (filters.priority !== "ALL" && task.priority !== filters.priority) return false;
      if (filters.assignee !== "ALL") {
        if (filters.assignee === "" && task.assigneeId !== null) return false;
        if (filters.assignee !== "" && task.assigneeId !== filters.assignee) return false;
      }
      return true;
    });
  }, [tasks, filters]);

  const memberMap = useMemo(() => {
    const map = new Map<string, string>();
    members.forEach((m) => map.set(m.id, m.name));
    return map;
  }, [members]);

  const handleDrop = useCallback(
    async (newStatus: TaskStatus) => {
      if (!draggedTask || draggedTask.status === newStatus) {
        setDraggedTask(null);
        return;
      }
      try {
        await updateTaskAction(draggedTask.id, { status: newStatus });
        setTasks((prev) =>
          prev.map((t) => (t.id === draggedTask.id ? { ...t, status: newStatus } : t))
        );
        showNotification(`Task moved to ${STATUS_LABELS[newStatus]}`, "success");
      } catch {
        showNotification("Failed to update task", "error");
      }
      setDraggedTask(null);
    },
    [draggedTask, showNotification]
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <KanbanColumnSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div>
      {notification && (
        <div className="mb-3">
          <Notification message={notification.message} type={notification.type} onClose={clearNotification} />
        </div>
      )}

      <div className="mb-4">
        <TaskFilters onFilterChange={setFilters} members={members} />
      </div>

      {filteredTasks.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No tasks in this project"
          description={canManage ? "Add tasks to track work for this project." : "No tasks assigned to you yet."}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {STATUSES.map((status) => {
            const statusTasks = filteredTasks.filter((t) => t.status === status);
            return (
              <div
                key={status}
                className="flex flex-col"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(status)}
              >
                <div className={`p-3 rounded-t-lg border ${STATUS_COLORS[status]} flex justify-between`}>
                  <h3 className="font-semibold text-sm text-gray-200">{STATUS_LABELS[status]}</h3>
                  <span className="text-xs font-bold bg-black/20 px-2 rounded-full">{statusTasks.length}</span>
                </div>
                <div className="flex-1 min-h-[200px] p-2 bg-gray-900/50 border-x border-b border-purple-500/20 rounded-b-lg space-y-2">
                  {statusTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      assigneeName={memberMap.get(task.assigneeId || "")}
                      onDragStart={setDraggedTask}
                      onClick={() => setSelectedTask(task)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {canManage && (
        <>
          <AIChatFAB projectId={projectId} />
          <QuickAddTask
            members={members}
            projects={[{ id: projectId, name: projectName }]}
            projectId={projectId}
            onTaskCreated={loadData}
          />
        </>
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          assigneeName={memberMap.get(selectedTask.assigneeId || "")}
          creatorName={memberMap.get(selectedTask.createdById)}
          members={members}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => {
            loadData();
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}
