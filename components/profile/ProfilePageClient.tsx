"use client";

import { useState } from "react";
import type { User } from "@/lib/db/schema";
import { useNotification } from "@/components/ui/useNotification";
import Notification from "@/components/ui/Notification";
import { formatDistanceToNow } from "date-fns";

interface ProfilePageClientProps {
  user: User;
}

export default function ProfilePageClient({ user: initialUser }: ProfilePageClientProps) {
  const [user, setUser] = useState(initialUser);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [isSaving, setIsSaving] = useState(false);
  const { notification, showNotification, clearNotification } = useNotification();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update user name via API
      const response = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setIsEditing(false);
        showNotification("Profile updated successfully!", "success");
      } else {
        const error = await response.json();
        showNotification(error.error || "Failed to update profile", "error");
      }
    } catch (error) {
      showNotification("Failed to update profile", "error");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const roleLabels: Record<string, string> = {
    OWNER: 'Owner',
    ADMIN: 'Admin',
    MANAGER: 'Manager',
    EMPLOYEE: 'Employee',
  };

  const roleColors: Record<string, string> = {
    OWNER: 'bg-purple-700',
    ADMIN: 'bg-purple-600',
    MANAGER: 'bg-teal-700',
    EMPLOYEE: 'bg-gray-600',
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl animate-fade-in">
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

      <div className="mb-6 animate-slide-in-left">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-200">My Profile</h2>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">Manage your profile information</p>
      </div>

      <div className="bg-gray-900 border border-purple-500/20 rounded-xl p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in-scale transition-all duration-300">
        {/* Profile Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-purple-500/20">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-purple-800 to-teal-800 flex items-center justify-center text-gray-200 text-2xl sm:text-3xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-purple-800/15 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-800/30"
                  placeholder="Your name"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !name.trim()}
                    className="px-4 py-2 text-sm font-medium bg-purple-800 hover:bg-purple-900 rounded-lg text-gray-200 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setName(user.name);
                    }}
                    className="px-4 py-2 text-sm font-medium bg-gray-800 border border-gray-700 rounded-lg text-gray-200 hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-200 mb-2">{user.name}</h3>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 text-xs sm:text-sm font-medium bg-purple-800 hover:bg-purple-900 rounded-lg text-gray-200 transition-colors"
                >
                  Edit Profile
                </button>
              </>
            )}
          </div>
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
            <label className="block text-xs font-medium text-gray-400 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </label>
            <p className="text-gray-200 text-base sm:text-lg font-medium">{user.email}</p>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
            <label className="block text-xs font-medium text-gray-400 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Role
            </label>
            <span className={`inline-block px-3 py-1.5 rounded-full text-gray-200 text-sm font-semibold ${roleColors[user.role] || 'bg-gray-600'} shadow-md`}>
              {roleLabels[user.role] || user.role}
            </span>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
            <label className="block text-xs font-medium text-gray-400 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Active Tasks
            </label>
            <p className="text-white text-2xl sm:text-3xl font-bold text-purple-500">{user.tasksCount}</p>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
            <label className="block text-xs font-medium text-gray-400 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Member Since
            </label>
            <p className="text-gray-200 text-base sm:text-lg font-medium">
              {user.createdAt ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true }) : 'N/A'}
            </p>
          </div>
        </div>

        {/* Role-specific Information */}
        {user.role === 'EMPLOYEE' && (
          <div className="pt-6 border-t border-purple-500/20">
            <p className="text-sm text-gray-400">
              As an Employee, you can view and update the status of tasks assigned to you. 
              You cannot create new tasks or view other members' tasks.
            </p>
          </div>
        )}

        {user.role === 'MANAGER' && (
          <div className="pt-6 border-t border-purple-500/20">
            <p className="text-sm text-gray-400">
              As a Manager, you can create tasks, view all members' tasks, and manage tasks assigned to employees. 
              You cannot view other managers or invite new members.
            </p>
          </div>
        )}

        {(user.role === 'ADMIN' || user.role === 'OWNER') && (
          <div className="pt-6 border-t border-purple-500/20">
            <p className="text-sm text-gray-400">
              As an Admin, you have full access to manage the organization, invite members and managers, 
              and view all tasks and users.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

