import { Card, Typography } from "antd";
import { SponsorFieldBuilder } from "../../components/SponsorFieldBuilder";

const { Title, Text } = Typography;

/**
 * Admin-only page.
 * Lets admins define fields that appear on every Sponsor form/detail.
 */
export const SponsorFieldAdmin = () => {
  return (
    <Card>
      <Title level={4}>Sponsor Form Fields</Title>
      <Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
        Configure fields that will appear on all sponsor records. Manage field types, labels, and
        whether fields are required. Sponsors can be viewed/edited by Admin and Editor roles.
      </Text>
      <SponsorFieldBuilder />
    </Card>
  );
};
