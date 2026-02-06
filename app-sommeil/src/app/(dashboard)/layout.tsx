import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireUser } from "@/lib/supabase/get-user";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  // Check if profile is complete — redirect to /profil if not
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? headersList.get("x-invoke-path") ?? "";

  if (!pathname.includes("/profil")) {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.id));

    const profileIncomplete =
      !profile || !profile.age || !profile.habitualSleepTime;

    if (profileIncomplete) {
      redirect("/profil?welcome=true");
    }
  }

  return (
    <DashboardShell userEmail={user.email}>
      {children}
    </DashboardShell>
  );
}
