# syntax=docker/dockerfile:1
#
# Build context là GỐC REPO, không phải thư mục này:
#
#   docker build -f apps/web/Dockerfile --build-arg NEXT_PUBLIC_API_BASE_URL=... .
#
# pnpm workspace cần lockfile ở gốc + toàn bộ `packages/*` để resolve
# `workspace:*`, nên không có cách nào build từ context hẹp hơn.

# Debian slim, khớp với image của backend. Alpine (musl) sẽ kéo theo chuyện phải
# chọn đúng biến thể prebuilt của sharp — không đáng để đổi lấy vài chục MB.
FROM node:24-bookworm-slim AS base
# Corepack lấy pnpm theo trường `packageManager` ở package.json gốc. Thiếu biến
# này thì corepack hỏi xác nhận và CI (không TTY) treo.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /repo

# --- Stage build ------------------------------------------------------------
FROM base AS build

# Manifest trước, source sau: sửa code thì layer `pnpm install` vẫn được cache.
#
# ⚠️ Danh sách này phải liệt kê **mọi** package trong workspace. Thiếu một cái
# thì `pnpm install` không tạo `node_modules` cho nó, và lỗi chỉ nổ ở bước
# `next build` sau đó — dưới dạng `Module not found` cho những dependency hoàn
# toàn bình thường (`next-intl`, `@noalhub/api/…`), rất dễ đi tìm nhầm chỗ.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/admin/package.json ./apps/admin/
COPY packages/api/package.json ./packages/api/
COPY packages/core/package.json ./packages/core/
COPY packages/i18n/package.json ./packages/i18n/
COPY packages/ui/package.json ./packages/ui/
COPY packages/config/package.json ./packages/config/
RUN pnpm install --frozen-lockfile

COPY . .

# `NEXT_PUBLIC_*` bị INLINE vào bundle lúc `next build`, không đọc lúc chạy. Nên
# chúng phải là build-arg, và đổi API origin = build lại image, không phải restart
# container. Xem docs/monorepo-plan.md §2 (mục Env).
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_TELEMETRY_DISABLED=1

# `--filter=@noalhub/web...` (ba chấm) = web + các package nó phụ thuộc. Admin
# không được build, nên image này không chứa code admin.
RUN pnpm build:web

# --- Stage sharp ------------------------------------------------------------
# `next/image` optimizer ở production đòi `sharp`, mà repo không khai nó ở
# dependency nào (và `pnpm-workspace.yaml` còn tắt build script của nó). Cài
# riêng ở stage này rồi copy sang runtime: nếu sau này bỏ `next/image` hoặc
# chuyển sang `images.unoptimized`, xoá nguyên stage này là xong.
FROM base AS sharp
WORKDIR /sharp
RUN npm init -y > /dev/null && npm install --no-audit --no-fund sharp@0.34.4

# --- Stage runtime ----------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app

# `output: "standalone"` + `outputFileTracingRoot` = gốc repo cho ra cây:
#   .next/standalone/{node_modules, apps/web/server.js, packages/…}
# tức là bản sao đã trace sẵn, KHÔNG cần `pnpm install` lại ở runtime.
COPY --from=build /repo/apps/web/.next/standalone ./
# Hai thư mục này standalone cố tình không copy (Next giả định có CDN đứng trước).
# Ở đây nginx chỉ proxy chứ không phục vụ file tĩnh, nên phải tự copy vào.
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /repo/apps/web/public ./apps/web/public
# Node resolve ngược lên cây thư mục, nên đặt ở /app/node_modules là
# /app/apps/web/server.js thấy được.
COPY --from=sharp /sharp/node_modules ./node_modules

USER node
EXPOSE 3000

# Chạy thẳng node, không qua pnpm: pnpm sẽ là PID 1 và nuốt SIGTERM, container
# luôn bị kill cứng sau grace period.
CMD ["node", "apps/web/server.js"]
