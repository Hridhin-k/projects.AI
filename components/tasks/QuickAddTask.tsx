"use client";

import { useState, useEffect } from "react";
import { createTask } from "@/lib/db/actions";
import { useNotification } from "@/components/ui/useNotification";
import Notification from "@/components/ui/Notification";

interface QuickAddTaskProps {
  members: Array<{ id: string; name: string }>;
  projects: Array<{ id: string; name: string }>;
  onTaskCreated: () => void;
  /** When set, new tasks are locked to this project */
  projectId?: string;
}

export default function QuickAddTask({
  members,
  projects,
  onTaskCreated,
  projectId: fixedProjectId,
}: QuickAddTaskProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(fixedProjectId ?? "");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { notification, showNotification, clearNotification } = useNotification();

  useEffect(() => {
    if (fixedProjectId) {
      setSelectedProjectId(fixedProjectId);
    } else if (projects.length === 1) {
      setSelectedProjectId(projects[0].id);
    }
  }, [fixedProjectId, projects]);

  const effectiveProjectId = fixedProjectId ?? selectedProjectId;
  const canCreate = projects.length > 0 && !!effectiveProjectId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !effectiveProjectId) return;

    setIsSubmitting(true);
    try {
      await createTask({
        title: title.trim(),
        description: description.trim(),
        assigneeId: assigneeId || null,
        dueDate: dueDate || "No specific date",
        priority,
        projectId: effectiveProjectId,
      });

      showNotification("Task created successfully!", "success");
      setTitle("");
      setDescription("");
      setAssigneeId("");
      setDueDate("");
      setPriority("MEDIUM");
      if (!fixedProjectId && projects.length !== 1) {
        setSelectedProjectId("");
      }
      setIsOpen(false);
      onTaskCreated();
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : "Failed to create task",
        "error"
      );
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          if (!canCreate) {
            showNotification("Create a project first — every task must belong to one.", "error");
            return;
          }
          setIsOpen(true);
        }}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-800 to-teal-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center text-gray-200 z-40 animate-bounce-in hover:shadow-purple-800/20 min-w-[56px] min-h-[56px]"
        aria-label="Add new task"
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    );
  }

  const projectLabel =
    fixedProjectId && projects.find((p) => p.id === fixedProjectId)?.name;

  return (
    <>
      {notification && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[60] w-full max-w-md px-4">
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={clearNotification}
          />
        </div>
      )}

      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={() => setIsOpen(false)}
      />

      <div className="fixed bottom-0 left-0 right-0 sm:bottom-6 sm:right-6 sm:left-auto w-full sm:w-auto sm:max-w-md lg:max-w-lg bg-gray-900 border-t sm:border border-purple-800/20 rounded-t-xl sm:rounded-xl shadow-2xl z-50 p-4 sm:p-5 lg:p-6 max-h-[90vh] overflow-y-auto animate-slide-up sm:animate-fade-in-scale">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-200">Quick Add Task</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fixedProjectId && projectLabel ? (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Project</label>
              <p className="px-4 py-2 bg-gray-800/80 border border-purple-800/20 rounded-lg text-gray-200 text-sm">
                {projectLabel}
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Project *</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-800 border border-purple-800/15 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-800/30"
              >
                <option value="">Select a project…</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title..."
              required
              className="w-full px-4 py-2 bg-gray-800 border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 focus:border-purple-500/50"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task description..."
              rows={3}
              className="w-full px-4 py-2 bg-gray-800 border border-purple-800/15 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-800/30 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Assignee</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-purple-800/15 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-800/30"
              >
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as typeof priority)}
                className="w-full px-4 py-2 bg-gray-800 border border-purple-800/15 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-800/30"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Due Date</label>
            <input
              type="text"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              placeholder="e.g., 'by end of Q4', '2025-02-15'"
              className="w-full px-4 py-2 bg-gray-800 border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 focus:border-purple-500/50"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !effectiveProjectId}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-200 bg-purple-800 rounded-lg hover:bg-purple-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
