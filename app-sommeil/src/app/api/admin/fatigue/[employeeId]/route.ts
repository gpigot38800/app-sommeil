import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { adminProfiles, fatigueScores } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

async function getOrgId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const [admin] = await db.select().from(adminProfiles).where(eq(adminProfiles.id, user.id));
  return admin?.organizationId ?? null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  const orgId = await getOrgId();
  if (!orgId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { employeeId } = await params;

  const scores = await db
    .select()
    .from(fatigueScores)
    .where(
      and(
        eq(fatigueScores.employeeId, employeeId),
        eq(fatigueScores.organizationId, orgId)
      )
    )
    .orderBy(desc(fatigueScores.calculatedAt));

  return NextResponse.json(scores);
}
