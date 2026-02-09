import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { adminProfiles, employees, workShifts, fatigueScores } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { calculateEmployeeFatigue } from "@/lib/fatigue-engine";
import type { ShiftInput } from "@/lib/fatigue-engine/types";

async function getOrgId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const [admin] = await db.select().from(adminProfiles).where(eq(adminProfiles.id, user.id));
  return admin?.organizationId ?? null;
}

export async function POST(request: NextRequest) {
  const orgId = await getOrgId();
  if (!orgId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json();
  const employeeIds: string[] | undefined = body.employeeIds;
  const windowDays: number = body.windowDays ?? 7;

  // Get employees to calculate
  const empConditions = [
    eq(employees.organizationId, orgId),
    eq(employees.isActive, true),
  ];

  const empList = await db
    .select()
    .from(employees)
    .where(and(...empConditions));

  const targetEmployees = employeeIds
    ? empList.filter((e) => employeeIds.includes(e.id))
    : empList;

  // Date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - windowDays);
  const startStr = startDate.toISOString().split("T")[0];
  const endStr = endDate.toISOString().split("T")[0];

  const results = [];

  for (const emp of targetEmployees) {
    // Get shifts for this employee in the window
    const shifts = await db
      .select()
      .from(workShifts)
      .where(
        and(
          eq(workShifts.employeeId, emp.id),
          eq(workShifts.organizationId, orgId),
          gte(workShifts.startDate, startStr),
          lte(workShifts.startDate, endStr)
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

    const profile = {
      habitualSleepTime: emp.habitualSleepTime ?? "23:00",
      habitualWakeTime: emp.habitualWakeTime ?? "07:00",
      contractHoursPerWeek: Number(emp.contractHoursPerWeek) || 35,
    };

    const fatigue = calculateEmployeeFatigue(shiftInputs, profile, windowDays);

    // Upsert fatigue score
    // Delete existing score for same employee + window
    await db
      .delete(fatigueScores)
      .where(
        and(
          eq(fatigueScores.employeeId, emp.id),
          eq(fatigueScores.windowDays, windowDays)
        )
      );

    const [score] = await db
      .insert(fatigueScores)
      .values({
        employeeId: emp.id,
        organizationId: orgId,
        periodStart: fatigue.periodStart || startStr,
        periodEnd: fatigue.periodEnd || endStr,
        windowDays,
        cumulativeDeficitMinutes: fatigue.cumulativeDeficitMinutes,
        recoveryScore: fatigue.recoveryScore,
        riskLevel: fatigue.riskLevel,
        shiftCount: fatigue.shiftCount,
        nightShiftCount: fatigue.nightShiftCount,
      })
      .returning();

    results.push({
      employeeId: emp.id,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      ...fatigue,
      scoreId: score.id,
    });
  }

  return NextResponse.json({
    calculated: results.length,
    results,
  });
}
