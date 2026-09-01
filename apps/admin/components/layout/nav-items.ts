/**
 * Nguồn sự thật duy nhất của điều hướng admin — sidebar và breadcrumb đọc chung
 * mảng này, nếu không hai chỗ sẽ lệch tên ngay lần đổi đầu tiên.
 *
 * `disabled` = màn hình cần contract chưa có ở backend (`docs/admin-plan.md`
 * §3). Hiện mục ra nhưng khoá lại là cố ý: giấu đi thì mỗi lần review lại có
 * người hỏi "sao không có phần hội thoại", còn cho bấm vào thì ra trang 404.
 */
/**
 * `labelKey`/`reasonKey` là **khoá** trong `nav.admin.*`, không phải chữ: file
 * này là module cấp app, nạp một lần lúc import, không biết locale nào
 * (`docs/i18n-plan.md` §7.3). Sidebar và breadcrumb dịch lúc render.
 */
/**
 * Union chứ không phải `string`: nhờ vậy `t(labelKey)` được kiểm kiểu, và một
 * khoá gõ sai là lỗi biên dịch chứ không phải chữ lạ trên sidebar (§9).
 */
export type NavLabelKey =
  | "items.overview"
  | "items.users"
  | "items.posts"
  | "items.conversations"
  | "items.reports"
  | "items.categories"
  | "items.new";

export type NavReasonKey = "disabled.conversations" | "disabled.reports";

export type NavItem = {
  href: string;
  labelKey: NavLabelKey;
  disabled?: boolean;
  /** Lý do khoá, hiện dưới dạng tooltip. */
  reasonKey?: NavReasonKey;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/overview", labelKey: "items.overview" },
  { href: "/users", labelKey: "items.users" },
  { href: "/posts", labelKey: "items.posts" },
  {
    href: "/conversations",
    labelKey: "items.conversations",
    disabled: true,
    reasonKey: "disabled.conversations",
  },
  {
    href: "/reports",
    labelKey: "items.reports",
    disabled: true,
    reasonKey: "disabled.reports",
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
export const SEGMENT_LABEL_KEYS: Record<string, NavLabelKey> = {
  categories: "items.categories",
  new: "items.new",
};
