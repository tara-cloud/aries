import fs from "node:fs";
import path from "node:path";

type Level = "info" | "warn" | "error";

const LOG_DIR  = path.join(process.env.DATA_MOUNT_PATH || "/data", "logs");
const LOG_FILE = path.join(LOG_DIR, "app.log");
const MAX_BYTES = 5 * 1024 * 1024; // rotate at 5 MB
const LOG_TTL_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

function ensureDir() {
  try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch { /* ok */ }
}

function rotate() {
  try {
    const stat = fs.statSync(LOG_FILE);
    if (stat.size > MAX_BYTES) {
      fs.renameSync(LOG_FILE, LOG_FILE + ".1");
    }
  } catch { /* file doesn't exist yet */ }
}

function write(level: Level, message: string, meta?: Record<string, unknown>) {
  const entry = JSON.stringify({ ts: new Date().toISOString(), level, message, ...meta });
  // stdout (captured by Docker)
  if (level === "error") console.error(entry);
  else console.log(entry);
  // file
  try {
    ensureDir();
    rotate();
    fs.appendFileSync(LOG_FILE, entry + "\n");
  } catch { /* non-fatal */ }
}

export const logger = {
  info:  (message: string, meta?: Record<string, unknown>) => write("info",  message, meta),
  warn:  (message: string, meta?: Record<string, unknown>) => write("warn",  message, meta),
  error: (message: string, meta?: Record<string, unknown>) => write("error", message, meta),
};

export function pruneOldLogs() {
  try {
    if (!fs.existsSync(LOG_FILE)) return;
    const cutoff = Date.now() - LOG_TTL_MS;
    const content = fs.readFileSync(LOG_FILE, "utf8");
    const kept = content.split("\n").filter(line => {
      if (!line.trim()) return false;
      try { return new Date((JSON.parse(line) as { ts: string }).ts).getTime() >= cutoff; }
      catch { return true; }
    });
    fs.writeFileSync(LOG_FILE, kept.length > 0 ? kept.join("\n") + "\n" : "");
  } catch { /* non-fatal */ }
}

export function clearLogs() {
  try {
    if (fs.existsSync(LOG_FILE))       fs.writeFileSync(LOG_FILE, "");
    if (fs.existsSync(LOG_FILE + ".1")) fs.unlinkSync(LOG_FILE + ".1");
  } catch { /* non-fatal */ }
}

