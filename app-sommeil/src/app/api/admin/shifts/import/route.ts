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

interface ImportRow {
  employeeId: string;
  startDate: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  shiftCode?: string;
  breakMinutes?: number;
}

// POST /api/admin/shifts/import — Import CSV (lignes déjà parsées)
export async function POST(request: NextRequest) {
  const orgId = await getOrgId();
  if (!orgId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json();
  const rows: ImportRow[] = body.rows;

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json(
      { error: "Le champ 'rows' est requis et doit être un tableau non vide" },
      { status: 400 }
    );
  }

  // Valider les champs requis de chaque ligne
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.employeeId || !row.startDate || !row.shiftType || !row.startTime || !row.endTime) {
      return NextResponse.json(
        { error: `Ligne ${i + 1} : champs requis manquants (employeeId, startDate, shiftType, startTime, endTime)` },
        { status: 400 }
      );
    }
  }

  // Vérifier que tous les employeeIds appartiennent à l'organisation
  const uniqueEmployeeIds = [...new Set(rows.map((r) => r.employeeId))];

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
  const invalidIds = uniqueEmployeeIds.filter((id) => !validEmployeeIds.has(id));

  if (invalidIds.length > 0) {
    return NextResponse.json(
      { error: `Employés non trouvés dans cette organisation : ${invalidIds.join(", ")}` },
      { status: 400 }
    );
  }

  // Bulk insert
  const values = rows.map((row) => ({
    organizationId: orgId,
    employeeId: row.employeeId,
    startDate: row.startDate,
    endDate: row.startDate, // single-day shift pour B2B
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
    { inserted: inserted.length, shifts: inserted },
    { status: 201 }
  );
}
