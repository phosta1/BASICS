/**
 * UserManagement — admin-only page
 * Lists all registered users. Admins can set any user's role to
 * viewer / editor / admin via a dropdown. Cannot change own role.
 */
import { useList, useUpdate, useGetIdentity } from "@refinedev/core";
import {
  Card, Table, Tag, Select, Typography, Space, Avatar,
  Tooltip, Alert,
} from "antd";
import { UserOutlined, CrownOutlined, EditOutlined, SafetyOutlined } from "@ant-design/icons";
import type { UserProfile } from "../../types";

const { Title, Text } = Typography;

interface Identity { id: string; name: string }

const roleConfig: Record<
  UserProfile["role"],
  { label: string; color: string; icon: React.ReactNode; description: string }
> = {
  viewer: {
    label: "Viewer",
    color: "default",
    icon: <UserOutlined />,
    description: "Can search and view contacts and enrollment data. Cannot create or edit.",
  },
  editor: {
    label: "Editor",
    color: "blue",
    icon: <EditOutlined />,
    description: "Can create and edit contacts, enroll contacts in programs, and add notes.",
  },
  admin: {
    label: "Admin",
    color: "gold",
    icon: <CrownOutlined />,
    description: "Full access including program builder, field builder, and user management.",
  },
};

export const UserManagement = () => {
  const { data: identity } = useGetIdentity<Identity>();
  const currentUserId = identity?.id;

  const { data, isLoading, refetch } = useList<UserProfile>({
    resource: "user_profiles",
    pagination: { pageSize: 200 },
    sorters: [{ field: "created_at", order: "asc" }],
  });

  const { mutate: updateProfile } = useUpdate<UserProfile>();

  const users = data?.data ?? [];

  const handleRoleChange = (userId: string, newRole: UserProfile["role"]) => {
    updateProfile(
      { resource: "user_profiles", id: userId, values: { role: newRole } },
      { onSuccess: () => refetch() }
    );
  };

  return (
    <Card>
      <Title level={4} style={{ marginBottom: 4 }}>User Management</Title>
      <Text type="secondary" style={{ display: "block", marginBottom: 20 }}>
        Assign roles to control what each user can do in the system.
      </Text>

      {/* Role legend */}
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 20 }}
        description={
          <Space direction="vertical" size={2}>
            {Object.entries(roleConfig).map(([role, cfg]) => (
              <span key={role}>
                <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>
                {cfg.description}
              </span>
            ))}
          </Space>
        }
        message="Role Permissions"
      />

      <Table<UserProfile>
        dataSource={users}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 20 }}
      >
        <Table.Column
          title="User"
          render={(_: unknown, record: UserProfile) => (
            <Space>
              <Avatar
                icon={<UserOutlined />}
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(record.email)}&background=random&size=32`}
                size={32}
              />
              <div>
                <Text strong style={{ display: "block", lineHeight: 1.3 }}>
                  {record.email}
                </Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Joined {new Date(record.created_at).toLocaleDateString()}
                </Text>
              </div>
            </Space>
          )}
        />

        <Table.Column
          dataIndex="role"
          title="Current Role"
          render={(role: UserProfile["role"]) => {
            const cfg = roleConfig[role];
            return <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>;
          }}
        />

        <Table.Column
          title="Change Role"
          render={(_: unknown, record: UserProfile) => {
            const isSelf = record.id === currentUserId;

            if (isSelf) {
              return (
                <Tooltip title="You cannot change your own role">
                  <Tag icon={<SafetyOutlined />} color="default">Your account</Tag>
                </Tooltip>
              );
            }

            return (
              <Select<UserProfile["role"]>
                value={record.role}
                style={{ width: 130 }}
                onChange={(newRole) => handleRoleChange(record.id, newRole)}
                options={[
                  {
                    label: <Space><UserOutlined />Viewer</Space>,
                    value: "viewer",
                  },
                  {
                    label: <Space><EditOutlined />Editor</Space>,
                    value: "editor",
                  },
                  {
                    label: <Space><CrownOutlined />Admin</Space>,
                    value: "admin",
                  },
                ]}
              />
            );
          }}
        />
      </Table>
    </Card>
  );
};
