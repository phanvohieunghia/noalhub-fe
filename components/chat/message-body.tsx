/** Bắt URL http/https đơn giản — đủ cho nội dung chat, không phải parser markdown. */
const URL_SPLIT = /(https?:\/\/[^\s<]+)/g;

/**
 * Bản KHÔNG có cờ `g` để kiểm từng mảnh. Dùng lại regex có `g` cho `.test()` là
 * bug ngầm: `lastIndex` được giữ giữa các lần gọi nên kết quả nhảy đúng/sai
 * xen kẽ.
 */
const IS_URL = /^https?:\/\//;

/**
 * Nội dung tin nhắn.
 *
 * KHÔNG render HTML thô (`dangerouslySetInnerHTML`) — `body` là dữ liệu người
 * dùng. Linkify bằng cách chẻ chuỗi rồi render `<a>` như React element, nên
 * không có đường nào để chèn thẻ.
 */
export function MessageBody({ body }: { body: string }) {
  const parts = body.split(URL_SPLIT);

  return (
    <span className="break-words whitespace-pre-wrap">
      {parts.map((part, index) =>
        IS_URL.test(part) ? (
          <a
            key={index}
            href={part}
            target="_blank"
            // `noreferrer` cùng với `noopener`: link do người khác gửi, không
            // để trang đích biết nguồn và không cho nó chạm `window.opener`.
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            {part}
          </a>
        ) : (
          part
        ),
      )}
    </span>
  );
}
