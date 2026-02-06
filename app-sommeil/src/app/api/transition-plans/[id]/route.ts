import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { transitionPlans, planDays } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function GET(
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

  const [plan] = await db
    .select()
    .from(transitionPlans)
    .where(
      and(eq(transitionPlans.id, id), eq(transitionPlans.userId, user.id))
    );

  if (!plan) {
    return NextResponse.json({ error: "Plan non trouvé" }, { status: 404 });
  }

  const days = await db
    .select()
    .from(planDays)
    .where(eq(planDays.planId, plan.id))
    .orderBy(asc(planDays.dayNumber));

  return NextResponse.json({ ...plan, days });
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
    .delete(transitionPlans)
    .where(
      and(eq(transitionPlans.id, id), eq(transitionPlans.userId, user.id))
    )
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Plan non trouvé" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
