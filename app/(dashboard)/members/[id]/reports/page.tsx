"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Typography, Button, Table, Modal, Form, Input, Select, DatePicker, Popconfirm, message, Breadcrumb, Spin, Tag, Upload } from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined, ArrowLeftOutlined, UploadOutlined, FileOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { Member, Report } from "@/types/index";
import Link from "next/link";
import FileViewerButton from "@/components/FileViewerButton";

const { Title, Text } = Typography;

const REPORT_TYPES = ["lab", "scan", "prescription", "doctor_note", "other"];
const TYPE_COLOR: Record<string, string> = { lab: "blue", scan: "purple", prescription: "green", doctor_note: "cyan", other: "default" };

export default function MemberReportsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [member,      setMember]      = useState<Member | null>(null);
  const [records,     setRecords]     = useState<Report[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editing,     setEditing]     = useState<Report | null>(null);
  const [uploading,   setUploading]   = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ fileUrl: string; fileName: string; fileSize: number } | null>(null);
  const [form] = Form.useForm();
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const [mRes, rRes] = await Promise.all([fetch(`/api/members/${id}`), fetch(`/api/reports?memberId=${id}`)]);
    if (mRes.ok) setMember(await mRes.json()); else { router.push("/members"); return; }
    if (rRes.ok) setRecords(await rRes.json());
    setLoading(false);
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null);
    setUploadedFile(null);
    form.resetFields();
    form.setFieldsValue({ date: dayjs(), type: "lab" });
    setModalOpen(true);
  }
  function openEdit(r: Report) {
    setEditing(r);
    setUploadedFile(r.fileUrl ? { fileUrl: r.fileUrl, fileName: r.fileName ?? r.fileUrl, fileSize: r.fileSize ?? 0 } : null);
    form.setFieldsValue({ date: dayjs(r.date), title: r.title, type: r.type, notes: r.notes });
    setModalOpen(true);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("memberId", id);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        setUploadedFile(data);
        message.success("File uploaded");
      } else {
        const d = await res.json();
        message.error(d.error ?? "Upload failed");
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(values: Record<string, unknown>) {
    const body = {
      memberId: id,
      date:     (values.date as dayjs.Dayjs).toISOString(),
      title:    values.title,
      type:     values.type,
      notes:    values.notes || null,
      fileUrl:  uploadedFile?.fileUrl  ?? null,
      fileName: uploadedFile?.fileName ?? null,
      fileSize: uploadedFile?.fileSize ?? null,
    };
    const url    = editing ? `/api/reports/${editing.id}` : "/api/reports";
    const method = editing ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { message.success(editing ? "Updated" : "Added"); setModalOpen(false); await load(); }
    else { const d = await res.json(); message.error(d.error ?? "Failed"); }
  }

  async function handleDelete(recId: string) {
    const res = await fetch(`/api/reports/${recId}`, { method: "DELETE" });
    if (res.ok) { message.success("Deleted"); await load(); }
    else message.error("Failed");
  }

  const columns = [
    { title: "Date",  dataIndex: "date",  key: "date",  render: (v: string) => dayjs(v).format("MMM D, YYYY"), width: 120 },
    { title: "Title", dataIndex: "title", key: "title"  },
    { title: "Type",  dataIndex: "type",  key: "type",  render: (v: string) => <Tag color={TYPE_COLOR[v] || "default"}>{v}</Tag>, width: 120 },
    { title: "File",  dataIndex: "fileName", key: "file", render: (v: string | null, r: Report) => v && r.fileUrl ? (
      <FileViewerButton fileUrl={r.fileUrl} fileName={v} />
    ) : "—" },
    { title: "", key: "actions", width: 80, render: (_: unknown, r: Report) => (
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
      <Breadcrumb style={{ marginBottom: 12 }} items={[{ title: <Link href="/members">Members</Link> }, { title: <Link href={`/members/${id}`}>{member?.name}</Link> }, { title: "Reports" }]} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push(`/members/${id}`)} />
          <Title level={3} style={{ margin: 0 }}>Reports — {member?.name}</Title>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>Add</Button>
      </div>

      <Table dataSource={records} columns={columns} rowKey="id" pagination={{ pageSize: 20 }} scroll={{ x: 600 }} />

      <Modal title={editing ? "Edit Report" : "Add Report"} open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} destroyOnHidden>
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Form.Item name="date" label="Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="title" label="Title" rules={[{ required: true, message: "Required" }]}>
            <Input placeholder="e.g. Blood test results" />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select>
              {REPORT_TYPES.map(t => <Select.Option key={t} value={t}>{t.replace("_", " ")}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="File (optional)">
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display: "none" }} onChange={handleFileChange} />
            <Button icon={<UploadOutlined />} onClick={() => fileRef.current?.click()} loading={uploading}>
              {uploadedFile ? "Replace File" : "Upload File"}
            </Button>
            {uploadedFile && (
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <FileOutlined />
                <Text style={{ fontSize: 12 }}>{uploadedFile.fileName}</Text>
                <Button type="text" size="small" danger onClick={() => setUploadedFile(null)}>Remove</Button>
              </div>
            )}
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
