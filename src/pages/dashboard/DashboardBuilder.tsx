/**
 * DashboardBuilder
 * Admin-only UI for designing the dashboard layout.
 * Saves widget config to `dashboard_config` table in Supabase.
 * All users see the admin-configured dashboard.
 */
import { useState } from "react";
import {
  Drawer, Button, Card, Space, Typography, Select, Switch,
  Tag, Empty, Tooltip, message, Row, Col, Alert, Collapse,
} from "antd";
import {
  SettingOutlined, PlusOutlined, DeleteOutlined,
  ArrowUpOutlined, ArrowDownOutlined, EyeOutlined,
  BarChartOutlined, PieChartOutlined, NumberOutlined,
  LineChartOutlined, AppstoreOutlined,
} from "@ant-design/icons";
import { supabaseClient } from "../../supabaseClient";
import { BASICS_COLORS } from "../../brand";
import type { ContactField, ProgramField, Program } from "../../types";

const { Text, Title } = Typography;

// ── Widget types ──────────────────────────────────────────────────────────────
export type WidgetType =
  // Contact stats
  | "stat_total_contacts"
  | "stat_active_contacts"
  | "stat_total_enrollments"
  | "stat_total_programs"
  | "stat_total_staff"
  // Contact charts
  | "chart_status_donut"
  | "chart_program_bars"
  | "chart_field_breakdown"    // contact field, select
  | "chart_field_fillrate"     // contact field, text
  // Program-specific charts
  | "stat_program_count"                   // enrolment count for one program
  | "chart_program_field_breakdown"        // select field within a program
  | "chart_program_field_fillrate"         // text/date field fill rate
  | "chart_program_enrollments_over_time"  // enrollment trend by month/year
  // Tables
  | "table_recent_contacts";

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  label: string;
  // contact field charts
  field_id?: number;
  field_label?: string;
  // program-specific
  program_id?: number;
  program_name?: string;
  program_field_id?: number;
  program_field_label?: string;
  program_field_type?: string;
  // layout
  visible: boolean;
  col_span: 6 | 8 | 12 | 24;
}

const BUILT_IN_WIDGETS: Omit<DashboardWidget, "id" | "visible" | "col_span">[] = [
  { type: "stat_total_contacts",    label: "Total Contacts"         },
  { type: "stat_active_contacts",   label: "Active Contacts"        },
  { type: "stat_total_enrollments", label: "Total Enrollments"      },
  { type: "stat_total_programs",    label: "Total Programs"         },
  { type: "stat_total_staff",       label: "Total Staff"            },
  { type: "chart_status_donut",     label: "Contacts by Status"     },
  { type: "chart_program_bars",     label: "Enrollments per Program"},
  { type: "table_recent_contacts",  label: "Recent Contacts"        },
];

const WIDGET_ICON: Record<string, React.ReactNode> = {
  stat_total_contacts:                   <NumberOutlined />,
  stat_active_contacts:                  <NumberOutlined />,
  stat_total_enrollments:                <NumberOutlined />,
  stat_total_programs:                   <NumberOutlined />,
  stat_total_staff:                      <NumberOutlined />,
  stat_program_count:                    <NumberOutlined />,
  chart_status_donut:                    <PieChartOutlined />,
  chart_program_bars:                    <BarChartOutlined />,
  chart_field_breakdown:                 <BarChartOutlined />,
  chart_field_fillrate:                  <PieChartOutlined />,
  chart_program_field_breakdown:         <BarChartOutlined />,
  chart_program_field_fillrate:          <PieChartOutlined />,
  chart_program_enrollments_over_time:   <LineChartOutlined />,
  table_recent_contacts:                 <EyeOutlined />,
};

const COL_LABELS: Record<number, string> = {
  6: "¼ width", 8: "⅓ width", 12: "½ width", 24: "Full width",
};

// ── Persistence ───────────────────────────────────────────────────────────────
const CONFIG_KEY = "main";

export async function loadDashboardConfig(): Promise<DashboardWidget[] | null> {
  const { data, error } = await supabaseClient
    .from("dashboard_config")
    .select("widgets")
    .eq("config_key", CONFIG_KEY)
    .single();
  if (error) return null;
  return data?.widgets ?? null;
}

export async function saveDashboardConfig(widgets: DashboardWidget[]) {
  await supabaseClient
    .from("dashboard_config")
    .upsert({ config_key: CONFIG_KEY, widgets }, { onConflict: "config_key" });
}

// ── Default layout ────────────────────────────────────────────────────────────
export function buildDefaultWidgets(fields: ContactField[]): DashboardWidget[] {
  const defaults: DashboardWidget[] = [
    { id: "stat_total_contacts",    type: "stat_total_contacts",    label: "Total Contacts",          visible: true, col_span: 6  },
    { id: "stat_active_contacts",   type: "stat_active_contacts",   label: "Active Contacts",         visible: true, col_span: 6  },
    { id: "stat_total_enrollments", type: "stat_total_enrollments", label: "Total Enrollments",       visible: true, col_span: 6  },
    { id: "stat_total_programs",    type: "stat_total_programs",    label: "Programs",                visible: true, col_span: 6  },
    { id: "chart_program_bars",     type: "chart_program_bars",     label: "Enrollments per Program", visible: true, col_span: 12 },
    { id: "chart_status_donut",     type: "chart_status_donut",     label: "Contacts by Status",      visible: true, col_span: 12 },
    { id: "table_recent_contacts",  type: "table_recent_contacts",  label: "Recent Contacts",         visible: true, col_span: 24 },
  ];

  fields.filter((f) => f.field_type === "select" || f.field_type === "text").forEach((f) => {
    defaults.push({
      id: `field_${f.id}`,
      type: f.field_type === "select" ? "chart_field_breakdown" : "chart_field_fillrate",
      label: f.label, field_id: f.id, field_label: f.label,
      visible: true, col_span: 12,
    });
  });

  return defaults;
}

// ── Builder Drawer ────────────────────────────────────────────────────────────
interface BuilderProps {
  widgets: DashboardWidget[];
  contactFields: ContactField[];
  programs: Program[];
  programFields: ProgramField[];
  onChange: (widgets: DashboardWidget[]) => void;
}

export const DashboardBuilderDrawer: React.FC<BuilderProps> = ({
  widgets, contactFields, programs, programFields, onChange,
}) => {
  const [open, setOpen]       = useState(false);
  const [saving, setSaving]   = useState(false);

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...widgets];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    onChange(next);
  };

  const remove  = (id: string) => onChange(widgets.filter((w) => w.id !== id));
  const toggle  = (id: string) => onChange(widgets.map((w) => w.id === id ? { ...w, visible: !w.visible } : w));
  const setSpan = (id: string, span: number) => onChange(widgets.map((w) => w.id === id ? { ...w, col_span: span as DashboardWidget["col_span"] } : w));

  const addBuiltIn = (type: WidgetType, label: string) => {
    if (widgets.find((w) => w.id === type)) { message.warning(`"${label}" is already on the dashboard`); return; }
    onChange([...widgets, { id: type, type, label, visible: true, col_span: 12 }]);
  };

  const addContactFieldWidget = (fieldId: number, chartType: "breakdown" | "fillrate") => {
    const field = contactFields.find((f) => f.id === fieldId);
    if (!field) return;
    const id = `contact_field_${fieldId}_${chartType}`;
    if (widgets.find((w) => w.id === id)) { message.warning("This chart is already on the dashboard"); return; }
    onChange([...widgets, {
      id, type: chartType === "breakdown" ? "chart_field_breakdown" : "chart_field_fillrate",
      label: field.label, field_id: fieldId, field_label: field.label, visible: true, col_span: 12,
    }]);
  };

  const addProgramStat = (program: Program) => {
    const id = `prog_count_${program.id}`;
    if (widgets.find((w) => w.id === id)) { message.warning("Already on dashboard"); return; }
    onChange([...widgets, {
      id, type: "stat_program_count",
      label: `${program.name} Enrollments`,
      program_id: program.id, program_name: program.name,
      visible: true, col_span: 6,
    }]);
  };

  const addProgramTrend = (program: Program) => {
    const id = `prog_trend_${program.id}`;
    if (widgets.find((w) => w.id === id)) { message.warning("Already on dashboard"); return; }
    onChange([...widgets, {
      id, type: "chart_program_enrollments_over_time",
      label: `${program.name} — Enrollment Trend`,
      program_id: program.id, program_name: program.name,
      visible: true, col_span: 24,
    }]);
  };

  const addProgramFieldWidget = (program: Program, field: ProgramField) => {
    const chartType = field.field_type === "select" ? "chart_program_field_breakdown" : "chart_program_field_fillrate";
    const id = `prog_field_${program.id}_${field.id}`;
    if (widgets.find((w) => w.id === id)) { message.warning("Already on dashboard"); return; }
    onChange([...widgets, {
      id, type: chartType,
      label: `${program.name}: ${field.label}`,
      program_id: program.id, program_name: program.name,
      program_field_id: field.id, program_field_label: field.label,
      program_field_type: field.field_type,
      visible: true, col_span: 12,
    }]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveDashboardConfig(widgets);
      message.success("Dashboard layout saved — all users will see the new layout");
      setOpen(false);
    } catch {
      message.error("Failed to save — run the dashboard_config SQL migration first");
    }
    setSaving(false);
  };

  const selectFields = contactFields.filter((f) => f.field_type === "select");
  const textFields   = contactFields.filter((f) => f.field_type === "text");

  return (
    <>
      <Tooltip title="Customize dashboard layout (admin only)">
        <Button
          icon={<SettingOutlined />}
          onClick={() => setOpen(true)}
          style={{ background: BASICS_COLORS.secondary, borderColor: BASICS_COLORS.secondary, color: "#fff" }}
        >
          Edit Dashboard
        </Button>
      </Tooltip>

      <Drawer
        title={
          <Space>
            <SettingOutlined style={{ color: BASICS_COLORS.primary }} />
            <span style={{ color: BASICS_COLORS.secondary, fontWeight: 700 }}>Dashboard Builder</span>
          </Space>
        }
        open={open}
        onClose={() => setOpen(false)}
        width={500}
        extra={
          <Button type="primary" loading={saving} onClick={handleSave}
            style={{ background: BASICS_COLORS.primary, borderColor: BASICS_COLORS.primary }}>
            Save Layout
          </Button>
        }
      >
        <Alert
          type="info" showIcon
          message="Changes apply to all users when you click Save Layout."
          style={{ marginBottom: 16 }}
        />

        {/* ── Current widgets ── */}
        <Title level={5} style={{ color: BASICS_COLORS.secondary, marginBottom: 12 }}>
          Current Widgets ({widgets.length})
        </Title>

        {widgets.length === 0 && <Empty description="No widgets yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />}

        <Space direction="vertical" style={{ width: "100%" }} size={8}>
          {widgets.map((w, idx) => (
            <Card key={w.id} size="small"
              style={{ borderLeft: `3px solid ${w.visible ? BASICS_COLORS.primary : "#d9d9d9"}`, opacity: w.visible ? 1 : 0.5 }}
              styles={{ body: { padding: "8px 12px" } }}
            >
              <Row align="middle" gutter={8}>
                <Col flex="none" style={{ color: BASICS_COLORS.secondary }}>{WIDGET_ICON[w.type] ?? <BarChartOutlined />}</Col>
                <Col flex="auto">
                  <Text strong style={{ fontSize: 12 }}>{w.label}</Text>
                  {w.program_name && <Tag color="blue" style={{ marginLeft: 4, fontSize: 10 }}>{w.program_name}</Tag>}
                  {w.field_label && !w.program_name && <Tag color="green" style={{ marginLeft: 4, fontSize: 10 }}>contact field</Tag>}
                </Col>
                <Col flex="none">
                  <Space size={3}>
                    <Select size="small" value={w.col_span} onChange={(v) => setSpan(w.id, v)} style={{ width: 88 }}
                      options={[6,8,12,24].map((n) => ({ value: n, label: COL_LABELS[n] }))} />
                    <Switch size="small" checked={w.visible} onChange={() => toggle(w.id)} checkedChildren="On" unCheckedChildren="Off" />
                    <Button size="small" icon={<ArrowUpOutlined />} onClick={() => move(idx, -1)} disabled={idx === 0} />
                    <Button size="small" icon={<ArrowDownOutlined />} onClick={() => move(idx, 1)} disabled={idx === widgets.length - 1} />
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={() => remove(w.id)} />
                  </Space>
                </Col>
              </Row>
            </Card>
          ))}
        </Space>

        {/* ── Add widgets ── */}
        <Collapse
          style={{ marginTop: 20 }}
          items={[
            // Built-in
            {
              key: "builtin",
              label: <Text strong>Add Built-in Widgets</Text>,
              children: (
                <Row gutter={[8, 8]}>
                  {BUILT_IN_WIDGETS.map((bw) => (
                    <Col key={bw.type} xs={12}>
                      <Button block size="small" icon={<PlusOutlined />}
                        onClick={() => addBuiltIn(bw.type as WidgetType, bw.label)} style={{ fontSize: 11 }}>
                        {bw.label}
                      </Button>
                    </Col>
                  ))}
                </Row>
              ),
            },

            // Contact fields
            ...(selectFields.length + textFields.length > 0 ? [{
              key: "contact_fields",
              label: <Text strong>Contact Field Charts</Text>,
              children: (
                <>
                  {selectFields.length > 0 && (
                    <>
                      <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 6 }}>Select fields — group-by chart</Text>
                      <Row gutter={[8, 8]} style={{ marginBottom: 10 }}>
                        {selectFields.map((f) => (
                          <Col key={f.id} xs={12}>
                            <Button block size="small" icon={<BarChartOutlined />}
                              onClick={() => addContactFieldWidget(f.id, "breakdown")} style={{ fontSize: 11 }}>
                              {f.label}
                            </Button>
                          </Col>
                        ))}
                      </Row>
                    </>
                  )}
                  {textFields.length > 0 && (
                    <>
                      <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 6 }}>Text fields — fill-rate chart</Text>
                      <Row gutter={[8, 8]}>
                        {textFields.map((f) => (
                          <Col key={f.id} xs={12}>
                            <Button block size="small" icon={<PieChartOutlined />}
                              onClick={() => addContactFieldWidget(f.id, "fillrate")} style={{ fontSize: 11 }}>
                              {f.label}
                            </Button>
                          </Col>
                        ))}
                      </Row>
                    </>
                  )}
                </>
              ),
            }] : []),

            // Programs
            ...programs.map((program) => {
              const fields = programFields.filter((f) => f.program_id === program.id);
              const usableFields = fields.filter((f) => ["select","text","date","number"].includes(f.field_type));
              return {
                key: `prog_${program.id}`,
                label: (
                  <Space>
                    <AppstoreOutlined style={{ color: BASICS_COLORS.primary }} />
                    <Text strong>{program.name}</Text>
                    <Tag color="blue" style={{ fontSize: 10 }}>{fields.length} fields</Tag>
                  </Space>
                ),
                children: (
                  <>
                    <Row gutter={[8, 8]} style={{ marginBottom: 10 }}>
                      <Col xs={12}>
                        <Button block size="small" icon={<NumberOutlined />}
                          onClick={() => addProgramStat(program)} style={{ fontSize: 11 }}>
                          Enrollment Count
                        </Button>
                      </Col>
                      <Col xs={12}>
                        <Button block size="small" icon={<LineChartOutlined />}
                          onClick={() => addProgramTrend(program)} style={{ fontSize: 11 }}>
                          Enrollment Trend
                        </Button>
                      </Col>
                    </Row>

                    {usableFields.length === 0 && (
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        No chartable fields yet — add select, text, date or number fields to this program in the Program Field Builder.
                      </Text>
                    )}

                    {usableFields.length > 0 && (
                      <>
                        <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 6 }}>
                          Program fields:
                        </Text>
                        <Row gutter={[8, 8]}>
                          {usableFields.map((f) => (
                            <Col key={f.id} xs={12}>
                              <Button block size="small"
                                icon={f.field_type === "select" ? <BarChartOutlined /> : f.field_type === "date" ? <LineChartOutlined /> : <PieChartOutlined />}
                                onClick={() => addProgramFieldWidget(program, f)} style={{ fontSize: 11 }}>
                                {f.label}
                              </Button>
                            </Col>
                          ))}
                        </Row>
                      </>
                    )}
                  </>
                ),
              };
            }),
          ]}
        />
      </Drawer>
    </>
  );
};
