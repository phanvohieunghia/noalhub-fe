# noalhub-fe

Frontend của noalhub: auth, chat realtime, hồ sơ người dùng và bạn bè.
Next.js 16 App Router · React 19 · TypeScript strict · Tailwind v4 · TanStack Query v5 · zustand · Socket.IO.

Backend là một service REST + Socket.IO riêng (`noalhub-be`); browser gọi **thẳng** backend, không qua BFF proxy.

Repo là **monorepo** (pnpm workspace + Turborepo): hai Next app độc lập — `apps/web` (customer)
và `apps/admin` — dùng chung tầng dữ liệu, helper và UI trong `packages/`. Xem
[`docs/monorepo-plan.md`](docs/monorepo-plan.md) cho cơ chế build, tên miền và đường tách repo.

## Chạy dự án

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local       # sửa nếu backend không ở localhost:3101
cp apps/admin/.env.example apps/admin/.env.local
pnpm dev                                          # port lấy từ `PORT` trong .env.local mỗi app
```

Mỗi app có `.env.local` RIÊNG. `NEXT_PUBLIC_*` bị inline lúc `next build`, nên hai app
trỏ khác origin thì phải build hai lần — không dùng lại artifact của nhau.

Cần backend chạy song song ở `http://localhost:3101` (OpenAPI: `/docs`, JSON: `/docs-json`).

| Script (chạy ở root) | Việc |
|---|---|
| `pnpm dev` | Dev server cả hai app, mỗi app nghe port `PORT` trong `.env.local` của nó |
| `pnpm dev:web` / `pnpm dev:admin` | Chỉ một app |
| `pnpm build` | Build cả hai → `apps/web/.next` và `apps/admin/.next`, hai artifact tách rời |
| `pnpm build:web` / `pnpm build:admin` | Chỉ build một app và các package nó phụ thuộc |
| `pnpm lint` | ESLint flat config (`next build` **không** còn lint) |
| `pnpm typecheck` | `tsc --noEmit` cho mọi app và package |

Chạy bản build: `pnpm --filter @noalhub/web start` (hoặc `@noalhub/admin`).

### Đổi port

Port nằm trong `.env.local` của **từng app** — `apps/web/.env.local` và
`apps/admin/.env.local`, mỗi file một dòng:

```bash
# apps/web/.env.local
PORT=3100
# apps/admin/.env.local
PORT=3002
```

Next **không** tự đọc `PORT` từ `.env`: nó bind HTTP server trước khi env file được load
(docs `next.md` §CLI). Nên script `dev`/`start` gọi qua một loader nạp file trước:

```json
"dev": "node ../../scripts/next-with-env.mjs dev"
```

Không dùng cờ `--env-file-if-exists` của Node cho việc này: `next dev` spawn worker và
truyền `execArgv` của process cha qua `NODE_OPTIONS`, mà `--env-file*` không được phép
nằm trong `NODE_OPTIONS` → worker chết ngay với exit code 9. `scripts/next-with-env.mjs`
tự đọc file rồi `import` next bin in-process nên `NODE_OPTIONS` vẫn sạch.

Thứ tự `.env` → `.env.local` (file sau đè file trước), và **biến của shell đè cả hai**,
nên vẫn đổi tạm một lần được:

```bash
PORT=4100 pnpm dev:web
```

Thiếu file cũng không chết: loader bỏ qua file không tồn tại — lúc đó Next lấy mặc định
`3000`, và hai app sẽ đá nhau khi `pnpm dev` ở root. Vì vậy `PORT` có sẵn trong cả hai
`.env.example`; `cp` xong là mỗi app đã có port riêng.

Đừng đặt `PORT` ở shell rồi chạy `pnpm dev` ở gốc: nó đè cả hai app cùng lúc.

> Next 16 chỉ cho **một** dev server trên mỗi thư mục app, và khoá này tính theo thư mục
> **chứ không theo port**: còn một `next dev` cũ của `apps/web` sống thì đổi port vẫn bị
> từ chối với `Another next dev server is already running`. Log của nó có in sẵn PID và
> câu `Run kill <pid> to stop it`.

## Biến môi trường

Xem `apps/web/.env.example` để biết chú thích đầy đủ. Tóm tắt:

| Biến | Ý nghĩa |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | **Origin** của backend. Tiền tố `/api` do `packages/api/src/config.ts` tự gắn |
| `NEXT_PUBLIC_WS_URL` | Origin của Socket.IO gateway. Bỏ trống thì suy từ API origin (chỉ đúng ở local) |

Mọi biến phải có tiền tố `NEXT_PUBLIC_` vì browser gọi thẳng backend. Next 16 đã xoá `serverRuntimeConfig`/`publicRuntimeConfig`.

## Cấu trúc

Path alias `@/*` trỏ về gốc của từng app, và chỉ dùng cho code riêng của app đó.
Thứ dùng chung đi qua tên package.

```
apps/
  web/                   Customer FE — port 3000
    app/                 App Router
      (auth)/            login, register, forgot/reset password
      auth/callback/     OAuth handoff code
      (protected)/       dashboard, chat, friends, profile — bọc <AuthGuard>
    components/          UI riêng của web (auth, chat, friends, profile)
    mocks/               Mock backend cũ, đã lỗi thời (xem docs/auth.md §10.1)
  admin/                 Admin FE — port 3002, build/deploy độc lập
packages/
  api/    @noalhub/api   DATA LAYER — xem docs/data-layer.md
    src/client.ts        axios instance: Bearer, 401 → refresh single-flight (KHÔNG export ra ngoài)
    src/config.ts        API_BASE_URL, WS_URL, CHAT_NAMESPACE
    src/errors.ts        ApiError, ERROR_CODES
    src/auth|chat|friends|users/
                         types · schemas · api · hooks · index (barrel) + store của tầng dữ liệu
  core/   @noalhub/core  Helper không thuộc data layer, không phải UI:
                         forms/apply-api-error, format-date, auth/redirect, chat/format
  ui/     @noalhub/ui    Primitive dùng chung + QueryProvider + AuthProvider/AuthGuard
  config/ @noalhub/config  tsconfig base, ESLint boundary rules
docs/                    Tài liệu thiết kế
```

Ranh giới bắt buộc giữ (để việc tách repo sau này còn rẻ): hai app **không** import chéo
nhau, `packages/*` **không** import ngược lên `apps/*`.

## Tài liệu

Đọc trước khi viết feature mới:

- [`docs/data-layer.md`](docs/data-layer.md) — **bắt buộc**: types → schemas → api → hooks → components
- [`docs/auth.md`](docs/auth.md) — session, token store, refresh, route guard, OAuth
- [`docs/chat.md`](docs/chat.md) — REST đọc + Socket.IO ghi, optimistic send, presence/typing

Feature friends & profile chưa có tài liệu thiết kế riêng; contract nằm trong OpenAPI spec và trong doc comment của `packages/api/src/friends/*`, `packages/api/src/users/*`.

Contract là OpenAPI spec của backend — spec thắng mọi tài liệu trong repo này.

## Ràng buộc Next 16 hay vấp

- `params`, `searchParams`, `cookies()`, `headers()` đều **async**; bản đồng bộ đã bị xoá.
- `PageProps<'/route'>` / `LayoutProps<'/route'>` là global type, **không import**.
- `middleware.ts` deprecated → `proxy.ts`. Repo này cố tình không có file đó (auth ở client, xem `docs/auth.md` §1.2).
- Tailwind v4 cấu hình bằng CSS trong `apps/<app>/app/globals.css`; **không** có `tailwind.config.js`. Mỗi app phải khai `@source "../../../packages/ui/src"` — Tailwind không tự dò package nằm ngoài cây thư mục app.
- Docs bundled tại `node_modules/next/dist/docs/` — đọc ở đó thay vì theo trí nhớ.
