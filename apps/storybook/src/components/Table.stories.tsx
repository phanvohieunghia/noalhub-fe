import type { Meta, StoryObj } from "@storybook/nextjs";
import { useTranslations } from "next-intl";
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
  { id: 1, nameKey: "personA", email: "a@gmail.com", role: "admin", status: "active" },
  { id: 2, nameKey: "personB", email: "b@gmail.com", role: "editor", status: "active" },
  { id: 3, nameKey: "personC", email: "c@gmail.com", role: "viewer", status: "suspended" },
];

/*
 * Tên người và tiêu đề cột lấy từ `sb.table`; `email`/`role`/`status` giữ
 * nguyên vì chúng là DỮ LIỆU từ server, không phải chữ của giao diện.
 */
export const Default: Story = {
  render: function DefaultStory() {
    const t = useTranslations("sb.table");

    return (
    <TableRoot caption={t("caption")}>
      <TableHead>
        <TableRow>
          <TableHeaderCell>{t("id")}</TableHeaderCell>
          <TableHeaderCell>{t("columns.name")}</TableHeaderCell>
          <TableHeaderCell>{t("columns.email")}</TableHeaderCell>
          <TableHeaderCell>{t("columns.role")}</TableHeaderCell>
          <TableHeaderCell>{t("columns.status")}</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {sampleUsers.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.id}</TableCell>
            <TableCell className="font-medium">{t(user.nameKey)}</TableCell>
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
    );
  },
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
  { id: 1, nameKey: "personA", createdAt: "2026-01-12" },
  { id: 2, nameKey: "personB", createdAt: "2025-11-03" },
  { id: 3, nameKey: "personC", createdAt: "2026-03-28" },
  { id: 4, nameKey: "personD", createdAt: "2025-08-19" },
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
    const t = useTranslations("sb.table");
    const { sort, order, toggle, directionOf } = useServerSort();

    /*
     * Dịch TRƯỚC rồi mới sắp xếp: `localeCompare` phải chạy trên chữ người dùng
     * thấy, không phải trên khoá i18n — nếu không thì đổi ngôn ngữ mà thứ tự
     * vẫn theo tiếng Việt.
     */
    const rows = useMemo(() => {
      const named = sortableRows.map((row) => ({ ...row, name: t(row.nameKey) }));
      if (!sort) return named;
      const sorted = [...named].sort((a, b) => a[sort].localeCompare(b[sort]));
      return order === "asc" ? sorted : sorted.reverse();
    }, [sort, order, t]);

    return (
      <div className="flex flex-col gap-3">
        <code className="text-body-4 text-muted-foreground">
          GET /api/…?sort={sort ?? "—"}&order={sort ? order : "—"}
        </code>
        <TableRoot caption={t("sortable")}>
          <TableHead>
            <TableRow>
              <TableSortHeaderCell
                direction={directionOf("name")}
                onToggle={() => toggle("name")}
                sortHint={t("sortHint", { column: t("columns.name") })}
              >
                {t("columns.name")}
              </TableSortHeaderCell>
              <TableHeaderCell>{t("columns.email")}</TableHeaderCell>
              <TableSortHeaderCell
                direction={directionOf("createdAt")}
                onToggle={() => toggle("createdAt")}
                sortHint={t("sortHint", { column: t("columns.createdAt") })}
              >
                {t("columns.createdAt")}
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
  render: function SortStatesStory() {
    const t = useTranslations("sb.table");

    return (
      <TableRoot caption={t("threeStates")}>
        <TableHead>
          <TableRow>
            <TableSortHeaderCell direction={false} onToggle={() => {}} sortHint={t("unsorted")}>
              {t("unsortedShort")}
            </TableSortHeaderCell>
            <TableSortHeaderCell direction="asc" onToggle={() => {}} sortHint={t("asc")}>
              {t("asc")}
            </TableSortHeaderCell>
            <TableSortHeaderCell direction="desc" onToggle={() => {}} sortHint={t("desc")}>
              {t("desc")}
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
    );
  },
};

/**
 * More columns than the frame is wide. The table scrolls INSIDE its own border
 * instead of pushing the page sideways, and the scroller is focusable so the
 * far columns are reachable with the keyboard alone.
 */
export const Scrollable: Story = {
  render: function ScrollableStory() {
    const t = useTranslations("sb.table");

    return (
      <div className="max-w-lg">
        <TableRoot caption={t("wide")}>
          <TableHead>
            <TableRow>
              {[
                t("id"),
                t("columns.name"),
                t("columns.email"),
                t("columns.role"),
                t("columns.status"),
                t("columns.createdAt"),
                t("note"),
              ].map(
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
                <TableCell className="font-medium whitespace-nowrap">{t(user.nameKey)}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <Badge tone={user.status === "active" ? "success" : "warning"}>
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">2026-01-12</TableCell>
                <TableCell className="whitespace-nowrap">{t("none")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableRoot>
      </div>
    );
  },
};

/** What the admin screens render while the first page is in flight. */
export const Loading: Story = {
  render: function LoadingStory() {
    const t = useTranslations("sb.table");

    return (
      <TableRoot caption={t("loading")}>
        <TableHead>
          <TableRow>
            <TableHeaderCell>ID</TableHeaderCell>
            <TableHeaderCell>{t("columns.name")}</TableHeaderCell>
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
    );
  },
};

export const EmptyState: Story = {
  render: function EmptyStateStory() {
    const t = useTranslations("sb.table");

    return (
      <TableRoot caption={t("empty")}>
        <TableHead>
          <TableRow>
            <TableHeaderCell>ID</TableHeaderCell>
            <TableHeaderCell>{t("columns.name")}</TableHeaderCell>
            <TableHeaderCell>Email</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableEmptyRow colSpan={3}>{t("noResults")}</TableEmptyRow>
        </TableBody>
      </TableRoot>
    );
  },
};
