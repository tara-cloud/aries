import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";
import { auth } from "@/lib/auth";
import { BACKUP_DIR, restoreBackup } from "@/lib/backup";

function safeName(name: string) {
  return /^backup-[\w\-.]+\.json$/.test(name) ? name : null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await params;
  const safe = safeName(name);
  if (!safe) return NextResponse.json({ error: "Invalid filename" }, { status: 400 });

  const filepath = path.join(BACKUP_DIR, safe);
  if (!fs.existsSync(filepath)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const content = fs.readFileSync(filepath);
  return new NextResponse(content, {
    headers: {
      "Content-Type":        "application/json",
      "Content-Disposition": `attachment; filename="${safe}"`,
    },
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const session = await auth();
  if (!session)                      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Admin only" },   { status: 403 });

  const { name } = await params;
  const safe = safeName(name);
  if (!safe) return NextResponse.json({ error: "Invalid filename" }, { status: 400 });

  const body = await req.json().catch(() => ({})) as { action?: string };
  if (body.action !== "restore") return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  try {
    await restoreBackup(safe);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Restore failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const session = await auth();
  if (!session)                      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Admin only" },   { status: 403 });

  const { name } = await params;
  const safe = safeName(name);
  if (!safe) return NextResponse.json({ error: "Invalid filename" }, { status: 400 });

  const filepath = path.join(BACKUP_DIR, safe);
  if (!fs.existsSync(filepath)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  fs.unlinkSync(filepath);
  return NextResponse.json({ ok: true });
}
