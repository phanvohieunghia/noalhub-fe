<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Language

Code, comments, commit messages and this file are **English**. The `docs/` directory is **Vietnamese** — keep it that way. User-facing copy lives in `packages/i18n/messages/{vi,en}/`, never inline.

# Data layer

Every feature that touches the backend MUST follow `docs/data-layer.md`. Types, api and hooks all live in the `@noalhub/api` package (`packages/api/src/<feature>/`): `types.ts` + `schemas.ts` → `api.ts` → `hooks.ts` (React Query hooks) → components. Components only import the `@noalhub/api/<feature>` barrel; `api.ts` and `client.ts` are NOT in the package `exports`, so there is no import path from outside. Read that doc before writing a new feature.

# Monorepo

The repo is a pnpm workspace + Turborepo: `apps/web` (customer, port 3000) and `apps/admin` (port 3002) are two Next apps built and deployed independently, sharing `packages/{api,core,ui,config}`. Build mechanics, domains and the path to splitting the repo: `docs/monorepo.md`.

Internal packages export raw TS, so each app must declare `transpilePackages` in `next.config.ts`. No cross-imports between the two apps; never import from `packages/*` back up into `apps/*`.

The contract is the backend OpenAPI spec: `http://localhost:3101/docs` (JSON: `/docs-json`). Check the spec before writing a service — do not guess the shape.

# Building UI

**Mandatory order when you need a component — no skipping ahead:**

1. **A component that already exists in the repo.** Look in `packages/ui/src/*` first, then `apps/<app>/components/*`. If a variant is missing, **extend** the existing component (add a prop/variant); do not write a second near-identical one.
2. **A library already installed.** `radix-ui` (primitives) + `@iconify/react` (icons), TanStack Query, react-hook-form + zod, Tiptap. Check `package.json` before adding a new dependency; adding one requires a stated reason.
3. **Write your own** — only when (1) and (2) both fall short. A component used by both apps belongs in `packages/ui`, and must **not** pin one app's i18n namespace (take labels via props, or use `common`).

**Every new UI must be internationalized as it is written — never "translate later".** No hardcoded strings in JSX. Add keys to the right namespace under `packages/i18n/messages/{vi,en}/` (**both** locales — `pnpm check-messages` fails on drift), and read them with `useTranslations` (client/sync) or `getTranslations` (async Server Components, `generateMetadata`). Dates go through `useDateFormat()`/`getDateFormat()`; error messages return a **key** that is translated at render time. Details: `docs/i18n.md`.

**Every new UI must use theme color tokens — never hardcoded colors.** The source of truth is `packages/config/theme.css`: use the token classes (`bg-background`, `bg-surface`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `ring-ring`, `text-danger/success/warning`, and the `brand-50→950` / `neutral-50→950` scales). No hex literals, no `text-white`/`bg-gray-100`, no hand-written `dark:` variants — the tokens already switch with light/dark/system. Details and the palette: `docs/theme.md`.
