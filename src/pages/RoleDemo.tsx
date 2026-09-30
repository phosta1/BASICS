import { Card, Row, Col, Typography, Space, Divider, Alert, Button } from 'antd';
import {
  TeamOutlined,
  AppstoreOutlined,
  SettingOutlined,
  UsergroupAddOutlined,
  FileTextOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { RoleDisplay, RoleBadge } from '../components/RoleDisplay';
import { AdminOnly, EditorOrAdmin } from '../components/RoleGuard';
import { ActionButtons } from '../components/ActionButtons';
import { usePermissions } from '../hooks/usePermissions';

const { Title, Text, Paragraph } = Typography;

export const RoleDemo = () => {
  const permissions = usePermissions();

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <Title level={2}>
          <Space>
            <SettingOutlined />
            Role-Based Access Control Demo
          </Space>
        </Title>
        <Paragraph>
          This page demonstrates how the CRM system controls access based on user roles.
          The content you see below changes based on your current role: <RoleBadge />
        </Paragraph>
      </div>

      {/* Current User Role */}
      <RoleDisplay showDetails showAlert />

      <Divider />

      {/* Permission Examples */}
      <Title level={3}>Feature Access Examples</Title>
      
      <Row gutter={[16, 16]}>
        {/* Contacts Section */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <TeamOutlined />
                Contact Management
              </Space>
            }
            bordered
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph>
                All users can view contacts, but only editors and admins can make changes.
              </Paragraph>

              <ActionButtons
                resourceType="contacts"
                onCreate={() => alert('Create Contact clicked!')}
                onEdit={() => alert('Edit Contact clicked!')}
                onView={() => alert('View Contact clicked!')}
                onDelete={() => alert('Delete Contact clicked!')}
                createText="New Contact"
                editText="Edit Contact"
                viewText="View Contact"
                deleteText="Delete Contact"
              />

              <Divider size="small" />

              <Text type="secondary">
                <strong>Your permissions:</strong>
              </Text>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>View: {permissions.contacts.view ? '✅ Yes' : '❌ No'}</li>
                <li>Create: {permissions.contacts.create ? '✅ Yes' : '❌ No'}</li>
                <li>Edit: {permissions.contacts.edit ? '✅ Yes' : '❌ No'}</li>
                <li>Delete: {permissions.contacts.delete ? '✅ Yes' : '❌ No'}</li>
              </ul>
            </Space>
          </Card>
        </Col>

        {/* Programs Section */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <AppstoreOutlined />
                Program Management
              </Space>
            }
            bordered
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph>
                Program management follows the same pattern as contacts.
              </Paragraph>

              <ActionButtons
                resourceType="programs"
                onCreate={() => alert('Create Program clicked!')}
                onEdit={() => alert('Edit Program clicked!')}
                onView={() => alert('View Program clicked!')}
                onDelete={() => alert('Delete Program clicked!')}
                createText="New Program"
                editText="Edit Program"
                viewText="View Program"
                deleteText="Delete Program"
              />

              <Divider size="small" />

              <Text type="secondary">
                <strong>Your permissions:</strong>
              </Text>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>View: {permissions.programs.view ? '✅ Yes' : '❌ No'}</li>
                <li>Create: {permissions.programs.create ? '✅ Yes' : '❌ No'}</li>
                <li>Edit: {permissions.programs.edit ? '✅ Yes' : '❌ No'}</li>
                <li>Delete: {permissions.programs.delete ? '✅ Yes' : '❌ No'}</li>
              </ul>
            </Space>
          </Card>
        </Col>

        {/* Admin Features */}
        <Col xs={24}>
          <Card
            title={
              <Space>
                <SettingOutlined />
                Admin-Only Features
              </Space>
            }
            bordered
          >
            <AdminOnly
              fallback={
                <Alert
                  message="Admin Access Required"
                  description="The features below are only available to administrators. You would need admin privileges to access user management and system configuration."
                  type="warning"
                  showIcon
                />
              }
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Alert
                  message="Admin Features Available"
                  description="As an administrator, you have access to all system management features."
                  type="success"
                  showIcon
                />

                <Row gutter={16}>
                  <Col xs={24} sm={12} md={8}>
                    <Card size="small" title="User Management" bordered={false} style={{ backgroundColor: '#f6ffed' }}>
                      <Space direction="vertical">
                        <Button 
                          icon={<UsergroupAddOutlined />}
                          onClick={() => alert('User Management clicked!')}
                        >
                          Manage Users
                        </Button>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Create, edit, and manage user roles
                        </Text>
                      </Space>
                    </Card>
                  </Col>

                  <Col xs={24} sm={12} md={8}>
                    <Card size="small" title="Field Builder" bordered={false} style={{ backgroundColor: '#f6ffed' }}>
                      <Space direction="vertical">
                        <Button 
                          icon={<DatabaseOutlined />}
                          onClick={() => alert('Field Builder clicked!')}
                        >
                          Custom Fields
                        </Button>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Create custom contact and program fields
                        </Text>
                      </Space>
                    </Card>
                  </Col>

                  <Col xs={24} sm={12} md={8}>
                    <Card size="small" title="System Settings" bordered={false} style={{ backgroundColor: '#f6ffed' }}>
                      <Space direction="vertical">
                        <Button 
                          icon={<SettingOutlined />}
                          onClick={() => alert('System Settings clicked!')}
                        >
                          Settings
                        </Button>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Configure system-wide settings
                        </Text>
                      </Space>
                    </Card>
                  </Col>
                </Row>
              </Space>
            </AdminOnly>
          </Card>
        </Col>

        {/* Editor Features */}
        <Col xs={24}>
          <Card
            title={
              <Space>
                <FileTextOutlined />
                Editor & Admin Features
              </Space>
            }
            bordered
          >
            <EditorOrAdmin
              fallback={
                <Alert
                  message="Editor Access Required"
                  description="The features below require editor or administrator privileges. Viewers can see this information but cannot make changes."
                  type="info"
                  showIcon
                />
              }
            >
              <Alert
                message="Editor Features Available"
                description="As an editor or administrator, you can create and modify content throughout the system."
                type="success"
                showIcon
              />
              
              <div style={{ marginTop: '16px' }}>
                <Space wrap>
                  <Button type="primary" onClick={() => alert('Create clicked!')}>
                    Create New Items
                  </Button>
                  <Button onClick={() => alert('Edit clicked!')}>
                    Edit Existing Items
                  </Button>
                  <Button onClick={() => alert('Bulk Actions clicked!')}>
                    Bulk Actions
                  </Button>
                  <Button onClick={() => alert('Export clicked!')}>
                    Export Data
                  </Button>
                </Space>
              </div>
            </EditorOrAdmin>
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* Role Explanation */}
      <Card title="Role Definitions" bordered>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card size="small" title="👁️ Viewer" bordered={false} style={{ backgroundColor: '#e6f4ff' }}>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>View all contacts and data</li>
                <li>Search and filter information</li>
                <li>View program enrollments</li>
                <li>Export reports (read-only)</li>
              </ul>
              <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '8px' }}>
                Perfect for sales team members who need to reference client information.
              </Text>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card size="small" title="✏️ Editor" bordered={false} style={{ backgroundColor: '#f6ffed' }}>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>All viewer permissions</li>
                <li>Create and edit contacts</li>
                <li>Manage programs</li>
                <li>Handle enrollments</li>
                <li>Add notes and updates</li>
              </ul>
              <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '8px' }}>
                Ideal for account managers and staff who actively manage client relationships.
              </Text>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card size="small" title="⚙️ Administrator" bordered={false} style={{ backgroundColor: '#fff2e8' }}>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>All editor permissions</li>
                <li>User management</li>
                <li>Custom field creation</li>
                <li>System configuration</li>
                <li>Role assignment</li>
              </ul>
              <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '8px' }}>
                For system administrators who configure and maintain the CRM.
              </Text>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};