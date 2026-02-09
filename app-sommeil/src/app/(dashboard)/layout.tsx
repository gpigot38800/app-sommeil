import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireAdmin } from "@/lib/supabase/get-user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAdmin();

  return (
    <DashboardShell userEmail={user.email}>
      {children}
    </DashboardShell>
  );
}
