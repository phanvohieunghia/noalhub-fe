# Bản đồ thiết kế UI: skill nào cho màn nào

Quy ước chọn skill (do Noah chốt):

- **`design-taste-frontend`** — bề mặt *marketing / công khai*, nơi ấn tượng thị giác là mục tiêu ("đẹp lung linh"): hero, landing, trang đọc, auth.
- **`impeccable`** — mọi thứ còn lại: admin, app đã đăng nhập, `packages/ui`, `apps/mobile`, Storybook. Ưu tiên rõ ràng, nhất quán, a11y, trạng thái rỗng/lỗi/loading.

**Phạm vi hiện tại: chỉ `apps/web` và `apps/admin` (cùng `packages/ui` dùng chung). `apps/mobile` và `packages/ui-native` chưa đụng tới.**

Ràng buộc chung cho cả hai skill (xem `AGENTS.md`): dùng token màu trong `packages/config/theme.css`, không hex, không `dark:` viết tay; chữ qua i18n `vi`/`en`; tái sử dụng `packages/ui` trước khi viết mới.

## A. `design-taste-frontend` — web công khai

| Màn | Route (`apps/web/app/[locale]/…`) | Thành phần chính | Ghi chú |
|---|---|---|---|
| Trang chủ | `(home)/page.tsx` | `components/home/home-content.tsx`, `home-footer.tsx`, `layout/home-header.tsx` | Ưu tiên số 1: hero, các section giới thiệu, footer |
| Blog: danh sách, danh mục, tag | `(public)/blogs/**` | `components/blog/*`, `packages/ui/src/blog` | Trang chỉ mục, thẻ bài viết |
| Blog: bài viết | `(public)/blogs/[slug]` | `components/blog/*` | Typography đọc dài, ảnh bìa, bài liên quan |
| Kho kiến thức (công khai) | `(knowledge-list)/knowledge`, `(knowledge-reading)/knowledge/[id]` | `components/learn/learn-knowledge.tsx`, `knowledge-search.tsx` | Trang đọc, mặt tiền SEO |
| Đăng nhập / đăng ký / quên & đặt lại mật khẩu | `(auth)/*`, `app/auth/callback` | `components/auth/*`, `packages/ui/src/auth`, `aurora-background.tsx` | Mặt tiền đầu tiên với người dùng mới |
| Header / footer / điều hướng công khai | — | `components/layout/site-header.tsx`, `site-footer.tsx`, `mobile-nav.tsx` | Đi cùng các trang trên để đồng bộ |

## B. `impeccable` — còn lại

### B1. Web đã đăng nhập (`(protected)`)

| Màn | Thành phần | Trọng tâm |
|---|---|---|
| Dashboard | `components/dashboard-content.tsx`, `packages/ui` `stat-card`, `metrics-card` | Phân cấp thông tin, thẻ số liệu |
| Học (làm bài, luyện, lịch sử, thống kê, review) | `components/learn/*` (~2.9k dòng), `qa-choice-list`, `qa-option-card`, `question-stats-chart` | Luồng tập trung, phản hồi đúng/sai, a11y bàn phím |
| Chat | `components/chat/*` (31 file) | Danh sách hội thoại, bong bóng, trạng thái gửi/lỗi |
| Bạn bè, Hồ sơ | `components/friends/*`, `components/profile/*` | Form, danh sách, trạng thái rỗng |

### B2. Admin (`apps/admin`, toàn bộ)

| Khu | Thành phần | Quy mô |
|---|---|---|
| Layout, điều hướng, tổng quan | `components/layout/*`, `components/overview/*` | ~1k dòng |
| Bài viết (list, editor, danh mục, slug) | `components/posts/*` | ~2.4k dòng |
| Q&A workbench (datasets, outline, sets, items, feedbacks, models, credentials, tags, templates) | `components/qa/*` (42 file) | ~13k dòng — khu lớn nhất, làm theo từng màn |
| Người dùng | `components/users/*` | ~0.5k dòng |
| Trang login admin, error state | `app/login`, `admin-error-state.tsx` | nhỏ |

### B3. Thành phần dùng chung & nền tảng

- `packages/ui` — button, input, select, table, dialog, drawer, tabs, toast, sidebar, skeleton… (nền của cả hai app; sửa ở đây ảnh hưởng mọi màn, làm trước và cẩn thận).
- `packages/ui-native` + `apps/mobile` — **tạm hoãn**, làm sau khi web và admin xong; sẽ đi theo cùng token.
- `apps/storybook` — chỉ là tài liệu; cập nhật story khi đổi component.

## C. Thứ tự đề xuất

1. **Bối cảnh cho impeccable**: repo chưa có `PRODUCT.md` / `DESIGN.md`. Chạy `impeccable` ở chế độ teach/document trước để chốt hệ thiết kế từ code hiện có, tránh mỗi màn một kiểu.
2. **`packages/ui`** (impeccable): audit + polish primitive, vì mọi thứ khác dựa vào.
3. **Trang chủ + header/footer công khai** (design-taste-frontend): thay đổi thấy rõ nhất.
4. **Auth** (design-taste-frontend).
5. **Blog + kho kiến thức** (design-taste-frontend).
6. **Học / dashboard / chat** (impeccable).
7. **Admin** (impeccable), đi từng khu: overview → posts → users → Q&A (chia nhỏ).

Mỗi bước: audit → sửa → `pnpm typecheck && pnpm lint && pnpm check-messages` → chụp màn hình ở light/dark và mobile.
