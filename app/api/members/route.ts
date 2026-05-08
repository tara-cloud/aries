import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const members = await prisma.member.findMany({
    where: { homeId: session.user.homeId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(members);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, dob, relation, gender, notes } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  const member = await prisma.member.create({
    data: {
      homeId: session.user.homeId,
      name: name.trim(),
      dob: dob ? new Date(dob) : null,
      gender: gender || null,
      relation: relation || null,
      notes: notes || null,
    },
  });
  logger.info("member:created", { homeId: session.user.homeId, memberId: member.id, name: member.name });
  return NextResponse.json(member, { status: 201 });
}
