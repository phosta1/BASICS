/**
 * EnrollmentShow
 * Shows all field values for a contact's enrollment in a program.
 * Reached by clicking a program badge on the Contact detail page.
 * File fields render as image thumbnails or download links.
 */
import { useOne, useList } from "@refinedev/core";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Descriptions, Typography, Button, Spin, Divider, Image, Space } from "antd";
import { ArrowLeftOutlined, FilePdfOutlined, FileOutlined } from "@ant-design/icons";
import type { Enrollment, EnrollmentValue, ProgramField, Program, Contact } from "../../types";

const { Title, Text } = Typography;

const IMAGE_RE = /\.(png|jpe?g|gif|webp|svg|bmp)(\?|$)/i;

/** Renders a stored file URL — image thumbnail or a download link */
const FileValue = ({ url }: { url: string }) => {
  if (IMAGE_RE.test(url)) {
    return (
      <Image
        src={url}
        width={80}
        height={80}
        style={{ objectFit: "cover", borderRadius: 6, border: "1px solid #d9d9d9" }}
        alt="attachment"
      />
    );
  }
  const isPdf = /\.pdf(\?|$)/i.test(url);
  return (
    <Space>
      {isPdf ? <FilePdfOutlined style={{ color: "#ff4d4f" }} /> : <FileOutlined />}
      <a href={url} target="_blank" rel="noreferrer">
        Download file
      </a>
    </Space>
  );
};

export const EnrollmentShow = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: enrollmentData, isLoading } = useOne<Enrollment>({
    resource: "enrollments",
    id: id!,
  });
  const enrollment = enrollmentData?.data;

  const { data: programData } = useOne<Program>({
    resource: "programs",
    id: enrollment?.program_id ?? 0,
    queryOptions: { enabled: !!enrollment?.program_id },
  });
  const program = programData?.data;

  const { data: contactData } = useOne<Contact>({
    resource: "contacts",
    id: enrollment?.contact_id ?? 0,
    queryOptions: { enabled: !!enrollment?.contact_id },
  });
  const contact = contactData?.data;

  const { data: fieldsData } = useList<ProgramField>({
    resource: "program_fields",
    filters: [{ field: "program_id", operator: "eq", value: enrollment?.program_id }],
    sorters: [{ field: "sort_order", order: "asc" }],
    pagination: { pageSize: 100 },
    queryOptions: { enabled: !!enrollment?.program_id },
  });
  const programFields = fieldsData?.data ?? [];

  const { data: valuesData } = useList<EnrollmentValue>({
    resource: "enrollment_values",
    filters: [{ field: "enrollment_id", operator: "eq", value: enrollment?.id }],
    pagination: { pageSize: 100 },
    queryOptions: { enabled: !!enrollment?.id },
  });
  const values = valuesData?.data ?? [];
  const valueMap = Object.fromEntries(values.map((v) => [v.field_id, v.value]));

  if (isLoading) return <Spin style={{ display: "block", margin: "40px auto" }} />;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(`/contacts/show/${enrollment?.contact_id}`)}
        style={{ marginBottom: 16 }}
      >
        Back to {contact?.first_name} {contact?.last_name}
      </Button>

      <Card style={{ marginBottom: 24 }}>
        <Title level={4}>{program?.name}</Title>
        {program?.description && <Text type="secondary">{program.description}</Text>}
        <Divider />
        <Text strong>Contact: </Text>
        <Text>
          {contact?.first_name} {contact?.last_name}{" "}
          {contact?.email && <Text type="secondary">({contact.email})</Text>}
        </Text>
        <br />
        <Text strong>Enrolled: </Text>
        <Text>
          {enrollment?.enrolled_at
            ? new Date(enrollment.enrolled_at).toLocaleString()
            : "—"}
        </Text>
      </Card>

      <Card title="Program Information">
        {programFields.length === 0 ? (
          <Text type="secondary">No fields defined for this program yet.</Text>
        ) : (
          <Descriptions column={1} bordered size="small">
            {programFields.map((field) => {
              const rawValue = valueMap[field.id];
              return (
                <Descriptions.Item key={field.id} label={field.label}>
                  {!rawValue ? (
                    <Text type="secondary">Not provided</Text>
                  ) : field.field_type === "file" ? (
                    <FileValue url={rawValue} />
                  ) : (
                    rawValue
                  )}
                </Descriptions.Item>
              );
            })}
          </Descriptions>
        )}
      </Card>
    </div>
  );
};
