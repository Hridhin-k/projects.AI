"use client";

import { useState, useEffect } from "react";
import type { Task, User } from "@/lib/db/schema";
import { updateTaskAction, deleteTask } from "@/lib/db/actions";
import { useNotification } from "@/components/ui/useNotification";
import Notification from "@/components/ui/Notification";
import { formatDistanceToNow } from "date-fns";

interface TaskDetailModalProps {
  task: Task;
  assigneeName?: string;
  creatorName?: string;
  members?: Array<{ id: string; name: string }>;
  currentUser?: User;
  onClose: () => void;
  onUpdate: () => void;
}

interface Comment {
  id: string;
  content: string;
  userId: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

const STATUS_OPTIONS = [
  { value: "TO_DO", label: "To Do", color: "text-gray-400" },
  { value: "IN_PROGRESS", label: "In Progress", color: "text-purple-600" },
  { value: "DONE", label: "Done", color: "text-teal-600" },
  { value: "BLOCKED", label: "Blocked", color: "text-red-700" },
] as const;

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low", color: "bg-slate-700" },
  { value: "MEDIUM", label: "Medium", color: "bg-gray-600" },
  { value: "HIGH", label: "High", color: "bg-amber-700" },
  { value: "URGENT", label: "Urgent", color: "bg-red-800" },
] as const;

export default function TaskDetailModal({
  task,
  assigneeName,
  creatorName,
  members = [],
  currentUser: currentUserProp,
  onClose,
  onUpdate,
}: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority || "MEDIUM");
  const [dueDate, setDueDate] = useState(task.dueDate);
  const [assigneeId, setAssigneeId] = useState(task.assigneeId || "");
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [canComment, setCanComment] = useState(false);
  const { notification, showNotification, clearNotification } = useNotification();

  const applyPermissions = (user: User) => {
    const isAdminOrOwner = user.role === "ADMIN" || user.role === "OWNER";
    const isManager = user.role === "MANAGER";
    setCanEdit(isAdminOrOwner || isManager);
    setCanDelete(isAdminOrOwner || (isManager && task.createdById === user.id));
    setCanComment(
      isAdminOrOwner ||
        isManager ||
        (user.role === "EMPLOYEE" && task.assigneeId === user.id)
    );
  };

  useEffect(() => {
    if (currentUserProp) {
      setCurrentUser(currentUserProp);
      applyPermissions(currentUserProp);
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await fetch("/api/user");
        if (response.ok) {
          const user = await response.json();
          setCurrentUser(user);
          applyPermissions(user);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, [currentUserProp, task.assigneeId, task.createdById]);

  // Load comments
  useEffect(() => {
    loadComments();
  }, [task.id]);

  const loadComments = async () => {
    try {
      const response = await fetch(`/api/tasks/${task.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !canComment) return;
    
    setIsAddingComment(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });
      
      if (response.ok) {
        const comment = await response.json();
        setComments([...comments, comment]);
        setNewComment("");
        showNotification("Comment added successfully!", "success");
      } else {
        const error = await response.json();
        showNotification(error.error || "Failed to add comment", "error");
      }
    } catch (error) {
      showNotification("Failed to add comment", "error");
      console.error(error);
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const changes: any = {
        title,
        description,
        status,
        priority: priority as any,
        dueDate,
      };
      
      // Include assignee change if it was modified (only for Admin/Manager)
      if (assigneeId !== task.assigneeId && currentUser?.role !== 'EMPLOYEE') {
        changes.assigneeId = assigneeId || null;
      }
      
      await updateTaskAction(task.id, changes);
      showNotification("Task updated successfully!", "success");
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      showNotification(error instanceof Error ? error.message : "Failed to update task", "error");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTask(task.id);
      showNotification("Task deleted successfully!", "success");
      onUpdate();
      onClose();
    } catch (error) {
      showNotification("Failed to delete task", "error");
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 lg:p-6 animate-fade-in">
      <div className="relative w-full h-full sm:h-auto sm:max-w-2xl lg:max-w-3xl sm:mx-4 bg-gray-900 border-t sm:border border-purple-500/30 rounded-t-xl sm:rounded-xl shadow-2xl max-h-[100vh] sm:max-h-[90vh] overflow-y-auto flex flex-col animate-fade-in-scale">
        {/* Notification */}
        {notification && (
          <div className="px-4 sm:px-6 pt-4 sm:pt-6">
            <Notification
              message={notification.message}
              type={notification.type}
              onClose={clearNotification}
            />
          </div>
        )}

        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-purple-500/20 p-4 sm:p-6 flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-purple-800 to-teal-800 flex items-center justify-center text-gray-200 text-xl sm:text-2xl font-bold flex-shrink-0 shadow-lg">
              📋
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white truncate">Task Details</h2>
              <p className="text-xs text-gray-400 truncate">View and manage task information</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isEditing && (
              <>
                {canEdit && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-purple-800 hover:bg-purple-900 rounded-lg text-gray-200 transition-all duration-200 hover:shadow-lg hover:shadow-purple-800/10 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <span className="hidden sm:inline">Edit</span>
                    <span className="sm:hidden">✏️</span>
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-red-900 hover:bg-red-950 rounded-lg text-gray-200 transition-all duration-200 hover:shadow-lg hover:shadow-red-900/10 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <span className="hidden sm:inline">Delete</span>
                    <span className="sm:hidden">🗑️</span>
                  </button>
                )}
              </>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition-colors p-1"
              aria-label="Close"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 flex-1 overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Title</label>
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-purple-800/15 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-800/30 transition-all duration-200 focus:border-purple-800/25"
              />
            ) : (
              <h3 className="text-xl font-semibold text-gray-200">{task.title}</h3>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
            {isEditing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 bg-gray-800 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none transition-all duration-200 focus:border-purple-500/50"
              />
            ) : (
              <p className="text-gray-300 whitespace-pre-wrap">{task.description || "No description"}</p>
            )}
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
              {/* Employees can change status without entering edit mode */}
              {(isEditing || (currentUser?.role === 'EMPLOYEE' && task.assigneeId === currentUser?.id)) ? (
                <select
                  value={status}
                  onChange={async (e) => {
                    const newStatus = e.target.value as any;
                    setStatus(newStatus);
                    // For employees, save immediately when status changes
                    if (currentUser?.role === 'EMPLOYEE' && !isEditing) {
                      try {
                        setIsSaving(true);
                        await updateTaskAction(task.id, { status: newStatus });
                        showNotification("Task status updated successfully!", "success");
                        onUpdate();
                      } catch (error) {
                        showNotification(error instanceof Error ? error.message : "Failed to update status", "error");
                        setStatus(task.status); // Revert on error
                        console.error(error);
                      } finally {
                        setIsSaving(false);
                      }
                    }
                  }}
                  disabled={isSaving}
                  className="w-full px-4 py-2 bg-gray-800 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 transition-all duration-200 focus:border-purple-500/50"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className={`px-4 py-2 rounded-lg ${STATUS_OPTIONS.find(s => s.value === status)?.color || "text-gray-400"} text-gray-200`}>
                  {STATUS_OPTIONS.find(s => s.value === status)?.label || status}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Priority</label>
              {isEditing ? (
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-4 py-2 bg-gray-800 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <span className={`inline-block px-3 py-1 rounded-full text-gray-200 text-sm ${
                  PRIORITY_OPTIONS.find(p => p.value === priority)?.color || "bg-gray-600"
                }`}>
                  {PRIORITY_OPTIONS.find(p => p.value === priority)?.label || priority}
                </span>
              )}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Due Date</label>
            {isEditing ? (
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="e.g., 'by end of Q4', '2025-02-15'"
                className="w-full px-4 py-2 bg-gray-800 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            ) : (
              <p className="text-gray-300">{task.dueDate}</p>
            )}
          </div>

          {/* Assignee - Editable for Admin/Manager */}
          {isEditing && (canEdit || currentUser?.role === 'ADMIN' || currentUser?.role === 'OWNER' || currentUser?.role === 'MANAGER') ? (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Assigned To</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-purple-500/20">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Assigned To</label>
                <p className="text-gray-300">{assigneeName || "Unassigned"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Assigned By</label>
                <p className="text-gray-300">{creatorName || "Unknown"}</p>
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="pt-4 border-t border-purple-500/20">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Comments</h3>
            
            {/* Comments List */}
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-sm">No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-800/50 border border-purple-500/20 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-800 to-teal-800 flex items-center justify-center text-gray-200 text-xs font-bold">
                          {comment.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-200">{comment.user.name}</p>
                          <p className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{comment.content}</p>
                  </div>
                ))
              )}
            </div>
            
            {/* Add Comment */}
            {canComment && (
              <div className="space-y-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-800 border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none transition-all duration-200 focus:border-purple-500/50"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || isAddingComment}
                  className="px-4 py-2 text-sm font-medium bg-purple-800 hover:bg-purple-900 rounded-lg text-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-800/10 hover:-translate-y-0.5 active:translate-y-0"
                >
                  {isAddingComment ? "Adding..." : "Add Comment"}
                </button>
              </div>
            )}
          </div>

          {/* Task ID */}
          <div className="pt-4 border-t border-purple-500/20">
            <label className="block text-sm font-medium text-gray-400 mb-1">Task ID</label>
            <p className="text-gray-500 text-xs font-mono">{task.id}</p>
          </div>

          {/* Save/Cancel Buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-4 border-t border-purple-500/20">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setTitle(task.title);
                  setDescription(task.description || "");
                  setStatus(task.status);
                  setPriority(task.priority || "MEDIUM");
                  setDueDate(task.dueDate);
                  setAssigneeId(task.assigneeId || "");
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !title.trim()}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-200 bg-purple-800 rounded-lg hover:bg-purple-900 transition-all duration-200 disabled:opacity-50 hover:shadow-lg hover:shadow-purple-800/10 hover:-translate-y-0.5 active:translate-y-0"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80">
          <div className="bg-gray-900 border border-red-500/30 rounded-xl p-6 max-w-md">
            <h3 className="text-xl font-semibold text-gray-200 mb-2">Delete Task?</h3>
            <p className="text-gray-400 mb-4">This action cannot be undone. Are you sure you want to delete this task?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-800 rounded-lg hover:bg-red-900 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

