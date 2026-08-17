/**
 * Outbox — tin đã soạn nhưng chưa có ack.
 *
 * Vì `id` là UUID v7 do client sinh và backend idempotent (trình lại cùng `id`
 * đâm vào PK conflict và nhận lại bản ghi cũ), gửi lại tự động là **an toàn
 * tuyệt đối**. Không dựng outbox nghĩa là bỏ mất lợi ích lớn nhất của thiết kế
 * backend.
 *
 * Giai đoạn 1 giữ trong MEMORY: F5 là mất. Bền qua reload cần localStorage +
 * giới hạn số tin + TTL, nếu không một outbox hỏng sẽ đập backend mãi mãi
 * (`docs/chat.md` §5.6, §12).
 */

export type OutboxEntry = {
  id: string;
  conversationId: string;
  body: string;
};

const entries = new Map<string, OutboxEntry>();

export const outbox = {
  add(entry: OutboxEntry) {
    entries.set(entry.id, entry);
  },

  remove(id: string) {
    entries.delete(id);
  },

  has(id: string) {
    return entries.has(id);
  },

  /**
   * Tin chờ gửi, sắp theo `id`. UUID v7 sắp theo thời gian nên đây đúng là thứ
   * tự người dùng đã gõ — gửi lại đúng thứ tự đó.
   */
  drain(): OutboxEntry[] {
    return [...entries.values()].sort((a, b) => a.id.localeCompare(b.id));
  },

  clear() {
    entries.clear();
  },
};
