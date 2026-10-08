import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Alert, Spin, Card } from "antd";
import { LockOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { supabaseClient } from "../../supabaseClient";
import { BASICS_COLORS } from "../../brand";
import { getUserFriendlyErrorMessage } from "../../utils/errorMessages";

export const SignupConfirm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [passwordSetLoading, setPasswordSetLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Extract token from URL hash
    const handleCallback = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (!accessToken) {
          setError("Invalid signup link. Please try inviting the user again.");
          setLoading(false);
          return;
        }

        // Set the session directly from the token
        const { error: sessionErr } = await supabaseClient.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || "",
        });

        if (sessionErr) {
          setError("Your signup link has expired. Please request a new invite.");
          setLoading(false);
          return;
        }

        // Get user info
        const { data: userData, error: userErr } = await supabaseClient.auth.getUser();
        if (userErr || !userData.user) {
          setError("Could not load user information.");
          setLoading(false);
          return;
        }

        setUserEmail(userData.user.email || "");
        setLoading(false);
      } catch (err) {
        setError(getUserFriendlyErrorMessage(err));
        setLoading(false);
      }
    };

    handleCallback();
  }, []);

  const handleSetPassword = async (values: { password: string }) => {
    setPasswordSetLoading(true);
    try {
      const { error: err } = await supabaseClient.auth.updateUser({
        password: values.password,
      });

      if (err) {
        setError(getUserFriendlyErrorMessage(err));
      } else {
        // Create user_profiles entry for the new user
        const { data: userData } = await supabaseClient.auth.getUser();
        if (userData.user) {
          const { error: profileErr } = await supabaseClient
            .from('user_profiles')
            .insert([
              {
                id: userData.user.id,
                email: userData.user.email,
                role: 'viewer',  // Default new users to viewer role
                created_at: new Date().toISOString(),
              }
            ]);

          if (profileErr && profileErr.code !== '23505') {  // 23505 = unique violation (already exists)
            console.error('Failed to create user profile:', profileErr);
          }
        }
        setSuccess(true);
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    } catch (err) {
      setError(getUserFriendlyErrorMessage(err));
    }
    setPasswordSetLoading(false);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(160deg, ${BASICS_COLORS.secondary} 0%, #1A5C24 50%, ${BASICS_COLORS.secondary} 100%)`,
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (success) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(160deg, ${BASICS_COLORS.secondary} 0%, #1A5C24 50%, ${BASICS_COLORS.secondary} 100%)`,
        }}
      >
        <Card style={{ width: 400, textAlign: "center" }}>
          <CheckCircleOutlined style={{ fontSize: 48, color: BASICS_COLORS.secondary, marginBottom: 16 }} />
          <h2>Welcome!</h2>
          <p>Your account is ready. Redirecting to the app...</p>
        </Card>
      </div>
    );
  }

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
      <div
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          height: 4,
          background: BASICS_COLORS.primary,
          zIndex: 10,
        }}
      />

      <Card
        style={{
          width: 400,
          borderRadius: 14,
          borderTop: `4px solid ${BASICS_COLORS.primary}`,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h2 style={{ color: BASICS_COLORS.secondary, margin: 0 }}>Complete Your Signup</h2>
          <p style={{ color: "#888", fontSize: 13, marginTop: 4 }}>Set your password for {userEmail}</p>
        </div>

        {error && (
          <Alert
            type="error"
            message={error}
            showIcon
            style={{ marginBottom: 16, borderRadius: 8 }}
          />
        )}

        <Form form={form} layout="vertical" onFinish={handleSetPassword}>
          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: "Password is required" },
              { min: 8, message: "Password must be at least 8 characters" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: BASICS_COLORS.primary }} />}
              placeholder="Create a strong password"
              size="large"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            label="Confirm Password"
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm your password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: BASICS_COLORS.primary }} />}
              placeholder="Confirm your password"
              size="large"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={passwordSetLoading}
              block
              style={{
                background: BASICS_COLORS.primary,
                borderColor: BASICS_COLORS.primary,
                borderRadius: 8,
                fontWeight: 600,
                height: 44,
              }}
            >
              Set Password & Complete Signup
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
