import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { adminProfiles, workShifts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
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

// PUT /api/admin/shifts/[id] — Modifier un shift
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const orgId = await getOrgId();
  if (!orgId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const [updated] = await db
    .update(workShifts)
    .set({
      shiftType: body.shiftType ?? undefined,
      startTime: body.startTime ?? undefined,
      endTime: body.endTime ?? undefined,
      startDate: body.startDate ?? undefined,
      endDate: body.startDate ?? undefined, // single-day shift pour B2B
      shiftCode: body.shiftCode ?? undefined,
      breakMinutes: body.breakMinutes ?? undefined,
    })
    .where(and(eq(workShifts.id, id), eq(workShifts.organizationId, orgId)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Shift non trouvé" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

// DELETE /api/admin/shifts/[id] — Supprimer un shift
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const orgId = await getOrgId();
  if (!orgId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  const [deleted] = await db
    .delete(workShifts)
    .where(and(eq(workShifts.id, id), eq(workShifts.organizationId, orgId)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Shift non trouvé" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
