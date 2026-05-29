import AuthForm from "@/components/auth/AuthForm";

const ERROR_MESSAGES: Record<string, string> = {
  auth: "Email confirmation failed or the link expired. Try signing in again.",
  auth_verifier:
    "Open the confirmation link in the same browser you used to sign up, or sign in with your password after confirming.",
  setup: "Your account was verified but workspace setup failed. Try signing in again or contact support.",
  invite_pending: "You have a pending team invite. Open the invite link in your email first.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = params.redirect || "/projects";
  const bannerError = params.error ? ERROR_MESSAGES[params.error] : undefined;

  return (
    <div className="w-full max-w-md">
      {bannerError && (
        <div className="mb-4 p-3 rounded-lg bg-amber-900/30 border border-amber-500/40 text-amber-100 text-sm">
          {bannerError}
        </div>
      )}
      <AuthForm mode="sign-in" redirectTo={redirectTo} />
    </div>
  );
}
