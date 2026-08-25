# Kế hoạch tách monorepo: `apps/web` + `apps/admin`

| | |
|---|---|
| **Status** | **Đã thực hiện** (2026-08-17). §1–§4 mô tả trạng thái hiện tại của repo; §5 là nhật ký các bước đã chạy |
| **Kiểm chứng** | `pnpm build` (2 app xanh), `pnpm typecheck` (6 package xanh), `pnpm lint`, admin dev server phục vụ `/login` 200 |

Trước đó repo là **một Next.js app duy nhất** ở root (`app/`, `components/`, `services/`,
`lib/`). Mục tiêu: hai app Next độc lập, build riêng, deploy riêng, gắn được **2 tên miền
độc lập**, và tách hẳn thành 2 repo trong tương lai mà không phải viết lại code.

---

## 1. Cấu trúc đích

```
noalhub-fe/
├── apps/
│   ├── web/                    # customer FE — port 3000 (source cũ, di chuyển vào)
│   │   ├── app/                # (auth), (protected), layout.tsx, globals.css
│   │   ├── components/         # UI riêng của web
│   │   ├── next.config.ts      # transpilePackages + turbopack.root
│   │   ├── .env.local          # env RIÊNG từng app
│   │   ├── package.json        # name: @noalhub/web
│   │   └── tsconfig.json       # extends @noalhub/config/tsconfig.base.json
│   └── admin/                  # admin FE — port 3002
│       ├── app/                # login/ + (protected)/dashboard
│       ├── next.config.ts
│       ├── .env.local
│       ├── package.json        # name: @noalhub/admin
│       └── tsconfig.json
├── packages/
│   ├── api/                    # @noalhub/api — toàn bộ services/ cũ
│   │   ├── src/client.ts config.ts errors.ts
│   │   ├── src/auth/           # types|schemas|api|hooks|index + store, token-store
│   │   ├── src/chat/           # …|socket|index + ephemeral-store, outbox
│   │   ├── src/friends/ users/
│   │   └── package.json        # exports: chỉ ./config ./errors + 4 barrel
│   ├── ui/                     # @noalhub/ui — primitive + query-provider + auth/{provider,guard}
│   ├── core/                   # @noalhub/core — format-date, auth/redirect, chat/format, forms/*
│   └── config/                 # @noalhub/config — tsconfig.base.json, eslint.boundaries.mjs
├── package.json                # root: scripts + devDeps chung
├── pnpm-workspace.yaml
└── turbo.json
```

Nguyên tắc phân chia (giữ nguyên luật của `docs/data-layer.md`):

| Thứ | Đi về đâu | Lý do |
|---|---|---|
| `services/*` | `packages/api` | Hai app dùng chung contract backend NestJS; hook React Query giống nhau |
| `lib/auth/{store,token-store}`, `lib/chat/{ephemeral-store,outbox}` | `packages/api` | **Lệch so với dự thảo ban đầu** — xem ghi chú ngay dưới |
| `lib/{format-date, auth/redirect, chat/format, chat/error-message, forms/*}` | `packages/core` | Helper thuần, phụ thuộc **một chiều** vào `@noalhub/api` |
| `components/ui/*`, `providers/query-provider`, `auth/{auth-provider,auth-guard}` | `packages/ui` | Primitive + vỏ session mà admin cũng cần y hệt |
| `components/{auth,chat,friends,profile,dashboard}` | `apps/web` | feature-specific, admin không cần |
| `app/*` | `apps/web` | routing riêng từng app |

> **Ghi chú lệch dự thảo — vì sao store nằm trong `packages/api` chứ không phải `packages/core`.**
> Dự thảo ban đầu định đẩy nguyên `lib/` sang `packages/core`. Khi đọc lại import graph thì
> `lib/` và `services/` **phụ thuộc vòng vào nhau**: `services/client.ts` và
> `services/auth/hooks.ts` cần `lib/auth/token-store` + `lib/auth/store`, còn
> `lib/auth/store.ts` lại gọi `services/auth/api` và `services/client`. Tách đôi y nguyên
> thì thành hai package phụ thuộc vòng — pnpm cho cài nhưng đó là một quả bom hẹn giờ, và
> nó phá luôn bước tách repo ở §4.
>
> Cách xử lý: bốn file store **thuộc tầng dữ liệu** (session, token, presence phù du, outbox)
> đi cùng `packages/api`, còn `packages/core` chỉ giữ helper thuần. Kết quả là đồ thị một
> chiều `ui → core → api`, không còn vòng.

Component vẫn **chỉ import `hooks`**: từ nay là `@noalhub/api/auth` (barrel chỉ export
`hooks` + `types`), còn `api.ts`/`client.ts` không nằm trong `exports` map → cấm import
được cưỡng chế bởi package boundary chứ không còn là quy ước.

---

## 2. Cơ chế build

### Workspace + task graph

`pnpm-workspace.yaml`:
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

`apps/web/package.json` khai báo `"@noalhub/api": "workspace:*"`. pnpm symlink
`node_modules/@noalhub/api → ../../packages/api`. Không publish, không versioning.

`turbo.json`:
```json
{
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "!.next/cache/**"] },
    "dev":   { "cache": false, "persistent": true }
  }
}
```

### Hai chế độ cho `packages/*` — chọn **JIT (transpilePackages)**

| | JIT | Compiled |
|---|---|---|
| package export | `./src/index.ts` (TS thô) | `dist/*.js` build bằng tsup |
| app config | `transpilePackages: ["@noalhub/api", ...]` | không cần |
| DX | sửa package → HMR ngay | phải chạy watch build |
| `^build` | không cần | cần |

Chọn JIT vì cả 2 consumer đều là Next: Next compile TS của package bằng chính SWC của app,
tôn trọng đúng `"use client"` directive và tree-shaking. Chỉ đổi sang Compiled khi có
consumer ngoài Next (React Native, script node) hoặc khi muốn publish npm.

Hai thứ phát sinh khi chạy thật, cả hai đã được xử lý và ghi chú tại chỗ trong code:

- **`turbopack.root`.** Turbopack không resolve file nằm ngoài root, mà root nó tự dò bằng
  cách đi ngược lên tìm lockfile — trên máy dev nó vớ phải `~/yarn.lock` và chọn cả `$HOME`.
  Cả hai `next.config.ts` ghim `root: path.join(process.cwd(), "..", "..")`.
- **`@source` của Tailwind v4.** Tailwind chỉ dò source trong cây thư mục chứa file CSS và
  bỏ qua `node_modules`, mà `@noalhub/ui` chỉ được symlink vào đó. Không khai `@source` thì
  class chỉ xuất hiện trong `packages/ui` bị loại khỏi bundle — **hỏng ở production nhưng
  vẫn đúng ở dev**. Mỗi `globals.css` khai `@source "../../../packages/ui/src"`.

`apps/web/next.config.ts` và `apps/admin/next.config.ts`:
```ts
const nextConfig: NextConfig = {
  transpilePackages: ["@noalhub/api", "@noalhub/ui", "@noalhub/core"],
};
```

### Build ra cái gì

`pnpm build` (turbo) chạy song song 2 lần `next build` độc lập →
`apps/web/.next` và `apps/admin/.next`. **Hai artifact hoàn toàn tách rời**: hai process
`next start` khác nhau, hai port khác nhau (web 3000, admin 3002), hai container khác nhau
nếu muốn. Không có bundle chung, không share runtime.

Deploy Docker: dùng `output: "standalone"` + `pnpm deploy --filter=@noalhub/web` để copy
đúng subtree phụ thuộc vào image, image admin không chứa code của web.

### Env

`NEXT_PUBLIC_*` bị **inline lúc `next build`**, không đọc runtime. Nên:
- mỗi app có `.env.local` riêng trong `apps/<app>/`;
- `packages/api/src/config.ts` vẫn đọc `process.env.NEXT_PUBLIC_API_BASE_URL` — biến này
  do **app đang build** cung cấp, package không tự có env. Admin có thể trỏ origin khác.
- Hệ quả: **không dùng chung một artifact build cho 2 domain khác API origin** — phải build
  2 lần với env khác nhau. Nếu sau này cần 1 image chạy nhiều môi trường, chuyển sang
  runtime config (`/config.json` fetch lúc bootstrap) thay vì `NEXT_PUBLIC_`.

---

## 3. URL và tên miền

### Local dev
```
apps/web    → http://localhost:3000
apps/admin  → http://localhost:3002   ("dev": "next dev -p 3002")
backend     → http://localhost:3101
```
Chạy cả hai: `pnpm dev` ở root (turbo chạy song song), hoặc `pnpm --filter @noalhub/admin dev`.

### Production — 2 domain độc lập (khuyến nghị)
```
https://noalhub.duckdns.org        → nginx proxy_pass 127.0.0.1:3000   (web)
https://admin-noalhub.duckdns.org  → nginx proxy_pass 127.0.0.1:3002   (admin)
https://api-noalhub.duckdns.org    → NestJS
wss://ws-noalhub.duckdns.org       → Socket.IO (giữ nguyên, KHÔNG bật http2)
```

**Được, hoàn toàn gắn 2 tên miền độc lập** — vì đây là 2 Next app riêng, mỗi app là một
origin đầy đủ, `basePath` để trống ở cả hai. Mỗi server block nginx có cert riêng, có thể
đặt ở 2 máy khác nhau.

Lợi ích bảo mật của domain tách: cookie/localStorage của admin không chia sẻ origin với
web; có thể đặt IP allowlist / basic auth / VPN riêng cho `admin-*` ở tầng nginx mà không
đụng tới web.

### Phương án thay thế (nếu bắt buộc 1 domain)
`https://noalhub.duckdns.org/admin` → `apps/admin` đặt `basePath: "/admin"`, nginx route
`location /admin { proxy_pass 127.0.0.1:3002; }`. Dùng khi muốn chung cookie session.
Nhược: mọi asset của admin phải nằm dưới `/admin`, dễ sai nếu quên `basePath` trong link
tuyệt đối. Không khuyến nghị cho lần này.

### CORS
Backend NestJS phải thêm origin của admin vào allowlist (`credentials: true`). Đây là thay
đổi duy nhất bắt buộc ở backend.

---

## 4. Khả năng tách source trong tương lai

Kiến trúc này được thiết kế để "tách repo" là một thao tác cơ học, không phải refactor:

**Mức 1 — tách deploy (có ngay sau plan này).** 2 pipeline CI độc lập, filter theo path:
`turbo build --filter=@noalhub/admin...` chỉ build lại khi `apps/admin` hoặc package nó
phụ thuộc thay đổi. Deploy admin không cần đụng web.

**Mức 2 — tách repo, giữ code chung qua npm private registry.**
1. Đổi `packages/*` từ JIT sang Compiled (thêm tsup, `exports` trỏ `dist/`, thêm `^build`).
   Đây là bước duy nhất tốn công, và nó độc lập với việc tách repo.
2. Publish `@noalhub/api|ui|core` lên GitHub Packages / Verdaccio, gắn version semver.
3. `git filter-repo --path apps/admin` tách repo admin, giữ nguyên lịch sử commit.
4. Repo admin đổi `"workspace:*"` → `"^1.2.0"`. Không đổi một dòng import nào.

**Mức 3 — tách hẳn, không chia sẻ code.** Copy `packages/api` vào từng repo và cho chúng
diverge. Chỉ nên làm khi 2 sản phẩm đã thực sự khác contract.

Điều kiện để mức 2 rẻ — phải giữ kỷ luật ngay từ bây giờ:
- Không import chéo `apps/web` ↔ `apps/admin`. Cần chung thì đẩy xuống `packages/`.
- `packages/*` không import ngược lên `apps/*` (thêm ESLint `no-restricted-imports`).
- `packages/api` không chứa JSX/UI, không phụ thuộc `packages/ui`.
- Mỗi package có `package.json` với `exports` map rõ ràng ngay từ đầu, kể cả khi đang JIT.

---

## 5. Nhật ký thực hiện

Đã chạy xong theo đúng thứ tự dưới (mỗi bước build được độc lập):

1. **Chuẩn bị workspace**: thêm `packages:` vào `pnpm-workspace.yaml`, tạo `turbo.json`,
   chuyển devDeps chung (typescript, eslint, tailwind) lên root.
2. **Di chuyển web** (`git mv` để giữ history): `app/ components/ lib/ services/ public/
   next.config.ts postcss.config.mjs` → `apps/web/`. Tạo `apps/web/package.json`,
   `tsconfig.json` extends `@noalhub/config`. Verify `pnpm --filter @noalhub/web build`.
3. **Trích `packages/core`**: `lib/*` → `packages/core/src/`, sửa import `@/lib/...` →
   `@noalhub/core`.
4. **Trích `packages/api`**: `services/*` → `packages/api/src/`. `exports` map chỉ mở
   `./auth`, `./chat`, `./friends`, `./users` (barrel export hooks + types) và `./config`.
   Cập nhật `docs/data-layer.md` cho khớp đường dẫn mới.
5. **Trích `packages/ui`**: `components/ui/*`, kèm tailwind preset trong `packages/config`.
6. **Tạo `apps/admin`**: `create-next-app` cùng version Next (16.2.11), port 3002, cắm
   `transpilePackages` + provider React Query giống web, dựng route `/login` +
   `/dashboard` để verify end-to-end với `@noalhub/api`.
7. **CI/nginx**: 2 job build, 2 server block, thêm origin admin vào CORS backend.
   ⚠️ **Bước này chưa làm** — xem "Còn lại cho bạn quyết định" ngay dưới.

Ngoài bảy bước trên, phần cưỡng chế ranh giới ở §4 cũng đã dựng:
`packages/config/eslint.boundaries.mjs` cấm import thẳng vào `@noalhub/*/src/*` (phải qua
barrel) và cấm `packages/*` với ngược lên `apps/*`; cả hai app đều nạp rule này.

**Còn lại cho bạn quyết định** (chưa làm vì nằm ngoài phạm vi refactor cấu trúc):
CI hai job, hai server block nginx, và thêm origin admin vào CORS allowlist của backend
(bước 7). Admin hiện mới có `/login` + `/dashboard` làm bằng chứng chuỗi liên kết chạy
thật — màn hình quản trị thực sự là việc của feature sau.

---

## 6. Rủi ro cần biết trước

- **Next 16 trong repo này khác training data phổ biến** — theo `AGENTS.md`, đọc
  `node_modules/next/dist/docs/` trước khi viết `next.config.ts` mới cho admin, đặc biệt
  phần `transpilePackages` và `output: standalone`.
- **`"use client"` trong package**: file trong `packages/ui`/`packages/api/hooks.ts` phải
  giữ nguyên directive ở dòng đầu; với JIT thì Next xử lý đúng, nhưng nếu sau này chuyển
  sang tsup phải bật `banner`/preserve directive, nếu không sẽ vỡ ở build.
- **React duplicate instance**: nếu package lỡ khai React vào `dependencies` thay vì
  `peerDependencies`, hook sẽ lỗi "invalid hook call". Luôn để React ở `peerDependencies`
  của `packages/*`.
- **Socket.IO**: `packages/api/chat/socket.ts` giữ nguyên `WS_URL` tách riêng — lý do
  HTTP/2 đã ghi trong `.env.example` vẫn còn nguyên giá trị, đừng gộp về API origin.
