import { NextResponse } from "next/server";
import { db } from "@/db";
import { organizations, adminProfiles, shiftCodes } from "@/db/schema";
import { DEFAULT_SHIFT_CODES } from "@/types";

export async function POST(request: Request) {
  try {
    const { organizationName, email, userId } = await request.json();

    if (!organizationName || !email || !userId) {
      return NextResponse.json(
        { error: "Champs requis manquants" },
        { status: 400 }
      );
    }

    // Create organization
    const [org] = await db
      .insert(organizations)
      .values({ name: organizationName })
      .returning();

    // Create admin profile
    await db.insert(adminProfiles).values({
      id: userId,
      organizationId: org.id,
      displayName: null,
      email,
      role: "admin",
    });

    // Pre-fill default shift codes
    const shiftCodeRows = DEFAULT_SHIFT_CODES.map((sc) => ({
      organizationId: org.id,
      code: sc.code,
      label: sc.label,
      shiftCategory: sc.shiftCategory,
      defaultStartTime: sc.defaultStartTime,
      defaultEndTime: sc.defaultEndTime,
      defaultDurationMinutes: sc.defaultDurationMinutes,
      includesBreakMinutes: sc.includesBreakMinutes ?? 0,
      isWorkShift: sc.isWorkShift,
    }));

    await db.insert(shiftCodes).values(shiftCodeRows);

    return NextResponse.json({ organizationId: org.id });
  } catch (error) {
    console.error("Onboard error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'organisation" },
      { status: 500 }
    );
  }
}
