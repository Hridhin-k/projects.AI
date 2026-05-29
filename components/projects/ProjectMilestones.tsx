"use client";

import type { ProjectMilestone, ProjectPhase } from "@/lib/db/schema";
import { toggleMilestone } from "@/lib/db/project-actions";
import { PHASE_LABELS } from "@/lib/projects/constants";

interface ProjectMilestonesProps {
  milestones: ProjectMilestone[];
  onUpdate: () => void;
}

export default function ProjectMilestones({ milestones, onUpdate }: ProjectMilestonesProps) {
  const byPhase = milestones.reduce<Record<string, ProjectMilestone[]>>((acc, m) => {
    if (!acc[m.phase]) acc[m.phase] = [];
    acc[m.phase].push(m);
    return acc;
  }, {});

  const handleToggle = async (id: string, completed: boolean) => {
    try {
      await toggleMilestone(id, !completed);
      onUpdate();
    } catch (error) {
      console.error(error);
    }
  };

  const phases = Object.keys(byPhase) as ProjectPhase[];

  return (
    <div className="space-y-6">
      {phases.map((phase) => (
        <div key={phase}>
          <h4 className="text-sm font-medium text-purple-300 mb-2">{PHASE_LABELS[phase]}</h4>
          <ul className="space-y-2">
            {byPhase[phase].map((m) => (
              <li key={m.id}>
                <label className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-800/50 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={m.completed}
                    onChange={() => handleToggle(m.id, m.completed)}
                    className="mt-1 w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                  />
                  <span
                    className={`text-sm flex-1 ${
                      m.completed ? "text-gray-500 line-through" : "text-gray-200"
                    }`}
                  >
                    {m.title}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
