import { requireUser } from "@/lib/supabase/get-user";
import { db } from "@/db";
import { workShifts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { PlanningClient } from "./planning-client";

export default async function PlanningPage() {
  const user = await requireUser();

  const shifts = await db
    .select()
    .from(workShifts)
    .where(eq(workShifts.userId, user.id))
    .orderBy(desc(workShifts.startDate));

  return (
    <PlanningClient
      shifts={shifts.map((s) => ({
        id: s.id,
        shiftType: s.shiftType,
        startDate: s.startDate,
        endDate: s.endDate,
        startTime: s.startTime,
        endTime: s.endTime,
      }))}
    />
  );
}
