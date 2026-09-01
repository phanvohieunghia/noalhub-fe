type Variant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "title-1"
  | "title-2"
  | "title-3"
  | "title-4"
  | "body-1"
  | "body-2"
  | "body-3"
  | "body-4"
  | "caption";

/**
 * Chỉ ba mức. Open Sans là font biến thiên nên về kỹ thuật có cả 300–800,
 * nhưng mở hết ra thì mỗi người chọn một số và giao diện hết nhất quán.
 */
type Weight = 400 | 500 | 600;

/**
 * ⚠️ Phải là object tra cứu với class viết NGUYÊN chuỗi. Tailwind quét mã
 * nguồn bằng regex chứ không chạy nó, nên `text-${variant}` sẽ không sinh ra
 * class nào và mọi thứ mất style ở production (đúng cái bẫy đã ghi trong
 * `globals.css`).
 *
 * `caption` gánh thêm `italic` ngay trong bảng: nghiêng là một phần ĐỊNH NGHĨA
 * của nó, không phải trang trí ở chỗ gọi.
 */
const VARIANTS: Record<Variant, string> = {
  h1: "text-h1",
  h2: "text-h2",
  h3: "text-h3",
  h4: "text-h4",
  h5: "text-h5",
  h6: "text-h6",
  "title-1": "text-title-1",
  "title-2": "text-title-2",
  "title-3": "text-title-3",
  "title-4": "text-title-4",
  "body-1": "text-body-1",
  "body-2": "text-body-2",
  "body-3": "text-body-3",
  "body-4": "text-body-4",
  caption: "text-caption italic",
};

const WEIGHTS: Record<Weight, string> = {
  400: "font-normal",
  500: "font-medium",
  600: "font-semibold",
};

/**
 * Cỡ chữ mặc định đi với độ đậm nào.
 *
 * Heading đặc (600); title 1–2 còn là tiêu đề khối nên vẫn 600, title 3–4 đã
 * xuống cỡ chữ thường nên hạ về 500 — 600 ở cỡ 14px trông như đang hét.
 */
const DEFAULT_WEIGHT: Record<Variant, Weight> = {
  h1: 600,
  h2: 600,
  h3: 600,
  h4: 600,
  h5: 600,
  h6: 600,
  "title-1": 600,
  "title-2": 600,
  "title-3": 500,
  "title-4": 500,
  "body-1": 400,
  "body-2": 400,
  "body-3": 400,
  "body-4": 400,
  caption: 400,
};

/** Thẻ HTML mặc định. `title-*`/`caption` là `<p>` vì chúng KHÔNG phải heading. */
const DEFAULT_TAG: Record<Variant, React.ElementType> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  "title-1": "p",
  "title-2": "p",
  "title-3": "p",
  "title-4": "p",
  "body-1": "p",
  "body-2": "p",
  "body-3": "p",
  "body-4": "p",
  caption: "p",
};

type TypographyProps = {
  variant?: Variant;
  weight?: Weight;
  /**
   * Thẻ HTML, tách rời khỏi `variant`.
   *
   * Cấp heading là **cấu trúc tài liệu**, cỡ chữ là **thị giác** — trộn hai
   * thứ là cách nhanh nhất để có trang nhảy từ `h1` xuống `h4`, hoặc có ba
   * `h1`. Cần một tiêu đề cấp 2 nhưng nhỏ như h4 thì viết
   * `<Typography variant="h4" as="h2">`, đừng đổi variant.
   *
   * Chú thích ảnh thì `<Typography variant="caption" as="figcaption">`.
   */
  as?: React.ElementType;
  className?: string;
  children: React.ReactNode;
  /** Cho `as="label"` — `htmlFor` không nằm trong `HTMLAttributes` chung. */
  htmlFor?: string;
} & Omit<React.HTMLAttributes<HTMLElement>, "className" | "children">;

export function Typography({
  variant = "body-2",
  weight,
  as,
  className = "",
  children,
  ...props
}: TypographyProps) {
  const Tag = as ?? DEFAULT_TAG[variant];
  const resolvedWeight = weight ?? DEFAULT_WEIGHT[variant];

  return (
    <Tag className={`${VARIANTS[variant]} ${WEIGHTS[resolvedWeight]} ${className}`} {...props}>
      {children}
    </Tag>
  );
}
