---
name: Noalhub
description: Một phòng đọc yên tĩnh cho blog, học và trò chuyện; phẳng, viền mỏng, teal xám.
colors:
  brand-50: "#e9fcf4"
  brand-100: "#d0f7e8"
  brand-200: "#adeed9"
  brand-300: "#56dfcf"
  brand-400: "#0abab5"
  brand-600: "#067b7f"
  brand-700: "#006066"
  brand-800: "#02464d"
  brand-900: "#002e35"
  brand-950: "#001a1f"
  neutral-50: "#f6fbfc"
  neutral-100: "#eaf2f2"
  neutral-200: "#d8e2e2"
  neutral-400: "#95a1a2"
  neutral-600: "#5a6868"
  blush-100: "#ffedf3"
  blush-600: "#7f3b58"
  blush-900: "#562f3f"
  danger: "#b42318"
  success: "#15703a"
  warning: "#a03f07"
typography:
  h1:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "2.25rem"
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  h2:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "1.875rem"
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  h3:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "1.5rem"
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "0.875rem"
    lineHeight: 1.45
    letterSpacing: "0.01em"
  body:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "1rem"
    lineHeight: 1.65
  body-small:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "0.875rem"
    lineHeight: 1.6
  caption:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "0.75rem"
    lineHeight: 1.5
    letterSpacing: "0.01em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.brand-600}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    height: "40px"
    padding: "0 16px"
  button-primary-hover:
    backgroundColor: "{colors.brand-700}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.brand-900}"
    rounded: "{rounded.lg}"
    height: "40px"
  card:
    backgroundColor: "#ffffff"
    rounded: "{rounded.xl}"
    padding: "20px"
  input:
    backgroundColor: "#ffffff"
    rounded: "{rounded.lg}"
    height: "40px"
---

# Design System: Noalhub

## Overview

**Creative North Star: "The Quiet Study"**

Noalhub là một phòng đọc yên tĩnh: nền teal xám rất nhạt, chữ đi trước, mọi thứ trang trí lùi lại phía sau nội dung. Hệ thống phẳng và tiết chế; viền 1px làm công việc mà bóng đổ làm ở nơi khác. Cảm giác "chậm" đến từ khoảng thở rộng, line-height thoáng và màu ít bão hòa, không phải từ hiệu ứng.

Một bảng token duy nhất phục vụ ba chế độ: sáng, tối, hệ thống. Ở chế độ tối, bề mặt sáng hơn nền (không phải trắng), nút đổi sang chữ gần đen trên teal gốc, và hover đi sáng lên thay vì tối đi. Bề mặt công khai được phép có giọng riêng (aurora, ảnh, kiểu chữ lớn) nhưng vẫn dựng trên cùng token; admin và màn học giữ mật độ cao, quét nhanh.

**Key Characteristics:**
- Phẳng khi nghỉ, viền mỏng 1px, bóng đổ chỉ cho lớp nổi (popover, dialog, toast).
- Teal làm giọng chính, hồng blush chỉ làm vùng nhấn dịu.
- Chữ có thang riêng (`text-h1…`, `title-*`, `body-*`) mang sẵn line-height và letter-spacing.
- Mọi màu qua token ngữ nghĩa; không bao giờ dùng bậc của thang trong component.

## Colors

Một thang teal 50→950 (hue 173°→212°) cộng một thang trung tính cùng hue 200° chroma thấp; mọi chỗ khác là token ngữ nghĩa trỏ vào hai thang đó.

### Primary
- **Tiffany Teal** (#0abab5): màu gốc của thương hiệu. Chỉ dùng cho vòng focus và nút chính ở chế độ tối; không bao giờ làm chữ trên nền sáng (2,4:1).
- **Deep Lagoon** (#067b7f, `--primary` sáng): nền nút chính ở chế độ sáng, chữ trắng 5,1:1. Hover đi sang **Lagoon Night** (#006066).
- **Link Teal** (#006066 sáng, #56dfcf tối): `--accent`, cho liên kết và chữ nhấn.

### Secondary
- **Blush** (#ffedf3 nền, #7f3b58 chữ): `--highlight`, vùng callout và nhấn dịu; có bản tối (#562f3f nền, #ffedf3 chữ).

### Neutral
- **Mist** (#f6fbfc): nền trang sáng (`--background`).
- **Paper** (#ffffff): bề mặt card sáng (`--surface`).
- **Pine Night** (#002e35 nền, #02464d bề mặt): nền và bề mặt chế độ tối; bề mặt sáng hơn nền.
- **Slate Teal** (#5a6868 sáng, #95a1a2 tối): chữ phụ, 5,5–5,6:1.
- **Hairline** (#d8e2e2 sáng, #006066 tối): viền.
- **Status:** danger #b42318, success #15703a (xanh lá rõ, không ngả teal), warning #a03f07; đã chỉnh để ≥4,5:1 trên nền tint 12–15% của chính nó.

### Named Rules
**The Semantic-Only Rule.** Component chỉ dùng token ngữ nghĩa (`bg-surface`, `text-muted-foreground`, `bg-primary`). `brand-700` là nút ở sáng nhưng là viền ở tối; chạm vào bậc thang là tự đặt lại lỗi dark mode. Ngoại lệ: biểu đồ và màu avatar sinh từ tên.

**The Not-For-Text Rule.** Tiffany (#0abab5) không mang chữ trên nền sáng. Đó là màu của vòng focus và nút ở chế độ tối.

## Typography

**Display/Body Font:** Be Vietnam Pro (kèm system-ui, sans-serif), nạp qua `next/font` ở `apps/web`.
**Mono Font:** Geist Mono.

**Character:** Một họ sans duy nhất, có dấu tiếng Việt tốt, đổi vai chỉ bằng cỡ và độ đậm. Tiêu đề lớn càng co chặt, chữ nhỏ càng thoáng.

### Hierarchy
- **H1** (2.25rem, lh 1.15, ls -0.02em): tiêu đề trang.
- **H2 / H3** (1.875rem / 1.5rem, lh 1.2 / 1.3): tiêu đề mục.
- **Title 1–4** (1.25rem → 0.875rem, lh 1.4, ls +0.005–0.01em): nhãn của khối (card, hàng bảng, ô số liệu); không phải heading.
- **Body 2** (1rem, lh 1.65): mặc định. **Body 1** (1.125rem) chỉ cho đoạn dẫn. **Body 3/4** (0.875/0.75rem) cho chữ phụ.
- **Caption** (0.75rem, lh 1.5, luôn in nghiêng): chú thích ảnh.

### Named Rules
**The Tighter-As-Larger Rule.** Cỡ càng lớn thì line-height càng chặt và letter-spacing càng âm; dùng `text-h1` mang cả ba, không viết lại `leading-tight tracking-tight` tại chỗ gọi.

## Layout

Hai app Next độc lập dùng chung `packages/ui`. Web công khai là cột đọc ở giữa với khoảng thở lớn; web đăng nhập và admin dùng sidebar cộng vùng nội dung. Nhịp khoảng cách theo bậc 4/8/16/24/40px của Tailwind. Mật độ: công khai thoáng, màn học vừa, admin dày (bảng, bộ lọc, workbench). Mobile-first, `BottomNav` và `BottomSheet` thay sidebar và popover ở màn hẹp.

## Elevation & Depth

Phẳng theo mặc định. Độ sâu chủ yếu là phân lớp theo sắc độ: nền, rồi surface (sáng hơn ở chế độ tối), rồi viền 1px. Bóng đổ chỉ xuất hiện cho lớp nổi thật (popover, dropdown, dialog, drawer, toast): `shadow-sm` cho thẻ hover, `shadow-lg/xl` cho overlay.

### Named Rules
**The Flat-By-Default Rule.** Card, bảng và input không có bóng khi nghỉ. Bóng là phản hồi của trạng thái hoặc dấu hiệu của lớp nổi, không phải trang trí.

## Shapes

Bo góc theo vai trò: `rounded-lg` (8px) cho control (button, input, select, textarea), `rounded-xl` (12px) cho card và panel, `rounded-2xl` (16px) cho khối lớn, `rounded-full` cho avatar, chip, nút tròn. Viền 1px `--border`; viền nét đứt dành riêng cho hành động "thêm cái chưa có".

## Components

### Buttons
- **Shape:** bo vừa (8px), cao 40px mặc định (`lg` 48, `sm` 32, `xs` 28), chữ cỡ `title-4`.
- **Primary:** nền `--primary`, chữ `--primary-foreground`; hover đổi `--primary-hover` (tối đi ở sáng, sáng lên ở tối); bấm xuống thu nhẹ `scale(0.98)` (tắt khi reduced-motion); focus là vòng `--ring` có `ring-offset-2` cùng màu nền.
- **Outline / Ghost / Soft:** viền hairline, chữ phụ, hoặc nền `--muted`. **Danger** dùng `bg-danger text-background`. **Dashed** cho "thêm mới". **Link** cho lối tắt trong form, cặp với `size="inline"`.

### Cards / Containers
- **Corner Style:** 12px. **Background:** `--surface`. **Border:** 1px `--border`. **Padding:** 20px (16×12 ở dạng compact). Không bóng khi nghỉ.

### Inputs / Fields
- **Style:** cao 40px (lg 48, sm 32), nền surface, viền hairline, bo 8px. **Focus:** vòng `--ring` (Tiffany). **Error:** viền và chữ `--danger`.

### Navigation
- Web công khai: header mỏng với logo lockup, ngôn ngữ, chuyển theme, tài khoản. Đăng nhập và admin: sidebar; mobile dùng bottom nav. Trạng thái active nhấn bằng `--accent` hoặc nền `--muted`.

### Stat card
- Ô số liệu trong card 12px, `title` cho nhãn, số lớn, `hint` giải nghĩa số (và điều số đó không có nghĩa). Có dạng `compact` kèm thanh tiến độ mảnh.

### Auth aurora
- Trang chủ và auth dùng ba vòng mờ "aurora" trôi chậm (18/24/30s, không chia hết nhau); dim ở chế độ tối; tắt khi `prefers-reduced-motion`.

## Do's and Don'ts

### Do:
- **Do** dùng token ngữ nghĩa và thang chữ `text-h*/title-*/body-*`.
- **Do** để cả sáng lẫn tối tự đổi qua token; kiểm tra tương phản ở cả hai.
- **Do** thiết kế đủ trạng thái: rỗng, đang tải (`Skeleton`), lỗi, thành công.
- **Do** cho chuyển động tôn trọng `prefers-reduced-motion` (`motion-safe:`).
- **Do** tái dùng component trong `packages/ui` trước khi viết mới.

### Don't:
- **Don't** dùng hex, `text-white`, `bg-gray-*` hay `dark:` viết tay.
- **Don't** đặt chữ trên Tiffany `#0abab5` ở nền sáng.
- **Don't** thêm bóng đổ cho card hoặc bảng khi nghỉ.
- **Don't** dùng `transition: all`; chỉ chuyển thuộc tính cần thiết.
- **Don't** pin chuỗi chữ trong JSX; mọi chữ qua i18n `vi` và `en`.
