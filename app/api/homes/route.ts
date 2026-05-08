import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const home = await prisma.home.findUnique({
    where: { id: session.user.homeId },
    include: { users: { select: { id: true, email: true, name: true, role: true, createdAt: true } } },
  });

  return NextResponse.json(home);
}
