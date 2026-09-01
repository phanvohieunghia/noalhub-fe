#!/usr/bin/env node
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * So cây khoá của mọi locale với `vi` (`docs/i18n-plan.md` §9).
 *
 * Vì sao phải chạy ở CI chứ không chỉ tin vào code review: `loadAllMessages`
 * cố ý fallback về `vi` khi thiếu khoá, nên một chuỗi bị quên **không** gây lỗi
 * lúc chạy — nó chỉ hiện ra tiếng Việt giữa giao diện tiếng Anh, và người duy
 * nhất phát hiện sẽ là người dùng.
 *
 * Kiểm cả hai chiều: thiếu khoá là chuỗi chưa dịch, thừa khoá là chuỗi đã bị xoá
 * ở `vi` mà bản dịch còn sót — rác, và là dấu hiệu hai bên đang lệch nhau.
 *
 * Kiểm luôn tham số ICU: `{count}` ở `vi` mà bản `en` viết `{total}` thì chuỗi
 * đó ném lỗi format **lúc chạy**, không phải hiện sai chữ.
 */

const MESSAGES_DIR = join(fileURLToPath(new URL("../messages", import.meta.url)));
const BASE_LOCALE = "vi";

/** `{ "a.b.c": ["count"] }` — đường dẫn khoá → tên tham số trong chuỗi. */
function flatten(tree, prefix = "", out = {}) {
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      out[path] = placeholders(value);
    } else if (value && typeof value === "object") {
      flatten(value, path, out);
    } else {
      throw new Error(`Giá trị không hợp lệ ở khoá "${path}"`);
    }
  }
  return out;
}

/**
 * Tên tham số trong một chuỗi ICU: `{name}`, `{count, plural, ...}`, và tag
 * `<tag>`. Bỏ qua phần thân của plural/select — chỉ cần đúng bộ TÊN.
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
      problems.push(`${locale}: thiếu khoá "${key}"`);
      continue;
    }
    const expected = base[key].join(", ");
    const actual = target[key].join(", ");
    if (expected !== actual) {
      problems.push(`${locale}: khoá "${key}" có tham số [${actual}], ${BASE_LOCALE} là [${expected}]`);
    }
  }

  for (const key of Object.keys(target)) {
    if (!(key in base)) problems.push(`${locale}: thừa khoá "${key}" (không có ở ${BASE_LOCALE})`);
  }
}

if (problems.length > 0) {
  console.error(`check-messages: ${problems.length} vấn đề\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(`check-messages: ${Object.keys(base).length} khoá, ${locales.length} locale — khớp.`);
