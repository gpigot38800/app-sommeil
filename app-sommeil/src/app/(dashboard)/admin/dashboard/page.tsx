import { requireAdmin } from "@/lib/supabase/get-user";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  await requireAdmin();
  return <DashboardClient />;
}
