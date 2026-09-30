/**
 * Dashboard
 * Home page showing:
 * - Summary stat cards (total contacts, enrollments, programs, active contacts)
 * - Enrollments per program (bar chart)
 * - Contacts by status (donut chart)
 * - Recent contacts (last 5)
 *
 * All data comes from Supabase via Refine's useList.
 * AWS QuickSight can connect to the same Postgres DB later for deeper analytics.
 */
import { useList } from "@refinedev/core";
import {
  Card, Col, Row, Statistic, Table, Tag, Typography,
  Space, Avatar, Spin,
} from "antd";
import {
  TeamOutlined, AppstoreOutlined, CheckCircleOutlined, RiseOutlined, UserOutlined,
} from "@ant-design/icons";
import type { Contact, Program, Enrollment } from "../../types";

const { Title, Text } = Typography;

// ── Colour palette (matches Ant Design blue theme) ───────────────────────────
const COLORS = ["#1677ff", "#52c41a", "#faad14", "#ff4d4f", "#722ed1", "#13c2c2"];

const statusColor: Record<string, string> = {
  lead: "blue", active: "green", inactive: "default",
};

export const Dashboard = () => {
  // ── Data fetches ────────────────────────────────────────────────────────────
  const { data: contactsData, isLoading: loadingContacts } = useList<Contact>({
    resource: "contacts",
    pagination: { pageSize: 1000 },
    sorters: [{ field: "created_at", order: "desc" }],
  });

  const { data: programsData, isLoading: loadingPrograms } = useList<Program>({
    resource: "programs",
    pagination: { pageSize: 100 },
  });

  const { data: enrollmentsData, isLoading: loadingEnrollments } = useList<Enrollment>({
    resource: "enrollments",
    pagination: { pageSize: 10000 },
  });

  const contacts = contactsData?.data ?? [];
  const programs = programsData?.data ?? [];
  const enrollments = enrollmentsData?.data ?? [];

  const isLoading = loadingContacts || loadingPrograms || loadingEnrollments;

  // ── Derived stats ───────────────────────────────────────────────────────────
  const totalContacts = contacts.length;
  const totalEnrollments = enrollments.length;
  const totalPrograms = programs.length;
  const activeContacts = contacts.filter((c) => c.status === "active").length;

  // Enrollments per program: [{ name, count, color }]
  const programStats = programs
    .map((p, i) => ({
      id: p.id,
      name: p.name,
      count: enrollments.filter((e) => e.program_id === p.id).length,
      color: COLORS[i % COLORS.length],
    }))
    .sort((a, b) => b.count - a.count);

  // Contacts by status
  const statusGroups = ["lead", "active", "inactive"].map((s) => ({
    status: s,
    count: contacts.filter((c) => c.status === s).length,
  }));

  // Recent contacts (first 5 from sorted list)
  const recentContacts = contacts.slice(0, 5);

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Spin size="large" />
        <br />
        <Text type="secondary" style={{ marginTop: 16, display: "block" }}>
          Loading dashboard…
        </Text>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 4px" }}>
      <Title level={4} style={{ marginBottom: 24 }}>
        Dashboard
      </Title>

      {/* ── Summary cards ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Contacts"
              value={totalContacts}
              prefix={<TeamOutlined style={{ color: "#1677ff" }} />}
              valueStyle={{ color: "#1677ff" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Contacts"
              value={activeContacts}
              prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Enrollments"
              value={totalEnrollments}
              prefix={<RiseOutlined style={{ color: "#faad14" }} />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="Programs"
              value={totalPrograms}
              prefix={<AppstoreOutlined style={{ color: "#722ed1" }} />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* ── Enrollments per program ── */}
        <Col xs={24} lg={14}>
          <Card title="Enrollments per Program" style={{ height: "100%" }}>
            {programStats.length === 0 ? (
              <Text type="secondary">No programs created yet.</Text>
            ) : (
              <div>
                {programStats.map((p) => (
                  <ProgramBar
                    key={p.id}
                    name={p.name}
                    count={p.count}
                    total={totalEnrollments || 1}
                    color={p.color}
                  />
                ))}
              </div>
            )}
          </Card>
        </Col>

        {/* ── Contacts by status ── */}
        <Col xs={24} lg={10}>
          <Card title="Contacts by Status" style={{ height: "100%" }}>
            <StatusDonut groups={statusGroups} total={totalContacts} />
          </Card>
        </Col>
      </Row>

      {/* ── Recent contacts ── */}
      <Card title="Recently Added Contacts">
        {recentContacts.length === 0 ? (
          <Text type="secondary">No contacts yet.</Text>
        ) : (
          <Table
            dataSource={recentContacts}
            rowKey="id"
            size="small"
            pagination={false}
          >
            <Table.Column
              title="Name"
              render={(_: unknown, c: Contact) => (
                <Space>
                  <Avatar
                    size="small"
                    src={c.profile_picture_url}
                    icon={<UserOutlined />}
                  />
                  {c.first_name} {c.last_name}
                </Space>
              )}
            />
            <Table.Column dataIndex="email" title="Email" />
            <Table.Column dataIndex="company" title="Company" />
            <Table.Column
              dataIndex="status"
              title="Status"
              render={(v: string) => (
                <Tag color={statusColor[v] ?? "default"}>{v?.toUpperCase()}</Tag>
              )}
            />
            <Table.Column
              dataIndex="created_at"
              title="Added"
              render={(v: string) => new Date(v).toLocaleDateString()}
            />
          </Table>
        )}
      </Card>
    </div>
  );
};

// ── Program bar component ─────────────────────────────────────────────────────
const ProgramBar = ({
  name, count, total, color,
}: {
  name: string; count: number; total: number; color: string;
}) => {
  const pct = Math.round((count / total) * 100);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={{ fontWeight: 500 }}>{name}</Text>
        <Text type="secondary">
          {count} enrolled ({pct}%)
        </Text>
      </div>
      <div
        style={{
          height: 10,
          borderRadius: 5,
          background: "#f0f0f0",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.max(pct, count > 0 ? 2 : 0)}%`,
            background: color,
            borderRadius: 5,
            transition: "width 0.6s ease",
          }}
        />
      </div>
    </div>
  );
};

// ── Status donut (CSS-only, no chart lib needed) ──────────────────────────────
const StatusDonut = ({
  groups,
  total,
}: {
  groups: { status: string; count: number }[];
  total: number;
}) => {
  const colors: Record<string, string> = {
    lead: "#1677ff", active: "#52c41a", inactive: "#d9d9d9",
  };

  // Build conic-gradient segments
  let offset = 0;
  const segments = groups
    .filter((g) => g.count > 0)
    .map((g) => {
      const pct = (g.count / (total || 1)) * 100;
      const seg = `${colors[g.status] ?? "#aaa"} ${offset}% ${offset + pct}%`;
      offset += pct;
      return seg;
    });

  const gradient =
    segments.length > 0
      ? `conic-gradient(${segments.join(", ")})`
      : "conic-gradient(#f0f0f0 0% 100%)";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      {/* Donut ring */}
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: gradient,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Hole */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "var(--ant-color-bg-container, #fff)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{total}</Text>
          <Text type="secondary" style={{ fontSize: 10 }}>total</Text>
        </div>
      </div>

      {/* Legend */}
      <div>
        {groups.map((g) => (
          <div key={g.status} style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: colors[g.status] ?? "#aaa",
                flexShrink: 0,
              }}
            />
            <Text style={{ textTransform: "capitalize" }}>{g.status}</Text>
            <Text type="secondary">({g.count})</Text>
          </div>
        ))}
      </div>
    </div>
  );
};
