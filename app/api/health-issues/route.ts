import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");
  const status   = searchParams.get("status");
  const limit    = Math.min(Math.max(Number.parseInt(searchParams.get("limit") ?? "100") || 100, 1), 500);

  const records = await prisma.healthIssue.findMany({
    where: {
      member: { homeId: session.user.homeId },
      ...(memberId ? { memberId } : {}),
      ...(status   ? { status }   : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { member: { select: { name: true } } },
  });

  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { memberId, title, description, diagnosedDate, status, severity, notes } = await req.json();
  if (!memberId || !title?.trim()) {
    return NextResponse.json({ error: "memberId and title are required." }, { status: 400 });
  }

  const member = await prisma.member.findFirst({ where: { id: memberId, homeId: session.user.homeId } });
  if (!member) return NextResponse.json({ error: "Member not found." }, { status: 404 });

  const record = await prisma.healthIssue.create({
    data: {
      memberId,
      title: title.trim(),
      description: description || null,
      diagnosedDate: diagnosedDate ? new Date(diagnosedDate) : null,
      status: status || "active",
      severity: severity || null,
      notes: notes || null,
    },
    include: { member: { select: { name: true } } },
  });

  return NextResponse.json(record, { status: 201 });
}
