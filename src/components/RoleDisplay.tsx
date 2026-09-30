import React from 'react';
import { Card, Tag, Typography, Space, Descriptions, Tooltip, Alert } from 'antd';
import {
  EyeOutlined,
  EditOutlined,
  SettingOutlined,
  UserOutlined,
  TeamOutlined,
  AppstoreOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { usePermissions } from '../hooks/usePermissions';

const { Text } = Typography;

interface RoleDisplayProps {
  showDetails?: boolean;
  showAlert?: boolean;
  size?: 'small' | 'default';
}

const roleConfig = {
  viewer: {
    color: 'blue',
    icon: <EyeOutlined />,
    title: 'Viewer',
    description: 'Can view all data but cannot make changes'
  },
  editor: {
    color: 'green',
    icon: <EditOutlined />,
    title: 'Editor',
    description: 'Can view, create, and edit contacts and programs'
  },
  admin: {
    color: 'red',
    icon: <SettingOutlined />,
    title: 'Administrator',
    description: 'Full access including user management and system configuration'
  }
};

export const RoleDisplay: React.FC<RoleDisplayProps> = ({
  showDetails = false,
  showAlert = false,
  size = 'default'
}) => {
  const permissions = usePermissions();
  const config = roleConfig[permissions.role as keyof typeof roleConfig];

  if (!config) {
    return null;
  }

  const RoleTag = (
    <Tag
      color={config.color}
      icon={config.icon}
      style={{
        fontSize: size === 'small' ? '12px' : '14px',
        padding: size === 'small' ? '2px 8px' : '4px 12px'
      }}
    >
      {config.title}
    </Tag>
  );

  if (!showDetails && !showAlert) {
    return RoleTag;
  }

  return (
    <div>
      {showAlert && (
        <Alert
          message={
            <Space>
              <Text strong>Your Role:</Text>
              {RoleTag}
            </Space>
          }
          description={config.description}
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: showDetails ? 16 : 0 }}
        />
      )}

      {showDetails && (
        <Card
          size="small"
          title={
            <Space>
              <UserOutlined />
              Role &amp; Permissions
            </Space>
          }
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Current Role: </Text>
              {RoleTag}
            </div>

            <Text type="secondary">{config.description}</Text>

            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item
                label={
                  <Space>
                    <TeamOutlined />
                    <span>Contacts</span>
                  </Space>
                }
              >
                <Space wrap>
                  {permissions.contacts.view && <Tag color="blue">View</Tag>}
                  {permissions.contacts.create && <Tag color="green">Create</Tag>}
                  {permissions.contacts.edit && <Tag color="orange">Edit</Tag>}
                  {permissions.contacts.delete && <Tag color="red">Delete</Tag>}
                </Space>
              </Descriptions.Item>

              <Descriptions.Item
                label={
                  <Space>
                    <AppstoreOutlined />
                    <span>Programs</span>
                  </Space>
                }
              >
                <Space wrap>
                  {permissions.programs.view && <Tag color="blue">View</Tag>}
                  {permissions.programs.create && <Tag color="green">Create</Tag>}
                  {permissions.programs.edit && <Tag color="orange">Edit</Tag>}
                  {permissions.programs.delete && <Tag color="red">Delete</Tag>}
                </Space>
              </Descriptions.Item>

              <Descriptions.Item
                label={
                  <Space>
                    <SettingOutlined />
                    <span>Administration</span>
                  </Space>
                }
              >
                <Space wrap>
                  {permissions.administration.manageUsers ? (
                    <>
                      <Tag color="purple">User Management</Tag>
                      <Tag color="purple">Field Builder</Tag>
                      <Tag color="purple">System Settings</Tag>
                    </>
                  ) : (
                    <Tag>No Admin Access</Tag>
                  )}
                </Space>
              </Descriptions.Item>
            </Descriptions>

            {permissions.role === 'viewer' && (
              <Alert
                message="Limited Access"
                description="As a Viewer, you can browse and search all data but cannot make changes. Contact an Administrator if you need additional permissions."
                type="info"
                showIcon
              />
            )}
          </Space>
        </Card>
      )}
    </div>
  );
};

// Compact version for headers/toolbars
export const RoleBadge: React.FC = () => {
  const permissions = usePermissions();
  const config = roleConfig[permissions.role as keyof typeof roleConfig];

  if (!config) return null;

  return (
    <Tooltip title={config.description}>
      <Tag
        color={config.color}
        icon={config.icon}
        style={{ cursor: 'help' }}
      >
        {config.title}
      </Tag>
    </Tooltip>
  );
};
