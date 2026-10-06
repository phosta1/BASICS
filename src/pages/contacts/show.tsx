import { Show, useTable, DeleteButton } from "@refinedev/antd";
import { useState, useEffect } from "react";
import { useShow, useCreate, useList } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import {
  Typography, Card, Table, Form, Input, Button,
  Space, Tag, Divider, Avatar, Descriptions, Tooltip, message,
  Alert, Row, Col,
} from "antd";
import {
  PlusOutlined, UserOutlined, AppstoreOutlined, FileTextOutlined,
  EyeOutlined, DownloadOutlined, IdcardOutlined, SafetyOutlined,
  CheckCircleOutlined, CloseCircleOutlined, TeamOutlined, EditOutlined,
} from "@ant-design/icons";
import { useRole } from "../../hooks/useRole";
import { exportContacts } from "../../utils/exportContacts";
import { supabaseClient } from "../../supabaseClient";
import { BASICS_COLORS } from "../../brand";
import type { Contact, Note, Enrollment, Program, ContactField, ContactFieldValue, StaffProfile } from "../../types";

const { Title, Text } = Typography;

const statusColor: Record<Contact["status"], string> = {
  active: "green",
  "dropped off": "red",
  completed: "blue",
  "not lead": "default",
};

export const ContactShow = () => {
  const { queryResult } = useShow<Contact>();
  const contact = queryResult?.data?.data;
  const isLoading = queryResult?.isLoading;
  const [noteForm] = Form.useForm();
  const navigate = useNavigate();
  const { canEdit, isAdmin } = useRole();
  const { mutate: createNote, isLoading: isCreating } = useCreate<Note>();
  const [exporting, setExporting] = useState(false);
  const [relatedContacts, setRelatedContacts] = useState<Contact[]>([]);

  // Load related contacts via junction table
  useEffect(() => {
    if (!contact?.id) return;
    supabaseClient
      .from("contact_relations")
      .select("related_id, contacts!contact_relations_related_id_fkey(id, first_name, last_name, email, status, profile_picture_url)")
      .eq("contact_id", contact.id)
      .then(({ data }) => {
        if (data) setRelatedContacts(data.map((r: any) => r.contacts).filter(Boolean));
      });
  }, [contact?.id]);

  const handleExport = async () => {
    if (!contact?.id) return;
    setExporting(true);
    try {
      await exportContacts([contact.id]);
      message.success("Contact exported successfully");
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : "Export failed");
    }
    setExporting(false);
  };

  const { data: contactFieldsData } = useList<ContactField>({
    resource: "contact_fields",
    sorters: [{ field: "sort_order", order: "asc" }],
    pagination: { pageSize: 100 },
  });
  const contactFields = contactFieldsData?.data ?? [];

  const { data: fieldValuesData } = useList<ContactFieldValue>({
    resource: "contact_field_values",
    filters: [{ field: "contact_id", operator: "eq", value: contact?.id }],
    pagination: { pageSize: 100 },
    queryOptions: { enabled: !!contact?.id },
  });
  const fieldValues = fieldValuesData?.data ?? [];
  const fieldValueMap = Object.fromEntries(fieldValues.map((v) => [v.field_id, v.value]));

  const { tableProps: notesTableProps } = useTable<Note>({
    resource: "notes",
    filters: { permanent: [{ field: "contact_id", operator: "eq", value: contact?.id }] },
    queryOptions: { enabled: !!contact?.id },
    sorters: { initial: [{ field: "created_at", order: "desc" }] },
  });

  const { data: enrollmentsData } = useList<Enrollment>({
    resource: "enrollments",
    filters: [{ field: "contact_id", operator: "eq", value: contact?.id }],
    pagination: { pageSize: 50 },
    queryOptions: { enabled: !!contact?.id },
  });
  const enrollments = enrollmentsData?.data ?? [];

  // Staff profile (only fetched when contact is_staff)
  const isStaff = !!(contact as any)?.is_staff;
  const { data: staffData } = useList<StaffProfile>({
    resource: "staff_profiles",
    filters: [{ field: "contact_id", operator: "eq", value: contact?.id }],
    pagination: { pageSize: 1 },
    queryOptions: { enabled: isStaff && !!contact?.id },
  });
  const staffProfile = staffData?.data?.[0];

  // Fetch ALL programs in one query
  const { data: allProgramsData } = useList<Program>({
    resource: "programs",
    pagination: { pageSize: 200 },
  });
  const allPrograms = allProgramsData?.data ?? [];
  const programMap = Object.fromEntries(allPrograms.map((p) => [p.id, p]));
  const enrolledProgramIds = enrollments.map((e) => e.program_id);

  // Fetch ALL enrollment values for this contact's enrollments in one query
  const enrollmentIds = enrollments.map((e) => e.id);
  const { data: enrollmentValuesData } = useList({
    resource: "enrollment_values",
    filters: enrollmentIds.length > 0
      ? [{ field: "enrollment_id", operator: "in", value: enrollmentIds }]
      : [],
    pagination: { pageSize: 2000 },
    queryOptions: { enabled: enrollmentIds.length > 0 },
  });
  const allEnrollmentValues = (enrollmentValuesData?.data ?? []) as Array<{ enrollment_id: number; field_id: number; value: string }>;

  // Fetch ALL program fields for enrolled programs in one query
  const { data: programFieldsData } = useList({
    resource: "program_fields",
    filters: enrolledProgramIds.length > 0
      ? [{ field: "program_id", operator: "in", value: enrolledProgramIds }]
      : [],
    pagination: { pageSize: 500 },
    sorters: [{ field: "sort_order", order: "asc" }],
    queryOptions: { enabled: enrolledProgramIds.length > 0 },
  });
  const allProgramFields = (programFieldsData?.data ?? []) as Array<{ id: number; program_id: number; label: string; field_key: string; field_type: string }>;

  const handleAddNote = (values: { content: string }) => {
    createNote(
      { resource: "notes", values: { content: values.content, contact_id: contact?.id } },
      { onSuccess: () => noteForm.resetFields() }
    );
  };

  const tagColor = contact?.status && contact.status in statusColor
    ? statusColor[contact.status] : "default";

  return (
    <Show
      isLoading={isLoading}
      canEdit={canEdit}
      canDelete={isAdmin}
      headerButtons={({ defaultButtons }) => (
        <>
          {defaultButtons}
          <Button
            icon={<DownloadOutlined />}
            loading={exporting}
            onClick={handleExport}
            style={{
              borderColor: BASICS_COLORS.primary,
              color: BASICS_COLORS.secondary,
            }}
          >
            Export CSV
          </Button>
        </>
      )}
    >
      {/* ── Contact Header ── */}
      <Card style={{ marginBottom: 24 }}>
        <Space size={16}>
          <Avatar size={64} src={contact?.profile_picture_url} icon={<UserOutlined />} />
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {contact?.first_name} {contact?.last_name}
              {contact?.other_names ? ` (${contact.other_names})` : ""}
            </Title>
            {contact?.status && <Tag color={tagColor}>{contact.status.toUpperCase()}</Tag>}
            {(contact as any)?.is_staff && <Tag color="green" style={{ marginLeft: 4 }}>Staff</Tag>}
          </div>
        </Space>

        <Divider />

        <Descriptions column={{ xs: 1, sm: 2 }} size="small">
          <Descriptions.Item label="Email">{contact?.email}</Descriptions.Item>
          {contact?.phone && <Descriptions.Item label="Phone">{contact.phone}</Descriptions.Item>}
          {(contact as any)?.gender && <Descriptions.Item label="Gender">{(contact as any).gender}</Descriptions.Item>}
          {(contact as any)?.date_of_birth && <Descriptions.Item label="Date of Birth">{(contact as any).date_of_birth}</Descriptions.Item>}
          {(contact as any)?.place_of_birth && <Descriptions.Item label="Place of Birth">{(contact as any).place_of_birth}</Descriptions.Item>}
          {(contact as any)?.address && <Descriptions.Item label="Address" span={2}>{(contact as any).address}</Descriptions.Item>}
          {contactFields.map((f) => (
            <Descriptions.Item key={f.id} label={f.label}>
              {fieldValueMap[f.id] ?? <Text type="secondary">—</Text>}
            </Descriptions.Item>
          ))}
        </Descriptions>
      </Card>

      {/* ── Related Contacts ── */}
      {relatedContacts.length > 0 && (
        <Card
          title={<Space><TeamOutlined />Related Contacts</Space>}
          style={{ marginBottom: 24 }}
        >
          <Space wrap>
            {relatedContacts.map((rc) => (
              <div
                key={rc.id}
                onClick={() => navigate(`/contacts/show/${rc.id}`)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 14px",
                  border: `1px solid ${BASICS_COLORS.borderColor}`,
                  borderRadius: 8,
                  cursor: "pointer",
                  background: BASICS_COLORS.primaryLight,
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = BASICS_COLORS.primary)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = BASICS_COLORS.borderColor)}
              >
                <Avatar size={32} src={rc.profile_picture_url} icon={<UserOutlined />} />
                <div>
                  <Text strong style={{ display: "block", lineHeight: 1.3, fontSize: 13 }}>
                    {rc.first_name} {rc.last_name}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>{rc.email}</Text>
                </div>
                <Tag color={statusColor[rc.status] ?? "default"} style={{ marginLeft: 4 }}>
                  {rc.status?.toUpperCase()}
                </Tag>
              </div>
            ))}
          </Space>
        </Card>
      )}

      {/* ── Staff Profile ── */}
      {isStaff && (
        <Card
          title={
            <Space>
              <IdcardOutlined style={{ color: BASICS_COLORS.secondary }} />
              <span style={{ color: BASICS_COLORS.secondary, fontWeight: 700 }}>
                Staff Profile
              </span>
            </Space>
          }
          style={{
            marginBottom: 24,
            borderLeft: `4px solid ${BASICS_COLORS.primary}`,
          }}
        >
          {!staffProfile ? (
            <Alert
              type="warning"
              showIcon
              message="Staff data not yet completed"
              description="Edit this contact to fill in the staff section."
            />
          ) : (
            <>
              <Divider orientation="left" style={{ marginTop: 0 }}>Employment &amp; Identification</Divider>
              <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                {staffProfile.ssnit_number && (
                  <Descriptions.Item label="SSNIT Number">{staffProfile.ssnit_number}</Descriptions.Item>
                )}
                {staffProfile.national_id_number && (
                  <Descriptions.Item label="National ID">{staffProfile.national_id_number}</Descriptions.Item>
                )}
                {staffProfile.national_id_photo_url && (
                  <Descriptions.Item label="National ID Photo">
                    <a href={staffProfile.national_id_photo_url} target="_blank" rel="noreferrer">
                      View document ↗
                    </a>
                  </Descriptions.Item>
                )}
                {staffProfile.stanbic_account_number && (
                  <Descriptions.Item label="Stanbic Account">{staffProfile.stanbic_account_number}</Descriptions.Item>
                )}
                {staffProfile.certification_url && (
                  <Descriptions.Item label="Certification">
                    <a href={staffProfile.certification_url} target="_blank" rel="noreferrer">
                      View document ↗
                    </a>
                  </Descriptions.Item>
                )}
                {staffProfile.marital_status && (
                  <Descriptions.Item label="Marital Status" style={{ textTransform: "capitalize" }}>
                    {staffProfile.marital_status}
                  </Descriptions.Item>
                )}
                {staffProfile.employment_status && (
                  <Descriptions.Item label="Employment Status">
                    <Tag color={
                      staffProfile.employment_status === "permanent" ? "green" :
                      staffProfile.employment_status === "contract" ? "blue" : "purple"
                    }>
                      {staffProfile.employment_status.toUpperCase()}
                    </Tag>
                  </Descriptions.Item>
                )}
                {staffProfile.start_date && (
                  <Descriptions.Item label="Start Date">{staffProfile.start_date}</Descriptions.Item>
                )}
                {staffProfile.end_date && (
                  <Descriptions.Item label="End Date">{staffProfile.end_date}</Descriptions.Item>
                )}
                {staffProfile.emergency_contact && (
                  <Descriptions.Item label="Emergency Contact" span={2}>
                    {staffProfile.emergency_contact}
                  </Descriptions.Item>
                )}
              </Descriptions>

              {/* Screening — only show to admins */}
              {isAdmin && (staffProfile.arrested_before !== undefined ||
                staffProfile.dismissed_for_stealing !== undefined ||
                staffProfile.accused_of_abuse !== undefined) && (
                <>
                  <Divider orientation="left">
                    <Space><SafetyOutlined />Screening (Admin Only)</Space>
                  </Divider>
                  <Alert
                    type="warning"
                    showIcon
                    message="Confidential information"
                    style={{ marginBottom: 12 }}
                  />
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Arrested before?">
                      <YesNo value={staffProfile.arrested_before} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Dismissed for stealing?">
                      <YesNo value={staffProfile.dismissed_for_stealing} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Accused of sexual abuse?">
                      <YesNo value={staffProfile.accused_of_abuse} />
                    </Descriptions.Item>
                  </Descriptions>
                </>
              )}
            </>
          )}
        </Card>
      )}

      {/* ── Programs ── */}
      <Card
        title={<Space><AppstoreOutlined />Programs</Space>}
        extra={
          canEdit ? (
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => {
                const exclude = enrolledProgramIds.join(",");
                navigate(`/enrollments/create?contact_id=${contact?.id}${exclude ? `&exclude_programs=${exclude}` : ""}`);
              }}
            >
              Enroll in Program
            </Button>
          ) : (
            <Tag icon={<EyeOutlined />} color="default">View only</Tag>
          )
        }
        style={{ marginBottom: 24 }}
      >
        {enrollments.length === 0 ? (
          <Text type="secondary">Not enrolled in any programs yet.</Text>
        ) : (
          <Row gutter={[12, 12]}>
            {enrollments.map((e) => {
              const program = programMap[e.program_id];
              const fields = allProgramFields.filter((f) => f.program_id === e.program_id);
              const valuesForEnrollment = allEnrollmentValues.filter((v) => v.enrollment_id === e.id);
              const valueMap = Object.fromEntries(valuesForEnrollment.map((v) => [v.field_id, v.value]));

              return (
                <Col key={e.id} xs={24} sm={12} lg={8}>
                  <Card
                    size="small"
                    title={
                      <Space>
                        <AppstoreOutlined style={{ color: BASICS_COLORS.primary }} />
                        <Text strong style={{ color: BASICS_COLORS.secondary }}>
                          {program?.name ?? "Program"}
                        </Text>
                      </Space>
                    }
                    extra={
                      <Space style={{ marginRight: -8 }}>
                        {canEdit && (
                          <Tooltip title="Edit enrollment">
                            <Button
                              type="link"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => navigate(`/enrollments/edit/${e.id}`)}
                              style={{ padding: 0 }}
                            />
                          </Tooltip>
                        )}
                        <Tooltip title="View full enrollment">
                          <Button
                            type="link"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => navigate(`/enrollments/show/${e.id}`)}
                            style={{ padding: 0 }}
                          />
                        </Tooltip>
                      </Space>
                    }
                    style={{
                      borderTop: `3px solid ${BASICS_COLORS.primary}`,
                      cursor: "default",
                    }}
                  >
                    {fields.length === 0 ? (
                      <Text type="secondary" style={{ fontSize: 12 }}>No fields for this program.</Text>
                    ) : (
                      <div style={{ fontSize: 12 }}>
                        {fields.map((f) => {
                          const val = valueMap[f.id];
                          return (
                            <div key={f.id} style={{ marginBottom: 6 }}>
                              <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
                                {f.label}
                              </Text>
                              <Text style={{ fontSize: 12 }}>
                                {val ? val : <Text type="secondary">—</Text>}
                              </Text>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div style={{ marginTop: 8, paddingTop: 6, borderTop: `1px solid ${BASICS_COLORS.borderColor}` }}>
                      <Text type="secondary" style={{ fontSize: 10 }}>
                        Enrolled {new Date(e.enrolled_at).toLocaleDateString()}
                      </Text>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Card>

      <Divider />

      {/* ── Notes ── */}
      <Card
        title={<Space><FileTextOutlined />Notes</Space>}
        style={{ marginBottom: 24 }}
      >
        {/* Only editors and admins can add/delete notes */}
        {canEdit && (
          <Form form={noteForm} layout="inline" onFinish={handleAddNote} style={{ marginBottom: 16 }}>
            <Form.Item
              name="content"
              rules={[{ required: true, message: "Note cannot be empty" }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="Add a note..." />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={isCreating}>
                Add
              </Button>
            </Form.Item>
          </Form>
        )}

        <Table {...notesTableProps} rowKey="id" size="small">
          <Table.Column dataIndex="content" title="Note" />
          <Table.Column
            dataIndex="created_at"
            title="Date"
            render={(v: string) => new Date(v).toLocaleDateString()}
          />
          {canEdit && (
            <Table.Column
              title=""
              render={(_: unknown, record: Note) => (
                <DeleteButton hideText size="small" resource="notes" recordItemId={record.id} />
              )}
            />
          )}
        </Table>
      </Card>
    </Show>
  );
};

const YesNo = ({ value }: { value: boolean | null | undefined }) => {
  if (value === null || value === undefined) return <Text type="secondary">—</Text>;
  return value ? (
    <Space>
      <CheckCircleOutlined style={{ color: "#cf1322" }} />
      <Text style={{ color: "#cf1322", fontWeight: 600 }}>Yes</Text>
    </Space>
  ) : (
    <Space>
      <CloseCircleOutlined style={{ color: BASICS_COLORS.primary }} />
      <Text style={{ color: BASICS_COLORS.secondary }}>No</Text>
    </Space>
  );
};
