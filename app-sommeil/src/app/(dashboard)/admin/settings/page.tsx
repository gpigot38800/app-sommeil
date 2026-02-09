import { requireAdmin } from "@/lib/supabase/get-user";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  await requireAdmin();
  return <SettingsClient />;
}
