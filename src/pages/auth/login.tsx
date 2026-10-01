import { useState } from "react";
import { useLogin } from "@refinedev/core";
import { Form, Input, Button, Alert } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import { BASICS_COLORS } from "../../brand";

export const LoginPage = () => {
  const { mutate: login, isLoading } = useLogin<{ email: string; password: string }>();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (values: { email: string; password: string }) => {
    setError(null);
    login(values, {
      onError: (err: any) => {
        setError(err?.message ?? "Invalid email or password.");
      },
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(160deg, ${BASICS_COLORS.secondary} 0%, #1A5C24 50%, ${BASICS_COLORS.secondary} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Thin brand accent bar at top */}
      <div
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          height: 4,
          background: BASICS_COLORS.primary,
          zIndex: 10,
        }}
      />

      {/* The card — fixed width, height driven by content only */}
      <div
        style={{
          width: 400,
          background: "#fff",
          borderRadius: 14,
          padding: "36px 36px 24px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          borderTop: `4px solid ${BASICS_COLORS.primary}`,
        }}
      >
        {/* Logo + title */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img
            src="/basics-logo.jpg"
            alt="BASICS International"
            style={{
              width: 80,
              height: 80,
              borderRadius: 12,
              objectFit: "cover",
              marginBottom: 14,
              boxShadow: "0 4px 16px rgba(44,142,59,0.3)",
            }}
          />
          <div
            style={{
              color: BASICS_COLORS.secondary,
              fontWeight: 800,
              fontSize: 17,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              lineHeight: 1.2,
            }}
          >
            B.A.S.I.C.S International
          </div>
          <div
            style={{
              color: BASICS_COLORS.primary,
              fontSize: 12,
              fontWeight: 600,
              marginTop: 3,
              letterSpacing: "0.04em",
            }}
          >
            Breaking Cycles. Building Futures.
          </div>
          <div style={{ color: "#888", fontSize: 11, marginTop: 4 }}>
            Community Management System
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <Alert
            type="error"
            message={error}
            showIcon
            style={{ marginBottom: 16, borderRadius: 8 }}
          />
        )}

        {/* Sign-in form */}
        <Form layout="vertical" onFinish={handleSubmit} requiredMark={false}>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Enter a valid email" },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: BASICS_COLORS.primary }} />}
              placeholder="you@example.com"
              size="large"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Password is required" }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: BASICS_COLORS.primary }} />}
              placeholder="••••••••"
              size="large"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={isLoading}
              block
              style={{
                background: BASICS_COLORS.primary,
                borderColor: BASICS_COLORS.primary,
                borderRadius: 8,
                fontWeight: 600,
                height: 44,
              }}
            >
              Sign in
            </Button>
          </Form.Item>
        </Form>

        {/* Footer */}
        <div
          style={{
            marginTop: 20,
            paddingTop: 14,
            borderTop: `1px solid #eee`,
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: 10, color: "#aaa" }}>
            © {new Date().getFullYear()} B.A.S.I.C.S International · Community Management System
          </span>
        </div>
      </div>
    </div>
  );
};
