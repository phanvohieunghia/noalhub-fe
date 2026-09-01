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
  { href: "/posts", label: "Bài viết" },
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

/**
 * Nhãn cho segment KHÔNG phải mục nav — breadcrumb dùng làm lớp tra thứ hai,
 * trước khi rơi về "Chi tiết".
 *
 * `/posts/categories` là ví dụ đúng của loại này: nó cố tình không lên sidebar
 * (màn hình dùng vài lần một năm, vào từ trong `/posts` — `docs/blog-plan.md`
 * §7.1), nhưng để breadcrumb hiện "Chi tiết" thì đọc như một trang bài viết nào
 * đó, sai hẳn nghĩa.
 */
export const SEGMENT_LABELS: Record<string, string> = {
  categories: "Chuyên mục",
  new: "Bài mới",
};
