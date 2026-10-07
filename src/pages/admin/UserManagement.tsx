/**
 * UserManagement — admin-only page
 *
 * Uses supabaseClient directly (not Refine useList) to avoid the RLS
 * recursive-subquery issue that causes an empty result set when admins
 * try to list all users via the Refine data provider.
 *
 * Features:
 * - List all registered users with their roles
 * - Inline role change (viewer / editor / admin)
 * - Invite a new user by email (sends a magic-link / signup email via Supabase Auth)
 */
import React, { useEffect, useState, useCallback } from "react";
import { useGetIdentity } from "@refinedev/core";
import {
  Card, Table, Tag, Select, Typography, Space, Avatar,
  Tooltip, Alert, Button, Form, Input, Modal, message,
  Divider, Badge,
} from "antd";
import {
  UserOutlined, CrownOutlined, EditOutlined, SafetyOutlined,
  UserAddOutlined, MailOutlined, ReloadOutlined,
} from "@ant-design/icons";
import { supabaseClient } from "../../supabaseClient";
import { BASICS_COLORS } from "../../brand";
import { PageHeader } from "../../components/BrandComponents";
import { getUserFriendlyErrorMessage } from "../../utils/errorMessages";
import type { UserProfile } from "../../types";

const { Text } = Typography;

interface Identity { id: string; name: string }

const roleConfig: Record<
  UserProfile["role"],
  { label: string; color: string; antColor: string; icon: React.ReactNode; description: string }
> = {
  viewer: {
    label: "Viewer",
    color: BASICS_COLORS.textSecondary,
    antColor: "default",
    icon: <UserOutlined />,
    description: "Can search and view contacts and enrollment data. Read-only.",
  },
  editor: {
    label: "Editor",
    color: BASICS_COLORS.secondary,
    antColor: "green",
    icon: <EditOutlined />,
    description: "Can create and edit contacts, enroll contacts in programs, add notes.",
  },
  admin: {
    label: "Admin",
    color: BASICS_COLORS.gold,
    antColor: "gold",
    icon: <CrownOutlined />,
    description: "Full access including program builder, field builder, and user management.",
  },
};

export const UserManagement = () => {
  const { data: identity } = useGetIdentity<Identity>();
  const currentUserId = identity?.id;

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  // ── Fetch all user profiles directly via supabaseClient ──────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabaseClient
      .from("user_profiles")
      .select("id, email, role, created_at")
      .order("created_at", { ascending: true });

    if (err) {
      setError(err.message);
    } else {
      setUsers(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Role change ───────────────────────────────────────────────────────────
  const handleRoleChange = async (userId: string, newRole: UserProfile["role"]) => {
    setUpdatingId(userId);
    const { error: err } = await supabaseClient
      .from("user_profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (err) {
      message.error(getUserFriendlyErrorMessage(err));
    } else {
      message.success("Role updated successfully");
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    }
    setUpdatingId(null);
  };

  // ── Invite new user ───────────────────────────────────────────────────────
  const handleInvite = async (values: { email: string; role: UserProfile["role"] }) => {
    setInviteLoading(true);
    try {
      // Use signUp — Supabase sends a confirmation email.
      // The trigger will auto-create a user_profiles row with role='viewer'.
      // We then immediately upsert the desired role.
      const { data: signUpData, error: signUpErr } = await supabaseClient.auth.signUp({
        email: values.email,
        password: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + "A1!",
        options: {
          // Prevent auto-login — the new user gets an email to set their own password
          emailRedirectTo: window.location.origin + "/login",
        },
      });

      if (signUpErr) throw signUpErr;

      // If the user already exists, signUp returns a fake/empty user — handle gracefully
      const newUserId = signUpData?.user?.id;
      if (newUserId) {
        // Upsert the profile with the desired role
        await supabaseClient.from("user_profiles").upsert({
          id: newUserId,
          email: values.email,
          role: values.role,
        });
      }

      message.success(
        `Invite sent to ${values.email}. They will receive an email to set their password and log in.`
      );
      setInviteOpen(false);
      form.resetFields();
      await fetchUsers();
    } catch (err: unknown) {
      const msg = getUserFriendlyErrorMessage(err);
      message.error(msg);
    }
    setInviteLoading(false);
  };

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Invite users and assign roles to control their access"
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchUsers}
              loading={loading}
              style={{ borderColor: "rgba(255,255,255,0.4)", color: "#fff", background: "transparent" }}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => setInviteOpen(true)}
              style={{ background: BASICS_COLORS.primary, borderColor: BASICS_COLORS.primary }}
            >
              Invite User
            </Button>
          </Space>
        }
      />

      {/* Role legend */}
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 20 }}
        message="Role Permissions"
        description={
          <Space wrap size={[16, 4]}>
            {Object.entries(roleConfig).map(([role, cfg]) => (
              <span key={role}>
                <Tag color={cfg.antColor} icon={cfg.icon}>{cfg.label}</Tag>
                <Text type="secondary" style={{ fontSize: 12 }}>{cfg.description}</Text>
              </span>
            ))}
          </Space>
        }
      />

      {error && (
        <Alert
          type="error"
          showIcon
          message="Could not load users"
          description={
            <span>
              {error}
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Make sure the SQL fix (section 13 of supabase-schema.sql) has been run in Supabase.
              </Text>
            </span>
          }
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" onClick={fetchUsers}>Retry</Button>
          }
        />
      )}

      <Card>
        <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Text type="secondary">{users.length} user{users.length !== 1 ? "s" : ""} registered</Text>
          <Badge
            count={users.filter((u) => u.role === "admin").length}
            style={{ background: BASICS_COLORS.gold }}
            title="Admins"
          >
            <Tag color="gold" icon={<CrownOutlined />}>Admins</Tag>
          </Badge>
        </div>

        <Table<UserProfile>
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          size="middle"
        >
          <Table.Column
            title="User"
            render={(_: unknown, record: UserProfile) => (
              <Space>
                <Avatar
                  icon={<UserOutlined />}
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(record.email)}&background=5DC269&color=fff&size=32`}
                  size={36}
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
            title="Role"
            width={110}
            render={(role: UserProfile["role"]) => {
              const cfg = roleConfig[role] ?? roleConfig.viewer;
              return <Tag color={cfg.antColor} icon={cfg.icon}>{cfg.label}</Tag>;
            }}
          />

          <Table.Column
            title="Change Role"
            width={160}
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
                  style={{ width: 140 }}
                  loading={updatingId === record.id}
                  disabled={updatingId === record.id}
                  onChange={(newRole) => handleRoleChange(record.id, newRole)}
                  options={[
                    { label: <Space size={4}><UserOutlined />Viewer</Space>,  value: "viewer" },
                    { label: <Space size={4}><EditOutlined />Editor</Space>,  value: "editor" },
                    { label: <Space size={4}><CrownOutlined />Admin</Space>,  value: "admin"  },
                  ]}
                />
              );
            }}
          />
        </Table>
      </Card>

      {/* ── Invite User Modal ── */}
      <Modal
        title={
          <Space>
            <UserAddOutlined style={{ color: BASICS_COLORS.primary }} />
            Invite a New User
          </Space>
        }
        open={inviteOpen}
        onCancel={() => { setInviteOpen(false); form.resetFields(); }}
        footer={null}
        width={440}
      >
        <Divider style={{ margin: "12px 0" }} />
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="The user will receive an email to confirm their account and set a password."
        />
        <Form form={form} layout="vertical" onFinish={handleInvite}>
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: "Please enter an email" },
              { type: "email", message: "Enter a valid email address" },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: BASICS_COLORS.primary }} />}
              placeholder="user@example.com"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="role"
            label="Assign Role"
            initialValue="viewer"
            rules={[{ required: true }]}
          >
            <Select size="large">
              <Select.Option value="viewer">
                <Space><UserOutlined />Viewer — read-only access</Space>
              </Select.Option>
              <Select.Option value="editor">
                <Space><EditOutlined />Editor — can create and edit contacts</Space>
              </Select.Option>
              <Select.Option value="admin">
                <Space><CrownOutlined />Admin — full access</Space>
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={() => { setInviteOpen(false); form.resetFields(); }}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={inviteLoading}
                icon={<MailOutlined />}
                style={{ background: BASICS_COLORS.primary, borderColor: BASICS_COLORS.primary }}
              >
                Send Invite
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
