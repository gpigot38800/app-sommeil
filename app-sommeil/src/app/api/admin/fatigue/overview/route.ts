import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { adminProfiles, fatigueScores, employees } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

async function getOrgId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const [admin] = await db.select().from(adminProfiles).where(eq(adminProfiles.id, user.id));
  return admin?.organizationId ?? null;
}

export async function GET(_request: NextRequest) {
  const orgId = await getOrgId();
  if (!orgId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Get latest 7-day scores for all active employees
  const empList = await db
    .select()
    .from(employees)
    .where(
      and(eq(employees.organizationId, orgId), eq(employees.isActive, true))
    );

  const overview = [];

  for (const emp of empList) {
    const [latestScore] = await db
      .select()
      .from(fatigueScores)
      .where(
        and(
          eq(fatigueScores.employeeId, emp.id),
          eq(fatigueScores.windowDays, 7)
        )
      )
      .orderBy(desc(fatigueScores.calculatedAt))
      .limit(1);

    overview.push({
      employee: {
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        department: emp.department,
        position: emp.position,
        matricule: emp.matricule,
      },
      fatigue: latestScore ?? null,
    });
  }

  // Sort by risk level (critical first)
  const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  overview.sort((a, b) => {
    const aRisk = a.fatigue?.riskLevel ?? "low";
    const bRisk = b.fatigue?.riskLevel ?? "low";
    return (riskOrder[aRisk as keyof typeof riskOrder] ?? 4) - (riskOrder[bRisk as keyof typeof riskOrder] ?? 4);
  });

  return NextResponse.json(overview);
}
