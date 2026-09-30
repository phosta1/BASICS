import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Card, Typography, Divider } from "antd";
import { FieldBuilder } from "../../components/FieldBuilder";
import type { Program } from "../../types";

const { Title, Text } = Typography;

export const ProgramShow = () => {
  const { queryResult } = useShow<Program>();
  const program = queryResult?.data?.data;

  return (
    <Show isLoading={queryResult?.isLoading} title="Program Builder">
      <Card style={{ marginBottom: 24 }}>
        <Title level={4}>{program?.name}</Title>
        {program?.description && <Text type="secondary">{program.description}</Text>}
      </Card>

      <Divider />

      <Card title="Program Fields">
        <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
          Define the questions / fields users will fill in when enrolling a contact into this program.
        </Text>
        {program?.id && (
          <FieldBuilder
            resource="program_fields"
            programId={program.id}
            title="Fields for this program"
          />
        )}
      </Card>
    </Show>
  );
};
