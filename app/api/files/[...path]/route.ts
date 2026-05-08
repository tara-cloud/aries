import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import fs from "node:fs";
import path from "node:path";

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const session = await auth();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { path: fileParts } = await params;
  const relPath = fileParts.join("/");

  // Ensure the file belongs to this home (memberId is the second segment: uploads/{memberId}/{file})
  if (relPath.startsWith("uploads/")) {
    const memberId = fileParts[1];
    if (memberId) {
      const member = await prisma.member.findFirst({ where: { id: memberId, homeId: session.user.homeId } });
      if (!member) return new NextResponse("Forbidden", { status: 403 });
    }
  }

  const dataDir  = process.env.DATA_MOUNT_PATH || "/data";
  const filePath = path.join(dataDir, relPath);

  if (!fs.existsSync(filePath)) return new NextResponse("Not Found", { status: 404 });

  const ext = path.extname(filePath).toLowerCase();
  const contentType: Record<string, string> = {
    ".pdf":  "application/pdf",
    ".jpg":  "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png":  "image/png",
    ".webp": "image/webp",
  };

  const buffer = fs.readFileSync(filePath);
  return new NextResponse(buffer, {
    headers: { "Content-Type": contentType[ext] || "application/octet-stream" },
  });
}
