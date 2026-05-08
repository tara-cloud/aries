"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { Typography, Switch, Select, Empty, Spin, Button, Popconfirm, message } from "antd";
import { ReloadOutlined, DeleteOutlined } from "@ant-design/icons";
import { useTheme } from "@/components/layout/ThemeContext";

const { Title, Text } = Typography;

interface LogEntry {
  ts: string;
  level: "info" | "warn" | "error";
  message: string;
  [key: string]: unknown;
}

const LEVEL_COLOR: Record<string, string> = {
  info:  "#38bdf8",
  warn:  "#fbbf24",
  error: "#f87171",
};

const LEVEL_BG: Record<string, string> = {
  info:  "rgba(56,189,248,0.08)",
  warn:  "rgba(251,191,36,0.08)",
  error: "rgba(248,113,113,0.10)",
};

export default function LogsPage() {
  const { dark } = useTheme();
  const [lines,      setLines]      = useState<LogEntry[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [autoRefresh,setAutoRefresh]= useState(true);
  const [filter,     setFilter]     = useState<"all"|"info"|"warn"|"error">("all");
  const bottomRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [clearing, setClearing] = useState(false);

  async function clearLogs() {
    setClearing(true);
    const res = await fetch("/api/admin/logs", { method: "DELETE" });
    setClearing(false);
    if (res.ok) { message.success("Logs cleared"); setLines([]); }
    else message.error("Failed to clear logs");
  }

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/logs?lines=500");
    if (res.ok) {
      const data = await res.json();
      setLines(data.lines ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(load, 5000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const visible = filter === "all" ? lines : lines.filter(l => l.level === filter);

  const counts = lines.reduce((acc, l) => {
    acc[l.level] = (acc[l.level] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  function formatMeta(entry: LogEntry) {
    const { ts, level, message, ...rest } = entry;
    void ts; void level; void message;
    const keys = Object.keys(rest);
    if (keys.length === 0) return null;
    return keys.map(k => `${k}=${JSON.stringify(rest[k])}`).join(" ");
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <Title level={3} style={{ margin: 0 }}>Application Logs</Title>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Select value={filter} onChange={setFilter} style={{ width: 110 }} size="small">
            <Select.Option value="all">All ({lines.length})</Select.Option>
            <Select.Option value="error">Error ({counts.error ?? 0})</Select.Option>
            <Select.Option value="warn">Warn ({counts.warn ?? 0})</Select.Option>
            <Select.Option value="info">Info ({counts.info ?? 0})</Select.Option>
          </Select>
          <Button size="small" icon={<ReloadOutlined />} onClick={load}>Refresh</Button>
          <Popconfirm title="Clear all logs?" onConfirm={clearLogs} okText="Clear" okButtonProps={{ danger: true }}>
            <Button size="small" icon={<DeleteOutlined />} danger loading={clearing}>Clear</Button>
          </Popconfirm>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Text style={{ fontSize: 13 }}>Auto</Text>
            <Switch size="small" checked={autoRefresh} onChange={setAutoRefresh} />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 64 }}><Spin /></div>
      ) : visible.length === 0 ? (
        <Empty description="No log entries yet" style={{ padding: "48px 0" }} />
      ) : (
        <div style={{
          background: dark ? "#0d1117" : "#1a1a2e",
          borderRadius: 10,
          padding: "12px 0",
          fontFamily: "ui-monospace, 'Cascadia Code', monospace",
          fontSize: 12,
          lineHeight: 1.6,
          maxHeight: "calc(100vh - 200px)",
          overflowY: "auto",
        }}>
          {visible.map((entry, i) => {
            const meta = formatMeta(entry);
            return (
              <div key={i} style={{
                display: "flex",
                gap: 12,
                padding: "3px 16px",
                background: LEVEL_BG[entry.level],
                borderLeft: `3px solid ${i === visible.length - 1 ? LEVEL_COLOR[entry.level] : "transparent"}`,
              }}>
                <span style={{ color: "#64748b", flexShrink: 0, minWidth: 80 }}>
                  {entry.ts ? new Date(entry.ts).toLocaleTimeString() : ""}
                </span>
                <span style={{ color: LEVEL_COLOR[entry.level], flexShrink: 0, minWidth: 36, fontWeight: 700 }}>
                  {entry.level?.toUpperCase()}
                </span>
                <span style={{ color: "#e2e8f0" }}>{entry.message}</span>
                {meta && <span style={{ color: "#64748b", marginLeft: 8 }}>{meta}</span>}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
