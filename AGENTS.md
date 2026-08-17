<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Data layer

Mọi feature chạm backend PHẢI theo `docs/data-layer.md`. Types, api và hooks đều nằm trong package `@noalhub/api` (`packages/api/src/<feature>/`): `types.ts` + `schemas.ts` → `api.ts` → `hooks.ts` (React Query hooks) → components. Component chỉ import barrel `@noalhub/api/<feature>`; `api.ts` và `client.ts` KHÔNG nằm trong `exports` của package nên không có đường import từ ngoài. Đọc file đó trước khi viết feature mới.

# Monorepo

Repo là pnpm workspace + Turborepo: `apps/web` (customer, port 3000) và `apps/admin` (port 3002) là hai Next app build/deploy độc lập, dùng chung `packages/{api,core,ui,config}`. Chi tiết cơ chế build, tên miền và đường tách repo: `docs/monorepo-plan.md`.

Package nội bộ export TS thô, app phải khai `transpilePackages` trong `next.config.ts`. Không import chéo giữa hai app; không import từ `packages/*` ngược lên `apps/*`.

Contract là OpenAPI spec của backend: `http://localhost:3101/docs` (JSON: `/docs-json`). Đối chiếu spec trước khi viết service — đừng đoán shape.
