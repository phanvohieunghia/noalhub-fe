import { DEFAULT_LOCALE, type Locale } from "./config";
import { NAMESPACES, type Namespace } from "./namespaces";

export type MessageTree = { [key: string]: string | MessageTree };

/**
 * Nạp một file message.
 *
 * Import động với template literal: cả webpack lẫn turbopack đều đọc được mẫu
 * này và sinh một chunk cho **mỗi** file trong `messages/`. Nối chuỗi đường dẫn
 * từ biến ngoài (`import(path)`) thì bundler bó tay và gói cả thư mục vào một
 * chunk.
 */
async function loadNamespace(
  locale: Locale,
  namespace: Namespace,
): Promise<MessageTree> {
  const mod = (await import(`../messages/${locale}/${namespace}.json`)) as {
    default: MessageTree;
  };
  return mod.default;
}

/**
 * Toàn bộ message của một locale, dùng cho `getRequestConfig`.
 *
 * **Vì sao nạp hết ở server mà không lọc theo route:** `getRequestConfig` chỉ
 * nhận locale, không nhận pathname, nên ở tầng đó không có cách nào biết route
 * hiện tại (proxy có pathname nhưng không đưa được header vào request mà
 * `headers()` đọc được, trừ khi dùng API nội bộ của Next).
 *
 * Đổi lại không mất gì: đây là chuỗi ở **server**, không đi vào bundle của
 * trình duyệt. Phần thực sự tốn — payload gửi cho client — vẫn được cắt theo
 * route, bằng `pickMessages` ở mỗi layout (§5).
 */
export async function loadAllMessages(locale: Locale): Promise<MessageTree> {
  const tree: MessageTree = {};

  for (const namespace of NAMESPACES) {
    const messages = await loadNamespace(locale, namespace);
    const merged =
      locale === DEFAULT_LOCALE
        ? messages
        : deepMerge(await loadNamespace(DEFAULT_LOCALE, namespace), messages);
    assign(tree, namespace, merged);
  }

  return tree;
}

/**
 * Cắt ra đúng những namespace mà một nhóm route cần, để truyền cho
 * `NextIntlClientProvider`. Đây là chỗ việc chia namespace có tác dụng thật:
 * trang blog không phải tải hai chục chuỗi của chat.
 */
export function pickMessages(
  messages: MessageTree,
  namespaces: readonly Namespace[],
): MessageTree {
  const out: MessageTree = {};
  for (const namespace of namespaces) {
    const value = read(messages, namespace);
    if (value) assign(out, namespace, value);
  }
  return out;
}

/**
 * Đặt `value` vào cây theo đường dẫn có dấu chấm: `web.auth` → `{ web: { auth } }`.
 * `next-intl` hiểu dấu chấm là đường dẫn khoá, nên đây là cách để
 * `useTranslations("web.auth")` tìm thấy file `web.auth.json`.
 */
function assign(tree: MessageTree, path: string, value: MessageTree): void {
  const parts = path.split(".");
  let node = tree;
  for (const part of parts.slice(0, -1)) {
    const next = node[part];
    node = typeof next === "object" && next !== null ? next : (node[part] = {});
  }
  node[parts[parts.length - 1]!] = value;
}

function read(tree: MessageTree, path: string): MessageTree | null {
  let node: string | MessageTree | undefined = tree;
  for (const part of path.split(".")) {
    if (typeof node !== "object" || node === null) return null;
    node = node[part];
  }
  return typeof node === "object" && node !== null ? node : null;
}

/**
 * `vi` làm nền cho mọi locale khác.
 *
 * Đây là lưới an toàn cho production, không phải giấy phép để thiếu chuỗi:
 * `pnpm --filter @noalhub/i18n check-messages` chạy ở CI và fail nếu cây khoá
 * của `en` lệch với `vi` (§9). Có nó thì một khoá bị quên hiện ra tiếng Việt,
 * chứ không phải hiện tên khoá cho người dùng đọc.
 */
function deepMerge(base: MessageTree, override: MessageTree): MessageTree {
  const out: MessageTree = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = out[key];
    out[key] =
      typeof value === "object" && typeof current === "object" && current !== null
        ? deepMerge(current, value)
        : value;
  }
  return out;
}
