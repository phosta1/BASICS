import { useState } from "react";
import { useList, useCreate, useUpdate, useDelete } from "@refinedev/core";
import {
  Table, Button, Form, Input, InputNumber, DatePicker, Select, Space, Popconfirm,
  Card, Spin, message, Drawer, Divider, Typography, Empty, Row, Col,
} from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { BASICS_COLORS } from "../../brand";
import { getUserFriendlyErrorMessage } from "../../utils/errorMessages";
import type { SponsorField } from "../../types";

const { Title } = Typography;

interface SponsorFormData {
  [key: string]: any;
}

export const SponsorList = () => {
  const [form] = Form.useForm();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Fetch sponsors
  const { data: sponsorsData, isLoading: sponsorsLoading, refetch: refetchSponsors } = useList<any>({
    resource: "sponsors",
    pagination: { pageSize: 100 },
  });

  // Fetch sponsor fields (the schema)
  const { data: fieldsData, isLoading: fieldsLoading } = useList<SponsorField>({
    resource: "sponsor_fields",
    sorters: [{ field: "sort_order", order: "asc" }],
    pagination: { pageSize: 100 },
  });

  const { mutate: createSponsor, isLoading: isCreating } = useCreate();
  const { mutate: updateSponsor, isLoading: isUpdating } = useUpdate();
  const { mutate: deleteSponsor } = useDelete();

  const sponsors = sponsorsData?.data ?? [];
  const fields = fieldsData?.data ?? [];

  // Open drawer for new sponsor
  const handleNew = () => {
    form.resetFields();
    setEditingId(null);
    setDrawerOpen(true);
  };

  // Open drawer for editing
  const handleEdit = (record: any) => {
    setEditingId(record.id);
    
    // Unwrap the JSONB data and convert dates
    const formData: any = { id: record.id, ...record.data };
    fields.forEach((field) => {
      if (field.field_type === "date" && formData[field.field_key]) {
        formData[field.field_key] = dayjs(formData[field.field_key]);
      }
    });
    
    form.setFieldsValue(formData);
    setDrawerOpen(true);
  };

  // Handle form submit (create or update)
  const handleSubmit = (values: SponsorFormData) => {
    // Wrap all form fields in the 'data' JSONB object (sponsors table structure)
    const data: any = {};
    fields.forEach((field) => {
      if (values[field.field_key] !== undefined) {
        if (field.field_type === "date" && values[field.field_key]) {
          data[field.field_key] = values[field.field_key].format("YYYY-MM-DD");
        } else {
          data[field.field_key] = values[field.field_key];
        }
      }
    });

    const payload = { data };  // Wrap all fields in the data JSONB object

    if (editingId) {
      updateSponsor(
        { resource: "sponsors", id: editingId, values: payload },
        {
          onSuccess: () => {
            message.success("Sponsor updated successfully");
            setDrawerOpen(false);
            form.resetFields();
            refetchSponsors();
          },
          onError: (error) => {
            message.error(getUserFriendlyErrorMessage(error));
          },
        }
      );
    } else {
      createSponsor(
        { resource: "sponsors", values: payload },
        {
          onSuccess: () => {
            message.success("Sponsor created successfully");
            setDrawerOpen(false);
            form.resetFields();
            refetchSponsors();
          },
          onError: (error) => {
            message.error(getUserFriendlyErrorMessage(error));
          },
        }
      );
    }
  };

  // Handle delete
  const handleDelete = (id: number) => {
    deleteSponsor(
      { resource: "sponsors", id },
      {
        onSuccess: () => {
          message.success("Sponsor deleted successfully");
          refetchSponsors();
        },
        onError: (error) => {
          message.error(getUserFriendlyErrorMessage(error));
        },
      }
    );
  };

  // Build table columns dynamically from fields
  const columns = [
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Delete sponsor?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
          >
            <Button type="text" danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
    // Add columns for each field (unwrap from data JSONB)
    ...fields.map((field) => ({
      title: field.label,
      key: field.field_key,
      render: (_: any, record: any) => {
        const value = record.data?.[field.field_key];
        if (!value) return "-";
        if (field.field_type === "date") return dayjs(value).format("YYYY-MM-DD");
        if (Array.isArray(value)) return value.join(", ");
        return String(value);
      },
    })),
  ];

  if (sponsorsLoading || fieldsLoading) return <Spin />;

  return (
    <Card>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            Sponsors
          </Title>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleNew}
            style={{ background: BASICS_COLORS.primary, borderColor: BASICS_COLORS.primary }}
          >
            Add Sponsor
          </Button>
        </Col>
      </Row>

      {sponsors.length === 0 ? (
        <Empty description="No sponsors yet" />
      ) : (
        <Table
          columns={columns}
          dataSource={sponsors}
          rowKey="id"
          pagination={{ pageSize: 20 }}
          scroll={{ x: true }}
        />
      )}

      {/* Form Drawer */}
      <Drawer
        title={editingId ? "Edit Sponsor" : "New Sponsor"}
        placement="right"
        onClose={() => {
          setDrawerOpen(false);
          form.resetFields();
        }}
        open={drawerOpen}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {fields.map((field) => (
            <Form.Item
              key={field.field_key}
              name={field.field_key}
              label={field.label}
              rules={field.required ? [{ required: true, message: `${field.label} is required` }] : []}
            >
              {field.field_type === "text" && <Input />}
              {field.field_type === "textarea" && <Input.TextArea rows={4} />}
              {field.field_type === "number" && <InputNumber style={{ width: "100%" }} />}
              {field.field_type === "date" && <DatePicker style={{ width: "100%" }} />}
              {field.field_type === "select" && field.options && (
                <Select
                  mode="multiple"
                  placeholder={`Select ${field.label.toLowerCase()}`}
                  options={field.options.map((opt) => ({ label: opt, value: opt }))}
                />
              )}
              {field.field_type === "file" && <Input type="file" />}
            </Form.Item>
          ))}

          <Divider />
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={isCreating || isUpdating}
              style={{ background: BASICS_COLORS.primary, borderColor: BASICS_COLORS.primary }}
              block
            >
              {editingId ? "Update Sponsor" : "Create Sponsor"}
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
    </Card>
  );
};
