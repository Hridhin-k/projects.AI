"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const AIChatBox = dynamic(() => import("./AIChatBox"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center text-gray-400 text-sm">
      Loading assistant…
    </div>
  ),
});

interface AIChatFABProps {
  projectId?: string;
}

export default function AIChatFAB({ projectId }: AIChatFABProps = {} as AIChatFABProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 sm:bottom-28 md:bottom-32 right-4 sm:right-6 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-700 via-purple-600 to-teal-700 rounded-full shadow-2xl hover:shadow-purple-700/30 transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center text-white z-40 animate-bounce-in group animate-float"
        aria-label="Open AI Assistant"
        title="Chat with Projects.AI Assistant"
      >
        {/* Pulsing ring animation for attention */}
        <div className="absolute inset-0 rounded-full bg-purple-700/20 animate-ping" style={{ animationDuration: '2s' }} />
        <div className="absolute inset-0 rounded-full bg-purple-700/10 animate-pulse" style={{ animationDuration: '2s' }} />
        
        {/* Icon */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          <svg
            className="w-7 h-7 sm:w-9 sm:h-9 group-hover:scale-110 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span className="text-[8px] sm:text-[10px] font-bold mt-0.5 opacity-90">AI</span>
        </div>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fade-in"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 w-full sm:w-auto sm:max-w-2xl lg:max-w-3xl sm:left-1/2 sm:-translate-x-1/2 h-[85vh] sm:h-[90vh] max-h-[90vh] bg-gray-900 border-t sm:border border-purple-800/20 rounded-t-2xl sm:rounded-t-2xl shadow-2xl z-50 flex flex-col animate-slide-up overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-purple-800/15 bg-gradient-to-r from-purple-900/15 to-teal-900/15 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-800 to-teal-800 flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6 sm:w-7 sm:h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-200">Projects.AI Assistant</h2>
                  <p className="text-xs sm:text-sm text-gray-400">Your intelligent task management companion</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close"
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* AI Chat Box Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <AIChatBox projectId={projectId} />
            </div>
          </div>
        </>
      )}
    </>
  );
}

