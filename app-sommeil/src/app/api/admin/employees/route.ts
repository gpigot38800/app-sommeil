import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { employees, adminProfiles } from "@/db/schema";
import { eq, and, ilike } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

async function getOrgId(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [admin] = await db
    .select()
    .from(adminProfiles)
    .where(eq(adminProfiles.id, user.id));

  return admin?.organizationId ?? null;
}

export async function GET(request: NextRequest) {
  const orgId = await getOrgId(request);
  if (!orgId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const department = searchParams.get("department");

  const conditions = [
    eq(employees.organizationId, orgId),
    eq(employees.isActive, true),
  ];

  if (department) {
    conditions.push(ilike(employees.department, department));
  }

  const result = await db
    .select()
    .from(employees)
    .where(and(...conditions))
    .orderBy(employees.lastName, employees.firstName);

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const orgId = await getOrgId(request);
  if (!orgId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json();

  const [employee] = await db
    .insert(employees)
    .values({
      organizationId: orgId,
      matricule: body.matricule || null,
      firstName: body.firstName,
      lastName: body.lastName,
      department: body.department || null,
      position: body.position || null,
      employmentType: body.employmentType || "temps_plein",
      contractHoursPerWeek: body.contractHoursPerWeek || "35",
      habitualSleepTime: body.habitualSleepTime || "23:00",
      habitualWakeTime: body.habitualWakeTime || "07:00",
    })
    .returning();

  return NextResponse.json(employee, { status: 201 });
}
