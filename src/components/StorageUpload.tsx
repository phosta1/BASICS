/**
 * StorageUpload
 * A controlled Ant Design Upload component backed by Supabase Storage.
 *
 * - Uploads the file to the "crm-files" bucket on selection
 * - Returns a SIGNED URL (valid 10 years) back to the parent form via onChange
 * - Displays a thumbnail for images, a file-name chip for documents
 * - Shows upload progress and error messages inline
 *
 * Usage in a Form.Item:
 *   <Form.Item name="profile_picture_url">
 *     <StorageUpload accept="image/*" folder="avatars" />
 *   </Form.Item>
 */
import { useState } from "react";
import { Upload, Button, Progress, Typography, Space, Image, Tooltip } from "antd";
import {
  UploadOutlined, CheckCircleOutlined, CloseCircleOutlined,
  FileOutlined, DeleteOutlined,
} from "@ant-design/icons";
import type { UploadFile } from "antd";
import { supabaseClient } from "../supabaseClient";

const { Text } = Typography;

interface Props {
  /** Controlled value — a Supabase Storage signed URL or path string */
  value?: string;
  /** Called by Form.Item with the signed URL after a successful upload, or "" on remove */
  onChange?: (url: string) => void;
  /** MIME accept string, e.g. "image/*" or ".pdf,.doc" */
  accept?: string;
  /** Subfolder inside the crm-files bucket, e.g. "avatars" or "certificates" */
  folder?: string;
  /** Max file size in MB (default 10) */
  maxMb?: number;
}

type UploadStatus = "idle" | "uploading" | "done" | "error";

const isImage = (url: string) =>
  /\.(png|jpe?g|gif|webp|svg|bmp)(\?|$)/i.test(url);

export const StorageUpload = ({
  value,
  onChange,
  accept = "*",
  folder = "uploads",
  maxMb = 10,
}: Props) => {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleUpload = async (file: File): Promise<boolean> => {
    if (file.size > maxMb * 1024 * 1024) {
      setError(`File must be under ${maxMb} MB`);
      setStatus("error");
      return false;
    }

    setStatus("uploading");
    setProgress(10);
    setError(null);
    setFileName(file.name);

    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    // Simulate progress while uploading
    const progressTimer = setInterval(() => {
      setProgress((p) => Math.min(p + 15, 85));
    }, 200);

    const { error: uploadError } = await supabaseClient.storage
      .from("crm-files")
      .upload(path, file, { upsert: false });

    clearInterval(progressTimer);

    if (uploadError) {
      setStatus("error");
      setError(uploadError.message);
      setProgress(0);
      return false;
    }

    // Create a signed URL valid for ~10 years
    const { data: signedData, error: signError } = await supabaseClient.storage
      .from("crm-files")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);

    if (signError || !signedData?.signedUrl) {
      setStatus("error");
      setError("Upload succeeded but could not generate a link. Try again.");
      return false;
    }

    setProgress(100);
    setStatus("done");
    onChange?.(signedData.signedUrl);
    return false; // prevent antd's default XHR upload
  };

  const handleRemove = () => {
    setStatus("idle");
    setProgress(0);
    setFileName("");
    setError(null);
    onChange?.("");
  };

  // Already has a value (existing record being edited)
  const currentUrl = value ?? "";

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      {/* Preview existing/uploaded image */}
      {currentUrl && isImage(currentUrl) && (
        <Space align="start">
          <Image
            src={currentUrl}
            width={80}
            height={80}
            style={{ objectFit: "cover", borderRadius: 8, border: "1px solid #d9d9d9" }}
            alt="preview"
          />
          <Tooltip title="Remove">
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={handleRemove}
            />
          </Tooltip>
        </Space>
      )}

      {/* Non-image file already uploaded */}
      {currentUrl && !isImage(currentUrl) && (
        <Space>
          <FileOutlined />
          <a href={currentUrl} target="_blank" rel="noreferrer">
            {fileName || "View file"}
          </a>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={handleRemove} />
        </Space>
      )}

      {/* Upload button — only show if no value yet or on error */}
      {(!currentUrl || status === "error") && (
        <Upload
          accept={accept}
          maxCount={1}
          showUploadList={false}
          beforeUpload={handleUpload}
          fileList={[] as UploadFile[]}
        >
          <Button
            icon={<UploadOutlined />}
            loading={status === "uploading"}
            disabled={status === "uploading"}
          >
            {status === "uploading" ? "Uploading…" : "Choose File"}
          </Button>
        </Upload>
      )}

      {/* Progress bar */}
      {status === "uploading" && (
        <Progress percent={progress} size="small" style={{ maxWidth: 240 }} />
      )}

      {/* Success */}
      {status === "done" && !currentUrl && (
        <Space>
          <CheckCircleOutlined style={{ color: "#52c41a" }} />
          <Text type="success">Uploaded: {fileName}</Text>
        </Space>
      )}

      {/* Error */}
      {status === "error" && (
        <Space>
          <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
          <Text type="danger">{error}</Text>
        </Space>
      )}
    </Space>
  );
};
