import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getRecord(id: string, homeId: string) {
  return prisma.painRecord.findFirst({ where: { id, member: { homeId } } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const r = await getRecord(id, session.user.homeId);
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  if (body.severity != null && (body.severity < 1 || body.severity > 10)) {
    return NextResponse.json({ error: "Severity must be 1-10." }, { status: 400 });
  }
  const updated = await prisma.painRecord.update({
    where: { id },
    data: {
      date:        body.date        ? new Date(body.date)           : r.date,
      severity:    body.severity    != null ? Number(body.severity) : r.severity,
      location:    body.location    !== undefined ? body.location    || null : r.location,
      description: body.description !== undefined ? body.description || null : r.description,
      duration:    body.duration    !== undefined ? body.duration    || null : r.duration,
      notes:       body.notes       !== undefined ? body.notes       || null : r.notes,
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
  await prisma.painRecord.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
