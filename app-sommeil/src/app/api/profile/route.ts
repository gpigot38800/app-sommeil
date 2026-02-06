import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { profileSchema } from "@/lib/validators/profile";
import { eq } from "drizzle-orm";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id));

  return NextResponse.json(profile ?? null);
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
  const result = profileSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Données invalides", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const data = result.data;
  const now = new Date();

  const [profile] = await db
    .insert(profiles)
    .values({
      id: user.id,
      displayName: data.displayName ?? null,
      age: data.age,
      gender: data.gender,
      profession: data.profession ?? null,
      habitualSleepTime: data.habitualSleepTime,
      habitualWakeTime: data.habitualWakeTime,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: profiles.id,
      set: {
        displayName: data.displayName ?? null,
        age: data.age,
        gender: data.gender,
        profession: data.profession ?? null,
        habitualSleepTime: data.habitualSleepTime,
        habitualWakeTime: data.habitualWakeTime,
        updatedAt: now,
      },
    })
    .returning();

  return NextResponse.json(profile);
}
