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
| GĐ 5.2 — CI kiểm thử story + a11y (`@storybook/test-runner` + Playwright) | ✅ Xong — `.github/workflows/storybook.yml` |
| GĐ 5.1 — Deploy image Docker lên ghcr (`apps/storybook/Dockerfile`) | ✅ Xong — job `storybook` trong `publish.yml`; phần compose + nginx còn phải thêm ở repo BE, xem §6 |
| GĐ 5.2 — Chromatic (visual regression) | ⏸️ Bỏ qua có chủ đích — xem §7 |

### Kiểm thử tự động trong CI

`@storybook/test-runner` mở **từng story** trong một trang Chromium thật, nên
việc render được tính là bài test: story nào ném lỗi lúc mount (thiếu key i18n,
hook gọi ngoài provider) là CI đỏ mà không ai phải viết assertion. Story có
`play` function thì được chạy luôn.

Addon `@storybook/addon-a11y` của Storybook 10 tự nối vào test-runner — không
cần `axe-playwright` hay file `.storybook/test-runner.ts` như hướng dẫn cũ. Mức
độ nghiêm ngặt khai ở `parameters.a11y.test` trong `preview.tsx`:

* `"error"` — vi phạm axe làm đỏ CI (đang dùng).
* `"todo"` — báo cáo rồi vẫn cho qua.
* `"off"` — bỏ hẳn. Đặt ở từng story khi có lý do rõ ràng, đừng tắt toàn cục.

```bash
pnpm --filter @noalhub/storybook test-storybook      # cần một Storybook đang chạy
pnpm turbo run test-storybook:ci --filter=@noalhub/storybook   # tự build + tự dựng server
```

Lần đầu chạy phải cài browser: `pnpm --filter @noalhub/storybook exec playwright install chromium`.

Workflow chỉ kích hoạt khi `apps/storybook`, `packages/{ui,config,i18n}` hoặc
lockfile đổi — sửa `apps/web` không có cách nào làm đỏ nó.

## 6. Deploy (Docker + VPS, cùng đường ống với web/admin)

Storybook build ra **web tĩnh**, không có server, nên runtime của image là
`nginx:alpine` phục vụ file chứ không phải node như hai app kia — image ~50MB
thay vì ~200MB. Cũng vì thế nó không nhận build-arg `NEXT_PUBLIC_*` nào: không
có gì để inline vào bundle.

* `apps/storybook/Dockerfile` — build context là **gốc repo** (pnpm workspace
  cần lockfile + toàn bộ `packages/*`).
* `apps/storybook/nginx.conf` — nginx **bên trong** container, dùng chung cho
  cả hai bản. Đừng nhầm với reverse proxy ở repo backend.
* Job `storybook` trong `.github/workflows/publish.yml` đẩy **hai** image:
  `ghcr.io/<owner>/noalhub-fe-storybook` và `-storybook-internal`. Job `deploy` **cố tình không**
  `needs` nó: Storybook hỏng thì không được phép chặn bản production của
  web/admin.

### Hai bản: công khai và nội bộ

Từ 2026-09-05 image được build **hai lần** từ cùng `Dockerfile`, khác nhau ở
build-arg `SB_AUDIENCE`:

| `SB_AUDIENCE` | Image | Story được index | Truy cập |
|---|---|---|---|
| `public` (mặc định của Dockerfile) | `…-storybook` | `src/components/**`, `src/foundations/**` | mở |
| `internal` (mặc định của `pnpm dev`) | `…-storybook-internal` | thêm `src/internal/**` | đăng nhập Google (oauth2-proxy) |

Vì sao phải là hai image chứ không phải một image rồi lọc theo người xem:
Storybook là **web tĩnh**. Story nào có trong bundle thì ai mở được trang cũng
đọc được nó qua `index.json` hoặc source map, dù sidebar có hiện hay không. Tag
và bộ lọc sidebar chỉ dọn danh sách cho gọn, không giấu được gì. Muốn thật sự
không cho xem thì phải **không build nó vào bản đó**.

Biến này được khai trong `turbo.json` (`build-storybook.env`). Thiếu dòng đó
thì hai lần build có cùng hash, và bản thứ hai ăn lại `storybook-static` của
bản thứ nhất — bản công khai lọt nguyên story nội bộ mà CI vẫn xanh.

### Phần còn lại nằm ở repo backend

Compose và nginx reverse proxy thuộc repo `noalhub-be`, và phần đó **đã thêm
sẵn**:

* `docker-compose.prod.yml` — service `storybook-internal` (không `ports:`, trỏ
  thẳng vào là đi vòng qua lớp đăng nhập) và `oauth2-proxy`.
* `nginx/conf.d/storybook-tls.conf.disabled` — một domain, hai đường dẫn:
  `/` là bản công khai, `/internal/` là bản nội bộ và có `auth_request`.
* `.env.example` — ba biến OAuth (client id/secret + cookie secret).
* `scripts/sync-storybook-emails.sh` — sinh danh sách email được vào từ DB (mọi
  `users` có `role = 'admin'`), chạy bằng cron. Không có file danh sách nào
  trong git: nó luôn được sinh ra.

Quy trình bật, cách thêm/bớt người, và bảng triệu chứng ↔ nguyên nhân khi hỏng:
`noalhub-be/docs/deployment.md` § "Storybook nội bộ". Không chép lại ở đây —
hai bản mô tả cùng một hạ tầng thì kiểu gì cũng lệch nhau.

Tóm tắt đủ để hình dung:

| URL | Ai vào được | Thấy gì |
|---|---|---|
| `storybook-noalhub.duckdns.org/` | mở | 119 entries — UI + Foundations |
| `storybook-noalhub.duckdns.org/internal/` | tài khoản `role = 'admin'` trong DB | 131 entries — thêm `Flows/Auth` |

Đăng nhập bằng tài khoản Google, do `oauth2-proxy` đứng trước nginx xử lý; ai
được vào thì lấy từ DB. Storybook **không** tham gia gì vào việc này: nó là web
tĩnh, không có khái niệm người dùng.

Vì sao không để nginx hỏi thẳng backend "user này có quyền không": token của app
nằm trong `localStorage` và đi bằng header `Authorization`, mà trình duyệt điều
hướng tới `/internal/` thì chỉ gửi cookie — không có gì để backend tra. Nên phần
"bạn là ai" giao cho Google, phần "ai được vào" đồng bộ từ DB ra file.

Hai điều cần nhớ khi viết story nội bộ:

* **Cổng là nhị phân.** Qua được là thấy trọn bản `internal`. Không có cách nào
  cho nhóm A thấy story này còn nhóm B thấy story kia — muốn thế phải thêm một
  bản build nữa. Số story mỗi bản chứa do `SB_AUDIENCE` quyết định lúc build,
  DB không liên quan.
* **Story vẫn chạy trong CI.** `test-storybook` build bản mặc định (`internal`)
  nên story trong `src/internal/` vẫn bị kiểm a11y và smoke test như mọi story
  khác. Nội bộ không có nghĩa là được miễn.

### Đổi audience khi chạy máy mình

`apps/storybook/.env` (copy từ `.env.example`, không vào git):

```
SB_AUDIENCE=public
```

Dùng khi cần xem đúng thứ người ngoài thấy — sidebar không còn nhóm `Flows`.
Biến đặt trên dòng lệnh vẫn thắng file: `SB_AUDIENCE=internal pnpm dev`.

File được nạp bằng `process.loadEnvFile` ngay đầu `main.ts`, không qua `dotenv`
(Node làm sẵn) và không dựa vào cơ chế `.env` của Storybook — cơ chế đó dành cho
biến đi vào bundle preview, còn `main.ts` chạy sớm hơn thế.

### Nút vào bản nội bộ

Bản công khai có một nút **🔒 Nội bộ** trên thanh công cụ, trỏ tới `/internal/`.
Nó chỉ ẩn khi đang ở trong `/internal/` — link sẽ thành `/internal/internal/`.

Điều kiện đọc từ URL lúc chạy chứ không phải từ `SB_AUDIENCE`: webpack chỉ dựng
phần preview, còn manager được bundle riêng nên `DefinePlugin` trong `main.ts`
không với tới đó. Code ở `.storybook/manager.tsx`.

**Trên localhost nút vẫn hiện và bấm vào sẽ 404** — dev server không phục vụ
đường dẫn đó. Cố ý để vậy: bản trước ẩn nó trên localhost, và hệ quả là nút biến
mất đúng lúc người ta đang dựng hoặc đi xem lại nó. Tooltip nói rõ "chỉ có trên
bản đã deploy".

Bấm vào lúc chưa đăng nhập thì rơi vào trang đăng nhập Google của oauth2-proxy —
nút chỉ là đường dẫn, nó không quyết định quyền gì cả.

Nhãn nút đổi theo toolbar ngôn ngữ ("Nội bộ" / "Internal"). Manager không dùng
được `next-intl` (nó nằm ngoài preview iframe, không có provider, và bundle của
nó không nạp `packages/i18n`) — thứ đi xuyên qua ranh giới đó là **globals** của
Storybook, đọc bằng `useGlobals()`. Bốn chuỗi để bảng ngay trong `manager.tsx`
thay vì thêm khoá vào `packages/i18n/messages/`: chỗ đó dành cho chữ của sản
phẩm, còn đây là chữ của công cụ, và mỗi khoá thêm vào là một khoá
`pnpm check-messages` bắt cả hai locale phải nuôi.

### Chữ trong story: namespace `sb`

Mọi chữ hiển thị trong story — nhãn nút mẫu, tên người mẫu, bài viết mẫu — nằm ở
`apps/storybook/messages/{vi,en}.json` dưới namespace `sb`, nạp vào chính
`NextIntlClientProvider` mà story dùng. Đổi toolbar ngôn ngữ là đổi cả phần này.

**Không** để trong `packages/i18n/messages/`: chỗ đó dành cho chữ của SẢN PHẨM.
Trộn chữ demo vào đó thì `pnpm check-messages` bắt cả hai locale phải nuôi mãi
những câu không bao giờ xuất hiện trong app. Đổi lại, hai file `sb` phải tự giữ
đồng bộ khoá — không có kiểm tra tự động.

Với story dùng `args` (để ô Controls còn gõ được), mẫu là
`label={args.label || t("...")}`: gõ vào Controls thì đè, để trống thì lấy câu
mẫu theo ngôn ngữ.

Ba thứ **không** dịch, và đó là chủ ý:

* `description` trong `argTypes` — nó là metadata của trang Docs, đọc một lần
  lúc nạp module, nằm ngoài React nên không có locale nào để mà tra.
* Dữ liệu giả lập của server: `email`, `role`, `status`, ngày tháng. Trong app
  thật chúng đến từ API, không phải chữ của giao diện.
* Mã: lệnh `pnpm …`, tên token (`primary`, `danger`), tên nút `B`/`I`.

### Viết story nội bộ

Đặt file vào `apps/storybook/src/internal/`. Không cần tag, không cần khai báo
gì thêm — chỉ vị trí thư mục quyết định. `pnpm dev` luôn thấy hết, nên lúc phát
triển không có gì khác biệt; chỉ bản build `public` là bỏ chúng ra.

## 7. Vì sao chưa dùng Chromatic

Chromatic làm hai việc: host trang Storybook và **visual regression** (chụp ảnh
từng story rồi so pixel với baseline). Phần khó tự làm là phần thứ hai, vì nó
cần môi trường render giống hệt nhau qua mỗi lần chạy — tự dựng thì font và
anti-aliasing lệch một chút là toàn bộ snapshot báo đỏ giả.

Hiện tại `test-runner` + a11y đã bắt được nhóm lỗi đắt nhất (story vỡ, tương
phản màu không đạt) mà không phụ thuộc dịch vụ ngoài và không tốn quota. Chỉ
nên thêm Chromatic khi thực sự cần chặn thay đổi giao diện ngoài ý muốn; lúc đó
cần tạo project và đặt `CHROMATIC_PROJECT_TOKEN` trong GitHub Secrets.

### Chạy thử

```bash
pnpm --filter @noalhub/storybook dev     # http://localhost:6006
pnpm --filter @noalhub/storybook build   # storybook-static/
```

Trên toolbar có hai công cụ: đổi **theme** (light/dark, gắn class `dark` lên `<html>` đúng như app thật) và đổi **ngôn ngữ** (vi/en, nạp đủ mọi namespace trong `packages/i18n/messages`). Addon `@storybook/addon-a11y` chạy kiểm tra accessibility ở tab "Accessibility".
