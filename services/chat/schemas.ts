import { z } from "zod";

/**
 * Hai nhóm schema:
 * - Response/event schema: parse body REST và payload socket, bắt backend đổi
 *   shape ngay tại chỗ thay vì để lỗi trôi vào UI.
 * - Input schema: validate composer trước khi gửi.
 *
 * Nguồn: OpenAPI spec `/docs-json` (REST) và `../noalhub-be/docs/chat.md`
 * (socket — không có trong spec, xem `docs/chat.md` §0).
 */

/* ---- Response schemas (REST) ---- */

export const messageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  // `.nullish()` chứ không `.nullable()`: spec không đánh dấu senderId là
  // required, nên trường này có thể vắng mặt hẳn thay vì bằng null.
  senderId: z.string().nullish().transform((value) => value ?? null),
  type: z.enum(["text", "system"]),
  body: z.string(),
  createdAt: z.string(),
});

export const conversationMemberSchema = z.object({
  userId: z.string(),
  role: z.enum(["member", "owner"]),
  displayName: z.string().nullish().transform((value) => value ?? null),
  avatarUrl: z.string().nullish().transform((value) => value ?? null),
  lastReadMessageId: z.string().nullish().transform((value) => value ?? null),
  // Presence đi kèm response, KHÔNG chỉ qua socket. Bỏ hai trường này thì zod
  // strip mất và dot presence câm cho tới lúc có `presence:changed` đầu tiên.
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
 * Payload socket được validate y như REST. Handler nào parse fail thì BỎ QUA
 * event đó và log — không được để một event lạ làm sập cả kết nối
 * (`docs/chat.md` §5.4).
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

/** Ack của `message:send`. */
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
 * Giới hạn 4000 ký tự lấy từ BE doc — vì gửi tin đi qua socket nên DTO của nó
 * KHÔNG nằm trong OpenAPI, con số này chưa được spec bảo chứng
 * (`docs/chat.md` §0 #5). Backend siết lại thì FE chỉ biết qua ack `ok: false`.
 */
export const MESSAGE_BODY_MAX = 4000;

export const composerSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Nhập nội dung tin nhắn")
    .max(MESSAGE_BODY_MAX, `Tin nhắn tối đa ${MESSAGE_BODY_MAX} ký tự`),
});

export type ComposerInput = z.infer<typeof composerSchema>;
