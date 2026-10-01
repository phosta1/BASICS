/**
 * Staff Directory
 * Lists all contacts where is_staff = true.
 * Shows name, email, phone, employment status, start date, and profile picture.
 * Clicking a row opens the full contact detail (which shows the staff section).
 */
import { useList } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import {
  Table, Tag, Space, Avatar, Typography, Input, Select,
  Row, Col, Badge, Card,
} from "antd";
import {
  UserOutlined, SearchOutlined, IdcardOutlined,
} from "@ant-design/icons";
import { useState, useRef, useCallback } from "react";
import { PageHeader } from "../../components/BrandComponents";
import { BASICS_COLORS } from "../../brand";
import type { Contact, StaffProfile } from "../../types";

const { Text } = Typography;

const employmentColor: Record<string, string> = {
  permanent:   "green",
  contract:    "blue",
  ambassador:  "purple",
};

export const StaffDirectory = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch all staff contacts
  const { data: contactsData, isLoading: loadingContacts } = useList<Contact>({
    resource: "contacts",
    filters: [{ field: "is_staff", operator: "eq", value: true }],
    pagination: { pageSize: 500 },
    sorters: [{ field: "last_name", order: "asc" }],
  });
  const staffContacts = contactsData?.data ?? [];

  // Fetch all staff profiles for these contacts
  const staffContactIds = staffContacts.map((c) => c.id);
  const { data: staffProfilesData } = useList<StaffProfile>({
    resource: "staff_profiles",
    pagination: { pageSize: 500 },
    queryOptions: { enabled: staffContactIds.length > 0 },
  });
  const staffProfiles = staffProfilesData?.data ?? [];
  const profileByContactId = Object.fromEntries(
    staffProfiles.map((p) => [p.contact_id, p])
  );

  // Client-side search + filter
  const filtered = staffContacts.filter((c) => {
    const sp = profileByContactId[c.id];
    const matchSearch = !searchText || [
      c.first_name, c.last_name, c.email, c.phone ?? "",
    ].some((v) => v.toLowerCase().includes(searchText.toLowerCase()));
    const matchStatus = !statusFilter || sp?.employment_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSearchText(val), 250);
  }, []);

  return (
    <div>
      <PageHeader
        title="Staff Directory"
        subtitle={`${filtered.length} staff member${filtered.length !== 1 ? "s" : ""}`}
        extra={
          <Badge
            count={filtered.length}
            showZero
            style={{ background: BASICS_COLORS.primary }}
          />
        }
      />

      {/* Filters */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={14} md={12}>
          <Input
            placeholder="Search by name, email or phone…"
            prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
            allowClear
            onChange={handleSearch}
            onClear={() => setSearchText("")}
          />
        </Col>
        <Col xs={24} sm={10} md={8}>
          <Select
            placeholder="All employment types"
            allowClear
            style={{ width: "100%" }}
            onChange={(v) => setStatusFilter(v ?? undefined)}
            options={[
              { label: "Permanent", value: "permanent" },
              { label: "Contract",  value: "contract"  },
              { label: "Ambassador",value: "ambassador" },
            ]}
          />
        </Col>
      </Row>

      <Card bodyStyle={{ padding: 0 }}>
        <Table<Contact>
          dataSource={filtered}
          rowKey="id"
          loading={loadingContacts}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          onRow={(record) => ({
            onClick: () => navigate(`/contacts/show/${record.id}`),
            style: { cursor: "pointer" },
          })}
          rowClassName="staff-row-hover"
        >
          <Table.Column
            title="Staff Member"
            render={(_: unknown, c: Contact) => (
              <Space>
                <Avatar
                  size={40}
                  src={c.profile_picture_url}
                  icon={<UserOutlined />}
                  style={{ border: `2px solid ${BASICS_COLORS.borderColor}` }}
                />
                <div>
                  <Text strong style={{ display: "block", lineHeight: 1.3 }}>
                    {c.first_name} {c.last_name}
                    {(c as any).other_names
                      ? <Text type="secondary" style={{ fontWeight: 400, fontSize: 12 }}> ({(c as any).other_names})</Text>
                      : null}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>{c.email}</Text>
                </div>
              </Space>
            )}
          />

          <Table.Column
            title="Phone"
            dataIndex="phone"
            render={(v: string) => v || <Text type="secondary">—</Text>}
          />

          <Table.Column
            title="Employment"
            render={(_: unknown, c: Contact) => {
              const sp = profileByContactId[c.id];
              if (!sp?.employment_status) return <Text type="secondary">—</Text>;
              return (
                <Tag color={employmentColor[sp.employment_status] ?? "default"}>
                  {sp.employment_status.toUpperCase()}
                </Tag>
              );
            }}
          />

          <Table.Column
            title="Start Date"
            render={(_: unknown, c: Contact) => {
              const sp = profileByContactId[c.id];
              if (!sp?.start_date) return <Text type="secondary">—</Text>;
              return new Date(sp.start_date).toLocaleDateString();
            }}
          />

          <Table.Column
            title="SSNIT"
            render={(_: unknown, c: Contact) => {
              const sp = profileByContactId[c.id];
              return sp?.ssnit_number
                ? <Text code style={{ fontSize: 11 }}>{sp.ssnit_number}</Text>
                : <Text type="secondary">—</Text>;
            }}
          />

          <Table.Column
            title="Status"
            dataIndex="status"
            render={(v: string) => (
              <Tag color={v === "active" ? "green" : v === "lead" ? "blue" : "default"}>
                {v?.toUpperCase()}
              </Tag>
            )}
          />

          <Table.Column
            title="Profile Complete"
            render={(_: unknown, c: Contact) => {
              const sp = profileByContactId[c.id];
              const complete = sp && sp.employment_status && sp.ssnit_number;
              return complete ? (
                <Tag color="green" icon={<IdcardOutlined />}>Complete</Tag>
              ) : (
                <Tag color="orange">Incomplete</Tag>
              );
            }}
          />
        </Table>
      </Card>

      <style>{`
        .staff-row-hover:hover > td {
          background-color: ${BASICS_COLORS.primaryLight} !important;
          transition: background-color 0.15s;
        }
      `}</style>
    </div>
  );
};
