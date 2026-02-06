import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles, workShifts, transitionPlans, planDays } from "@/db/schema";
import { createTransitionPlanSchema } from "@/lib/validators/transition-plan";
import { generateTransitionPlan } from "@/lib/planning-engine";
import { eq, desc } from "drizzle-orm";
import type { ShiftType } from "@/lib/planning-engine/types";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const plans = await db
    .select()
    .from(transitionPlans)
    .where(eq(transitionPlans.userId, user.id))
    .orderBy(desc(transitionPlans.createdAt));

  return NextResponse.json(plans);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json();
  const result = createTransitionPlanSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Données invalides", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { fromShiftId, toShiftId, availableDays } = result.data;

  // Fetch user profile
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id));

  if (!profile || !profile.habitualSleepTime || !profile.habitualWakeTime) {
    return NextResponse.json(
      { error: "Profil sommeil incomplet. Renseignez vos horaires habituels." },
      { status: 400 }
    );
  }

  // Fetch both shifts
  const userShifts = await db
    .select()
    .from(workShifts)
    .where(eq(workShifts.userId, user.id));

  const fromShift = userShifts.find((s) => s.id === fromShiftId);
  const toShift = userShifts.find((s) => s.id === toShiftId);

  if (!fromShift || !toShift) {
    return NextResponse.json(
      { error: "Shift non trouvé" },
      { status: 404 }
    );
  }

  // Generate the transition plan
  const planResult = generateTransitionPlan({
    habitualSleepTime: profile.habitualSleepTime,
    habitualWakeTime: profile.habitualWakeTime,
    fromShift: {
      type: fromShift.shiftType as ShiftType,
      startTime: fromShift.startTime,
      endTime: fromShift.endTime,
    },
    toShift: {
      type: toShift.shiftType as ShiftType,
      startTime: toShift.startTime,
      endTime: toShift.endTime,
    },
    availableDays,
  });

  // Persist the plan
  const [plan] = await db
    .insert(transitionPlans)
    .values({
      userId: user.id,
      fromShift: fromShift.shiftType,
      toShift: toShift.shiftType,
      startDate: new Date().toISOString().split("T")[0],
      daysCount: planResult.actualDaysCount,
      totalDeficitMinutes: planResult.totalDeficitMinutes,
    })
    .returning();

  // Persist the plan days
  const insertedDays = await db
    .insert(planDays)
    .values(
      planResult.days.map((day) => ({
        planId: plan.id,
        dayNumber: day.dayNumber,
        targetSleepTime: day.targetSleepTime,
        targetWakeTime: day.targetWakeTime,
        caffeineCutoff: day.caffeineCutoff,
        lightStart: day.lightStart,
        lightEnd: day.lightEnd,
        deficitMinutes: day.deficitMinutes,
        notes: day.notes,
      }))
    )
    .returning();

  return NextResponse.json(
    { ...plan, days: insertedDays },
    { status: 201 }
  );
}
