"use client";

import { useState } from "react";
import type { AIResponse } from "@/app/api/ai/task-assistant/route";

interface TaskConfirmationProps {
  proposedTask: NonNullable<AIResponse["proposedTask"]>;
  onConfirm: () => void;
  onCancel: () => void;
  assigneeName?: string;
  projectName?: string;
}

export default function TaskConfirmation({
  proposedTask,
  onConfirm,
  onCancel,
  assigneeName,
  projectName,
}: TaskConfirmationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-gray-900 border border-purple-500/30 rounded-xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Confirm Task Creation</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-400">Title</label>
            <p className="mt-1 text-white">{proposedTask.title}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-400">Description</label>
            <p className="mt-1 text-white">{proposedTask.description}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-400">Project</label>
            <p className="mt-1 text-white">{projectName || "Unknown project"}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-400">Assignee</label>
            <p className="mt-1 text-white">{assigneeName || "Unassigned"}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-400">Due Date</label>
            <p className="mt-1 text-white">{proposedTask.dueDate}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-400">Status</label>
            <p className="mt-1 text-white">{proposedTask.status}</p>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating...
              </>
            ) : (
              "Confirm & Create"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

