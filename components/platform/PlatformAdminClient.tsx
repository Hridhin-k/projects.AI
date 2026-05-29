"use client";

import { useState } from "react";
import {
  fetchPlatformOrganizations,
  fetchPlatformStats,
  setOrganizationActive,
  type PlatformOrganization,
} from "@/lib/db/platform-actions";

interface PlatformAdminClientProps {
  initialOrganizations: PlatformOrganization[];
  initialStats: Awaited<ReturnType<typeof fetchPlatformStats>>;
}

export default function PlatformAdminClient({
  initialOrganizations,
  initialStats,
}: PlatformAdminClientProps) {
  const [orgs, setOrgs] = useState(initialOrganizations);
  const [stats, setStats] = useState(initialStats);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const [organizations, platformStats] = await Promise.all([
        fetchPlatformOrganizations(),
        fetchPlatformStats(),
      ]);
      setOrgs(organizations);
      setStats(platformStats);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load platform data");
    }
  };

  const toggleActive = async (orgId: string, isActive: boolean) => {
    try {
      await setOrganizationActive(orgId, isActive);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update organization");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100">Platform Admin</h1>
        <p className="text-gray-400 mt-1">
          Manage all customer organizations on projects.ai
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-900/30 border border-red-500/40 text-red-200 text-sm">
          {error}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Organizations", value: stats.totalOrganizations },
            { label: "Active orgs", value: stats.activeOrganizations },
            { label: "Total users", value: stats.totalUsers },
            { label: "Total projects", value: stats.totalProjects },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-purple-800/20 bg-gray-900/80 p-4"
            >
              <p className="text-xs text-gray-400">{item.label}</p>
              <p className="text-2xl font-bold text-gray-100 mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-purple-800/20 bg-gray-900/80 overflow-hidden">
        <div className="px-4 py-3 border-b border-purple-800/20">
          <h2 className="font-semibold text-gray-200">All organizations</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-400 text-left bg-gray-950/50">
              <tr>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Members</th>
                <th className="px-4 py-3 font-medium">Projects</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => (
                <tr key={org.id} className="border-t border-gray-800/80">
                  <td className="px-4 py-3 text-gray-200">{org.name}</td>
                  <td className="px-4 py-3 text-gray-400">{org.plan}</td>
                  <td className="px-4 py-3 text-gray-400">{org.memberCount}</td>
                  <td className="px-4 py-3 text-gray-400">{org.projectCount}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                        org.isActive
                          ? "bg-teal-900/40 text-teal-200"
                          : "bg-red-900/40 text-red-200"
                      }`}
                    >
                      {org.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleActive(org.id, !org.isActive)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                      {org.isActive ? "Suspend" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
              {orgs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No organizations yet. Customers sign up at /sign-up to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
