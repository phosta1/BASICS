import { List, useTable, EditButton, ShowButton, DeleteButton, CreateButton } from "@refinedev/antd";
import { Table, Space } from "antd";
import type { Program } from "../../types";

export const ProgramList = () => {
  const { tableProps } = useTable<Program>({
    syncWithLocation: true,
    sorters: { initial: [{ field: "created_at", order: "desc" }] },
  });

  return (
    <List
      headerButtons={<CreateButton />}
      title="Programs"
    >
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="name" title="Program Name" sorter />
        <Table.Column dataIndex="description" title="Description" />
        <Table.Column
          dataIndex="created_at"
          title="Created"
          render={(v: string) => new Date(v).toLocaleDateString()}
        />
        <Table.Column
          title="Actions"
          render={(_: unknown, record: Program) => (
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
