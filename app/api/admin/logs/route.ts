import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import fs from "node:fs";
import path from "node:path";
import { clearLogs } from "@/lib/logger";

const LOG_DIR  = path.join(process.env.DATA_MOUNT_PATH || "/data", "logs");
const LOG_FILE = path.join(LOG_DIR, "app.log");
const MAX_LINES = 500;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lines = parseInt(new URL(req.url).searchParams.get("lines") ?? String(MAX_LINES));

  if (!fs.existsSync(LOG_FILE)) {
    return NextResponse.json({ lines: [], logFile: LOG_FILE });
  }

  const content = fs.readFileSync(LOG_FILE, "utf8");
  const all = content.split("\n").filter(Boolean);
  const tail = all.slice(-Math.min(lines, MAX_LINES));

  const parsed = tail.map(line => {
    try { return JSON.parse(line); }
    catch { return { ts: "", level: "info", message: line }; }
  });

  return NextResponse.json({ lines: parsed, total: all.length });
}

export async function DELETE(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  clearLogs();
  return NextResponse.json({ ok: true });
}

