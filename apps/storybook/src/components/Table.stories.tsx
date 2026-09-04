import type { Meta, StoryObj } from "@storybook/nextjs";
import {
  TableRoot,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  TableEmptyRow,
  TableSortHeaderCell,
} from "@noalhub/ui/table";
import { Badge } from "@noalhub/ui/badge";

const meta: Meta<typeof TableRoot> = {
  title: "UI/Data Display/Table",
  component: TableRoot,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof TableRoot>;

const sampleUsers = [
  { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "admin", status: "active" },
  { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "editor", status: "active" },
  { id: 3, name: "Lê Văn C", email: "c@gmail.com", role: "viewer", status: "suspended" },
];

export const Default: Story = {
  render: () => (
    <TableRoot caption="Danh sách người dùng">
      <TableHead>
        <TableRow>
          <TableHeaderCell>ID</TableHeaderCell>
          <TableHeaderCell>Họ và tên</TableHeaderCell>
          <TableHeaderCell>Email</TableHeaderCell>
          <TableHeaderCell>Vai trò</TableHeaderCell>
          <TableHeaderCell>Trạng thái</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {sampleUsers.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.id}</TableCell>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.role}</TableCell>
            <TableCell>
              <Badge tone={user.status === "active" ? "success" : "warning"}>
                {user.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableRoot>
  ),
};

export const EmptyState: Story = {
  render: () => (
    <TableRoot caption="Danh sách rỗng">
      <TableHead>
        <TableRow>
          <TableHeaderCell>ID</TableHeaderCell>
          <TableHeaderCell>Họ và tên</TableHeaderCell>
          <TableHeaderCell>Email</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableEmptyRow colSpan={3}>Không tìm thấy dữ liệu nào phù hợp.</TableEmptyRow>
      </TableBody>
    </TableRoot>
  ),
};
