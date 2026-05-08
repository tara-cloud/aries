import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function checkMember(memberId: string, homeId: string) {
  return prisma.member.findFirst({ where: { id: memberId, homeId } });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberId = req.nextUrl.searchParams.get("memberId");
  if (!memberId) return NextResponse.json({ error: "memberId required" }, { status: 400 });

  const member = await checkMember(memberId, session.user.homeId);
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const records = await prisma.cycleRecord.findMany({
    where: { memberId },
    orderBy: { startDate: "desc" },
  });
  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { memberId, startDate, endDate, flow, symptoms, notes } = await req.json();
  if (!memberId || !startDate) return NextResponse.json({ error: "memberId and startDate required" }, { status: 400 });

  const member = await checkMember(memberId, session.user.homeId);
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const record = await prisma.cycleRecord.create({
    data: {
      memberId,
      startDate: new Date(startDate),
      endDate:   endDate   ? new Date(endDate) : null,
      flow:      flow      || null,
      symptoms:  symptoms  || null,
      notes:     notes     || null,
    },
  });
  return NextResponse.json(record, { status: 201 });
}
