"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Row, Col, Typography, Button, Spin, Empty, Tag } from "antd";
import { PlusOutlined, MedicineBoxOutlined, ThunderboltOutlined, HeartOutlined, FileTextOutlined } from "@ant-design/icons";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";
import type { Member, MedicationRecord, PainRecord, HealthIssue, Report } from "@/types/index";
import { useTheme } from "@/components/layout/ThemeContext";

const { Title, Text } = Typography;

const GENDER_AVATAR: Record<string, string> = {
  male:   "linear-gradient(135deg, #6366f1, #4f46e5)",
  female: "linear-gradient(135deg, #f472b6, #db2777)",
  other:  "linear-gradient(135deg, #a78bfa, #7c3aed)",
};

interface Activity {
  type: "medication" | "pain" | "health" | "report";
  date: string;
  label: string;
  memberName: string;
  memberId: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { dark } = useTheme();
  const { data: session } = useSession();
  const [members,    setMembers]    = useState<Member[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [mRes, medRes, painRes, hiRes, repRes] = await Promise.all([
          fetch("/api/members"),
          fetch("/api/medications?limit=5"),
          fetch("/api/pain?limit=5"),
          fetch("/api/health-issues?limit=5"),
          fetch("/api/reports?limit=5"),
        ]);
        const ms: Member[]             = mRes.ok    ? await mRes.json()    : [];
        const meds: MedicationRecord[] = medRes.ok  ? await medRes.json()  : [];
        const pains: PainRecord[]      = painRes.ok ? await painRes.json() : [];
        const his: HealthIssue[]       = hiRes.ok   ? await hiRes.json()   : [];
        const reps: Report[]           = repRes.ok  ? await repRes.json()  : [];

        const all: Activity[] = [
          ...meds.map(r  => ({ type: "medication" as const, date: r.date,      label: r.name,        memberName: r.member?.name ?? "", memberId: r.memberId })),
          ...pains.map(r => ({ type: "pain"       as const, date: r.date,      label: `Pain ${r.severity}/10${r.location ? " · " + r.location : ""}`, memberName: r.member?.name ?? "", memberId: r.memberId })),
          ...his.map(r   => ({ type: "health"     as const, date: r.createdAt, label: r.title,       memberName: r.member?.name ?? "", memberId: r.memberId })),
          ...reps.map(r  => ({ type: "report"     as const, date: r.date,      label: r.title,       memberName: r.member?.name ?? "", memberId: r.memberId })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

        setMembers(ms);
        setActivities(all);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const activityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "medication": return <MedicineBoxOutlined style={{ color: "#6366f1" }} />;
      case "pain":       return <ThunderboltOutlined style={{ color: "#f59e0b" }} />;
      case "health":     return <HeartOutlined       style={{ color: "#ef4444" }} />;
      case "report":     return <FileTextOutlined    style={{ color: "#8b5cf6" }} />;
    }
  };

  const activityColor = (type: Activity["type"]) => {
    switch (type) {
      case "medication": return "#6366f1";
      case "pain":       return "#f59e0b";
      case "health":     return "#ef4444";
      case "report":     return "#8b5cf6";
    }
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 64 }}><Spin size="large" /></div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Family Dashboard</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push("/members")}>
          Add Member
        </Button>
      </div>

      {members.length === 0 ? (
        <Empty description="No family members yet" style={{ padding: "48px 0" }}>
          <Button type="primary" onClick={() => router.push("/members")}>Add First Member</Button>
        </Empty>
      ) : (
        <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
          {members.map(m => {
            const isMe = !!session?.user?.id && m.userId === session.user.id;
            const avatarBg = GENDER_AVATAR[m.gender ?? ""] ?? GENDER_AVATAR.other;
            return (
              <Col key={m.id} xs={24} sm={12} md={8} lg={6}>
                <Card
                  hoverable
                  onClick={() => router.push(`/members/${m.id}`)}
                  style={{
                    borderRadius: 12,
                    cursor: "pointer",
                    border: isMe ? "2px solid #6366f1" : undefined,
                  }}
                  styles={{ body: { padding: "16px 20px" } }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 22,
                      background: avatarBg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontWeight: 700, fontSize: 18, flexShrink: 0,
                    }}>
                      {m.name[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Text strong style={{ fontSize: 15 }}>{m.name}</Text>
                        {isMe && <Tag color="#6366f1" style={{ fontSize: 11, padding: "0 6px" }}>You</Tag>}
                      </div>
                      {m.relation && <Tag color="blue" style={{ marginTop: 2 }}>{m.relation}</Tag>}
                      {m.dob && <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(m.dob).format("MMM D, YYYY")}</Text>}
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      <Title level={4} style={{ marginBottom: 16 }}>Recent Activity</Title>
      {activities.length === 0 ? (
        <Card style={{ borderRadius: 12 }}>
          <Empty description="No records yet" />
        </Card>
      ) : (
        <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 0 } }}>
          {(() => {
            const dividerColor = dark ? "#1e293b" : "#f0f0f0";
            return activities.map((a) => (
              <button
                key={`${a.type}-${a.memberId}-${a.date}`}
                onClick={() => router.push(`/members/${a.memberId}`)}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 20px",
                  cursor: "pointer", width: "100%", textAlign: "left", border: "none",
                  borderBottom: `1px solid ${dividerColor}`,
                  background: "transparent", transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = dark ? "#1e293b" : "#f8fafc")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
              <div style={{
                width: 36, height: 36, borderRadius: 18,
                background: activityColor(a.type) + "20",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {activityIcon(a.type)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ display: "block", fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {a.label}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {a.memberName} · {dayjs(a.date).format("MMM D")}
                </Text>
              </div>
              <Tag color={activityColor(a.type)} style={{ fontSize: 11 }}>{a.type}</Tag>
            </button>
            ));
          })()}
        </Card>
      )}
    </div>
  );
}
