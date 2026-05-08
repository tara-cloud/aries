import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");
  const type     = searchParams.get("type");
  const limit    = Math.min(Math.max(Number.parseInt(searchParams.get("limit") ?? "100") || 100, 1), 500);

  const records = await prisma.report.findMany({
    where: {
      member: { homeId: session.user.homeId },
      ...(memberId ? { memberId } : {}),
      ...(type     ? { type }     : {}),
    },
    orderBy: { date: "desc" },
    take: limit,
    include: { member: { select: { name: true } } },
  });

  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { memberId, date, title, type, notes, fileUrl, fileName, fileSize } = await req.json();
  if (!memberId || !date || !title?.trim() || !type) {
    return NextResponse.json({ error: "memberId, date, title and type are required." }, { status: 400 });
  }

  const member = await prisma.member.findFirst({ where: { id: memberId, homeId: session.user.homeId } });
  if (!member) return NextResponse.json({ error: "Member not found." }, { status: 404 });

  const record = await prisma.report.create({
    data: {
      memberId,
      date: new Date(date),
      title: title.trim(),
      type,
      notes: notes || null,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      fileSize: fileSize || null,
    },
    include: { member: { select: { name: true } } },
  });

  return NextResponse.json(record, { status: 201 });
}
