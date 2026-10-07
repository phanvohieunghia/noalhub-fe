# Mobile: `apps/mobile` (iOS + Android)

| | |
|---|---|
| **Status** | **Đã hoàn thành toàn bộ GĐ 0 → GĐ 5** (iOS & Android sẵn sàng phát triển / build EAS) |
| **Ngày** | 2026-09-09 |
| **Phạm vi** | Cách đưa sản phẩm lên iOS/Android, và **chuẩn hóa `packages/*` thành platform-agnostic** để web và mobile dùng chung một tầng dữ liệu |
| **Liên quan** | [`docs/monorepo.md`](./monorepo.md) — luật ranh giới package · [`docs/data-layer.md`](./data-layer.md) — convention không đổi · [`docs/auth.md`](./auth.md) · [`docs/chat.md`](./chat.md) · [`docs/theme.md`](./theme.md) · [`docs/i18n.md`](./i18n.md) |

---

## 1. Mục tiêu

Một app native trên App Store và Google Play, dùng **cùng contract backend, cùng
tầng dữ liệu, cùng bộ message i18n, cùng bảng màu** với `apps/web` — không fork,
không bản sao.

Ngoài phạm vi (giai đoạn này): admin trên mobile (`apps/admin` vẫn chỉ là web),
blog editor Tiptap (chỉ đọc trên mobile), PWA.

Điều kiện thuận lợi có sẵn: **browser gọi thẳng backend, không có BFF**
(`CLAUDE.md` §Architecture). Mobile vì vậy nói chuyện với đúng backend đó theo
đúng cách đó — không phải dựng thêm tầng nào.

---

## 2. Chọn hướng

| Hướng | Công sức | Vì sao **không** chọn |
|---|---|---|
| **PWA** (`apps/web` + manifest + service worker) | ~vài ngày | Không lên được store. iOS giới hạn push, background, share sheet |
| **Capacitor** bọc web build | ~1–2 tuần | Next 16 phải chuyển `output: "export"`: mất RSC, mất blog server-only fetch (`docs/blog.md` §7), `app/[locale]/` phải chuyển routing client-side. Tốn gần bằng Expo mà kết quả là webview |
| **Expo + Expo Router** | ~1–3 tháng | ✅ **Chọn hướng này** |

Lý do quyết định: sản phẩm nặng **chat realtime, presence, upload media, auth
refresh nền** — đúng những chỗ webview trên iOS làm tệ nhất (bàn phím, cuộn,
socket khi app vào background). Giá phải trả là **viết lại toàn bộ tầng UI**;
đổi lại tầng dữ liệu — phần chứa gần hết logic khó — dùng lại gần như nguyên vẹn.

---

## 3. Cấu trúc đích

```
noalhub-fe/
├── apps/
│   ├── web/                  # không đổi
│   ├── admin/                # không đổi
│   ├── storybook/            # không đổi
│   └── mobile/               # MỚI — Expo Router, iOS + Android
│       ├── app/              # (auth)/, (tabs)/, chat/[id].tsx …
│       ├── components/       # UI riêng của mobile
│       ├── metro.config.js   # §7
│       ├── app.config.ts     # env qua `extra`, KHÔNG dùng NEXT_PUBLIC_*
│       └── package.json      # name: @noalhub/mobile
└── packages/
    ├── api/                  # dùng chung — cần §5.1 §5.2 §5.3 §5.4 §5.5
    ├── core/                 # dùng chung một phần — cần §5.7 §5.8
    ├── i18n/                 # messages dùng chung, runtime tách — §5.6
    ├── config/               # theme.css + preset NativeWind sinh ra từ nó — §5.7
    ├── ui/                    # WEB-ONLY, giữ nguyên tên
    └── ui-native/            # MỚI — @noalhub/ui-native, primitive RN
```

Luật của `docs/monorepo.md` §4 giữ nguyên và **mở rộng thêm một dòng**:
`apps/mobile` không import `apps/web`, `packages/ui` (web-only) hay `next/*`.
Bổ sung vào `packages/config/eslint.boundaries.mjs`.

---

## 4. Kiểm kê: cái gì dùng lại được

| Thứ | Trạng thái | Ghi chú |
|---|---|---|
| `packages/api/src/<feature>/{types,schemas,api,hooks}.ts` | ✅ **Nguyên vẹn** | axios + zod + TanStack Query chạy tốt trên RN. Đây là phần lớn nhất và giá trị nhất |
| `packages/api/src/errors.ts` | ✅ Nguyên vẹn | |
| `packages/api/src/chat/ephemeral-store.ts`, `outbox.ts` | ✅ Nguyên vẹn | Cả hai đang là **in-memory** (`Map`), không đụng platform |
| `packages/api/src/auth/store.ts` | ✅ Nguyên vẹn | zustand |
| `packages/api/src/auth/token-store.ts` | ⚠️ **Phải sửa** | localStorage + `StorageEvent` — §5.1 |
| `packages/api/src/client.ts` | ⚠️ Sửa nhỏ | `navigator.locks` — §5.2 |
| `packages/api/src/config.ts` | ⚠️ **Phải sửa** | `process.env.NEXT_PUBLIC_*` — §5.3 |
| `packages/api/src/chat/socket.ts` | ⚠️ Sửa nhỏ | thêm vòng đời background — §5.4 |
| `packages/api/src/media/api.ts` | ⚠️ Sửa nhỏ | ký `file: File` (DOM) — §5.5 |
| `packages/api/src/blog/server.ts` | ❌ Web-only | server-only fetch, mobile dùng đường React Query thường |
| `packages/core/src/{format-date,chat/format,chat/error-message,forms/*,admin,blog}` | ✅ Nguyên vẹn | helper thuần |
| `packages/core/src/theme/{storage,script}.ts` | ⚠️ | `storage` cần adapter §5.1; `script.ts` là web-only, bỏ khỏi mobile |
| `packages/core/src/auth/redirect.ts` | ❌ | dựa `window.location` — §5.8 |
| `packages/i18n/messages/{vi,en}/*.json` | ✅ **Nguyên vẹn** | 14 namespace, dùng chung |
| `packages/i18n/src/*` | ❌ Web-only | `next-intl` — §5.6 |
| `packages/ui` | ❌ | Tailwind DOM + radix — viết lại thành `ui-native` §6 |
| `apps/web/app/**` | ❌ | routing viết lại bằng Expo Router |

---

## 5. Chuẩn hóa từng điểm chạm platform

Nguyên tắc chung: **không rắc `Platform.OS` khắp nơi**. Mỗi điểm chạm được thu về
**một adapter, một interface**, app inject bản cài đặt của mình lúc khởi động —
đúng tinh thần "isolation boundary" mà `token-store.ts` và `socket.ts` đã tự mô
tả về mình.

### 5.1 Storage adapter

`packages/api/src/auth/token-store.ts` tự nhận là "file duy nhất được chạm
localStorage", và chính comment trong đó đã tính trước chuyện thay ruột. Đổi nó
thành nhận adapter:

```ts
// packages/api/src/storage.ts (mới)
export type KeyValueStorage = {
  get(key: string): string | null;          // đồng bộ — xem ghi chú dưới
  set(key: string, value: string): void;
  remove(key: string): void;
  subscribeExternalClear?(key: string, cb: () => void): () => void;
};
export function setStorage(impl: KeyValueStorage): void;
```

- Web inject bản localStorage hiện tại (giữ nguyên `onExternalClear` qua `StorageEvent`).
- Mobile inject `expo-secure-store` — refresh token vào Keychain/Keystore, **không**
  vào AsyncStorage.

> **Điểm cần Noah chốt (§9-A).** `SecureStore` chỉ có API async, còn
> `tokenStore.getRefresh()` hiện là **đồng bộ** và `client.ts` gọi nó trong
> interceptor. Hai lối ra: (a) mobile đọc secure store **một lần lúc bootstrap**
> rồi giữ trong biến module, ghi thì async fire-and-forget — giữ nguyên chữ ký
> đồng bộ, rẻ nhất; (b) đổi `getRefresh()` thành async và sửa `refreshTokens()`
> + `ensureAccessToken()` — sạch hơn nhưng đụng vào đúng đoạn single-flight khó
> nhất. Tôi nghiêng về **(a)**.

`packages/core/src/theme/storage.ts` dùng cùng interface này.

### 5.2 `navigator.locks` trong `client.ts`

`withRefreshLock()` đã có nhánh `if (!locks) return run()` nên **chạy được ngay**
trên RN. Và mất lock ở đây không nguy hiểm như trên web: mobile chỉ có **một
process, một tab**, nên `refreshPromise` (single-flight trong tiến trình) đã đủ —
đúng thứ mà web thiếu vì có nhiều tab. Không cần làm gì, chỉ cần bổ sung comment
nói rõ điều đó để người sau đừng đi tìm `expo-locks`.

### 5.3 Env / config

`packages/api/src/config.ts` đọc `process.env.NEXT_PUBLIC_*`, mà Expo dùng
`EXPO_PUBLIC_*` + `app.config.ts`. Đề xuất: tách phần đọc env ra khỏi phần chuẩn
hóa URL.

```ts
// config.ts giữ nguyên apiBaseUrlFrom(), thêm:
export function configureApi(input: { apiOrigin: string; wsUrl?: string }): void;
```

`API_BASE_URL`/`WS_URL` chuyển từ **const export** sang **getter đọc từ một biến
module**, mặc định vẫn lấy `process.env.NEXT_PUBLIC_*` để `apps/web` và
`apps/admin` **không phải sửa gì**. `apps/mobile` gọi `configureApi()` một lần
trong root layout.

Hai cái bẫy thực tế của mobile:

- `http://localhost:3101` **vô nghĩa trên thiết bị thật** — dev phải trỏ IP LAN
  của máy Mac. Ghi thành mục trong `apps/mobile/.env.example`.
- iOS chặn cleartext HTTP: dev qua LAN cần khai `NSAllowsLocalNetworking`, còn
  production **bắt buộc `https://` + `wss://`**.

### 5.4 Socket và vòng đời app

`chat/socket.ts` chạy được trên RN (socket.io-client thuần JS, `transports:
["websocket"]` càng hợp). Ba việc phải thêm, nằm **trong `apps/mobile`** chứ không
nhét vào package:

1. `AppState` → background: iOS treo socket sau vài giây, nên gọi
   `disconnectChatSocket()` khi vào background và `connectChatSocket()` khi trở
   lại foreground. Message lỡ mất được React Query refetch bù.
2. `scheduleTokenRefresh()` dùng `setTimeout` — timer **không chạy đáng tin cậy**
   khi app bị treo. Khi foreground trở lại phải chủ động `ensureAccessToken()`
   thay vì tin vào timer.
3. Tin nhắn đến khi app đóng phải đi bằng **push notification** (backend đẩy),
   không phải bằng socket. Đây là hạng mục **backend**, ghi ở §9-B.

`outbox` in-memory hiện tại mất khi app bị OS kill — vẫn an toàn (id là UUID v7,
backend idempotent), chấp nhận ở giai đoạn 1 y như web.

### 5.5 Media upload

`media/api.ts` khai `file: File` — `File` là kiểu DOM. RN gửi FormData bằng
`{ uri, name, type }`. Đổi chữ ký thành một union platform-agnostic:

```ts
export type UploadFile = File | { uri: string; name: string; type: string };
```

`FormData.append` nhận cả hai; chỉ cần nới kiểu, phần thân không đổi.

### 5.6 i18n

**Messages dùng chung, runtime tách.** `packages/i18n/messages/{vi,en}/*.json`
giữ nguyên là nguồn sự thật duy nhất — `pnpm check-messages` vẫn gác drift cho cả
ba app. Riêng `packages/i18n/src/*` là `next-intl` (`request.ts`, `routing.ts`,
`navigation.ts`, `cookie.ts`), mobile không dùng được.

Đề xuất cho mobile: `use-intl` — **cùng nhà với `next-intl`, cùng cú pháp ICU,
cùng shape message**, nên `useTranslations("web.chat")` viết y hệt bên web. Chọn
nó thay vì i18next chính là để không phải viết lại message hay học API thứ hai.

Locale không đến từ URL segment (mobile không có `[locale]`) mà từ
`expo-localization` + một lựa chọn lưu ở storage §5.1.

### 5.7 Theme

`packages/config/theme.css` là nguồn sự thật của màu (`docs/theme.md`). Mobile
dùng **NativeWind** để giữ nguyên cú pháp Tailwind và **cùng tên token**
(`bg-background`, `text-muted-foreground`, `border-border`, thang
`brand-50→950`): component RN viết `className="bg-surface text-foreground"` đọc
gần như y hệt bên web.

Để không có hai bảng màu: viết `packages/config/theme.tokens.ts` chứa các giá trị
màu **dưới dạng dữ liệu**, rồi sinh ra cả `theme.css` (web) lẫn preset NativeWind
(mobile) từ đó. Luật cấm hex literal và cấm `dark:` viết tay giữ nguyên.

Thuận lợi: `theme.css` hiện dùng **hex thuần** (`#0ABAB5`, `#ffffff`, …), không
có `oklch()` — RN nuốt hex trực tiếp, nên không phải chuyển đổi color space.

### 5.8 Điều hướng

`packages/core/src/auth/redirect.ts` dựa `window.location` → **web-only**, mobile
không import. Vai trò tương đương (chặn open-redirect sau login) trên mobile là
xử lý **deep link** của `expo-router` — cùng bài toán "đừng tin tham số ngoài
đưa vào", nhưng khác cơ chế đủ để nên viết riêng trong `apps/mobile`, không cố
nhét chung.

---

## 6. `packages/ui-native`

Đây là phần **phải viết lại thật**, không có đường tắt: `packages/ui` là
`div`/`radix-ui`/`@iconify/react`.

Thứ tự bắt buộc của `AGENTS.md` §Building UI vẫn áp dụng, chỉ đổi tầng (1) và (2):

1. Đã có trong `packages/ui-native` → dùng lại / thêm variant.
2. Thư viện đã cài: `react-native` primitives, `expo-*`, `@gorhom/bottom-sheet`,
   `react-native-svg` (icon), `nativewind`.
3. Tự viết.

Vẫn giữ nguyên: **không hardcode string** (mọi label qua i18n), **không hardcode
màu** (chỉ token), component dùng chung không được pin namespace i18n của một app.

Danh sách primitive tối thiểu để chạy được luồng chat: `Button`, `Input`,
`Avatar`, `Alert`, `Toast`, `Checkbox`, `Sheet`, `Spinner` — tương ứng những gì
`packages/ui` đang có.

---

## 7. Metro + Turborepo

Expo/Metro không có `transpilePackages`; cấu hình tương đương trong
`apps/mobile/metro.config.js`:

- `watchFolders` trỏ về root repo để thấy `packages/*`;
- `resolver.disableHierarchicalLookup = true` và `nodeModulesPaths` trỏ vào
  `apps/mobile/node_modules` + root — bắt buộc với **pnpm symlink**, thiếu là gặp
  "duplicate React";
- `resolver.unstable_enablePackageExports = true` để `exports` map của
  `@noalhub/api` (`./auth`, `./chat`, …) hoạt động — đây chính là hàng rào đang
  chặn `api.ts`/`client.ts`, phải giữ.

`turbo.json` thêm task cho `@noalhub/mobile`: `lint`, `typecheck` chạy như các
package khác; `build` (EAS) **không** nối vào `pnpm build` của web.

---

## 8. Lộ trình

| GĐ | Nội dung | Kết quả kiểm chứng |
|---|---|---|
| **0** | §5.1 §5.2 §5.3 §5.5 — chuẩn hóa `packages/api`, **chưa có app nào** | ✅ `pnpm build` + `pnpm typecheck` xanh, web/admin **không đổi hành vi** |
| **1** | Dựng `apps/mobile` rỗng: Expo Router, Metro §7, `configureApi()`, i18n §5.6, NativeWind §5.7 | ✅ App chạy trên simulator/emulator, gọi được API public |
| **2** | Auth: login/register/logout, SecureStore, 401-refresh | ✅ Đăng nhập, kill app, mở lại vẫn còn session |
| **3** | `ui-native` primitive + danh sách hội thoại + màn hình chat + socket §5.4 | ✅ Nhắn tin hai chiều web ↔ mobile, presence, outbox |
| **4** | Media (avatar, ảnh chat), friends, profile, blog (đọc) | ✅ Đổi avatar, kết bạn/tìm kiếm, đọc blog AST renderer |
| **5** | Push notification, deep link, EAS Build, lên TestFlight / Play Internal | ✅ `eas.json`, `linking.ts`, `notifications.ts`, typecheck & lint 100% xanh |

Giai đoạn 0 đứng độc lập và **có giá trị ngay cả khi dừng dự án mobile**: nó gỡ
`packages/api` khỏi giả định "chỉ chạy trong Next trên browser".

---

## 9. Điểm cần chốt trước khi code

- **A. Storage đồng bộ hay async** (§5.1) — tôi đề xuất (a) đọc một lần lúc bootstrap.
- **B. Push notification là việc của backend.** Cần backend lưu device token và
  đẩy qua APNs/FCM. Nếu backend chưa có, giai đoạn 5 bị chặn — nên chốt sớm.
- **C. Bundle id / package name / tài khoản store.** Apple Developer (99$/năm) và
  Google Play (25$ một lần) phải có trước giai đoạn 5.
- **D. Blog trên mobile**: chỉ đọc, hay cả soạn? Tiptap không chạy trên RN —
  nếu cần soạn thì phải webview riêng cho editor.
- **E. Admin có lên mobile không?** Dự thảo này nói **không**.

## 10. Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| Tầng UI phình to ngoài dự tính | Giới hạn giai đoạn 3 đúng luồng chat; các màn khác đẩy sang GĐ 4 |
| Socket trên mạng di động chập chờn | Đã `reconnection: true` + backoff; outbox + idempotent id che phần còn lại |
| pnpm + Metro | Xử lý một lần ở GĐ 1 (§7); nếu quá đau, phương án dự phòng là `node-linker=hoisted` cho riêng `apps/mobile` |
| Hai bảng màu lệch nhau | §5.7 sinh cả hai từ một file dữ liệu, không copy tay |
| Sửa `packages/api` làm hỏng web | GĐ 0 tách riêng, mọi thay đổi đều có default giữ nguyên hành vi cũ |

---

## 11. Bản thử nghiệm không cần Apple Developer: Expo Go + EAS Update

Chưa có tài khoản 99$/năm (§9-C) thì không ký được bản Ad Hoc/TestFlight. Đường
miễn phí là **Expo Go** (có sẵn trên App Store) tải bundle JS từ **EAS Update**:
quét một mã QR cố định, không cần bật máy Mac.

Cấu hình đã có sẵn trong `apps/mobile/app.config.ts`:

- `runtimeVersion: "exposdk:57.0.0"` — Expo Go **chỉ nhận** update có runtime
  `exposdk:<SDK của nó>`. Nâng `expo` lên major mới thì phải sửa giá trị này.
  Trước khi làm bản standalone/dev build thật, đổi sang policy theo build
  (ví dụ `{ policy: "fingerprint" }`).
- `updates.url` + `extra.eas.projectId` ghi thẳng project id (không phải bí mật).

### Phát hành một bản

```bash
cd apps/mobile
cp .env.preview.example .env.preview   # một lần — điền URL backend thật (https/wss)
npx eas login                          # một lần
pnpm update:preview --message "mô tả thay đổi"
```

`update:preview` nạp `.env.preview` vào **biến shell**, mà biến shell thắng mọi
file `.env*` của Expo — nên `.env.local` (localhost cho dev) không bị gắn vào
bundle. `EXPO_PUBLIC_*` được **inline lúc build**: đổi URL backend là phải chạy
lại lệnh.

### Mã QR

Channel `preview` cố định nên link cũng cố định — in một lần, dùng mãi:

```
https://qr.expo.dev/eas-update?projectId=685744ca-643b-49e8-a59a-fd9b241f1f31&runtimeVersion=exposdk:57.0.0&channel=preview
```

URL trên trả về ảnh SVG của mã QR (nhúng thẳng vào trang trên VPS bằng `<img>`).
Thêm `&format=url` để lấy link thô rồi tự sinh QR (`qrencode`).

### Giới hạn

- Chỉ chạy được module native **có sẵn trong Expo Go**.
- **Push notification từ xa không hoạt động** trong Expo Go (chỉ local).
- Người dùng phải cài Expo Go đúng SDK 57.
