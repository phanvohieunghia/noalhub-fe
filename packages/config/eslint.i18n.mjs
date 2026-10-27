/**
 * ESLint rule: a literal key passed to a next-intl translator must exist in the
 * `vi` messages (`docs/i18n.md` §9).
 *
 * `tsc` already rejects a bad key through `AppMessages`; this rule is the same
 * check surfaced at lint time — in the editor squiggle and in `pnpm lint` —
 * for people who do not have the TS diagnostics in front of them. It also
 * covers `t.rich` / `t.markup` / `t.raw` / `t.has`.
 *
 * It reads `packages/i18n/messages/vi/*.json` straight off disk (the file
 * `web.auth.json` lives at `web.auth` in the tree, mirroring `loadAllMessages`).
 * Keys it cannot resolve statically (template literals with `${}`, variables)
 * are skipped — only the literal ones can be checked.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MESSAGES_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../i18n/messages/vi",
);

const TRANSLATOR_FACTORIES = new Set(["useTranslations", "getTranslations"]);
const TRANSLATOR_METHODS = new Set(["rich", "markup", "raw", "has"]);

let cachedTree;

function loadTree() {
  if (cachedTree) return cachedTree;
  const tree = {};
  for (const file of readdirSync(MESSAGES_DIR)) {
    if (!file.endsWith(".json")) continue;
    const parts = file.slice(0, -".json".length).split(".");
    let node = tree;
    for (const part of parts.slice(0, -1)) node = node[part] ??= {};
    node[parts.at(-1)] = JSON.parse(readFileSync(join(MESSAGES_DIR, file), "utf8"));
  }
  return (cachedTree = tree);
}

function resolve(path) {
  let node = loadTree();
  for (const part of path.split(".")) {
    if (typeof node !== "object" || node === null || !(part in node)) {
      return undefined;
    }
    node = node[part];
  }
  return node;
}

/** The static string of a literal / expression-free template, else `null`. */
function staticString(node) {
  if (!node) return null;
  if (node.type === "Literal" && typeof node.value === "string") return node.value;
  if (node.type === "TemplateLiteral" && node.expressions.length === 0) {
    return node.quasis[0].value.cooked;
  }
  return null;
}

/** `useTranslations("ns")`, `await getTranslations("ns" | { namespace })`. */
function namespaceOf(init) {
  const call = init?.type === "AwaitExpression" ? init.argument : init;
  if (call?.type !== "CallExpression" || call.callee.type !== "Identifier") {
    return undefined;
  }
  if (!TRANSLATOR_FACTORIES.has(call.callee.name)) return undefined;

  const arg = call.arguments[0];
  if (!arg) return "";
  const direct = staticString(arg);
  if (direct !== null) return direct;
  if (arg.type === "ObjectExpression") {
    const prop = arg.properties.find(
      (p) => p.type === "Property" && p.key.name === "namespace",
    );
    if (!prop) return "";
    const value = staticString(prop.value);
    return value; // null when dynamic → skip
  }
  return null; // dynamic namespace → skip
}

const rule = {
  meta: {
    type: "problem",
    schema: [],
    messages: {
      missing:
        'Translation key "{{key}}" does not exist in the vi messages ("{{full}}").',
      notLeaf:
        'Translation key "{{key}}" points at a group, not a string ("{{full}}").',
    },
  },
  create(context) {
    const { sourceCode } = context;
    /** Variable → namespace, for every `const t = useTranslations(...)`. */
    const translators = new Map();

    function findVariable(node, name) {
      for (let scope = sourceCode.getScope(node); scope; scope = scope.upper) {
        const variable = scope.set.get(name);
        if (variable) return variable;
      }
      return undefined;
    }

    return {
      VariableDeclarator(node) {
        if (node.id.type !== "Identifier") return;
        const namespace = namespaceOf(node.init);
        if (namespace === undefined || namespace === null) return;
        const [variable] = sourceCode.getDeclaredVariables(node);
        if (variable) translators.set(variable, namespace);
      },

      CallExpression(node) {
        const { callee } = node;
        let name;
        if (callee.type === "Identifier") {
          name = callee.name;
        } else if (
          callee.type === "MemberExpression" &&
          !callee.computed &&
          callee.object.type === "Identifier" &&
          TRANSLATOR_METHODS.has(callee.property.name)
        ) {
          name = callee.object.name;
        } else {
          return;
        }

        const variable = findVariable(node, name);
        if (!variable || !translators.has(variable)) return;

        const key = staticString(node.arguments[0]);
        if (key === null) return;

        const namespace = translators.get(variable);
        const full = namespace ? `${namespace}.${key}` : key;
        const value = resolve(full);

        if (value === undefined) {
          context.report({
            node: node.arguments[0],
            messageId: "missing",
            data: { key, full },
          });
        } else if (typeof value === "object" && !callee.property?.name) {
          context.report({
            node: node.arguments[0],
            messageId: "notLeaf",
            data: { key, full },
          });
        }
      },
    };
  },
};

export const i18nPlugin = { rules: { "valid-message-key": rule } };

/** Flat-config entry: spread into an app's `defineConfig([...])`. */
export const i18nConfig = {
  plugins: { "noalhub-i18n": i18nPlugin },
  rules: { "noalhub-i18n/valid-message-key": "error" },
};
