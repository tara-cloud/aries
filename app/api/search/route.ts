import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q || q.length < 2 || q.length > 100) return NextResponse.json({ medications: [], supplements: [], painRecords: [], healthIssues: [], reports: [] });

  const base = { member: { homeId: session.user.homeId } };

  const [medications, supplements, painRecords, healthIssues, reports] = await Promise.all([
    prisma.medicationRecord.findMany({
      where: { ...base, OR: [{ name: { contains: q, mode: "insensitive" } }, { dosage: { contains: q, mode: "insensitive" } }, { reason: { contains: q, mode: "insensitive" } }, { notes: { contains: q, mode: "insensitive" } }] },
      orderBy: { date: "desc" },
      take: 20,
      include: { member: { select: { name: true } } },
    }),
    prisma.supplementRecord.findMany({
      where: { ...base, OR: [{ name: { contains: q, mode: "insensitive" } }, { dosage: { contains: q, mode: "insensitive" } }, { reason: { contains: q, mode: "insensitive" } }, { notes: { contains: q, mode: "insensitive" } }] },
      orderBy: { date: "desc" },
      take: 20,
      include: { member: { select: { name: true } } },
    }),
    prisma.painRecord.findMany({
      where: { ...base, OR: [{ location: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }, { notes: { contains: q, mode: "insensitive" } }] },
      orderBy: { date: "desc" },
      take: 20,
      include: { member: { select: { name: true } } },
    }),
    prisma.healthIssue.findMany({
      where: { ...base, OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }, { notes: { contains: q, mode: "insensitive" } }] },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { member: { select: { name: true } } },
    }),
    prisma.report.findMany({
      where: { ...base, OR: [{ title: { contains: q, mode: "insensitive" } }, { notes: { contains: q, mode: "insensitive" } }, { fileName: { contains: q, mode: "insensitive" } }] },
      orderBy: { date: "desc" },
      take: 20,
      include: { member: { select: { name: true } } },
    }),
  ]);

  return NextResponse.json({ medications, supplements, painRecords, healthIssues, reports });
}
