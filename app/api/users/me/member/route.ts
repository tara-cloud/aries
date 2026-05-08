import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.member.findFirst({ where: { userId: session.user.id } });
  return NextResponse.json({ memberId: member?.id ?? null });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { memberId } = await req.json();

  await prisma.member.updateMany({
    where: { userId: session.user.id },
    data: { userId: null },
  });

  if (memberId) {
    const member = await prisma.member.findFirst({
      where: { id: memberId, homeId: session.user.homeId },
    });
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.member.update({ where: { id: memberId }, data: { userId: session.user.id } });
  }

  return NextResponse.json({ ok: true });
}
