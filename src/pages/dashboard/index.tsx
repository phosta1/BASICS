/**
 * Dynamic Dashboard — admin-configurable, program-field-aware
 */
import { useState, useEffect } from "react";
import { useList } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import {
  Card, Col, Row, Statistic, Table, Tag, Typography,
  Space, Avatar, Spin, Empty, DatePicker, Button,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import {
  TeamOutlined, AppstoreOutlined, CheckCircleOutlined,
  RiseOutlined, UserOutlined, IdcardOutlined, FilterOutlined, CloseCircleOutlined,
} from "@ant-design/icons";
import type { Contact, Program, Enrollment, ContactField, ContactFieldValue, ProgramField } from "../../types";
import { PageHeader } from "../../components/BrandComponents";
import { BASICS_COLORS } from "../../brand";
import { useRole } from "../../hooks/useRole";
import {
  DashboardBuilderDrawer,
  loadDashboardConfig,
  buildDefaultWidgets,
  type DashboardWidget,
} from "./DashboardBuilder";

const { Text } = Typography;
const { RangePicker } = DatePicker;

const COLORS = [
  BASICS_COLORS.primary, BASICS_COLORS.secondary, BASICS_COLORS.gold,
  "#4CAF50", "#81C784", "#A5D6A7", "#2E7D32", "#F9A825",
];

const statusColor: Record<string, string> = {
  lead: BASICS_COLORS.gold, active: BASICS_COLORS.primary, inactive: "#9E9E9E",
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const Dashboard = () => {
  const navigate = useNavigate();
  const { isAdmin } = useRole();

  // ── Data fetches ───────────────────────────────────────────────────────────
  const { data: contactsData,    isLoading: loadingContacts    } = useList<Contact>({ resource: "contacts",   pagination: { pageSize: 5000  }, sorters: [{ field: "created_at", order: "desc" }] });
  const { data: programsData,    isLoading: loadingPrograms    } = useList<Program>({ resource: "programs",   pagination: { pageSize: 200   } });
  const { data: enrollmentsData, isLoading: loadingEnrollments } = useList<Enrollment>({ resource: "enrollments", pagination: { pageSize: 20000 } });
  const { data: contactFieldsData, isLoading: loadingFields }    = useList<ContactField>({ resource: "contact_fields", sorters: [{ field: "sort_order", order: "asc" }], pagination: { pageSize: 200 } });
  const { data: fieldValuesData }   = useList<ContactFieldValue>({ resource: "contact_field_values", pagination: { pageSize: 50000 } });
  const { data: programFieldsData } = useList<ProgramField>({ resource: "program_fields", sorters: [{ field: "sort_order", order: "asc" }], pagination: { pageSize: 1000 } });
  const { data: enrollmentValuesData } = useList({ resource: "enrollment_values", pagination: { pageSize: 100000 } });

  const contacts         = contactsData?.data      ?? [];
  const programs         = programsData?.data      ?? [];
  const allEnrollments   = enrollmentsData?.data   ?? [];
  const contactFields    = contactFieldsData?.data ?? [];
  const fieldValues      = fieldValuesData?.data   ?? [];
  const programFields    = (programFieldsData?.data ?? []) as ProgramField[];
  const enrollmentValues = (enrollmentValuesData?.data ?? []) as Array<{ enrollment_id: number; field_id: number; value: string }>;

  const isLoading        = loadingContacts || loadingPrograms || loadingEnrollments;
  const contactFieldsLoaded = !loadingFields;

  // ── Date range filter ──────────────────────────────────────────────────────
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);

  const QUICK_RANGES: { label: string; range: [Dayjs, Dayjs] | null }[] = [
    { label: "All time",    range: null },
    { label: "This year",   range: [dayjs().startOf("year"), dayjs()] },
    { label: "Last year",   range: [dayjs().subtract(1,"year").startOf("year"), dayjs().subtract(1,"year").endOf("year")] },
    { label: "Last 2 years",range: [dayjs().subtract(2,"year").startOf("year"), dayjs()] },
    { label: "Last 5 years",range: [dayjs().subtract(5,"year").startOf("year"), dayjs()] },
  ];

  // Filter enrollments by date range (on enrolled_at)
  const enrollments = dateRange
    ? allEnrollments.filter((e) => {
        const d = dayjs(e.enrolled_at);
        return d.isAfter(dateRange[0].subtract(1,"day")) && d.isBefore(dateRange[1].add(1,"day"));
      })
    : allEnrollments;

  // ── Widget config ──────────────────────────────────────────────────────────
  const [widgets, setWidgets]             = useState<DashboardWidget[]>([]);
  const [configLoading, setConfigLoading] = useState(true);

  useEffect(() => {
    loadDashboardConfig()
      .then((saved) => setWidgets(saved ?? buildDefaultWidgets(contactFields)))
      .catch(() => setWidgets(buildDefaultWidgets(contactFields)))
      .finally(() => setConfigLoading(false));
  }, []);

  useEffect(() => {
    if (contactFieldsLoaded && widgets.length > 0) {
      loadDashboardConfig().then((saved) => {
        if (!saved) setWidgets(buildDefaultWidgets(contactFields));
      }).catch(() => {});
    }
  }, [contactFieldsLoaded, contactFields.length]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalContacts    = contacts.length;
  const activeContacts   = contacts.filter((c) => c.status === "active").length;
  const totalEnrollments = enrollments.length;
  const totalPrograms    = programs.length;
  const totalStaff       = contacts.filter((c) => (c as any).is_staff).length;

  const programStats = programs.map((p, i) => ({
    id: p.id, name: p.name,
    count: enrollments.filter((e) => e.program_id === p.id).length,
    color: COLORS[i % COLORS.length],
  })).sort((a, b) => b.count - a.count);

  const statusGroups = ["lead","active","inactive"].map((s) => ({
    status: s, count: contacts.filter((c) => c.status === s).length,
  }));

  const recentContacts = contacts.slice(0, 8);

  // ── Widget renderer ────────────────────────────────────────────────────────
  const renderWidget = (w: DashboardWidget) => {
    if (!w.visible) return null;

    switch (w.type) {
      // ── Stat cards ──
      case "stat_total_contacts":
        return <Card style={{ borderTop: `3px solid ${BASICS_COLORS.secondary}` }}><Statistic title={w.label} value={totalContacts} prefix={<TeamOutlined style={{ color: BASICS_COLORS.secondary }} />} valueStyle={{ color: BASICS_COLORS.secondary }} /></Card>;
      case "stat_active_contacts":
        return <Card style={{ borderTop: `3px solid ${BASICS_COLORS.primary}` }}><Statistic title={w.label} value={activeContacts} prefix={<CheckCircleOutlined style={{ color: BASICS_COLORS.primary }} />} valueStyle={{ color: BASICS_COLORS.primary }} /></Card>;
      case "stat_total_enrollments":
        return (
          <Card style={{ borderTop: `3px solid ${BASICS_COLORS.gold}` }}>
            <Statistic title={w.label} value={totalEnrollments} prefix={<RiseOutlined style={{ color: BASICS_COLORS.gold }} />} valueStyle={{ color: BASICS_COLORS.gold }} />
            {dateRange && <Text type="secondary" style={{ fontSize: 10 }}>{dateRange[0].format("MMM YYYY")} – {dateRange[1].format("MMM YYYY")}</Text>}
          </Card>
        );
      case "stat_total_programs":
        return <Card style={{ borderTop: `3px solid ${BASICS_COLORS.secondary}` }}><Statistic title={w.label} value={totalPrograms} prefix={<AppstoreOutlined style={{ color: BASICS_COLORS.secondary }} />} valueStyle={{ color: BASICS_COLORS.secondary }} /></Card>;
      case "stat_total_staff":
        return <Card style={{ borderTop: `3px solid ${BASICS_COLORS.primary}` }}><Statistic title={w.label} value={totalStaff} prefix={<IdcardOutlined style={{ color: BASICS_COLORS.primary }} />} valueStyle={{ color: BASICS_COLORS.primary }} /></Card>;

      case "stat_program_count": {
        const prog = programs.find((p) => p.id === w.program_id);
        const count = enrollments.filter((e) => e.program_id === w.program_id).length;
        const color = COLORS[programs.indexOf(prog!) % COLORS.length] ?? BASICS_COLORS.primary;
        return (
          <Card style={{ borderTop: `3px solid ${color}` }}>
            <Statistic title={w.label} value={count}
              prefix={<AppstoreOutlined style={{ color }} />} valueStyle={{ color }} />
            {dateRange && <Text type="secondary" style={{ fontSize: 10 }}>{dateRange[0].format("MMM YYYY")} – {dateRange[1].format("MMM YYYY")}</Text>}
          </Card>
        );
      }

      // ── Contact charts ──
      case "chart_program_bars":
        return (
          <Card title={w.label} style={{ height: "100%" }}>
            {programStats.length === 0
              ? <Empty description="No programs yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              : programStats.map((p) => <ProgramBar key={p.id} name={p.name} count={p.count} total={totalEnrollments || 1} color={p.color} />)}
          </Card>
        );

      case "chart_status_donut":
        return <Card title={w.label} style={{ height: "100%" }}><StatusDonut groups={statusGroups} total={totalContacts} /></Card>;

      case "chart_field_breakdown":
      case "chart_field_fillrate": {
        const field = contactFields.find((f) => f.id === w.field_id);
        if (!field) return null;
        const valMap = Object.fromEntries(fieldValues.filter((v) => v.field_id === field.id).map((v) => [v.contact_id, v.value]));
        let groups: { label: string; count: number; color: string }[];
        if (w.type === "chart_field_breakdown" && Array.isArray(field.options)) {
          groups = (field.options as string[]).map((opt, oi) => ({ label: opt, count: contacts.filter((c) => valMap[c.id] === opt).length, color: COLORS[oi % COLORS.length] }));
          const filled = groups.reduce((s, g) => s + g.count, 0);
          if (totalContacts - filled > 0) groups.push({ label: "Not set", count: totalContacts - filled, color: "#d9d9d9" });
        } else {
          const filled = contacts.filter((c) => valMap[c.id]?.trim()).length;
          groups = [{ label: "Filled", count: filled, color: BASICS_COLORS.primary }, { label: "Empty", count: totalContacts - filled, color: "#f0f0f0" }];
        }
        return (
          <Card title={w.label}>
            <Row gutter={[16, 0]}>
              <Col xs={24} md={14}>{groups.map((g) => <ProgramBar key={g.label} name={g.label} count={g.count} total={totalContacts || 1} color={g.color} />)}</Col>
              <Col xs={24} md={10}><StatusDonut groups={groups.map((g) => ({ status: g.label, count: g.count }))} total={totalContacts} colors={Object.fromEntries(groups.map((g) => [g.label, g.color]))} /></Col>
            </Row>
          </Card>
        );
      }

      // ── Program field charts ──
      case "chart_program_field_breakdown":
      case "chart_program_field_fillrate": {
        const progEnrollments = enrollments.filter((e) => e.program_id === w.program_id);
        const enrollIds = progEnrollments.map((e) => e.id);
        const fieldVals = enrollmentValues.filter((v) => v.field_id === w.program_field_id && enrollIds.includes(v.enrollment_id));
        const valMap = Object.fromEntries(fieldVals.map((v) => [v.enrollment_id, v.value]));
        const field = programFields.find((f) => f.id === w.program_field_id);
        const total = progEnrollments.length;

        let groups: { label: string; count: number; color: string }[];
        if (w.type === "chart_program_field_breakdown" && Array.isArray(field?.options)) {
          groups = (field!.options as string[]).map((opt, oi) => ({
            label: opt,
            count: progEnrollments.filter((e) => valMap[e.id] === opt).length,
            color: COLORS[oi % COLORS.length],
          }));
          const filled = groups.reduce((s, g) => s + g.count, 0);
          if (total - filled > 0) groups.push({ label: "Not set", count: total - filled, color: "#d9d9d9" });
        } else {
          const filled = progEnrollments.filter((e) => valMap[e.id]?.trim()).length;
          groups = [
            { label: "Filled", count: filled, color: BASICS_COLORS.primary },
            { label: "Empty",  count: total - filled, color: "#f0f0f0" },
          ];
        }

        return (
          <Card title={<Space><AppstoreOutlined style={{ color: BASICS_COLORS.primary }} />{w.label}</Space>}
            extra={<Tag color="blue">{w.program_name}</Tag>}
          >
            {total === 0
              ? <Empty description={dateRange ? "No enrollments in this date range" : "No enrollments yet"} image={Empty.PRESENTED_IMAGE_SIMPLE} />
              : (
                <Row gutter={[16, 0]}>
                  <Col xs={24} md={14}>
                    {groups.map((g) => <ProgramBar key={g.label} name={g.label} count={g.count} total={total || 1} color={g.color} />)}
                    <Text type="secondary" style={{ fontSize: 11 }}>Based on {total} enrollment{total !== 1 ? "s" : ""}</Text>
                  </Col>
                  <Col xs={24} md={10}>
                    <StatusDonut groups={groups.map((g) => ({ status: g.label, count: g.count }))} total={total} colors={Object.fromEntries(groups.map((g) => [g.label, g.color]))} />
                  </Col>
                </Row>
              )}
          </Card>
        );
      }

      // ── Enrollment trend over time ──
      case "chart_program_enrollments_over_time": {
        const progEnrollments = enrollments.filter((e) => e.program_id === w.program_id);
        // Group by month
        const monthCounts: Record<string, number> = {};
        progEnrollments.forEach((e) => {
          const month = dayjs(e.enrolled_at).format("MMM YYYY");
          monthCounts[month] = (monthCounts[month] ?? 0) + 1;
        });
        const sorted = Object.entries(monthCounts).sort(([a], [b]) => dayjs(a, "MMM YYYY").valueOf() - dayjs(b, "MMM YYYY").valueOf());
        const maxCount = Math.max(...sorted.map(([,c]) => c), 1);

        return (
          <Card title={<Space><AppstoreOutlined style={{ color: BASICS_COLORS.primary }} />{w.label}</Space>}
            extra={<Tag color="blue">{w.program_name}</Tag>}
          >
            {sorted.length === 0
              ? <Empty description={dateRange ? "No enrollments in this date range" : "No enrollments yet"} image={Empty.PRESENTED_IMAGE_SIMPLE} />
              : (
                <>
                  <Text type="secondary" style={{ fontSize: 11, marginBottom: 12, display: "block" }}>
                    {progEnrollments.length} total enrollment{progEnrollments.length !== 1 ? "s" : ""} across {sorted.length} month{sorted.length !== 1 ? "s" : ""}
                  </Text>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 6, overflowX: "auto", paddingBottom: 8 }}>
                    {sorted.map(([month, count]) => (
                      <div key={month} style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 44 }}>
                        <Text style={{ fontSize: 11, fontWeight: 600, color: BASICS_COLORS.secondary }}>{count}</Text>
                        <div style={{
                          width: 36, borderRadius: "4px 4px 0 0",
                          height: `${Math.max((count / maxCount) * 120, 4)}px`,
                          background: BASICS_COLORS.primary,
                          transition: "height 0.4s ease",
                        }} />
                        <Text style={{ fontSize: 9, color: "#888", marginTop: 4, textAlign: "center", lineHeight: 1.2 }}>
                          {month.replace(" ", "\n")}
                        </Text>
                      </div>
                    ))}
                  </div>
                </>
              )}
          </Card>
        );
      }

      // ── Recent contacts table ──
      case "table_recent_contacts":
        return (
          <Card title={w.label}>
            {recentContacts.length === 0
              ? <Empty description="No contacts yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              : (
                <Table dataSource={recentContacts} rowKey="id" size="small" pagination={false}
                  onRow={(c) => ({ onClick: () => navigate(`/contacts/show/${c.id}`), style: { cursor: "pointer" } })}
                >
                  <Table.Column title="Name" render={(_: unknown, c: Contact) => (
                    <Space><Avatar size="small" src={c.profile_picture_url} icon={<UserOutlined />} />{c.first_name} {c.last_name}</Space>
                  )} />
                  <Table.Column dataIndex="email" title="Email" />
                  <Table.Column dataIndex="phone" title="Phone" />
                  <Table.Column dataIndex="status" title="Status"
                    render={(v: string) => <Tag color={statusColor[v] ?? "default"}>{v?.toUpperCase()}</Tag>} />
                  <Table.Column dataIndex="created_at" title="Added"
                    render={(v: string) => new Date(v).toLocaleDateString()} />
                </Table>
              )}
          </Card>
        );

      default:
        return null;
    }
  };

  if (isLoading || configLoading) {
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
        extra={
          isAdmin
            ? <DashboardBuilderDrawer widgets={widgets} contactFields={contactFields} programs={programs} programFields={programFields} onChange={setWidgets} />
            : undefined
        }
      />

      {/* ── Date range filter bar ── */}
      <Card size="small" style={{ marginBottom: 16, borderLeft: `3px solid ${BASICS_COLORS.gold}` }}>
        <Row align="middle" gutter={[12, 8]}>
          <Col flex="none">
            <Space>
              <FilterOutlined style={{ color: BASICS_COLORS.secondary }} />
              <Text strong style={{ color: BASICS_COLORS.secondary, fontSize: 13 }}>Filter by enrollment date:</Text>
            </Space>
          </Col>
          <Col flex="none">
            <Space wrap>
              {QUICK_RANGES.map((q) => (
                <Button
                  key={q.label}
                  size="small"
                  type={JSON.stringify(dateRange) === JSON.stringify(q.range) || (!dateRange && !q.range) ? "primary" : "default"}
                  onClick={() => setDateRange(q.range)}
                  style={
                    JSON.stringify(dateRange) === JSON.stringify(q.range) || (!dateRange && !q.range)
                      ? { background: BASICS_COLORS.secondary, borderColor: BASICS_COLORS.secondary }
                      : {}
                  }
                >
                  {q.label}
                </Button>
              ))}
            </Space>
          </Col>
          <Col flex="none">
            <RangePicker
              size="small"
              value={dateRange}
              onChange={(v) => setDateRange(v as [Dayjs, Dayjs] | null)}
              format="DD/MM/YYYY"
              placeholder={["From date", "To date"]}
            />
          </Col>
          {dateRange && (
            <Col flex="none">
              <Button size="small" icon={<CloseCircleOutlined />} onClick={() => setDateRange(null)}>
                Clear
              </Button>
            </Col>
          )}
        </Row>
      </Card>

      {/* ── Widget grid ── */}
      <Row gutter={[16, 16]}>
        {widgets.filter((w) => w.visible).map((w) => {
          const content = renderWidget(w);
          if (!content) return null;
          return (
            <Col key={w.id} xs={24} sm={w.col_span <= 8 ? 12 : 24} md={w.col_span as any}>
              {content}
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

// ── ProgramBar ────────────────────────────────────────────────────────────────
const ProgramBar = ({ name, count, total, color }: { name: string; count: number; total: number; color: string }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
      <Text style={{ fontWeight: 500 }}>{name}</Text>
      <Text type="secondary">{count} ({Math.round((count / total) * 100)}%)</Text>
    </div>
    <div style={{ height: 10, borderRadius: 5, background: "#f0f0f0", overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.max(Math.round((count / total) * 100), count > 0 ? 2 : 0)}%`, background: color, borderRadius: 5, transition: "width 0.6s ease" }} />
    </div>
  </div>
);

// ── StatusDonut ───────────────────────────────────────────────────────────────
const StatusDonut = ({ groups, total, colors: colorOverrides }: { groups: { status: string; count: number }[]; total: number; colors?: Record<string, string> }) => {
  const colors = colorOverrides ?? { lead: BASICS_COLORS.gold, active: BASICS_COLORS.primary, inactive: "#d9d9d9" };
  let offset = 0;
  const segments = groups.filter((g) => g.count > 0).map((g) => {
    const pct = (g.count / (total || 1)) * 100;
    const seg = `${colors[g.status] ?? "#aaa"} ${offset}% ${offset + pct}%`;
    offset += pct;
    return seg;
  });
  const gradient = segments.length > 0 ? `conic-gradient(${segments.join(", ")})` : "conic-gradient(#f0f0f0 0% 100%)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
      <div style={{ width: 120, height: 120, borderRadius: "50%", background: gradient, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--ant-color-bg-container, #fff)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <Text style={{ fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{total}</Text>
          <Text type="secondary" style={{ fontSize: 10 }}>total</Text>
        </div>
      </div>
      <div>
        {groups.map((g) => (
          <div key={g.status} style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: colors[g.status] ?? "#aaa", flexShrink: 0 }} />
            <Text style={{ textTransform: "capitalize" }}>{g.status}</Text>
            <Text type="secondary">({g.count})</Text>
          </div>
        ))}
      </div>
    </div>
  );
};
