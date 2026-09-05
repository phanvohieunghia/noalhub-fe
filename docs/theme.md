# Theme sáng/tối — `apps/web` + `apps/admin`

|                |                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| **Status**     | ✅ **Đã implement** (2026-09-01) — sai lệch so với plan ghi ở **§10** · Draft ban đầu (2026-09-01) — chưa implement · bảng màu `#0ABAB5 / #56DFCF / #ADEED9 / #FFEDF3` ở **§5**, thang 50→950 ở **§5.1** |
| **Mục tiêu**   | Người dùng chọn được **3 chế độ**: `light`, `dark`, `system`. Lựa chọn lưu ở **localStorage** (không server, không cookie), áp cho cả web lẫn admin |
| **Liên quan**  | `docs/monorepo.md` (chia sẻ code qua `packages/*`), `apps/{web,admin}/app/globals.css`, `packages/ui/src/*` |

---

## 0. Kết luận đọc trước

**a) Hạ tầng theme hiện tại chỉ là template mặc định của `create-next-app`.** Cả hai
`globals.css` mới có đúng 2 token (`--background`, `--foreground`) và đổi màu bằng
`@media (prefers-color-scheme: dark)` — tức là **luôn theo hệ điều hành**, người dùng không
override được. Muốn có 3 options thì phải bỏ đường `@media` làm nguồn sự thật duy nhất và
chuyển sang **class/attribute trên `<html>`**.

**b) Lưu ở localStorage kéo theo bắt buộc phải có script chống FOUC.** localStorage chỉ đọc
được ở client; nếu đợi React hydrate mới set class thì lần load đầu sẽ **nháy trắng** rồi mới
sang tối. Bắt buộc chèn một inline script chạy trước khi paint trong `<head>` (§3). Đây là
điểm dễ làm sai nhất của cả plan.

**c) Phần tốn công không phải là toggle, mà là màu đang hardcode.** Toggle + provider chỉ ~150
dòng. Nhưng có **11 file** đang dùng `bg-white` / `text-gray-*` / `border-gray-*` cứng
(§5.7) — bật dark mà không sửa thì ra giao diện chữ trắng trên nền trắng. Coi §5 là phần chính
của khối lượng công việc.

**d) Không đụng backend.** Không có endpoint nào liên quan, không cần đối chiếu OpenAPI spec.
Đây là feature thuần FE duy nhất tới giờ, nên **không** đi qua `packages/api` — không có
`types.ts`/`api.ts`/`hooks.ts`, và `docs/data-layer.md` không áp dụng ở đây.

---

## 1. Phạm vi

**Trong phạm vi**

- 3 chế độ `light` | `dark` | `system`, mặc định `system`.
- Lưu ở `localStorage` key `noalhub-theme`, **chung cho cả 2 app** (web/admin khác origin lúc
  deploy nên thực tế là 2 kho riêng — chấp nhận, xem §7.1).
- Token màu dùng chung, khai một lần trong `packages/config`, cả 2 app `@import`.
- Một component chuyển theme (`ThemeToggle`) trong `packages/ui`, đặt vào header của web và
  admin.
- Chuyển các màu hardcode hiện có sang token (§5).

**Ngoài phạm vi (đợt này)**

- Đồng bộ theme theo tài khoản qua backend.
- SSR biết trước theme (cần cookie, không dùng localStorage được) — xem §7.2.
- Đổi palette thương hiệu / redesign. Đợt này chỉ làm **hạ tầng theme + trung hoà màu**, giữ
  nguyên diện mạo sáng như hiện tại.

---

## 2. Quyết định kỹ thuật

| Vấn đề | Chốt | Vì sao |
| --- | --- | --- |
| Thư viện | **Tự viết**, không dùng `next-themes` | Chỉ cần ~150 dòng; thêm dep chỉ để đọc localStorage + set class là không đáng, và `next-themes` chưa chắc bám kịp Next 16 |
| Cách đánh dấu | `class="dark"` trên `<html>` | Tailwind v4 dùng `@custom-variant dark`; class dễ debug hơn attribute và khớp mặc định của Tailwind |
| Nguồn sự thật | `localStorage["noalhub-theme"]` ∈ `light\|dark\|system` | Yêu cầu của đề bài |
| Ai set class | Inline script trong `<head>` (lần đầu) + `ThemeProvider` (khi user đổi) | Chống FOUC, §3 |
| Nơi để token màu | `packages/config/theme.css`, hai app `@import` | Tránh copy-paste 2 bảng màu rồi lệch nhau — đúng lỗi đang có ở 2 file `globals.css` hiện tại |
| Nơi để logic | `packages/core/src/theme/` (thuần TS) + `packages/ui/src/theme/` (React) | Bám đúng ranh giới core = logic không React, ui = component |

**Tại sao vẫn cần `system` là một trạng thái riêng, không phải "không chọn gì":** `system`
nghĩa là *tiếp tục lắng nghe* `matchMedia('(prefers-color-scheme: dark)')` — user đổi theme
máy lúc đang mở tab thì trang phải đổi theo. Phải đăng ký listener, không chỉ đọc một lần.

---

## 3. Chống FOUC — inline script

Chèn vào `<head>` của **cả hai** root layout, trước `{children}`:

```tsx
// apps/{web,admin}/app/layout.tsx
<head>
  <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
</head>
```

`THEME_INIT_SCRIPT` là **một chuỗi string** export từ `@noalhub/core/theme/script` (không phải
function được stringify — bundler/minifier có thể đổi tên biến trong function). Nội dung:

```js
try {
  var t = localStorage.getItem('noalhub-theme');
  var dark = t === 'dark' || ((!t || t === 'system') &&
    matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
} catch (e) {}
```

Bốn điểm bắt buộc:

1. **Bọc `try/catch`.** Safari chế độ riêng tư / cookie bị chặn → `localStorage` **ném lỗi**
   ngay khi truy cập. Không bắt lỗi thì script chết và cả trang mất theme.
2. **Script đồng bộ, không `defer`/`async`, đặt trong `<head>`** — phải chạy trước lần paint
   đầu.
3. `<html>` trong `layout.tsx` **không được** hardcode `className="dark"`; script là nơi duy
   nhất quyết định class ở lần render đầu.
4. React sẽ cảnh báo hydration mismatch nếu server render `<html>` không có `dark` còn client
   thì có → thêm `suppressHydrationWarning` **trên chính thẻ `<html>`**.

---

## 4. Cấu trúc file

```
packages/config/
  theme.css                     # (mới) bảng token light + dark
packages/core/src/theme/
  types.ts                      # (mới) type ThemeMode = 'light'|'dark'|'system'
  storage.ts                    # (mới) read/write localStorage, có try/catch
  script.ts                     # (mới) THEME_INIT_SCRIPT (string)
packages/ui/src/theme/
  theme-provider.tsx            # (mới) context + apply class + listener matchMedia
  use-theme.ts                  # (mới) hook đọc/đổi mode
  theme-toggle.tsx              # (mới) UI 3 lựa chọn
apps/web/app/globals.css        # (sửa) @import token, @custom-variant dark
apps/web/app/layout.tsx         # (sửa) head script + suppressHydrationWarning + Provider
apps/admin/app/globals.css      # (sửa) như trên
apps/admin/app/layout.tsx       # (sửa) như trên
```

Lưu ý `packages/ui/package.json` hiện export `"./*": "./src/*.tsx"` — **file trong thư mục con
vẫn khớp** (`@noalhub/ui/theme/theme-toggle`), giống `auth/auth-provider` đang dùng. Nhưng
`use-theme.ts` là `.ts` sẽ **không** khớp pattern `*.tsx` → đặt tên `use-theme.tsx`, hoặc
re-export nó từ `theme-provider.tsx`. Chọn **re-export**, không đẻ thêm entry.

---

## 5. Token màu & dọn màu hardcode

### 5.1 Hai thang màu + một màu nhấn

**Điều quan trọng nhất về bộ màu này: cả bốn màu đều nằm ở nửa SÁNG.** Màu tối nhất
(`#0ABAB5`) chỉ đạt **2.4:1** trên nền trắng — không màu nào trong bốn màu làm được chữ hay
nút ở chế độ sáng. Khác hẳn hai bộ trước, ở đây **nửa dưới của thang là do mình dựng ra**:
giữ hue teal, kéo độ sáng và chroma xuống. Đó mới là chỗ lấy màu chữ và màu nút cho light.

Ba màu teal là điểm neo, giữ nguyên tuyệt đối; nội suy/ngoại suy trong **OKLCH**:

`brand-200` = `#ADEED9` · `brand-300` = `#56DFCF` · `brand-400` = `#0ABAB5`

| Bậc | Hex | vs `#fff` | vs `brand-900` | Dùng để |
| --- | --- | --- | --- | --- |
| `brand-50`  | `#E9FCF4` | 1.06 | 13.7 | Nền vùng nhấn ở light |
| `brand-100` | `#D0F7E8` | 1.17 | 12.4 | Nền badge/hover ở light |
| **`brand-200`** | **`#ADEED9`** | 1.31 | 11.1 | ⚑ gốc — chữ phụ trên nền tối |
| **`brand-300`** | **`#56DFCF`** | 1.63 | 8.91 | ⚑ gốc — **link & accent ở dark**, hover primary |
| **`brand-400`** | **`#0ABAB5`** | 2.41 | 6.03 | ⚑ gốc — **primary ở dark**, ring ở light |
| `brand-500` | `#009A9A` | 3.45 | 4.35 | Bậc chuyển; chữ trắng trên nó **trượt AA** |
| `brand-600` | `#067B7F` | 5.06 | 3.00 | **Primary ở light** (chữ trắng 5.1:1) |
| `brand-700` | `#006066` | 7.33 | 2.07 | Link ở light, hover primary, viền ở dark |
| `brand-800` | `#02464D` | 9.89 | 1.38 | Surface ở dark |
| `brand-900` | `#002E35` | 13.0 | — | Nền dark, chữ chính ở light |
| `brand-950` | `#001A1F` | 15.7 | 1.16 | Chữ trên nút primary ở dark; nền lún |

Chroma của nửa dưới phải hạ dần mới nằm trong gamut sRGB — teal bão hoà ở độ sáng thấp tràn ra
ngoài màn hình hiển thị được.

**Thang `neutral`** — xám cùng hue 200° với `brand-900`, chroma 0.006–0.016:

| Bậc | Hex | | Bậc | Hex |
| --- | --- | --- | --- | --- |
| `neutral-50`  | `#F6FBFC` | | `neutral-500` | `#768384` |
| `neutral-100` | `#EAF2F2` | | `neutral-600` | `#5A6868` |
| `neutral-200` | `#D8E2E2` | | `neutral-700` | `#435050` |
| `neutral-300` | `#BFCACA` | | `neutral-800` | `#2C3839` |
| `neutral-400` | `#95A1A2` | | `neutral-900` | `#172323` |
| | | | `neutral-950` | `#0A1414` |

`neutral-600` trên `neutral-50` = **5.6:1**; `neutral-400` trên `brand-900` = **5.5:1**.

**`#FFEDF3` không phải một bậc của thang brand.** Hue của nó là 355° (hồng), trong khi cả thang
teal nằm ở 173–212° — nhét vào thang thì bậc đó lệch hẳn khỏi dải màu, mọi phép nội suy quanh
nó đều ra màu bùn. Nó là **màu nhấn thứ hai**, đứng riêng:

| Token | Hex | Dùng |
| --- | --- | --- |
| `blush-100` | `#FFEDF3` | ⚑ gốc — nền highlight/callout ở light |
| `blush-600` | `#7F3B58` | Chữ trên nền hồng đó (7.0:1) |
| `blush-900` | `#562F3F` | Nền highlight ở dark (chữ `blush-100`, 10.0:1) |

Vào `--highlight` / `--highlight-foreground`, và đang được dùng làm badge `info`.

### 5.2 Vì sao vẫn cần thang, khi đã có token ngữ nghĩa

Thang là **bảng nguyên liệu**, token ngữ nghĩa (§5.4) là **cách dùng**. Component **chỉ được
dùng token ngữ nghĩa** (`bg-surface`, `text-muted-foreground`); `bg-brand-700` chỉ xuất hiện
trong `theme.css`. Nếu component gọi thẳng bậc thang thì dark mode lại vỡ y như bây giờ —
`bg-brand-700` là nút ở light nhưng là đường viền ở dark.

Ngoại lệ được phép: biểu đồ, avatar sinh màu theo tên, chuỗi trạng thái nhiều bậc — chỗ cần
một dải màu chứ không phải một vai trò.

### 5.3 Chốt primary

Cả bốn màu gốc đều quá sáng để làm nút ở **light** — kể cả `#0ABAB5`, chữ trắng trên nó chỉ
2.4:1. Nên primary ở light là `brand-600` `#067B7F`, một bậc mình kéo dài ra từ trục teal
(chữ trắng 5.1:1, qua AA), hover `brand-700`.

Ở **dark** thì ngược lại, `#0ABAB5` gốc lên làm primary đúng bản chất của nó — và nút đó mang
**chữ gần-đen** (`brand-950`, 7.5:1), không phải chữ trắng.

Ở light, `#0ABAB5` vẫn có chỗ đứng: nó là `--ring` (viền focus). Viền không phải chữ nên không
chịu ngưỡng 4.5:1, mà độ tươi của nó thì rất hợp để đánh dấu ô đang focus.

Primary vẫn là một **token**: đổi ý thì sửa hai dòng trong `theme.css`, không đụng component.

### 5.4 Token ngữ nghĩa (`packages/config/theme.css`)

| Token | Light | Dark |
| --- | --- | --- |
| `--background` | `neutral-50` | `brand-900` |
| `--foreground` | `brand-900` | `neutral-50` (14.0:1) |
| `--surface` | `#ffffff` | `brand-800` — **sáng hơn** nền, không phải trắng |
| `--muted` | `neutral-100` | `brand-800` |
| `--muted-foreground` | `neutral-600` (5.6:1) | `neutral-400` (5.5:1) |
| `--border` | `neutral-200` | `brand-700` |
| `--primary` | `brand-600` | `brand-400` |
| `--primary-hover` | `brand-700` (tối đi) | `brand-300` (**sáng lên**) |
| `--primary-foreground` | `#ffffff` (5.1:1) | `brand-950` (7.5:1) |
| `--accent` | `brand-700` (7.3:1) | `brand-300` (8.9:1) |
| `--ring` | `brand-400` | `brand-400` |
| `--highlight` / `-foreground` | `blush-100` / `blush-600` | `blush-900` / `blush-100` |

⚠️ **Chữ trên một lớp wash của chính màu brand thì dùng `--accent`, không dùng
`--primary`.** Tỉ lệ 5.1:1 ghi ở `--primary` là đo trên **nút** (chữ trắng trên
nền brand-600 đặc). Đặt chính brand-600 làm CHỮ trên `bg-primary/10` thì chỉ còn
**4.24:1**, dưới ngưỡng AA — đúng lỗi đã làm đỏ story `Toast/InfoAlert`.
`--accent` sinh ra cho chữ nhấn: 6.1:1 ở light, 7.4:1 ở dark trên cùng lớp wash
đó.

### 5.5 Ba màu trạng thái

**Không** lấy từ thang brand, và `success` phải là xanh **lá** rõ rệt, đừng ngả teal — thang
brand giờ là teal, một `success` teal nữa thì "thành công" và "màu thương hiệu" nhìn như nhau:

```css
:root { --danger: #b42318; --success: #15703a; --warning: #a03f07; }
.dark { --danger: #f97066; --success: #4ade80; --warning: #f79009; }
```

Ba màu light đậm hơn mức thường thấy là **cố ý**. Chỗ một màu trạng thái bị đọc ở kích
thước nhỏ nhất là trên Badge — 12px, weight thường, nền là chính nó pha loãng 12–15% —
và đó mới là chỗ tỉ lệ tương phản phải đạt. `#16803c` và `#b54708` cũ chỉ được 4.27 và
4.19 ở đó, dưới ngưỡng 4.5 của WCAG AA; bản mới được 5.0. Đổi hai giá trị này thì chạy
lại `pnpm turbo run test-storybook:ci --filter=@noalhub/storybook` để axe xác nhận.

### 5.6 Khai báo trong Tailwind

Thang vào `@theme` (thành `bg-brand-500`, `text-neutral-600`), token ngữ nghĩa vào
`@theme inline` (vì chúng trỏ tới biến đổi giá trị theo `.dark` — thiếu `inline` thì Tailwind
đóng băng giá trị light và dark mode không đổi màu):

```css
@theme {
  --color-brand-50: #e9fcf4;   /* … tới --color-brand-950 */
  --color-neutral-50: #f6fbfc; /* … tới --color-neutral-950 */
  --color-blush-100: #ffedf3;  /* + blush-600, blush-900 */
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-surface: var(--surface);
  --color-surface-foreground: var(--surface-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-highlight: var(--highlight);
  --color-highlight-foreground: var(--highlight-foreground);
  --color-border: var(--border);
  --color-primary: var(--primary);
  --color-primary-hover: var(--primary-hover);
  --color-primary-foreground: var(--primary-foreground);
  --color-accent: var(--accent);
  --color-ring: var(--ring);
  --color-danger: var(--danger);
  --color-success: var(--success);
  --color-warning: var(--warning);
}
```

⚠️ Tailwind v4 khai `--color-neutral-*` là **ghi đè** palette `neutral` sẵn có. Chủ ý — mọi
`text-neutral-500` cũ tự động ám xanh theo thương hiệu. Nhưng nếu muốn giữ xám gốc thì phải
đổi tên thang, ví dụ `--color-ink-*`.

**Xoá khối `@media (prefers-color-scheme: dark)` hiện có** trong cả 2 `globals.css` — giữ lại
thì user chọn `light` trên máy đang dark sẽ vẫn ra dark. Chế độ system đã được script §3 quy về
class `dark` rồi.

Thêm `@custom-variant dark (&:where(.dark, .dark *));` (Tailwind v4 — biến thể dark mặc định
bám `prefers-color-scheme`, phải khai lại để bám class).

Giữ nguyên `@source "../../../packages/ui/src"` ở cả hai file — xem chú thích dài đã có sẵn
trong `globals.css`; class mới của theme cũng nằm trong `packages/ui` nên vẫn phụ thuộc nó.

### 5.7 Danh sách file phải dọn màu

Rà lại kỹ hơn: **repo sạch hơn tưởng**. Phần lớn kết quả grep `bg-white`/`bg-black` thực ra là
cặp alpha `bg-black/10 dark:bg-white/15` — chúng **đã** đúng ở cả hai chế độ và tự ăn theo nền
mới, không phải sửa. Chỉ ba nhóm thật sự phải đổi:

| Chỗ | Vì sao phải đổi |
| --- | --- |
| `packages/ui/src/button.tsx` | `bg-foreground text-background` — nút primary đang là màu chữ đảo ngược, không phải màu thương hiệu |
| `packages/ui/src/badge.tsx` | `emerald/amber/red/blue-*` cứng → `--success/--warning/--danger/--accent` |
| `apps/web/app/(protected)/page.tsx` | Trang template còn sót `bg-white dark:bg-black`, `text-zinc-*` |

Đổi thêm cho nhất quán (không bắt buộc, nhưng rẻ): `border-black/15 dark:border-white/20` ở
`pagination-links.tsx`, `dashboard-content.tsx`, hai header → `border-border`; popover của
`admin-header.tsx` từ `bg-white dark:bg-neutral-900` → `bg-surface`.

`packages/ui/src/blog/post-content.css` **không cần sửa** — đã dùng
`color-mix(in srgb, currentColor …)` nên tự đổi theo màu chữ. Đây là mẫu nên nhân rộng.

## 6. UI chọn theme

`ThemeToggle` — 3 nút trong một nhóm (segmented), không phải nút bập bênh 2 trạng thái, vì
`system` phải chọn được tường minh.

- ☀️ Sáng · 🌙 Tối · 🖥️ Hệ thống, `aria-pressed` cho mục đang chọn, có nhãn chữ cho screen
  reader.
- **Chỉ render sau khi mounted.** Trước hydrate, client không biết mode nào đang active
  (server không đọc được localStorage) → render placeholder cùng kích thước để không nhảy
  layout.
- Vị trí: header của `apps/web` và sidebar/topbar của `apps/admin`.

---

## 7. Rủi ro đã biết

**7.1 Web và admin là hai origin khác nhau khi deploy** → localStorage **không** dùng chung,
user phải chọn theme riêng ở mỗi app. Chấp nhận đợt này; muốn chung thì phải lưu server-side
(ngoài phạm vi). Vẫn dùng chung một key để lúc dev cùng `localhost` thì trùng nhau.

**7.2 SSR luôn render ở "light".** Blog là route render ở server (`docs/blog.md` §4); HTML
gửi về không có class `dark`, script §3 mới thêm vào ở client. Hệ quả: một khung hình rất ngắn
theo màu mặc định. Đã giảm thiểu bằng script chạy trước paint. **Không** dùng
`prefers-color-scheme` ở CSS để bù, vì sẽ mâu thuẫn với lựa chọn tường minh của user.

**7.3 Ảnh và OG trong bài blog** có nền trắng sẽ chói ở dark mode. Đợt này bỏ qua; nếu chướng
thì bọc ảnh trong khung có nền sáng cố định.

**7.4 Tailwind purge.** Class chỉ xuất hiện dưới `dark:` trong `packages/ui` vẫn cần `@source`
đã khai — nếu quên, dark mode sẽ **đúng ở dev, vỡ ở production**, đúng cái bug đã ghi trong
`globals.css`. Bắt buộc kiểm tra bằng `pnpm build` chứ không chỉ `dev`.

---

## 8. Thứ tự làm

1. `packages/config/theme.css` + sửa 2 `globals.css` (token, `@custom-variant`, xoá `@media`).
2. `packages/core/src/theme/` (types, storage, script).
3. `packages/ui/src/theme/` (provider, hook).
4. Cắm vào 2 `layout.tsx` (script + `suppressHydrationWarning` + Provider).
5. Dọn màu hardcode ở `packages/ui` (8 file).
6. Dọn màu ở 3 trang `apps/web`.
7. `ThemeToggle` + gắn vào header web/admin.
8. Kiểm thử §9.

Bước 1–4 là một PR chạy được (dark mode bật được nhưng còn xấu); 5–7 là PR thứ hai.

---

## 9. Kiểm thử

- [ ] Chọn `dark`, F5 → **không** nháy trắng.
- [ ] Chọn `light` trong khi macOS đang dark → trang vẫn sáng sau reload.
- [ ] Chế độ `system` + đổi theme macOS lúc tab đang mở → trang đổi ngay, không cần reload.
- [ ] Safari cửa sổ riêng tư → không lỗi console, trang vẫn dùng được.
- [ ] `pnpm build` rồi `pnpm start` cả 2 app → dark mode vẫn đúng (§7.4).
- [ ] Không còn cảnh báo hydration mismatch ở console.
- [ ] `pnpm lint && pnpm typecheck` sạch.
- [ ] Rà mắt: trang blog, bảng ở admin, form login, badge, skeleton ở cả 2 chế độ.

---

## 10. Sai lệch so với plan (lúc implement)

1. **§5.7 ước lượng sai khối lượng.** Plan ghi "11 file hardcode màu"; thực tế chỉ **3 file**
   phải sửa, phần còn lại là cặp alpha `bg-black/x dark:bg-white/x` vốn đã đúng. Bảng §5.7 đã
   viết lại theo kết quả rà thật.

2. **`@custom-variant` nằm trong `packages/config/theme.css`**, không nằm ở `globals.css` như
   §5.6 phác. Đặt cạnh bảng màu thì hai app không thể quên một trong hai. Đã kiểm chứng trên
   CSS đã build: `dark:` biên dịch ra `:where(.dark, .dark *)` và **không còn** dòng
   `prefers-color-scheme` nào.

3. **`@import` bằng đường dẫn tương đối** (`../../../packages/config/theme.css`) chứ không qua
   tên package: `@noalhub/config` không khai `exports`, và Tailwind phân giải `@import` theo
   đường dẫn file. Cùng kiểu với `@source` đã có sẵn.

4. **Thêm `document.documentElement.style.colorScheme`** trong provider — không có trong plan.
   Thiếu nó thì scrollbar, date picker và nền autofill của trình duyệt vẫn sáng trắng trên nền
   tối.

5. **`ThemeToggle` render đủ 3 nút ngay cả trước khi hydrate**, chỉ ẩn dấu "đang chọn"
   (`mounted`) — §6 nói render placeholder. Cách này không nhảy layout mà cũng không tô sai ô
   ở lần vẽ đầu.

6. **Thêm toggle vào `dashboard-content.tsx`** (vùng đăng nhập của web) ngoài hai header ở §6:
   `apps/web` không có header chung cho vùng `(protected)`, nếu chỉ gắn ở blog thì user đã đăng
   nhập không có chỗ nào đổi theme.

7. **`--color-neutral-*` ghi đè palette `neutral` của Tailwind** — đã cảnh báo ở §5.6 và chọn
   giữ nguyên chủ ý này. Hệ quả cụ thể: `dark:bg-neutral-900` cũ trong `admin-header.tsx` sẽ
   thành `#192323`; chỗ đó đã chuyển sang `bg-surface` nên không còn ai phụ thuộc.

---

## 11. Typography

### 11.1 Font

**Open Sans**, nạp bằng `next/font/google` chứ **không** bằng `<link>` tới
`fonts.googleapis.com`. Cùng là "lấy từ Google Fonts", nhưng `next/font` tải file font **lúc
build** rồi tự host cùng static assets: trình duyệt người dùng không gọi sang Google (đỡ một
RTT tới domain lạ, và không rò referrer), Next chèn sẵn `@font-face` + preload nên không nháy
chữ, và không có request nào có thể hỏng lúc runtime.

Hai điểm bắt buộc, khai giống hệt nhau ở cả hai app:

```ts
const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin", "vietnamese"], // thiếu `vietnamese` → chữ có dấu rơi sang
  display: "swap",                  // font hệ điều hành, cùng dòng hai kiểu chữ
});
```

Không khai `weight`: Open Sans là font **biến thiên** (300–800), mọi độ đậm nằm trong một file.

Biến do `next/font` sinh ra tên `--font-open-sans`, rồi mới nối vào namespace Tailwind trong
`globals.css`: `@theme inline { --font-sans: var(--font-open-sans) }`. Hai tên phải **khác**
nhau — đặt cả hai là `--font-sans` thì `var()` trỏ vào chính nó và font im lặng không áp.

`apps/web` giữ `Geist_Mono` cho `--font-mono` (code block trong bài blog).

### 11.2 Component `<Typography>`

`packages/ui/src/typography.tsx` — 15 variant, 3 độ đậm:

| Variant | Cỡ | Line-height | Tracking | Weight | Thẻ |
| --- | --- | --- | --- | --- | --- |
| `h1` | 2.25rem | 1.15 | −0.02em | 600 | `<h1>` |
| `h2` | 1.875rem | 1.2 | −0.015em | 600 | `<h2>` |
| `h3` | 1.5rem | 1.3 | −0.01em | 600 | `<h3>` |
| `h4` | 1.25rem | 1.4 | −0.005em | 600 | `<h4>` |
| `h5` | 1.125rem | 1.45 | — | 600 | `<h5>` |
| `h6` | 1rem | 1.5 | — | 600 | `<h6>` |
| `title-1` | 1.25rem | 1.4 | +0.005em | 600 | `<p>` |
| `title-2` | 1.125rem | 1.4 | +0.005em | 600 | `<p>` |
| `title-3` | 1rem | 1.4 | +0.005em | 500 | `<p>` |
| `title-4` | 0.875rem | 1.45 | +0.01em | 500 | `<p>` |
| `body-1` | 1.125rem | 1.7 | — | 400 | `<p>` |
| `body-2` ← **mặc định** | 1rem | 1.65 | — | 400 | `<p>` |
| `body-3` | 0.875rem | 1.6 | — | 400 | `<p>` |
| `body-4` | 0.75rem | 1.55 | — | 400 | `<p>` |
| `caption` | 0.75rem | 1.5 | +0.01em | 400 | `<p>` *nghiêng* |

`weight` nhận đúng **400 | 500 | 600**. Font có sẵn 300–800 nhưng mở hết ra thì mỗi người chọn
một số và giao diện hết nhất quán.

Năm quyết định đáng nhớ:

1. **Heading và title là hai trục khác nhau, cố ý trùng dải cỡ.** `h4`–`h6` và `title-1`–`3`
   cùng 1–1.25rem, khác ở chỗ heading có tracking **âm** và là thẻ `<h*>` thật; title có
   tracking **dương**, line-height chặt hơn (nhãn thường một dòng) và là `<p>`. Chọn theo *vai
   trò trong tài liệu*, không theo cỡ chữ.
2. **`title-3`/`title-4` hạ về weight 500.** Ở cỡ 14–16px, 600 trông như đang hét.
3. **Cỡ càng nhỏ thì line-height càng chặt** (1.7 → 1.55). Chữ nhỏ mà dòng thưa quá thì mắt
   lạc dòng khi xuống hàng; chữ lớn thì ngược lại.
4. **`caption` nghiêng nằm trong ĐỊNH NGHĨA của variant**, không phải `className="italic"` ở
   chỗ gọi. Nó cùng cỡ `body-4`, nên nếu tách nhau bằng cỡ chữ thì không tách được — phải tách
   bằng dáng chữ.
5. **`as` tách rời khỏi `variant`.** Cấp heading là *cấu trúc tài liệu*, cỡ chữ là *thị giác*.
   Cần tiêu đề cấp 2 nhưng nhỏ như h4 thì `<Typography variant="h4" as="h2">`; chú thích ảnh
   thì `<Typography variant="caption" as="figcaption">`.

### 11.3 Bản nghiêng phải nạp riêng

`next/font/google` **không nhận mảng `style`** cho font biến thiên, nên phải gọi `Open_Sans`
lần thứ hai với `style: "italic"`. Không có nó thì trình duyệt **tự bóp nghiêng** chữ đứng
(synthetic oblique) — nét dày mỏng sai hẳn so với bản italic thật, thấy rõ nhất ở `a`, `e`, `g`.

Hai lần gọi cùng sinh ra `font-family: "Open Sans"`, chỉ khác `font-style`, nên utility
`italic` tự chọn đúng bản — không phải khai gì thêm ở chỗ dùng. Đã kiểm chứng trên CSS đã
build: 10 khối `@font-face` với `font-style: italic` cùng tên family.

Biến `--font-open-sans-italic` không ai đọc, nhưng vẫn phải gắn `.variable` lên `<html>`, nếu
không Next coi instance đó là không dùng và bỏ luôn `@font-face`.

### 11.4 Ghi chú triển khai

Thang chữ khai ở `packages/config/theme.css` dưới namespace `--text-*`, mỗi bậc kèm
`--line-height` và `--letter-spacing`, nên **một** utility `text-h1` mang đủ ba thứ. Chia lẻ
thành `text-4xl leading-tight tracking-tight` ở từng chỗ gọi là cách để chúng lệch nhau sau ba
tháng.

⚠️ Bảng tra trong component phải viết **nguyên chuỗi class** (`"title-1": "text-title-1"`),
không được `text-${variant}`: Tailwind quét mã nguồn bằng regex chứ không chạy nó, class ghép
động sẽ không được sinh ra và mất style ở **production**.

### 11.5 Đã áp cho toàn bộ web + admin

Quét hết `apps/web`, `apps/admin` và `packages/ui`: **166 phần tử chữ** ở **67 file** đã chuyển
sang `<Typography>`. Sau đợt này **không còn** một class `text-sm`/`text-2xl`/… nào trong repo.

Ba quy tắc phân loại, vì không phải chỗ nào cũng thành component được:

| Loại | Cách xử lý | Vì sao |
| --- | --- | --- |
| Phần tử chữ **lá** (`<h*>`, `<p>`, `<span>`, `<label>` có cỡ chữ) | `<Typography>` | Đúng mục đích của component |
| **Container** đặt cỡ chữ cho cả cụm (`<div className="text-sm …">` bọc nút, nav) | Giữ thẻ, đổi class sang token `text-body-3` | Bọc `<div>` chứa `<button>` bằng `<Typography>` là dùng sai: nó không phải một đoạn chữ, và cỡ chữ ở đây là **thừa kế** cho con |
| Phần tử **tương tác** (`<button>`, `<a>`, `<input>`, `<textarea>`) | Giữ thẻ, đổi class sang token | Không render được qua `as=` mà vẫn giữ đủ prop (`href`, `type`, `ref`, `onClick`) |

#### Thang của mình LỆCH MỘT BẬC so với Tailwind

Đây là cái bẫy lớn nhất của cả đợt, và lần đầu quét đã sập vào nó: `h1` của mình là 2.25rem,
đúng bằng `text-4xl`, **không** phải `text-3xl`. Đổi `text-2xl` thành `h2` nghe rất thuận tai
nhưng làm chữ **to lên 25%**.

| Class cũ | rem | → variant |
| --- | --- | --- |
| `text-4xl` | 2.25 | `h1` |
| `text-3xl` | 1.875 | `h2` |
| `text-2xl` | 1.5 | `h3` ⚠️ **không** phải `h2` |
| `text-xl` | 1.25 | `h4` |
| `text-lg` | 1.125 | `h5` (heading) / `title-2` (đậm) / `body-1` (thường) |
| `text-base` | 1 | `h6` / `title-3` / `body-2` |
| `text-sm` | 0.875 | `title-4` (đậm) / `body-3` |
| `text-xs` | 0.75 | `body-4` |

Đã đối chiếu lại toàn bộ diff **theo rem**: số phần tử ở mỗi cỡ trước và sau khớp nhau, trừ vài
phần tử vốn không khai cỡ (thừa kế) nay nhận mặc định của variant.

#### Bốn chỗ phải sửa tay

1. **Số liệu trong `StatCard` là chữ TRƯNG BÀY, không phải nhãn.** Nó là
   `<p class="text-3xl font-semibold">`, và quy tắc "`<p>` + đậm → `title-*`" kéo nó từ
   1.875rem xuống 1.25rem — trang tổng quan trông teo hẳn. Đã ép về `variant="h2" as="p"`:
   giữ cỡ, nhưng vẫn là `<p>` vì nhãn ở trên mới là thứ mô tả ô đó.
2. **`<p>` không khai cỡ chữ nằm trong container có cỡ chữ.** Trước nó *thừa kế* cỡ của
   container; qua `<Typography>` thì nhận mặc định `body-2` và to lên. Ba chỗ (footer blog,
   `admin-error-state`, `post-editor`) đã ép về `body-3` cho khớp container.
3. **Đoạn văn `text-lg` không có class độ đậm** bị quy tắc heading kéo thành `h4` (đậm 600).
   Chữ thân bài không được tự nhiên hoá đậm — đã tách nhánh: `text-lg` + đậm → `title-2`,
   `text-lg` thường → `body-1`.
4. **`text-lg` trên nút đóng `×`** của `dialog`/`drawer` là cỡ **icon**, không phải chữ — để
   `text-h*` thì nó ăn luôn `letter-spacing` âm. Đã đổi sang `text-title-2`.

`<label>` cần `htmlFor`, mà prop này không nằm trong `HTMLAttributes` chung — đã khai riêng
trong `TypographyProps`.

⚠️ **Repo format ở `printWidth: 100`, không phải mặc định 80 của Prettier**, và **không có
`.prettierrc`** để ép điều đó. Chạy `npx prettier --write` trần sẽ ngắt lại hàng loạt dòng
không liên quan và làm diff phình gấp đôi. Nên thêm một `.prettierrc` để lần sau không ai vấp.
