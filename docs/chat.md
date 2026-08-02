# Chat — Design Document (Frontend)

| | |
|---|---|
| **Status** | **FE chưa implement. BE đã có.** Đã đối chiếu `/docs-json` ngày 2026-07-26: 5 endpoint chat có thật, DTO đầy đủ, Socket.IO gateway đang chạy (handshake `/socket.io/` trả `pingInterval: 25000`). §3 dưới đây là **shape thật lấy từ spec**, không phải đề xuất |
| **Ngày** | 2026-07-26 (đối chiếu spec: 2026-07-26) |
| **Phạm vi (giai đoạn 1)** | DM 1-1, gửi/nhận tin realtime, lịch sử có cursor, unread count, read receipt, typing, presence online/offline |
| **Ngoài phạm vi** | Group (giai đoạn 2 của BE), gửi file/ảnh, reaction, edit/xoá tin, E2EE, push notification — xem §12 |
| **Nguồn sự thật của contract** | **REST: OpenAPI spec `http://localhost:3101/docs` (JSON `/docs-json`)** — spec thắng mọi tài liệu. **Socket: [`../noalhub-be/docs/chat.md`](../../noalhub-be/docs/chat.md)**, vì event Socket.IO không xuất hiện trong OpenAPI |
| **Liên quan** | [`docs/data-layer.md`](./data-layer.md) — bắt buộc tuân thủ · [`docs/auth.md`](./auth.md) — nguồn token |
| **Codebase** | Next.js 16.2.11 · React 19.2.4 · Tailwind v4 · App Router · TypeScript strict |

---

## 0. Khoảng trống trong contract — kiểm ngày 2026-07-26

Kết quả đối chiếu `/docs-json` với những gì UI cần. Năm mục; hai mục đầu chặn đường.

| # | Vấn đề | Ảnh hưởng |
|---|---|---|
| 1 | **FE đang gọi sai path auth.** Spec là `/api/auth/*`, `services/auth/api.ts` gọi `/auth/*`. Đã kiểm bằng curl: `GET /auth/me` → **404**, `GET /api/auth/me` → **401** | 🔴 Auth hiện không chạy với BE thật. Phải sửa trước chat |
| 2 | **Không có endpoint tìm người dùng.** `POST /conversations/direct` cần `{ userId }` (uuid) và trả `404` nếu không tồn tại — nhưng spec **không có** `GET /api/users`. FE không có đường nào biết `userId` | 🔴 Không tạo được DM mới từ UI |
| 3 | **`ConversationDto` không có `lastMessageAt`.** BE sort theo cột đó và `nextCursor` của danh sách hội thoại là `date-time`, nhưng trường đó không lộ ra trong DTO | 🟡 Sidebar không tự re-sort đúng sau `conversation:updated`. Workaround §5.3 |
| 4 | **`MessageDto` không có `deletedAt`.** Bảng `messages` của BE có cột đó (soft delete) nhưng DTO không trả | 🟡 Không render được "tin đã xoá" → `MessageDeleted` dời sang §12 |
| 5 | **Giới hạn `body` không có trong spec.** Vì gửi tin đi qua socket nên DTO của nó không nằm trong OpenAPI. BE doc ghi 4000 ký tự | 🟡 Lấy 4000 theo BE doc, nhưng đây là con số **chưa được spec bảo chứng** |

Mục #2 quyết định `NewDirectConversationDialog` (§8.5) có làm được không. Nếu BE chưa kịp: giai đoạn 1 chỉ hiện các DM **đã tồn tại** — vẫn dùng được, chỉ là không tạo mới từ UI.

Mục #4 là loại sai lệch dễ bỏ qua nhất: schema DB có cột, DTO không trả, và FE viết theo schema DB thì zod sẽ **không** báo gì (field thiếu chỉ thành `undefined`) — UI cứ âm thầm không bao giờ hiện tin đã xoá.

**Không có gì trong contract socket được kiểm chứng bằng máy.** Event, payload, mã lỗi trong ack đều chỉ tồn tại trong `../noalhub-be/docs/chat.md`. Đây là bề mặt rủi ro lớn nhất còn lại của feature: REST lệch thì zod bắt được, socket lệch thì phải chạy thật mới biết.

---

## 1. Bối cảnh và ràng buộc kế thừa

App hiện có auth hoàn chỉnh (`services/auth/*`, `lib/auth/*`) và một `/dashboard` mẫu. Chat là feature có dữ liệu đầu tiên, và là chỗ đầu tiên phát sinh thứ auth chưa có: **một kết nối sống lâu**.

### 1.1 Bốn quyết định của BE chi phối toàn bộ FE

Đọc kỹ bốn cái này trước khi đọc phần còn lại — chúng khác hẳn một thiết kế chat "mặc định".

1. **Gửi tin đi qua socket event, KHÔNG qua REST.** BE cố tình chỉ có **một đường ghi** (`message:send` + ack). REST chỉ để **đọc**. → FE không có `POST /messages`; mutation gửi tin bọc quanh một `socket.emit` có ack, và composer **phụ thuộc vào socket** (§7).
2. **`id` của message do FE sinh, là UUID v7.** Đây là cơ chế idempotency của BE: retry cùng `id` đâm vào PK conflict và BE trả về đúng bản ghi cũ. → **Retry an toàn tuyệt đối**, và không cần `clientId` riêng. Đây là quyết định giúp FE đơn giản đi nhiều nhất.
3. **Socket chỉ chở sự kiện từ lúc connect trở đi** (mục *Backpressure* của BE). Tin bị lỡ lúc mất mạng **không** được bơm lại qua socket. → Sau mỗi lần reconnect, FE **bắt buộc** refetch bằng REST. Bỏ sót bước này là mất tin, im lặng.
4. **Connection sống lâu hơn access token (TTL 15 phút).** BE đặt deadline theo `exp`, quá hạn thì ngắt kèm mã `TOKEN_EXPIRED`. → FE phải **chủ động** emit `auth:refresh` với token mới trước khi hết hạn (§5.4). Không làm thì cứ 15 phút socket rụng một lần.

### 1.2 Ba ràng buộc từ `docs/auth.md`

1. **Access token chỉ nằm trong memory, browser gọi thẳng backend.** → Không SSR được nội dung chat; mọi trang chat là client component. `app/(protected)/*` đã có `AuthGuard`.
2. **Refresh token rotate — trình lại token cũ thu hồi TOÀN BỘ phiên.** → Tầng socket **không được** tự gọi `/api/auth/refresh`. Nó xin token qua một hàm dùng chung và dựa vào single-flight đã có trong `services/client.ts`.
3. **Access token chỉ ở memory nên sau F5 là rỗng.** → `socket.connect()` phải chờ auth `bootstrap()` xong. Connect sớm là handshake với `token: null` → bị disconnect ngay.

### 1.3 Quyết định kiến trúc phía FE

| Quyết định | Lựa chọn | Lý do |
|---|---|---|
| Transport | `socket.io-client`, namespace `/chat` | BE dùng Socket.IO gateway → không có lựa chọn khác (WS thuần không nói chuyện được với nó) |
| Nguồn sự thật của message | **React Query cache**; socket chỉ ghi vào cache | Một nơi giữ state. Không dựng store song song rồi lệch |
| Phân trang | `useInfiniteQuery`, cursor từ `nextCursor` của response | **Hai loại cursor khác nhau** cho hai endpoint — §3.1 (1) |
| Gửi tin | Optimistic + ack; lỗi thì **giữ** tin với `status: "failed"` | Ngoại lệ có ý thức so với `data-layer.md` §6 |
| Typing / presence | zustand store ephemeral, **không** vào React Query | Đổi vài lần/giây, không có nguồn để refetch |
| URL | `/chat` và `/chat/[conversationId]` | Deep-link, back/forward hoạt động |
| Layout | 2 cột persistent qua layout của route group | Đổi hội thoại không unmount sidebar/socket |

---

## 2. Kiến trúc

```
┌───────────────────────────── Browser ─────────────────────────────┐
│  components/chat/*                                                │
│         │ chỉ import hooks.ts                                     │
│         ▼                                                         │
│  services/chat/hooks.ts   (React Query + cầu nối socket→cache)     │
│         │                              ▲                          │
│    ĐỌC  │                        GHI   │ ack + event               │
│         ▼                              │                          │
│  services/chat/api.ts          services/chat/socket.ts            │
│   (REST: 5 endpoint §3.1)       (Socket.IO: §3.2, biên cô lập)     │
│         │                              │                          │
│         │                              └── ensureAccessToken() ──┐ │
│         ▼                                                       │ │
│  services/client.ts  ◀──────────────────────────────────────────┘ │
│    (Bearer, 401→refresh single-flight)                            │
│                                                                   │
│  lib/chat/ephemeral-store.ts  (typing, presence — ngoài cache)     │
└─────────┼──────────────────────────────┼─────────────────────────┘
          │ HTTPS                        │ WSS  /chat
          ▼                              ▼
      REST (đọc)                  Gateway (ghi + sự kiện)
```

**Quy tắc phụ thuộc** (kế thừa `data-layer.md` §1):

- Component **chỉ** import `services/chat/hooks.ts` (+ `types.ts`/`schemas.ts` cho kiểu, `services/errors.ts` khi bắt lỗi). **Không** import `api.ts`, `socket.ts`, `client.ts`.
- `socket.ts` **không** import React, không biết React Query. Nó chỉ expose `emit`/`on`/`connect`/`disconnect`.
- Cầu nối socket → cache nằm trong **đúng một** hook: `useChatSocket()` (§5.3). Gọi ở hai nơi là append tin hai lần.
- `chatKeys` là nguồn sự thật duy nhất cho query key.

**Lưu ý ngược dòng:** tầng ghi đi qua `socket.ts` chứ không qua `api.ts`, nên `services/chat/api.ts` sẽ **không có** hàm `sendMessage`. Đây là điểm feature chat lệch khỏi template trong `data-layer.md` §3 — cố ý, và chỉ ở đúng chỗ này.

---

## 3. Contract

### 3.1 REST — chỉ để đọc

Prefix **`/api`** (khác với cái `services/auth/api.ts` đang dùng — xem §0 #1). Lấy nguyên từ spec, kèm đủ mã lỗi đã khai báo:

| Method | Path | Query / Body | Trả về | Lỗi |
|---|---|---|---|---|
| GET | `/api/chat/conversations` | `?before=<date-time>&limit=1..100` (default **20**) | `200 ConversationPageDto` | 401 · 429 |
| POST | `/api/chat/conversations/direct` | `{ userId: uuid }` | `201 ConversationDto` — **idempotent** | 400 · 401 · **404** · 429 |
| GET | `/api/chat/conversations/{id}` | — | `200 ConversationDto` (kèm `members`) | 401 · **404** · 429 |
| GET | `/api/chat/conversations/{id}/messages` | `?before=<uuid>&limit=1..100` (default **50**) | `200 MessagePageDto` | 401 · **404** · 429 |
| POST | `/api/chat/conversations/{id}/read` | `{ messageId: uuid }` | `204` | 401 · **404** · 429 |

Không có `POST /messages`, `DELETE /messages/{id}`, `/attachments`, hay API tạo group — đúng như giai đoạn 1 của BE.

**Ba chi tiết trong spec dễ đọc sai:**

1. **Hai endpoint dùng hai loại cursor khác nhau.** Danh sách hội thoại: `before` là **date-time** (`lastMessageAt`). Lịch sử tin: `before` là **uuid** (messageId). Viết một `getNextPageParam` dùng chung cho cả hai là sai kiểu ngay. Cả hai đều đọc từ `nextCursor` trong response, đừng tự suy từ `items`.
2. **Không có `403` ở bất kỳ endpoint nào.** Người không phải thành viên nhận **`404`**, không phải `403` — BE cố tình không tiết lộ hội thoại có tồn tại hay không. UI phải xử lý 404 như "không có quyền hoặc không tồn tại", và **không** dựng nhánh 403 riêng (nhánh đó sẽ chết mãi mãi).
3. **`MessagePageDto.items` là "mới nhất trước"** (spec ghi rõ: *"Đảo lại ở phía UI nếu cần hiển thị xuôi"*), và `nextCursor: null` nghĩa là **đã hết lịch sử** — đó là điều kiện dừng của `useInfiniteQuery`, không phải "lỗi".

**Vì sao FE cần cả `POST /{id}/read` khi đã có `message:mark-read` qua socket:** để đánh dấu đã đọc còn hoạt động khi socket offline. Ưu tiên socket (có ack), fallback REST.

### 3.2 Socket.IO — namespace `/chat`

**Client → Server** — mọi event đều có ack:

| Event | Payload | Ack |
|---|---|---|
| `message:send` | `{ id, conversationId, body, type? }` | `{ ok: true, message }` \| `{ ok: false, code }` |
| `message:mark-read` | `{ conversationId, messageId }` | `{ ok: true }` |
| `typing:start` / `typing:stop` | `{ conversationId }` | — |
| `auth:refresh` | `{ token }` | `{ ok: true }` |

**Server → Client:**

| Event | Payload | FE làm gì |
|---|---|---|
| `message:new` | `{ message }` | Append vào cache messages, **dedupe theo `id`** |
| `message:read` | `{ conversationId, userId, messageId }` | Cập nhật read receipt |
| `conversation:updated` | `{ conversationId, lastMessage, unreadCount }` | Patch item trong sidebar list, re-sort |
| `presence:changed` | `{ userId, status, lastSeenAt? }` | Ghi vào store ephemeral |
| `typing` | `{ conversationId, userId, isTyping }` | Store ephemeral, TTL 5s |

**Quy ước đặt tên của BE, phải tôn trọng:** client→server là **mệnh lệnh** (`send`, `mark-read`, `start`), server→client là **sự việc đã xảy ra** (`new`, `read`, `changed`, `updated`). Không tên nào dùng cho cả hai chiều. FE tuyệt đối không được `emit` một event mình đang `on` — Socket.IO cho phép và bug đó chạy được một nửa nên rất khó thấy.

Mã lỗi trong ack dùng **cùng bộ hằng** `SCREAMING_SNAKE_CASE` với lỗi HTTP → tái dùng `ERROR_CODES` ở `services/errors.ts`, không dựng hệ thống lỗi thứ hai.

### 3.3 Kiểu dữ liệu

`services/chat/types.ts`, zod tương ứng ở `schemas.ts`. **Chép đúng từ spec** — không phải suy từ schema DB của BE (hai thứ đó lệch nhau, xem §0 #3 #4):

```ts
type ConversationType = "direct" | "group";
type MessageType = "text" | "system";

/** MessageDto — spec: required = id, conversationId, type, body, createdAt */
type Message = {
  id: string;                    // uuid — v7, FE SINH RA (§4)
  conversationId: string;        // uuid
  senderId: string | null;       // nullable: user bị xoá (ON DELETE SET NULL)
  type: MessageType;
  body: string;
  createdAt: string;             // date-time, server đặt — KHÔNG tin timestamp trong id
  status?: MessageStatus;        // FE thêm, xem dưới
};
// KHÔNG có deletedAt, KHÔNG có updatedAt — §0 #4

/** ConversationMemberDto — PHẲNG, không lồng UserDto */
type ConversationMember = {
  userId: string;                // uuid
  role: "member" | "owner";
  displayName: string | null;
  avatarUrl: string | null;
  lastReadMessageId: string | null;
};
// KHÔNG có email, joinedAt, leftAt

/** ConversationDto — required = id, type, unreadCount, members, createdAt */
type Conversation = {
  id: string;
  type: ConversationType;
  title: string | null;          // null với direct → tên lấy từ thành viên còn lại
  lastMessage: Message | null;
  unreadCount: number;
  members: ConversationMember[];
  createdAt: string;
};
// KHÔNG có lastMessageAt — §0 #3

type ConversationPage = { items: Conversation[]; nextCursor: string | null };  // cursor: date-time
type MessagePage     = { items: Message[];      nextCursor: string | null };  // cursor: uuid

/** CHỈ tồn tại ở client — backend không bao giờ trả về. */
type MessageStatus = "sending" | "sent" | "failed";
```

**Bốn cái bẫy, cả bốn đều là chỗ tôi đã viết sai ở bản trước khi đối chiếu spec:**

- **`ConversationMember` KHÔNG lồng `UserDto`.** Nó phẳng: `userId`, `role`, `displayName`, `avatarUrl`, `lastReadMessageId`. Đừng tái dùng `User` từ `services/auth/types.ts` cho chỗ này — thiếu `email`, thiếu `emailVerified`, và không có `joinedAt`/`leftAt`. Tái dùng sai kiểu ở đây là zod fail ngay request đầu.
- **`Message` không mang tên/avatar người gửi**, chỉ có `senderId`. `MessageBubble` phải **tra `conversation.members` theo `senderId`** để lấy `displayName`/`avatarUrl`. → `ChatPane` phải truyền map `members` xuống, hoặc để bubble đọc từ `useConversation`. Thiết kế nhầm rằng message tự đủ thông tin là phải sửa lại cả `MessageGroup` (nó cần biết avatar để gộp).
- **`senderId` nullable.** Phải chịu được `null` → "Người dùng đã xoá" (`MessageSenderFallback`). Đây là ca duy nhất trong ba ca "nhánh dữ liệu đặc biệt" mà spec **thật sự** có.
- **`type: "system"`** render khác hẳn bubble thường: một dòng chữ nhỏ căn giữa, không avatar, không timestamp. Spec đã có enum này ở GĐ1 dù chưa có event nào sinh ra nó → làm `MessageSystemNotice` từ đầu, rẻ hơn mổ lại `MessageList` sau.

`lastMessage` là `MessageDto` đầy đủ → sidebar preview không cần request thêm. Nhưng vì **không có `lastMessageAt`**, muốn re-sort sidebar tại chỗ thì dùng `lastMessage?.createdAt` làm proxy (§5.3).

---

## 4. UUID v7 — nền tảng của cả feature

FE sinh `id` cho message. Đây không phải chi tiết nhỏ; ba thứ dựa vào nó:

1. **Idempotency.** Mạng rớt giữa chừng, ack không về, FE retry **cùng `id`** → BE trả bản ghi cũ. Không có tin lặp, không cần bảng dedupe.
2. **Dedupe optimistic.** `message:new` của chính mình cũng về qua room `conv:{id}` (FE ở trong room đó). Dedupe theo `id` là xong — không cần `clientId` như thiết kế thông thường.
3. **Cursor phân trang.** v7 có 48 bit timestamp ở đầu nên sắp theo `id` là sắp theo thời gian — đó là lý do `?before=` của lịch sử tin nhận uuid mà vẫn phân trang đúng theo thời gian.

```bash
pnpm add uuid          # v11+ có v7()
```

```ts
import { v7 as uuidv7 } from "uuid";
const id = uuidv7();
```

**Ba quy tắc, vi phạm là sai ngầm:**

- **Sinh `id` một lần, ở lúc submit, và giữ nguyên qua mọi lần retry.** Sinh lại khi retry là phá hỏng toàn bộ idempotency — đúng cái bug mà thiết kế này tồn tại để tránh.
- **Không đọc timestamp từ `id` để hiển thị.** BE nói rõ: timestamp trong id không đáng tin (client kiểm soát nó). Luôn dùng `createdAt` của server.
- **Không suy ra quyền/thứ tự nghiệp vụ gì từ `id`.** Nó chỉ để định danh và phân trang.

Tin `sending` sắp xếp thế nào? `id` v7 do FE sinh **lớn hơn** mọi id đã có (timestamp hiện tại) nên chèn vào đầu list là đúng vị trí ngay, và không nhảy chỗ khi ack về. Đây là lợi ích miễn phí của v7 mà v4 không có.

---

## 5. Tầng dữ liệu

### 5.1 File

```
services/chat/types.ts       ← §3.3
services/chat/schemas.ts     ← zod: response + composer input
services/chat/api.ts         ← 5 hàm REST §3.1 (KHÔNG có sendMessage)
services/chat/socket.ts      ← Socket.IO, KHÔNG import React
services/chat/hooks.ts       ← chatKeys + hooks + useChatSocket
lib/chat/ephemeral-store.ts  ← zustand: typing, presence
lib/chat/outbox.ts           ← tin chờ gửi khi offline (§5.6)
```

Thay đổi cần làm ở file có sẵn:

| File | Sửa gì | Vì sao |
|---|---|---|
| `services/auth/api.ts` | `/auth/*` → `/api/auth/*` | §0 #1 |
| `lib/auth/token-store.ts` | Thêm `subscribe(cb)` | Socket cần biết khi access token đổi để emit `auth:refresh` (§5.4) |
| `services/client.ts` | Export `ensureAccessToken()` | Socket cần token mới nhưng **không được** tự gọi refresh (§1.2) |

Ba sửa đổi này nhỏ nhưng phải làm **trước**, không phải chen vào giữa.

### 5.2 `chatKeys`

```ts
export const chatKeys = {
  all: ["chat"] as const,
  conversations: () => [...chatKeys.all, "conversations"] as const,
  conversation: (id: string) => [...chatKeys.conversations(), id] as const,
  messages: (conversationId: string) =>
    [...chatKeys.all, "messages", conversationId] as const,
};
```

Hooks:

| Hook | Loại | Ghi chú |
|---|---|---|
| `useConversations()` | `useInfiniteQuery` | `getNextPageParam` = `nextCursor` (**date-time**), `limit` default 20 |
| `useConversation(id)` | `useQuery` | `enabled: Boolean(id)` |
| `useMessages(conversationId)` | `useInfiniteQuery` | `getNextPageParam` = `nextCursor` (**uuid**), `limit` default 50. `null` = hết lịch sử |
| `useCreateDirectConversation()` | `useMutation` | REST, idempotent |
| `useSendMessage(conversationId)` | `useMutation` | **mutationFn bọc `socket.emitWithAck`** (§5.5) |
| `useMarkRead(conversationId)` | `useMutation` | Socket, fallback REST |
| `useChatSocket()` | — | Cầu nối, gọi **một lần** (§5.3) |
| `useTyping(conversationId)` | — | Đọc/emit typing, store ephemeral |
| `usePresence(userId)` | — | Đọc store ephemeral |

### 5.3 `useChatSocket()` — cầu nối duy nhất

Gọi một lần trong `ChatRealtimeProvider`, đặt ở `app/(protected)/chat/layout.tsx`.

```ts
// message:new
queryClient.setQueryData(chatKeys.messages(m.conversationId), (old) =>
  upsertById(old, m),          // dedupe theo id — §4 (2)
);

// conversation:updated  → patch + re-sort sidebar, KHÔNG invalidate
queryClient.setQueryData(chatKeys.conversations(), (old) =>
  patchConversation(old, { conversationId, lastMessage, unreadCount }),
);
```

`conversation:updated` mang sẵn `lastMessage` và `unreadCount` → **`setQueryData`, đừng `invalidateQueries`**. Invalidate ở mỗi tin đến biến một cuộc chat sôi nổi thành một tràng request danh sách hội thoại.

**Re-sort sidebar: dùng `lastMessage.createdAt`, không có `lastMessageAt`** (§0 #3). BE sort theo cột `last_message_at` nhưng không lộ nó ra `ConversationDto`, nên FE chỉ có proxy. Ba hệ quả:

- Hội thoại có `lastMessage === null` (vừa tạo, chưa ai nói gì) **không có khoá sort nào** → xếp theo `createdAt`, hoặc ghim lên đầu. Đừng để nó rơi xuống cuối danh sách — người dùng vừa tạo DM mà không thấy nó là bug hiển nhiên.
- Proxy này khớp với thứ tự thật trong **mọi ca bình thường**; chỉ lệch nếu BE cập nhật `last_message_at` mà không đổi `lastMessage`. Chấp nhận được.
- Cursor phân trang **vẫn phải** lấy từ `nextCursor` (date-time) của response, **không** tự dựng từ `lastMessage.createdAt`. Hai giá trị này không đảm bảo bằng nhau.

Đường ra sạch hơn: xin BE thêm `lastMessageAt` vào `ConversationDto`. Một dòng ở BE, xoá toàn bộ mục này.

Hook trả `{ status: "connecting" | "online" | "offline" }` cho `ConnectionBanner`.

**Sau mỗi lần reconnect, bắt buộc:**

```ts
queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
queryClient.invalidateQueries({ queryKey: chatKeys.messages(activeConversationId) });
```

Đây là hệ quả trực tiếp của §1.1 (3): socket không bơm lại tin đã lỡ. Không có hai dòng này thì mất mạng 30 giây = mất tin, và **UI không hề báo gì** — bug tệ nhất của cả feature.

### 5.4 `socket.ts` — biên cô lập

Vai của nó giống `token-store.ts` với `localStorage`: file duy nhất biết về Socket.IO.

```
connect()
  │
  ├─ auth chưa bootstrap xong? → chờ (§1.2 (3))
  ├─ tokenStore.getAccess() rỗng → await ensureAccessToken()
  └─ io(`${WS_URL}/chat`, {
       auth: { token },                  // KHÔNG để token trong query string
       transports: ["websocket"],        // xem ghi chú dưới
       reconnection: true,               // Socket.IO tự backoff — đừng tự viết
     })
```

`/chat` là **namespace của Socket.IO**, không phải đường dẫn HTTP. Handshake thật đi vào `/socket.io/` — đã kiểm: `GET /socket.io/?EIO=4&transport=polling` trả `200` với `pingInterval: 25000`, `pingTimeout: 20000` (khớp đúng con số BE doc dùng để chọn `REFRESH_MS = 20s`). Gọi thẳng `GET /chat/` thì `404` — đừng đi tìm bug ở đó.

Handshake hiện quảng cáo `upgrades: ["websocket"]`, tức **polling đang bật**. Ép `transports: ["websocket"]` ở FE là tránh được yêu cầu sticky session ở load balancer (BE có nêu), đổi lại mất fallback ở vài môi trường mạng chặn WebSocket. Nếu để mặc định thì phải chắc BE đã sticky — đây là quyết định cần chốt với BE, không phải chọn bừa ở FE.

Năm điều dễ sai:

1. **Không tự viết reconnect.** Socket.IO đã có backoff + jitter. Chỉ cấu hình `reconnectionDelayMax`. Tự viết là đánh nhau với thư viện.
2. **Chủ động gia hạn token, đừng chờ bị ngắt.** Auth store có `expiresIn` (900s). Hẹn `auth:refresh` ở mốc **`exp - 60s`**; cộng thêm `tokenStore.subscribe()` để mỗi lần token đổi (do REST refresh) thì emit luôn. Chờ tới lúc BE ngắt vì `TOKEN_EXPIRED` nghĩa là cứ 15 phút người dùng thấy một nhịp "Mất kết nối".
3. **`TOKEN_EXPIRED` thì KHÔNG retry mù.** BE trả mã đó chính là để phân biệt "cần token mới" với "mạng lỗi". Gặp nó: `await ensureAccessToken()` rồi mới connect lại. Reconnect bằng token cũ là vòng lặp vô hạn có mã lỗi.
4. **Không bao giờ tự gọi `/api/auth/refresh` từ socket.** §1.2 (2) — chạy song song với single-flight của REST là mất cả phiên. Luôn qua `ensureAccessToken()`.
5. **Event lạ / sai shape thì bỏ qua event đó, không làm sập socket.** Bọc mỗi handler trong try/catch, zod fail → log + `return`.

Về room: BE tự cho socket join `user:{userId}` và `conv:{...}` **dựa trên membership trong DB**. FE **không** emit lệnh join/subscribe nào — không có event đó trong contract §3.2, và BE nói rõ "không bao giờ tin `conversationId` client gửi lên". Đừng thiết kế `conversation:subscribe`.

### 5.5 Gửi tin — optimistic + ack

```
submit
  │ id = uuidv7()                        ← sinh MỘT lần, §4
  ▼
onMutate: chèn { id, body, status: "sending" } vào đầu cache
          + clear composer NGAY
  ▼
socket.timeout(10_000).emitWithAck("message:send", { id, conversationId, body })
  │
  ├─ { ok: true, message }  → upsertById(message), status "sent"
  ├─ { ok: false, code }    → status "failed" + hiện code (§7)
  └─ timeout / mất socket   → status "failed", vào outbox (§5.6)
```

**Bắt buộc có timeout trên ack.** `emitWithAck` không tự timeout: socket mất giữa lúc chờ thì promise treo mãi, và bubble kẹt ở `sending` vĩnh viễn. `socket.timeout(ms)` là API sẵn của Socket.IO, dùng nó.

**Không rollback khi lỗi.** Đây là chỗ khác optimistic update thông thường: xoá thứ người dùng vừa gõ là làm mất công của họ. Giữ bubble + nút *Gửi lại* thì họ không mất gì. Retry dùng **đúng `id` cũ** → BE dedupe (§4).

Race đã được xử lý sẵn: `message:new` của chính mình có thể về **trước** ack. Cả hai đường đều `upsertById` nên thứ tự nào cũng ra một tin.

### 5.6 Outbox — tin chờ gửi

Vì `id` ổn định và BE idempotent, retry tự động là **an toàn tuyệt đối** — không dựng cái này thì bỏ mất lợi ích lớn nhất của thiết kế BE.

`lib/chat/outbox.ts`: các message `failed`/`sending` chưa có ack. Khi socket `online` trở lại → gửi lại tuần tự theo thứ tự `id`.

Giai đoạn 1 giữ outbox **trong memory** (F5 là mất, `MessageBubble` failed cũng mất). Bền qua reload cần `localStorage` — để §12, và khi làm thì phải giới hạn số tin + TTL, không thì outbox hỏng sẽ đập backend mãi mãi.

### 5.7 Typing và presence — ngoài React Query

`lib/chat/ephemeral-store.ts` (zustand): `typingByConversation`, `presenceByUser`.

- **Typing TTL 5s phía client** (BE chốt: `typing` không persist, được phép rơi, client tự tắt). Mỗi `userId` một timeout, clear khi unmount — không thì "đang nhập…" treo vĩnh viễn.
- **Emit `typing:start` throttle**, và `typing:stop` khi blur hoặc gửi xong. Đừng emit mỗi keystroke.
- **Presence chỉ có cho người chung hội thoại** (BE giới hạn để không rò rỉ + không scale). → `usePresence(userId)` phải chịu được "không có dữ liệu" = hiện `PresenceDot` xám, **không** hiện "offline" chắc chắn.
- `lastSeenAt` chỉ có khi offline → "Hoạt động 3 giờ trước".
- **Offline có thể trễ tới 60 giây** khi một instance BE chết đột ngột (`staleAfter = 60s`). Đường thoát bình thường (đóng tab, mất mạng) vẫn ~1 giây. → **Không** dựng UI phụ thuộc presence chính xác tức thời, và đừng coi đó là bug của FE.

### 5.8 Đánh dấu đã đọc

Emit `message:mark-read` khi **cả ba** đúng: hội thoại đang mở **và** tab visible (`document.visibilityState === "visible"`) **và** đã cuộn tới đáy. Debounce 500ms.

Thiếu điều kiện nào cũng thành "đọc hộ" người dùng: tab nền, hoặc đang đọc lịch sử ở giữa, mà unread tự về 0.

Con trỏ là `last_read_message_id` (không phải counter) → chỉ được **tiến**, không lùi. Cuộn lên đọc tin cũ **không** gửi mark-read với id nhỏ hơn.

---

## 6. Danh sách UI

### 6.1 Route

```
/chat                      → empty state, chưa chọn hội thoại
/chat/[conversationId]     → cửa sổ hội thoại
```

Nằm trong `app/(protected)/chat/` → `AuthGuard` đã bảo vệ, không cần thêm gì. Không có `/chat/new` — tạo DM là dialog (và còn phụ thuộc §0 #2).

### 6.2 Layout desktop (≥ 768px)

```
┌────────────────────────────────────────────────────────────────────┐
│ ⚠ ConnectionBanner — sticky, CHỈ khi socket offline    [Thử lại]   │
├──────────────────────────────────┬─────────────────────────────────┤
│ ChatSidebar (w-80, border-r)     │ ChatPane (flex-1)               │
│ ┌──────────────────────────────┐ │ ┌─────────────────────────────┐ │
│ │ Tin nhắn            [+ Mới]  │ │ │ ◀ ◉ Nguyễn An          [⋯]  │ │
│ │ [🔍 Tìm hội thoại…]          │ │ │   ● Đang hoạt động          │ │
│ ├──────────────────────────────┤ │ ├─────────────────────────────┤ │
│ │ ConversationList (scroll,    │ │ │ MessageList                 │ │
│ │  sort lastMessage.createdAt) │ │ │  role="log" aria-live       │ │
│ │ ┌──────────────────────────┐ │ │ │  cuộn ngược, sentinel ở đỉnh│ │
│ │ │ ◉ Nguyễn An         ● 3  │ │ │ │                             │ │
│ │ │   Ừ mai gặp nhé   14:32  │ │ │ │  ─── Hôm nay ───            │ │
│ │ └──────────────────────────┘ │ │ │                             │ │
│ │ ┌──────────────────────────┐ │ │ │ ◉ ┌───────────────┐         │ │
│ │ │ ◉ Trần Bình              │ │ │ │   │ họ, trái, xám │         │ │
│ │ │   Bạn: đã push    T3     │ │ │ │   └───────────────┘         │ │
│ │ └──────────────────────────┘ │ │ │                             │ │
│ │ …Skeleton / Empty            │ │ │      ┌──────────────┐        │ │
│ └──────────────────────────────┘ │ │      │ mình, phải   │        │ │
│                                  │ │      └── 14:32 ✓✓ ─┘        │ │
│                                  │ │      ┌──────────────┐        │ │
│                                  │ │      │ mờ 60%  🕐   │ sending│ │
│                                  │ │      └──────────────┘        │ │
│                                  │ │           [ ↓ 3 tin mới ]   │ │
│                                  │ │ ◉ An đang nhập…             │ │
│                                  │ ├─────────────────────────────┤ │
│                                  │ │ [ textarea…        ] [ Gửi ]│ │
│                                  │ └─────────────────────────────┘ │
└──────────────────────────────────┴─────────────────────────────────┘
```

Composer giai đoạn 1 **không có nút đính kèm** — BE chưa có `/attachments`. Đừng vẽ nút disabled: nút bấm không được là lời hứa suông.

### 6.3 Layout mobile (< 768px)

Một cột, sidebar và pane là **hai màn hình riêng**:

- `/chat` → chỉ `ChatSidebar`, full width
- `/chat/[id]` → chỉ `ChatPane`, header có nút `◀` về `/chat`

Làm bằng CSS (`hidden md:flex` / `flex md:hidden`) trong layout — **không** `useMediaQuery` + JS, tránh nhảy layout ở render đầu.

### 6.4 Trạng thái từng vùng

| Vùng | Loading | Empty | Error |
|---|---|---|---|
| `ConversationList` | `ConversationListSkeleton` (6 dòng) | "Chưa có cuộc trò chuyện" | Inline + *Thử lại* |
| `MessageList` | `MessageListSkeleton` | "Chưa có tin nhắn nào" | Inline, **giữ composer dùng được** |
| `MessageList` tải trang cũ | Spinner nhỏ ở đỉnh | — | Nút *Tải thêm* thủ công |
| `MessageComposer` | Nút Gửi disable khi đang gửi | — | Bubble `failed` + *Gửi lại*. **Không** disable textarea |
| `ChatPane` | — | — | **404** → "Hội thoại không tồn tại hoặc bạn không có quyền" (§7) |
| Socket offline | `ConnectionBanner` + composer disable **kèm lý do** | — | — |

**`MessageComposer` disable khi socket offline** — đây là điểm khác biệt lớn nhất so với chat gửi qua REST: không có socket thì **không gửi được**. Phải nói rõ lý do ("Mất kết nối — tin sẽ gửi khi kết nối lại"), và tin đã gõ đi vào outbox (§5.6) chứ không bị mất.

### 6.5 Accessibility — bắt buộc

- `MessageList`: `role="log"` `aria-live="polite"` `aria-relevant="additions"`.
- `ConversationList` là `<ul>`; item đang mở có `aria-current="page"`.
- Composer: `Enter` gửi, `Shift+Enter` xuống dòng. Nút Gửi là `<button type="submit">` thật.
- `UnreadBadge` phải có `<span className="sr-only">3 tin chưa đọc</span>`, không chỉ số trần.
- `PresenceDot` có `title` + `sr-only` — màu một mình không truyền đạt thông tin.
- Dialog dùng `<dialog>` native + `showModal()`: có sẵn focus trap, `Esc`, `::backdrop`. Không tự viết focus trap.
- `TypingIndicator` `aria-live="polite"`, không đọc lại khi nội dung không đổi.

---

## 7. Xử lý lỗi

Lỗi HTTP và mã lỗi trong ack socket **dùng chung** bộ `code` (`services/errors.ts`).

| Tình huống | Hành vi |
|---|---|
| Ack `{ ok: false, code }` khi gửi tin | Bubble `failed` + *Gửi lại* (cùng `id`). Hiện message theo `code` |
| Ack timeout 10s | Như trên, thêm vào outbox |
| Socket offline | `ConnectionBanner`, composer disable kèm lý do, tin vào outbox |
| Disconnect `TOKEN_EXPIRED` | `ensureAccessToken()` rồi reconnect. **Không** hiện lỗi cho người dùng — đây là việc nội bộ |
| **404** (không tồn tại **hoặc** không phải thành viên) | Một màn hình duy nhất: "Hội thoại không tồn tại hoặc bạn không có quyền" + link `/chat`. **Không** logout. Spec không có `403` — đừng tách hai nhánh (§3.1 (2)) |
| Rate limit khi gửi tin | Bubble `failed`, **không** auto-retry. Outbox phải tôn trọng: gặp rate limit thì dừng, không đập tiếp |
| 401 bất kỳ | Không xử lý ở feature — `services/client.ts` lo (§1.2) |
| Event socket sai shape | zod fail → log, **bỏ qua event**, socket vẫn sống |

BE **không log nội dung tin nhắn**; FE cũng vậy — log `id`, `conversationId` là đủ. `console.log(body)` trong lúc debug thì phải xoá trước khi commit.

---

## 8. Danh sách component

Tất cả ở `components/chat/*`. Cột "Hook" là hook **duy nhất** component đó được phép chạm. Cột "GĐ" = giai đoạn (1 = làm ngay, 2 = khi BE có group).

### 8.1 Khung

| Component | Client? | GĐ | Trách nhiệm | Hook |
|---|---|---|---|---|
| `ChatRealtimeProvider` | ✅ | 1 | Gọi `useChatSocket()` **một lần**, cấp connection status qua context | `useChatSocket` |
| `ChatLayoutShell` | ✅ | 1 | Grid 2 cột desktop / 1 cột mobile | — |
| `ConnectionBanner` | ✅ | 1 | Sticky khi offline, nút *Thử lại* | context |
| `ChatEmptyState` | ❌ | 1 | Màn hình `/chat` chưa chọn hội thoại | — |

### 8.2 Sidebar

| Component | Client? | GĐ | Trách nhiệm | Hook |
|---|---|---|---|---|
| `ChatSidebar` | ✅ | 1 | Cột trái: header + search + list | — |
| `ChatSidebarHeader` | ✅ | 1 | Tiêu đề + nút *Mới* → mở dialog | — |
| `ConversationSearch` | ✅ | 1 | Lọc **client-side** danh sách đã tải, debounce 200ms | — |
| `ConversationList` | ✅ | 1 | `<ul>`, infinite scroll, giữ thứ tự BE trả về (§5.3), 3 trạng thái | `useConversations` |
| `ConversationListItem` | ✅ | 1 | Avatar, tên, preview tin cuối, thời gian, unread, `aria-current` | `usePresence` |
| `ConversationListSkeleton` | ❌ | 1 | 6 dòng skeleton | — |
| `ConversationListEmpty` | ❌ | 1 | Empty state + CTA | — |
| `UnreadBadge` | ❌ | 1 | Pill số, `99+`, kèm `sr-only` | — |
| `ConversationTitle` | ❌ | 1 | `direct` → tên thành viên còn lại; `group` → `title` | — |

`ConversationTitle` tách riêng vì logic "DM lấy tên từ người còn lại" xuất hiện ở **bốn** chỗ (sidebar item, header, dialog, tab title). Viết một lần.

### 8.3 Cửa sổ hội thoại

| Component | Client? | GĐ | Trách nhiệm | Hook |
|---|---|---|---|---|
| `ChatPane` | ✅ | 1 | Ghép header + list + composer | `useConversation` |
| `ChatHeader` | ✅ | 1 | Back (mobile), avatar, tên, presence, menu | `useConversation`, `usePresence` |
| `ChatHeaderMenu` | ✅ | 2 | Đổi tên group, xem thành viên, rời nhóm | (chờ API GĐ2) |
| `MessageList` | ✅ | 1 | `role="log"`, scroll §9.2, sentinel tải trang cũ, chèn separator | `useMessages` |
| `MessageListSkeleton` | ❌ | 1 | Bubble giả xen trái/phải | — |
| `MessageGroup` | ✅ | 1 | Gộp tin liên tiếp cùng người trong 5 phút (avatar hiện 1 lần) | — |
| `MessageBubble` | ✅ | 1 | Nội dung, trái/phải, timestamp, `status`, *Gửi lại* | `useSendMessage` |
| `MessageBody` | ❌ | 1 | Linkify + `whitespace-pre-wrap`. **Không** render HTML thô | — |
| `MessageSystemNotice` | ❌ | 1 | `type: "system"` — dòng nhỏ căn giữa (§3.3) | — |
| `MessageSenderFallback` | ❌ | 1 | `senderId === null` → "Người dùng đã xoá" (§3.3) | — |
| `DateSeparator` | ❌ | 1 | "Hôm nay" / "Hôm qua" / `dd/MM/yyyy` | — |
| `ReadReceipt` | ❌ | 1 | `✓` / `✓✓` từ `lastReadMessageId` của thành viên | — |
| `TypingIndicator` | ✅ | 1 | "An đang nhập…", TTL 5s, `aria-live` | `useTyping` |
| `ScrollToBottomButton` | ✅ | 1 | Nút nổi + số tin mới | — |
| `PresenceDot` | ❌ | 1 | Xanh/xám, `title` + `sr-only`, chịu được "không rõ" | `usePresence` |

`MessageSystemNotice` và `MessageSenderFallback` làm ở GĐ1 dù chưa có event sinh ra chúng: cả hai là nhánh dữ liệu **spec thật sự có** (`type: 'system'`, `senderId: null`), và thêm sau nghĩa là mổ lại `MessageList`.

`MessageDeleted` **không** làm ở GĐ1: `MessageDto` không trả `deletedAt` (§0 #4) nên không có gì để render theo. Dời sang §12.

`MessageBubble` và `MessageGroup` cần `displayName`/`avatarUrl` của người gửi, mà `Message` chỉ có `senderId` → `ChatPane` dựng một `Map<userId, ConversationMember>` từ `useConversation` rồi truyền xuống. Đừng để mỗi bubble tự `find()` trong mảng `members`.

### 8.4 Composer

| Component | Client? | GĐ | Trách nhiệm | Hook |
|---|---|---|---|---|
| `MessageComposer` | ✅ | 1 | `<form>`, Enter gửi / Shift+Enter xuống dòng, emit typing throttle, disable khi offline kèm lý do | `useSendMessage`, `useTyping` |
| `MessageTextarea` | ✅ | 1 | Auto-grow tới `max-h-40` (§9.3) | — |
| `SendButton` | ❌ | 1 | Disable khi rỗng / đang gửi / socket offline | — |
| `ComposerOfflineNotice` | ❌ | 1 | "Mất kết nối — tin sẽ gửi khi kết nối lại" | — |
| `AttachmentButton` + `AttachmentPreview*` | — | — | **Bỏ** — BE chưa có `/attachments` (§12) | — |

### 8.5 Tạo hội thoại

| Component | Client? | GĐ | Trách nhiệm | Hook |
|---|---|---|---|---|
| `NewDirectConversationDialog` | ✅ | 1* | `<dialog>` native, chọn 1 người → `POST /conversations/direct` | `useCreateDirectConversation` |
| `UserSearchInput` | ✅ | 1* | Tìm người, debounce 300ms | `useUserSearch` |
| `UserSearchResultList` | ✅ | 1* | Kết quả, 3 trạng thái | — |
| `NewGroupDialog` / `MemberListDialog` / `SelectedUserChips` | ✅ | 2 | Group | (chờ API GĐ2) |

**\* Chặn bởi §0 #2** — chưa có `GET /api/users?search=`. Nếu BE không kịp, ẩn nút *Mới* ở GĐ1; sidebar vẫn hiện các DM đã tồn tại. Vì `POST /conversations/direct` idempotent nên dialog **không cần** xử lý "hội thoại đã tồn tại" như lỗi — cứ điều hướng tới `id` trả về.

### 8.6 UI primitive cần thêm vào `components/ui/`

Hiện chỉ có `button`, `input`, `form-error`.

| Component | Vì sao cần |
|---|---|
| `avatar.tsx` | Ảnh + fallback chữ đầu + size. Dùng ở sidebar, header, bubble, dialog |
| `dialog.tsx` | Bọc `<dialog>` native: `showModal`/`close`, đóng khi click backdrop |
| `skeleton.tsx` | Khối `animate-pulse` dùng chung |
| `spinner.tsx` | Đang viết inline rời rạc |
| `textarea.tsx` | Song song `input.tsx`: label, error, `aria-describedby` |
| `dropdown-menu.tsx` | GĐ2 (`ChatHeaderMenu`) — điều hướng bàn phím + `Esc` |

`avatar` và `dialog` chặn đường: sáu component chat phụ thuộc vào chúng.

**Tổng: 34 component chat (GĐ1: 28) + 6 UI primitive.**

---

## 9. Chi tiết dễ sai

### 9.1 Không virtualize từ đầu

`limit=50`/trang, DOM chịu được vài trăm bubble. Chỉ thêm `@tanstack/react-virtual` khi **đo được** jank — virtualization + "giữ scroll khi prepend" + bubble cao động là ba thứ khó cùng lúc.

### 9.2 Scroll — nguồn bug nhiều nhất

| Tình huống | Hành vi đúng |
|---|---|
| Mở hội thoại | Nhảy thẳng xuống đáy, **không** animate |
| Tin mới, đang ở đáy | Cuộn xuống mượt |
| Tin mới, đã cuộn lên đọc lịch sử | **Không** cuộn. Hiện `ScrollToBottomButton` + số tin mới |
| Prepend trang cũ | Lưu `scrollHeight` trước render, sau render `scrollTop += Δ scrollHeight` |
| Mình vừa gửi | Luôn xuống đáy |

"Đang ở đáy" = `scrollHeight - scrollTop - clientHeight < 80px`. Số 0 không dùng được vì sub-pixel rounding.

Tải trang cũ bằng `IntersectionObserver` trên sentinel ở đỉnh, **không** `onScroll`.

Vì API trả `id DESC` (mới → cũ), cách rẻ nhất là render list **`flex-col-reverse`**: "đáy" thành đầu DOM, trang cũ append vào cuối, và trình duyệt tự giữ scroll khi thêm cuối. Đổi lại thứ tự tab/đọc bị đảo → phải kiểm bằng bàn phím thật, không chỉ bằng mắt. Nếu thấy khó thì đảo mảng khi render và tự bù `scrollTop` như bảng trên.

### 9.3 Composer

Auto-grow: set `style.height = "auto"` rồi `= scrollHeight + "px"` trong `onInput` — **không** `useEffect` + `setState`. ESLint v16 có `react-hooks/set-state-in-effect` (đã vấp ở `docs/auth.md` §10.3).

`body`: 1–4000 ký tự trong zod. Con số 4000 lấy từ BE doc và **không có trong OpenAPI** (§0 #5) — vì gửi tin đi qua socket. Nếu BE siết lại thì FE chỉ biết qua ack `{ ok: false }`, nên khi implement hãy xác nhận lại con số này bằng miệng, đừng tin doc. Trim trước khi kiểm rỗng.

### 9.4 Next.js 16

- `params` là **async**: `const { conversationId } = await props.params`. Bản sync đã bị xoá ở v16.
- `PageProps<'/chat/[conversationId]'>` là global type, **không import**.
- Page (server) `await params` rồi truyền prop xuống client component — rõ ràng hơn `useParams()`.
- Không tạo `middleware.ts` (deprecated → `proxy.ts`), và auth vẫn không dùng được nó (§1.2).

---

## 10. Dependencies & env

```bash
pnpm add socket.io-client uuid date-fns
```

| Package | Lý do |
|---|---|
| `socket.io-client` | BE là Socket.IO gateway → **bắt buộc**, WS thuần không nói chuyện được |
| `uuid` (v11+) | `v7()` cho message id (§4). Nhỏ hơn nhiều so với tự viết đúng spec v7 |
| `date-fns` | `DateSeparator` + thời gian tương đối. Tree-shake được, có locale `vi` |

**Không thêm:**

| Không dùng | Lý do |
|---|---|
| Thư viện chat UI dựng sẵn | Kéo theo design system riêng, xung đột Tailwind v4, khoá vào contract của họ |
| `@tanstack/react-virtual` | Chưa cần (§9.1) |
| Store riêng cho message | React Query là nguồn sự thật (§1.3) |
| Thư viện reconnect / backoff | Socket.IO đã có (§5.4) |

**Env** — thêm vào `.env.local` + `.env.example`:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3101
NEXT_PUBLIC_WS_URL=ws://localhost:3101
```

Tách `WS_URL` vì production thường khác host/scheme (`wss://`).

---

## 11. Kế hoạch thực thi

Bám theo thứ tự của BE (`../noalhub-be/docs/chat.md` mục *Thứ tự implement*) để mỗi bước FE có backend tương ứng chạy được — không dựng UI cho endpoint chưa tồn tại.

| # | Bước FE | Cần BE xong bước | Kiểm được |
|---|---|---|---|
| 0 | Sửa path `/api/auth/*` (§0 #1); thêm `subscribe` vào token-store; export `ensureAccessToken`. Song song: xin BE `GET /api/users?search=` (§0 #2) + `lastMessageAt` vào `ConversationDto` (§0 #3) | — | Auth thật sự hoạt động với BE |
| 1 | `components/ui/{avatar,dialog,skeleton,spinner,textarea}.tsx` | — | `pnpm build` pass |
| 2 | `services/chat/{types,schemas}.ts` | 1 | — |
| 3 | `services/chat/api.ts` (5 endpoint đọc) + `chatKeys` + `useConversations`/`useMessages` | 2 | — |
| 4 | `ChatLayoutShell` + `ChatSidebar` + `ConversationList` | 2 | **Thấy hội thoại thật từ BE** — mốc quan trọng nhất |
| 5 | `ChatPane` + `MessageList` + `MessageBubble` + `MessageGroup` + `DateSeparator` (chưa realtime, F5 để thấy tin mới) | 2 | Đọc được lịch sử, phân trang chạy |
| 6 | `socket.ts` + `useChatSocket` + `ConnectionBanner` + `auth:refresh` | 3 | Kết nối sống qua mốc 15 phút |
| 7 | `MessageComposer` + `useSendMessage` (optimistic + ack) + outbox | 4 | **Gửi/nhận realtime hai chiều** |
| 8 | Read receipt + unread badge + `useMarkRead` | 5 | — |
| 9 | `TypingIndicator` + `PresenceDot` + store ephemeral | 6 | — |
| 10 | `NewDirectConversationDialog` + `UserSearchInput` | Cần §0 #2 | Tạo được DM mới |
| 11 | Mobile layout + a11y pass (§6.5) | — | — |
| 12 | Group: `ChatHeaderMenu`, `NewGroupDialog`, `MemberListDialog` | 8 | — |

**Bước 4** là mốc thật đầu tiên — contract đọc sai sẽ lộ ở đây, không phải ở bước 10.
**Bước 6–7** là rủi ro cao nhất: năm cái bẫy §5.4 cộng ack-timeout §5.5 đều nằm trong đó.

Bước 6 làm **trước** bước 7 có lý do: socket phải ổn định (reconnect, refresh token, invalidate sau reconnect) trước khi cắm đường ghi lên nó. Làm ngược lại thì mọi bug gửi tin đều lẫn với bug kết nối.

---

## 12. Ngoài phạm vi giai đoạn 1

| Bỏ qua | Vì sao / ghi chú khi làm sau |
|---|---|
| Gửi file/ảnh | BE chưa có `/attachments` và `message.type` chưa có `'image'`/`'file'`. Schema đã chừa chỗ |
| Group | BE bước 8. FE component đã gắn nhãn GĐ2 ở §8, `Conversation.type` đã có `'group'` |
| Edit / xoá tin | BE không có endpoint, **và `MessageDto` không trả `deletedAt`** (§0 #4). Khi làm: BE thêm field vào DTO trước, rồi FE thêm `MessageDeleted` |
| Reaction, thread reply | Đổi shape `Message` → nếu biết chắc sẽ cần thì chốt sớm với BE |
| Outbox bền qua reload | Cần `localStorage` + giới hạn số tin + TTL (§5.6) |
| Search trong lịch sử | Cần full-text index ở BE. `ConversationSearch` hiện chỉ lọc client-side |
| Push notification, unread ở tab title | |
| E2EE | Đổi kiến trúc từ gốc — không phải thêm vào sau |
| Virtualization | §9.1 |
| `MessageDeleted` / tin đã xoá | Chờ BE thêm `deletedAt` vào `MessageDto` (§0 #4) |
| Test tự động | Repo chưa có test runner. Ba chỗ đáng test nhất khi có: dedupe `upsertById` (§5.3), invalidate-sau-reconnect (§5.3), scroll §9.2 |

**Nếu BE chạy nhiều instance mà chưa có Redis adapter**, triệu chứng ở FE là "tin nhắn chỉ đến khi may mắn". Đó **không phải** bug FE — BE đã ghi rõ trong mục *Ghi chú vận hành*. Trước khi đào ở FE, kiểm số instance của BE trước.
