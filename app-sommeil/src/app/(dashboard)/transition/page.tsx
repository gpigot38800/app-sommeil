import { requireUser } from "@/lib/supabase/get-user";
import { db } from "@/db";
import { workShifts, transitionPlans } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { TransitionClient } from "./transition-client";

export default async function TransitionPage() {
  const user = await requireUser();

  const shifts = await db
    .select()
    .from(workShifts)
    .where(eq(workShifts.userId, user.id))
    .orderBy(desc(workShifts.startDate));

  const plans = await db
    .select()
    .from(transitionPlans)
    .where(eq(transitionPlans.userId, user.id))
    .orderBy(desc(transitionPlans.createdAt));

  return (
    <TransitionClient
      shifts={shifts.map((s) => ({
        id: s.id,
        shiftType: s.shiftType,
        startDate: s.startDate,
        endDate: s.endDate,
        startTime: s.startTime,
        endTime: s.endTime,
      }))}
      plans={plans.map((p) => ({
        id: p.id,
        fromShift: p.fromShift,
        toShift: p.toShift,
        startDate: p.startDate,
        daysCount: p.daysCount,
        totalDeficitMinutes: p.totalDeficitMinutes,
        createdAt: p.createdAt.toISOString(),
      }))}
    />
  );
}
