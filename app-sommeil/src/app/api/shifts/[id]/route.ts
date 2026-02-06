import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { workShifts } from "@/db/schema";
import { shiftSchema } from "@/lib/validators/shift";
import { eq, and } from "drizzle-orm";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
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
    .update(workShifts)
    .set({
      startDate: data.startDate,
      endDate: data.endDate,
      shiftType: data.shiftType,
      startTime: data.startTime,
      endTime: data.endTime,
    })
    .where(and(eq(workShifts.id, id), eq(workShifts.userId, user.id)))
    .returning();

  if (!shift) {
    return NextResponse.json({ error: "Shift non trouvé" }, { status: 404 });
  }

  return NextResponse.json(shift);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  const [deleted] = await db
    .delete(workShifts)
    .where(and(eq(workShifts.id, id), eq(workShifts.userId, user.id)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Shift non trouvé" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
