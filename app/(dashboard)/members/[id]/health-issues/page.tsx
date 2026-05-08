"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Typography, Button, Table, Modal, Form, Input, Select, DatePicker, Popconfirm, message, Breadcrumb, Spin, Tag } from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { Member, HealthIssue } from "@/types/index";
import Link from "next/link";

const { Title } = Typography;

const STATUS_OPTIONS = ["active", "resolved", "chronic"];
const SEVERITY_OPTIONS = ["mild", "moderate", "severe"];
const STATUS_COLOR: Record<string, string> = { active: "red", resolved: "green", chronic: "orange" };

export default function MemberHealthIssuesPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [member,  setMember]  = useState<Member | null>(null);
  const [records, setRecords] = useState<HealthIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing,   setEditing]   = useState<HealthIssue | null>(null);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    const [mRes, rRes] = await Promise.all([fetch(`/api/members/${id}`), fetch(`/api/health-issues?memberId=${id}`)]);
    if (mRes.ok) setMember(await mRes.json()); else { router.push("/members"); return; }
    if (rRes.ok) setRecords(await rRes.json());
    setLoading(false);
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setEditing(null); form.resetFields(); form.setFieldsValue({ status: "active" }); setModalOpen(true); }
  function openEdit(r: HealthIssue) {
    setEditing(r);
    form.setFieldsValue({
      title: r.title, description: r.description, status: r.status, severity: r.severity, notes: r.notes,
      diagnosedDate: r.diagnosedDate ? dayjs(r.diagnosedDate) : null,
      resolvedDate:  r.resolvedDate  ? dayjs(r.resolvedDate)  : null,
    });
    setModalOpen(true);
  }

  async function handleSubmit(values: Record<string, unknown>) {
    const body = {
      memberId: id,
      title: values.title,
      description: values.description || null,
      diagnosedDate: values.diagnosedDate ? (values.diagnosedDate as dayjs.Dayjs).toISOString() : null,
      resolvedDate:  values.resolvedDate  ? (values.resolvedDate  as dayjs.Dayjs).toISOString() : null,
      status: values.status,
      severity: values.severity || null,
      notes: values.notes || null,
    };
    const url    = editing ? `/api/health-issues/${editing.id}` : "/api/health-issues";
    const method = editing ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { message.success(editing ? "Updated" : "Added"); setModalOpen(false); await load(); }
    else { const d = await res.json(); message.error(d.error ?? "Failed"); }
  }

  async function handleDelete(recId: string) {
    const res = await fetch(`/api/health-issues/${recId}`, { method: "DELETE" });
    if (res.ok) { message.success("Deleted"); await load(); }
    else message.error("Failed");
  }

  const columns = [
    { title: "Title",    dataIndex: "title",  key: "title" },
    { title: "Status",   dataIndex: "status", key: "status", render: (v: string) => <Tag color={STATUS_COLOR[v] || "default"}>{v}</Tag>, width: 100 },
    { title: "Severity", dataIndex: "severity", key: "severity", render: (v: string | null) => v || "—", width: 100 },
    { title: "Diagnosed", dataIndex: "diagnosedDate", key: "diagnosedDate", render: (v: string | null) => v ? dayjs(v).format("MMM D, YYYY") : "—", width: 120 },
    { title: "Resolved",  dataIndex: "resolvedDate",  key: "resolvedDate",  render: (v: string | null) => v ? dayjs(v).format("MMM D, YYYY") : "—", width: 120 },
    { title: "", key: "actions", width: 80, render: (_: unknown, r: HealthIssue) => (
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
      <Breadcrumb style={{ marginBottom: 12 }} items={[{ title: <Link href="/members">Members</Link> }, { title: <Link href={`/members/${id}`}>{member?.name}</Link> }, { title: "Health Issues" }]} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push(`/members/${id}`)} />
          <Title level={3} style={{ margin: 0 }}>Health Issues — {member?.name}</Title>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>Add</Button>
      </div>

      <Table dataSource={records} columns={columns} rowKey="id" pagination={{ pageSize: 20 }} scroll={{ x: 600 }} />

      <Modal title={editing ? "Edit Health Issue" : "Add Health Issue"} open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} destroyOnHidden>
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Form.Item name="title" label="Title" rules={[{ required: true, message: "Required" }]}>
            <Input placeholder="e.g. Diabetes Type 2" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select>
              {STATUS_OPTIONS.map(s => <Select.Option key={s} value={s}>{s}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="severity" label="Severity">
            <Select allowClear placeholder="Select severity">
              {SEVERITY_OPTIONS.map(s => <Select.Option key={s} value={s}>{s}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="diagnosedDate" label="Diagnosed Date">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="resolvedDate" label="Resolved Date">
            <DatePicker style={{ width: "100%" }} />
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
