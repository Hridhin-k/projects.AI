"use client";

import { memo, useCallback } from "react";
import type { Task } from "@/lib/db/schema";
import { formatDistanceToNow } from "date-fns";

interface TaskCardProps {
  task: Task;
  assigneeName?: string;
  projectName?: string;
  onDragStart?: (task: Task) => void;
  onClick?: () => void;
}

const PRIORITY_COLORS = {
  LOW: "border-slate-600/30 bg-slate-900/20",
  MEDIUM: "border-gray-500/30 bg-gray-800/50",
  HIGH: "border-amber-700/30 bg-amber-900/20",
  URGENT: "border-red-800/30 bg-red-900/20",
};

const PRIORITY_LABELS = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

function TaskCard({ task, assigneeName, projectName, onDragStart, onClick }: TaskCardProps) {
  const priorityColor = task.priority ? PRIORITY_COLORS[task.priority] : PRIORITY_COLORS.MEDIUM;
  const priorityLabel = task.priority ? PRIORITY_LABELS[task.priority] : "Medium";

  const handleDragStart = useCallback(() => {
    onDragStart?.(task);
  }, [onDragStart, task]);

  return (
    <div
      draggable={!!onDragStart}
      onDragStart={handleDragStart}
      onClick={onClick}
      className={`p-3 sm:p-4 bg-gray-800 border ${priorityColor} rounded-lg hover:border-purple-800/30 transition-all duration-300 ease-out hover:shadow-lg hover:shadow-purple-800/10 hover:-translate-y-1 group animate-fade-in active:scale-[0.98] ${
        onDragStart ? "cursor-move touch-none" : onClick ? "cursor-pointer" : ""
      }`}
      style={{ animationDelay: '0ms' }}
    >
      {/* Priority Badge */}
      {task.priority && task.priority !== "MEDIUM" && (
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${
            task.priority === "URGENT" ? "bg-red-800/80 text-red-100" :
            task.priority === "HIGH" ? "bg-amber-700/80 text-amber-100" :
            "bg-slate-700/80 text-slate-200"
          }`}>
            {task.priority === "URGENT" && "🔥"}
            {task.priority === "HIGH" && "⚡"}
            {task.priority === "LOW" && "💤"}
            {priorityLabel}
          </span>
        </div>
      )}

      <h4 className="font-semibold text-gray-200 text-sm sm:text-base mb-1.5 group-hover:text-purple-300/70 transition-colors line-clamp-2">
        {task.title}
      </h4>

      {task.description && (
        <p className="text-xs sm:text-sm text-gray-400 mb-3 line-clamp-2 leading-relaxed">{task.description}</p>
      )}

      {projectName && (
        <p className="text-xs text-purple-300/80 mb-2 truncate">
          🚀 {projectName}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-gray-700/50">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="truncate">{task.dueDate}</span>
        </div>
        {assigneeName && (
          <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-800/70 to-teal-800/70 flex items-center justify-center text-gray-200 text-[10px] font-bold">
              {assigneeName.charAt(0).toUpperCase()}
            </div>
            <span className="text-gray-400 text-xs hidden sm:inline">{assigneeName.split(" ")[0]}</span>
          </div>
        )}
      </div>

      {task.createdAt && (
        <div className="text-[10px] text-gray-600 mt-2 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}</span>
        </div>
      )}
    </div>
  );
}

export default memo(TaskCard);
