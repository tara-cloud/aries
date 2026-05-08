import fs from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const BACKUP_DIR = path.join(process.env.DATA_MOUNT_PATH || "/data", "backups");
const KEEP = 5;

export interface BackupMeta {
  name: string;
  size: number;
  createdAt: number;
}

export async function runBackup(): Promise<BackupMeta> {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const [homes, users, members, medications, supplements, pains, issues, reports, cycles] = await Promise.all([
    prisma.home.findMany(),
    prisma.user.findMany(),
    prisma.member.findMany(),
    prisma.medicationRecord.findMany(),
    prisma.supplementRecord.findMany(),
    prisma.painRecord.findMany(),
    prisma.healthIssue.findMany(),
    prisma.report.findMany(),
    prisma.cycleRecord.findMany(),
  ]);

  const payload = {
    meta:        { version: 1, timestamp: new Date().toISOString(), appVersion: process.env.npm_package_version ?? "1.0.2" },
    homes,
    users,
    members,
    medications,
    supplements,
    pains,
    issues,
    reports,
    cycles,
  };

  const name     = `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  const filepath = path.join(BACKUP_DIR, name);
  fs.writeFileSync(filepath, JSON.stringify(payload));

  pruneBackups();
  const size = fs.statSync(filepath).size;
  logger.info("backup:created", { name, size });
  return { name, size, createdAt: Date.now() };
}

function pruneBackups() {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith("backup-") && f.endsWith(".json"))
    .map(f => ({ name: f, mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);

  for (const f of files.slice(KEEP)) {
    fs.unlinkSync(path.join(BACKUP_DIR, f.name));
    logger.info("backup:pruned", { name: f.name });
  }
}

export function listBackups(): BackupMeta[] {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  return fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith("backup-") && f.endsWith(".json"))
    .map(f => {
      const stat = fs.statSync(path.join(BACKUP_DIR, f));
      return { name: f, size: stat.size, createdAt: stat.mtimeMs };
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function restoreBackup(name: string): Promise<void> {
  const filepath = path.join(BACKUP_DIR, name);
  if (!fs.existsSync(filepath)) throw new Error("Backup file not found");

  const raw  = fs.readFileSync(filepath, "utf-8");
  const data = JSON.parse(raw) as {
    homes:       Record<string, unknown>[];
    users:       Record<string, unknown>[];
    members:     Record<string, unknown>[];
    medications: Record<string, unknown>[];
    supplements: Record<string, unknown>[];
    pains:       Record<string, unknown>[];
    issues:      Record<string, unknown>[];
    reports:     Record<string, unknown>[];
    cycles:      Record<string, unknown>[];
  };

  const dateFields = (obj: Record<string, unknown>, keys: string[]) => {
    const out = { ...obj };
    for (const k of keys) {
      if (out[k]) out[k] = new Date(out[k] as string);
    }
    return out;
  };

  await prisma.$transaction(async (tx) => {
    await tx.cycleRecord.deleteMany();
    await tx.report.deleteMany();
    await tx.healthIssue.deleteMany();
    await tx.painRecord.deleteMany();
    await tx.supplementRecord.deleteMany();
    await tx.medicationRecord.deleteMany();
    await tx.member.deleteMany();
    await tx.user.deleteMany();
    await tx.home.deleteMany();

    for (const r of data.homes) {
      await tx.home.create({ data: dateFields(r, ["createdAt", "updatedAt"]) as Parameters<typeof tx.home.create>[0]["data"] });
    }
    for (const r of data.users) {
      await tx.user.create({ data: dateFields(r, ["createdAt", "updatedAt"]) as Parameters<typeof tx.user.create>[0]["data"] });
    }
    for (const r of data.members) {
      await tx.member.create({ data: dateFields(r, ["createdAt", "updatedAt", "dob"]) as Parameters<typeof tx.member.create>[0]["data"] });
    }
    for (const r of data.medications) {
      await tx.medicationRecord.create({ data: dateFields(r, ["createdAt", "date", "endDate"]) as Parameters<typeof tx.medicationRecord.create>[0]["data"] });
    }
    for (const r of (data.supplements ?? [])) {
      await tx.supplementRecord.create({ data: dateFields(r, ["createdAt", "date", "endDate"]) as Parameters<typeof tx.supplementRecord.create>[0]["data"] });
    }
    for (const r of data.pains) {
      await tx.painRecord.create({ data: dateFields(r, ["createdAt", "date"]) as Parameters<typeof tx.painRecord.create>[0]["data"] });
    }
    for (const r of data.issues) {
      await tx.healthIssue.create({ data: dateFields(r, ["createdAt", "updatedAt", "diagnosedDate", "resolvedDate"]) as Parameters<typeof tx.healthIssue.create>[0]["data"] });
    }
    for (const r of data.reports) {
      await tx.report.create({ data: dateFields(r, ["createdAt", "date"]) as Parameters<typeof tx.report.create>[0]["data"] });
    }
    for (const r of data.cycles) {
      await tx.cycleRecord.create({ data: dateFields(r, ["createdAt", "startDate", "endDate"]) as Parameters<typeof tx.cycleRecord.create>[0]["data"] });
    }
  });

  logger.info("backup:restored", { name });
}
