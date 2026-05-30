"use client";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

export default function Skeleton({
  className = "",
  variant = "rectangular",
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const baseClasses = "bg-gray-800 rounded";
  const variantClasses = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };
  const animationClass = animate ? "animate-pulse" : "";

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height) style.height = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClass} ${className}`}
      style={style}
      aria-label="Loading..."
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Pre-built skeleton components
export function TaskCardSkeleton() {
  return (
    <div className="p-3 sm:p-4 bg-gray-800 border border-gray-700/30 rounded-lg space-y-3">
      <Skeleton variant="text" width="60%" height={16} />
      <Skeleton variant="text" width="100%" height={12} />
      <Skeleton variant="text" width="80%" height={12} />
      <div className="flex items-center justify-between pt-2">
        <Skeleton variant="text" width={80} height={12} />
        <Skeleton variant="circular" width={40} height={40} />
      </div>
    </div>
  );
}

export function KanbanColumnSkeleton() {
  return (
    <div className="flex flex-col space-y-2">
      <Skeleton variant="rectangular" width="100%" height={40} />
      <div className="space-y-2 p-2">
        <TaskCardSkeleton />
        <TaskCardSkeleton />
        <TaskCardSkeleton />
      </div>
    </div>
  );
}

