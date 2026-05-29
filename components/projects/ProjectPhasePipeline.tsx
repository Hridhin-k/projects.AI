"use client";

import type { ProjectPhase } from "@/lib/db/schema";
import { PROJECT_PHASES, PHASE_LABELS, PHASE_ICONS } from "@/lib/projects/constants";
import { updateProject } from "@/lib/db/project-actions";

interface ProjectPhasePipelineProps {
  projectId: string;
  currentPhase: ProjectPhase;
  canEdit: boolean;
  onPhaseChange: () => void;
}

export default function ProjectPhasePipeline({
  projectId,
  currentPhase,
  canEdit,
  onPhaseChange,
}: ProjectPhasePipelineProps) {
  const currentIndex = PROJECT_PHASES.indexOf(currentPhase);

  const handlePhaseClick = async (phase: ProjectPhase) => {
    if (!canEdit || phase === currentPhase) return;
    try {
      await updateProject(projectId, { phase });
      onPhaseChange();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="overflow-x-auto pb-2 -mx-1 px-1">
      <div className="flex min-w-max gap-1 sm:gap-2">
        {PROJECT_PHASES.filter((p) => p !== "ARCHIVED").map((phase, index) => {
          const isPast = index < currentIndex;
          const isCurrent = phase === currentPhase;
          const isFuture = index > currentIndex;

          return (
            <button
              key={phase}
              type="button"
              disabled={!canEdit}
              onClick={() => handlePhaseClick(phase)}
              className={`flex flex-col items-center gap-1 px-2 sm:px-3 py-2 rounded-lg transition-all min-w-[72px] sm:min-w-[88px] ${
                isCurrent
                  ? "bg-purple-800/30 border border-purple-500/50 text-purple-200"
                  : isPast
                    ? "bg-teal-900/20 border border-teal-700/30 text-teal-300"
                    : "bg-gray-800/30 border border-gray-700/30 text-gray-500"
              } ${canEdit && !isCurrent ? "hover:border-purple-500/40 cursor-pointer" : "cursor-default"}`}
            >
              <span className="text-lg">{PHASE_ICONS[phase]}</span>
              <span className="text-[10px] sm:text-xs font-medium text-center leading-tight">
                {PHASE_LABELS[phase]}
              </span>
              {isPast && <span className="text-[10px] text-teal-400">✓</span>}
              {isFuture && canEdit && <span className="text-[10px] text-gray-600">tap</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
