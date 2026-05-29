"use client";

import { useState } from "react";
import type { Deployment, DeploymentEnvironment } from "@/lib/db/schema";
import { createDeployment } from "@/lib/db/project-actions";
import { format } from "date-fns";

interface DeploymentTrackerProps {
  projectId: string;
  deployments: Array<
    Deployment & {
      deployedBy?: { name: string } | null;
    }
  >;
  canManage: boolean;
  onUpdate: () => void;
}

const ENV_LABELS: Record<DeploymentEnvironment, string> = {
  DEVELOPMENT: "Development",
  STAGING: "Staging",
  PRODUCTION: "Production",
};

const STATUS_STYLES: Record<string, string> = {
  SUCCESS: "text-green-400 bg-green-900/30",
  FAILED: "text-red-400 bg-red-900/30",
  IN_PROGRESS: "text-amber-400 bg-amber-900/30",
  PENDING: "text-gray-400 bg-gray-800/50",
  ROLLED_BACK: "text-orange-400 bg-orange-900/30",
};

export default function DeploymentTracker({
  projectId,
  deployments,
  canManage,
  onUpdate,
}: DeploymentTrackerProps) {
  const [showForm, setShowForm] = useState(false);
  const [environment, setEnvironment] = useState<DeploymentEnvironment>("STAGING");
  const [version, setVersion] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!version.trim()) return;
    setIsSubmitting(true);
    try {
      await createDeployment({
        projectId,
        environment,
        version: version.trim(),
        notes: notes.trim() || undefined,
        status: "SUCCESS",
      });
      setVersion("");
      setNotes("");
      setShowForm(false);
      onUpdate();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {canManage && (
        <div>
          {!showForm ? (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="px-4 py-2 text-sm font-medium bg-teal-800/40 border border-teal-600/40 rounded-lg text-teal-200 hover:bg-teal-800/60 transition-colors"
            >
              + Record deployment
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Environment</label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value as DeploymentEnvironment)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 text-sm"
                  >
                    <option value="DEVELOPMENT">Development</option>
                    <option value="STAGING">Staging</option>
                    <option value="PRODUCTION">Production</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Version *</label>
                  <input
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 text-sm"
                    placeholder="v1.0.0"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Notes</label>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 text-sm"
                  placeholder="What shipped in this release?"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-3 py-2 text-sm text-gray-400 hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm bg-teal-700 rounded-lg text-white disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save deployment"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {deployments.length === 0 ? (
        <p className="text-sm text-gray-500">No deployments recorded yet.</p>
      ) : (
        <ul className="space-y-2">
          {deployments.map((d) => (
            <li
              key={d.id}
              className="flex flex-wrap items-center gap-2 sm:gap-4 p-3 bg-gray-800/40 border border-gray-700/50 rounded-lg text-sm"
            >
              <span className="font-mono text-teal-300">{d.version}</span>
              <span className="text-gray-400">{ENV_LABELS[d.environment]}</span>
              <span className={`px-2 py-0.5 rounded text-xs ${STATUS_STYLES[d.status] || STATUS_STYLES.PENDING}`}>
                {d.status}
              </span>
              {d.deployedAt && (
                <span className="text-gray-500 text-xs">
                  {format(new Date(d.deployedAt), "MMM d, yyyy HH:mm")}
                </span>
              )}
              {d.deployedBy?.name && (
                <span className="text-gray-500 text-xs">by {d.deployedBy.name}</span>
              )}
              {d.notes && <span className="w-full text-gray-400 text-xs mt-1">{d.notes}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
