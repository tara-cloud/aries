import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import fs from "node:fs";
import path from "node:path";

async function getRecord(id: string, homeId: string) {
  return prisma.report.findFirst({ where: { id, member: { homeId } } });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const r = await getRecord(id, session.user.homeId);
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(r);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const r = await getRecord(id, session.user.homeId);
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.report.update({
    where: { id },
    data: {
      date:     body.date     ? new Date(body.date)         : r.date,
      title:    body.title?.trim()                          ?? r.title,
      type:     body.type                                   ?? r.type,
      notes:    body.notes    === undefined ? r.notes    : body.notes    || null,
      fileUrl:  body.fileUrl  === undefined ? r.fileUrl  : body.fileUrl  || null,
      fileName: body.fileName === undefined ? r.fileName : body.fileName || null,
      fileSize: body.fileSize === undefined ? r.fileSize : body.fileSize || null,
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

  if (r.fileUrl) {
    const dataDir = process.env.DATA_MOUNT_PATH || "/data";
    const filePath = path.join(dataDir, r.fileUrl);
    try { fs.unlinkSync(filePath); } catch { /* file may already be gone */ }
  }

  await prisma.report.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
