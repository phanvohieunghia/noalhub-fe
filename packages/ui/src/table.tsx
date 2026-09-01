/**
 * Bảng "trần": chỉ style + a11y, không giữ state, không biết phân trang hay
 * sort. Dựng một lần ở đây thay vì copy markup vào từng màn hình admin.
 *
 * `TableRoot` bọc `overflow-x-auto` để bảng rộng cuộn trong khung của nó, không
 * đẩy cả trang trượt ngang trên màn nhỏ.
 */
export function TableRoot({
  caption,
  className = "",
  children,
}: {
  /** Mô tả cho screen reader; ẩn khỏi mắt thường vì tiêu đề trang đã nói rồi. */
  caption: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full border-collapse text-left text-body-3">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return <thead className="border-b border-black/10 dark:border-white/15">{children}</thead>;
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-black/6 dark:divide-white/10">{children}</tbody>;
}

export function TableRow({
  className = "",
  children,
  ...props
}: React.ComponentPropsWithoutRef<"tr">) {
  return (
    <tr
      className={`transition-colors hover:bg-black/3 dark:hover:bg-white/5 ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHeaderCell({
  className = "",
  children,
  ...props
}: React.ComponentPropsWithoutRef<"th">) {
  return (
    <th
      scope="col"
      className={`px-3 py-2 text-body-4 font-medium uppercase tracking-wide opacity-60 ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({
  className = "",
  children,
  ...props
}: React.ComponentPropsWithoutRef<"td">) {
  return (
    <td className={`px-3 py-2.5 align-middle ${className}`} {...props}>
      {children}
    </td>
  );
}

/**
 * Ô trải hết bề ngang cho trạng thái rỗng / lỗi. `colSpan` bắt buộc truyền:
 * đoán sai số cột thì bảng lệch, và không có cách nào đoán đúng từ đây.
 */
export function TableEmptyRow({
  colSpan,
  children,
}: {
  colSpan: number;
  children: React.ReactNode;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-10 text-center text-body-3 opacity-60">
        {children}
      </td>
    </tr>
  );
}
