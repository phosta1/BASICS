import { useState, useCallback, useRef } from "react";
import {
  List, useTable, ShowButton, EditButton, DeleteButton, CreateButton, useSelect,
} from "@refinedev/antd";
import { useNavigate } from "react-router-dom";
import {
  Table, Tag, Space, Input, Select, Row, Col, Avatar,
  Typography, Tooltip, Badge, Button, message,
} from "antd";
import {
  SearchOutlined, UserOutlined, CloseCircleOutlined,
  DownloadOutlined, ExportOutlined,
} from "@ant-design/icons";
import { usePermissions } from "../../hooks/usePermissions";
import { exportContacts } from "../../utils/exportContacts";
import { BASICS_COLORS } from "../../brand";
import type { Contact, Program } from "../../types";

const { Text } = Typography;

const statusColor: Record<Contact["status"], string> = {
  active: "green",
  "dropped off": "red",
  completed: "blue",
  "not lead": "default",
};

export const ContactList = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [programFilter, setProgramFilter] = useState<string | undefined>();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [exporting, setExporting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const permissions = usePermissions();

  const { selectProps: programSelectProps } = useSelect<Program>({
    resource: "programs",
    optionLabel: "name",
    optionValue: "id",
  });

  const { tableProps, setFilters, tableQueryResult } = useTable<Contact>({
    syncWithLocation: true,
    sorters: { initial: [{ field: "created_at", order: "desc" }] },
    filters: { initial: [] },
  });

  const totalResults = tableQueryResult?.data?.total ?? 0;

  const applyFilters = useCallback(
    (search: string, status: string | undefined, programId: string | undefined) => {
      const filters: any[] = [];
      if (search.trim()) {
        filters.push({
          operator: "or",
          value: [
            { field: "first_name", operator: "contains", value: search },
            { field: "last_name",  operator: "contains", value: search },
            { field: "email",      operator: "contains", value: search },
            { field: "company",    operator: "contains", value: search },
          ],
        });
      }
      if (status) {
        filters.push({ field: "status", operator: "eq", value: status });
      }
      if (programId) {
        // Filter contacts enrolled in this program
        filters.push({ field: "enrollments.program_id", operator: "eq", value: Number(programId) });
      }
      setFilters(filters, "replace");
    },
    [setFilters]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => applyFilters(value, statusFilter, programFilter), 300);
  };

  const handleStatusChange = (value: string | undefined) => {
    setStatusFilter(value);
    applyFilters(searchText, value, programFilter);
  };

  const handleProgramChange = (value: string | undefined) => {
    setProgramFilter(value);
    applyFilters(searchText, statusFilter, value);
  };

  const clearAll = () => {
    setSearchText("");
    setStatusFilter(undefined);
    setProgramFilter(undefined);
    setFilters([], "replace");
  };

  const hasFilters = !!searchText || !!statusFilter || !!programFilter;

  // ── Export ──────────────────────────────────────────────────────────────────
  const handleExport = async (ids?: number[]) => {
    setExporting(true);
    try {
      await exportContacts(ids && ids.length > 0 ? ids : undefined);
      message.success(
        ids && ids.length > 0
          ? `Exported ${ids.length} contact${ids.length !== 1 ? "s" : ""}`
          : "Exported all contacts"
      );
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : "Export failed");
    }
    setExporting(false);
  };

  const rowSelection = {
    selectedRowKeys: selectedIds,
    onChange: (keys: React.Key[]) => setSelectedIds(keys as number[]),
  };

  return (
    <List
      headerButtons={
        <Space>
          {selectedIds.length > 0 ? (
            <Button
              icon={<DownloadOutlined />}
              loading={exporting}
              onClick={() => handleExport(selectedIds)}
              style={{
                background: BASICS_COLORS.secondary,
                borderColor: BASICS_COLORS.secondary,
                color: "#fff",
              }}
            >
              Export {selectedIds.length} selected
            </Button>
          ) : (
            <Button
              icon={<ExportOutlined />}
              loading={exporting}
              onClick={() => handleExport()}
              style={{ borderColor: BASICS_COLORS.primary, color: BASICS_COLORS.secondary }}
            >
              Export All
            </Button>
          )}
          {permissions.contacts.create && <CreateButton />}
        </Space>
      }
      title={
        <Space>
          Contacts
          {totalResults > 0 && (
            <Badge count={totalResults} showZero color={BASICS_COLORS.primary} overflowCount={9999} />
          )}
        </Space>
      }
    >
      {/* ── Search + filter bar ── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={10}>
          <Input
            placeholder="Search name, email, or company…"
            prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
            allowClear
            value={searchText}
            onChange={handleSearchChange}
            onClear={() => { setSearchText(""); applyFilters("", statusFilter, programFilter); }}
          />
        </Col>
        <Col xs={12} sm={6} md={5}>
          <Select
            placeholder="All statuses"
            allowClear
            style={{ width: "100%" }}
            value={statusFilter ?? null}
            onChange={(v) => handleStatusChange(v ?? undefined)}
            options={[
              { label: "Active",     value: "active"     },
              { label: "Dropped Off", value: "dropped off" },
              { label: "Completed", value: "completed" },
              { label: "Not Lead",   value: "not lead"   },
            ]}
          />
        </Col>
        <Col xs={12} sm={6} md={5}>
          <Select
            {...programSelectProps}
            placeholder="Filter by program"
            allowClear
            style={{ width: "100%" }}
            showSearch
            filterOption={false}
            value={programFilter ? { label: programFilter, value: programFilter } : null}
            onChange={(v: any) => handleProgramChange(v?.value ?? undefined)}
          />
        </Col>
        {hasFilters && (
          <Col xs={24} sm={24} md={4} style={{ display: "flex", alignItems: "center" }}>
            <Text
              type="secondary"
              style={{ cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" }}
              onClick={clearAll}
            >
              <CloseCircleOutlined style={{ marginRight: 4 }} />
              Clear filters
            </Text>
          </Col>
        )}
      </Row>

      {/* ── Selection action bar ── */}
      {selectedIds.length > 0 && (
        <div style={{
          background: BASICS_COLORS.primaryLight,
          border: `1px solid ${BASICS_COLORS.borderColor}`,
          borderRadius: 6,
          padding: "8px 14px",
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <Text style={{ color: BASICS_COLORS.secondary }}>
            <strong>{selectedIds.length}</strong> contact{selectedIds.length !== 1 ? "s" : ""} selected
          </Text>
          <Space>
            <Button size="small" onClick={() => setSelectedIds([])}>
              Clear selection
            </Button>
            <Button
              size="small"
              type="primary"
              icon={<DownloadOutlined />}
              loading={exporting}
              onClick={() => handleExport(selectedIds)}
              style={{ background: BASICS_COLORS.secondary, borderColor: BASICS_COLORS.secondary }}
            >
              Export selected as CSV
            </Button>
          </Space>
        </div>
      )}

      {/* ── Results table ── */}
      <Table
        {...tableProps}
        rowKey="id"
        rowSelection={rowSelection}
        onRow={(record: Contact) => ({
          onClick: (e) => {
            const target = e.target as HTMLElement;
            if (
              target.closest("button") ||
              target.closest(".ant-btn") ||
              target.closest(".ant-checkbox")
            ) return;
            navigate(`/contacts/show/${record.id}`);
          },
          style: { cursor: "pointer" },
        })}
        rowClassName="contact-row-hover"
      >
        <Table.Column
          title="Contact"
          sorter
          dataIndex="first_name"
          render={(_: unknown, record: Contact) => (
            <Space>
              <Avatar size={36} src={record.profile_picture_url} icon={<UserOutlined />} />
              <div>
                <Text strong style={{ display: "block", lineHeight: 1.3 }}>
                  {record.first_name} {record.last_name}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>{record.email}</Text>
              </div>
            </Space>
          )}
        />
        <Table.Column dataIndex="phone" title="Phone" />
        <Table.Column
          title="Gender"
          render={(_: unknown, record: Contact) => (
            <span style={{ textTransform: "capitalize" }}>
              {(record as any).gender ?? <Text type="secondary">—</Text>}
            </span>
          )}
        />
        <Table.Column
          title="Date of Birth"
          render={(_: unknown, record: Contact) => {
            const dob = (record as any).date_of_birth;
            return dob ? new Date(dob).toLocaleDateString() : <Text type="secondary">—</Text>;
          }}
        />
        <Table.Column
          dataIndex="status"
          title="Status"
          render={(value: Contact["status"]) => (
            <Tag color={statusColor[value]}>{value?.toUpperCase()}</Tag>
          )}
        />
        <Table.Column
          dataIndex="created_at"
          title="Added"
          sorter
          render={(v: string) => new Date(v).toLocaleDateString()}
        />
        <Table.Column
          title="Actions"
          render={(_: unknown, record: Contact) => (
            <Space onClick={(e) => e.stopPropagation()}>
              <Tooltip title="View">
                <ShowButton hideText size="small" recordItemId={record.id} />
              </Tooltip>
              <Tooltip title="Export this contact">
                <Button
                  size="small"
                  icon={<DownloadOutlined />}
                  loading={exporting}
                  onClick={() => handleExport([record.id])}
                />
              </Tooltip>
              {permissions.contacts.edit && (
                <Tooltip title="Edit">
                  <EditButton hideText size="small" recordItemId={record.id} />
                </Tooltip>
              )}
              {permissions.contacts.delete && (
                <Tooltip title="Delete">
                  <DeleteButton hideText size="small" recordItemId={record.id} />
                </Tooltip>
              )}
            </Space>
          )}
        />
      </Table>

      <style>{`
        .contact-row-hover:hover > td {
          background-color: ${BASICS_COLORS.primaryLight} !important;
          transition: background-color 0.15s;
        }
      `}</style>
    </List>
  );
};
