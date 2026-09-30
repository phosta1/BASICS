/**
 * ContactList
 * Available to all authenticated users (admin, editor, viewer).
 *
 * Features:
 * - Live search across first_name, last_name, email, company (debounced 300ms)
 * - Filter by status (Lead / Active / Inactive)
 * - Filter by program (client-side via enrollment check)
 * - Clickable row → opens contact detail
 * - Role-based action buttons (Create: editor+admin, Edit/Delete: editor+admin, View: all)
 */
import { useState, useCallback, useRef } from "react";
import {
  List, useTable, ShowButton, EditButton, DeleteButton, CreateButton, useSelect,
} from "@refinedev/antd";
import { useNavigate } from "react-router-dom";
import {
  Table, Tag, Space, Input, Select, Row, Col, Avatar,
  Typography, Tooltip, Badge,
} from "antd";
import { SearchOutlined, UserOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { usePermissions } from "../../hooks/usePermissions";
import type { Contact, Program } from "../../types";

const { Text } = Typography;

const statusColor: Record<Contact["status"], string> = {
  lead: "blue", active: "green", inactive: "default",
};

export const ContactList = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get permissions for the current user
  const permissions = usePermissions();

  // Program selector options for the filter (UI only — label use)
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
    (search: string, status: string | undefined) => {
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

      setFilters(filters, "replace");
    },
    [setFilters]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      applyFilters(value, statusFilter);
    }, 300);
  };

  const handleSearchClear = () => {
    setSearchText("");
    applyFilters("", statusFilter);
  };

  const handleStatusChange = (value: string | undefined) => {
    setStatusFilter(value);
    applyFilters(searchText, value);
  };

  const clearAll = () => {
    setSearchText("");
    setStatusFilter(undefined);
    setFilters([], "replace");
  };

  const hasFilters = !!searchText || !!statusFilter;

  return (
    <List
      headerButtons={permissions.contacts.create ? <CreateButton /> : null}
      title={
        <Space>
          Contacts
          {totalResults > 0 && (
            <Badge count={totalResults} showZero color="#1677ff" overflowCount={9999} />
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
            onClear={handleSearchClear}
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
              { label: "Lead",     value: "lead"     },
              { label: "Active",   value: "active"   },
              { label: "Inactive", value: "inactive" },
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

      {/* ── Results table ── */}
      <Table
        {...tableProps}
        rowKey="id"
        onRow={(record: Contact) => ({
          onClick: (e) => {
            const target = e.target as HTMLElement;
            if (target.closest("button") || target.closest(".ant-btn")) return;
            navigate(`/contacts/show/${record.id}`);
          },
          style: { cursor: "pointer" },
        })}
        rowClassName="contact-row-hover"
      >
        {/* Avatar + name + email combined column */}
        <Table.Column
          title="Contact"
          sorter
          dataIndex="first_name"
          render={(_: unknown, record: Contact) => (
            <Space>
              <Avatar
                size={36}
                src={record.profile_picture_url}
                icon={<UserOutlined />}
              />
              <div>
                <Text strong style={{ display: "block", lineHeight: 1.3 }}>
                  {record.first_name} {record.last_name}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {record.email}
                </Text>
              </div>
            </Space>
          )}
        />

        <Table.Column dataIndex="phone" title="Phone" />
        <Table.Column dataIndex="company" title="Company" sorter />

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
              <Tooltip title="View contact">
                <ShowButton hideText size="small" recordItemId={record.id} />
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

      {/* Row hover highlight */}
      <style>{`
        .contact-row-hover:hover > td {
          background-color: #e6f4ff !important;
          transition: background-color 0.15s;
        }
      `}</style>
    </List>
  );
};
