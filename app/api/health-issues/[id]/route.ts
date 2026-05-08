import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getRecord(id: string, homeId: string) {
  return prisma.healthIssue.findFirst({ where: { id, member: { homeId } } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const r = await getRecord(id, session.user.homeId);
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.healthIssue.update({
    where: { id },
    data: {
      title:        body.title?.trim()                               ?? r.title,
      description:  body.description  !== undefined ? body.description  || null : r.description,
      diagnosedDate:body.diagnosedDate !== undefined ? (body.diagnosedDate ? new Date(body.diagnosedDate) : null) : r.diagnosedDate,
      resolvedDate: body.resolvedDate  !== undefined ? (body.resolvedDate  ? new Date(body.resolvedDate)  : null) : r.resolvedDate,
      status:       body.status                                      ?? r.status,
      severity:     body.severity      !== undefined ? body.severity      || null : r.severity,
      notes:        body.notes         !== undefined ? body.notes         || null : r.notes,
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
  await prisma.healthIssue.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
