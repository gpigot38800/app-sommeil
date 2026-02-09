import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { employees, adminProfiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

async function getOrgId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [admin] = await db
    .select()
    .from(adminProfiles)
    .where(eq(adminProfiles.id, user.id));

  return admin?.organizationId ?? null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const orgId = await getOrgId();
  if (!orgId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  const [employee] = await db
    .select()
    .from(employees)
    .where(and(eq(employees.id, id), eq(employees.organizationId, orgId)));

  if (!employee) {
    return NextResponse.json({ error: "Employé non trouvé" }, { status: 404 });
  }

  return NextResponse.json(employee);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const orgId = await getOrgId();
  if (!orgId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const [updated] = await db
    .update(employees)
    .set({
      matricule: body.matricule ?? undefined,
      firstName: body.firstName,
      lastName: body.lastName,
      department: body.department ?? undefined,
      position: body.position ?? undefined,
      employmentType: body.employmentType ?? undefined,
      contractHoursPerWeek: body.contractHoursPerWeek ?? undefined,
      habitualSleepTime: body.habitualSleepTime ?? undefined,
      habitualWakeTime: body.habitualWakeTime ?? undefined,
      updatedAt: new Date(),
    })
    .where(and(eq(employees.id, id), eq(employees.organizationId, orgId)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Employé non trouvé" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const orgId = await getOrgId();
  if (!orgId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  // Soft delete
  const [updated] = await db
    .update(employees)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(employees.id, id), eq(employees.organizationId, orgId)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Employé non trouvé" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
