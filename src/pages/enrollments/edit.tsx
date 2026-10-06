/**
 * EnrollmentEdit
 * Edit field values for an existing enrollment.
 * Reached by clicking an Edit button on enrollment show page or contact show program card.
 */
import { useState, useEffect } from "react";
import { useOne, useList, useUpdate, useCreate } from "@refinedev/core";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  Card, Form, Button, Divider, Spin, Space, Alert, Typography,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { DynamicField } from "../../components/DynamicField";
import type { Enrollment, EnrollmentValue, ProgramField, Program, Contact } from "../../types";

const { Title, Text } = Typography;

export const EnrollmentEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isSaving, setIsSaving] = useState(false);

  // Load enrollment
  const { data: enrollmentData, isLoading: enrollmentLoading } = useOne<Enrollment>({
    resource: "enrollments",
    id: id!,
  });
  const enrollment = enrollmentData?.data;

  // Load program
  const { data: programData } = useOne<Program>({
    resource: "programs",
    id: enrollment?.program_id ?? 0,
    queryOptions: { enabled: !!enrollment?.program_id },
  });
  const program = programData?.data;

  // Load contact
  const { data: contactData } = useOne<Contact>({
    resource: "contacts",
    id: enrollment?.contact_id ?? 0,
    queryOptions: { enabled: !!enrollment?.contact_id },
  });
  const contact = contactData?.data;

  // Load program fields
  const { data: fieldsData, isLoading: fieldsLoading } = useList<ProgramField>({
    resource: "program_fields",
    filters: [{ field: "program_id", operator: "eq", value: enrollment?.program_id }],
    sorters: [{ field: "sort_order", order: "asc" }],
    pagination: { pageSize: 100 },
    queryOptions: { enabled: !!enrollment?.program_id },
  });
  const programFields = fieldsData?.data ?? [];

  // Load existing values
  const { data: valuesData } = useList<EnrollmentValue>({
    resource: "enrollment_values",
    filters: [{ field: "enrollment_id", operator: "eq", value: enrollment?.id }],
    pagination: { pageSize: 100 },
    queryOptions: { enabled: !!enrollment?.id },
  });
  const values = valuesData?.data ?? [];
  const valueMap = Object.fromEntries(values.map((v) => [v.field_id, v]));

  const { mutate: updateValue } = useUpdate<EnrollmentValue>();
  const { mutate: createValue } = useCreate<EnrollmentValue>();

  // Update form values when data loads
  useEffect(() => {
    if (!enrollment || programFields.length === 0) return;
    
    const fields: Record<string, unknown> = {};
    programFields.forEach((f) => {
      const v = values.find((val) => val.field_id === f.id);
      if (v && v.value != null) {
        // Convert date strings to dayjs objects for DatePicker
        if (f.field_type === "date") {
          fields[f.field_key] = dayjs(v.value);
        } else {
          fields[f.field_key] = v.value;
        }
      }
    });
    
    console.log("Setting form values:", fields, "for enrollment:", enrollment.id);
    form.setFieldsValue({ fields });
  }, [enrollment, programFields, values, form]);

  const handleFinish = async (formValues: Record<string, unknown>) => {
    if (!enrollment) return;
    const fieldAnswers = (formValues.fields ?? {}) as Record<string, unknown>;

    setIsSaving(true);

    const updates = programFields.map((f) => {
      const newVal = fieldAnswers[f.field_key];
      const existing = valueMap[f.id];

      if (!newVal || newVal === "") {
        // If there's an existing value and new value is empty, keep as-is (or delete if preferred)
        return Promise.resolve();
      }

      // Convert dayjs objects to ISO string for dates
      let serializedVal: string;
      if (f.field_type === "date" && dayjs.isDayjs(newVal)) {
        serializedVal = newVal.format("YYYY-MM-DD");
      } else {
        serializedVal = String(newVal);
      }

      if (existing) {
        // Update existing
        return new Promise<void>((resolve) =>
          updateValue(
            {
              resource: "enrollment_values",
              id: existing.id,
              values: { value: serializedVal },
            },
            { onSuccess: () => resolve(), onError: () => resolve() }
          )
        );
      } else {
        // Create new (field was added after enrollment)
        return new Promise<void>((resolve) =>
          createValue(
            {
              resource: "enrollment_values",
              values: { enrollment_id: enrollment.id, field_id: f.id, value: serializedVal },
            },
            { onSuccess: () => resolve(), onError: () => resolve() }
          )
        );
      }
    });

    Promise.all(updates).then(() => {
      setIsSaving(false);
      navigate(`/enrollments/show/${enrollment.id}`);
    });
  };

  if (enrollmentLoading) return <Spin style={{ display: "block", margin: "40px auto" }} />;
  if (!enrollment) return <Alert type="error" message="Enrollment not found" />;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(`/enrollments/show/${enrollment.id}`)}
        style={{ marginBottom: 16 }}
      >
        Back to enrollment
      </Button>

      <Card>
        <Title level={4}>Edit {program?.name} Enrollment</Title>
        <Text type="secondary">
          {contact?.first_name} {contact?.last_name}
        </Text>

        <Divider />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
        >
          {fieldsLoading ? (
            <Spin />
          ) : programFields.length === 0 ? (
            <Alert
              type="info"
              message="This program has no fields defined yet."
            />
          ) : (
            programFields.map((f) => (
              <DynamicField key={f.id} field={f} namePrefix="fields" />
            ))
          )}

          <Divider />
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={isSaving}
            >
              Save Changes
            </Button>
            <Button onClick={() => navigate(`/enrollments/show/${enrollment.id}`)}>
              Cancel
            </Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
};
