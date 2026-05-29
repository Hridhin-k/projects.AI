export default function OrgShellHeaderFallback() {
  return (
    <header className="border-b border-purple-500/20 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex items-center justify-between gap-4">
        <div className="h-8 w-32 bg-gray-800 rounded-lg animate-pulse" />
        <div className="h-9 w-9 bg-gray-800 rounded-full animate-pulse" />
      </div>
    </header>
  );
}
