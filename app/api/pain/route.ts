import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");
  const limit    = Math.min(Math.max(Number.parseInt(searchParams.get("limit") ?? "100") || 100, 1), 500);

  const records = await prisma.painRecord.findMany({
    where: {
      member: { homeId: session.user.homeId },
      ...(memberId ? { memberId } : {}),
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

  const { memberId, date, severity, location, description, duration, notes } = await req.json();
  if (!memberId || !date || severity == null) {
    return NextResponse.json({ error: "memberId, date and severity are required." }, { status: 400 });
  }
  if (severity < 1 || severity > 10) {
    return NextResponse.json({ error: "Severity must be 1-10." }, { status: 400 });
  }

  const member = await prisma.member.findFirst({ where: { id: memberId, homeId: session.user.homeId } });
  if (!member) return NextResponse.json({ error: "Member not found." }, { status: 404 });

  const record = await prisma.painRecord.create({
    data: { memberId, date: new Date(date), severity: Number(severity), location: location || null, description: description || null, duration: duration || null, notes: notes || null },
    include: { member: { select: { name: true } } },
  });

  return NextResponse.json(record, { status: 201 });
}
