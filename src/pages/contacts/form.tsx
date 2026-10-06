import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCreate, useUpdate, useOne, useList } from "@refinedev/core";
import {
  Form, Input, Select, Avatar, Space, Typography, Divider,
  Button, Card, Row, Col, DatePicker, Switch, Alert,
  Radio,
} from "antd";
import {
  UserOutlined, SaveOutlined, TeamOutlined, IdcardOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { StorageUpload } from "../../components/StorageUpload";
import { DynamicField } from "../../components/DynamicField";
import { supabaseClient } from "../../supabaseClient";
import { BASICS_COLORS } from "../../brand";
import type { Contact, ContactField, ContactFieldValue, StaffProfile } from "../../types";

const { Text, Title } = Typography;

// ─────────────────────────────────────────────────────────────────────────────
// Shared: save contact relations (many-to-many via contact_relations table)
// ─────────────────────────────────────────────────────────────────────────────
async function saveContactRelations(contactId: number, relatedIds: number[]) {
  // Delete existing relations for this contact (both directions)
  await supabaseClient
    .from("contact_relations")
    .delete()
    .eq("contact_id", contactId);

  if (relatedIds.length === 0) return;

  await supabaseClient
    .from("contact_relations")
    .insert(relatedIds.map((rid) => ({ contact_id: contactId, related_id: rid })));
}

async function loadContactRelations(contactId: number): Promise<number[]> {
  const { data } = await supabaseClient
    .from("contact_relations")
    .select("related_id")
    .eq("contact_id", contactId);
  return (data ?? []).map((r: any) => r.related_id);
}
async function saveExtraFields(
  contactId: number,
  extraFieldDefs: ContactField[],
  extraValues: Record<string, unknown>,
  existingValues: ContactFieldValue[]
) {
  for (const f of extraFieldDefs) {
    const val = extraValues?.[f.field_key];
    if (val === undefined || val === null || val === "") continue;
    const existing = existingValues.find((v) => v.field_id === f.id);
    if (existing) {
      await supabaseClient
        .from("contact_field_values")
        .update({ value: String(val) })
        .eq("id", existing.id);
    } else {
      await supabaseClient
        .from("contact_field_values")
        .insert({ contact_id: contactId, field_id: f.id, value: String(val) });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared: save staff profile
// ─────────────────────────────────────────────────────────────────────────────
async function saveStaffProfile(contactId: number, staffValues: Record<string, unknown>) {
  const payload: Record<string, unknown> = { contact_id: contactId };

  // Convert date fields
  if (staffValues.start_date) payload.start_date = dayjs(staffValues.start_date as any).format("YYYY-MM-DD");
  if (staffValues.end_date) payload.end_date = dayjs(staffValues.end_date as any).format("YYYY-MM-DD");

  const scalarFields = [
    "ssnit_number", "national_id_number", "national_id_photo_url",
    "stanbic_account_number", "certification_url", "marital_status",
    "employment_status", "emergency_contact",
    "arrested_before", "dismissed_for_stealing", "accused_of_abuse",
  ];
  for (const k of scalarFields) {
    if (staffValues[k] !== undefined) payload[k] = staffValues[k];
  }

  await supabaseClient
    .from("staff_profiles")
    .upsert(payload, { onConflict: "contact_id" });
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────────────────────
export const ContactCreate = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isSaving, setIsSaving] = useState(false);
  const [isStaff, setIsStaff] = useState(false);

  const { data: fieldsData } = useList<ContactField>({
    resource: "contact_fields",
    sorters: [{ field: "sort_order", order: "asc" }],
    pagination: { pageSize: 100 },
  });
  const extraFields = fieldsData?.data ?? [];
  const { mutate: createContact } = useCreate<Contact>();
  const profilePicUrl: string = Form.useWatch("profile_picture_url", form) ?? "";

  const handleSave = async (values: Record<string, unknown>) => {
    setIsSaving(true);
    const { extra, staff, profile_picture_url, date_of_birth, related_ids, ...baseFields } = values as any;

    const contactPayload = {
      ...baseFields,
      profile_picture_url: profile_picture_url ?? null,
      date_of_birth: date_of_birth ? dayjs(date_of_birth).format("YYYY-MM-DD") : null,
      is_staff: isStaff,
    };

    createContact(
      { resource: "contacts", values: contactPayload },
      {
        onSuccess: async (data) => {
          const contactId = data.data.id;
          await saveExtraFields(contactId, extraFields, extra ?? {}, []);
          if (isStaff && staff) await saveStaffProfile(contactId, staff);
          if (related_ids?.length) await saveContactRelations(contactId, related_ids);
          setIsSaving(false);
          navigate(`/contacts/show/${contactId}`);
        },
        onError: () => setIsSaving(false),
      }
    );
  };

  return (
    <Card title={<Title level={4} style={{ margin: 0 }}>New Contact</Title>}>
      <Form form={form} layout="vertical" onFinish={handleSave}>
        <PersonalInfoSection form={form} profilePicUrl={profilePicUrl} />

        {/* Cross-reference */}
        <CrossReferenceSection />

        {/* Staff toggle */}
        <StaffToggle isStaff={isStaff} onChange={setIsStaff} />
        {isStaff && <StaffSection />}

        {/* Admin-defined extra fields */}
        {extraFields.length > 0 && (
          <>
            <Divider orientation="left">Additional Fields</Divider>
            {extraFields.map((f) => (
              <DynamicField key={f.id} field={f} namePrefix="extra" uploadFolder="contact-files" />
            ))}
          </>
        )}

        <Divider />
        <Button
          type="primary"
          htmlType="submit"
          icon={<SaveOutlined />}
          loading={isSaving}
          style={{ background: BASICS_COLORS.secondary, borderColor: BASICS_COLORS.secondary }}
        >
          Save Contact
        </Button>
      </Form>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// EDIT — with pre-fill bug fix
// ─────────────────────────────────────────────────────────────────────────────
export const ContactEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isSaving, setIsSaving] = useState(false);
  const [isStaff, setIsStaff] = useState(false);

  // Load existing contact
  const { data: contactData } = useOne<Contact>({ resource: "contacts", id: id! });

  // Load admin-defined extra fields
  const { data: fieldsData } = useList<ContactField>({
    resource: "contact_fields",
    sorters: [{ field: "sort_order", order: "asc" }],
    pagination: { pageSize: 100 },
  });
  const extraFields = fieldsData?.data ?? [];

  // Load existing extra field values
  const { data: valuesData } = useList<ContactFieldValue>({
    resource: "contact_field_values",
    filters: [{ field: "contact_id", operator: "eq", value: id }],
    pagination: { pageSize: 100 },
    queryOptions: { enabled: !!id },
  });
  const existingValues = valuesData?.data ?? [];

  // Load existing staff profile
  const { data: staffData } = useList<StaffProfile>({
    resource: "staff_profiles",
    filters: [{ field: "contact_id", operator: "eq", value: id }],
    pagination: { pageSize: 1 },
    queryOptions: { enabled: !!id },
  });

  // ── FIX: pre-fill only after BOTH contact AND extraFields are loaded ─────
  useEffect(() => {
    if (!contactData?.data) return;
    const c = contactData.data;

    // Base fields
    form.setFieldsValue({
      first_name: c.first_name,
      last_name: c.last_name,
      other_names: c.other_names,
      gender: c.gender,
      date_of_birth: c.date_of_birth ? dayjs(c.date_of_birth) : undefined,
      place_of_birth: c.place_of_birth,
      email: c.email,
      phone: c.phone,
      address: c.address,
      status: c.status,
      profile_picture_url: c.profile_picture_url,
    });

    setIsStaff(!!c.is_staff);

    // Load existing relations
    loadContactRelations(Number(id)).then((ids) => {
      form.setFieldValue("related_ids", ids);
    });
  }, [contactData?.data]);

  // ── FIX: pre-fill extra fields only after BOTH lists are ready ───────────
  useEffect(() => {
    if (extraFields.length === 0 || existingValues.length === 0) return;

    const existing: Record<string, string> = {};
    for (const v of existingValues) {
      const field = extraFields.find((f) => f.id === v.field_id);
      if (field) existing[field.field_key] = v.value;
    }
    form.setFieldValue("extra", existing);
  }, [extraFields.length, existingValues.length]);

  // Pre-fill staff section
  useEffect(() => {
    const sp = staffData?.data?.[0];
    if (!sp) return;
    form.setFieldsValue({
      staff: {
        ...sp,
        start_date: sp.start_date ? dayjs(sp.start_date) : undefined,
        end_date: sp.end_date ? dayjs(sp.end_date) : undefined,
      },
    });
  }, [staffData?.data]);

  const { mutate: updateContact } = useUpdate<Contact>();

  const profilePicUrl: string = Form.useWatch("profile_picture_url", form) ?? "";

  const handleSave = async (values: Record<string, unknown>) => {
    setIsSaving(true);
    const { extra, staff, profile_picture_url, date_of_birth, related_ids, ...baseFields } = values as any;

    const contactPayload = {
      ...baseFields,
      profile_picture_url: profile_picture_url ?? null,
      date_of_birth: date_of_birth ? dayjs(date_of_birth).format("YYYY-MM-DD") : null,
      is_staff: isStaff,
    };

    updateContact(
      { resource: "contacts", id: id!, values: contactPayload },
      {
        onSuccess: async () => {
          await saveExtraFields(Number(id), extraFields, extra ?? {}, existingValues);
          if (isStaff && staff) await saveStaffProfile(Number(id), staff);
          await saveContactRelations(Number(id), related_ids ?? []);
          setIsSaving(false);
          navigate(`/contacts/show/${id}`);
        },
        onError: () => setIsSaving(false),
      }
    );
  };

  return (
    <Card title={<Title level={4} style={{ margin: 0 }}>Edit Contact</Title>}>
      <Form form={form} layout="vertical" onFinish={handleSave}>
        <PersonalInfoSection form={form} profilePicUrl={profilePicUrl} />
        <CrossReferenceSection excludeId={Number(id)} />
        <StaffToggle isStaff={isStaff} onChange={setIsStaff} />
        {isStaff && <StaffSection />}

        {extraFields.length > 0 && (
          <>
            <Divider orientation="left">Additional Fields</Divider>
            {extraFields.map((f) => (
              <DynamicField key={f.id} field={f} namePrefix="extra" uploadFolder="contact-files" />
            ))}
          </>
        )}

        <Divider />
        <Button
          type="primary"
          htmlType="submit"
          icon={<SaveOutlined />}
          loading={isSaving}
          style={{ background: BASICS_COLORS.secondary, borderColor: BASICS_COLORS.secondary }}
        >
          Save Contact
        </Button>
      </Form>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Section: Personal Information
// ─────────────────────────────────────────────────────────────────────────────
const PersonalInfoSection = ({
  profilePicUrl,
}: {
  form?: ReturnType<typeof Form.useForm>[0];
  profilePicUrl: string;
}) => (
  <>
    {/* Profile picture */}
    <Form.Item label="Profile Picture" style={{ marginBottom: 8 }}>
      <Space align="start" size={16}>
        <Avatar
          size={72}
          src={profilePicUrl || undefined}
          icon={<UserOutlined />}
          style={{ flexShrink: 0, border: `2px solid ${BASICS_COLORS.borderColor}` }}
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

    <Divider orientation="left" style={{ marginBottom: 20 }}>Personal Information</Divider>

    <Row gutter={16}>
      <Col xs={24} sm={8}>
        <Form.Item label="Given Name" name="first_name" rules={[{ required: true, message: "Given name is required" }]}>
          <Input />
        </Form.Item>
      </Col>
      <Col xs={24} sm={8}>
        <Form.Item label="Family Name" name="last_name" rules={[{ required: true, message: "Family name is required" }]}>
          <Input />
        </Form.Item>
      </Col>
      <Col xs={24} sm={8}>
        <Form.Item label="Other Name(s)" name="other_names">
          <Input />
        </Form.Item>
      </Col>
    </Row>

    <Row gutter={16}>
      <Col xs={24} sm={8}>
        <Form.Item label="Gender" name="gender" rules={[{ required: true, message: "Please select a gender" }]}>
          <Radio.Group>
            <Radio value="male">Male</Radio>
            <Radio value="female">Female</Radio>
          </Radio.Group>
        </Form.Item>
      </Col>
      <Col xs={24} sm={8}>
        <Form.Item label="Date of Birth" name="date_of_birth" rules={[{ required: true, message: "Date of birth is required" }]}>
          <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={8}>
        <Form.Item label="Place of Birth" name="place_of_birth" rules={[{ required: true, message: "Place of birth is required" }]}>
          <Input />
        </Form.Item>
      </Col>
    </Row>

    <Row gutter={16}>
      <Col xs={24} sm={12}>
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Email is required" },
            { type: "email", message: "Enter a valid email" },
          ]}
        >
          <Input />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item label="Phone Number" name="phone" rules={[{ required: true, message: "Phone number is required" }]}>
          <Input />
        </Form.Item>
      </Col>
    </Row>

    <Form.Item label="Address" name="address" rules={[{ required: true, message: "Address is required" }]}>
      <Input.TextArea rows={2} />
    </Form.Item>

    <Form.Item label="Status" name="status" initialValue="active" rules={[{ required: true }]}>
      <Select
        options={[
          { label: "Active",     value: "active"     },
          { label: "Dropped Off",   value: "dropped off"   },
          { label: "Completed", value: "completed" },
          { label: "Not Lead", value: "not lead" },
        ]}
      />
    </Form.Item>
  </>
);

// ─────────────────────────────────────────────────────────────────────────────
// Section: Cross Reference
// ─────────────────────────────────────────────────────────────────────────────
const CrossReferenceSection = ({ excludeId }: { excludeId?: number }) => {
  const { data } = useList<Contact>({
    resource: "contacts",
    pagination: { pageSize: 500 },
  });
  const contacts = (data?.data ?? []).filter((c) => c.id !== excludeId);

  return (
    <>
      <Divider orientation="left">
        <Space><TeamOutlined />Cross-Reference</Space>
      </Divider>
      <Alert
        type="info"
        showIcon
        message="Link to existing contacts"
        description="Select one or more contacts who have a relationship to this person."
        style={{ marginBottom: 16 }}
      />
      <Form.Item label="Related Contacts" name="related_ids">
        <Select
          mode="multiple"
          allowClear
          showSearch
          placeholder="Search and select related contacts…"
          filterOption={(input, option) =>
            String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
          }
          options={contacts.map((c) => ({
            label: `${c.first_name} ${c.last_name} (${c.email})`,
            value: c.id,
          }))}
        />
      </Form.Item>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Staff toggle
// ─────────────────────────────────────────────────────────────────────────────
const StaffToggle = ({
  isStaff,
  onChange,
}: {
  isStaff: boolean;
  onChange: (v: boolean) => void;
}) => (
  <Divider orientation="left">
    <Space>
      <IdcardOutlined />
      Staff Member
      <Switch
        checked={isStaff}
        onChange={onChange}
        checkedChildren="Yes"
        unCheckedChildren="No"
        style={isStaff ? { background: BASICS_COLORS.secondary } : {}}
      />
    </Space>
  </Divider>
);

// ─────────────────────────────────────────────────────────────────────────────
// Section: Staff Data (shown only when is_staff = true)
// ─────────────────────────────────────────────────────────────────────────────
const StaffSection = () => (
  <Card
    style={{
      marginBottom: 24,
      borderLeft: `4px solid ${BASICS_COLORS.primary}`,
      background: BASICS_COLORS.primaryLight,
    }}
    title={
      <Space>
        <IdcardOutlined style={{ color: BASICS_COLORS.secondary }} />
        <Text strong>Section 2: Staff Data</Text>
      </Space>
    }
  >
    <Divider orientation="left" style={{ marginTop: 0 }}>Employment &amp; Identification</Divider>

    <Row gutter={16}>
      <Col xs={24} sm={12}>
        <Form.Item label="SSNIT Number" name={["staff", "ssnit_number"]}>
          <Input />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item label="National ID Number" name={["staff", "national_id_number"]}>
          <Input />
        </Form.Item>
      </Col>
    </Row>

    <Row gutter={16}>
      <Col xs={24} sm={12}>
        <Form.Item label="National ID Photo" name={["staff", "national_id_photo_url"]}>
          <StorageUpload accept="image/*,application/pdf" folder="staff-ids" maxMb={10} />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item label="Stanbic Bank Account Number" name={["staff", "stanbic_account_number"]}>
          <Input />
        </Form.Item>
      </Col>
    </Row>

    <Form.Item label="Certification (upload)" name={["staff", "certification_url"]}>
      <StorageUpload accept="image/*,application/pdf" folder="staff-certs" maxMb={20} />
    </Form.Item>

    <Divider orientation="left">Marital Status</Divider>
    <Form.Item name={["staff", "marital_status"]}>
      <Radio.Group>
        <Space direction="vertical">
          <Radio value="single">Single</Radio>
          <Radio value="married">Married</Radio>
          <Radio value="divorced">Divorced</Radio>
          <Radio value="widowed">Widowed</Radio>
        </Space>
      </Radio.Group>
    </Form.Item>

    <Divider orientation="left">Employment Status</Divider>
    <Form.Item name={["staff", "employment_status"]}>
      <Radio.Group>
        <Space direction="vertical">
          <Radio value="contract">Contract</Radio>
          <Radio value="permanent">Permanent</Radio>
          <Radio value="ambassador">Ambassador</Radio>
        </Space>
      </Radio.Group>
    </Form.Item>

    <Row gutter={16}>
      <Col xs={24} sm={12}>
        <Form.Item label="Start Date of Employment" name={["staff", "start_date"]}>
          <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item label="End Date of Employment" name={["staff", "end_date"]}>
          <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
        </Form.Item>
      </Col>
    </Row>

    <Form.Item label="Emergency Contact" name={["staff", "emergency_contact"]}>
      <Input placeholder="Name and phone number" />
    </Form.Item>

    <Divider orientation="left">
      <Space><SafetyOutlined />Screening Questions</Space>
    </Divider>

    <Alert
      type="warning"
      showIcon
      message="Confidential — handle with care"
      style={{ marginBottom: 16 }}
    />

    <Form.Item
      label="Have you been arrested before?"
      name={["staff", "arrested_before"]}
    >
      <Radio.Group>
        <Radio value={true}>Yes</Radio>
        <Radio value={false}>No</Radio>
      </Radio.Group>
    </Form.Item>

    <Form.Item
      label="Were you ever dismissed from employment or a contract due to stealing?"
      name={["staff", "dismissed_for_stealing"]}
    >
      <Radio.Group>
        <Radio value={true}>Yes</Radio>
        <Radio value={false}>No</Radio>
      </Radio.Group>
    </Form.Item>

    <Form.Item
      label="Have you been accused of sexual abuse or rape?"
      name={["staff", "accused_of_abuse"]}
    >
      <Radio.Group>
        <Radio value={true}>Yes</Radio>
        <Radio value={false}>No</Radio>
      </Radio.Group>
    </Form.Item>
  </Card>
);
