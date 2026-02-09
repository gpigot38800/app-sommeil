import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { adminProfiles, shiftCodes } from "@/db/schema";
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

// GET /api/admin/shift-codes — Liste de tous les codes shift de l'organisation
export async function GET() {
  const orgId = await getOrgId();
  if (!orgId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const codes = await db
    .select()
    .from(shiftCodes)
    .where(eq(shiftCodes.organizationId, orgId));

  return NextResponse.json(codes);
}

// POST /api/admin/shift-codes — Créer un code shift
export async function POST(request: NextRequest) {
  const orgId = await getOrgId();
  if (!orgId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.code || !body.shiftCategory) {
    return NextResponse.json(
      { error: "Champs requis : code, shiftCategory" },
      { status: 400 }
    );
  }

  // Vérifier l'unicité du code dans l'organisation
  const [existing] = await db
    .select()
    .from(shiftCodes)
    .where(
      and(
        eq(shiftCodes.organizationId, orgId),
        eq(shiftCodes.code, body.code)
      )
    );

  if (existing) {
    return NextResponse.json(
      { error: `Le code '${body.code}' existe déjà dans cette organisation` },
      { status: 409 }
    );
  }

  const [created] = await db
    .insert(shiftCodes)
    .values({
      organizationId: orgId,
      code: body.code,
      label: body.label || null,
      shiftCategory: body.shiftCategory,
      defaultStartTime: body.defaultStartTime || null,
      defaultEndTime: body.defaultEndTime || null,
      defaultDurationMinutes: body.defaultDurationMinutes || null,
      includesBreakMinutes: body.includesBreakMinutes || 0,
      isWorkShift: body.isWorkShift ?? true,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}

// PUT /api/admin/shift-codes — Modifier un code shift
export async function PUT(request: NextRequest) {
  const orgId = await getOrgId();
  if (!orgId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.id) {
    return NextResponse.json(
      { error: "Le champ 'id' est requis" },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(shiftCodes)
    .set({
      code: body.code ?? undefined,
      label: body.label ?? undefined,
      shiftCategory: body.shiftCategory ?? undefined,
      defaultStartTime: body.defaultStartTime ?? undefined,
      defaultEndTime: body.defaultEndTime ?? undefined,
      defaultDurationMinutes: body.defaultDurationMinutes ?? undefined,
      includesBreakMinutes: body.includesBreakMinutes ?? undefined,
      isWorkShift: body.isWorkShift ?? undefined,
    })
    .where(and(eq(shiftCodes.id, body.id), eq(shiftCodes.organizationId, orgId)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Code shift non trouvé" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

// DELETE /api/admin/shift-codes — Supprimer un code shift
export async function DELETE(request: NextRequest) {
  const orgId = await getOrgId();
  if (!orgId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.id) {
    return NextResponse.json(
      { error: "Le champ 'id' est requis" },
      { status: 400 }
    );
  }

  const [deleted] = await db
    .delete(shiftCodes)
    .where(and(eq(shiftCodes.id, body.id), eq(shiftCodes.organizationId, orgId)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Code shift non trouvé" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
