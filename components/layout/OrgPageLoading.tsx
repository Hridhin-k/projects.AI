import { TaskCardSkeleton } from '@/components/ui/Skeleton';

interface OrgPageLoadingProps {
  title?: string;
  variant?: 'grid' | 'kanban' | 'list';
}

export default function OrgPageLoading({ title, variant = 'grid' }: OrgPageLoadingProps) {
  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 max-w-7xl animate-fade-in">
      <div className="mb-8 space-y-3">
        <div className="h-8 w-48 bg-gray-800 rounded-lg animate-pulse" />
        {title ? (
          <p className="text-sm text-gray-500">{title}</p>
        ) : (
          <div className="h-4 w-72 bg-gray-800/70 rounded animate-pulse" />
        )}
      </div>

      {variant === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="p-5 bg-gray-900/50 border border-purple-500/20 rounded-xl space-y-4 animate-pulse"
            >
              <div className="h-5 w-2/3 bg-gray-800 rounded" />
              <div className="h-4 w-full bg-gray-800/70 rounded" />
              <div className="flex gap-3 pt-2">
                <div className="h-8 w-16 bg-gray-800 rounded-full" />
                <div className="h-8 w-20 bg-gray-800 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {variant === 'kanban' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-10 bg-gray-800 rounded-lg animate-pulse" />
              <div className="space-y-2 p-2">
                <TaskCardSkeleton />
                <TaskCardSkeleton />
              </div>
            </div>
          ))}
        </div>
      )}

      {variant === 'list' && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-900/50 border border-gray-700/50 rounded-xl animate-pulse" />
          ))}
        </div>
      )}
    </div>
  );
}
