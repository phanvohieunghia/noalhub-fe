# syntax=docker/dockerfile:1
#
# Build context là GỐC REPO, không phải thư mục này:
#
#   docker build -f apps/storybook/Dockerfile .
#
# pnpm workspace cần lockfile ở gốc + toàn bộ `packages/*` để resolve
# `workspace:*`, nên không có cách nào build từ context hẹp hơn.
#
# Khác web/admin ở một điểm: Storybook build ra WEB TĨNH, không có server. Nên
# runtime ở đây là nginx phục vụ file, không phải node — và cũng vì thế không có
# build-arg `NEXT_PUBLIC_*` nào: không có gì để inline vào bundle.

# --- Stage build ------------------------------------------------------------
FROM node:24-bookworm-slim AS build
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /repo

# Manifest trước, source sau: sửa code thì layer `pnpm install` vẫn được cache.
#
# ⚠️ Phải liệt kê **mọi** package trong workspace, kể cả cái Storybook không
# dùng tới. Thiếu một cái thì `pnpm install` không tạo `node_modules` cho nó và
# lỗi chỉ nổ ở bước build sau đó, dưới dạng `Module not found` cho những
# dependency hoàn toàn bình thường.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/admin/package.json ./apps/admin/
COPY apps/storybook/package.json ./apps/storybook/
COPY packages/api/package.json ./packages/api/
COPY packages/core/package.json ./packages/core/
COPY packages/i18n/package.json ./packages/i18n/
COPY packages/ui/package.json ./packages/ui/
COPY packages/config/package.json ./packages/config/
RUN pnpm install --frozen-lockfile

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# `...` (ba chấm) = storybook + các package nó phụ thuộc. web/admin không được
# build, nên image này không chứa code của hai app kia.
RUN pnpm turbo run build-storybook --filter=@noalhub/storybook...

# --- Stage runtime ----------------------------------------------------------
# Chỉ có file tĩnh, nên image runtime không cần node: nginx:alpine ~50MB thay vì
# ~200MB của node:24-bookworm-slim.
FROM nginx:alpine AS runtime
COPY apps/storybook/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/storybook/storybook-static /usr/share/nginx/html
EXPOSE 80
