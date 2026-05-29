"use client";

import { useState } from "react";
import { createInvite } from "@/lib/db/actions";
import { useNotification } from "@/components/ui/useNotification";
import Notification from "@/components/ui/Notification";

type InviteRole = "ADMIN" | "MANAGER" | "EMPLOYEE";

interface InviteMemberProps {
  userRole: string;
  onInviteSent: () => void;
}

export default function InviteMember({ userRole, onInviteSent }: InviteMemberProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("EMPLOYEE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { notification, showNotification, clearNotification } = useNotification();

  const canInvite = userRole === "OWNER" || userRole === "ADMIN";
  const canInviteAdmins = userRole === "OWNER";

  if (!canInvite) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      const { inviteLink } = await createInvite(email.trim(), role);
      showNotification(`Invite sent to ${email}! Link: ${inviteLink}`, "success");
      setEmail("");
      setRole("EMPLOYEE");
      setIsOpen(false);
      onInviteSent();
    } catch (error) {
      showNotification(error instanceof Error ? error.message : "Failed to send invite", "error");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-800 hover:bg-purple-900 rounded-lg text-gray-200 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
      >
        <span className="hidden sm:inline">Invite Member</span>
        <span className="sm:hidden">Invite</span>
      </button>
    );
  }

  return (
    <>
      {notification && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[60] w-full max-w-md px-4">
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={clearNotification}
          />
        </div>
      )}

      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={() => setIsOpen(false)}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-gray-900 border border-purple-800/20 rounded-xl shadow-2xl p-5 sm:p-6 lg:p-8 max-w-md w-full animate-fade-in-scale max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-5 sm:mb-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-200">Invite Team Member</h3>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                Send an invitation to join your organization
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-200 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email address *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                required
                className="w-full px-4 py-2.5 bg-gray-800 border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 min-h-[44px]"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Role *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as InviteRole)}
                className="w-full px-4 py-2.5 bg-gray-800 border border-purple-800/15 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-800/30 min-h-[44px] cursor-pointer"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
                {canInviteAdmins && <option value="ADMIN">Admin</option>}
              </select>
              {canInviteAdmins && (
                <p className="text-xs text-gray-500 mt-2">
                  Admins can invite managers and employees. Only you (owner) can invite other admins.
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-200 bg-gradient-to-r from-purple-800 to-purple-900 hover:from-purple-900 hover:to-purple-950 rounded-lg disabled:opacity-50 min-h-[44px]"
              >
                {isSubmitting ? "Sending…" : "Send invite"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
