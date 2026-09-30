/**
 * EnrollmentCreate
 * Enroll a contact into a program and fill in that program's custom fields.
 * Can be opened from a Contact's detail page (pre-fills contact_id).
 */
import { useState } from "react";
import { useCreate, useList } from "@refinedev/core";
import { useSelect } from "@refinedev/antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Card, Form, Select, Button, Divider,
  Spin, Alert, Space,
} from "antd";
import { DynamicField } from "../../components/DynamicField";
import type { Contact, Program, ProgramField, Enrollment, EnrollmentValue } from "../../types";

export const EnrollmentCreate = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // Pre-fill from query string e.g. /enrollments/create?contact_id=5&program_id=2
  const preContact = searchParams.get("contact_id")
    ? Number(searchParams.get("contact_id"))
    : undefined;
  const preProgram = searchParams.get("program_id")
    ? Number(searchParams.get("program_id"))
    : undefined;

  const [selectedProgramId, setSelectedProgramId] = useState<number | undefined>(preProgram);
  const [isSaving, setIsSaving] = useState(false);

  // Contact selector
  const { selectProps: contactSelectProps } = useSelect<Contact>({
    resource: "contacts",
    optionLabel: (c) => `${c.first_name} ${c.last_name} (${c.email})`,
    optionValue: "id",
    defaultValue: preContact,
  });

  // Program selector
  const { selectProps: programSelectProps } = useSelect<Program>({
    resource: "programs",
    optionLabel: "name",
    optionValue: "id",
    defaultValue: preProgram,
  });

  // Load fields for selected program
  const { data: fieldsData, isLoading: fieldsLoading } = useList<ProgramField>({
    resource: "program_fields",
    filters: [{ field: "program_id", operator: "eq", value: selectedProgramId }],
    sorters: [{ field: "sort_order", order: "asc" }],
    pagination: { pageSize: 100 },
    queryOptions: { enabled: !!selectedProgramId },
  });

  const programFields = fieldsData?.data ?? [];

  const { mutate: createEnrollment } = useCreate<Enrollment>();
  const { mutate: createValue } = useCreate<EnrollmentValue>();

  const handleFinish = async (values: Record<string, unknown>) => {
    const contactId = values.contact_id as number;
    const programId = values.program_id as number;
    const fieldAnswers = (values.fields ?? {}) as Record<string, unknown>;

    setIsSaving(true);

    createEnrollment(
      { resource: "enrollments", values: { contact_id: contactId, program_id: programId } },
      {
        onSuccess: (data) => {
          const enrollmentId = data.data.id;
          // Save each field answer
          const saves = programFields.map((f) => {
            const val = fieldAnswers[f.field_key];
            if (val === undefined || val === null || val === "") return Promise.resolve();
            return new Promise<void>((resolve) =>
              createValue(
                {
                  resource: "enrollment_values",
                  values: { enrollment_id: enrollmentId, field_id: f.id, value: String(val) },
                },
                { onSuccess: () => resolve(), onError: () => resolve() }
              )
            );
          });

          Promise.all(saves).then(() => {
            setIsSaving(false);
            navigate(preContact ? `/contacts/show/${contactId}` : "/contacts");
          });
        },
        onError: () => setIsSaving(false),
      }
    );
  };

  return (
    <Card title="Enroll Contact in Program" style={{ maxWidth: 720, margin: "0 auto" }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ contact_id: preContact, program_id: preProgram }}
      >
        {/* Contact */}
        <Form.Item label="Contact" name="contact_id" rules={[{ required: true }]}>
          <Select
            {...contactSelectProps}
            showSearch
            filterOption={false}
            placeholder="Search for a contact..."
            disabled={!!preContact}
          />
        </Form.Item>

        {/* Program */}
        <Form.Item label="Program" name="program_id" rules={[{ required: true }]}>
          <Select
            {...programSelectProps}
            placeholder="Select a program"
            disabled={!!preProgram}
            onChange={(v) => {
              setSelectedProgramId(v as unknown as number);
              form.setFieldValue("fields", {});
            }}
          />
        </Form.Item>

        {/* Dynamic program fields */}
        {selectedProgramId && (
          <>
            <Divider>Program Fields</Divider>
            {fieldsLoading ? (
              <Spin />
            ) : programFields.length === 0 ? (
              <Alert
                type="info"
                message="This program has no fields defined yet. Ask an admin to add fields in the Program Builder."
              />
            ) : (
              programFields.map((f) => (
                <DynamicField key={f.id} field={f} namePrefix="fields" />
              ))
            )}
          </>
        )}

        <Divider />
        <Space>
          <Button
            type="primary"
            htmlType="submit"
            loading={isSaving}
            disabled={!selectedProgramId}
          >
            Save Enrollment
          </Button>
          <Button onClick={() => navigate(-1)}>Cancel</Button>
        </Space>
      </Form>
    </Card>
  );
};
