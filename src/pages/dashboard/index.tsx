/**
 * Dynamic Dashboard
 * - Summary stat cards (contacts, enrollments, programs, active contacts)
 * - Enrollments per program (auto-updates as programs are added)
 * - Contacts by status (donut)
 * - Dynamic breakdown charts for every select/text contact field admins create
 * - Recent contacts table
 *
 * All charts update automatically as admin adds new fields and programs.
 */
import { useList } from "@refinedev/core";
import {
  Card, Col, Row, Statistic, Table, Tag, Typography,
  Space, Avatar, Spin, Tabs, Empty,
} from "antd";
import {
  TeamOutlined, AppstoreOutlined, CheckCircleOutlined,
  RiseOutlined, UserOutlined, BarChartOutlined,
} from "@ant-design/icons";
import type { Contact, Program, Enrollment, ContactField, ContactFieldValue } from "../../types";
import { PageHeader } from "../../components/BrandComponents";
import { BASICS_COLORS } from "../../brand";

const { Text } = Typography;

const COLORS = [
  BASICS_COLORS.primary,    // lime green
  BASICS_COLORS.secondary,     // dark forest green
  BASICS_COLORS.gold,       // amber gold
  "#4CAF50",                // medium green
  "#81C784",                // light green
  "#A5D6A7",                // pale green
  "#2E7D32",                // deep green
  "#F9A825",                // deep gold
];

const statusColor: Record<string, string> = {
  lead:     BASICS_COLORS.gold,
  active:   BASICS_COLORS.primary,
  inactive: "#9E9E9E",
};

export const Dashboard = () => {
  // ── Core data ──────────────────────────────────────────────────────────────
  const { data: contactsData, isLoading: loadingContacts } = useList<Contact>({
    resource: "contacts",
    pagination: { pageSize: 2000 },
    sorters: [{ field: "created_at", order: "desc" }],
  });

  const { data: programsData, isLoading: loadingPrograms } = useList<Program>({
    resource: "programs",
    pagination: { pageSize: 200 },
  });

  const { data: enrollmentsData, isLoading: loadingEnrollments } = useList<Enrollment>({
    resource: "enrollments",
    pagination: { pageSize: 10000 },
  });

  // ── Dynamic contact fields ─────────────────────────────────────────────────
  const { data: contactFieldsData } = useList<ContactField>({
    resource: "contact_fields",
    sorters: [{ field: "sort_order", order: "asc" }],
    pagination: { pageSize: 200 },
  });

  const { data: fieldValuesData } = useList<ContactFieldValue>({
    resource: "contact_field_values",
    pagination: { pageSize: 20000 },
  });

  const contacts = contactsData?.data ?? [];
  const programs = programsData?.data ?? [];
  const enrollments = enrollmentsData?.data ?? [];
  const contactFields = contactFieldsData?.data ?? [];
  const fieldValues = fieldValuesData?.data ?? [];

  const isLoading = loadingContacts || loadingPrograms || loadingEnrollments;

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalContacts = contacts.length;
  const totalEnrollments = enrollments.length;
  const totalPrograms = programs.length;
  const activeContacts = contacts.filter((c) => c.status === "active").length;

  // Enrollments per program
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

  // ── Dynamic field breakdowns ───────────────────────────────────────────────
  // Only select/text fields make sense as chart categories.
  // For 'select' fields: group by value.
  // For 'text' fields: count filled vs empty.
  const dynamicCharts = contactFields
    .filter((f) => f.field_type === "select" || f.field_type === "text")
    .map((field, fi) => {
      const valuesForField = fieldValues.filter((v) => v.field_id === field.id);
      const valueMap = Object.fromEntries(valuesForField.map((v) => [v.contact_id, v.value]));

      if (field.field_type === "select" && Array.isArray(field.options) && field.options.length > 0) {
        // Group contacts by their selected option
        const groups = (field.options as string[]).map((opt, oi) => ({
          label: opt,
          count: contacts.filter((c) => valueMap[c.id] === opt).length,
          color: COLORS[(fi * 3 + oi) % COLORS.length],
        }));
        const filled = groups.reduce((sum, g) => sum + g.count, 0);
        const empty = totalContacts - filled;
        if (empty > 0) {
          groups.push({ label: "Not set", count: empty, color: "#d9d9d9" });
        }
        return { field, type: "breakdown" as const, groups };
      }

      // For text/other fields: filled vs not filled
      const filled = contacts.filter((c) => {
        const val = valueMap[c.id];
        return val && val.trim().length > 0;
      }).length;

      return {
        field,
        type: "fillrate" as const,
        groups: [
          { label: "Filled", count: filled, color: "#52c41a" },
          { label: "Empty", count: totalContacts - filled, color: "#f0f0f0" },
        ],
      };
    });

  const recentContacts = contacts.slice(0, 5);

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Spin size="large" />
        <br />
        <Text type="secondary" style={{ marginTop: 16, display: "block" }}>Loading dashboard…</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 4px" }}>
      <PageHeader
        title="Dashboard"
        subtitle="BASICS International · Community Management System"
      />

      {/* ── Summary cards ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={6}>
          <Card style={{ borderTop: `3px solid ${BASICS_COLORS.secondary}` }}>
            <Statistic
              title="Total Contacts"
              value={totalContacts}
              prefix={<TeamOutlined style={{ color: BASICS_COLORS.secondary }} />}
              valueStyle={{ color: BASICS_COLORS.secondary }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card style={{ borderTop: `3px solid ${BASICS_COLORS.primary}` }}>
            <Statistic
              title="Active Contacts"
              value={activeContacts}
              prefix={<CheckCircleOutlined style={{ color: BASICS_COLORS.primary }} />}
              valueStyle={{ color: BASICS_COLORS.primary }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card style={{ borderTop: `3px solid ${BASICS_COLORS.gold}` }}>
            <Statistic
              title="Total Enrollments"
              value={totalEnrollments}
              prefix={<RiseOutlined style={{ color: BASICS_COLORS.gold }} />}
              valueStyle={{ color: BASICS_COLORS.gold }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card style={{ borderTop: `3px solid ${BASICS_COLORS.primaryDark}` }}>
            <Statistic
              title="Programs"
              value={totalPrograms}
              prefix={<AppstoreOutlined style={{ color: BASICS_COLORS.primaryDark }} />}
              valueStyle={{ color: BASICS_COLORS.primaryDark }}
            />
          </Card>
        </Col>
      </Row>

      {/* ── Program enrollments + Status donut ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card title="Enrollments per Program" style={{ height: "100%" }}>
            {programStats.length === 0 ? (
              <Empty description="No programs created yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              programStats.map((p) => (
                <ProgramBar
                  key={p.id}
                  name={p.name}
                  count={p.count}
                  total={totalEnrollments || 1}
                  color={p.color}
                />
              ))
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Contacts by Status" style={{ height: "100%" }}>
            <StatusDonut groups={statusGroups} total={totalContacts} />
          </Card>
        </Col>
      </Row>

      {/* ── Dynamic field charts ── */}
      {dynamicCharts.length > 0 && (
        <Card
          title={
            <Space>
              <BarChartOutlined />
              Contact Field Breakdown
            </Space>
          }
          style={{ marginBottom: 24 }}
          extra={
            <Text type="secondary" style={{ fontSize: 12 }}>
              Auto-generated from your contact fields · {dynamicCharts.length} field{dynamicCharts.length !== 1 ? "s" : ""}
            </Text>
          }
        >
          <Tabs
            items={dynamicCharts.map((chart) => ({
              key: chart.field.id.toString(),
              label: chart.field.label,
              children: (
                <div>
                  {chart.type === "breakdown" ? (
                    <Row gutter={[16, 0]}>
                      <Col xs={24} md={14}>
                        {chart.groups.map((g) => (
                          <ProgramBar
                            key={g.label}
                            name={g.label}
                            count={g.count}
                            total={totalContacts || 1}
                            color={g.color}
                          />
                        ))}
                      </Col>
                      <Col xs={24} md={10}>
                        <StatusDonut
                          groups={chart.groups.map((g) => ({ status: g.label, count: g.count }))}
                          total={totalContacts}
                          colors={Object.fromEntries(chart.groups.map((g) => [g.label, g.color]))}
                        />
                      </Col>
                    </Row>
                  ) : (
                    // Fill rate for text fields
                    <Row gutter={[16, 0]}>
                      <Col xs={24} md={10}>
                        <StatusDonut
                          groups={chart.groups.map((g) => ({ status: g.label, count: g.count }))}
                          total={totalContacts}
                          colors={Object.fromEntries(chart.groups.map((g) => [g.label, g.color]))}
                        />
                      </Col>
                      <Col xs={24} md={14}>
                        <div style={{ paddingTop: 8 }}>
                          {chart.groups.map((g) => (
                            <div key={g.label} style={{ marginBottom: 12 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <Text>{g.label}</Text>
                                <Text type="secondary">
                                  {g.count} contact{g.count !== 1 ? "s" : ""} (
                                  {totalContacts > 0 ? Math.round((g.count / totalContacts) * 100) : 0}%)
                                </Text>
                              </div>
                              <div style={{ height: 8, borderRadius: 4, background: "#f0f0f0", overflow: "hidden" }}>
                                <div
                                  style={{
                                    height: "100%",
                                    width: `${totalContacts > 0 ? (g.count / totalContacts) * 100 : 0}%`,
                                    background: g.color,
                                    borderRadius: 4,
                                    transition: "width 0.6s ease",
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </Col>
                    </Row>
                  )}
                </div>
              ),
            }))}
          />
        </Card>
      )}

      {/* ── Per-program enrollment counts (detailed) ── */}
      {programs.length > 0 && (
        <Card
          title={<Space><AppstoreOutlined />Enrollment Summary by Program</Space>}
          style={{ marginBottom: 24 }}
        >
          <Row gutter={[16, 16]}>
            {programStats.map((p) => (
              <Col key={p.id} xs={12} sm={8} md={6}>
                <Card
                  size="small"
                  style={{ borderTop: `3px solid ${p.color}`, textAlign: "center" }}
                >
                  <Statistic
                    title={<Text ellipsis style={{ fontSize: 12 }}>{p.name}</Text>}
                    value={p.count}
                    valueStyle={{ color: p.color, fontSize: 28 }}
                  />
                  <Text type="secondary" style={{ fontSize: 11 }}>enrolled</Text>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* ── Recent contacts ── */}
      <Card title="Recently Added Contacts">
        {recentContacts.length === 0 ? (
          <Empty description="No contacts yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Table dataSource={recentContacts} rowKey="id" size="small" pagination={false}>
            <Table.Column
              title="Name"
              render={(_: unknown, c: Contact) => (
                <Space>
                  <Avatar size="small" src={c.profile_picture_url} icon={<UserOutlined />} />
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

// ── Program bar ───────────────────────────────────────────────────────────────
const ProgramBar = ({
  name, count, total, color,
}: { name: string; count: number; total: number; color: string }) => {
  const pct = Math.round((count / total) * 100);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={{ fontWeight: 500 }}>{name}</Text>
        <Text type="secondary">{count} ({pct}%)</Text>
      </div>
      <div style={{ height: 10, borderRadius: 5, background: "#f0f0f0", overflow: "hidden" }}>
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

// ── Status donut ──────────────────────────────────────────────────────────────
const StatusDonut = ({
  groups,
  total,
  colors: colorOverrides,
}: {
  groups: { status: string; count: number }[];
  total: number;
  colors?: Record<string, string>;
}) => {
  const defaultColors: Record<string, string> = {
    lead:     BASICS_COLORS.gold,
    active:   BASICS_COLORS.primary,
    inactive: "#d9d9d9",
  };
  const colors = colorOverrides ?? defaultColors;

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
    <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
      <div
        style={{
          width: 120, height: 120, borderRadius: "50%",
          background: gradient, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "var(--ant-color-bg-container, #fff)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{total}</Text>
          <Text type="secondary" style={{ fontSize: 10 }}>total</Text>
        </div>
      </div>
      <div>
        {groups.map((g) => (
          <div key={g.status} style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 12, height: 12, borderRadius: "50%",
              background: colors[g.status] ?? "#aaa", flexShrink: 0,
            }} />
            <Text style={{ textTransform: "capitalize" }}>{g.status}</Text>
            <Text type="secondary">({g.count})</Text>
          </div>
        ))}
      </div>
    </div>
  );
};
