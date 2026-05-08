import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");
  const limit    = Math.min(Math.max(Number.parseInt(searchParams.get("limit") ?? "100") || 100, 1), 500);

  const records = await prisma.supplementRecord.findMany({
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

  const { memberId, date, name, dosage, timesPerDay, endDate, reason, notes } = await req.json();
  if (!memberId || !date || !name?.trim()) {
    return NextResponse.json({ error: "memberId, date and name are required." }, { status: 400 });
  }

  const member = await prisma.member.findFirst({ where: { id: memberId, homeId: session.user.homeId } });
  if (!member) return NextResponse.json({ error: "Member not found." }, { status: 404 });

  const record = await prisma.supplementRecord.create({
    data: { memberId, date: new Date(date), name: name.trim(), dosage: dosage || null, timesPerDay: timesPerDay || null, endDate: endDate ? new Date(endDate) : null, reason: reason || null, notes: notes || null },
    include: { member: { select: { name: true } } },
  });

  return NextResponse.json(record, { status: 201 });
}
