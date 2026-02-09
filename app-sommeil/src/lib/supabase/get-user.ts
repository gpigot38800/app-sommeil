import { createClient } from "./server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { adminProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Require an authenticated admin user.
 * Returns { user, admin, organizationId }.
 * Redirects to /login if not authenticated.
 * Redirects to /register if no admin profile exists (onboarding incomplete).
 */
export async function requireAdmin() {
  const user = await requireUser();

  let admin;
  try {
    const rows = await db
      .select()
      .from(adminProfiles)
      .where(eq(adminProfiles.id, user.id));
    admin = rows[0];
  } catch {
    throw new Error(
      "Impossible de se connecter à la base de données. Vérifiez que votre projet Supabase est actif."
    );
  }

  if (!admin) {
    redirect("/register");
  }

  return {
    user,
    admin,
    organizationId: admin.organizationId,
  };
}
