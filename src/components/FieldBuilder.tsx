/**
 * FieldBuilder
 * Admin UI for defining custom fields on a program or the contact form.
 * Renders a list of existing fields + an inline form to add new ones.
 */
import { useState } from "react";
import {
  Table, Button, Form, Input, Select, Switch,
  Tag, Typography, Divider, message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useCreate, useDelete, useList, useUpdate } from "@refinedev/core";
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

interface FieldFormValues {
  label: string;
  field_type: FieldType;
  required: boolean;
  options_raw?: string;
}

export const FieldBuilder = ({ resource, programId, title = "Fields" }: Props) => {
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [showSelectOptions, setShowSelectOptions] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

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
  const { mutate: updateField } = useUpdate();

  const fields = data?.data ?? [];

  const handleAdd = (values: FieldFormValues) => {
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
    };
    if (options) payload.options = options;
    if (resource === "program_fields" && programId) {
      payload.program_id = programId;
    }

    createField(
      { resource, values: payload },
      { 
        onSuccess: () => { 
          message.success("Field added successfully");
          form.resetFields();
          setShowSelectOptions(false);
          refetch(); 
        },
        onError: (error) => {
          message.error("Failed to add field");
          console.error(error);
        }
      }
    );
  };

  const handleEditStart = (field: AnyField) => {
    setEditingId(field.id);
    editForm.setFieldsValue({
      label: field.label,
      field_type: field.field_type,
      required: field.required,
      options_raw: field.options ? field.options.join(", ") : "",
    });
  };

  const handleEditSave = (id: number, values: FieldFormValues) => {
    const options =
      values.field_type === "select" && values.options_raw
        ? values.options_raw.split(",").map((o) => o.trim()).filter(Boolean)
        : null;

    const payload: Record<string, unknown> = {
      label: values.label,
      field_type: values.field_type,
      required: values.required,
    };

    if (options) payload.options = options;

    updateField(
      { resource, id, values: payload },
      {
        onSuccess: () => {
          message.success("Field updated successfully");
          setEditingId(null);
          refetch();
        },
        onError: (error) => {
          message.error("Failed to update field");
          console.error(error);
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!window.confirm("Delete this field? Existing answers will also be deleted.")) return;
    deleteField(
      { resource, id },
      {
        onSuccess: () => {
          message.success("Field deleted successfully");
          refetch();
        },
        onError: (error) => {
          message.error("Failed to delete field");
          console.error(error);
        },
      }
    );
  };

  const columns = [
    {
      title: "Label",
      dataIndex: "label",
      key: "label",
      render: (text: string, record: AnyField) => {
        if (editingId !== record.id) return text;
        return (
          <Form form={editForm} layout="inline">
            <Form.Item name="label" style={{ marginBottom: 0 }}>
              <Input size="small" />
            </Form.Item>
          </Form>
        );
      },
    },
    {
      title: "Type",
      dataIndex: "field_type",
      key: "field_type",
      render: (type: FieldType, record: AnyField) => {
        if (editingId !== record.id) {
          return <Tag color={typeTag[type]}>{type}</Tag>;
        }
        return (
          <Form form={editForm} layout="inline">
            <Form.Item name="field_type" style={{ marginBottom: 0 }}>
              <Select size="small" options={FIELD_TYPES} style={{ width: 100 }} />
            </Form.Item>
          </Form>
        );
      },
    },
    {
      title: "Required",
      dataIndex: "required",
      key: "required",
      render: (required: boolean, record: AnyField) => {
        if (editingId !== record.id) return required ? "Yes" : "No";
        return (
          <Form form={editForm} layout="inline">
            <Form.Item name="required" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch size="small" />
            </Form.Item>
          </Form>
        );
      },
      width: 80,
    },
    {
      title: "Options",
      dataIndex: "options",
      key: "options",
      render: (options: string[] | null, record: AnyField) => {
        if (editingId !== record.id) {
          if (!options) return "-";
          return options.join(", ");
        }
        return (
          <Form form={editForm} layout="inline">
            <Form.Item name="options_raw" style={{ marginBottom: 0 }}>
              <Input size="small" placeholder="comma, separated" />
            </Form.Item>
          </Form>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      render: (_: any, record: AnyField) => {
        if (editingId !== record.id) {
          return (
            <>
              <Button
                type="primary"
                size="small"
                onClick={() => handleEditStart(record)}
                style={{ marginRight: 8 }}
              >
                Edit
              </Button>
              <Button
                type="primary"
                danger
                size="small"
                onClick={() => handleDelete(record.id)}
              >
                Delete
              </Button>
            </>
          );
        }
        return (
          <>
            <Button
              type="primary"
              size="small"
              onClick={() => {
                editForm.validateFields().then((values) => {
                  handleEditSave(record.id, values);
                });
              }}
              style={{ marginRight: 8 }}
            >
              Save
            </Button>
            <Button
              size="small"
              onClick={() => setEditingId(null)}
            >
              Cancel
            </Button>
          </>
        );
      },
    },
  ];

  return (
    <div>
      <Text strong>{title}</Text>
      <Divider style={{ margin: "8px 0 16px" }} />

      {/* Existing fields table */}
      <Table<AnyField>
        dataSource={fields}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={false}
        style={{ marginBottom: 24 }}
        locale={{ emptyText: "No fields yet — add one below" }}
      />

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
