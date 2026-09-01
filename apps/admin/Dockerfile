# syntax=docker/dockerfile:1
#
# Build context là GỐC REPO, không phải thư mục này:
#
#   docker build -f apps/admin/Dockerfile --build-arg NEXT_PUBLIC_API_BASE_URL=... .
#
# pnpm workspace cần lockfile ở gốc + toàn bộ `packages/*` để resolve
# `workspace:*`, nên không có cách nào build từ context hẹp hơn.

FROM node:24-bookworm-slim AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /repo

# --- Stage build ------------------------------------------------------------
FROM base AS build

# Manifest trước, source sau: sửa code thì layer `pnpm install` vẫn được cache.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/admin/package.json ./apps/admin/
COPY packages/api/package.json ./packages/api/
COPY packages/core/package.json ./packages/core/
COPY packages/ui/package.json ./packages/ui/
COPY packages/config/package.json ./packages/config/
RUN pnpm install --frozen-lockfile

COPY . .

# `NEXT_PUBLIC_*` bị INLINE vào bundle lúc `next build`, không đọc lúc chạy. Nên
# chúng phải là build-arg, và đổi API origin = build lại image, không phải restart
# container. Admin không dùng chat và không dựng URL tuyệt đối của web, nhưng vẫn
# nhận đủ ba biến: `@noalhub/api/chat` và `@noalhub/core/blog/seo` nằm trong
# package dùng chung nên cả hai app cùng đi qua chúng, và một build-arg không được
# khai ở đây thì docker chỉ cảnh báo "unused" rồi biến rơi mất im lặng.
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_TELEMETRY_DISABLED=1

# `--filter=@noalhub/admin...` (ba chấm) = admin + các package nó phụ thuộc. Web
# không được build, nên image này không chứa code của web.
RUN pnpm build:admin

# --- Stage runtime ----------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app

# `output: "standalone"` + `outputFileTracingRoot` = gốc repo cho ra cây:
#   .next/standalone/{node_modules, apps/admin/server.js, packages/…}
# tức là bản sao đã trace sẵn, KHÔNG cần `pnpm install` lại ở runtime.
COPY --from=build /repo/apps/admin/.next/standalone ./
# Thư mục này standalone cố tình không copy (Next giả định có CDN đứng trước).
# Ở đây nginx chỉ proxy chứ không phục vụ file tĩnh, nên phải tự copy vào.
# Admin chưa có `public/` — thêm thư mục đó thì nhớ thêm một dòng COPY nữa.
COPY --from=build /repo/apps/admin/.next/static ./apps/admin/.next/static
# Không có stage `sharp` như bên web: admin không dùng `next/image` (avatar dùng
# thẻ <img> thường). Nếu sau này có, copy stage sharp từ apps/web/Dockerfile sang.

USER node
EXPOSE 3000

# Chạy thẳng node, không qua pnpm: pnpm sẽ là PID 1 và nuốt SIGTERM, container
# luôn bị kill cứng sau grace period.
CMD ["node", "apps/admin/server.js"]
