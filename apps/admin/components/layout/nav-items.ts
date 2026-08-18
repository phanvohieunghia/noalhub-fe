/**
 * Nguồn sự thật duy nhất của điều hướng admin — sidebar và breadcrumb đọc chung
 * mảng này, nếu không hai chỗ sẽ lệch tên ngay lần đổi đầu tiên.
 *
 * `disabled` = màn hình cần contract chưa có ở backend (`docs/admin-plan.md`
 * §3). Hiện mục ra nhưng khoá lại là cố ý: giấu đi thì mỗi lần review lại có
 * người hỏi "sao không có phần hội thoại", còn cho bấm vào thì ra trang 404.
 */
export type NavItem = {
  href: string;
  label: string;
  disabled?: boolean;
  /** Lý do khoá, hiện dưới dạng tooltip. */
  reason?: string;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/overview", label: "Tổng quan" },
  { href: "/users", label: "Người dùng" },
  {
    href: "/conversations",
    label: "Hội thoại",
    disabled: true,
    reason: "Chờ backend: chưa có endpoint /admin/conversations (admin-plan §3)",
  },
  {
    href: "/reports",
    label: "Báo cáo",
    disabled: true,
    reason: "Chờ backend: chưa có luồng report (admin-plan §3.1)",
  },
];
