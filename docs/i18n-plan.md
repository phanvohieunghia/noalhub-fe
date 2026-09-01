# Kế hoạch i18n — `apps/web` + `apps/admin` (vi / en)

|               |                                                                                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**    | ✅ Đã implement (2026-09-02) — cả 7 đợt ở §6, kèm backend ở §4.1. Những chỗ bản vẽ lệch với thực tế đã được sửa **tại chỗ** trong tài liệu này, mỗi chỗ có ghi lý do |
| **Mục tiêu**  | 2 ngôn ngữ `vi` (mặc định) + `en`. Message **chia namespace theo page**. Ngôn ngữ **lưu vào user ở backend**, không chỉ localStorage                        |
| **Liên quan** | `docs/data-layer.md` (bắt buộc — feature này CÓ chạm backend), `docs/monorepo-plan.md`, `docs/theme-plan.md` (§7 so sánh cách lưu), `docs/blog-plan.md` (§8) |

---

## 0. Kết luận đọc trước

**a) Đây KHÔNG phải feature thuần FE như theme.** Theme lưu localStorage nên không đụng
backend; i18n lưu vào user thì phải có `language` trong `UserDto` và một endpoint ghi. Phần
backend ở §4.1 **đã làm xong** cùng đợt này (migration `1754000000000-AddUserLanguage`,
`UserDto.language`, `PATCH /api/users/me/language`), nên FE không còn chạy bằng mình cookie.

**b) Web và admin phải chọn hai chiến lược khác nhau.** `apps/web` có phần public
(`(public)/blogs/*`) cần SEO → URL phải phân biệt ngôn ngữ (`/vi/...`, `/en/...`) để có
`hreflang` và canonical riêng. `apps/admin` sau login toàn bộ, không index → **không** thêm
segment `[locale]` vào URL, chỉ đọc locale từ cookie/user. Ép cả hai dùng chung một cấu hình
routing là tự chuốc một đợt refactor URL cho admin mà chẳng được gì (§3).

**c) Khối lượng công việc nằm ở việc bóc chuỗi, không ở hạ tầng.** Provider + config +
proxy ~200 dòng. Nhưng **152 file** đang có chuỗi tiếng Việt hardcode
(`grep -rlP '[àáảã…]' apps/{web,admin}/{app,components} packages/{ui,core}/src`, đếm ngày
2026-09-02 — con số này tăng theo mỗi feature mới, đo lại trước khi ước lượng). Coi §6 là
phần chính của công việc và chia theo đợt.

**d) Nội dung blog KHÔNG dịch ở đợt này.** Bài viết là dữ liệu trong DB, dịch nó là bài toán
schema của backend (bảng translation, slug theo locale). Đợt này chỉ dịch **chrome** quanh bài
viết (nav, nút, nhãn "Bài liên quan", ngày tháng). Xem §8.1.

---

## 1. Phạm vi

**Trong phạm vi**

- 2 locale: `vi` (default) và `en`. Không có locale thứ ba, nhưng cấu hình phải để thêm được.
- Message chia **namespace theo page** (§5), nạp theo route — không bundle toàn bộ chuỗi vào
  mọi trang.
- Nguồn sự thật của lựa chọn: **`user.language` ở backend**, có cookie làm lớp đệm cho SSR và
  cho khách chưa đăng nhập (§4).
- `LanguageSwitcher` trong `packages/ui`, đặt vào header web + admin.
- Định dạng ngày/giờ/số theo locale (`packages/core/src/format-date.ts` đang hardcode
  `vi-VN`) — §7.
- SEO đa ngữ cho phần public của web: `hreflang`, canonical, sitemap, RSS — §8.

**Ngoài phạm vi (đợt này)**

- Dịch **nội dung** bài viết / category / tag (dữ liệu DB) — §8.1.
- Dịch email do backend gửi (verify, reset password). Cần BE đọc `user.language`; ghi nhận ở
  §4.1 để BE làm cùng lúc, nhưng FE không làm gì.
- Locale ngoài `vi`/`en`, RTL, số nhiều phức tạp ngoài quy tắc mặc định của ICU.
- Dịch chuỗi trong `apps/admin` **do backend trả về** (message lỗi API) — vẫn hiện nguyên văn
  từ server, xem §7.3.

---

## 2. Quyết định kỹ thuật

| Vấn đề                  | Chốt                                                            | Vì sao                                                                                                                                                              |
| ----------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Thư viện                | **`next-intl`**                                                 | Là thư viện duy nhất hỗ trợ đúng mô hình Server Component của App Router: dịch được ở cả server lẫn client, không ép "use client" lên cả cây. `react-i18next` phải bọc provider client → mất SSR của blog |
| Định dạng message       | **ICU MessageFormat** (mặc định của `next-intl`)                | Số nhiều/giới tính/ngày nằm ngay trong chuỗi, không phải nối chuỗi ở JSX                                                                                              |
| Kiểu file               | **JSON**, một file / namespace / locale                          | Diff sạch, dễ đưa cho người dịch, không cần build step                                                                                                              |
| Routing web             | **Prefix `/[locale]`, luôn hiện** (`localePrefix: "always"`)     | `/vi/blogs/x` và `/en/blogs/x` là hai URL khác nhau → có canonical + `hreflang` riêng. `as-needed` (vi không prefix) làm sitemap và cache nginx phức tạp hơn nhiều mà chỉ đẹp URL |
| Routing admin           | **Không có prefix**, locale lấy từ cookie/user                    | Không index, không share link, không cần URL phân biệt (§3.2)                                                                                                        |
| Nguồn sự thật lựa chọn  | **`user.language` (BE)**, cookie `NOALHUB_LOCALE` là cache       | Yêu cầu đề bài là lưu vào user. Cookie vẫn bắt buộc vì SSR phải biết locale **trước** khi gọi `/auth/me` (§4.2)                                                     |
| Khoá message            | **Namespace theo page + `common`** (§5)                          | Đề bài. Đồng thời là cách duy nhất để nạp theo route mà không kéo cả kho chuỗi                                                                                       |
| Chuỗi thiếu bản dịch    | **Fail build ở CI**, runtime fallback về `vi`                     | Fallback im lặng ở dev = phát hiện thiếu chuỗi trên production (§9)                                                                                                 |

---

## 3. Định tuyến

### 3.1 `apps/web` — có prefix locale

```
apps/web/app/
  layout.tsx                 ← chỉ <html>; KHÔNG biết locale (xem lưu ý dưới)
  [locale]/
    layout.tsx               ← setRequestLocale + NextIntlClientProvider + <html lang>
    (public)/blogs/...
    (auth)/login|register|...
    (protected)/chat|friends|profile|dashboard
  auth/callback/             ← giữ NGOÀI [locale]: URL này đã ghim trong OAuth redirect_uri
                               ở backend + Google/GitHub console. Đổi nó là hỏng OAuth.
```

- **`apps/web/proxy.ts`**, không phải `middleware.ts`: từ Next 16 file này đổi tên (cơ chế
  giữ nguyên — `docs/01-app/01-getting-started/16-proxy.md` trong `node_modules/next`). Nó
  dùng `createMiddleware` của `next-intl` để redirect `/` → `/vi` và gắn cookie. Matcher
  **loại trừ** `/api`, `/_next`, `/auth/callback`, và mọi đường dẫn có dấu chấm (file tĩnh,
  gồm cả `blogs/rss.xml`).
- `<html lang>` chuyển từ hardcode `"vi"` sang `params.locale`. Vì `lang` nằm trên `<html>`,
  phần `<html>/<body>` xuống `app/[locale]/layout.tsx`.

  **Root layout passthrough là không làm được** — App Router đòi mọi trang phải có `<html>`
  ở đâu đó trong chuỗi layout, mà `/auth/callback` nằm ngoài `[locale]`. Cách đúng là **hai
  root layout**: xoá hẳn `app/layout.tsx`, rồi `app/[locale]/layout.tsx` và
  `app/auth/layout.tsx` mỗi cái tự dựng `<html>` (`docs/01-app/01-getting-started/02-project-structure.md`).
  Phần dùng chung — font, theme script, provider — nằm ở `app/root-html.tsx`.
- **Mọi Server Component có dịch phải gọi `setRequestLocale(locale)`** trước khi dùng
  `getTranslations`, nếu không route rơi khỏi static rendering — blog đang dựa vào SSG/ISR
  (`docs/blog-plan.md`), mất static là mất luôn cache nginx.

### 3.2 `apps/admin` — không prefix

Không tạo `[locale]`. Dùng `getRequestConfig` đọc locale từ cookie, và `NextIntlClientProvider`
đặt ở `apps/admin/app/layout.tsx`. Đổi ngôn ngữ = ghi cookie + `router.refresh()`.

---

## 4. Lưu ngôn ngữ vào user

### 4.1 ✅ Backend — đã làm

Làm ở `noalhub-be` cùng đợt này; `/docs-json` đã có `UserDto.language` và
`PATCH /api/users/me/language`. Bảng dưới là những gì đã thêm:

| Việc                                | Chi tiết                                                                                            |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Cột `language` trên `users`         | `varchar(8)` + CHECK `IN ('vi','en')`, `NOT NULL DEFAULT 'vi'` — migration `1754000000000-AddUserLanguage`. Dùng CHECK chứ không enum của Postgres: thêm giá trị vào enum type là DDL phải chạy ngoài transaction, còn sửa CHECK chỉ là một migration bình thường. Có DEFAULT nên không cần bước backfill riêng |
| Thêm `language` vào `UserDto`       | Trả ở `GET /api/auth/me`, `POST /api/auth/login`, `/register`, `/refresh` — mọi nơi trả `AuthSessionDto` |
| `PATCH /api/users/me/language`      | Body `{ "language": "vi" \| "en" }` → trả `UserDto`. 401 nếu chưa auth                                |
| (nên có) email theo `user.language` | Ngoài phạm vi FE, nhưng lý do chính khiến giá trị này phải nằm ở server chứ không chỉ ở cookie        |

Phía FE (§4.3) đã cắm đủ: `User.language`, `changeLanguage()`, `useChangeLanguage()`.
`userSchema` dùng `z.enum([...]).catch("vi")` cho trường này — token phát **trước** migration
vẫn còn hiệu lực, và một `/auth/me` cũ thiếu trường sẽ làm parse hỏng, tức là đăng xuất cả
phiên chỉ vì một lần deploy.

### 4.2 Thứ tự ưu tiên khi resolve locale

Áp dụng ở middleware (web) và `getRequestConfig` (cả hai app):

1. **URL prefix** (chỉ web) — `/en/...` luôn thắng. Link chia sẻ phải mở đúng ngôn ngữ của
   link, không phải của người mở.
2. **Cookie `NOALHUB_LOCALE`** — `Max-Age` 1 năm, `SameSite=Lax`, **không** `HttpOnly` (client
   phải đọc được để tránh nháy), không `Secure` ở dev.
3. **`Accept-Language`** — chỉ cho khách lần đầu vào.
4. **`vi`**.

`user.language` **không** nằm trong chuỗi này ở tầng request: SSR không có token trong cookie
(token ở `tokenStore`, xem `docs/auth.md`), nên server render không biết user là ai. Thay vào
đó nó là nguồn sự thật ở tầng **đồng bộ**:

- Sau khi `bootstrap()` / login xong (`packages/ui/src/auth/auth-provider.tsx`), so
  `user.language` với cookie hiện tại. Lệch → ghi cookie theo `user.language` và, ở web,
  `router.replace` sang prefix đúng. Đây là điểm duy nhất user thắng cookie.
- Người dùng bấm `LanguageSwitcher`: đổi cookie + điều hướng **ngay** (optimistic), rồi gọi
  `PATCH /api/users/me/language` ở nền. Chưa đăng nhập thì chỉ có cookie.
- Logout: giữ nguyên cookie, không reset về `vi` — người ta vừa mới đọc bằng tiếng Anh.

### 4.3 Lớp data (bắt buộc theo `docs/data-layer.md`)

Trong `packages/api/src/users/`:

- `types.ts` — `UserLanguage = "vi" | "en"` (khai ở `../auth/types`, nơi `UserDto` sống, rồi
  re-export), và `language: UserLanguage` trong `User`.
- `schemas.ts` — `z.enum(["vi","en"]).catch("vi")` trong `userSchema`; `changeLanguageSchema`
  cho body.
- `api.ts` — `changeLanguage(input)` → `PATCH /api/users/me/language`.
- `hooks.ts` — `useChangeLanguage()`: mutation, `onSuccess` ghi lại user vào cache
  `authKeys.me()` **và** `useAuthStore` (giống `useChangeUsername`) — thiếu bước sau thì
  `bootstrap()` lần tới kéo giao diện về ngôn ngữ cũ.
- `index.ts` — chỉ export type + hook. `LanguageSwitcher` import từ `@noalhub/api/users`.

---

## 5. Namespace theo page

```
packages/i18n/messages/
  vi/
    common.json          ← nút, nhãn dùng lại (Lưu, Huỷ, Đang tải…), lỗi API chung
    nav.json             ← header/sidebar/footer của cả hai app
    validation.json      ← thông báo zod dùng lại (§7.3)
    web.auth.json        ← (auth)/login, register, forgot-password, reset-password
    web.blog.json        ← (public)/blogs/**
    web.chat.json        ← (protected)/chat/**
    web.friends.json
    web.profile.json
    web.dashboard.json
    admin.overview.json
    admin.posts.json     ← posts, posts/new, posts/[id], posts/categories
    admin.users.json
    admin.login.json
  en/                    ← cấu trúc GIỐNG HỆT, cùng bộ khoá
```

Quy ước:

- **Một namespace = một nhóm route**, không phải một file component. Chat có 25 component
  nhưng là một trang → một namespace.
- Trong file, lồng theo component để tránh khoá kiểu `chatSidebarEmptyStateTitle`:
  ```json
  { "sidebar": { "empty": { "title": "Chưa có cuộc trò chuyện" } } }
  ```
- Đặt ở `packages/i18n` (package mới) vì cả hai app dùng chung `common`, `nav`, `validation`.
  Nhớ thêm `"@noalhub/i18n"` vào `transpilePackages` của **cả hai** `next.config.ts` — thiếu là
  build chết ngay ở dòng `import type` đầu tiên.

**Nạp theo route — nhưng ở tầng provider, không ở `getRequestConfig`.** Bản vẽ ban đầu định
đọc pathname trong `getRequestConfig` rồi chỉ `import()` bấy nhiêu file. Không làm được:
`getRequestConfig` chỉ nhận locale, và pathname mà `proxy.ts` biết thì không có đường hợp lệ
nào đưa vào request cho `headers()` đọc (`NextResponse` của next-intl không cho chèn header
request; làm được chỉ bằng API nội bộ của Next).

Cách thay thế giữ nguyên phần **thực sự đáng giá**: server nạp cả cây (chuỗi ở server không đi
vào bundle trình duyệt), còn payload gửi cho client — thứ tốn băng thông của mọi người vào
trang — được cắt theo route bằng `<IntlProvider namespace="…">` đặt ở layout gần route nhất
(`packages/i18n/src/provider.tsx`). Trang blog vì vậy không tải chuỗi của chat.

---

## 6. Bóc chuỗi — chia đợt

152 file có chuỗi tiếng Việt. **Cả 7 đợt đã xong**; bảng giữ lại làm bản đồ những gì đụng
tới ở mỗi vùng:

| Đợt | Phạm vi                                                                 | Ghi chú                                                            |
| --- | ------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| 1   | Hạ tầng: `packages/i18n`, `getRequestConfig`, middleware web, `[locale]`, `LanguageSwitcher` | Chưa dịch chuỗi nào; app vẫn chạy y hệt              |
| 2   | `nav` + `common` + `validation`                                          | Header/sidebar hai app, nút dùng lại, message zod                    |
| 3   | `web.auth` + `admin.login`                                               | Ít chuỗi, nhiều lỗi form → chốt sớm quy ước lỗi (§7.3)              |
| 4   | `web.blog` + SEO đa ngữ (§8)                                             | Phần duy nhất ảnh hưởng người ngoài                                  |
| 5   | `web.chat` (nặng nhất), `web.friends`, `web.profile`, `web.dashboard`    |                                                                      |
| 6   | `admin.posts`, `admin.users`, `admin.overview`                           |                                                                      |
| 7   | Cắm `PATCH /users/me/language` (§4.1)                                     | Làm cùng đợt 1 vì BE xong sớm; `LanguageSwitcher` ghi cookie **rồi** gọi API ở nền |

`packages/ui/src/*` là component dùng chung của hai app: **không** để nó tự gọi `useTranslations`
với namespace cố định — truyền label qua props, hoặc dùng namespace `common` mà cả hai app đều nạp.

---

## 7. Định dạng và các chuỗi không nằm trong JSON

**7.1 Ngày/giờ.** `packages/core/src/format-date.ts` giờ nhận `locale` và **cache formatter
theo locale** — tạo `Intl.DateTimeFormat` mỗi lần render là chậm thấy rõ trong danh sách chat.
Component không gọi thẳng nó mà dùng `useDateFormat()` (client + Server Component đồng bộ) hoặc
`getDateFormat()` (Server Component `async`) của `@noalhub/i18n`; hai bản vì hook không gọi
được trong `async function` component, còn `getLocale()` không dùng được ở client.

**7.2 Thời gian tương đối** ("5 phút trước") trong chat: `packages/core/src/chat/format.ts`
chỉ còn phần **tính** (`lastSeen()` trả `{kind, value}`, `dayKind()` trả ba nhóm ngày), còn
chữ nằm ở `useChatFormat()` trong `apps/web`. Ghép chuỗi trong `core` là ghép sai ở ngôn ngữ
thứ hai — số nhiều và trật tự từ khác nhau.

**7.3 Lỗi.** Ba nguồn, xử lý khác nhau:

- **Zod** (các `schemas.ts` của `@noalhub/api`) — message là khoá i18n
  (`"validation.email.invalid"`), component dịch lúc render bằng `useMessage()` của
  `@noalhub/i18n`. Đừng nhét chuỗi đã dịch vào schema: schema là module cấp app, không có locale.
- **API** — các hàm map lỗi (`adminErrorText`, `blogErrorText`, `errorText`, `ackErrorText`,
  `applyApiError`) trả `Message = { key, values? }` thay vì câu. Chuỗi trần vẫn hợp lệ ở kiểu
  đó: đấy là câu **backend** soạn, không khớp khoá nào nên `useMessage()` cho đi thẳng qua —
  vẫn là tiếng Việt kể cả ở giao diện tiếng Anh (chấp nhận đợt này, §1). Câu dự phòng do chính
  FE sinh (`client.ts`, `media/api.ts`) cũng đã đổi sang khoá.
- **Metadata / `generateMetadata`** — dùng `getTranslations({ locale, namespace })`, không phải
  `useTranslations`.

---

## 8. SEO đa ngữ (chỉ `apps/web`, phần public)

- `alternates.languages` trong `generateMetadata` của mọi route public: `vi` → `/vi/...`,
  `en` → `/en/...`, `x-default` → `/vi/...`.
- `canonical` trỏ về **chính locale đang render**, không phải về `vi`.
- `generateStaticParams` phải sinh tích `locale × slug` — quên `locale` là blog rơi khỏi SSG.
- `sitemap` liệt kê cả hai locale, kèm `alternates.languages` cho từng URL (trừ bài viết —
  §8.1). `robots.ts` phải liệt kê đường riêng tư **theo từng locale**: một dòng `/chat` không
  chặn được `/vi/chat`.
- `blogs/rss.xml` giữ **một feed tiếng Việt** (nội dung chưa dịch, §8.1), sống ở
  `/vi/blogs/rss.xml`. Đường cũ `/blogs/rss.xml` redirect **308** — khai ở `redirects()` của
  `next.config.ts`, không phải ở `proxy.ts`: matcher ở đó loại mọi đường dẫn có dấu chấm. (Next
  không cho chọn mã; 308 được Google xử lý y hệt 301.)
- `appUrl()` trong `packages/core/src/blog/seo.ts` không đổi; locale ghép ở tầng route.

**8.1 Nội dung bài viết.** Bài vẫn là tiếng Việt ở cả hai locale. Không sinh `hreflang` cho
bài viết như thể có bản dịch — Google coi đó là lỗi. Bản dịch nội dung là đợt riêng, cần BE
thêm bảng translation + slug theo locale.

---

## 9. Kiểm tra và bảo vệ

- **Script `check-messages`** (`pnpm check-messages`, chạy trong CI): so cây khoá của mọi
  locale với `vi`; thiếu, thừa, **hoặc lệch tham số ICU** (`{count}` ở `vi` mà `en` viết
  `{total}` là lỗi format lúc chạy) → fail. Không có nó thì chuỗi thiếu chỉ lộ ra khi người
  dùng đổi sang tiếng Anh. Hiện: 528 khoá × 2 locale.
- **Type-safe key**: `packages/i18n/src/app-config.ts` khai
  `declare module "next-intl" { interface AppConfig { Messages: … } }` lấy hình dạng từ file
  `vi`; mỗi app import nó một lần ở `i18n/app-config.ts` (augmentation chỉ có hiệu lực khi file
  nằm trong đồ thị import). Gõ sai khoá là lỗi TypeScript — đã bắt được ngay lần chạy đầu, ở
  chỗ sidebar admin dựng khoá bằng template string.
  **Cố ý KHÔNG khai `Locale`**: `params.locale` mà Next đưa xuống page luôn là `string`, nên
  khai nó bắt mọi page `hasLocale()` lần nữa dù `app/[locale]/layout.tsx` đã `notFound()`.
- **ESLint** — chưa bật rule chặn literal tiếng Việt trong JSX. Việc còn lại duy nhất của kế
  hoạch này; hiện chỗ chặn là `check-messages` + review.
- Test tay mỗi đợt: đổi ngôn ngữ khi **chưa đăng nhập**, đổi khi **đã đăng nhập** (phải ghi
  server), login ở tab khác với ngôn ngữ khác (cookie phải nhường `user.language`), reload
  giữa chừng (không được nháy sang `vi` rồi mới sang `en`).

---

## 10. Rủi ro

| Rủi ro                                                                 | Giảm thiểu                                                                                   |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Thêm `[locale]` làm hỏng mọi `Link`/`redirect` hardcode                 | Đã đổi hết sang `Link`/`useRouter` **từ `@noalhub/i18n/navigation`** trong `apps/web`. Hai ngoại lệ có chủ ý: `permanentRedirect` (next-intl không có bản vĩnh viễn — tự ghép `/${locale}` ở chỗ gọi) và `apps/admin`, nơi URL vốn không có locale nên vẫn dùng `next/link` |
| OAuth callback nằm sau prefix → `redirect_uri` không khớp               | Giữ `app/auth/callback` NGOÀI `[locale]` và loại khỏi middleware matcher (§3.1)                 |
| Mất static rendering của blog → nginx hết cache                         | **Đã xảy ra thật, đã sửa.** `setRequestLocale` ở mọi route public là chưa đủ: chỉ cần `not-found.tsx` gọi một API i18n phía server (nó không nhận `params` nên phải hỏi request) là **cả segment `blogs/`** rơi sang `ƒ`, kể cả `[slug]`. Chữ của trang 404 vì vậy nằm ở Client Component (`BlogNotFoundContent`), đọc message từ provider. Cách kiểm: `next build` phải cho `● /[locale]/blogs/[slug]` |
| BE chậm, "lưu vào user" không kịp                                       | Không xảy ra — BE xong trước, đợt 7 cắm luôn ở đợt 1                                             |
| Cookie nói `en` nhưng `user.language` là `vi` → nháy đổi ngôn ngữ sau login | Chấp nhận: chỉ xảy ra ngay sau khi login trên máy lạ. Không thể tránh khi SSR không biết user (§4.2) |
