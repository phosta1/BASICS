import { Create, Edit, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";
import type { Program } from "../../types";

const ProgramFormFields = ({ formProps }: { formProps: any }) => (
  <Form {...formProps} layout="vertical">
    <Form.Item label="Program Name" name="name" rules={[{ required: true }]}>
      <Input placeholder="e.g. Education Program" />
    </Form.Item>
    <Form.Item label="Description" name="description">
      <Input.TextArea rows={3} placeholder="What is this program about?" />
    </Form.Item>
  </Form>
);

export const ProgramCreate = () => {
  const { formProps, saveButtonProps } = useForm<Program>();
  return (
    <Create saveButtonProps={saveButtonProps} title="Create Program">
      <ProgramFormFields formProps={formProps} />
    </Create>
  );
};

export const ProgramEdit = () => {
  const { formProps, saveButtonProps } = useForm<Program>();
  return (
    <Edit saveButtonProps={saveButtonProps} title="Edit Program">
      <ProgramFormFields formProps={formProps} />
    </Edit>
  );
};
