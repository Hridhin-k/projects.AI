import { redirect } from "next/navigation";
import LandingPage from "@/components/landing/LandingPage";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/auth/platform";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (authUser) {
    const user = await getCurrentUser();
    if (user && isSuperAdmin(user)) {
      redirect("/platform");
    }
    redirect("/projects");
  }

  return <LandingPage />;
}
