/**
 * The outbox — messages composed but not yet acknowledged.
 *
 * Because `id` is a client-generated UUID v7 and the backend is idempotent
 * (resubmitting the same `id` hits a PK conflict and returns the existing row),
 * automatic resending is **entirely safe**. Not building an outbox would waste
 * the single biggest benefit of the backend's design.
 *
 * Phase 1 keeps it in MEMORY: F5 loses it. Surviving a reload needs
 * localStorage plus a message cap plus a TTL, or one broken outbox hammers the
 * backend forever (`docs/chat.md` §5.6, §12).
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
   * Pending messages, ordered by `id`. UUID v7 sorts chronologically, so this is
   * exactly the order the user typed them — and the order they are resent in.
   */
  drain(): OutboxEntry[] {
    return [...entries.values()].sort((a, b) => a.id.localeCompare(b.id));
  },

  clear() {
    entries.clear();
  },
};
