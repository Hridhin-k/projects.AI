"use client";

import { useState, useCallback, useMemo } from "react";
import { useDebouncedCallback } from "use-debounce";

type TaskStatus = "TO_DO" | "IN_PROGRESS" | "DONE" | "BLOCKED";

interface TaskFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  members?: Array<{ id: string; name: string }>;
}

export interface FilterState {
  search: string;
  status: TaskStatus | "ALL";
  priority: "ALL" | "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assignee: string | "ALL";
}

export default function TaskFilters({ onFilterChange, members = [] }: TaskFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "ALL",
    priority: "ALL",
    assignee: "ALL",
  });

  // Debounce search input to avoid excessive filtering
  const debouncedFilterChange = useDebouncedCallback(
    (newFilters: FilterState) => {
      onFilterChange(newFilters);
    },
    300 // 300ms delay
  );

  const handleFilterChange = useCallback((key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Debounce only for search, immediate for others
    if (key === "search") {
      debouncedFilterChange(newFilters);
    } else {
      onFilterChange(newFilters);
    }
  }, [filters, onFilterChange, debouncedFilterChange]);

  const hasActiveFilters = filters.search || filters.status !== "ALL" || filters.priority !== "ALL" || filters.assignee !== "ALL";

  return (
    <div className="bg-gray-900/50 border border-purple-500/20 rounded-lg p-3 sm:p-4 lg:p-5 space-y-3 sm:space-y-4 animate-fade-in transition-all duration-300">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-300 hidden sm:block">Filters</h3>
        {hasActiveFilters && (
          <span className="text-xs text-purple-300 bg-purple-900/20 px-2 py-1 rounded-full border border-purple-700/30">
            {[
              filters.search && "Search",
              filters.status !== "ALL" && "Status",
              filters.priority !== "ALL" && "Priority",
              filters.assignee !== "ALL" && "Assignee"
            ].filter(Boolean).length} active
          </span>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 lg:gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-gray-800 border border-purple-800/15 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-800/30 transition-all duration-200 focus:border-purple-800/25 text-sm sm:text-base min-h-[44px]"
            />
          </div>
        </div>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          className="px-3 sm:px-4 py-2.5 sm:py-2 bg-gray-800 border border-purple-800/15 rounded-lg text-gray-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-800/30 transition-all duration-200 focus:border-purple-800/25 min-h-[44px] cursor-pointer"
        >
          <option value="ALL">All Status</option>
          <option value="TO_DO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
          <option value="BLOCKED">Blocked</option>
        </select>

        {/* Priority Filter */}
        <select
          value={filters.priority}
          onChange={(e) => handleFilterChange("priority", e.target.value)}
          className="px-3 sm:px-4 py-2.5 sm:py-2 bg-gray-800 border border-purple-800/15 rounded-lg text-gray-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-800/30 transition-all duration-200 focus:border-purple-800/25 min-h-[44px] cursor-pointer"
        >
          <option value="ALL">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>

        {/* Assignee Filter */}
        {members.length > 0 && (
          <select
            value={filters.assignee}
            onChange={(e) => handleFilterChange("assignee", e.target.value)}
            className="px-3 sm:px-4 py-2.5 sm:py-2 bg-gray-800 border border-purple-800/15 rounded-lg text-gray-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-800/30 transition-all duration-200 focus:border-purple-800/25 min-h-[44px] cursor-pointer"
          >
            <option value="ALL">All Assignees</option>
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        )}

        {/* Clear Filters */}
        {(filters.search || filters.status !== "ALL" || filters.priority !== "ALL" || filters.assignee !== "ALL") && (
          <button
            onClick={() => {
              const resetFilters = {
                search: "",
                status: "ALL" as const,
                priority: "ALL" as const,
                assignee: "ALL" as const,
              };
              setFilters(resetFilters);
              onFilterChange(resetFilters);
            }}
            className="px-4 py-2.5 sm:py-2 bg-gray-800 border border-purple-500/20 rounded-lg text-white hover:bg-gray-700 transition-all duration-200 text-sm sm:text-base font-medium min-h-[44px] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

