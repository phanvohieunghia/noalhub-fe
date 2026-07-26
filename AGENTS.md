<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Data layer

Mọi feature chạm backend PHẢI theo `docs/data-layer.md`. Types, api và hooks đều nằm trong `services/<feature>/`: `types.ts` + `schemas.ts` → `api.ts` → `hooks.ts` (React Query hooks) → components. Component chỉ import `hooks.ts`, không được import `api.ts` hay `client.ts`. `lib/` chỉ giữ thứ không thuộc data layer (store, token-store, helper form). Đọc file đó trước khi viết feature mới.

Contract là OpenAPI spec của backend: `http://localhost:3101/docs` (JSON: `/docs-json`). Đối chiếu spec trước khi viết service — đừng đoán shape.
