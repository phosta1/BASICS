import { Create, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, Select, InputNumber, DatePicker } from "antd";
import type { Deal, Contact } from "../../types";

const DealFormFields = ({ formProps }: { formProps: any }) => {
  const { selectProps: contactSelectProps } = useSelect<Contact>({
    resource: "contacts",
    optionLabel: (item) => `${item.first_name} ${item.last_name}`,
    optionValue: "id",
  });

  return (
    <Form {...formProps} layout="vertical">
      <Form.Item label="Contact" name="contact_id" rules={[{ required: true }]}>
        <Select
          {...contactSelectProps}
          placeholder="Select a contact"
          showSearch
          filterOption={false}
        />
      </Form.Item>
      <Form.Item label="Deal Title" name="title" rules={[{ required: true }]}>
        <Input placeholder="e.g. Annual software license" />
      </Form.Item>
      <Form.Item label="Value ($)" name="value" rules={[{ required: true }]}>
        <InputNumber
          min={0}
          precision={2}
          style={{ width: "100%" }}
          placeholder="0.00"
        />
      </Form.Item>
      <Form.Item label="Stage" name="stage" initialValue="prospecting" rules={[{ required: true }]}>
        <Select
          options={[
            { label: "Prospecting", value: "prospecting" },
            { label: "Proposal", value: "proposal" },
            { label: "Negotiation", value: "negotiation" },
            { label: "Won", value: "won" },
            { label: "Lost", value: "lost" },
          ]}
        />
      </Form.Item>
      <Form.Item label="Expected Close Date" name="close_date">
        <DatePicker style={{ width: "100%" }} />
      </Form.Item>
    </Form>
  );
};

export const DealCreate = () => {
  const { formProps, saveButtonProps } = useForm<Deal>();
  return (
    <Create saveButtonProps={saveButtonProps}>
      <DealFormFields formProps={formProps} />
    </Create>
  );
};

export const DealEdit = () => {
  const { formProps, saveButtonProps } = useForm<Deal>();
  return (
    <Create saveButtonProps={saveButtonProps} title="Edit Deal">
      <DealFormFields formProps={formProps} />
    </Create>
  );
};
