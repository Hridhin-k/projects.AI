"use client";

import { useState } from "react";
import {
  fetchMembers,
  fetchPerformanceMetrics,
  fetchStoredPerformanceMetrics,
  getInvites,
} from "@/lib/db/actions";
import type { User, PerformanceMetric } from "@/lib/db/schema";
import type { Invite } from "@/lib/db/schema";
import InviteMember from "@/components/members/InviteMember";
import MemberActions from "@/components/members/MemberActions";
import { useNotification } from "@/components/ui/useNotification";
import Notification from "@/components/ui/Notification";

interface MembersPageClientProps {
  initialMembers: User[];
  initialMetrics: PerformanceMetric[];
  initialInvites: Invite[];
  currentUser: User;
}

export default function MembersPageClient({
  initialMembers,
  initialMetrics,
  initialInvites,
  currentUser,
}: MembersPageClientProps) {
  const [members, setMembers] = useState(initialMembers);
  const [metrics, setMetrics] = useState(initialMetrics);
  const [invites, setInvites] = useState(initialInvites);
  const [monitoring, setMonitoring] = useState(false);
  const { notification, showNotification, clearNotification } = useNotification();

  const loadData = async (recalculateMetrics = false) => {
    try {
      const [fetchedMembers, fetchedMetrics, fetchedInvites] = await Promise.all([
        fetchMembers(),
        recalculateMetrics ? fetchPerformanceMetrics(true) : fetchStoredPerformanceMetrics(),
        getInvites().catch(() => []),
      ]);
      setMembers(fetchedMembers);
      setMetrics(fetchedMetrics);
      setInvites(fetchedInvites);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const getMetricForUser = (userId: string): PerformanceMetric | undefined => {
    return metrics.find((m) => m.userId === userId);
  };

  const getWorkloadColor = (tasksCount: number): string => {
    if (tasksCount === 0) return "text-teal-600";
    if (tasksCount <= 2) return "text-green-600";
    if (tasksCount <= 4) return "text-amber-600";
    return "text-red-700";
  };

  const handleMonitorPerformance = async () => {
    setMonitoring(true);
    try {
      const response = await fetch('/api/performance/monitor', {
        method: 'POST',
      });
      const result = await response.json();
      
      if (result.success) {
        showNotification(`Performance monitoring completed! Evaluated ${result.evaluated} member(s).`, "success");
        await loadData(true);
      } else {
        showNotification(`Monitoring completed with some errors: ${result.errors?.join(', ') || result.error}`, "error");
        await loadData(true);
      }
    } catch (error) {
      console.error('Error monitoring performance:', error);
      showNotification('Failed to monitor performance. Please try again.', "error");
    } finally {
      setMonitoring(false);
    }
  };

  const canMonitor =
    currentUser.role === "ADMIN" ||
    currentUser.role === "OWNER" ||
    currentUser.role === "MANAGER";

  if (currentUser.role === "EMPLOYEE") {
    return (
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 animate-fade-in max-w-7xl">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 sm:p-8 text-center animate-fade-in-scale">
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-200 mb-3">Access Denied</h2>
            <p className="text-gray-300 mb-6 text-sm sm:text-base leading-relaxed">
              You do not have permission to view the members page. Employees can only view and manage their own tasks.
            </p>
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-800 hover:bg-purple-900 rounded-lg text-gray-200 font-medium transition-all duration-200 hover:shadow-lg hover:shadow-purple-800/10 hover:-translate-y-0.5 active:translate-y-0 min-h-[44px]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 animate-fade-in max-w-7xl">
        {/* Notification */}
        {notification && (
          <div className="mb-4 animate-slide-down">
            <Notification
              message={notification.message}
              type={notification.type}
              onClose={clearNotification}
            />
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-5 lg:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-200">Team Members</h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              {members.length} {members.length === 1 ? "member" : "members"}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {canMonitor && (
              <button
                onClick={handleMonitorPerformance}
                disabled={monitoring}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-teal-800 hover:bg-teal-900 disabled:bg-teal-950 disabled:opacity-50 rounded-lg text-gray-200 text-xs sm:text-sm font-medium transition-colors flex items-center gap-2"
                title="Trigger AI performance monitoring for all members"
              >
                {monitoring ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="hidden sm:inline">Monitoring...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="hidden sm:inline">Monitor Performance</span>
                    <span className="sm:hidden">Monitor</span>
                  </>
                )}
              </button>
            )}
            {currentUser && (
              <div className="flex-shrink-0">
                <InviteMember
                  userRole={currentUser.role}
                  onInviteSent={loadData}
                />
              </div>
            )}
          </div>
        </div>

        {/* Pending Invites */}
        {invites.filter(i => !i.used).length > 0 && (
          <div className="mb-6 bg-gray-900/50 border border-purple-500/20 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Pending Invitations</h3>
            <div className="space-y-2">
              {invites
                .filter(i => !i.used)
                .map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3"
                  >
                    <div>
                      <p className="text-gray-200 text-sm">{invite.email}</p>
                      <p className="text-gray-400 text-xs">
                        Role: {invite.role} • Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs text-yellow-400">Pending</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          {members.map((member, index) => {
            const metric = getMetricForUser(member.id);
            return (
              <div
                key={member.id}
                className="bg-gray-900 border border-purple-800/15 rounded-xl p-4 sm:p-6 space-y-3 sm:space-y-4 hover:border-purple-800/25 transition-all duration-300 hover:shadow-lg hover:shadow-purple-800/5 hover:-translate-y-1 animate-fade-in-scale"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Member Info */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-purple-800 to-teal-800 flex items-center justify-center text-gray-200 text-lg sm:text-xl font-bold flex-shrink-0 shadow-lg">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-200 mb-0.5 truncate">{member.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-400 truncate">{member.email}</p>
                    <div className="mt-1">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        member.role === 'OWNER' ? 'bg-purple-700/20 text-purple-200' :
                        member.role === 'ADMIN' ? 'bg-purple-600/20 text-purple-200' :
                        member.role === 'MANAGER' ? 'bg-teal-700/20 text-teal-200' :
                        'bg-gray-600/20 text-gray-300'
                      }`}>
                        {member.role}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Workload */}
                <div className="border-t border-purple-500/20 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="text-sm text-gray-400">Active Tasks</span>
                    </div>
                    <span className={`text-lg sm:text-xl font-bold ${getWorkloadColor(member.tasksCount)}`}>
                      {member.tasksCount}
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        member.tasksCount === 0
                          ? "bg-teal-500"
                          : member.tasksCount <= 2
                          ? "bg-green-500"
                          : member.tasksCount <= 4
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min((member.tasksCount / 10) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {member.tasksCount === 0 
                      ? "No active tasks" 
                      : member.tasksCount <= 2 
                      ? "Light workload" 
                      : member.tasksCount <= 4 
                      ? "Moderate workload" 
                      : "Heavy workload"}
                  </p>
                </div>

                {/* Performance Metrics */}
                {metric && (
                  <div className="border-t border-purple-500/20 pt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-800/50 rounded-lg p-2.5 border border-gray-700/30">
                        <div className="flex items-center gap-1.5 mb-1">
                          <svg className="w-3.5 h-3.5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs text-gray-400">Completion</span>
                        </div>
                        <span className="text-lg font-bold text-teal-600">
                          {metric.completionRate}%
                        </span>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-2.5 border border-gray-700/30">
                        <div className="flex items-center gap-1.5 mb-1">
                          <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs text-gray-400">Avg. Time</span>
                        </div>
                        <span className="text-lg font-bold text-purple-600">
                          {metric.averageTimeDays.toFixed(1)}d
                        </span>
                      </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-700/30">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-400">{metric.tasksCompleted}</div>
                        <div className="text-[10px] text-gray-500">Done</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-yellow-400">{metric.tasksInProgress}</div>
                        <div className="text-[10px] text-gray-500">Active</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-400">{metric.tasksOverdue}</div>
                        <div className="text-[10px] text-gray-500">Overdue</div>
                      </div>
                    </div>

                    {/* AI Evaluation */}
                    {metric.lastAIEvaluation && (
                      <div className="mt-4 pt-4 border-t border-purple-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          <h4 className="text-sm font-semibold text-gray-300">AI Evaluation</h4>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
                          {metric.lastAIEvaluation}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {!metric && (
                  <div className="border-t border-purple-500/20 pt-4">
                    <p className="text-xs text-gray-500">No performance metrics available</p>
                  </div>
                )}

                {currentUser && (
                  <MemberActions
                    member={member}
                    currentUserId={currentUser.id}
                    currentUserRole={currentUser.role}
                    onUpdated={loadData}
                    onNotify={showNotification}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

