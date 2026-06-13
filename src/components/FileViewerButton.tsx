"use client";
import { useState } from "react";
import { Modal, Button, Image } from "antd";
import { FileOutlined, FilePdfOutlined, EyeOutlined } from "@ant-design/icons";

interface Props {
  readonly fileUrl: string;
  readonly fileName: string;
  readonly size?: "small" | "middle";
}

function isPdf(fileName: string) {
  return fileName.toLowerCase().endsWith(".pdf");
}
function isImage(fileName: string) {
  return /\.(jpe?g|png|webp)$/i.test(fileName);
}

export default function FileViewerButton({ fileUrl, fileName, size = "small" }: Props) {
  const [open, setOpen] = useState(false);
  const url = `/api/files/${fileUrl}`;
  const pdf = isPdf(fileName);
  const img = isImage(fileName);

  if (!pdf && !img) {
    return (
      <a href={url} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12 }}>
        <FileOutlined /> {fileName}
      </a>
    );
  }

  return (
    <>
      <Button
        type="link"
        size={size}
        icon={pdf ? <FilePdfOutlined /> : <EyeOutlined />}
        onClick={e => { e.stopPropagation(); setOpen(true); }}
        style={{ padding: 0, height: "auto", fontSize: 12 }}
      >
        {fileName}
      </Button>

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={
          <a href={url} target="_blank" rel="noreferrer">
            <Button size="small">Open in new tab</Button>
          </a>
        }
        title={fileName}
        width={img ? 640 : 860}
        styles={{ body: { padding: img ? 8 : 0, maxHeight: "80vh", overflow: "auto" } }}
        destroyOnHidden
      >
        {img && (
          <Image
            src={url}
            alt={fileName}
            style={{ width: "100%", borderRadius: 4 }}
            preview={false}
          />
        )}
        {pdf && (
          <iframe
            src={url}
            title={fileName}
            style={{ width: "100%", height: "75vh", border: "none", display: "block" }}
          />
        )}
      </Modal>
    </>
  );
}
