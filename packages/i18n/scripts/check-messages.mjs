#!/usr/bin/env node
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Compare every locale's key tree against `vi` (`docs/i18n.md` §9).
 *
 * Why this runs in CI instead of relying on code review: `loadAllMessages`
 * deliberately falls back to `vi` for a missing key, so a forgotten string does
 * **not** throw at runtime — it just shows up as Vietnamese inside the English
 * UI, and the only person who notices is the user.
 *
 * Checked in both directions: a missing key is an untranslated string, an extra
 * key is a string deleted from `vi` whose translation was left behind — dead
 * weight, and a sign the two sides have drifted.
 *
 * ICU parameters are checked too: `{count}` in `vi` against `{total}` in `en`
 * makes that string throw a formatting error **at runtime**, not merely render
 * the wrong words.
 */

const MESSAGES_DIR = join(fileURLToPath(new URL("../messages", import.meta.url)));
const BASE_LOCALE = "vi";

/** `{ "a.b.c": ["count"] }` — key path → parameter names used in the string. */
function flatten(tree, prefix = "", out = {}) {
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      out[path] = placeholders(value);
    } else if (value && typeof value === "object") {
      flatten(value, path, out);
    } else {
      throw new Error(`Invalid value at key "${path}"`);
    }
  }
  return out;
}

/**
 * Parameter names in an ICU string: `{name}`, `{count, plural, ...}` and
 * `<tag>`. Plural/select bodies are ignored — only the set of NAMES matters.
 */
function placeholders(message) {
  const names = new Set();
  for (const match of message.matchAll(/\{\s*([a-zA-Z0-9_]+)/g)) names.add(match[1]);
  for (const match of message.matchAll(/<\s*([a-zA-Z0-9_]+)\s*>/g)) names.add(match[1]);
  return [...names].sort();
}

function readLocale(locale) {
  const dir = join(MESSAGES_DIR, locale);
  const merged = {};
  for (const file of readdirSync(dir).filter((name) => name.endsWith(".json")).sort()) {
    const namespace = file.replace(/\.json$/, "");
    merged[namespace] = JSON.parse(readFileSync(join(dir, file), "utf8"));
  }
  return flatten(merged);
}

const locales = readdirSync(MESSAGES_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const base = readLocale(BASE_LOCALE);
const problems = [];

for (const locale of locales.filter((name) => name !== BASE_LOCALE)) {
  const target = readLocale(locale);

  for (const key of Object.keys(base)) {
    if (!(key in target)) {
      problems.push(`${locale}: missing key "${key}"`);
      continue;
    }
    const expected = base[key].join(", ");
    const actual = target[key].join(", ");
    if (expected !== actual) {
      problems.push(`${locale}: key "${key}" has params [${actual}], ${BASE_LOCALE} has [${expected}]`);
    }
  }

  for (const key of Object.keys(target)) {
    if (!(key in base)) problems.push(`${locale}: extra key "${key}" (absent from ${BASE_LOCALE})`);
  }
}

if (problems.length > 0) {
  console.error(`check-messages: ${problems.length} problem(s)\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(`check-messages: ${Object.keys(base).length} keys, ${locales.length} locales — in sync.`);
