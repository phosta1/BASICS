import { Card, Typography } from "antd";
import { FieldBuilder } from "../../components/FieldBuilder";

const { Title, Text } = Typography;

/**
 * Admin-only page.
 * Lets admins define extra fields that appear on every Contact form/detail.
 */
export const ContactFieldAdmin = () => (
  <Card>
    <Title level={4}>Contact Form Fields</Title>
    <Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
      Add extra fields that will appear on all contact records (e.g. "Profile Picture", "ID Number",
      "Date of Birth"). These appear alongside the built-in fields (name, email, phone).
    </Text>
    <FieldBuilder resource="contact_fields" title="Extra Contact Fields" />
  </Card>
);
