"use client";
import { useState, useCallback } from "react";
import { Typography, Input, Spin, Tag, Empty } from "antd";
import { SearchOutlined, MedicineBoxOutlined, ExperimentOutlined, ThunderboltOutlined, HeartOutlined, FileTextOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import type { SearchResult } from "@/types/index";
import { useTheme } from "@/components/layout/ThemeContext";
import { useDebounce } from "use-debounce";
import { useEffect } from "react";

const { Title, Text } = Typography;

export default function SearchPage() {
  const router = useRouter();
  const { dark } = useTheme();
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState<SearchResult | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [debouncedQuery] = useDebounce(query, 350);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) setResults(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { search(debouncedQuery); }, [debouncedQuery, search]);

  const total = results
    ? results.medications.length + results.supplements.length + results.painRecords.length + results.healthIssues.length + results.reports.length
    : 0;

  const cardStyle = {
    padding: "10px 14px", borderRadius: 8,
    background: dark ? "#1e293b" : "#ffffff",
    border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
    cursor: "pointer",
    marginBottom: 8,
  };

  return (
    <div>
      <Title level={3} style={{ marginBottom: 20 }}>Search</Title>

      <Input
        size="large"
        prefix={<SearchOutlined />}
        placeholder="Search medications, pain, health issues, reports…"
        value={query}
        onChange={e => setQuery(e.target.value)}
        allowClear
        style={{ marginBottom: 24, borderRadius: 10 }}
      />

      {loading && <div style={{ display: "flex", justifyContent: "center", padding: 32 }}><Spin /></div>}

      {!loading && query.length >= 2 && results && total === 0 && (
        <Empty description={`No results for "${query}"`} />
      )}

      {!loading && results && total > 0 && (
        <div>
          {results.medications.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <MedicineBoxOutlined style={{ color: "#6366f1" }} />
                <Text strong>Medications ({results.medications.length})</Text>
              </div>
              {results.medications.map(r => (
                <div key={r.id} style={cardStyle} onClick={() => router.push(`/members/${r.memberId}/medications`)}
                  onMouseEnter={e => (e.currentTarget.style.background = dark ? "#253349" : "#f8fafc")}
                  onMouseLeave={e => (e.currentTarget.style.background = dark ? "#1e293b" : "#ffffff")}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Text strong>{r.name}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(r.date).format("MMM D, YYYY")}</Text>
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{r.member?.name}{r.dosage ? " · " + r.dosage : ""}</Text>
                </div>
              ))}
            </div>
          )}

          {results.supplements.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <ExperimentOutlined style={{ color: "#10b981" }} />
                <Text strong>Supplements ({results.supplements.length})</Text>
              </div>
              {results.supplements.map(r => (
                <div key={r.id} style={cardStyle} onClick={() => router.push(`/members/${r.memberId}/supplements`)}
                  onMouseEnter={e => (e.currentTarget.style.background = dark ? "#253349" : "#f8fafc")}
                  onMouseLeave={e => (e.currentTarget.style.background = dark ? "#1e293b" : "#ffffff")}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Text strong>{r.name}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(r.date).format("MMM D, YYYY")}</Text>
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{r.member?.name}{r.dosage ? " · " + r.dosage : ""}</Text>
                </div>
              ))}
            </div>
          )}

          {results.painRecords.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <ThunderboltOutlined style={{ color: "#f59e0b" }} />
                <Text strong>Pain Records ({results.painRecords.length})</Text>
              </div>
              {results.painRecords.map(r => (
                <div key={r.id} style={cardStyle} onClick={() => router.push(`/members/${r.memberId}/pain`)}
                  onMouseEnter={e => (e.currentTarget.style.background = dark ? "#253349" : "#f8fafc")}
                  onMouseLeave={e => (e.currentTarget.style.background = dark ? "#1e293b" : "#ffffff")}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Text strong>{r.location || "Pain"} — {r.severity}/10</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(r.date).format("MMM D, YYYY")}</Text>
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{r.member?.name}{r.description ? " · " + r.description : ""}</Text>
                </div>
              ))}
            </div>
          )}

          {results.healthIssues.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <HeartOutlined style={{ color: "#ef4444" }} />
                <Text strong>Health Issues ({results.healthIssues.length})</Text>
              </div>
              {results.healthIssues.map(r => (
                <div key={r.id} style={cardStyle} onClick={() => router.push(`/members/${r.memberId}/health-issues`)}
                  onMouseEnter={e => (e.currentTarget.style.background = dark ? "#253349" : "#f8fafc")}
                  onMouseLeave={e => (e.currentTarget.style.background = dark ? "#1e293b" : "#ffffff")}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Text strong>{r.title}</Text>
                    <Tag color={r.status === "resolved" ? "green" : r.status === "chronic" ? "orange" : "red"}>{r.status}</Tag>
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{r.member?.name}</Text>
                </div>
              ))}
            </div>
          )}

          {results.reports.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <FileTextOutlined style={{ color: "#8b5cf6" }} />
                <Text strong>Reports ({results.reports.length})</Text>
              </div>
              {results.reports.map(r => (
                <div key={r.id} style={cardStyle} onClick={() => router.push(`/members/${r.memberId}/reports`)}
                  onMouseEnter={e => (e.currentTarget.style.background = dark ? "#253349" : "#f8fafc")}
                  onMouseLeave={e => (e.currentTarget.style.background = dark ? "#1e293b" : "#ffffff")}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Text strong>{r.title}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(r.date).format("MMM D, YYYY")}</Text>
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{r.member?.name} · <Tag color="purple">{r.type}</Tag></Text>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
