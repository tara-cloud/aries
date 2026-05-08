import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runBackup, listBackups } from "@/lib/backup";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json(listBackups());
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)                      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Admin only" },   { status: 403 });
  void req;

  try {
    const result = await runBackup();
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Backup failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
