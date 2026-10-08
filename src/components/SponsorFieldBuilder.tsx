/**
 * SponsorFieldBuilder
 * Admin UI for defining custom fields on sponsor records.
 * Similar to FieldBuilder but for sponsor_fields table (no foreign key needed).
 */
import { useState } from "react";
import {
  Table, Button, Form, Input, Select, Switch,
  Tag, Typography, Divider, message,
} from "antd";
import { PlusOutlined, DragOutlined } from "@ant-design/icons";
import { useCreate, useDelete, useList, useUpdate } from "@refinedev/core";
import type { SponsorField, FieldType } from "../types";

const { Text } = Typography;

interface FieldFormValues {
  label: string;
  field_type: FieldType;
  required: boolean;
  options_raw?: string;
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

export const SponsorFieldBuilder = () => {
  const [form] = Form.useForm();
  const [showSelectOptions, setShowSelectOptions] = useState(false);
  const [draggedField, setDraggedField] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm] = Form.useForm();

  const { data, refetch } = useList<SponsorField>({
    resource: "sponsor_fields",
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
      required: values.required,
      sort_order: fields.length + 1,
    };

    if (options) payload.options = options;

    createField(
      { resource: "sponsor_fields", values: payload },
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
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!window.confirm("Delete this field? This will remove it from all sponsors.")) return;
    deleteField(
      { resource: "sponsor_fields", id },
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

  const handleEditStart = (field: SponsorField) => {
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
      { resource: "sponsor_fields", id, values: payload },
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

  const handleReorder = (draggedId: number, targetId: number) => {
    const draggedIndex = fields.findIndex((f) => f.id === draggedId);
    const targetIndex = fields.findIndex((f) => f.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newFields = [...fields];
    [newFields[draggedIndex], newFields[targetIndex]] = [
      newFields[targetIndex],
      newFields[draggedIndex],
    ];

    // Update sort_order for both fields
    newFields.forEach((f, idx) => {
      if (f.id === draggedId || f.id === targetId) {
        updateField(
          { resource: "sponsor_fields", id: f.id, values: { sort_order: idx + 1 } },
          {
            onSuccess: () => refetch(),
            onError: (error) => {
              message.error("Failed to reorder fields");
              console.error(error);
            },
          }
        );
      }
    });

    setDraggedField(null);
  };

  const columns = [
    {
      title: "",
      key: "drag",
      width: 40,
      render: (_: any, record: SponsorField) => (
        <DragOutlined
          style={{ cursor: "grab" }}
          onMouseDown={() => setDraggedField(record.id)}
          onMouseUp={() => draggedField && handleReorder(draggedField, record.id)}
        />
      ),
    },
    {
      title: "Label",
      dataIndex: "label",
      key: "label",
      render: (text: string, record: SponsorField) => {
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
      title: "Field Key",
      dataIndex: "field_key",
      key: "field_key",
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: "Type",
      dataIndex: "field_type",
      key: "field_type",
      render: (type: FieldType, record: SponsorField) => {
        if (editingId !== record.id) {
          return <Tag color={typeTag[type]}>{type}</Tag>;
        }
        return (
          <Form form={editForm} layout="inline">
            <Form.Item name="field_type" style={{ marginBottom: 0 }}>
              <Select
                size="small"
                options={FIELD_TYPES}
                style={{ width: 100 }}
              />
            </Form.Item>
          </Form>
        );
      },
    },
    {
      title: "Required",
      dataIndex: "required",
      key: "required",
      render: (required: boolean, record: SponsorField) => {
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
      render: (options: string[] | null, record: SponsorField) => {
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
      render: (_: any, record: SponsorField) => {
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
      <Divider orientation="left">Add New Field</Divider>

      <Form
        form={form}
        layout="inline"
        onFinish={handleAdd}
        style={{ marginBottom: 24 }}
      >
        <Form.Item
          name="label"
          rules={[{ required: true, message: "Label required" }]}
          style={{ marginBottom: 8 }}
        >
          <Input placeholder="Field label (e.g., 'Sponsorship Tier')" />
        </Form.Item>

        <Form.Item
          name="field_type"
          initialValue="text"
          style={{ marginBottom: 8 }}
        >
          <Select
            placeholder="Type"
            options={FIELD_TYPES}
            onChange={(value) => setShowSelectOptions(value === "select")}
            style={{ width: 150 }}
          />
        </Form.Item>

        {showSelectOptions && (
          <Form.Item
            name="options_raw"
            rules={[
              {
                required: showSelectOptions,
                message: "Options required (comma-separated)",
              },
            ]}
            style={{ marginBottom: 8 }}
          >
            <Input placeholder="Bronze, Silver, Gold" />
          </Form.Item>
        )}

        <Form.Item name="required" valuePropName="checked" style={{ marginBottom: 8 }}>
          <Switch checkedChildren="Required" unCheckedChildren="Optional" />
        </Form.Item>

        <Form.Item style={{ marginBottom: 8 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={isCreating}
            icon={<PlusOutlined />}
          >
            Add Field
          </Button>
        </Form.Item>
      </Form>

      <Divider orientation="left">Existing Fields</Divider>

      <Table
        dataSource={fields}
        columns={columns}
        rowKey="id"
        pagination={false}
        size="small"
      />
    </div>
  );
};
