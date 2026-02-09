import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { adminProfiles, workShifts, employees, shiftCodes } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
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

/**
 * Ajoute N jours à une date au format YYYY-MM-DD.
 */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

// POST /api/admin/shifts/bulk — Appliquer un pattern de rotation
export async function POST(request: NextRequest) {
  const orgId = await getOrgId();
  if (!orgId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json();
  const { pattern, startDate, employeeIds } = body as {
    pattern: string[];
    startDate: string;
    employeeIds: string[];
  };

  // Validation des champs requis
  if (!pattern || !Array.isArray(pattern) || pattern.length === 0) {
    return NextResponse.json(
      { error: "Le champ 'pattern' est requis et doit être un tableau non vide de codes shift" },
      { status: 400 }
    );
  }

  if (!startDate) {
    return NextResponse.json(
      { error: "Le champ 'startDate' est requis" },
      { status: 400 }
    );
  }

  if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
    return NextResponse.json(
      { error: "Le champ 'employeeIds' est requis et doit être un tableau non vide" },
      { status: 400 }
    );
  }

  // Vérifier que tous les employés appartiennent à l'organisation
  const orgEmployees = await db
    .select({ id: employees.id })
    .from(employees)
    .where(
      and(
        eq(employees.organizationId, orgId),
        inArray(employees.id, employeeIds)
      )
    );

  const validEmployeeIds = new Set(orgEmployees.map((e) => e.id));
  const invalidEmployeeIds = employeeIds.filter((id) => !validEmployeeIds.has(id));

  if (invalidEmployeeIds.length > 0) {
    return NextResponse.json(
      { error: `Employés non trouvés dans cette organisation : ${invalidEmployeeIds.join(", ")}` },
      { status: 400 }
    );
  }

  // Récupérer les shift codes de l'organisation
  const uniqueCodes = [...new Set(pattern)];

  const orgShiftCodes = await db
    .select()
    .from(shiftCodes)
    .where(
      and(
        eq(shiftCodes.organizationId, orgId),
        inArray(shiftCodes.code, uniqueCodes)
      )
    );

  const codeMap = new Map(orgShiftCodes.map((sc) => [sc.code, sc]));
  const missingCodes = uniqueCodes.filter((c) => !codeMap.has(c));

  if (missingCodes.length > 0) {
    return NextResponse.json(
      { error: `Codes shift non trouvés : ${missingCodes.join(", ")}` },
      { status: 400 }
    );
  }

  // Générer les shifts pour chaque employé et chaque jour du pattern
  const values: Array<{
    organizationId: string;
    employeeId: string;
    startDate: string;
    endDate: string;
    shiftType: string;
    startTime: string;
    endTime: string;
    shiftCode: string;
    breakMinutes: number;
  }> = [];

  for (const empId of employeeIds) {
    for (let dayIndex = 0; dayIndex < pattern.length; dayIndex++) {
      const code = pattern[dayIndex];
      const shiftCodeData = codeMap.get(code)!;

      // Pour les repos/absences sans heures, on peut les ignorer ou les créer
      // On ne crée un shift que si c'est un shift de travail avec des heures
      if (!shiftCodeData.isWorkShift) {
        continue;
      }

      if (!shiftCodeData.defaultStartTime || !shiftCodeData.defaultEndTime) {
        continue;
      }

      const dayDate = addDays(startDate, dayIndex);

      values.push({
        organizationId: orgId,
        employeeId: empId,
        startDate: dayDate,
        endDate: dayDate, // single-day shift pour B2B
        shiftType: shiftCodeData.shiftCategory,
        startTime: shiftCodeData.defaultStartTime,
        endTime: shiftCodeData.defaultEndTime,
        shiftCode: code,
        breakMinutes: shiftCodeData.includesBreakMinutes || 0,
      });
    }
  }

  if (values.length === 0) {
    return NextResponse.json(
      { inserted: 0, shifts: [], message: "Aucun shift de travail à créer (que des repos/absences dans le pattern)" },
      { status: 200 }
    );
  }

  const inserted = await db
    .insert(workShifts)
    .values(values)
    .returning();

  return NextResponse.json(
    { inserted: inserted.length, shifts: inserted },
    { status: 201 }
  );
}
