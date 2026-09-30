/**
 * FieldBuilder
 * Admin UI for defining custom fields on a program or the contact form.
 * Renders a list of existing fields + an inline form to add new ones.
 */
import { useState } from "react";
import {
  Table, Button, Form, Input, Select, Switch,
  Popconfirm, Tag, Typography, Divider,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { useCreate, useDelete, useList } from "@refinedev/core";
import type { FieldType, ProgramField, ContactField } from "../types";

const { Text } = Typography;

type AnyField = ProgramField | ContactField;

interface Props {
  /** "program_fields" or "contact_fields" */
  resource: "program_fields" | "contact_fields";
  /** For program_fields: the program id. Omit for contact_fields. */
  programId?: number;
  title?: string;
}

const FIELD_TYPES: { label: string; value: FieldType }[] = [
  { label: "Short Text", value: "text" },
  { label: "Long Text / Textarea", value: "textarea" },
  { label: "Number", value: "number" },
  { label: "Date", value: "date" },
  { label: "Dropdown (Select)", value: "select" },
  { label: "File / Attachment", value: "file" },
];

const typeTag: Record<FieldType, string> = {
  text: "blue", textarea: "cyan", number: "gold",
  date: "purple", select: "orange", file: "green",
};

export const FieldBuilder = ({ resource, programId, title = "Fields" }: Props) => {
  const [form] = Form.useForm();
  const [showSelectOptions, setShowSelectOptions] = useState(false);

  const filters =
    resource === "program_fields" && programId
      ? [{ field: "program_id", operator: "eq" as const, value: programId }]
      : [];

  const { data, refetch } = useList<AnyField>({
    resource,
    filters,
    sorters: [{ field: "sort_order", order: "asc" }],
    pagination: { pageSize: 100 },
  });

  const { mutate: createField, isLoading: isCreating } = useCreate();
  const { mutate: deleteField } = useDelete();

  const fields = data?.data ?? [];

  const handleAdd = (values: {
    label: string;
    field_type: FieldType;
    required: boolean;
    options_raw?: string;
  }) => {
    const field_key = values.label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");

    const options =
      values.field_type === "select" && values.options_raw
        ? values.options_raw.split(",").map((o) => o.trim()).filter(Boolean)
        : null;

    const payload: Record<string, unknown> = {
      label: values.label,
      field_key,
      field_type: values.field_type,
      required: values.required ?? false,
      sort_order: fields.length,
      options,
    };
    if (resource === "program_fields" && programId) {
      payload.program_id = programId;
    }

    createField(
      { resource, values: payload },
      { onSuccess: () => { form.resetFields(); setShowSelectOptions(false); refetch(); } }
    );
  };

  return (
    <div>
      <Text strong>{title}</Text>
      <Divider style={{ margin: "8px 0 16px" }} />

      {/* Existing fields table */}
      <Table<AnyField>
        dataSource={fields}
        rowKey="id"
        size="small"
        pagination={false}
        style={{ marginBottom: 24 }}
        locale={{ emptyText: "No fields yet — add one below" }}
      >
        <Table.Column dataIndex="label" title="Label" />
        <Table.Column
          dataIndex="field_type"
          title="Type"
          render={(v: FieldType) => (
            <Tag color={typeTag[v]}>{v.toUpperCase()}</Tag>
          )}
        />
        <Table.Column
          dataIndex="required"
          title="Required"
          render={(v: boolean) => (v ? <Tag color="red">Yes</Tag> : <Tag>No</Tag>)}
        />
        <Table.Column
          dataIndex="options"
          title="Options"
          render={(v: string[] | null) =>
            v?.length ? v.join(", ") : <Text type="secondary">—</Text>
          }
        />
        <Table.Column
          title=""
          render={(_: unknown, record: AnyField) => (
            <Popconfirm
              title="Delete this field? Existing answers will also be deleted."
              onConfirm={() =>
                deleteField(
                  { resource, id: record.id },
                  { onSuccess: () => refetch() }
                )
              }
            >
              <Button danger icon={<DeleteOutlined />} size="small" />
            </Popconfirm>
          )}
        />
      </Table>

      {/* Add field form */}
      <Form form={form} layout="inline" onFinish={handleAdd} style={{ flexWrap: "wrap", gap: 8 }}>
        <Form.Item name="label" rules={[{ required: true, message: "Enter a label" }]}>
          <Input placeholder="Field label (e.g. Current School)" style={{ width: 220 }} />
        </Form.Item>

        <Form.Item name="field_type" initialValue="text" rules={[{ required: true }]}>
          <Select
            options={FIELD_TYPES}
            style={{ width: 180 }}
            onChange={(v) => setShowSelectOptions(v === "select")}
          />
        </Form.Item>

        {showSelectOptions && (
          <Form.Item name="options_raw">
            <Input placeholder="Options: Yes, No, Maybe (comma-separated)" style={{ width: 280 }} />
          </Form.Item>
        )}

        <Form.Item name="required" valuePropName="checked" initialValue={false}>
          <Switch checkedChildren="Required" unCheckedChildren="Optional" />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<PlusOutlined />}
            loading={isCreating}
          >
            Add Field
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};
