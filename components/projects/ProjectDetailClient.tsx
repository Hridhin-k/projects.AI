"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";
import type { ProjectDetail } from "@/lib/db/project-actions";
import { updateProject, advanceProjectPhase } from "@/lib/db/project-actions";
import { PHASE_LABELS, PHASE_ICONS, PHASE_COLORS } from "@/lib/projects/constants";
import ProjectPhasePipeline from "./ProjectPhasePipeline";
import ProjectMilestones from "./ProjectMilestones";
import DeploymentTracker from "./DeploymentTracker";
import ProjectTaskBoard from "./ProjectTaskBoard";

type Tab = "overview" | "tasks" | "milestones" | "deployments";

interface ProjectDetailClientProps {
  initialProject: ProjectDetail;
  canManage: boolean;
}

export default function ProjectDetailClient({
  initialProject,
  canManage,
}: ProjectDetailClientProps) {
  const [project, setProject] = useState(initialProject);
  const [tab, setTab] = useState<Tab>("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: project.name,
    description: project.description || "",
    repositoryUrl: project.repositoryUrl || "",
    deploymentUrl: project.deploymentUrl || "",
    techStack: project.techStack || "",
  });

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/projects/${project.id}`);
    if (res.ok) {
      const data = await res.json();
      setProject(data);
    }
  }, [project.id]);

  const handleSaveEdit = async () => {
    try {
      await updateProject(project.id, {
        name: editForm.name,
        description: editForm.description || null,
        repositoryUrl: editForm.repositoryUrl || null,
        deploymentUrl: editForm.deploymentUrl || null,
        techStack: editForm.techStack || null,
      });
      setIsEditing(false);
      await refresh();
    } catch (error) {
      console.error(error);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "tasks", label: "Tasks" },
    { id: "milestones", label: "Milestones" },
    { id: "deployments", label: "Deployments" },
  ];

  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-7xl">
      <Link href="/projects" className="text-sm text-gray-400 hover:text-purple-300 mb-4 inline-block">
        ← All projects
      </Link>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <div className="space-y-3 max-w-xl">
              <input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full text-2xl font-semibold bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100"
              />
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={2}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 text-sm"
              />
              <div className="flex gap-2">
                <button onClick={handleSaveEdit} className="px-4 py-2 bg-purple-700 rounded-lg text-sm text-white">
                  Save
                </button>
                <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm text-gray-400">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">{project.name}</h1>
                <span className={`px-3 py-1 rounded-full text-sm border ${PHASE_COLORS[project.phase]}`}>
                  {PHASE_ICONS[project.phase]} {PHASE_LABELS[project.phase]}
                </span>
              </div>
              {project.description && (
                <p className="text-gray-400 mt-2 max-w-2xl">{project.description}</p>
              )}
            </>
          )}
        </div>
        {canManage && !isEditing && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800"
            >
              Edit
            </button>
            <button
              onClick={async () => {
                await advanceProjectPhase(project.id);
                await refresh();
              }}
              className="px-4 py-2 text-sm bg-purple-800/50 border border-purple-600/40 rounded-lg text-purple-200 hover:bg-purple-800/70"
            >
              Advance phase →
            </button>
          </div>
        )}
      </div>

      <div className="mb-6 p-4 bg-gray-900/50 border border-purple-500/20 rounded-xl">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Project lifecycle</h3>
        <ProjectPhasePipeline
          projectId={project.id}
          currentPhase={project.phase}
          canEdit={canManage}
          onPhaseChange={refresh}
        />
      </div>

      <div className="flex gap-1 border-b border-gray-800 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id
                ? "border-purple-500 text-purple-200"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-900/50 border border-gray-700/50 rounded-xl">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Tasks</p>
            <p className="text-2xl font-bold text-gray-100">{project.taskCounts.total}</p>
            <p className="text-sm text-teal-400">{project.taskCounts.done} completed</p>
          </div>
          <div className="p-4 bg-gray-900/50 border border-gray-700/50 rounded-xl">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Milestones</p>
            <p className="text-2xl font-bold text-gray-100">
              {project.milestoneProgress.completed}/{project.milestoneProgress.total}
            </p>
          </div>
          <div className="p-4 bg-gray-900/50 border border-gray-700/50 rounded-xl">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Deployments</p>
            <p className="text-2xl font-bold text-gray-100">{project.deployments.length}</p>
          </div>
          {project.repositoryUrl && (
            <div className="md:col-span-2 p-4 bg-gray-900/50 border border-gray-700/50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Repository</p>
              <a
                href={project.repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-300 hover:underline text-sm break-all"
              >
                {project.repositoryUrl}
              </a>
            </div>
          )}
          {project.deploymentUrl && (
            <div className="p-4 bg-gray-900/50 border border-gray-700/50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Live URL</p>
              <a
                href={project.deploymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-300 hover:underline text-sm break-all"
              >
                {project.deploymentUrl}
              </a>
            </div>
          )}
          {project.techStack && (
            <div className="p-4 bg-gray-900/50 border border-gray-700/50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Tech stack</p>
              <p className="text-sm text-gray-300">{project.techStack}</p>
            </div>
          )}
          {project.targetDeployDate && (
            <div className="p-4 bg-gray-900/50 border border-gray-700/50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Target deploy</p>
              <p className="text-sm text-gray-300">
                {format(new Date(project.targetDeployDate), "MMM d, yyyy")}
              </p>
            </div>
          )}
          {project.deployedAt && (
            <div className="p-4 bg-gray-900/50 border border-green-700/30 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Deployed</p>
              <p className="text-sm text-green-300">
                {format(new Date(project.deployedAt), "MMM d, yyyy")}
              </p>
            </div>
          )}
        </div>
      )}

      {tab === "tasks" && (
        <ProjectTaskBoard
          projectId={project.id}
          projectName={project.name}
          canManage={canManage}
          deferInitialLoad
        />
      )}

      {tab === "milestones" && (
        <div className="max-w-xl">
          <ProjectMilestones milestones={project.milestones} onUpdate={refresh} />
        </div>
      )}

      {tab === "deployments" && (
        <DeploymentTracker
          projectId={project.id}
          deployments={project.deployments}
          canManage={canManage}
          onUpdate={refresh}
        />
      )}
    </div>
  );
}
