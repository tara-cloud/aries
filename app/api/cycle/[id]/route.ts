import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getRecord(id: string, homeId: string) {
  return prisma.cycleRecord.findFirst({ where: { id, member: { homeId } } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const r = await getRecord(id, session.user.homeId);
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  let newEndDate = r.endDate;
  if (body.endDate !== undefined) newEndDate = body.endDate ? new Date(body.endDate) : null;

  const updated = await prisma.cycleRecord.update({
    where: { id },
    data: {
      startDate: body.startDate ? new Date(body.startDate) : r.startDate,
      endDate:   newEndDate,
      flow:      body.flow      === undefined ? r.flow      : body.flow      || null,
      symptoms:  body.symptoms  === undefined ? r.symptoms  : body.symptoms  || null,
      notes:     body.notes     === undefined ? r.notes     : body.notes     || null,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const r = await getRecord(id, session.user.homeId);
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.cycleRecord.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
