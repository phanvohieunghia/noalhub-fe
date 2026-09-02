import { z } from "zod";

/**
 * Two groups of schemas:
 * - Response/event schemas: parse REST bodies and socket payloads, catching a
 *   backend shape change on the spot instead of letting it drift into the UI.
 * - Input schemas: validate the composer before sending.
 *
 * Sources: the OpenAPI spec `/docs-json` (REST) and
 * `../noalhub-be/docs/chat.md` (sockets — absent from the spec, see
 * `docs/chat.md` §0).
 */

/* ---- Response schemas (REST) ---- */

export const messageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  // `.nullish()` rather than `.nullable()`: the spec does not mark senderId as
  // required, so the field may be absent entirely instead of null.
  senderId: z.string().nullish().transform((value) => value ?? null),
  type: z.enum(["text", "system"]),
  body: z.string(),
  createdAt: z.string(),
});

export const conversationMemberSchema = z.object({
  userId: z.string(),
  role: z.enum(["member", "owner"]),
  username: z.string(),
  displayName: z.string().nullish().transform((value) => value ?? null),
  avatarUrl: z.string().nullish().transform((value) => value ?? null),
  lastReadMessageId: z.string().nullish().transform((value) => value ?? null),
  // Presence rides along with the response, not only over the socket. Omit
  // these two and zod strips them, leaving the presence dot mute until the
  // first `presence:changed` arrives.
  status: z.enum(["online", "offline"]).nullish().transform((value) => value ?? null),
  lastSeenAt: z.string().nullish().transform((value) => value ?? null),
});

export const conversationSchema = z.object({
  id: z.string(),
  type: z.enum(["direct", "group"]),
  title: z.string().nullish().transform((value) => value ?? null),
  lastMessage: messageSchema.nullish().transform((value) => value ?? null),
  unreadCount: z.number(),
  members: z.array(conversationMemberSchema),
  createdAt: z.string(),
});

export const conversationPageSchema = z.object({
  items: z.array(conversationSchema),
  nextCursor: z.string().nullish().transform((value) => value ?? null),
});

export const messagePageSchema = z.object({
  items: z.array(messageSchema),
  nextCursor: z.string().nullish().transform((value) => value ?? null),
});

/* ---- Event payload schemas (socket) ---- */

/**
 * Socket payloads are validated exactly like REST. A handler whose parse fails
 * SKIPS that event and logs — one strange event must never bring down the whole
 * connection (`docs/chat.md` §5.4).
 */
export const messageNewEventSchema = z.object({ message: messageSchema });

export const messageReadEventSchema = z.object({
  conversationId: z.string(),
  userId: z.string(),
  messageId: z.string(),
});

export const conversationUpdatedEventSchema = z.object({
  conversationId: z.string(),
  lastMessage: messageSchema.nullish().transform((value) => value ?? null),
  unreadCount: z.number().nullish().transform((value) => value ?? null),
});

export const presenceChangedEventSchema = z.object({
  userId: z.string(),
  status: z.enum(["online", "offline"]),
  lastSeenAt: z.string().nullish().transform((value) => value ?? null),
});

export const typingEventSchema = z.object({
  conversationId: z.string(),
  userId: z.string(),
  isTyping: z.boolean(),
});

/** The ack for `message:send`. */
export const sendMessageAckSchema = z.union([
  z.object({ ok: z.literal(true), message: messageSchema }),
  z.object({
    ok: z.literal(false),
    code: z.string().nullish().transform((value) => value ?? "UNKNOWN"),
    message: z.string().nullish(),
  }),
]);

/* ---- Input schema ---- */

/**
 * The 4000-character limit comes from the backend docs — since sending goes
 * over the socket, its DTO is NOT in the OpenAPI spec and this number has no
 * spec backing (`docs/chat.md` §0 #5). If the backend tightens it, the frontend
 * only finds out through an `ok: false` ack.
 */
export const MESSAGE_BODY_MAX = 4000;

export const composerSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "validation.message.required")
    .max(MESSAGE_BODY_MAX, `Tin nhắn tối đa ${MESSAGE_BODY_MAX} ký tự`),
});

export type ComposerInput = z.infer<typeof composerSchema>;
