"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "sign-in" | "sign-up";

interface AuthFormProps {
  mode: Mode;
  redirectTo?: string;
}

function formatAuthError(message: string): string {
  if (message.includes("Error sending confirmation email")) {
    return (
      "Supabase could not send the confirmation email via Resend. Check Supabase → " +
      "Authentication → SMTP (host smtp.resend.com, user resend, password = re_ API key) " +
      "and use a sender on a verified domain in Resend. For local dev you can turn off " +
      "“Confirm email” under Authentication → Providers → Email."
    );
  }
  if (message.includes("over_email_send_rate_limit") || message.includes("email rate limit exceeded")) {
    return (
      "Supabase email rate limit reached (from too many sign-up or password-reset attempts). " +
      "Sign in with your email and password only — do not click Forgot password for now. " +
      "The limit usually clears in about an hour."
    );
  }
  if (message.includes("User already registered")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (message.includes("Email not confirmed")) {
    return "Confirm your email first (check your inbox), then sign in.";
  }
  if (message.includes("email_address_invalid") || message.includes("Email address") && message.includes("is invalid")) {
    return (
      "Supabase rejected this email on sign-up. If this is your platform admin email, use Sign in instead " +
      "(your account may already exist). Otherwise try a different email or use Forgot password on the sign-in page."
    );
  }
  if (message.includes("SUPABASE_SERVICE_ROLE_KEY") || message.includes("Server misconfigured")) {
    return message;
  }
  return message;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

async function checkPlatformAdminEmail(email: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/auth/platform-admin?email=${encodeURIComponent(email)}`);
    if (!res.ok) return false;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) return false;
    const body = (await res.json()) as { isPlatformAdmin?: boolean };
    return body.isPlatformAdmin === true;
  } catch {
    return false;
  }
}

export default function AuthForm({ mode, redirectTo = "/projects" }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);
  const [isPlatformAdminSignup, setIsPlatformAdminSignup] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const isSignUp = mode === "sign-up";
  const normalizedEmail = normalizeEmail(email);

  useEffect(() => {
    if (!isSignUp || !normalizedEmail.includes("@")) {
      setIsPlatformAdminSignup(false);
      return;
    }

    let cancelled = false;
    checkPlatformAdminEmail(normalizedEmail).then((isAdmin) => {
      if (!cancelled) setIsPlatformAdminSignup(isAdmin);
    });

    return () => {
      cancelled = true;
    };
  }, [isSignUp, normalizedEmail]);

  const handleForgotPassword = async () => {
    if (!normalizedEmail) {
      setError("Enter your email first, then click Forgot password.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=/platform`,
      });
      if (resetError) throw resetError;
      setResetEmailSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailConfirmationSent(false);
    setLoading(true);

    const supabase = createClient();

    try {
      if (isSignUp) {
        const platformAdmin = isPlatformAdminSignup || (await checkPlatformAdminEmail(normalizedEmail));

        if (!platformAdmin && !organizationName.trim()) {
          throw new Error("Organization name is required.");
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              full_name: name.trim() || undefined,
              organization_name: platformAdmin ? undefined : organizationName.trim() || undefined,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(platformAdmin ? "/platform" : redirectTo)}`,
          },
        });
        if (signUpError) throw signUpError;

        if (!data.session) {
          setEmailConfirmationSent(true);
          return;
        }

        router.push(platformAdmin ? "/platform" : redirectTo);
        router.refresh();
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (signInError) throw signInError;

        // Profile is provisioned on the next server render (getCurrentUser in layout)
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Authentication failed";
      setError(formatAuthError(raw));
    } finally {
      setLoading(false);
    }
  };

  if (resetEmailSent) {
    return (
      <div className="w-full max-w-md rounded-xl border border-purple-800/20 bg-gray-900/80 p-6 sm:p-8 shadow-xl backdrop-blur-sm">
        <h1 className="text-2xl font-bold text-gray-100 mb-2">Check your email</h1>
        <p className="text-sm text-gray-400 mb-6">
          Password reset link sent to <span className="text-gray-200">{normalizedEmail}</span>.
        </p>
        <Link
          href="/sign-in"
          className="block w-full py-2.5 text-center bg-gradient-to-r from-purple-700 to-teal-700 rounded-lg text-white font-medium hover:shadow-lg transition-all"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  if (emailConfirmationSent) {
    return (
      <div className="w-full max-w-md rounded-xl border border-purple-800/20 bg-gray-900/80 p-6 sm:p-8 shadow-xl backdrop-blur-sm">
        <h1 className="text-2xl font-bold text-gray-100 mb-2">Check your email</h1>
        <p className="text-sm text-gray-400 mb-4">
          We sent a confirmation link to <span className="text-gray-200">{email}</span>.
          Click the link to activate your account, then you can sign in.
        </p>
        <p className="text-xs text-gray-500 mb-6">
          If you do not see it, check spam or wait a minute and try again.
        </p>
        <Link
          href="/sign-in"
          className="block w-full py-2.5 text-center bg-gradient-to-r from-purple-700 to-teal-700 rounded-lg text-white font-medium hover:shadow-lg transition-all"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-xl border border-purple-800/20 bg-gray-900/80 p-6 sm:p-8 shadow-xl backdrop-blur-sm">
      <h1 className="text-2xl font-bold text-gray-100 mb-2">
        {isSignUp ? "Create your account" : "Welcome back"}
      </h1>
      <p className="text-sm text-gray-400 mb-6">
        {isSignUp
          ? isPlatformAdminSignup
            ? "Create your platform admin account to manage all organizations."
            : "Create your organization and start managing projects."
          : "Sign in to your projects.ai workspace."}
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-500/40 text-red-200 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:border-purple-500 focus:outline-none"
                placeholder="Your name"
              />
            </div>
            {isPlatformAdminSignup ? (
              <div className="rounded-lg border border-purple-700/30 bg-purple-900/20 px-3 py-2.5 text-xs text-purple-200">
                Platform admin account — no organization needed. After sign-up you will manage all
                customer organizations from the platform dashboard.
              </div>
            ) : (
              <div>
                <label className="block text-sm text-gray-300 mb-1">Organization name *</label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:border-purple-500 focus:outline-none"
                  placeholder="Acme Inc."
                />
                <p className="text-xs text-gray-500 mt-1">
                  You will be the organization owner and can invite your team later.
                </p>
              </div>
            )}
          </>
        )}
        <div>
          <label className="block text-sm text-gray-300 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:border-purple-500 focus:outline-none"
            placeholder="you@company.com"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:border-purple-500 focus:outline-none"
            placeholder="••••••••"
          />
          {!isSignUp && (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="mt-2 text-xs text-purple-300 hover:text-purple-200"
            >
              Forgot password?
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-gradient-to-r from-purple-700 to-teal-700 rounded-lg text-white font-medium disabled:opacity-50 hover:shadow-lg transition-all"
        >
          {loading ? "Please wait..." : isSignUp ? "Sign up" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-400">
        {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
        <Link
          href={isSignUp ? "/sign-in" : "/sign-up"}
          className="text-purple-300 hover:text-purple-200 font-medium"
        >
          {isSignUp ? "Sign in" : "Sign up"}
        </Link>
      </p>
      {!isSignUp && (
        <p className="mt-3 text-center text-xs text-gray-500">
          Platform admin? Sign in with the email listed in <code className="text-gray-400">SUPER_ADMIN_EMAILS</code>.
        </p>
      )}
    </div>
  );
}
