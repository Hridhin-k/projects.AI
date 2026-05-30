import { redirect } from "next/navigation";
import LandingPage from "@/components/landing/LandingPage";
import { getCurrentUser } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/auth/platform";

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    if (isSuperAdmin(user)) {
      redirect("/platform");
    }
    redirect("/projects");
  }

  return <LandingPage />;
}
