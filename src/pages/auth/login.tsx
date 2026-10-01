import { AuthPage } from "@refinedev/antd";
import { BrandHeader } from "../../components/BrandComponents";
import { BASICS_COLORS } from "../../brand";

export const LoginPage = () => (
  <div
    style={{
      minHeight: "100vh",
      background: `linear-gradient(160deg, ${BASICS_COLORS.secondary} 0%, #1A5C24 50%, ${BASICS_COLORS.secondary} 100%)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
    }}
  >
    {/* Decorative top bar in brand green */}
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        background: BASICS_COLORS.primary,
      }}
    />

    <div
      style={{
        width: "100%",
        maxWidth: 420,
        background: "#ffffff",
        borderRadius: 12,
        padding: "36px 32px 28px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
        borderTop: `4px solid ${BASICS_COLORS.primary}`,
      }}
    >
      <BrandHeader />

      <AuthPage
        type="login"
        rememberMe={false}
        forgotPasswordLink={false}
        registerLink={false}
        renderContent={(content) => content}
        title={false}
        wrapperProps={{ style: { padding: 0, background: "transparent" } }}
        contentProps={{ style: { padding: 0, boxShadow: "none", background: "transparent" } }}
      />

      <div
        style={{
          marginTop: 20,
          textAlign: "center",
          borderTop: `1px solid ${BASICS_COLORS.borderColor}`,
          paddingTop: 14,
        }}
      >
        <span style={{ fontSize: 10, color: BASICS_COLORS.textSecondary }}>
          © {new Date().getFullYear()} B.A.S.I.C.S International · Community Management System
        </span>
      </div>
    </div>
  </div>
);
