"use client";
import { useEffect, useState } from "react";
import { Card, Button, Typography, Tag, Modal, Form, Input, Select, DatePicker, Spin, Empty, Popconfirm, message, Row, Col, Badge } from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";
import type { Member } from "@/types/index";

const { Title, Text } = Typography;

const RELATIONS = ["self", "spouse", "child", "parent", "sibling", "other"];
const GENDERS   = ["male", "female", "other"];

const GENDER_TAG_COLOR: Record<string, string> = { male: "geekblue", female: "pink", other: "purple" };

const GENDER_OPTIONS   = GENDERS.map(g => ({ value: g, label: g.charAt(0).toUpperCase() + g.slice(1) }));
const RELATION_OPTIONS = RELATIONS.map(r => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }));

const GENDER_AVATAR: Record<string, string> = {
  male:   "linear-gradient(135deg, #6366f1, #4f46e5)",
  female: "linear-gradient(135deg, #f472b6, #db2777)",
  other:  "linear-gradient(135deg, #a78bfa, #7c3aed)",
};

export default function MembersPage() {
  const router = useRouter();

  const { data: session } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing,   setEditing]   = useState<Member | null>(null);
  const [form] = Form.useForm();

  async function load() {
    const res = await fetch("/api/members");
    if (res.ok) setMembers(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEdit(m: Member) {
    setEditing(m);
    form.setFieldsValue({
      name:     m.name,
      gender:   m.gender,
      relation: m.relation,
      notes:    m.notes,
      dob:      m.dob ? dayjs(m.dob) : null,
    });
    setModalOpen(true);
  }

  async function handleSubmit(values: Record<string, unknown>) {
    const body = {
      name:     values.name,
      gender:   values.gender   || null,
      relation: values.relation || null,
      notes:    values.notes    || null,
      dob:      values.dob ? (values.dob as dayjs.Dayjs).toISOString() : null,
    };
    const url    = editing ? `/api/members/${editing.id}` : "/api/members";
    const method = editing ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      message.success(editing ? "Member updated" : "Member added");
      setModalOpen(false);
      await load();
    } else {
      const d = await res.json();
      message.error(d.error ?? "Failed");
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
    if (res.ok) { message.success("Member removed"); await load(); }
    else message.error("Failed to delete");
  }

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 64 }}><Spin size="large" /></div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Family Members</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>Add Member</Button>
      </div>

      {members.length === 0 ? (
        <Empty description="No members yet">
          <Button type="primary" onClick={openAdd}>Add First Member</Button>
        </Empty>
      ) : (
        <Row gutter={[16, 16]}>
          {members.map(m => {
            const isMe = !!session?.user?.id && m.userId === session.user.id;
            const avatarBg = GENDER_AVATAR[m.gender ?? ""] ?? GENDER_AVATAR.other;
            return (
              <Col key={m.id} xs={24} sm={12} md={8} lg={6}>
                <Badge.Ribbon text="You" color="#6366f1" style={{ display: isMe ? undefined : "none" }}>
                  <Card
                    style={{ borderRadius: 12, border: isMe ? "2px solid #6366f1" : undefined }}
                    styles={{ body: { padding: "16px 20px" } }}
                    actions={[
                      <Button key="view" type="link" onClick={() => router.push(`/members/${m.id}`)}>View</Button>,
                      <Button key="edit" type="text" icon={<EditOutlined />} onClick={() => openEdit(m)} />,
                      <Popconfirm key="del" title="Remove this member?" onConfirm={() => handleDelete(m.id)} okText="Remove" okButtonProps={{ danger: true }}>
                        <Button type="text" icon={<DeleteOutlined />} danger />
                      </Popconfirm>,
                    ]}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 20,
                        background: avatarBg,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontWeight: 700, fontSize: 16, flexShrink: 0,
                      }}>
                        {m.name[0].toUpperCase()}
                      </div>
                      <div>
                        <Text strong style={{ fontSize: 15 }}>{m.name}</Text>
                        <div style={{ display: "flex", gap: 4, marginTop: 2, flexWrap: "wrap" }}>
                          {m.relation && <Tag color="blue">{m.relation}</Tag>}
                          {m.gender   && <Tag color={GENDER_TAG_COLOR[m.gender] ?? "purple"}>{m.gender}</Tag>}
                        </div>
                      </div>
                    </div>
                    {m.dob && <Text type="secondary" style={{ fontSize: 12 }}>Born: {dayjs(m.dob).format("MMM D, YYYY")}</Text>}
                    {m.notes && <Text type="secondary" style={{ display: "block", fontSize: 12, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.notes}</Text>}
                  </Card>
                </Badge.Ribbon>
              </Col>
            );
          })}
        </Row>
      )}

      <Modal
        title={editing ? "Edit Member" : "Add Member"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Name is required" }]}>
            <Input placeholder="Full name" />
          </Form.Item>
          <Form.Item name="gender" label="Gender">
            <Select placeholder="Select gender" allowClear options={GENDER_OPTIONS} />
          </Form.Item>
          <Form.Item name="relation" label="Relation">
            <Select placeholder="Select relation" allowClear options={RELATION_OPTIONS} />
          </Form.Item>
          <Form.Item name="dob" label="Date of Birth">
            <DatePicker style={{ width: "100%" }} placeholder="Select date" />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Any notes..." />
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
