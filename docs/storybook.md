# Kế Hoạch Triển Khai Storybook

Tài liệu này mô tả chi tiết kế hoạch, kiến trúc và các bước triển khai [Storybook](https://storybook.js.org/) cho hệ sinh thái Noalhub FE. Mục tiêu của việc tích hợp này là tạo ra một môi trường phát triển, kiểm thử và quản lý UI components một cách trực quan, độc lập và có hệ thống.

## 1. Mục Tiêu và Lợi Ích

* **Quản lý trực quan:** Xem tất cả các UI component, trạng thái (states), và biến thể (variants) tại một nơi duy nhất.
* **Phát triển độc lập (Isolated Development):** Xây dựng component mà không cần khởi động toàn bộ ứng dụng hay thiết lập routing/data giả.
* **Tài liệu hoá (Documentation):** Tự động tạo tài liệu cho các component, giúp các lập trình viên mới dễ dàng tái sử dụng mà không cần đọc code bên trong.
* **Kiểm thử (Testing):** Hỗ trợ Visual Regression Testing, Accessibility (a11y) testing.

## 2. Kiến Trúc Triển Khai Trong Monorepo

Dự án hiện tại là một Turborepo gồm các apps (`web`, `admin`) và packages (`ui`, `config`, `i18n`, `api`). 

**Vị trí & Cấu trúc (Quyết định):** Tạo một app độc lập hoàn toàn tại `apps/storybook`.
*   **Lý do:** Giữ cho thư mục mã nguồn `packages/ui` sạch sẽ 100%, không bị trộn lẫn giữa source code UI và các file `*.stories.tsx` hay cấu hình Storybook.
*   **Cách hoạt động:** 
    *   Storybook sẽ chạy như một app riêng biệt (tương tự như web/admin).
    *   Tất cả các file stories (`*.stories.tsx`) sẽ được đặt bên trong `apps/storybook/src/`.
    *   Các file story này sẽ import components trực tiếp từ `@noalhub/ui` để render (Ví dụ: `import { Button } from '@noalhub/ui'`).

## 3. Lộ Trình Triển Khai (Roadmap) Cực Kì Chi Tiết

### Giai Đoạn 1: Khởi Tạo & Cấu Hình Cơ Bản
* **Bước 1.1:** Khởi tạo `apps/storybook`.
  * Khởi tạo Storybook với framework `@storybook/nextjs` (Quyết định sử dụng để tương thích 100% với Next.js App Router, tự động hỗ trợ Server Components, `next/image`, `next/link` và đồng bộ cấu hình).
  * Cài đặt các addons tiêu chuẩn: `@storybook/addon-links`, `@storybook/addon-essentials`, `@storybook/addon-interactions`, `@storybook/addon-a11y`.
* **Bước 1.2:** Cấu hình thư mục chứa stories.
  * Thiết lập `.storybook/main.ts` bên trong `apps/storybook` để quét tất cả các file `*.stories.tsx` bên trong thư mục `apps/storybook/src`.
* **Bước 1.3:** Cập nhật file `package.json` của `apps/storybook`.
  * Khai báo dependency trỏ đến UI package của dự án (ví dụ `@noalhub/ui`).
  * Thêm các scripts: `"dev": "storybook dev -p 6006"`, `"build": "storybook build"`.
* **Bước 1.4:** Cấu hình Turborepo (`turbo.json`).
  * Thêm task `storybook` (không cache, chạy dạng persistent) và `build-storybook` vào pipeline để có thể khởi chạy từ thư mục root.

### Giai Đoạn 2: Tích Hợp Môi Trường & Context (Quan Trọng)
Môi trường render của component trong Storybook cần giống hệt với môi trường chạy thực tế trong ứng dụng Next.js.
* **Bước 2.1: Tích hợp Theme & Tailwind CSS.**
  * Import file `packages/config/theme.css` vào file `.storybook/preview.ts`.
  * Đảm bảo các utility classes của Tailwind hoạt động chính xác trong Storybook.
  * Tích hợp `@storybook/addon-themes` để cấu hình nút chuyển đổi Light/Dark/System mode trực tiếp trên thanh công cụ của Storybook, mô phỏng đúng các biến màu từ `theme.css`.
* **Bước 2.2: Tích hợp đa ngôn ngữ (i18n).**
  * Theo chuẩn dự án, không có hardcode text trong UI. Cần tạo một custom Decorator trong `.storybook/preview.ts` để bọc các component trong `NextIntlClientProvider` (hoặc provider i18n tương ứng).
  * Cung cấp dữ liệu dịch từ `packages/i18n/messages/{vi,en}` và thêm công cụ chuyển đổi ngôn ngữ (vi/en) vào thanh công cụ.
* **Bước 2.3: Tích hợp Router & Icons.**
  * Bổ sung Decorator để mock các API của Next.js Router nếu UI có sử dụng các thành phần điều hướng.
  * Import và cấu hình thư viện icon (e.g. `@iconify/react`) nếu cần thiết.

### Giai Đoạn 3: Cấu Trúc File & Viết Story Cho Base Components
* **Bước 3.1: Định nghĩa quy chuẩn viết Story.**
  * Không tạo file story bên trong `packages/ui`. Mọi component cần test sẽ được viết file story tương ứng nằm bên trong `apps/storybook/src/` (Ví dụ: `apps/storybook/src/components/Button.stories.tsx`).
  * Sử dụng Component Story Format (CSF) phiên bản 3.
  * Tận dụng tối đa việc tự động sinh (auto-generate) bảng Props (ArgTypes) thông qua việc export đúng chuẩn TypeScript interfaces.
* **Bước 3.2: Viết Stories cho nhóm Elements (Cơ bản).**
  * Triển khai cho Buttons, Inputs, Checkboxes, Radios, Badges.
  * Các story cần cover đầy đủ các variants (primary, secondary, danger, outline) và states (hover, active, disabled, loading).
* **Bước 3.3: Viết Stories cho nhóm Data Display & Feedback.**
  * Triển khai cho Cards, Avatars, Tooltips, Toasts, Dialogs. Chú ý tương thích với Radix UI primitives nếu dự án đang dùng.

### Giai Đoạn 4: Viết Stories Cho Complex Components
* **Bước 4.1: Tích hợp Form.**
  * Viết các story mô phỏng việc sử dụng form components (như InputField, SelectField) được bọc bên trong Form context, tích hợp `react-hook-form` và `zod` validation để test hành vi hiển thị lỗi (error states).
* **Bước 4.2: Tích hợp Mock API & Hooks.**
  * Cài đặt `msw` (Mock Service Worker) và `msw-storybook-addon`.
  * Mock các phản hồi API để render thành công các components phức tạp (như Bảng dữ liệu có phân trang, Dropdown lấy dữ liệu từ server).

### Giai Đoạn 5: Triển Khai (Deployment) & CI/CD
* **Bước 5.1: Build tĩnh.**
  * Chạy `build-storybook` để xuất tài liệu dưới dạng web tĩnh.
* **Bước 5.2: Tích hợp CI/CD & Visual Testing (Quyết định: Chromatic).**
  * Triển khai hệ thống lên Chromatic (do đội ngũ Storybook hỗ trợ).
  * Lợi ích: Tích hợp sâu vào GitHub PR, tự động cảnh báo nếu giao diện bị thay đổi ngoài ý muốn thông qua Visual Regression Testing, và host tài liệu miễn phí.

## 4. Quy Chuẩn & Best Practices (Quy Tắc Bắt Buộc)

1. **Không Hardcode Dữ Liệu Trong Component:** Data dùng cho story phải được truyền qua `args` của Storybook, giúp người xem có thể thay đổi dữ liệu trực tiếp trên bảng Controls.
2. **Tuân Thủ Tuyệt Đối Theme Tokens:** Components trong Storybook phải dùng đúng hệ màu được định nghĩa (e.g. `bg-primary`, `text-muted-foreground`), không dùng mã màu Hex cố định.
3. **Phân Cấp Cây Thư Mục Rõ Ràng:** Khai báo thuộc tính `title` trong Story để chia nhóm hợp lý, ví dụ:
   * `title: "UI/Elements/Button"`
   * `title: "UI/Forms/TextField"`
   * `title: "UI/Overlays/Dialog"`
4. **Viết Docs Hữu Ích:** Thêm comments JS-doc đầy đủ phía trên định nghĩa prop trong TypeScript interface. Storybook sẽ đọc chúng để render bảng Docs.

## 5. Trạng Thái Triển Khai (cập nhật 2026-09-03)

| Hạng mục | Trạng thái |
| --- | --- |
| GĐ 1 — Khởi tạo `apps/storybook`, `main.ts`, scripts, `turbo.json` | ✅ Xong |
| GĐ 2.1 — Tailwind + `theme.css` + toggle Light/Dark (`@storybook/addon-themes`) | ✅ Xong |
| GĐ 2.2 — `NextIntlClientProvider` + công cụ đổi ngôn ngữ vi/en trên toolbar | ✅ Xong |
| GĐ 2.3 — Router (`@storybook/nextjs` mock sẵn) + `@iconify/react` | ✅ Xong |
| GĐ 3 — Stories cho toàn bộ component trình bày trong `packages/ui` | ✅ Xong (trừ `auth/*` và `query-provider` — provider/guard, không có gì để render) |
| Trang Docs tự sinh (`autodocs`) | ✅ Bật ở cấp `preview.tsx` cho mọi story |
| Foundations — bảng màu & type scale | ✅ `src/foundations/` — đọc trực tiếp CSS variable từ document nên luôn khớp `theme.css` và đổi theo toggle light/dark |
| GĐ 4.1 — Form story (`react-hook-form` + `zod`) | ✅ Xong (`src/components/Form.stories.tsx`) |
| GĐ 4.2 — Mock API bằng `msw` | ⏸️ Chưa làm — `packages/ui` hiện thuần trình bày, không có component nào tự gọi API nên chưa có đối tượng để mock. Chỉ cài `msw` khi xuất hiện component như vậy. |
| GĐ 5.1 — Build tĩnh (`pnpm --filter @noalhub/storybook build`) | ✅ Chạy được, xuất ra `storybook-static/` |
| GĐ 5.2 — Chromatic CI | ⏸️ Chưa làm — cần tạo project Chromatic và `CHROMATIC_PROJECT_TOKEN` trong GitHub Secrets trước. |

### Chạy thử

```bash
pnpm --filter @noalhub/storybook dev     # http://localhost:6006
pnpm --filter @noalhub/storybook build   # storybook-static/
```

Trên toolbar có hai công cụ: đổi **theme** (light/dark, gắn class `dark` lên `<html>` đúng như app thật) và đổi **ngôn ngữ** (vi/en, nạp đủ mọi namespace trong `packages/i18n/messages`). Addon `@storybook/addon-a11y` chạy kiểm tra accessibility ở tab "Accessibility".
