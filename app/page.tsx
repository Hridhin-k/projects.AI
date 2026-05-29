import { redirect } from "next/navigation";
import LandingPage from "@/components/landing/LandingPage";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  // Logged-in users: send to app (OrgAppShell handles super-admin → /platform)
  if (authUser) {
    redirect("/projects");
  }

  return <LandingPage />;
}
