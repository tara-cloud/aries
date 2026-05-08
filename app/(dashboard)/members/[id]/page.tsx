"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Typography, Button, Spin, Tag, Breadcrumb, Empty } from "antd";
import { ArrowLeftOutlined, MedicineBoxOutlined, ExperimentOutlined, ThunderboltOutlined, HeartOutlined, FileTextOutlined, CalendarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { Member, MedicationRecord, SupplementRecord, PainRecord, HealthIssue, Report, TimelineDay } from "@/types/index";
import { useTheme } from "@/components/layout/ThemeContext";
import Link from "next/link";

const { Title, Text } = Typography;

const GENDER_AVATAR: Record<string, string> = {
  male:   "linear-gradient(135deg, #6366f1, #4f46e5)",
  female: "linear-gradient(135deg, #f472b6, #db2777)",
  other:  "linear-gradient(135deg, #a78bfa, #7c3aed)",
};

const STATUS_COLOR: Record<string, string> = { resolved: "green", chronic: "orange", active: "red" };
const GENDER_TAG_COLOR: Record<string, string> = { male: "geekblue", female: "pink", other: "purple" };

function severityColor(s: number) {
  if (s >= 8) return "#ef4444";
  if (s >= 5) return "#f59e0b";
  return "#22c55e";
}

function buildTimeline(
  meds: MedicationRecord[],
  pains: PainRecord[],
  issues: HealthIssue[],
  reports: Report[]
): TimelineDay[] {
  const days = new Map<string, TimelineDay>();
  const get = (date: string) => {
    const d = dayjs(date).format("YYYY-MM-DD");
    if (!days.has(d)) days.set(d, { date: d, medications: [], painRecords: [], healthIssues: [], reports: [] });
    return days.get(d)!;
  };
  meds.forEach(r    => get(r.date).medications.push(r));
  pains.forEach(r   => get(r.date).painRecords.push(r));
  issues.forEach(r  => get(r.createdAt).healthIssues.push(r));
  reports.forEach(r => get(r.date).reports.push(r));
  return Array.from(days.values()).sort((a, b) => b.date.localeCompare(a.date));
}

export default function MemberTimelinePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { dark } = useTheme();

  const [member,  setMember]  = useState<Member | null>(null);
  const [meds,    setMeds]    = useState<MedicationRecord[]>([]);
  const [supps,   setSupps]   = useState<SupplementRecord[]>([]);
  const [pains,   setPains]   = useState<PainRecord[]>([]);
  const [issues,  setIssues]  = useState<HealthIssue[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [mRes, medRes, suppRes, painRes, hiRes, repRes] = await Promise.all([
      fetch(`/api/members/${id}`),
      fetch(`/api/medications?memberId=${id}`),
      fetch(`/api/supplements?memberId=${id}`),
      fetch(`/api/pain?memberId=${id}`),
      fetch(`/api/health-issues?memberId=${id}`),
      fetch(`/api/reports?memberId=${id}`),
    ]);
    if (mRes.ok) setMember(await mRes.json()); else { router.push("/members"); return; }
    if (medRes.ok)  setMeds(await medRes.json());
    if (suppRes.ok) setSupps(await suppRes.json());
    if (painRes.ok) setPains(await painRes.json());
    if (hiRes.ok)   setIssues(await hiRes.json());
    if (repRes.ok)  setReports(await repRes.json());
    setLoading(false);
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 64 }}><Spin size="large" /></div>;
  if (!member) return null;

  const timeline  = buildTimeline(meds, pains, issues, reports);
  const avatarBg  = GENDER_AVATAR[member.gender ?? ""] ?? GENDER_AVATAR.other;

  return (
    <div>
      <Breadcrumb style={{ marginBottom: 16 }} items={[{ title: <Link href="/members">Members</Link> }, { title: member.name }]} />

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push("/members")} />
        <div style={{
          width: 44, height: 44, borderRadius: 22,
          background: avatarBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 700, fontSize: 18,
        }}>
          {member.name[0].toUpperCase()}
        </div>
        <div>
          <Title level={3} style={{ margin: 0 }}>{member.name}</Title>
          <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
            {member.relation && <Tag color="blue">{member.relation}</Tag>}
            {member.gender   && <Tag color={GENDER_TAG_COLOR[member.gender] ?? "purple"}>{member.gender}</Tag>}
            {member.dob && <Text type="secondary" style={{ fontSize: 12 }}>Born {dayjs(member.dob).format("MMM D, YYYY")}</Text>}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <Button type="primary" size="small" icon={<MedicineBoxOutlined />} onClick={() => router.push(`/members/${id}/medications`)}>
          Medications ({meds.length})
        </Button>
        <Button size="small" icon={<ExperimentOutlined />} onClick={() => router.push(`/members/${id}/supplements`)} style={{ color: "#10b981", borderColor: "#10b981" }}>
          Supplements ({supps.length})
        </Button>
        <Button size="small" icon={<ThunderboltOutlined />} onClick={() => router.push(`/members/${id}/pain`)} style={{ color: "#f59e0b", borderColor: "#f59e0b" }}>
          Pain ({pains.length})
        </Button>
        <Button size="small" icon={<HeartOutlined />} onClick={() => router.push(`/members/${id}/health-issues`)} style={{ color: "#ef4444", borderColor: "#ef4444" }}>
          Health Issues ({issues.filter(i => i.status === "active" || i.status === "chronic").length} active)
        </Button>
        <Button size="small" icon={<FileTextOutlined />} onClick={() => router.push(`/members/${id}/reports`)} style={{ color: "#8b5cf6", borderColor: "#8b5cf6" }}>
          Reports ({reports.length})
        </Button>
        {member.gender === "female" && (
          <Button size="small" icon={<CalendarOutlined />} onClick={() => router.push(`/members/${id}/cycles`)} style={{ color: "#ec4899", borderColor: "#ec4899" }}>
            Cycles
          </Button>
        )}
      </div>

      {timeline.length === 0 ? (
        <Empty description="No health records yet. Use the buttons above to add records." style={{ padding: "48px 0" }} />
      ) : (
        <div>
          {timeline.map(day => (
            <div key={day.date} style={{ marginBottom: 24 }}>
              <div style={{
                display: "inline-block", padding: "4px 12px", borderRadius: 20,
                background: dark ? "#1e293b" : "#ede9fe",
                color: "#4338ca", fontWeight: 600, fontSize: 13, marginBottom: 12,
              }}>
                {dayjs(day.date).format("ddd, MMM D YYYY")}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 16, borderLeft: "2px solid #6366f130" }}>
                {day.medications.map(r => (
                  <div key={r.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 14px", borderRadius: 8, background: dark ? "#1e293b" : "#ffffff", border: `1px solid ${dark ? "#334155" : "#ede9fe"}` }}>
                    <MedicineBoxOutlined style={{ color: "#6366f1", marginTop: 2 }} />
                    <div>
                      <Text strong>{r.name}</Text>
                      {r.dosage    && <Text type="secondary"> · {r.dosage}</Text>}
                      {r.frequency && <Text type="secondary"> · {r.frequency}</Text>}
                      {r.reason    && <div><Text type="secondary" style={{ fontSize: 12 }}>For: {r.reason}</Text></div>}
                    </div>
                  </div>
                ))}

                {day.painRecords.map(r => (
                  <div key={r.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 14px", borderRadius: 8, background: dark ? "#1e293b" : "#ffffff", border: `1px solid ${dark ? "#334155" : "#fef3c7"}` }}>
                    <ThunderboltOutlined style={{ color: "#f59e0b", marginTop: 2 }} />
                    <div>
                      <span style={{ fontWeight: 700, color: severityColor(r.severity) }}>{r.severity}/10</span>
                      {r.location    && <Text> · {r.location}</Text>}
                      {r.description && <div><Text type="secondary" style={{ fontSize: 12 }}>{r.description}</Text></div>}
                      {r.duration    && <Text type="secondary" style={{ fontSize: 12 }}> · {r.duration}</Text>}
                    </div>
                  </div>
                ))}

                {day.healthIssues.map(r => (
                  <div key={r.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 14px", borderRadius: 8, background: dark ? "#1e293b" : "#ffffff", border: `1px solid ${dark ? "#334155" : "#fee2e2"}` }}>
                    <HeartOutlined style={{ color: "#ef4444", marginTop: 2 }} />
                    <div>
                      <Text strong>{r.title}</Text>
                      <Tag style={{ marginLeft: 8 }} color={STATUS_COLOR[r.status] ?? "red"}>{r.status}</Tag>
                      {r.severity    && <Tag>{r.severity}</Tag>}
                      {r.description && <div><Text type="secondary" style={{ fontSize: 12 }}>{r.description}</Text></div>}
                    </div>
                  </div>
                ))}

                {day.reports.map(r => (
                  <div key={r.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 14px", borderRadius: 8, background: dark ? "#1e293b" : "#ffffff", border: `1px solid ${dark ? "#334155" : "#ede9fe"}` }}>
                    <FileTextOutlined style={{ color: "#8b5cf6", marginTop: 2 }} />
                    <div>
                      <Text strong>{r.title}</Text>
                      <Tag style={{ marginLeft: 8 }} color="purple">{r.type}</Tag>
                      {r.fileName && r.fileUrl && (
                        <a href={`/api/files/${r.fileUrl}`} target="_blank" rel="noreferrer" style={{ display: "block", fontSize: 12, color: "#6366f1", marginTop: 4 }}>
                          {r.fileName}
                        </a>
                      )}
                      {r.notes && <div><Text type="secondary" style={{ fontSize: 12 }}>{r.notes}</Text></div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
