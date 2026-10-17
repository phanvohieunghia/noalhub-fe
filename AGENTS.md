<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Language

Code, comments, commit messages and this file are **English**. The `docs/` directory is **Vietnamese** — keep it that way. User-facing copy lives in `packages/i18n/messages/{vi,en}/`, never inline.

# Data layer

Every feature that touches the backend MUST follow `docs/data-layer.md` — read it before writing a new feature. Components only import the `@noalhub/api/<feature>` barrel; `api.ts` and `client.ts` are NOT in the package `exports`, so there is no import path from outside.

# Monorepo

Build mechanics, domains and the path to splitting the repo: `docs/monorepo.md`.

Internal packages export raw TS, so each app must declare `transpilePackages` in `next.config.ts`. No cross-imports between apps; never import from `packages/*` back up into `apps/*`.

The contract is the backend OpenAPI spec: `http://localhost:3101/docs` (JSON: `/docs-json`). Check the spec before writing a service — do not guess the shape.

# Building UI

**Mandatory order when you need a component — no skipping ahead:**

1. **A component that already exists in the repo.** Look in `packages/ui/src/*` first (`packages/ui-native/src/*` for `apps/mobile`), then `apps/<app>/components/*`. If a variant is missing, **extend** the existing component (add a prop/variant); do not write a second near-identical one.
2. **A library already installed.** `radix-ui` (primitives) + `@iconify/react` (icons), TanStack Query, react-hook-form + zod, Tiptap. Check `package.json` before adding a new dependency; adding one requires a stated reason.
3. **Write your own** — only when (1) and (2) both fall short. A component used by both apps belongs in `packages/ui`, and must **not** pin one app's i18n namespace (take labels via props, or use `common`).

**Every new UI must be internationalized as it is written — never "translate later".** No hardcoded strings in JSX. Add keys to the right namespace under `packages/i18n/messages/{vi,en}/` (**both** locales — `pnpm check-messages` fails on drift), and read them with `useTranslations` (client/sync) or `getTranslations` (async Server Components, `generateMetadata`). Dates go through `useDateFormat()`/`getDateFormat()`; error messages return a **key** that is translated at render time. Details: `docs/i18n.md`.

**Every new UI must use theme color tokens — never hardcoded colors.** The source of truth is `packages/config/theme.css`: use the token classes (`bg-background`, `bg-surface`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `ring-ring`, `text-danger/success/warning`, and the `brand-50→950` / `neutral-50→950` scales). No hex literals, no `text-white`/`bg-gray-100`, no hand-written `dark:` variants — the tokens already switch with light/dark/system. Details and the palette: `docs/theme.md`.

# Figma

Design file: <https://www.figma.com/design/boNAQePZ6fZE99zapQpSxx/Noalhub> (`fileKey` `boNAQePZ6fZE99zapQpSxx`). Work only in this file — never create a new Figma file.

**Workflow.** Call `create_session` with the fileKey before any other file tool, and load the `figma-use` skill before every `use_figma` call (plus `figma-generate-design` for screens, `figma-generate-library` for components/tokens). Inspect first — pages, variable collections, text styles, component sets — then build.

**Reuse before create.** Same order as "Building UI": instantiate components that already exist in the file (Header, Button, Badge, Input, Avatar, …) and bind to its Color/Radius/Layout variables and Open Sans text styles. Never redraw them by hand, never hardcode hex/px values that a variable covers. If a needed component is missing or broken (e.g. Badge success/warning text colour equals its background), say so instead of faking it.

**Structure: everything lives in a Section.**
- Each page (tab) is organised into named Sections; **no component, frame or screen may sit loose on the canvas.**
- Put a new component/screen into an **existing Section when it fits** that section's purpose (e.g. a new input variant → the Inputs section); extend or remove nodes there as needed, keeping it tidy.
- If no existing Section fits, **create a new Section** with a clear name rather than forcing it into an unrelated one.
- Reusable components go on the Primitives page (inside the matching Section); new screens go in a new page (tab) of this file, each screen inside a Section.
- Before deleting or restructuring existing nodes, check what instances depend on them.

**Naming & fidelity.** Name layers/components after their code counterpart (`Button`, `Input`, …) with variant properties matching the code props. Light/dark come from variable modes, never duplicated frames. Use auto-layout, not absolute positioning.
