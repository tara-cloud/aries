"use client";
import { useEffect, useState } from "react";
import { Typography, Card, Spin, Select, Grid } from "antd";
import type { Member } from "@/types/index";
import { useTheme } from "@/components/layout/ThemeContext";

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

interface HomeInfo { id: string; name: string; }

export default function SettingsPage() {
  useTheme();
  const { md } = useBreakpoint();
  const [home,           setHome]           = useState<HomeInfo | null>(null);
  const [members,        setMembers]        = useState<Member[]>([]);
  const [linkedMemberId, setLinkedMemberId] = useState<string | null>(null);
  const [saving,         setSaving]         = useState(false);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/homes").then(r => r.json()),
      fetch("/api/members").then(r => r.json()),
      fetch("/api/users/me/member").then(r => r.json()),
    ]).then(([h, ms, lm]) => {
      setHome(h);
      setMembers(ms ?? []);
      setLinkedMemberId(lm.memberId ?? null);
      setLoading(false);
    });
  }, []);

  async function saveLink(memberId: string | null) {
    setSaving(true);
    const res = await fetch("/api/users/me/member", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId }),
    });
    setSaving(false);
    if (res.ok) setLinkedMemberId(memberId);
  }

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 64 }}><Spin size="large" /></div>;
  if (!home) return null;

  const cardPad = md ? "20px 24px" : "16px";

  const memberOptions = [
    { value: "", label: "— None —" },
    ...members.map(m => ({
      value: m.id,
      label: m.relation ? `${m.name} (${m.relation})` : m.name,
    })),
  ];

  return (
    <div style={{ maxWidth: 640, width: "100%" }}>
      <Title level={3} style={{ marginBottom: 24 }}>Settings</Title>

      <Card style={{ borderRadius: 12, marginBottom: 20 }} styles={{ body: { padding: cardPad } }}>
        <Title level={5} style={{ marginBottom: 4 }}>Home</Title>
        <Text style={{ fontSize: 18, fontWeight: 700 }}>{home.name}</Text>
      </Card>

      <Card style={{ borderRadius: 12 }} styles={{ body: { padding: cardPad } }}>
        <Title level={5} style={{ marginBottom: 4 }}>Your Member Profile</Title>
        <Paragraph type="secondary" style={{ marginBottom: 12, fontSize: 13 }}>
          Link your login account to a family member so your card is highlighted as &quot;You&quot; across the app.
        </Paragraph>
        <Select
          style={{ width: "100%" }}
          value={linkedMemberId ?? ""}
          options={memberOptions}
          onChange={v => saveLink(v || null)}
          loading={saving}
        />
      </Card>
    </div>
  );
}
