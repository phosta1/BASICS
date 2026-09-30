import { List, useTable, EditButton, ShowButton, DeleteButton, CreateButton } from "@refinedev/antd";
import { Table, Tag, Space } from "antd";
import type { Deal } from "../../types";

const stageColor: Record<Deal["stage"], string> = {
  prospecting: "blue",
  proposal: "orange",
  negotiation: "purple",
  won: "green",
  lost: "red",
};

export const DealList = () => {
  const { tableProps } = useTable<Deal>({
    syncWithLocation: true,
    sorters: { initial: [{ field: "created_at", order: "desc" }] },
  });

  return (
    <List headerButtons={<CreateButton />}>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="title" title="Deal Title" sorter />
        <Table.Column
          dataIndex="value"
          title="Value ($)"
          sorter
          render={(v: number) =>
            v?.toLocaleString("en-US", { style: "currency", currency: "USD" })
          }
        />
        <Table.Column
          dataIndex="stage"
          title="Stage"
          render={(v: Deal["stage"]) => (
            <Tag color={stageColor[v]}>{v.toUpperCase()}</Tag>
          )}
        />
        <Table.Column
          dataIndex="close_date"
          title="Close Date"
          render={(v?: string) => (v ? new Date(v).toLocaleDateString() : "—")}
        />
        <Table.Column
          title="Actions"
          render={(_: unknown, record: Deal) => (
            <Space>
              <ShowButton hideText size="small" recordItemId={record.id} />
              <EditButton hideText size="small" recordItemId={record.id} />
              <DeleteButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
