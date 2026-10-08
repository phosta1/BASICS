import { useParams, useNavigate } from "react-router-dom";
import { useOne, useUpdate, useList } from "@refinedev/core";
import { Card, Form, Button, Spin, message, Divider, Drawer, Typography, Space } from "antd";
import { ArrowLeftOutlined, EditOutlined } from "@ant-design/icons";
import { useState } from "react";
import dayjs from "dayjs";
import { BASICS_COLORS } from "../../brand";
import { getUserFriendlyErrorMessage } from "../../utils/errorMessages";
import { usePermissions } from "../../hooks/usePermissions";

const { Text } = Typography;

export const SponsorShow = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: sponsorData, isLoading } = useOne<any>({
    resource: "sponsors",
    id: id || "",
  });

  const { mutate: updateSponsor, isLoading: isUpdating } = useUpdate();
  const [form] = Form.useForm();
  const [editMode, setEditMode] = useState(false);
  const { role } = usePermissions();

  // Fetch field definitions
  const { data: fieldsData } = useList<any>({
    resource: "sponsor_fields",
    pagination: { pageSize: 100 },
  });

  const sponsor = sponsorData?.data;
  const fields = fieldsData?.data ?? [];

  const canEdit = role === "admin" || role === "editor";

  const handleEdit = () => {
    if (!sponsor) return;
    
    // Unwrap the JSONB data and convert dates
    const formData: any = { id: sponsor.id, ...sponsor.data };
    fields.forEach((field) => {
      if (field.field_type === "date" && formData[field.field_key]) {
        formData[field.field_key] = dayjs(formData[field.field_key]);
      }
    });
    
    form.setFieldsValue(formData);
    setEditMode(true);
  };

  const handleUpdate = (values: any) => {
    if (!id) return;
    
    // Wrap all form fields in the 'data' JSONB object
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
    
    updateSponsor(
      { resource: "sponsors", id: parseInt(id), values: { data } },
      {
        onSuccess: () => {
          message.success("Sponsor updated successfully");
          setEditMode(false);
        },
        onError: (error) => {
          message.error(getUserFriendlyErrorMessage(error));
        },
      }
    );
  };

  if (isLoading) return <Spin />;
  if (!sponsor) return <Card>Sponsor not found</Card>;

  const sponsorName = sponsor.data?.sponsor_name || "Sponsor";

  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ArrowLeftOutlined
            style={{ cursor: "pointer", color: BASICS_COLORS.primary }}
            onClick={() => navigate("/sponsors")}
          />
          {sponsorName}
        </div>
      }
      extra={
        canEdit && (
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={handleEdit}
            style={{ background: BASICS_COLORS.primary, borderColor: BASICS_COLORS.primary }}
          >
            Edit
          </Button>
        )
      }
    >
      <Drawer
        title="Edit Sponsor"
        placement="right"
        onClose={() => setEditMode(false)}
        open={editMode}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdate}
        >
          {fields.map((field) => (
            <Form.Item
              key={field.field_key}
              label={field.label}
              name={field.field_key}
              rules={field.required ? [{ required: true, message: `${field.label} is required` }] : []}
            >
              {field.field_type === "textarea" ? (
                <input type="text" />
              ) : field.field_type === "date" ? (
                <input type="date" />
              ) : field.field_type === "number" ? (
                <input type="number" />
              ) : field.field_type === "select" ? (
                <select>
                  {(field.options || []).map((opt: string) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input type="text" />
              )}
            </Form.Item>
          ))}
          <Divider />
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={isUpdating}
              style={{ background: BASICS_COLORS.primary, borderColor: BASICS_COLORS.primary }}
              block
            >
              Update Sponsor
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      {/* Display sponsor info from unwrapped data */}
      <Space direction="vertical" style={{ width: "100%" }}>
        {fields.map((field) => {
          const value = sponsor.data?.[field.field_key];
          return (
            <div key={field.field_key}>
              <Text strong style={{ display: "block", marginBottom: 4 }}>
                {field.label}
              </Text>
              <Text>
                {!value ? "-" : field.field_type === "date" ? dayjs(value).format("YYYY-MM-DD") : String(value)}
              </Text>
            </div>
          );
        })}
      </Space>
    </Card>
  );
};
