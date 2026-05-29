"use client";

import { useState } from "react";
import { updateMemberRole, removeMemberFromOrganization } from "@/lib/db/actions";
import type { User } from "@/lib/db/schema";

type TeamRole = "ADMIN" | "MANAGER" | "EMPLOYEE";

interface MemberActionsProps {
  member: User;
  currentUserId: string;
  currentUserRole: string;
  onUpdated: () => void;
  onNotify: (message: string, type: "success" | "error") => void;
}

export default function MemberActions({
  member,
  currentUserId,
  currentUserRole,
  onUpdated,
  onNotify,
}: MemberActionsProps) {
  const [busy, setBusy] = useState(false);

  const canManage =
    (currentUserRole === "OWNER" || currentUserRole === "ADMIN") &&
    member.id !== currentUserId &&
    member.role !== "OWNER";

  if (!canManage) return null;

  const canChangeRole =
    currentUserRole === "OWNER" ||
    (currentUserRole === "ADMIN" && member.role !== "ADMIN");

  const roleOptions: TeamRole[] = ["EMPLOYEE", "MANAGER"];
  if (currentUserRole === "OWNER") roleOptions.unshift("ADMIN");

  const handleRoleChange = async (role: TeamRole) => {
    if (role === member.role) return;
    setBusy(true);
    try {
      await updateMemberRole(member.id, role);
      onNotify(`Updated ${member.name}'s role to ${role}`, "success");
      onUpdated();
    } catch (e) {
      onNotify(e instanceof Error ? e.message : "Failed to update role", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm(`Remove ${member.name} from your organization?`)) return;
    setBusy(true);
    try {
      await removeMemberFromOrganization(member.id);
      onNotify(`${member.name} was removed from the organization`, "success");
      onUpdated();
    } catch (e) {
      onNotify(e instanceof Error ? e.message : "Failed to remove member", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-t border-purple-500/20 pt-4 flex flex-col gap-2">
      {canChangeRole && (
        <select
          value={member.role}
          disabled={busy}
          onChange={(e) => handleRoleChange(e.target.value as TeamRole)}
          className="w-full px-3 py-2 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
        >
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {role.charAt(0) + role.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={handleRemove}
        className="w-full px-3 py-2 text-xs rounded-lg border border-red-800/40 text-red-300 hover:bg-red-900/20 disabled:opacity-50"
      >
        Remove from organization
      </button>
    </div>
  );
}
