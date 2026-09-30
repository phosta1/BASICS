import { Show, useTable, DeleteButton } from "@refinedev/antd";
import { useShow, useCreate, useList, useOne } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import {
  Typography, Card, Table, Form, Input, Button,
  Space, Tag, Divider, Avatar, Descriptions, Tooltip,
} from "antd";
import {
  PlusOutlined, UserOutlined, AppstoreOutlined, FileTextOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useRole } from "../../hooks/useRole";
import type { Contact, Note, Enrollment, Program, ContactField, ContactFieldValue } from "../../types";

const { Title, Text } = Typography;

const statusColor: Record<Contact["status"], string> = {
  lead: "blue", active: "green", inactive: "default",
};

export const ContactShow = () => {
  const { queryResult } = useShow<Contact>();
  const contact = queryResult?.data?.data;
  const isLoading = queryResult?.isLoading;
  const [noteForm] = Form.useForm();
  const navigate = useNavigate();
  const { canEdit, isAdmin } = useRole();
  const { mutate: createNote, isLoading: isCreating } = useCreate<Note>();

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
      // Hide the default Edit button for viewers — editors/admins keep it
      canEdit={canEdit}
      canDelete={isAdmin}
    >
      {/* ── Contact Header ── */}
      <Card style={{ marginBottom: 24 }}>
        <Space size={16}>
          <Avatar size={64} src={contact?.profile_picture_url} icon={<UserOutlined />} />
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {contact?.first_name} {contact?.last_name}
            </Title>
            {contact?.status && <Tag color={tagColor}>{contact.status.toUpperCase()}</Tag>}
            {contact?.company && <Text type="secondary"> · {contact.company}</Text>}
          </div>
        </Space>

        <Divider />

        <Descriptions column={{ xs: 1, sm: 2 }} size="small">
          <Descriptions.Item label="Email">{contact?.email}</Descriptions.Item>
          {contact?.phone && <Descriptions.Item label="Phone">{contact.phone}</Descriptions.Item>}
          {contactFields.map((f) => (
            <Descriptions.Item key={f.id} label={f.label}>
              {fieldValueMap[f.id] ?? <Text type="secondary">—</Text>}
            </Descriptions.Item>
          ))}
        </Descriptions>
      </Card>

      {/* ── Programs ── */}
      <Card
        title={<Space><AppstoreOutlined />Programs</Space>}
        extra={
          canEdit ? (
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => navigate(`/enrollments/create?contact_id=${contact?.id}`)}
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
          <Space wrap>
            {enrollments.map((e) => <ProgramBadge key={e.id} enrollment={e} />)}
          </Space>
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

const ProgramBadge = ({ enrollment }: { enrollment: Enrollment }) => {
  const navigate = useNavigate();
  const { data } = useOne<Program>({ resource: "programs", id: enrollment.program_id });
  const name = data?.data?.name ?? "Program";
  return (
    <Tooltip title="Click to view details">
      <Tag
        color="blue"
        style={{ cursor: "pointer", fontSize: 13, padding: "4px 10px" }}
        onClick={() => navigate(`/enrollments/show/${enrollment.id}`)}
      >
        {name}
      </Tag>
    </Tooltip>
  );
};
