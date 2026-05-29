export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh w-full place-items-center bg-[#171725] text-gray-100 p-4 sm:p-6">
      {children}
    </main>
  );
}
