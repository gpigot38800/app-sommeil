import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { adminProfiles, workShifts, employees } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
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

// GET /api/admin/shifts — Liste des shifts avec filtres
export async function GET(request: NextRequest) {
  const orgId = await getOrgId();
  if (!orgId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("employeeId");
  const department = searchParams.get("department");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const conditions = [eq(workShifts.organizationId, orgId)];

  if (employeeId) {
    conditions.push(eq(workShifts.employeeId, employeeId));
  }

  if (startDate) {
    conditions.push(gte(workShifts.startDate, startDate));
  }

  if (endDate) {
    conditions.push(lte(workShifts.startDate, endDate));
  }

  // Si on filtre par département, on fait un join avec employees
  if (department) {
    const rows = await db
      .select({
        shift: workShifts,
        employeeFirstName: employees.firstName,
        employeeLastName: employees.lastName,
        employeeDepartment: employees.department,
      })
      .from(workShifts)
      .innerJoin(employees, eq(workShifts.employeeId, employees.id))
      .where(
        and(
          ...conditions,
          eq(employees.department, department)
        )
      )
      .orderBy(desc(workShifts.startDate));

    return NextResponse.json(rows);
  }

  // Sans filtre département — join optionnel pour enrichir les données
  const rows = await db
    .select({
      shift: workShifts,
      employeeFirstName: employees.firstName,
      employeeLastName: employees.lastName,
      employeeDepartment: employees.department,
    })
    .from(workShifts)
    .innerJoin(employees, eq(workShifts.employeeId, employees.id))
    .where(and(...conditions))
    .orderBy(desc(workShifts.startDate));

  return NextResponse.json(rows);
}

// POST /api/admin/shifts — Créer un shift
export async function POST(request: NextRequest) {
  const orgId = await getOrgId();
  if (!orgId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.employeeId || !body.startDate || !body.shiftType || !body.startTime || !body.endTime) {
    return NextResponse.json(
      { error: "Champs requis : employeeId, startDate, shiftType, startTime, endTime" },
      { status: 400 }
    );
  }

  // Vérifier que l'employé appartient à l'organisation
  const [employee] = await db
    .select()
    .from(employees)
    .where(and(eq(employees.id, body.employeeId), eq(employees.organizationId, orgId)));

  if (!employee) {
    return NextResponse.json({ error: "Employé non trouvé dans cette organisation" }, { status: 404 });
  }

  const [shift] = await db
    .insert(workShifts)
    .values({
      organizationId: orgId,
      employeeId: body.employeeId,
      startDate: body.startDate,
      endDate: body.startDate, // single-day shift pour B2B
      shiftType: body.shiftType,
      startTime: body.startTime,
      endTime: body.endTime,
      shiftCode: body.shiftCode || null,
      breakMinutes: body.breakMinutes || 0,
    })
    .returning();

  return NextResponse.json(shift, { status: 201 });
}
