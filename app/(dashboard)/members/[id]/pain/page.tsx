"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Typography, Button, Table, Modal, Form, Input, InputNumber, DatePicker, Popconfirm, message, Breadcrumb, Spin, Tag } from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { Member, PainRecord } from "@/types/index";
import Link from "next/link";

const { Title } = Typography;

const SEVERITY_COLOR = (s: number) => s >= 8 ? "red" : s >= 5 ? "orange" : "green";

export default function MemberPainPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [member,  setMember]  = useState<Member | null>(null);
  const [records, setRecords] = useState<PainRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing,   setEditing]   = useState<PainRecord | null>(null);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    const [mRes, rRes] = await Promise.all([fetch(`/api/members/${id}`), fetch(`/api/pain?memberId=${id}`)]);
    if (mRes.ok) setMember(await mRes.json()); else { router.push("/members"); return; }
    if (rRes.ok) setRecords(await rRes.json());
    setLoading(false);
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setEditing(null); form.resetFields(); form.setFieldsValue({ date: dayjs(), severity: 5 }); setModalOpen(true); }
  function openEdit(r: PainRecord) {
    setEditing(r);
    form.setFieldsValue({ date: dayjs(r.date), severity: r.severity, location: r.location, description: r.description, duration: r.duration, notes: r.notes });
    setModalOpen(true);
  }

  async function handleSubmit(values: Record<string, unknown>) {
    const body = { memberId: id, date: (values.date as dayjs.Dayjs).toISOString(), severity: values.severity, location: values.location || null, description: values.description || null, duration: values.duration || null, notes: values.notes || null };
    const url    = editing ? `/api/pain/${editing.id}` : "/api/pain";
    const method = editing ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { message.success(editing ? "Updated" : "Added"); setModalOpen(false); await load(); }
    else { const d = await res.json(); message.error(d.error ?? "Failed"); }
  }

  async function handleDelete(recId: string) {
    const res = await fetch(`/api/pain/${recId}`, { method: "DELETE" });
    if (res.ok) { message.success("Deleted"); await load(); }
    else message.error("Failed");
  }

  const columns = [
    { title: "Date",      dataIndex: "date",       key: "date",       render: (v: string)         => dayjs(v).format("MMM D, YYYY"), width: 120 },
    { title: "Severity",  dataIndex: "severity",   key: "severity",   render: (v: number)         => <Tag color={SEVERITY_COLOR(v)}>{v}/10</Tag>, width: 100 },
    { title: "Location",  dataIndex: "location",   key: "location",   render: (v: string | null)  => v || "—" },
    { title: "Description", dataIndex: "description", key: "description", render: (v: string | null) => v || "—" },
    { title: "Duration",  dataIndex: "duration",   key: "duration",   render: (v: string | null)  => v || "—" },
    { title: "", key: "actions", width: 80, render: (_: unknown, r: PainRecord) => (
      <div style={{ display: "flex", gap: 4 }}>
        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
        <Popconfirm title="Delete?" onConfirm={() => handleDelete(r.id)} okText="Delete" okButtonProps={{ danger: true }}>
          <Button type="text" size="small" icon={<DeleteOutlined />} danger />
        </Popconfirm>
      </div>
    )},
  ];

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 64 }}><Spin size="large" /></div>;

  return (
    <div>
      <Breadcrumb style={{ marginBottom: 12 }} items={[{ title: <Link href="/members">Members</Link> }, { title: <Link href={`/members/${id}`}>{member?.name}</Link> }, { title: "Pain Records" }]} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push(`/members/${id}`)} />
          <Title level={3} style={{ margin: 0 }}>Pain Records — {member?.name}</Title>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>Add</Button>
      </div>

      <Table dataSource={records} columns={columns} rowKey="id" pagination={{ pageSize: 20 }} scroll={{ x: 600 }} />

      <Modal title={editing ? "Edit Pain Record" : "Add Pain Record"} open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} destroyOnHidden>
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Form.Item name="date" label="Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="severity" label="Severity (1–10)" rules={[{ required: true }]}>
            <InputNumber min={1} max={10} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="location" label="Location">
            <Input placeholder="e.g. Head, Chest, Back" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input placeholder="Describe the pain" />
          </Form.Item>
          <Form.Item name="duration" label="Duration">
            <Input placeholder="e.g. 2 hours, ongoing" />
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
