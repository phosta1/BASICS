/**
 * DynamicField
 * Renders the correct input for a given field_type.
 * Used in both the Contact extra-fields form and Program enrollment forms.
 *
 * For "file" fields: uses StorageUpload — the signed URL is stored as the value.
 */
import { Form, Input, InputNumber, DatePicker, Select } from "antd";
import { StorageUpload } from "./StorageUpload";
import type { FieldType } from "../types";

interface FieldDef {
  id: number;
  label: string;
  field_key: string;
  field_type: FieldType;
  options?: string[] | null;
  required: boolean;
}

interface Props {
  field: FieldDef;
  /** Prefix for the Form.Item name — e.g. "fields" → name={["fields", field.field_key]} */
  namePrefix?: string;
  /** Folder in Supabase Storage for file uploads (default: "uploads") */
  uploadFolder?: string;
}

export const DynamicField = ({ field, namePrefix, uploadFolder = "uploads" }: Props) => {
  const name = namePrefix ? [namePrefix, field.field_key] : field.field_key;
  const rules = field.required
    ? [{ required: true, message: `${field.label} is required` }]
    : [];

  const isImageField = (label: string) =>
    /photo|picture|image|avatar|photo/i.test(label);

  const input = (() => {
    switch (field.field_type) {
      case "textarea":
        return <Input.TextArea rows={3} />;

      case "number":
        return <InputNumber style={{ width: "100%" }} />;

      case "date":
        return <DatePicker style={{ width: "100%" }} />;

      case "select":
        return (
          <Select
            options={(field.options ?? []).map((o) => ({ label: o, value: o }))}
            placeholder={`Select ${field.label}`}
          />
        );

      case "file":
        return (
          <StorageUpload
            folder={uploadFolder}
            accept={isImageField(field.label) ? "image/*" : ".pdf,.jpg,.jpeg,.png,.doc,.docx"}
            maxMb={20}
          />
        );

      case "text":
      default:
        return <Input />;
    }
  })();

  return (
    <Form.Item label={field.label} name={name} rules={rules}>
      {input}
    </Form.Item>
  );
};
