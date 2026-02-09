import { requireAdmin } from "@/lib/supabase/get-user";
import { ImportClient } from "./import-client";

export default async function ImportPage() {
  await requireAdmin();
  return <ImportClient />;
}
