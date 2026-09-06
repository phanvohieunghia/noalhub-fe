// Run the Next CLI with the app's `.env`/`.env.local` ALREADY loaded into process.env.
//
// Why it is needed: Next binds the HTTP server before it loads env files, so a
// `PORT` set in `.env` is ignored (docs `next.md` §Changing the default port).
// Letting each app declare its own port in its own env file means the file has
// to be loaded BEFORE Next is invoked — that is this script's only job.
//
// Not `node --env-file-if-exists=... next dev`: Next dev spawns workers and
// forwards the parent's execArgv through NODE_OPTIONS, and `--env-file*` is not
// allowed in NODE_OPTIONS → the worker dies immediately with exit code 9.
//
// Precedence: shell variables > .env.local > .env (same as Next).
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { parseEnv } from "node:util";

const fromShell = new Set(Object.keys(process.env));

for (const file of [".env", ".env.local"]) {
  if (!existsSync(file)) continue;
  for (const [key, value] of Object.entries(parseEnv(readFileSync(file, "utf8")))) {
    if (!fromShell.has(key)) process.env[key] = value;
  }
}

// Resolve `next` from the APP DIRECTORY, not from the script's location: the
// script lives at the repo root, which has no `next` dependency (pnpm does not hoist).
const require = createRequire(pathToFileURL(`${process.cwd()}/package.json`));

// Dynamic import: the next bin reads process.argv.slice(2) itself, so `dev`/`start`
// passed to this script land where they should. Running in-process keeps NODE_OPTIONS clean.
await import(pathToFileURL(require.resolve("next/dist/bin/next")));
