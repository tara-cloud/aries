import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getRecord(id: string, homeId: string) {
  return prisma.supplementRecord.findFirst({ where: { id, member: { homeId } } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const r = await getRecord(id, session.user.homeId);
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  let newEndDate = r.endDate;
  if (body.endDate === undefined) { /* keep */ } else { newEndDate = body.endDate ? new Date(body.endDate) : null; }
  const updated = await prisma.supplementRecord.update({
    where: { id },
    data: {
      date:        body.date        ? new Date(body.date) : r.date,
      name:        body.name?.trim()                      ?? r.name,
      dosage:      body.dosage      === undefined ? r.dosage      : body.dosage      || null,
      timesPerDay: body.timesPerDay === undefined ? r.timesPerDay : body.timesPerDay || null,
      endDate:     newEndDate,
      reason:      body.reason      === undefined ? r.reason      : body.reason      || null,
      notes:       body.notes       === undefined ? r.notes       : body.notes       || null,
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
  await prisma.supplementRecord.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
