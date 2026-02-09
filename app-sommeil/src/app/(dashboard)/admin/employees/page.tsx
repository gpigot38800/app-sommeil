import { requireAdmin } from "@/lib/supabase/get-user";
import { EmployeesClient } from "./employees-client";

export default async function EmployeesPage() {
  await requireAdmin();
  return <EmployeesClient />;
}
