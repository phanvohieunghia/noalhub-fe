/**
 * Mọi path trong OpenAPI spec đều nằm dưới tiền tố `/api` (`/api/auth/login`,
 * `/api/chat/conversations`) — spec không khai báo `servers` nên tiền tố đó
 * được gộp vào baseURL MỘT lần ở đây, và tầng api viết path KHÔNG có `/api`
 * (`/auth/login`, `/chat/conversations`).
 *
 * Env chỉ chứa origin, không chứa `/api`: đổi host ở production thì không phải
 * nhớ kèm hậu tố.
 */
const RAW_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3101";

/**
 * Chuẩn hoá về ORIGIN thuần: cắt dấu `/` cuối và cắt cả hậu tố `/api` nếu env
 * đã kèm sẵn. Nhờ vậy `http://localhost:3101` và `http://localhost:3101/api`
 * đều cho ra một kết quả — env viết kiểu nào cũng không thành `/api/api`.
 */
const API_ORIGIN = RAW_API_BASE_URL.replace(/\/+$/, "").replace(/\/api$/, "");

export const API_BASE_URL = `${API_ORIGIN}/api`;

/**
 * Socket.IO nối vào ORIGIN, không phải vào `/api`: handshake của nó đi qua
 * `/socket.io/`, còn `/chat` trong `io(url)` là NAMESPACE chứ không phải đường
 * dẫn HTTP (gọi thẳng `GET /chat/` sẽ nhận 404 — đừng đi tìm bug ở đó).
 *
 * Tách biến riêng vì production thường khác host/scheme (`wss://`).
 */
export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? API_ORIGIN.replace(/^http/, "ws");

/** Namespace Socket.IO của tầng chat. */
export const CHAT_NAMESPACE = "/chat";
