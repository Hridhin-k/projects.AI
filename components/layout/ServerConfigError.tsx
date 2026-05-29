interface ServerConfigErrorProps {
  message: string;
}

export default function ServerConfigError({ message }: ServerConfigErrorProps) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-[#171725] text-gray-100 p-6">
      <div className="max-w-lg w-full rounded-xl border border-red-500/30 bg-gray-900/80 p-8 text-center">
        <p className="text-4xl mb-4">⚙️</p>
        <h1 className="text-xl font-bold mb-2">Server configuration required</h1>
        <p className="text-sm text-gray-400 mb-4">
          The app cannot connect to Supabase on this deployment. Add the missing variable in
          Vercel → Project → Settings → Environment Variables, then redeploy.
        </p>
        <p className="text-xs font-mono text-red-300 bg-red-950/40 rounded-lg px-3 py-2 mb-6">
          {message}
        </p>
        <p className="text-xs text-gray-500">
          Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
        </p>
      </div>
    </div>
  );
}
