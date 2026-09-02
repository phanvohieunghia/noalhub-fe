# Quản lý slug

> **Đã triển khai.** BE: `noalhub-be` (`admin-blog.controller.ts`, `admin-blog.service.ts`,
> `blog/dto/list-slugs.query.dto.ts`). FE: `packages/api/src/blog/*`,
> `apps/admin/components/posts/slug-table.tsx`, `/posts/slugs`.

Màn admin để **xem, sửa, xoá** các slug cũ của bài viết. Không tạo mới.

Liên quan: `docs/blog.md` §2.4 (lịch sử slug), §5.2 (revalidate).

## 1. Bối cảnh

`blog_post_slugs` (`slug` unique → `post_id`) đã chạy: đổi slug một bài đã publish thì
slug cũ được chèn vào bảng; `GET /blog/posts/{slug}` tra bảng chính trước, không thấy thì tra
bảng phụ và vẫn trả bài; FE so `post.slug !== params.slug` → `permanentRedirect` (301).
Xem `packages/api/src/blog/server.ts:208`.

Bảng đó hiện không có UI: không xem được, không sửa được alias gõ sai, không xoá được alias rác.

⚠️ **Slug đang sống nằm ở `blog_posts.slug`, không nằm trong bảng này.** Bảng này chỉ chứa
slug **cũ**. Nên xoá sạch alias của một bài không làm bài mất đường vào — chỉ khiến các URL
cũ chuyển từ 301 sang 404. 0 alias là trạng thái bình thường của mọi bài chưa từng đổi slug.

## 2. Model

**Không cần migration.** `blog_post_slugs` đã có sẵn `created_at` (`InitBlog`), và cột giữ
slug cũ tên là **`slug`** — không phải `old_slug`. Thay đổi duy nhất ở tầng entity là thêm
`@BelongsTo(() => BlogPost)` để `include` được bài trong một query thay vì N+1.

Xoá **cứng**. Alias là dữ liệu định tuyến, không phải nội dung — không có gì để lưu trữ. Xoá
mềm đã cân nhắc rồi bỏ: nó kéo theo lọc `deleted_at IS NULL` ở đường public, partial unique
index, endpoint restore, màn thùng rác — để đổi lấy một undo chỉ khôi phục được *cấu hình*,
không cứu được lượt truy cập đã mất trong lúc URL chết.

## 3. API

```
GET    /admin/blog/slugs?page=1&limit=10&sort=created|slug&order=desc&q=&postId=
       → items: { id, slug, createdAt, post: { id, title, slug, status } }
         + total, page, limit
PATCH  /admin/blog/slugs/{id}   { slug }
DELETE /admin/blog/slugs/{id}
```

- **Không có `POST`.** Alias chỉ sinh ra một đường: tự động khi đổi slug bài đã publish.
- `post` nở sẵn trong item — cùng quy ước `category`/`tags` (`docs/blog.md` §2.3).
- `limit` mặc định 10, trần 50. Sort mặc định `created desc`.
- `q` khớp **chứa** trên `slug`, `ILIKE` — ca dùng là dán một URL nhớ mang máng. Khớp chính
  xác thì sai một ký tự là ra rỗng, người dùng kết luận nhầm "alias không tồn tại".
- `postId` để lọc theo bài (dùng ở §5.3).
- `q`/`sort`/`page` đồng bộ vào URL query, như `/users` (`docs/admin-plan.md` §61).
- Mã lỗi mới: `SLUG_ALIAS_NOT_FOUND`. `SLUG_TAKEN` tái dùng.
- `DELETE` không có luật chặn nào — xoá được cả alias cuối cùng (§1).

**Phân quyền:** cả ba endpoint nằm dưới `@Roles(UserRole.Admin)` đánh ở cấp class của
`AdminBlogController`. FE có `RoleGuard` bọc `(protected)/layout.tsx`. Trong `admin` không phân biệt thêm — mọi
admin sửa/xoá được mọi alias.

## 4. `PATCH` — rủi ro và rào

Alias tồn tại vì URL đó **đã từng chạy thật** và đang nằm trong index Google, trong backlink.
Nên `PATCH` không phải "sửa một chỗ gõ sai":

```
Trước:  /blogs/cu    → 301 → bài        (đang cứu backlink)
Sau:    /blogs/cu    → 404              (chết)
        /blogs/moi   → 301 → bài        (URL mới, chưa ai từng dùng)
```

Thiệt hại ngang `DELETE` cộng thêm một URL rác — nhưng lại đội lốt cái tên "Sửa". Và vì không
đếm lượt truy cập (§7), hệ thống **không biết** URL đó còn sống hay không để cảnh báo cụ thể.
Toàn bộ an toàn dồn vào bước xác nhận ở §4.2.

### 4.1 Rào ở backend

1. **`SLUG_TAKEN` kiểm cả hai bảng** — `blog_posts.slug` và `blog_post_slugs.slug`
   (`docs/blog.md` §2.4).
2. **Chuẩn hoá trước khi lưu**: `slugify` bỏ dấu, kebab-case — cùng hàm dùng khi tạo slug bài.
   Nhận `Hướng Dẫn Nấu Phở` thì lưu `huong-dan-nau-pho`, không từ chối. Trả về chuỗi đã chuẩn
   hoá để FE hiện lại.
3. **`post_id` bất biến.** `PATCH` chỉ nhận `slug`. Đây là rào chính của cả thiết kế: alias
   luôn dính chặt vào bài đã sinh ra nó, nên không ai trỏ được một URL cũ sang nhầm bài.
4. **Alias phải thuộc bài `published`** → `POST_NOT_PUBLISHED`. Alias của bài
   `draft`/`archived` là vô nghĩa: URL đích không trả nội dung.

### 4.2 Bước xác nhận (`PATCH`)

1. Nêu **cả hai vế** bằng URL đầy đủ, không dùng chữ "đổi tên":
   > `/blogs/huong-dan-nau-pho` sẽ **ngừng hoạt động (404)**.
   > Thay bằng `/blogs/huong-dan-nau-pho-2` → bài **Cách nấu phở ngon**.
2. Nói rõ giới hạn của hệ thống, thay vì im lặng để người dùng tưởng đã kiểm:
   > Nếu URL này còn trong kết quả tìm kiếm hoặc còn trang khác dẫn link về, lượng truy cập đó
   > sẽ mất. Hệ thống không theo dõi được điều này — hãy tự kiểm tra trước khi tiếp tục.
3. **Bắt gõ lại slug cũ.** Rào thật, không phải trang trí: buộc đọc chuỗi mình sắp phá, chặn
   cú bấm phản xạ vào nút mặc định.
4. Nút `text-danger`, nhãn là động từ thật — "Ngừng URL cũ", không phải "Lưu"/"OK".
5. Nói trước là **không có undo**.

Ngoài dialog: ô nhập hiện preview `/blogs/<slug>` và dạng đã chuẩn hoá ngay khi gõ.

### 4.3 Rào ở UI, phần còn lại

- `SLUG_TAKEN` do đụng alias **bài khác**: nói rõ đụng bài nào, kèm link sang bài đó. Báo
  trống không "slug đã tồn tại" thì người dùng bế tắc.
- **`DELETE` cũng phải xác nhận** (xoá cứng, không undo), nhưng nhẹ hơn một bậc — không bắt gõ
  lại slug. Dialog vẫn phải nêu đúng URL sắp chết và nói rõ là vĩnh viễn.

## 5. UI

### 5.1 Route & sidebar

`/posts/slugs` → `apps/admin/app/(protected)/posts/slugs/page.tsx`, cùng cấu trúc với
`posts/categories/`: `generateMetadata` dùng `getTranslations`, page bọc
`IntlProvider namespace="admin.posts"`.

Sidebar có **sub-item** dưới "Bài viết": `NavItem` thêm `children`, và cả hai màn cấu hình của
blog nằm trong đó — `/posts/categories` và `/posts/slugs`. Trước đây chúng chỉ vào được bằng
link bên trong `/posts`, tức là phải biết trước là chúng tồn tại mới tìm ra.

Nhóm **gập/mở được** bằng nút chevron, mặc định mở, trạng thái nhớ trong `localStorage`
(`admin.sidebar.collapsedGroups`). Ba chi tiết đáng chú ý:

- **Nhãn vẫn là link, chevron là nút riêng.** Cho cả hàng làm nút gập thì mất đường một-cú-bấm
  vào `/posts`; một hàng vừa điều hướng vừa gập thì không làm tốt việc nào.
- **Lưu tập ĐANG GẬP, không phải tập đang mở.** Store rỗng hoặc đọc lỗi thì mặc định là mở
  hết — đúng cái ta muốn khi không chắc.
- **Đang ở trong `/posts/*` thì nhóm mở bất kể trạng thái lưu**, và nút gập bị disable. Giấu
  mất chính hàng đang được highlight thì sidebar mâu thuẫn với trang, người dùng không biết
  mình đang đứng đâu.

Đọc `localStorage` bằng `useSyncExternalStore`, **không** phải `useEffect` + `setState`: server
không có `localStorage`, đọc trong lúc render sẽ lệch hydration. Snapshot trả **chuỗi thô**,
parse trong `useMemo` — `getSnapshot` phải ổn định theo `Object.is`, mà `JSON.parse` trả mảng
mới mỗi lần gọi thì React quay vòng vô hạn.

Dùng `<ul>` lồng chứ không chỉ thụt lề — screen reader không đọc được khoảng trắng.

Breadcrumb tra `FLAT_NAV_ITEMS` (cha + con) nên `categories` bỏ được khỏi `SEGMENT_LABEL_KEYS`;
ở đó giờ chỉ còn `new`.

⚠️ **Phải sửa logic active của sidebar.** `admin-sidebar.tsx:29` đang dùng
`pathname.startsWith(item.href + "/")`. Đây là item lồng nhau đầu tiên trong `NAV_ITEMS`, nên
ở `/posts/slugs` cả "Bài viết" và "Slug" sẽ cùng sáng. Sửa bằng cách chọn href khớp dài nhất,
tính **một lần ngoài `.map()`**:

```ts
const activeHref = NAV_ITEMS
  .filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
  .reduce((a, b) => (b.href.length > a.href.length ? b : a)).href;
```

Hàm `activeNavHref` duyệt `FLAT_NAV_ITEMS`, nên `/posts/categories` cũng ăn theo cùng một luật
khớp dài nhất.

### 5.2 Màn `/posts/slugs`

Bảng: URL cũ → `post.title` (link sang editor), ngày tạo, nút sửa, nút xoá. Có tìm kiếm
(debounce), sort, phân trang — cả ba đồng bộ vào URL query (§3). Đọc được `postId` từ query để
link ở §5.3 chạy.

Không có chọn nhiều dòng / xoá hàng loạt (§7).

Dùng lại pattern `apps/admin/components/posts/post-table.tsx` — không viết bảng thứ hai gần
giống (`AGENTS.md`, "Building UI").

### 5.3 Trong editor — `apps/admin/components/posts/seo-panel.tsx`

Section "URL cũ" **chỉ đọc**: liệt kê alias của bài đang mở kèm ngày tạo. Muốn thao tác thì
bấm link "Quản lý URL cũ" sang `/posts/slugs?postId=<id>`.

Tách vì người dùng ở editor đang **soạn nội dung**, còn sửa/xoá alias là thao tác phá URL công
khai không hoàn tác. Trộn vào một màn thì cái thứ hai bị bấm với tâm thế của cái thứ nhất.
Bắt đổi màn là một nhịp dừng rẻ tiền, và tránh dựng dialog xác nhận ở hai nơi.

Cả hai chỗ gọi cùng `GET /admin/blog/slugs`, chỉ khác `postId` — một endpoint, một hook.

### 5.4 i18n & theme

- Key dưới `admin.posts.slugs.*` trong `packages/i18n/messages/{vi,en}/` — không tạo namespace
  top-level. Thêm `nav.admin.items.slugs`. Cả **hai** locale, `pnpm check-messages` fail nếu lệch.
- Ngày qua `useDateFormat()` / `getDateFormat()`.
- Chỉ dùng token màu (`packages/config/theme.css`); nút xoá `text-danger`.

## 6. Revalidate

`PATCH`/`DELETE` thay đổi định tuyến công khai nên phải bắn revalidate, theo cơ chế đã chốt ở
`docs/blog.md` §5.2 (on-demand, `revalidateTag`).

| Thao tác | Tag phải xoá |
|---|---|
| `PATCH` alias `cu` → `moi` | `blog-post:cu` **và** `blog-post:moi` |
| `DELETE` alias `cu` | `blog-post:cu` |

Bỏ sót thì alias đã xoá khỏi DB nhưng `/blogs/cu` **vẫn** 301 vì Next còn giữ bản render đã
cache — người vận hành tưởng thao tác không ăn, bấm lại vài lần rồi kết luận tính năng hỏng.

Không đụng `blog-list`/`blog-sitemap`/`blog-categories`: alias chỉ ảnh hưởng route `/blogs/[slug]`.

## 7. Ngoài phạm vi

- **Đếm lượt truy cập / thống kê "slug nào nhiều redirect".** Không có chỗ đặt nào vừa rẻ vừa
  đúng: đếm ở backend thì ISR của `/blogs/[slug]` che mất phần lớn lượt (500 lần crawl có thể
  chỉ sinh 1 request), muốn số đúng thì phải đưa việc đối chiếu alias lên middleware — cache
  map `alias → slug` ở edge và nhân đôi logic redirect của `server.ts`.
  **Hệ quả:** không biết alias nào còn sống, nên không có cơ sở để quyết định xoá cái nào —
  mặc định đúng gần như luôn là *đừng xoá*. Nếu sau này cần, nguồn rẻ nhất là log 404/301 của
  hosting hoặc Search Console, không phải tự dựng bộ đếm.
- **Audit log.** Chưa làm. `PATCH`/`DELETE` phá URL công khai, không undo, mọi admin đều làm
  được — nhưng không có bản ghi ai làm, lúc nào, từ chuỗi nào sang chuỗi nào. Khi làm thì bám
  theo audit của publish (`docs/blog.md` §102), đừng dựng cơ chế thứ hai.
- **Thao tác hàng loạt.** Xung đột với §4.2 — rào là gõ lại từng slug, gõ 20 chuỗi thì không
  còn là hàng loạt. Muốn có bulk phải thiết kế lại rào, không phải thêm checkbox.
- **Tạo alias thủ công.** Không có `POST`. Đổi lại: không import được redirect từ hệ thống cũ,
  không thêm được URL cũ có từ trước khi bảng ra đời.
- **Slug chuyên mục / thẻ.** `docs/blog.md` §2.6 đã chốt không dựng bảng lịch sử cho chuyên mục.
- **Redirect tuỳ ý** (`/khuyen-mai` → `/blogs/abc`). Feature khác: bảng redirect chung, không
  gắn với post. Đừng nhét vào `blog_post_slugs`.
