"use client";

import { useState } from "react";
import { createProject } from "@/lib/db/project-actions";
import { useNotification } from "@/components/ui/useNotification";
import Notification from "@/components/ui/Notification";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateProjectModal({ isOpen, onClose, onCreated }: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [techStack, setTechStack] = useState("");
  const [targetDeployDate, setTargetDeployDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { notification, showNotification, clearNotification } = useNotification();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        repositoryUrl: repositoryUrl.trim() || undefined,
        techStack: techStack.trim() || undefined,
        targetDeployDate: targetDeployDate ? new Date(targetDeployDate) : null,
      });
      showNotification("Project created!", "success");
      setName("");
      setDescription("");
      setRepositoryUrl("");
      setTechStack("");
      setTargetDeployDate("");
      onCreated();
      onClose();
    } catch (error) {
      showNotification(error instanceof Error ? error.message : "Failed to create project", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-gray-900 border border-purple-500/30 rounded-xl shadow-2xl p-6 animate-fade-in-scale max-h-[90vh] overflow-y-auto">
        {notification && (
          <div className="mb-4">
            <Notification message={notification.message} type={notification.type} onClose={clearNotification} />
          </div>
        )}
        <h2 className="text-xl font-semibold text-gray-100 mb-1">New Project</h2>
        <p className="text-sm text-gray-400 mb-6">From planning through deployment — track the full lifecycle.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Project name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:border-purple-500 focus:outline-none"
              placeholder="e.g. E-commerce Platform"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:border-purple-500 focus:outline-none resize-none"
              placeholder="What are you building?"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Repository URL</label>
            <input
              value={repositoryUrl}
              onChange={(e) => setRepositoryUrl(e.target.value)}
              type="url"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:border-purple-500 focus:outline-none"
              placeholder="https://github.com/..."
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Tech stack</label>
            <input
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:border-purple-500 focus:outline-none"
              placeholder="Next.js, PostgreSQL, Vercel"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Target deploy date</label>
            <input
              value={targetDeployDate}
              onChange={(e) => setTargetDeployDate(e.target.value)}
              type="date"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-700 to-teal-700 rounded-lg text-white font-medium disabled:opacity-50 hover:shadow-lg transition-all"
            >
              {isSubmitting ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
