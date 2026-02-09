import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { adminProfiles, workShifts, employees } from "@/db/schema";
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

interface NewEmployeeData {
  key: string; // identifiant unique pour le matching (ex: "mat:10002" ou "name:jean|martin")
  matricule?: string;
  firstName: string;
  lastName: string;
  department?: string;
  position?: string;
}

interface ImportRow {
  employeeId?: string;
  newEmployeeKey?: string; // reference vers un newEmployee.key si auto-creation
  startDate: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  shiftCode?: string;
  breakMinutes?: number;
}

// POST /api/admin/shifts/import — Import CSV avec auto-creation des employes
export async function POST(request: NextRequest) {
  const orgId = await getOrgId();
  if (!orgId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json();
  const rows: ImportRow[] = body.rows;
  const newEmployees: NewEmployeeData[] = body.newEmployees ?? [];

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json(
      { error: "Le champ 'rows' est requis et doit être un tableau non vide" },
      { status: 400 }
    );
  }

  // 1. Auto-creer les nouveaux employes
  const keyToEmployeeId = new Map<string, string>();

  if (newEmployees.length > 0) {
    for (const emp of newEmployees) {
      if (!emp.firstName || !emp.lastName) continue;

      const [created] = await db
        .insert(employees)
        .values({
          organizationId: orgId,
          matricule: emp.matricule || null,
          firstName: emp.firstName,
          lastName: emp.lastName,
          department: emp.department || null,
          position: emp.position || null,
          employmentType: "temps_plein",
          contractHoursPerWeek: "35",
          habitualSleepTime: "23:00",
          habitualWakeTime: "07:00",
          isActive: true,
        })
        .returning();

      if (created) {
        keyToEmployeeId.set(emp.key, created.id);
      }
    }
  }

  // 2. Resoudre les employeeId pour chaque ligne
  const resolvedRows = rows.map((row) => {
    let employeeId = row.employeeId;
    if (!employeeId && row.newEmployeeKey) {
      employeeId = keyToEmployeeId.get(row.newEmployeeKey) ?? undefined;
    }
    return { ...row, employeeId };
  });

  // 3. Valider les champs requis
  const validRows = resolvedRows.filter((row) => {
    return row.employeeId && row.startDate && row.shiftType && row.startTime && row.endTime;
  });

  if (validRows.length === 0) {
    return NextResponse.json(
      { error: "Aucune ligne valide après résolution des employés" },
      { status: 400 }
    );
  }

  // 4. Verifier que tous les employeeIds appartiennent a l'organisation
  const uniqueEmployeeIds = [...new Set(validRows.map((r) => r.employeeId!))];

  const orgEmployees = await db
    .select({ id: employees.id })
    .from(employees)
    .where(
      and(
        eq(employees.organizationId, orgId),
        inArray(employees.id, uniqueEmployeeIds)
      )
    );

  const validEmployeeIds = new Set(orgEmployees.map((e) => e.id));
  const finalRows = validRows.filter((r) => validEmployeeIds.has(r.employeeId!));

  if (finalRows.length === 0) {
    return NextResponse.json(
      { error: "Aucun employé valide trouvé dans cette organisation" },
      { status: 400 }
    );
  }

  // 5. Bulk insert shifts
  const values = finalRows.map((row) => ({
    organizationId: orgId,
    employeeId: row.employeeId!,
    startDate: row.startDate,
    endDate: row.startDate,
    shiftType: row.shiftType,
    startTime: row.startTime,
    endTime: row.endTime,
    shiftCode: row.shiftCode || null,
    breakMinutes: row.breakMinutes || 0,
  }));

  const inserted = await db
    .insert(workShifts)
    .values(values)
    .returning();

  return NextResponse.json(
    {
      inserted: inserted.length,
      employeesCreated: keyToEmployeeId.size,
      shifts: inserted,
    },
    { status: 201 }
  );
}
