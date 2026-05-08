"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Typography, Button, Table, Modal, Form, Input, Select, DatePicker, Popconfirm, message, Breadcrumb, Spin, Tag } from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { Member, CycleRecord } from "@/types/index";
import Link from "next/link";

const { Title } = Typography;

const FLOW_OPTIONS = [
  { value: "light",  label: "Light"  },
  { value: "medium", label: "Medium" },
  { value: "heavy",  label: "Heavy"  },
];

const FLOW_COLOR: Record<string, string> = { light: "cyan", medium: "blue", heavy: "red" };

export default function MemberCyclesPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [member,    setMember]    = useState<Member | null>(null);
  const [records,   setRecords]   = useState<CycleRecord[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing,   setEditing]   = useState<CycleRecord | null>(null);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    const [mRes, rRes] = await Promise.all([
      fetch(`/api/members/${id}`),
      fetch(`/api/cycle?memberId=${id}`),
    ]);
    if (mRes.ok) {
      const m: Member = await mRes.json();
      if (m.gender !== "female") { router.push(`/members/${id}`); return; }
      setMember(m);
    } else {
      router.push("/members");
      return;
    }
    if (rRes.ok) setRecords(await rRes.json());
    setLoading(false);
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ startDate: dayjs() });
    setModalOpen(true);
  }

  function openEdit(r: CycleRecord) {
    setEditing(r);
    form.setFieldsValue({
      startDate: dayjs(r.startDate),
      endDate:   r.endDate ? dayjs(r.endDate) : null,
      flow:      r.flow,
      symptoms:  r.symptoms,
      notes:     r.notes,
    });
    setModalOpen(true);
  }

  async function handleSubmit(values: Record<string, unknown>) {
    const body = {
      memberId:  id,
      startDate: (values.startDate as dayjs.Dayjs).toISOString(),
      endDate:   values.endDate ? (values.endDate as dayjs.Dayjs).toISOString() : null,
      flow:      values.flow     || null,
      symptoms:  values.symptoms || null,
      notes:     values.notes    || null,
    };
    const url    = editing ? `/api/cycle/${editing.id}` : "/api/cycle";
    const method = editing ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      message.success(editing ? "Updated" : "Added");
      setModalOpen(false);
      await load();
    } else {
      const d = await res.json();
      message.error(d.error ?? "Failed");
    }
  }

  async function handleDelete(recId: string) {
    const res = await fetch(`/api/cycle/${recId}`, { method: "DELETE" });
    if (res.ok) { message.success("Deleted"); await load(); }
    else message.error("Failed");
  }

  const columns = [
    {
      title: "Start", dataIndex: "startDate", key: "startDate",
      render: (v: string) => dayjs(v).format("MMM D, YYYY"), width: 130,
    },
    {
      title: "End", dataIndex: "endDate", key: "endDate",
      render: (v: string | null) => v ? dayjs(v).format("MMM D, YYYY") : "—", width: 130,
    },
    {
      title: "Duration", key: "duration",
      render: (_: unknown, r: CycleRecord) => {
        if (!r.endDate) return "—";
        const days = dayjs(r.endDate).diff(dayjs(r.startDate), "day") + 1;
        return `${days}d`;
      },
      width: 90,
    },
    {
      title: "Flow", dataIndex: "flow", key: "flow",
      render: (v: string | null) => v ? <Tag color={FLOW_COLOR[v] ?? "default"}>{v}</Tag> : "—",
      width: 100,
    },
    { title: "Symptoms", dataIndex: "symptoms", key: "symptoms", render: (v: string | null) => v || "—" },
    { title: "Notes",    dataIndex: "notes",    key: "notes",    render: (v: string | null) => v || "—" },
    {
      title: "", key: "actions", width: 80,
      render: (_: unknown, r: CycleRecord) => (
        <div style={{ display: "flex", gap: 4 }}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm title="Delete?" onConfirm={() => handleDelete(r.id)} okText="Delete" okButtonProps={{ danger: true }}>
            <Button type="text" size="small" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </div>
      ),
    },
  ];

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 64 }}><Spin size="large" /></div>;

  return (
    <div>
      <Breadcrumb style={{ marginBottom: 12 }} items={[
        { title: <Link href="/members">Members</Link> },
        { title: <Link href={`/members/${id}`}>{member?.name}</Link> },
        { title: "Cycles" },
      ]} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push(`/members/${id}`)} />
          <Title level={3} style={{ margin: 0 }}>Menstrual Cycles — {member?.name}</Title>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>Add</Button>
      </div>

      <Table dataSource={records} columns={columns} rowKey="id" pagination={{ pageSize: 20 }} scroll={{ x: 600 }} />

      <Modal title={editing ? "Edit Cycle" : "Add Cycle"} open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} destroyOnHidden>
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Form.Item name="startDate" label="Start Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="endDate" label="End Date">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="flow" label="Flow">
            <Select placeholder="Select flow" allowClear options={FLOW_OPTIONS} />
          </Form.Item>
          <Form.Item name="symptoms" label="Symptoms">
            <Input.TextArea rows={2} placeholder="e.g. cramps, headache, bloating..." />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">{editing ? "Update" : "Add"}</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
