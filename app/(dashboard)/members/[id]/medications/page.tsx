"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Typography, Button, Table, Modal, Form, Input, DatePicker, InputNumber, Popconfirm, message, Breadcrumb, Spin } from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { Member, MedicationRecord } from "@/types/index";
import Link from "next/link";

const { Title } = Typography;

export default function MemberMedicationsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [member,  setMember]  = useState<Member | null>(null);
  const [records, setRecords] = useState<MedicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing,   setEditing]   = useState<MedicationRecord | null>(null);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    const [mRes, rRes] = await Promise.all([fetch(`/api/members/${id}`), fetch(`/api/medications?memberId=${id}`)]);
    if (mRes.ok) setMember(await mRes.json()); else { router.push("/members"); return; }
    if (rRes.ok) setRecords(await rRes.json());
    setLoading(false);
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setEditing(null); form.resetFields(); form.setFieldsValue({ date: dayjs() }); setModalOpen(true); }
  function openEdit(r: MedicationRecord) {
    setEditing(r);
    form.setFieldsValue({
      date: dayjs(r.date),
      name: r.name,
      dosage: r.dosage,
      timesPerDay: r.timesPerDay,
      endDate: r.endDate ? dayjs(r.endDate) : null,
      frequency: r.frequency,
      reason: r.reason,
      notes: r.notes,
    });
    setModalOpen(true);
  }

  async function handleSubmit(values: Record<string, unknown>) {
    const body = {
      memberId: id,
      date: (values.date as dayjs.Dayjs).toISOString(),
      name: values.name,
      dosage: values.dosage || null,
      timesPerDay: values.timesPerDay || null,
      endDate: values.endDate ? (values.endDate as dayjs.Dayjs).toISOString() : null,
      frequency: values.frequency || null,
      reason: values.reason || null,
      notes: values.notes || null,
    };
    const url    = editing ? `/api/medications/${editing.id}` : "/api/medications";
    const method = editing ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { message.success(editing ? "Updated" : "Added"); setModalOpen(false); await load(); }
    else { const d = await res.json(); message.error(d.error ?? "Failed"); }
  }

  async function handleDelete(recId: string) {
    const res = await fetch(`/api/medications/${recId}`, { method: "DELETE" });
    if (res.ok) { message.success("Deleted"); await load(); }
    else message.error("Failed");
  }

  const columns = [
    { title: "Date",       dataIndex: "date",        key: "date",        render: (v: string) => dayjs(v).format("MMM D, YYYY"), width: 120 },
    { title: "Medicine",   dataIndex: "name",        key: "name"         },
    { title: "Dosage",     dataIndex: "dosage",      key: "dosage",      render: (v: string | null) => v || "—" },
    { title: "Times/day",  dataIndex: "timesPerDay", key: "timesPerDay", render: (v: number | null) => v ?? "—", responsive: ["md" as const] },
    { title: "End Date",   dataIndex: "endDate",     key: "endDate",     render: (v: string | null) => v ? dayjs(v).format("MMM D, YYYY") : "—", responsive: ["md" as const] },
    { title: "Frequency",  dataIndex: "frequency",   key: "frequency",   render: (v: string | null) => v || "—", responsive: ["md" as const] },
    { title: "Reason",     dataIndex: "reason",      key: "reason",      render: (v: string | null) => v || "—" },
    { title: "", key: "actions", width: 80, render: (_: unknown, r: MedicationRecord) => (
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
      <Breadcrumb style={{ marginBottom: 12 }} items={[{ title: <Link href="/members">Members</Link> }, { title: <Link href={`/members/${id}`}>{member?.name}</Link> }, { title: "Medications" }]} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push(`/members/${id}`)} />
          <Title level={3} style={{ margin: 0 }}>Medications — {member?.name}</Title>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>Add</Button>
      </div>

      <Table dataSource={records} columns={columns} rowKey="id" pagination={{ pageSize: 20 }} scroll={{ x: 600 }} />

      <Modal title={editing ? "Edit Medication" : "Add Medication"} open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} destroyOnHidden>
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Form.Item name="date" label="Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="name" label="Medicine Name" rules={[{ required: true, message: "Required" }]}>
            <Input placeholder="e.g. Paracetamol" />
          </Form.Item>
          <Form.Item name="dosage" label="Dosage">
            <Input placeholder="e.g. 500mg" />
          </Form.Item>
          <div style={{ display: "flex", gap: 12 }}>
            <Form.Item name="timesPerDay" label="Times per Day" style={{ flex: 1 }}>
              <InputNumber min={1} max={10} style={{ width: "100%" }} placeholder="e.g. 2" />
            </Form.Item>
            <Form.Item name="endDate" label="End Date" style={{ flex: 1 }}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </div>
          <Form.Item name="frequency" label="Frequency">
            <Input placeholder="e.g. Twice daily" />
          </Form.Item>
          <Form.Item name="reason" label="Reason">
            <Input placeholder="What is it for?" />
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
