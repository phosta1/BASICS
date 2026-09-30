import { useNavigate, useParams } from "react-router-dom";
import { useCreate, useUpdate, useOne, useList } from "@refinedev/core";
import { Form, Input, Select, Avatar, Space, Typography, Divider, Button, Card } from "antd";
import { UserOutlined, SaveOutlined } from "@ant-design/icons";
import { StorageUpload } from "../../components/StorageUpload";
import { DynamicField } from "../../components/DynamicField";
import type { Contact, ContactField, ContactFieldValue } from "../../types";
import { useState } from "react";

const { Text, Title } = Typography;

// ── Create ────────────────────────────────────────────────────────────────────
export const ContactCreate = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isSaving, setIsSaving] = useState(false);

  // Load admin-defined extra fields
  const { data: fieldsData } = useList<ContactField>({
    resource: "contact_fields",
    sorters: [{ field: "sort_order", order: "asc" }],
    pagination: { pageSize: 100 },
  });
  const extraFields = fieldsData?.data ?? [];

  const { mutate: createContact } = useCreate<Contact>();
  const { mutate: createValue } = useCreate<ContactFieldValue>();

  const profilePicUrl: string = Form.useWatch("profile_picture_url", form) ?? "";

  const handleSave = (values: Record<string, unknown>) => {
    setIsSaving(true);
    const { extra, profile_picture_url, ...baseFields } = values as any;

    createContact(
      {
        resource: "contacts",
        values: { ...baseFields, profile_picture_url: profile_picture_url ?? null },
      },
      {
        onSuccess: (data) => {
          const contactId = data.data.id;
          // Save each extra field value (including file URLs)
          const saves = extraFields.map((f) => {
            const val = extra?.[f.field_key];
            if (val === undefined || val === null || val === "") return Promise.resolve();
            return new Promise<void>((resolve) =>
              createValue(
                {
                  resource: "contact_field_values",
                  values: { contact_id: contactId, field_id: f.id, value: String(val) },
                },
                { onSuccess: () => resolve(), onError: () => resolve() }
              )
            );
          });
          Promise.all(saves).then(() => {
            setIsSaving(false);
            navigate(`/contacts/show/${contactId}`);
          });
        },
        onError: () => setIsSaving(false),
      }
    );
  };

  return (
    <Card title={<Title level={4} style={{ margin: 0 }}>Create Contact</Title>}>
      <Form form={form} layout="vertical" onFinish={handleSave}>
        <ContactBaseFields form={form} profilePicUrl={profilePicUrl} />

        {extraFields.length > 0 && (
          <>
            <Divider>Additional Information</Divider>
            {extraFields.map((f) => (
              <DynamicField key={f.id} field={f} namePrefix="extra" uploadFolder="contact-files" />
            ))}
          </>
        )}

        <Divider />
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={isSaving}>
          Save Contact
        </Button>
      </Form>
    </Card>
  );
};

// ── Edit ──────────────────────────────────────────────────────────────────────
export const ContactEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isSaving, setIsSaving] = useState(false);

  // Load existing contact
  useOne<Contact>({
    resource: "contacts",
    id: id!,
    queryOptions: {
      onSuccess: (data) => {
        // Populate base fields
        form.setFieldsValue(data.data);
      },
    },
  });

  // Load admin-defined extra fields
  const { data: fieldsData } = useList<ContactField>({
    resource: "contact_fields",
    sorters: [{ field: "sort_order", order: "asc" }],
    pagination: { pageSize: 100 },
  });
  const extraFields = fieldsData?.data ?? [];

  // Load existing extra field values for this contact
  const { data: valuesData } = useList<ContactFieldValue>({
    resource: "contact_field_values",
    filters: [{ field: "contact_id", operator: "eq", value: id }],
    pagination: { pageSize: 100 },
    queryOptions: {
      enabled: !!id,
      onSuccess: (data) => {
        // Build field_key → value map and pre-fill form
        const existing: Record<string, string> = {};
        data.data.forEach((v) => {
          const field = extraFields.find((f) => f.id === v.field_id);
          if (field) existing[field.field_key] = v.value;
        });
        form.setFieldValue("extra", existing);
      },
    },
  });

  const existingValues = valuesData?.data ?? [];

  const { mutate: updateContact } = useUpdate<Contact>();
  const { mutate: createValue } = useCreate<ContactFieldValue>();
  const { mutate: updateValue } = useUpdate<ContactFieldValue>();

  const profilePicUrl: string = Form.useWatch("profile_picture_url", form) ?? "";

  const handleSave = (values: Record<string, unknown>) => {
    setIsSaving(true);
    const { extra, profile_picture_url, ...baseFields } = values as any;

    updateContact(
      {
        resource: "contacts",
        id: id!,
        values: { ...baseFields, profile_picture_url: profile_picture_url ?? null },
      },
      {
        onSuccess: () => {
          // Upsert each extra field value
          const saves = extraFields.map((f) => {
            const val = extra?.[f.field_key];
            const existing = existingValues.find((v) => v.field_id === f.id);

            if (val === undefined || val === null || val === "") return Promise.resolve();

            if (existing) {
              return new Promise<void>((resolve) =>
                updateValue(
                  {
                    resource: "contact_field_values",
                    id: existing.id,
                    values: { value: String(val) },
                  },
                  { onSuccess: () => resolve(), onError: () => resolve() }
                )
              );
            } else {
              return new Promise<void>((resolve) =>
                createValue(
                  {
                    resource: "contact_field_values",
                    values: { contact_id: Number(id), field_id: f.id, value: String(val) },
                  },
                  { onSuccess: () => resolve(), onError: () => resolve() }
                )
              );
            }
          });

          Promise.all(saves).then(() => {
            setIsSaving(false);
            navigate(`/contacts/show/${id}`);
          });
        },
        onError: () => setIsSaving(false),
      }
    );
  };

  return (
    <Card title={<Title level={4} style={{ margin: 0 }}>Edit Contact</Title>}>
      <Form form={form} layout="vertical" onFinish={handleSave}>
        <ContactBaseFields form={form} profilePicUrl={profilePicUrl} />

        {extraFields.length > 0 && (
          <>
            <Divider>Additional Information</Divider>
            {extraFields.map((f) => (
              <DynamicField key={f.id} field={f} namePrefix="extra" uploadFolder="contact-files" />
            ))}
          </>
        )}

        <Divider />
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={isSaving}>
          Save Contact
        </Button>
      </Form>
    </Card>
  );
};

// ── Shared base field section ─────────────────────────────────────────────────
const ContactBaseFields = ({
  profilePicUrl,
}: {
  form: ReturnType<typeof Form.useForm>[0];
  profilePicUrl: string;
}) => (
  <>
    <Form.Item label="Profile Picture" style={{ marginBottom: 8 }}>
      <Space align="start" size={16}>
        <Avatar
          size={72}
          src={profilePicUrl || undefined}
          icon={<UserOutlined />}
          style={{ flexShrink: 0, border: "2px solid #d9d9d9" }}
        />
        <div>
          <Form.Item name="profile_picture_url" noStyle>
            <StorageUpload accept="image/*" folder="avatars" maxMb={5} />
          </Form.Item>
          <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 4 }}>
            JPG, PNG or WebP · max 5 MB
          </Text>
        </div>
      </Space>
    </Form.Item>

    <Divider style={{ margin: "12px 0 20px" }} />

    <Form.Item label="First Name" name="first_name" rules={[{ required: true }]}>
      <Input />
    </Form.Item>
    <Form.Item label="Last Name" name="last_name" rules={[{ required: true }]}>
      <Input />
    </Form.Item>
    <Form.Item
      label="Email"
      name="email"
      rules={[{ required: true }, { type: "email", message: "Enter a valid email" }]}
    >
      <Input />
    </Form.Item>
    <Form.Item label="Phone" name="phone">
      <Input />
    </Form.Item>
    <Form.Item label="Company" name="company">
      <Input />
    </Form.Item>
    <Form.Item label="Status" name="status" initialValue="lead" rules={[{ required: true }]}>
      <Select
        options={[
          { label: "Lead", value: "lead" },
          { label: "Active", value: "active" },
          { label: "Inactive", value: "inactive" },
        ]}
      />
    </Form.Item>
  </>
);
