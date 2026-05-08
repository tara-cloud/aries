import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getMember(id: string, homeId: string) {
  return prisma.member.findFirst({ where: { id, homeId } });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const member = await getMember(id, session.user.homeId);
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(member);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const member = await getMember(id, session.user.homeId);
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, dob, relation, gender, notes } = await req.json();
  let newDob = member.dob;
  if (dob !== undefined) newDob = dob ? new Date(dob) : null;
  const updated = await prisma.member.update({
    where: { id },
    data: {
      name:     name?.trim()                                   ?? member.name,
      dob:      newDob,
      gender:   gender   === undefined ? member.gender   : gender   || null,
      relation: relation === undefined ? member.relation : relation || null,
      notes:    notes    === undefined ? member.notes    : notes    || null,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const member = await getMember(id, session.user.homeId);
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.member.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
