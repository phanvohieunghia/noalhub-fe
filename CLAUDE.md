# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

Run from the repo root (Turborepo fans out to every workspace):

| Command | Purpose |
|---|---|
| `pnpm dev` | Dev servers for both Next apps |
| `pnpm dev:web` / `pnpm dev:admin` | One app only |
| `pnpm build` / `pnpm build:web` / `pnpm build:admin` | Production builds (separate artifacts per app) |
| `pnpm lint` | ESLint flat config — `next build` does **not** lint |
| `pnpm typecheck` | `tsc --noEmit` across all apps and packages |
| `pnpm check-messages` | Fails on `vi`/`en` message drift |

Storybook lives in `apps/storybook` and is the only place with a test runner:

```bash
pnpm --filter @noalhub/storybook dev              # port 6006
pnpm --filter @noalhub/storybook test-storybook:ci # build + serve + run all story tests
pnpm --filter @noalhub/storybook exec test-storybook -- Button  # single story file (regex on story name/path)
```

Requires the backend at `http://localhost:3101` (OpenAPI `/docs`, JSON `/docs-json`).

## Ports and env

Each app has its **own** `.env.local` (copy from `.env.example`), and `PORT` lives there — not in the
root. Next binds the HTTP server before loading env files, so `dev`/`start` go through
`scripts/next-with-env.mjs`, which reads the file then imports the Next bin in-process. Do **not**
switch these scripts to Node's `--env-file*` flags: `next dev` forwards `execArgv` via `NODE_OPTIONS`,
where those flags are illegal, and the worker dies with exit code 9.

`NEXT_PUBLIC_*` is inlined at build time, so an app pointed at a different origin must be rebuilt —
the two apps never share a build artifact.

## Architecture

Stack: Next 16 App Router · React 19 · TS strict · Tailwind v4 · TanStack Query v5 · zustand ·
next-intl · Socket.IO. The browser calls the backend **directly**; there is no BFF proxy.

- `apps/web` — customer app, locale-segmented routes under `app/[locale]/`.
- `apps/admin` — admin app, `app/(protected)/` behind an auth gate, no locale segment in the URL.
- `apps/storybook` — standalone Storybook app; stories live here (`src/`), never inside `packages/ui`.
  Builds split public vs. internal audiences via `SB_AUDIENCE`.
- `packages/api` — the whole data layer (see `docs/data-layer.md`): per-feature
  `types/schemas → api → hooks`, plus `client.ts` (axios, Bearer + 401-refresh interceptor) and the
  data-layer stores (`auth/store.ts`, `auth/token-store.ts`, `chat/ephemeral-store.ts`,
  `chat/outbox.ts`) — they sit here because `hooks.ts` depends on them and they depend back on
  `api.ts`. `API_BASE_URL` already includes `/api`, so api-layer paths omit it.
- `packages/core` — framework-light helpers (`format-date`, forms, theme, per-feature formatting).
- `packages/ui`, `packages/i18n`, `packages/config`.

Two documented exceptions to the data-layer convention: chat **writes** go over the socket
(`packages/api/src/chat/socket.ts`, `docs/chat.md` §6), and blog **reads** on the public site are
server-only fetches, not React Query (`docs/blog.md` §7).

`docs/` is the design record — read the file for the area you are touching (`data-layer`, `auth`,
`chat`, `blog`, `i18n`, `theme`, `monorepo`, `media`, `storybook`, `slug-management`, `admin-plan`).
