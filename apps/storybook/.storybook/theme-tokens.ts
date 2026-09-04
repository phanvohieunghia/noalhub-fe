import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * The token names as declared in `packages/config/theme.css`.
 *
 * `Colors.stories.tsx` must not keep its own copy of this list: a documentation
 * page that lists the palette by hand goes stale on the first token added, and
 * a swatch grid that quietly omits a color is worse than no page at all. The
 * VALUES are still read from the live document at render time (that is what
 * makes light/dark work) — only the names come from here.
 */
export type ThemeTokens = {
  /** Semantic tokens, in declaration order, as declared in `:root`. */
  semantic: string[];
  /** The raw scales (`brand`, `neutral`, …), keyed by family name. */
  scales: Record<string, string[]>;
};

/**
 * Comments have to go FIRST. `theme.css` opens with a long block comment that
 * explains the layers and, in doing so, writes out `:root` and `@theme inline`
 * — both of which this parser searches for. Left in, every search lands in the
 * prose and the parse comes back empty.
 */
const COMMENT = /\/\*[\s\S]*?\*\//g;

/** `--name: value;` — values may contain anything but a semicolon or a brace. */
const DECLARATION = /(--[\w-]+)\s*:\s*([^;{}]+);/g;

/**
 * Pulls one top-level block out of the stylesheet by its selector.
 *
 * A brace counter rather than a regex: the file is nested (`@theme` blocks sit
 * next to `:root`), and a lazy `{[^}]*}` stops at the first inner brace.
 */
function block(css: string, selector: string): string {
  const start = css.indexOf(selector);
  if (start === -1) return "";

  const open = css.indexOf("{", start + selector.length);
  if (open === -1) return "";

  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    if (css[i] === "}") {
      depth -= 1;
      if (depth === 0) return css.slice(open + 1, i);
    }
  }
  return "";
}

function declaredNames(source: string): string[] {
  return [...source.matchAll(DECLARATION)].map(([, name]) => name);
}

export function parseThemeTokens(css: string): ThemeTokens {
  /*
   * `@theme inline` is skipped on purpose: it only re-exports the semantic
   * tokens under `--color-*` names so Tailwind generates utilities, so counting
   * it would show every semantic token twice. `.dark` is skipped for the same
   * reason — it redeclares exactly the names `:root` already has.
   */
  const source = css.replace(COMMENT, "");
  const themeSource = source.split("@theme inline")[0] ?? source;
  const rootBlock = block(themeSource, ":root");

  const scales: Record<string, string[]> = {};
  for (const name of declaredNames(themeSource)) {
    // `@theme` also holds `--text-*`, which belongs to the type scale page.
    const match = /^--color-([a-z]+)-\d+$/.exec(name);
    if (!match) continue;
    (scales[match[1]] ??= []).push(name);
  }

  return { semantic: declaredNames(rootBlock), scales };
}

/**
 * Reads and parses the stylesheet from disk — build time, Node only.
 *
 * `configDir` is handed over by Storybook rather than derived from
 * `__dirname`/`import.meta.url`, which differ depending on how this config gets
 * transpiled.
 */
export function readThemeTokens(configDir: string): ThemeTokens {
  const path = resolve(configDir, "../../../packages/config/theme.css");
  return parseThemeTokens(readFileSync(path, "utf8"));
}
