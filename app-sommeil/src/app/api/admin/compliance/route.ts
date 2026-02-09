import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { adminProfiles, employees, workShifts } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { checkEmployeeCompliance } from "@/lib/compliance-engine";
import type { ShiftInput } from "@/lib/fatigue-engine/types";

async function getOrgId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const [admin] = await db
    .select()
    .from(adminProfiles)
    .where(eq(adminProfiles.id, user.id));
  return admin?.organizationId ?? null;
}

export async function GET(request: NextRequest) {
  const orgId = await getOrgId();
  if (!orgId) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const employeeId = searchParams.get("employeeId");

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "startDate et endDate requis" },
      { status: 400 }
    );
  }

  // Recuperer les employes actifs
  const empList = await db
    .select()
    .from(employees)
    .where(
      and(eq(employees.organizationId, orgId), eq(employees.isActive, true))
    );

  const targetEmployees = employeeId
    ? empList.filter((e) => e.id === employeeId)
    : empList;

  // Elargir la fenetre de shifts pour detecter quick_return au bord
  const extendedStart = new Date(startDate + "T00:00:00");
  extendedStart.setDate(extendedStart.getDate() - 7);
  const extendedStartStr = extendedStart.toISOString().split("T")[0];

  const extendedEnd = new Date(endDate + "T00:00:00");
  extendedEnd.setDate(extendedEnd.getDate() + 1);
  const extendedEndStr = extendedEnd.toISOString().split("T")[0];

  const results = [];

  for (const emp of targetEmployees) {
    const shifts = await db
      .select()
      .from(workShifts)
      .where(
        and(
          eq(workShifts.employeeId, emp.id),
          eq(workShifts.organizationId, orgId),
          gte(workShifts.startDate, extendedStartStr),
          lte(workShifts.startDate, extendedEndStr)
        )
      )
      .orderBy(workShifts.startDate);

    const shiftInputs: ShiftInput[] = shifts.map((s) => ({
      date: s.startDate,
      shiftType: s.shiftType,
      startTime: s.startTime,
      endTime: s.endTime,
      breakMinutes: s.breakMinutes ?? 0,
    }));

    const compliance = checkEmployeeCompliance(emp.id, shiftInputs);

    // Filtrer les violations pour ne garder que celles dans la fenetre demandee
    const filteredViolations = compliance.violations.filter(
      (v) => v.date >= startDate && v.date <= endDate
    );

    if (filteredViolations.length > 0) {
      results.push({
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        department: emp.department,
        violations: filteredViolations,
      });
    }
  }

  return NextResponse.json(results);
}
