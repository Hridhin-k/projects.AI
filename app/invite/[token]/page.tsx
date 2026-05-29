"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { addMemberViaInvite } from "@/lib/db/actions";

export default function InviteAcceptancePage() {
  const params = useParams();
  const router = useRouter();
  const [invite, setInvite] = useState<{ email: string; role: string; token: string } | null>(null);
  const [authUser, setAuthUser] = useState<{ id: string; email?: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setAuthUser({
          id: user.id,
          email: user.email,
          name:
            (user.user_metadata?.full_name as string) ||
            user.email?.split("@")[0] ||
            "User",
        });
      }

      if (!params.token) return;
      try {
        const response = await fetch(`/api/invites?token=${params.token}`);
        if (!response.ok) {
          setError("Invalid or expired invite link");
        } else {
          setInvite(await response.json());
        }
      } catch {
        setError("Failed to load invite");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.token]);

  const handleAccept = async () => {
    if (!authUser || !invite) return;

    setAccepting(true);
    try {
      await addMemberViaInvite(invite.token, authUser.id, authUser.name);
      router.push("/projects");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invite");
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-gray-200 animate-pulse">Loading invitation...</div>
    );
  }

  if (error && !invite) {
    return (
      <div className="w-full max-w-md rounded-xl border border-red-500/30 bg-red-900/20 p-8 text-center">
        <h2 className="text-xl font-semibold text-red-400 mb-3">Invalid Invite</h2>
        <p className="text-gray-300 mb-6">{error}</p>
        <Link href="/sign-in" className="text-purple-300 hover:underline">
          Go to Sign In
        </Link>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="w-full max-w-md rounded-xl border border-purple-800/20 bg-gray-900 p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-200 mb-3">Sign In Required</h2>
        <p className="text-gray-300 mb-6 text-sm">Sign in or create an account with {invite?.email} to accept.</p>
        <Link
          href={`/sign-in?redirect=/invite/${params.token}`}
          className="inline-block px-6 py-3 bg-purple-800 rounded-lg text-gray-200 font-medium"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-xl border border-purple-500/30 bg-gray-900 p-8">
      <h2 className="text-2xl font-bold text-gray-200 mb-2 text-center">Accept Invitation</h2>
      <p className="text-gray-400 text-sm text-center mb-6">Join your team on Projects.AI</p>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3 mb-6 bg-gray-800/50 rounded-lg p-4 text-sm">
        <p>
          <span className="text-gray-400">Email: </span>
          <span className="text-gray-200">{invite?.email}</span>
        </p>
        <p>
          <span className="text-gray-400">Role: </span>
          <span className="text-gray-200">{invite?.role}</span>
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => router.push("/")}
          className="flex-1 px-4 py-2.5 text-sm border border-gray-700 rounded-lg text-gray-300"
        >
          Cancel
        </button>
        <button
          onClick={handleAccept}
          disabled={accepting}
          className="flex-1 px-4 py-2.5 text-sm bg-purple-800 rounded-lg text-white disabled:opacity-50"
        >
          {accepting ? "Accepting..." : "Accept"}
        </button>
      </div>
    </div>
  );
}
