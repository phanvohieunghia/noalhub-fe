import type { Meta, StoryObj } from "@storybook/nextjs";
import { useMemo, useState } from "react";
import {
  TableRoot,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  TableEmptyRow,
  TableSortHeaderCell,
  type SortDirection,
} from "@noalhub/ui/table";
import { Badge } from "@noalhub/ui/badge";
import { Skeleton } from "@noalhub/ui/skeleton";

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

/*
 * ---------------------------------------------------------------------------
 * Sorting
 * ---------------------------------------------------------------------------
 * `TableSortHeaderCell` holds no state: it takes a `direction` and calls
 * `onToggle`. The state belongs to whoever owns the QUERY, because sorting is
 * the server's job — see the note on the component. This mock stands in for
 * `useSlugFilters` in admin, which keeps `sort`/`order` in the URL and hands
 * them to the list request.
 */

type SortKey = "name" | "createdAt";

/** asc → desc → off, exactly the cycle `useSlugFilters().toggleSort` implements. */
function useServerSort() {
  const [sort, setSort] = useState<SortKey | null>(null);
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  const toggle = (key: SortKey) => {
    if (sort !== key) return (setSort(key), setOrder("asc"));
    if (order === "asc") return setOrder("desc");
    setSort(null);
  };

  const directionOf = (key: SortKey): SortDirection => (sort === key ? order : false);

  return { sort, order, toggle, directionOf };
}

const sortableRows = [
  { id: 1, name: "Nguyễn Văn A", createdAt: "2026-01-12" },
  { id: 2, name: "Trần Thị B", createdAt: "2025-11-03" },
  { id: 3, name: "Lê Văn C", createdAt: "2026-03-28" },
  { id: 4, name: "Phạm Thị D", createdAt: "2025-08-19" },
];

/**
 * The interactive version. Click a header twice to reverse it and a third time
 * to clear it — "off" hands the list back to the server's default order, which
 * a two-state toggle can never get back to.
 *
 * The sorting here is done in the story only to make the click visible. A real
 * screen sends `sort`/`order` to the API instead, so the order holds across
 * every page rather than shuffling the one page already downloaded.
 */
export const Sortable: Story = {
  render: function SortableTable() {
    const { sort, order, toggle, directionOf } = useServerSort();

    const rows = useMemo(() => {
      if (!sort) return sortableRows;
      const sorted = [...sortableRows].sort((a, b) => a[sort].localeCompare(b[sort]));
      return order === "asc" ? sorted : sorted.reverse();
    }, [sort, order]);

    return (
      <div className="flex flex-col gap-3">
        <code className="text-body-4 text-muted-foreground">
          GET /api/…?sort={sort ?? "—"}&order={sort ? order : "—"}
        </code>
        <TableRoot caption="Danh sách có thể sắp xếp">
          <TableHead>
            <TableRow>
              <TableSortHeaderCell
                direction={directionOf("name")}
                onToggle={() => toggle("name")}
                sortHint="Sắp xếp theo Họ và tên"
              >
                Họ và tên
              </TableSortHeaderCell>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableSortHeaderCell
                direction={directionOf("createdAt")}
                onToggle={() => toggle("createdAt")}
                sortHint="Sắp xếp theo Ngày tạo"
              >
                Ngày tạo
              </TableSortHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>{`user${row.id}@gmail.com`}</TableCell>
                <TableCell className="whitespace-nowrap">{row.createdAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableRoot>
      </div>
    );
  },
};

/**
 * The three states side by side. The inactive column keeps a faint neutral icon
 * rather than none at all: without it the header shifts sideways the moment the
 * sort moves to another column.
 */
export const SortStates: Story = {
  render: () => (
    <TableRoot caption="Ba trạng thái sắp xếp">
      <TableHead>
        <TableRow>
          <TableSortHeaderCell direction={false} onToggle={() => {}} sortHint="Chưa sắp xếp">
            Không sắp xếp
          </TableSortHeaderCell>
          <TableSortHeaderCell direction="asc" onToggle={() => {}} sortHint="Tăng dần">
            Tăng dần
          </TableSortHeaderCell>
          <TableSortHeaderCell direction="desc" onToggle={() => {}} sortHint="Giảm dần">
            Giảm dần
          </TableSortHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell>aria-sort=&quot;none&quot;</TableCell>
          <TableCell>aria-sort=&quot;ascending&quot;</TableCell>
          <TableCell>aria-sort=&quot;descending&quot;</TableCell>
        </TableRow>
      </TableBody>
    </TableRoot>
  ),
};

/**
 * More columns than the frame is wide. The table scrolls INSIDE its own border
 * instead of pushing the page sideways, and the scroller is focusable so the
 * far columns are reachable with the keyboard alone.
 */
export const Scrollable: Story = {
  render: () => (
    <div className="max-w-lg">
      <TableRoot caption="Bảng rộng hơn khung">
        <TableHead>
          <TableRow>
            {["ID", "Họ và tên", "Email", "Vai trò", "Trạng thái", "Ngày tạo", "Ghi chú"].map(
              (column) => (
                <TableHeaderCell key={column}>{column}</TableHeaderCell>
              ),
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {sampleUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.id}</TableCell>
              <TableCell className="font-medium whitespace-nowrap">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>
                <Badge tone={user.status === "active" ? "success" : "warning"}>
                  {user.status}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap">2026-01-12</TableCell>
              <TableCell className="whitespace-nowrap">Không có</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableRoot>
    </div>
  ),
};

/** What the admin screens render while the first page is in flight. */
export const Loading: Story = {
  render: () => (
    <TableRoot caption="Đang tải">
      <TableHead>
        <TableRow>
          <TableHeaderCell>ID</TableHeaderCell>
          <TableHeaderCell>Họ và tên</TableHeaderCell>
          <TableHeaderCell>Email</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {Array.from({ length: 4 }).map((_, row) => (
          <TableRow key={row}>
            {Array.from({ length: 3 }).map((__, cell) => (
              <TableCell key={cell}>
                <Skeleton className="h-4 w-full" />
              </TableCell>
            ))}
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
