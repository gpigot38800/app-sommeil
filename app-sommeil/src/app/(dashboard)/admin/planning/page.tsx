import { requireAdmin } from "@/lib/supabase/get-user";
import { PlanningClient } from "./planning-client";

export default async function AdminPlanningPage() {
  await requireAdmin();
  return <PlanningClient />;
}
