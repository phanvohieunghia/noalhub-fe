# Đồng bộ UI lên Figma: danh sách để chọn

- File Figma: [Noalhub](https://www.figma.com/design/boNAQePZ6fZE99zapQpSxx/Noalhub)
- Quét ngày 2026-10-28, nhánh `main`. Chỉ **đọc** code và cấu trúc file Figma, chưa đẩy hay sửa gì lên Figma.
- Ngày và cờ "chưa commit" lấy từ git; cột Figma là mình đối chiếu thủ công theo tên trang / section / biến thể.

## Cách chọn

1. Đổi `[ ]` thành `[x]` ở những dòng bạn muốn đẩy (hoặc nhắn mã trong chat, ví dụ `P01, P08, A13–A17`).
2. Mình chỉ đụng tới đúng các dòng đã chọn; dòng không chọn giữ nguyên.
3. Đẩy theo quy tắc trong `AGENTS.md`: dùng lại component / biến / text style đã có trong file, mỗi màn hình nằm trong một Section, màn hình mới vào trang (tab) mới, light/dark bằng variable mode.

## Ký hiệu

| Ký hiệu | Nghĩa |
|---|---|
| ✅ | Có trên Figma và khớp với những gì mình kiểm tra được (tên, biến thể, section). Chưa so từng pixel. |
| ➖ | Có nhưng lệch hoặc thiếu so với code (xem cột Ghi chú). |
| ❌ | Chưa có trên Figma. |
| ⚠️ chưa commit | Có file trong nhóm đang sửa dở (`git status`), mới hơn commit gần nhất nên rất có thể mới hơn Figma. |
| 🆕 file mới | File chưa từng commit. |
| 🔶 ngày | Commit đáng kể gần nhất từ **2026-10-21** trở đi, có thể mới hơn lần đẩy Figma gần nhất. |
| ngày thường | Commit đáng kể gần nhất trước 2026-10-21. |

"Đáng kể" = commit đổi từ 8 dòng trở lên trong file đó. Sửa 1–7 dòng bị bỏ qua vì làm nhiều file trông như vừa đổi giao diện, ví dụ commit `45e7928` ngày 24/10 chạm 39 file chủ yếu để thay `disabled` bằng `loading` ở các nút. Với nhóm nhiều file, ngày là ngày mới nhất trong cả nhóm.

## Chọn nhanh

- **Đã đẩy ngày 28/10** (nhóm P): P01, P05, P08, P09, P18, P20–P24, P26, P28–P43
- **Có trên Figma nhưng nên đẩy lại** (lệch ➖, đang sửa dở hoặc code đổi sau 2026-10-21): A03–A10, A12, A14, A16, F05, M15, W12
- **Chưa có trên Figma** (❌): A11, A15, A19–A27, M05–M14, P44, W05, W07, W14–W27
- **Khớp và code không đổi sau 2026-10-21** (không cần đẩy): A01, A02, A13, A17, A18, F01–F04, F06, M01–M04, P02–P04, P06, P07, P10–P17, P19, P25, P27, W01–W04, W06, W08–W11, W13

| Nhóm | Tổng | Đã đẩy 28/10 | Nên đẩy lại | Chưa có | Không cần |
|---|---:|---:|---:|---:|---:|
| F · Nền tảng | 6 | 0 | 1 | 0 | 5 |
| P · Component dùng chung | 44 | 27 | 0 | 1 | 16 |
| W · Màn hình web | 27 | 0 | 1 | 16 | 10 |
| A · Màn hình admin | 27 | 0 | 11 | 11 | 5 |
| M · Mobile | 15 | 0 | 1 | 10 | 4 |
| **Tổng** | **119** | **27** | **14** | **38** | **40** |

## Đã đẩy lên Figma ngày 28/10 (nhóm P)

Nhóm P được đẩy theo working tree lúc đó, kể cả phần chưa commit (Question card, Metrics card, Range slider...). Dòng đã đẩy ghi "đẩy 28/10" ở cột Figma và không còn nằm trong "nên đẩy lại". Tổng: 13 dòng cập nhật component đã có, 14 dòng tạo mới.

- **Tạo mới (set nào cũng có mô tả nguồn code):** Spinner, Skeleton, Textarea, Password input, Inline text field, Range slider, Image upload, Pagination, Table pagination, Stat card, Metrics card (+ Details), Tag chip, Tagged frame, Language switcher, Resize handle, Aurora background, Question card/Compact, Editor/Change mark, Scrim, Dialog, Drawer, Menu item, Menu separator, Dropdown menu, Hover flyout. Section mới `Overlays`.
- **Cập nhật:** Button, Toggle, Admin sidebar, Bottom nav, Alert, Answer option, Question card, TOC item, Section tree. Thêm ba effect style `Shadow/sm`, `Shadow/md`, `Shadow/xl` cùng họ với `Shadow/lg`.
- **Cố ý không làm:** Navigation progress và Morph icon (hoạt ảnh), Truncated tooltip (dùng lại Tooltip), Toggle ba lựa chọn, `shape="circle"` của Button (đặt radius/full trên instance), lưới chấm và chuyển động của Aurora.
- **Chưa làm:** các màn hình đã vẽ tay (modal, form, bảng) vẫn là frame cũ, chưa thay bằng component mới; đó là việc của nhóm W / A. Màn Generate dialog (A06) chưa dùng Range slider.
- **Quy ước trong file Figma:** nền hoặc viền trong suốt dùng lớp `Tint` / `Border` với layer opacity (như Badge) vì paint có biến và opacity riêng bị mất opacity khi thành instance.

## Mốc đồng bộ Figma (ước lượng)

File Figma không lưu thời điểm sửa theo từng node nên không biết chính xác lần đẩy gần nhất. Suy từ nội dung: Figma **đã có** section `AI models` trong trang `Admin · Q&A` (code thêm ngày 20/10, commit `78bd8ab`), nhưng **lúc đó chưa có** state Loading của Button (nhóm P đã đẩy lại ngày 28/10 nên giờ có) (prop `loading` thêm ngày 24/10, commit `45e7928`). Nên mình lấy mốc ≈ 2026-10-21 để gắn 🔶. Nếu bạn nhớ mốc khác, nói mình, mình tính lại cờ.

| Ngày | Commit | Nội dung |
|---|---|---|
| 2026-10-27 | `f1cc1f5` | feat(qa): paginate set questions and approve in bulk |
| 2026-10-27 | `799a289` | feat(qa): group questions by section heading and approve in bounded batches |
| 2026-10-27 | `0e39fa1` | feat(qa): chunk long section picks, retry failed parts and tidy the generate dialog |
| 2026-10-24 | `45e7928` | fix(qa): scroll to the right heading when outline titles repeat (kèm Button `loading`, 39 file) |
| 2026-10-24 | `5cd5af9` | feat(qa): add chunking picker for long sources |
| 2026-10-21 | `ce20554` | feat(ui): highlight added, replaced and removed words in the rich text editor |
| 2026-10-21 | `75287bb` | fix(a11y): label rail-locked sidebar items and MorphIcon story button |
| 2026-10-20 | `78bd8ab` | fix(admin): QA workbench layout, source flow and pasted images (thêm AI models) |
| 2026-10-18 | `08d885b` | feat: add home page, QA authoring flow and learner dataset view, refresh UI kit |
| 2026-10-06 | `7adcb62` | feat(mobile): add Expo app and ui-native |
| chưa commit | | Admin QA (sets, set detail, question card, generate dialog, templates, item form), `nav-items.ts`, `metrics-card.tsx`, file mới `qa-set-arrange-dialog.tsx`, `range-slider.tsx` |

## F · Nền tảng: token, icon, branding

Nằm ở trang `Primitives` + các biến (Variables) của file Figma.

### Token & asset

| Chọn | ID | UI | Figma | Code đổi | Ghi chú | Nguồn code |
|:---:|---|---|---|---|---|---|
| [ ] | F01 | Màu: scale brand / neutral / blush + 17 token semantic Light/Dark | ✅ Primitives › Colors · biến `Primitives` (32), `Color` (17) | 2026-10-18 | Tên token khớp theme.css; chưa so giá trị từng màu. | `packages/config/theme.css` |
| [ ] | F02 | Typography: Be Vietnam Pro + Geist Mono, thang Heading / Title / Body / caption / hero | ✅ Primitives › Typography · 16 text style | 2026-10-18 | AGENTS.md ghi text style "Open Sans" nhưng Figma và docs/theme.md dùng Be Vietnam Pro. | `packages/config/theme.css` (+1 file) |
| [ ] | F03 | Radius (sm → full) | ✅ biến `Radius` (5) | 2026-10-18 |  | `packages/config/theme.css` |
| [ ] | F04 | Layout token Laptop / Tablet / Mobile | ✅ biến `Layout` (9) | 2026-10-18 |  | `packages/config/theme.css` |
| [ ] | F05 | Icons: alias `ICONS` + toàn bộ Lucide | ➖ Primitives › Icons · 48 alias + bộ Lucide đầy đủ | 2026-10-20 | Code có thêm alias `panelLeftClose`, `panelLeftOpen`, `lock`, `home` mà Figma chưa có; Figma có `folder` mà `ICONS` không còn. | `packages/ui/src/icons.tsx` |
| [ ] | F06 | Branding: logo mark, lockup, app icon | ✅ Primitives › Branding | 2026-10-18 |  | `packages/ui/src/logo.tsx` (+1 file) |

## P · Component dùng chung

`packages/ui` và vài component của app. Trên Figma nằm ở trang `Primitives`, mỗi cái trong Section tương ứng. Đây là phần nên xử lý **trước**: các màn hình dùng instance, sửa một chỗ là lan ra mọi frame.

### Đã có trên Figma

| Chọn | ID | UI | Figma | Code đổi | Ghi chú | Nguồn code |
|:---:|---|---|---|---|---|---|
| [ ] | P01 | Button | ✅ Actions & inputs · 388 biến thể · đẩy 28/10 | 🔶 2026-10-24 | Đã thêm variant Soft / Dashed / Link và state Loading (Spinner + opacity 50 %). Link chỉ có Text × XSmall. shape "circle" không phải variant: đặt radius/full trên instance. | `packages/ui/src/button.tsx` |
| [ ] | P02 | Input | ✅ Actions & inputs · 72 biến thể | 2026-10-18 | Size lg/md/sm/xs khớp. | `packages/ui/src/input.tsx` |
| [ ] | P03 | Select + Select Option | ✅ Actions & inputs · 28 + 3 biến thể | 2026-10-18 |  | `packages/ui/src/select.tsx` |
| [ ] | P04 | Switch | ✅ Actions & inputs | 2026-10-18 |  | `packages/ui/src/switch.tsx` |
| [ ] | P05 | Toggle (List / Grid) | ✅ Actions & inputs · Variant Pill / Outline · đẩy 28/10 | 🔶 2026-10-27 | Đã thêm Outline; mục đang chọn của Pill có ring + shadow-sm; icon chưa chọn màu muted. Toggle 3 lựa chọn (Full / Compact / Grid) chưa làm: thuộc màn Question set. | `packages/ui/src/toggle.tsx` |
| [ ] | P06 | Checkbox | ✅ Table › Checkbox (sm/md × off/on/mixed) | 2026-09-09 |  | `packages/ui/src/checkbox.tsx` |
| [ ] | P07 | Tabs | ✅ Navigation › Tab, Tabs | 2026-10-18 |  | `packages/ui/src/tabs.tsx` |
| [ ] | P08 | Admin sidebar (Full / Rail) | ✅ Components (admin shell) › Admin/Sidebar · 49 biến thể · đẩy 28/10 | ⚠️ chưa commit | Đã thêm Posts (con), Datasets, Question types (trước là Question bank), Question tags và Active=Tags; sửa lỗi dòng AI bị sáng khi Datasets active. | `packages/ui/src/sidebar.tsx` (+2 file) |
| [ ] | P09 | Bottom nav (web mobile) | ✅ Navigation › Bottom nav · 9 biến thể · đẩy 28/10 | 2026-10-18 | Đã thêm tab Home và Active=Home. | `packages/ui/src/bottom-nav.tsx` (+1 file) |
| [ ] | P10 | Header web (Device × Auth) | ✅ Navigation › Header · 12 biến thể | 2026-10-18 |  | `apps/web/components/layout/site-header.tsx` (+1 file) |
| [ ] | P11 | Account menu + Theme toggle | ✅ Navigation › Account menu · Data display › Theme toggle | 2026-10-18 |  | `apps/web/components/layout/header-account.tsx` (+1 file) |
| [ ] | P12 | Footer (App / Home) | ✅ Page chrome › Footer · 7 biến thể | 2026-10-18 |  | `apps/web/components/layout/site-footer.tsx` (+1 file) |
| [ ] | P13 | Admin topbar + breadcrumb | ✅ Components (admin shell) › Admin/Topbar | 2026-10-20 |  | `apps/admin/components/layout/admin-header.tsx` (+1 file) |
| [ ] | P14 | Badge | ✅ Data display › Badge · 5 tone × 3 size | 2026-10-20 | Khớp tone/size; lỗi cũ "chữ trùng màu nền" của tone success/warning đã hết (nền là lớp Tint 12–15 %). | `packages/ui/src/badge.tsx` |
| [ ] | P15 | Avatar | ✅ Data display › Avatar (sm / md / lg) | 2026-09-04 |  | `packages/ui/src/avatar.tsx` |
| [ ] | P16 | Tooltip | ✅ Data display › Tooltip (4 hướng) | 2026-10-18 |  | `packages/ui/src/tooltip.tsx` |
| [ ] | P17 | Toast | ✅ Feedback › Toast (4 tone) | 2026-10-18 |  | `packages/ui/src/toast.tsx` |
| [ ] | P18 | Alert (inline) | ✅ Feedback › Alert · 4 tone · đẩy 28/10 | 2026-09-09 | Đổi tên Admin/Alert thành Alert và chuyển sang Feedback; thêm tone Info và Dismissible; nền tint 10 %, viền 30 %, chữ và icon theo tone. | `packages/ui/src/alert.tsx` |
| [ ] | P19 | Table: Table, Row, Cell, Header cell, Bulk actions, menu hàng / số dòng | ✅ Table · 8 component | 2026-10-20 |  | `packages/ui/src/table.tsx` |
| [ ] | P20 | Rich-text editor: Toolbar, Content, Editor | ✅ Editor › Toolbar / Content / Editor · Editor/Change mark · đẩy 28/10 | 🔶 2026-10-24 | Đã thêm Editor/Change mark (added / replaced / removed / replaced-old) theo post-prose.css. Bản thân Editor không đổi. | `packages/ui/src/blog/tiptap-editor.tsx` (+2 file) |
| [ ] | P21 | Nội dung bài viết / prose | ✅ Editor › Editor/Content (long sample) · Editor/Content (changes) · đẩy 28/10 | 🔶 2026-10-21 | Style highlight thay đổi nằm ở Editor/Change mark và câu mẫu Editor/Content (changes). | `packages/ui/src/blog/post-content.tsx` (+2 file) |
| [ ] | P22 | Câu hỏi cho người học: Answer option, Question card 6 loại, Set header | ✅ Components (Q&A) › Answer Option · 13 biến thể · đẩy 28/10 | 🔶 2026-10-21 | Đồng bộ CARD_STATES: viền 2px, shadow-sm, cao tối thiểu 56, Single chỉ còn chữ, Multi có chip vuông 24px; thêm State Chosen. | `packages/ui/src/blog/qa-question.tsx` (+2 file) |
| [ ] | P23 | Question card (admin review) | ✅ Components (Q&A) › Question card · Question card/Compact · đẩy 28/10 | ⚠️ chưa commit | Đã thêm tay kéo (Show drag handle) và Question card/Compact (density compact \| grid). | `apps/admin/components/qa/qa-question-card.tsx` (+1 file) |
| [ ] | P24 | Table of contents: Header, Item, Tree | ✅ TableOfContents · 30 biến thể · đẩy 28/10 | 🔶 2026-10-27 | Chapter dùng folder / folder-open / file-text làm nút toggle (bỏ chevron). | `apps/admin/components/qa/table-of-contents.tsx` (+3 file) |
| [ ] | P25 | Steps: Step, Menu item, Compact trigger, ribbon | ✅ Steps | 2026-10-20 |  | `apps/admin/components/qa/qa-steps.tsx` |
| [ ] | P26 | Section tree: hàng tri-state + ô chọn section | ✅ Section tree · Row 27 biến thể + Sections field · đẩy 28/10 | ⚠️ chưa commit | Mỗi dòng có số token gọn + icon zap (Show tokens). Range slider chọn số câu hỏi là component riêng (xem Range slider). | `apps/admin/components/qa/generate-sets-button.tsx` (+1 file) |
| [ ] | P27 | Native: Badge, Button, Chip, Learn header | ✅ Native · Learn | 2026-10-06 | Chưa so chi tiết với ui-native. | `packages/ui-native/src/badge.tsx` (+2 file) |

### Chưa có component trên Figma

| Chọn | ID | UI | Figma | Code đổi | Ghi chú | Nguồn code |
|:---:|---|---|---|---|---|---|
| [ ] | P28 | Dialog (Scrim + panel md / lg / fullscreen) | ✅ Overlays › Dialog · 8 biến thể, Scrim · đẩy 28/10 | 2026-10-20 | size md / lg / inset / fullscreen, tone default / success / danger. Các modal vẽ tay cũ chưa được thay bằng component này. | `packages/ui/src/dialog.tsx` |
| [ ] | P29 | Drawer / Sheet | ✅ Overlays › Drawer · 4 cạnh · đẩy 28/10 | 2026-09-05 |  | `packages/ui/src/drawer.tsx` |
| [ ] | P30 | Dropdown menu (chung) | ✅ Overlays › Dropdown menu, Menu item, Menu separator · đẩy 28/10 | 2026-10-18 |  | `packages/ui/src/dropdown-menu.tsx` |
| [ ] | P31 | Textarea | ✅ Actions & inputs › Textarea · 5 trạng thái · đẩy 28/10 | 2026-09-05 |  | `packages/ui/src/textarea.tsx` |
| [ ] | P32 | Skeleton + Spinner | ✅ Feedback › Spinner (20 biến thể), Skeleton (3) · đẩy 28/10 | 2026-09-05 |  | `packages/ui/src/skeleton.tsx` (+1 file) |
| [ ] | P33 | Pagination: số trang, link SEO, footer bảng | ✅ Navigation › Pagination, Table pagination · đẩy 28/10 | 2026-10-18 |  | `packages/ui/src/pagination.tsx` (+2 file) |
| [ ] | P34 | Stat card + Metrics card | ✅ Data display › Stat card, Metrics card, Metrics card/Details · đẩy 28/10 | ⚠️ chưa commit |  | `packages/ui/src/stat-card.tsx` (+1 file) |
| [ ] | P35 | Range slider (file mới) | ✅ Actions & inputs › Range slider · 4 trạng thái · đẩy 28/10 | 🆕 file mới |  | `packages/ui/src/range-slider.tsx` |
| [ ] | P36 | Password input | ✅ Actions & inputs › Password input · 8 biến thể · đẩy 28/10 | 2026-10-18 |  | `packages/ui/src/password-input.tsx` |
| [ ] | P37 | Inline text field (tiêu đề sửa tại chỗ) | ✅ Actions & inputs › Inline text field · 4 trạng thái · đẩy 28/10 | 2026-10-20 |  | `packages/ui/src/inline-text-field.tsx` (+2 file) |
| [ ] | P38 | Hover flyout + Truncated tooltip | ✅ Overlays › Hover flyout · đẩy 28/10 | 🔶 2026-10-27 | Truncated tooltip dùng lại component Tooltip, không cần component riêng. | `packages/ui/src/hover-flyout.tsx` (+1 file) |
| [ ] | P39 | Tag mark + chọn tag cho câu hỏi | ✅ Data display › Tag chip, Tagged frame · đẩy 28/10 | 2026-10-20 | Chưa có phần chọn tag (qa-item-tag-picker). | `packages/ui/src/tag-mark.tsx` (+1 file) |
| [ ] | P40 | Language switcher | ✅ Navigation › Language switcher · đẩy 28/10 | 2026-09-02 |  | `packages/ui/src/language-switcher.tsx` (+2 file) |
| [ ] | P41 | Image upload button | ✅ Actions & inputs › Image upload · 7 biến thể · đẩy 28/10 | 2026-10-20 |  | `packages/ui/src/media/image-upload-button.tsx` |
| [ ] | P42 | Aurora background | ✅ Branding › Aurora background · đẩy 28/10 | 2026-10-18 | Chưa vẽ lưới chấm và chuyển động. | `packages/ui/src/aurora-background.tsx` |
| [ ] | P43 | Resize handle (workbench) | ✅ Components (Q&A) › Resize handle · 3 trạng thái · đẩy 28/10 | 2026-10-18 |  | `apps/admin/components/qa/qa-resize-handle.tsx` |
| [ ] | P44 | Navigation progress, Morph icon | ❌ chưa có | 2026-10-20 | Hoạt ảnh / thanh tiến trình, thường không cần frame tĩnh. | `packages/ui/src/navigation-progress.tsx` (+1 file) |

## W · Màn hình web (`apps/web`)

Mỗi màn hình = 3 breakpoint (Laptop 1280 / Tablet 768 / Mobile 375–390).

### Đăng nhập / đăng ký

| Chọn | ID | UI | Figma | Code đổi | Ghi chú | Nguồn code |
|:---:|---|---|---|---|---|---|
| [ ] | W01 | Login | ✅ Authentication › Login · Laptop / Tablet / Mobile | 2026-10-18 |  | `apps/web/app/[locale]/(auth)/login/page.tsx` (+2 file) |
| [ ] | W02 | Register | ✅ Authentication › Register | 2026-10-18 |  | `apps/web/app/[locale]/(auth)/register/page.tsx` (+2 file) |
| [ ] | W03 | Forgot password | ✅ Authentication › Forgot password | 2026-09-02 |  | `apps/web/app/[locale]/(auth)/forgot-password/page.tsx` (+1 file) |
| [ ] | W04 | Reset password | ✅ Authentication › Reset password | 2026-10-18 |  | `apps/web/app/[locale]/(auth)/reset-password/page.tsx` (+1 file) |
| [ ] | W05 | OAuth callback (đang xử lý / lỗi) | ❌ chưa có | 2026-09-02 |  | `apps/web/app/auth/callback/page.tsx` (+1 file) |

### Trang chủ & bảng điều khiển

| Chọn | ID | UI | Figma | Code đổi | Ghi chú | Nguồn code |
|:---:|---|---|---|---|---|---|
| [ ] | W06 | Home (Laptop / Tablet / Mobile × Light / Dark) | ✅ Primitives › Layouts · 6 frame Home + 3 frame Page | 2026-10-18 |  | `apps/web/app/[locale]/(home)/page.tsx` (+6 file) |
| [ ] | W07 | Dashboard | ❌ chưa có | 2026-10-18 |  | `apps/web/app/[locale]/(protected)/dashboard/page.tsx` (+2 file) |

### Học (Q&A)

| Chọn | ID | UI | Figma | Code đổi | Ghi chú | Nguồn code |
|:---:|---|---|---|---|---|---|
| [ ] | W08 | Learn › Browse: danh sách bộ câu hỏi + bộ lọc | ✅ Q&A › Browse, Browse — Study companion | 2026-10-18 |  | `apps/web/app/[locale]/(protected)/learn/(shell)/page.tsx` (+1 file) |
| [ ] | W09 | Dialog bắt đầu / tiếp tục bộ câu hỏi | ✅ Q&A › Start a set — dialog · 2 frame | 2026-10-18 |  | `apps/web/components/learn/learn-browse.tsx` |
| [ ] | W10 | Practice (kho câu làm sai) | ✅ Q&A › Practice — mistakes · 2 frame | 2026-10-18 |  | `apps/web/app/[locale]/(protected)/learn/(shell)/practice/page.tsx` (+1 file) |
| [ ] | W11 | Stats | ✅ Q&A › Statistics | 2026-10-18 |  | `apps/web/app/[locale]/(protected)/learn/(shell)/stats/page.tsx` (+1 file) |
| [ ] | W12 | Attempt: làm bài, 7 trạng thái | ✅ Q&A › Attempt — answering a set · 7 frame | 🔶 2026-10-21 |  | `apps/web/app/[locale]/(protected)/learn/(focus)/attempts/[id]/page.tsx` (+2 file) |
| [ ] | W13 | Review | ✅ Q&A › Review | 2026-10-20 |  | `apps/web/app/[locale]/(protected)/learn/(shell)/attempts/[id]/review/page.tsx` (+1 file) |

### Chat · đề xuất trang Figma mới `Chat`

| Chọn | ID | UI | Figma | Code đổi | Ghi chú | Nguồn code |
|:---:|---|---|---|---|---|---|
| [ ] | W14 | Chat: sidebar + danh sách hội thoại + trạng thái trống | ❌ chưa có | 2026-10-18 |  | `apps/web/components/chat/chat-sidebar.tsx` (+11 file) |
| [ ] | W15 | Chat: hội thoại (tin nhắn, ngày, đã đọc, đang gõ, mất kết nối) | ❌ chưa có | 2026-10-18 |  | `apps/web/components/chat/chat-pane.tsx` (+12 file) |
| [ ] | W16 | Chat: ô soạn tin (textarea, nút gửi, thông báo offline) | ❌ chưa có | 2026-09-07 |  | `apps/web/components/chat/message-composer.tsx` (+3 file) |
| [ ] | W17 | Chat: drawer hồ sơ thành viên | ❌ chưa có | 2026-10-18 |  | `apps/web/components/chat/member-profile-drawer.tsx` |

### Bạn bè & hồ sơ · đề xuất trang Figma mới `Friends & Profile`

| Chọn | ID | UI | Figma | Code đổi | Ghi chú | Nguồn code |
|:---:|---|---|---|---|---|---|
| [ ] | W18 | Friends: danh sách | ❌ chưa có | 2026-10-18 |  | `apps/web/app/[locale]/(protected)/friends/page.tsx` (+3 file) |
| [ ] | W19 | Dialog tìm bạn | ❌ chưa có | 2026-09-09 |  | `apps/web/components/friends/find-friend-dialog.tsx` |
| [ ] | W20 | Dialog lời mời kết bạn | ❌ chưa có | 2026-09-02 |  | `apps/web/components/friends/friend-requests-dialog.tsx` |
| [ ] | W21 | Profile của tôi (+ đổi username) | ❌ chưa có | 2026-10-18 |  | `apps/web/app/[locale]/(protected)/profile/page.tsx` (+2 file) |
| [ ] | W22 | Public profile | ❌ chưa có | 2026-10-18 |  | `apps/web/app/[locale]/(protected)/profile/[username]/page.tsx` (+1 file) |

### Blog công khai · đề xuất trang Figma mới `Blog`

| Chọn | ID | UI | Figma | Code đổi | Ghi chú | Nguồn code |
|:---:|---|---|---|---|---|---|
| [ ] | W23 | Blog: danh sách bài (post card, phân trang) | ❌ chưa có | 2026-10-18 |  | `apps/web/app/[locale]/(public)/blogs/page.tsx` (+3 file) |
| [ ] | W24 | Blog: chi tiết bài (nội dung, mục lục, bài liên quan) | ❌ chưa có | 2026-10-20 |  | `apps/web/app/[locale]/(public)/blogs/[slug]/page.tsx` (+2 file) |
| [ ] | W25 | Blog: danh mục (tất cả + chi tiết) | ❌ chưa có | 2026-10-18 |  | `apps/web/app/[locale]/(public)/blogs/category/page.tsx` (+4 file) |
| [ ] | W26 | Blog: tag (tất cả + chi tiết) | ❌ chưa có | 2026-10-18 |  | `apps/web/app/[locale]/(public)/blogs/tag/page.tsx` (+4 file) |
| [ ] | W27 | Blog: 404 / lỗi | ❌ chưa có | 2026-09-02 |  | `apps/web/app/[locale]/(public)/blogs/not-found.tsx` (+4 file) |

## A · Màn hình admin (`apps/admin`)

Frame admin rộng 1440. Cột "Figma" ghi tên trang › section/frame đang có.

### Đăng nhập admin

| Chọn | ID | UI | Figma | Code đổi | Ghi chú | Nguồn code |
|:---:|---|---|---|---|---|---|
| [ ] | A01 | Sign in | ✅ Admin · Authentication › Sign in · Laptop / Tablet / Mobile | 2026-10-20 |  | `apps/admin/app/login/page.tsx` (+2 file) |

### Q&A: datasets & workbench

| Chọn | ID | UI | Figma | Code đổi | Ghi chú | Nguồn code |
|:---:|---|---|---|---|---|---|
| [ ] | A02 | Datasets: danh sách + dialog thêm | ✅ Admin · Q&A › Datasets · 2 frame | 2026-10-20 |  | `apps/admin/app/(protected)/qa/datasets/page.tsx` (+1 file) |
| [ ] | A03 | Workbench: khung + bước 1 Sources (editor nguồn, phân đoạn nguồn dài) | ✅ Datasets › Workbench · Sources tab, Source editor fullscreen | ⚠️ chưa commit | Chunking picker (chọn cách chia nguồn dài) thêm 24/10; chưa kiểm tra có trên Figma. | `apps/admin/components/qa/qa-dataset-detail.tsx` (+5 file) |
| [ ] | A04 | Workbench: bước 2 Outline (+ editor toàn màn hình, đang tạo) | ✅ Datasets › Workbench · Outline tab (2), Outline editor fullscreen | ⚠️ chưa commit |  | `apps/admin/components/qa/qa-outline-step.tsx` (+2 file) |
| [ ] | A05 | Workbench: bước 3 Question sets (trống / đang tạo / sau một lượt / duyệt từng câu) | ✅ Datasets › Workbench · Question sets step · 7 frame | ⚠️ chưa commit |  | `apps/admin/components/qa/qa-sets-step.tsx` (+3 file) |
| [ ] | A06 | Workbench: dialog Generate question sets | ✅ Datasets › Workbench · generate dialog (modal) | ⚠️ chưa commit |  | `apps/admin/components/qa/generate-sets-button.tsx` (+1 file) |
| [ ] | A07 | Workbench: bước 4 Final set + modal sửa câu hỏi | ✅ Datasets › Workbench · Final set · 3 frame, Edit question (modal) | 🔶 2026-10-27 |  | `apps/admin/components/qa/qa-final-step.tsx` (+1 file) |
| [ ] | A08 | Trang Outline editor riêng (`/qa/datasets/[id]/outlines/[outlineId]`) | ➖ chỉ có Outline tab và modal; chưa thấy trang riêng | ⚠️ chưa commit |  | `apps/admin/app/(protected)/qa/datasets/[id]/outlines/[outlineId]/page.tsx` (+8 file) |

### Q&A: question sets & câu hỏi

| Chọn | ID | UI | Figma | Code đổi | Ghi chú | Nguồn code |
|:---:|---|---|---|---|---|---|
| [ ] | A09 | Question sets: danh sách | ✅ Admin · Q&A › Question sets | ⚠️ chưa commit |  | `apps/admin/app/(protected)/qa/sets/page.tsx` (+1 file) |
| [ ] | A10 | Question set: chi tiết (câu hỏi, thứ tự, publish) | ✅ Question sets › Question set detail | ⚠️ chưa commit |  | `apps/admin/app/(protected)/qa/sets/[id]/page.tsx` (+5 file) |
| [ ] | A11 | Dialog sắp xếp câu hỏi (file mới) | ❌ chưa có | 🆕 file mới |  | `apps/admin/components/qa/qa-set-arrange-dialog.tsx` |
| [ ] | A12 | Soạn / sửa một câu hỏi (form trang riêng) | ✅ Question sets › Question set editor | ⚠️ chưa commit |  | `apps/admin/app/(protected)/qa/sets/[id]/items/[itemId]/page.tsx` (+5 file) |
| [ ] | A13 | Question types: danh sách loại + xem trước 6 loại | ✅ Question types (list, grid) + 6 modal "Question preview" | 2026-10-20 |  | `apps/admin/components/qa/qa-item-types-content.tsx` (+1 file) |
| [ ] | A14 | Danh sách câu hỏi theo loại (tìm kiếm / lọc) | ➖ chưa chắc có: không thấy frame cùng tên | 2026-10-18 |  | `apps/admin/components/qa/qa-item-search-content.tsx` |
| [ ] | A15 | Tags: danh mục nhãn câu hỏi | ❌ chưa có | 2026-10-20 |  | `apps/admin/app/(protected)/qa/tags/page.tsx` (+1 file) |

### Q&A: prompts & AI

| Chọn | ID | UI | Figma | Code đổi | Ghi chú | Nguồn code |
|:---:|---|---|---|---|---|---|
| [ ] | A16 | Prompts: danh sách + dialog thêm/sửa + editor | ✅ Admin · Q&A › Prompts · 5 frame | ⚠️ chưa commit |  | `apps/admin/app/(protected)/qa/templates/page.tsx` (+1 file) |
| [ ] | A17 | AI keys: danh sách + dialog thêm/sửa | ✅ Admin · Q&A › AI keys · 3 frame | 2026-10-20 |  | `apps/admin/app/(protected)/qa/credentials/page.tsx` (+1 file) |
| [ ] | A18 | AI models: danh sách + dialog thêm / sửa / xóa | ✅ Admin · Q&A › AI models · 4 frame | 2026-10-20 |  | `apps/admin/app/(protected)/qa/models/page.tsx` (+1 file) |

### Overview, Posts, Users · đề xuất trang Figma mới `Admin · Posts` và `Admin · Overview & Users`

| Chọn | ID | UI | Figma | Code đổi | Ghi chú | Nguồn code |
|:---:|---|---|---|---|---|---|
| [ ] | A19 | Overview | ❌ chưa có | 2026-09-02 |  | `apps/admin/app/(protected)/overview/page.tsx` (+1 file) |
| [ ] | A20 | Posts: danh sách (bảng, bộ lọc, trạng thái) | ❌ component Table, Editor đã có trong Primitives | 2026-09-05 |  | `apps/admin/app/(protected)/posts/page.tsx` (+2 file) |
| [ ] | A21 | Post editor: tạo / sửa (+ SEO panel, publish dialog) | ❌ component Editor đã có trong Primitives | 🔶 2026-10-24 |  | `apps/admin/app/(protected)/posts/new/page.tsx` (+7 file) |
| [ ] | A22 | Posts: categories | ❌ chưa có | 2026-10-18 |  | `apps/admin/app/(protected)/posts/categories/page.tsx` (+1 file) |
| [ ] | A23 | Posts: slugs | ❌ chưa có | 2026-10-18 |  | `apps/admin/app/(protected)/posts/slugs/page.tsx` (+2 file) |
| [ ] | A24 | Users: danh sách | ❌ chưa có | 2026-10-18 |  | `apps/admin/app/(protected)/users/page.tsx` (+1 file) |
| [ ] | A25 | Users: chi tiết | ❌ chưa có | 2026-10-18 |  | `apps/admin/app/(protected)/users/[id]/page.tsx` (+1 file) |
| [ ] | A26 | Storybook access | ❌ chưa có | 2026-09-06 |  | `apps/admin/app/(protected)/storybook/page.tsx` (+1 file) |
| [ ] | A27 | Admin error state | ❌ chưa có | 🔶 2026-10-24 |  | `apps/admin/components/admin-error-state.tsx` |

## M · Mobile (`apps/mobile`, `packages/ui-native`)

Expo app. Trên Figma hiện chỉ có phần Learn nằm trong trang `Q&A`.

### Đã có trên Figma (Learn)

| Chọn | ID | UI | Figma | Code đổi | Ghi chú | Nguồn code |
|:---:|---|---|---|---|---|---|
| [ ] | M01 | Learn: danh sách bộ câu hỏi | ✅ Q&A › Mobile / Learn — Browse | 2026-10-18 |  | `apps/mobile/app/learn/index.tsx` (+2 file) |
| [ ] | M02 | Learn: giới thiệu dataset | ✅ Q&A › Mobile / Learn — Dataset intro | 2026-10-18 |  | `apps/mobile/app/learn/datasets/[id].tsx` (+2 file) |
| [ ] | M03 | Learn: làm bài (câu hỏi, sheet giải thích, tổng kết) | ✅ Q&A › Attempt question / answered (explanation sheet) / summary | 2026-10-20 |  | `apps/mobile/app/learn/attempts/[id]/index.tsx` (+5 file) |
| [ ] | M04 | Learn: review | ✅ Q&A › Mobile / Learn — Attempt review | 2026-10-20 |  | `apps/mobile/app/learn/attempts/[id]/review.tsx` (+3 file) |

### Chưa có trên Figma · đề xuất trang Figma mới `Mobile`

| Chọn | ID | UI | Figma | Code đổi | Ghi chú | Nguồn code |
|:---:|---|---|---|---|---|---|
| [ ] | M05 | Login | ❌ chưa có | 2026-10-06 |  | `apps/mobile/app/(auth)/login.tsx` |
| [ ] | M06 | Register | ❌ chưa có | 2026-10-06 |  | `apps/mobile/app/(auth)/register.tsx` |
| [ ] | M07 | Blog: danh sách | ❌ chưa có | 2026-10-06 |  | `apps/mobile/app/blog/index.tsx` (+1 file) |
| [ ] | M08 | Blog: chi tiết | ❌ chưa có | 2026-10-20 |  | `apps/mobile/app/blog/[slug].tsx` (+2 file) |
| [ ] | M09 | Chat: danh sách | ❌ chưa có | 2026-10-06 |  | `apps/mobile/app/chat/index.tsx` (+1 file) |
| [ ] | M10 | Chat: hội thoại | ❌ chưa có | 2026-10-06 |  | `apps/mobile/app/chat/[id].tsx` (+1 file) |
| [ ] | M11 | Friends | ❌ chưa có | 2026-10-06 |  | `apps/mobile/app/friends/index.tsx` (+1 file) |
| [ ] | M12 | Profile | ❌ chưa có | 2026-10-06 |  | `apps/mobile/app/profile/index.tsx` (+1 file) |
| [ ] | M13 | Public profile | ❌ chưa có | 2026-10-06 |  | `apps/mobile/app/profile/[username].tsx` (+1 file) |
| [ ] | M14 | ui-native: Alert, Avatar, Input, Spinner, Icon | ❌ chưa có | 2026-10-06 |  | `packages/ui-native/src/alert.tsx` (+4 file) |
| [ ] | M15 | Component mobile: back button, answer input, explanation sheet, post content | ➖ sheet giải thích đã vẽ tay trong frame, chưa là component | 2026-10-20 |  | `apps/mobile/components/back-button.tsx` (+3 file) |

## Chỉ có trên Figma, chưa thấy trong code

- `Admin · Authentication › Two-step verification` và `Forgot password`: `admin.login.json` và `apps/admin/app/login` chỉ có màn Sign in. Giữ nguyên, hoặc bạn muốn xóa thì nói.
- `Primitives › Icons › folder`: alias này không còn trong `ICONS` (xem F05).

## Lưu ý khi đọc bảng

- ✅ nghĩa là có và khớp theo những gì mình đối chiếu được, không phải đã so từng pixel. Mục nào bạn thấy cũ thì cứ chọn, mình sẽ so lại trước khi sửa.
- `Home` nằm trong `Primitives › Layouts` (không có trang riêng); `Q&A` có hai phiên bản Browse (`Browse` và `Browse — Study companion`).
- Mỗi màn hình mới tốn khá nhiều thao tác Figma (3 breakpoint). Nên chọn theo lượt, vài màn hình mỗi lượt, để kiểm tra bằng ảnh chụp trước khi sang lượt sau.

