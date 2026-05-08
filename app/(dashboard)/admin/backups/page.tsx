"use client";
import { useEffect, useState, useCallback } from "react";
import { Typography, Button, Table, Popconfirm, message, Spin, Empty, Tag, Space, Modal } from "antd";
import { ReloadOutlined, DownloadOutlined, DeleteOutlined, HistoryOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface BackupMeta {
  name:      string;
  size:      number;
  createdAt: number;
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

export default function BackupsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [backups,   setBackups]   = useState<BackupMeta[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [creating,  setCreating]  = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/backup");
    if (res.ok) setBackups(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/backup", { method: "POST" });
      if (res.ok) { message.success("Backup created"); await load(); }
      else { const d = await res.json(); message.error(d.error ?? "Failed"); }
    } finally {
      setCreating(false);
    }
  }

  function handleDownload(name: string) {
    const a = document.createElement("a");
    a.href = `/api/admin/backup/${encodeURIComponent(name)}`;
    a.download = name;
    a.click();
  }

  function confirmRestore(name: string) {
    Modal.confirm({
      title:   "Restore from this backup?",
      icon:    <ExclamationCircleOutlined style={{ color: "#f59e0b" }} />,
      content: (
        <div>
          <p>This will <strong>replace all current data</strong> with the backup from:</p>
          <p style={{ fontFamily: "monospace", fontSize: 12 }}>{name}</p>
          <p style={{ color: "#ef4444" }}>You will be logged out after restore.</p>
        </div>
      ),
      okText:       "Restore",
      okButtonProps: { danger: true },
      cancelText:   "Cancel",
      onOk:         () => doRestore(name),
    });
  }

  async function doRestore(name: string) {
    setRestoring(name);
    try {
      const res = await fetch(`/api/admin/backup/${encodeURIComponent(name)}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "restore" }),
      });
      if (res.ok) {
        message.success("Restore complete — please log in again");
        setTimeout(() => { globalThis.location.href = "/login"; }, 1500);
      } else {
        const d = await res.json();
        message.error(d.error ?? "Restore failed");
      }
    } finally {
      setRestoring(null);
    }
  }

  async function handleDelete(name: string) {
    const res = await fetch(`/api/admin/backup/${encodeURIComponent(name)}`, { method: "DELETE" });
    if (res.ok) { message.success("Deleted"); await load(); }
    else message.error("Failed to delete");
  }

  const columns = [
    {
      title: "Backup",
      dataIndex: "name",
      key: "name",
      render: (v: string) => (
        <Text style={{ fontFamily: "monospace", fontSize: 12 }}>{v}</Text>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v: number) => dayjs(v).format("MMM D, YYYY HH:mm"),
      width: 180,
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      render: (v: number) => <Tag>{fmtSize(v)}</Tag>,
      width: 90,
    },
    {
      title: "",
      key: "actions",
      width: 160,
      render: (_: unknown, r: BackupMeta) => (
        <Space>
          <Button size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(r.name)}>
            Download
          </Button>
          {isAdmin && (
            <>
              <Button
                size="small"
                icon={<HistoryOutlined />}
                onClick={() => confirmRestore(r.name)}
                loading={restoring === r.name}
              >
                Restore
              </Button>
              <Popconfirm title="Delete this backup?" onConfirm={() => handleDelete(r.name)} okText="Delete" okButtonProps={{ danger: true }}>
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Backups</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Daily backups run automatically. Last 5 are kept.</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={load}>Refresh</Button>
          {isAdmin && (
            <Button type="primary" icon={<HistoryOutlined />} onClick={handleCreate} loading={creating}>
              Backup Now
            </Button>
          )}
        </Space>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 64 }}><Spin size="large" /></div>
      ) : backups.length === 0 ? (
        <Empty description="No backups yet. The first backup runs 30 seconds after startup." style={{ padding: "48px 0" }} />
      ) : (
        <Table dataSource={backups} columns={columns} rowKey="name" pagination={false} scroll={{ x: 600 }} />
      )}
    </div>
  );
}
