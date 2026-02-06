import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { workShifts } from "@/db/schema";
import { shiftSchema } from "@/lib/validators/shift";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const shifts = await db
    .select()
    .from(workShifts)
    .where(eq(workShifts.userId, user.id))
    .orderBy(desc(workShifts.startDate));

  return NextResponse.json(shifts);
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
  const result = shiftSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Données invalides", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const data = result.data;

  const [shift] = await db
    .insert(workShifts)
    .values({
      userId: user.id,
      startDate: data.startDate,
      endDate: data.endDate,
      shiftType: data.shiftType,
      startTime: data.startTime,
      endTime: data.endTime,
    })
    .returning();

  return NextResponse.json(shift, { status: 201 });
}
