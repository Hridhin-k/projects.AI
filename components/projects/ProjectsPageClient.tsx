"use client";

import { useCallback, useState } from "react";
import { fetchProjects } from "@/lib/db/project-actions";
import type { ProjectWithStats } from "@/lib/db/project-actions";
import type { UserRole } from "@/lib/db/schema";
import ProjectCard from "@/components/projects/ProjectCard";
import CreateProjectModal from "@/components/projects/CreateProjectModal";
import EmptyState from "@/components/ui/EmptyState";

interface ProjectsPageClientProps {
  initialProjects: ProjectWithStats[];
  userRole: UserRole;
}

export default function ProjectsPageClient({
  initialProjects,
  userRole,
}: ProjectsPageClientProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [showCreate, setShowCreate] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      const list = await fetchProjects();
      setProjects(list);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const canManage = ["ADMIN", "OWNER", "MANAGER"].includes(userRole);

  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 max-w-7xl animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">Projects</h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage every project from planning through deployment
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowCreate(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-700 to-teal-700 rounded-lg text-white font-medium hover:shadow-lg hover:shadow-purple-900/20 transition-all shrink-0"
          >
            + New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon="🚀"
          title="No projects yet"
          description={
            canManage
              ? "Create your first project to track planning, development, testing, and deployment."
              : "Projects will appear here when your team adds them."
          }
          action={
            canManage
              ? {
                  label: "Create Project",
                  onClick: () => setShowCreate(true),
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <CreateProjectModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={loadProjects}
      />
    </div>
  );
}
