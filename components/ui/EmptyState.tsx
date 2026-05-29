"use client";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

export default function EmptyState({ 
  icon = "📋", 
  title, 
  description, 
  action,
  secondaryAction 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 text-center animate-fade-in-scale">
      <div className="text-5xl sm:text-6xl mb-4 animate-bounce-in">{icon}</div>
      <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-200 mb-2 animate-slide-in-left">{title}</h3>
      <p className="text-gray-400 max-w-md mb-6 text-sm sm:text-base animate-slide-in-right leading-relaxed">{description}</p>
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
        {action && (
          <button
            onClick={action.onClick}
            className="px-6 py-3 bg-gradient-to-r from-purple-800 to-purple-900 hover:from-purple-900 hover:to-purple-950 rounded-lg text-gray-200 font-medium transition-all duration-200 hover:shadow-lg hover:shadow-purple-800/10 hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 min-h-[44px]"
          >
            {action.icon}
            {action.label}
          </button>
        )}
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-300 font-medium transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 min-h-[44px]"
          >
            {secondaryAction.icon}
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}

