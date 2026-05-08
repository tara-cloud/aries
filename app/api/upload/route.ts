import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { logger } from "@/lib/logger";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg":      "jpg",
  "image/png":       "png",
  "image/webp":      "webp",
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file     = formData.get("file") as File | null;
  const memberId = formData.get("memberId") as string | null;

  if (!file || !memberId) {
    return NextResponse.json({ error: "file and memberId are required." }, { status: 400 });
  }

  const member = await prisma.member.findFirst({ where: { id: memberId, homeId: session.user.homeId } });
  if (!member) return NextResponse.json({ error: "Member not found." }, { status: 404 });

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "Unsupported file type. Allowed: PDF, JPEG, PNG, WEBP." }, { status: 400 });

  if (file.size > MAX_SIZE) return NextResponse.json({ error: "File too large. Max 10 MB." }, { status: 400 });

  const dataDir  = process.env.DATA_MOUNT_PATH || "/data";
  const uploadDir = path.join(dataDir, "uploads", memberId);
  fs.mkdirSync(uploadDir, { recursive: true });

  const filename = `${randomUUID()}.${ext}`;
  const filePath = path.join(uploadDir, filename);
  const buffer   = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  const relPath = path.join("uploads", memberId, filename);
  logger.info("upload:saved", { memberId, fileName: file.name, size: file.size, path: relPath });
  return NextResponse.json({ fileUrl: relPath, fileName: file.name, fileSize: file.size }, { status: 201 });
}
