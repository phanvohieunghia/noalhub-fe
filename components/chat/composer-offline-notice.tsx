/**
 * Gửi tin đi qua socket, nên mất kết nối là KHÔNG gửi được. Phải nói rõ lý do
 * và nói rõ tin không bị mất — nút disable im lặng là thứ tệ nhất ở đây.
 */
export function ComposerOfflineNotice() {
  return (
    <p role="status" className="px-1 pb-1 text-xs opacity-60">
      Mất kết nối — tin nhắn sẽ được gửi khi kết nối lại.
    </p>
  );
}
