export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { runBackup } = await import("@/lib/backup");
    const { pruneOldLogs } = await import("@/lib/logger");

    setTimeout(() => {
      pruneOldLogs();
      runBackup().catch(err => console.error("[backup] startup backup failed:", err));
    }, 30_000);

    setInterval(() => {
      pruneOldLogs();
      runBackup().catch(err => console.error("[backup] daily backup failed:", err));
    }, 24 * 60 * 60 * 1000);
  }
}
