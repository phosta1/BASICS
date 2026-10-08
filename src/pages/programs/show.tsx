import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Card, Typography, Divider, Alert } from "antd";
import { FieldBuilder } from "../../components/FieldBuilder";
import { usePermissions } from "../../hooks/usePermissions";
import type { Program } from "../../types";

const { Title, Text } = Typography;

export const ProgramShow = () => {
  const { queryResult } = useShow<Program>();
  const program = queryResult?.data?.data;
  const { role } = usePermissions();
  const canEdit = role === "admin" || role === "editor";

  return (
    <Show isLoading={queryResult?.isLoading} title="Program Builder">
      <Card style={{ marginBottom: 24 }}>
        <Title level={4}>{program?.name}</Title>
        {program?.description && <Text type="secondary">{program.description}</Text>}
      </Card>

      <Divider />

      <Card title="Program Fields">
        {!canEdit && (
          <Alert
            type="info"
            message="You don't have permission to manage fields"
            description="Only admins and editors can add, edit, or delete program fields."
            style={{ marginBottom: 16 }}
            showIcon
          />
        )}
        <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
          Define the questions / fields users will fill in when enrolling a contact into this program.
        </Text>
        {program?.id && canEdit && (
          <FieldBuilder
            resource="program_fields"
            programId={program.id}
            title="Fields for this program"
          />
        )}
        {program?.id && !canEdit && (
          <Text type="secondary">Field management is restricted to admins and editors.</Text>
        )}
      </Card>
    </Show>
  );
};
