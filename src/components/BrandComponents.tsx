/**
 * BASICS International Branding Components
 * Uses the real logo image and exact brand colors.
 */
import React from "react";
import { Typography } from "antd";
import { BASICS_COLORS } from "../brand";

const { Text } = Typography;

/** Sidebar logo — shows real logo image, collapses to icon when sidebar is narrow */
export const BrandLogo = ({ collapsed }: { collapsed?: boolean }) => (
  <div
    style={{
      padding: collapsed ? "12px 8px" : "12px 16px",
      borderBottom: `1px solid ${BASICS_COLORS.secondaryLight}`,
      display: "flex",
      alignItems: "center",
      justifyContent: collapsed ? "center" : "flex-start",
      gap: 10,
      minHeight: 64,
      background: BASICS_COLORS.secondary,
    }}
  >
    {/* Real BASICS logo image */}
    <img
      src="/basics-logo.jpg"
      alt="BASICS International"
      style={{
        width: collapsed ? 36 : 40,
        height: collapsed ? 36 : 40,
        borderRadius: 6,
        objectFit: "cover",
        flexShrink: 0,
      }}
    />

    {!collapsed && (
      <div style={{ overflow: "hidden", lineHeight: 1.2 }}>
        <div
          style={{
            color: "#ffffff",
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          B.A.S.I.C.S International
        </div>
        <div
          style={{
            color: BASICS_COLORS.gold,
            fontWeight: 400,
            fontSize: 9,
            letterSpacing: "0.05em",
            whiteSpace: "nowrap",
            marginTop: 2,
          }}
        >
          Breaking Cycles. Building Futures.
        </div>
      </div>
    )}
  </div>
);

/** Login page branding — big logo + org name + tagline */
export const BrandHeader = () => (
  <div style={{ textAlign: "center", marginBottom: 28 }}>
    <img
      src="/basics-logo.jpg"
      alt="BASICS International"
      style={{
        width: 96,
        height: 96,
        borderRadius: 12,
        objectFit: "cover",
        marginBottom: 16,
        boxShadow: "0 4px 20px rgba(26,92,42,0.25)",
      }}
    />
    <div
      style={{
        color: BASICS_COLORS.secondary,
        fontWeight: 800,
        fontSize: 18,
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
        marginTop: 4,
        letterSpacing: "0.04em",
      }}
    >
      Breaking Cycles. Building Futures.
    </div>
    <div
      style={{
        color: BASICS_COLORS.textSecondary,
        fontSize: 11,
        marginTop: 6,
      }}
    >
      Community Management System
    </div>
  </div>
);

/** Contact / enrollment status badge with BASICS colors */
export const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { color: string; bg: string; label: string }> = {
    active:   { color: BASICS_COLORS.secondary,  bg: BASICS_COLORS.primaryLight, label: "Active" },
    lead:     { color: BASICS_COLORS.gold,     bg: BASICS_COLORS.goldLight,    label: "Lead" },
    inactive: { color: "#888",                 bg: "#F0F0F0",                  label: "Inactive" },
  };
  const cfg = config[status] ?? { color: "#666", bg: "#f0f0f0", label: status };
  return (
    <span
      style={{
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.color}40`,
        borderRadius: 4,
        padding: "2px 8px",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}
    >
      {cfg.label}
    </span>
  );
};

/** Page header strip — dark forest green gradient with white text */
export const PageHeader = ({
  title,
  subtitle,
  extra,
}: {
  title: string;
  subtitle?: string;
  extra?: React.ReactNode;
}) => (
  <div
    style={{
      background: `linear-gradient(135deg, ${BASICS_COLORS.secondary} 0%, ${BASICS_COLORS.secondaryLight} 60%, ${BASICS_COLORS.primary}55 100%)`,
      borderRadius: 8,
      padding: "14px 20px",
      marginBottom: 20,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 12,
      borderLeft: `4px solid ${BASICS_COLORS.primary}`,
    }}
  >
    <div>
      <Text style={{ color: "#fff", fontWeight: 700, fontSize: 17, display: "block" }}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2, display: "block" }}>
          {subtitle}
        </Text>
      )}
    </div>
    {extra && <div>{extra}</div>}
  </div>
);
