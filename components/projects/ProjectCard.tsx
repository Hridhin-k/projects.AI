"use client";

import Link from "next/link";
import type { ProjectWithStats } from "@/lib/db/project-actions";
import { PHASE_LABELS, PHASE_ICONS, PHASE_COLORS, getPhaseProgress } from "@/lib/projects/constants";

interface ProjectCardProps {
  project: ProjectWithStats;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const progress = getPhaseProgress(project.phase);
  const milestonePct =
    project.milestoneProgress.total > 0
      ? Math.round((project.milestoneProgress.completed / project.milestoneProgress.total) * 100)
      : 0;

  return (
    <Link
      href={`/projects/${project.id}`}
      className="block group rounded-xl border border-purple-500/20 bg-gray-900/60 p-4 sm:p-5 hover:border-purple-500/40 hover:bg-gray-900/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-900/10"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-gray-100 truncate group-hover:text-white transition-colors">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-sm text-gray-400 mt-1 line-clamp-2">{project.description}</p>
          )}
        </div>
        <span
          className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border ${PHASE_COLORS[project.phase]}`}
        >
          {PHASE_ICONS[project.phase]} {PHASE_LABELS[project.phase]}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Lifecycle</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-teal-600 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-gray-400">
          <span>{project.taskCounts.total} tasks</span>
          <span className="text-teal-400">{project.taskCounts.done} done</span>
          <span className="text-purple-400">{project.taskCounts.inProgress} active</span>
          {project.milestoneProgress.total > 0 && (
            <span>{milestonePct}% milestones</span>
          )}
        </div>

        {project.techStack && (
          <p className="text-xs text-gray-500 truncate">{project.techStack}</p>
        )}
      </div>
    </Link>
  );
}
