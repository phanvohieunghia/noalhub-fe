/**
 * Structured data cho Google. Render ở **server component**, nằm trong HTML đầu
 * tiên — `<meta>` không thay được nó, và đây mới là thứ Google dùng để hiện rich
 * result (`docs/blog-plan.md` §6.2).
 *
 * ⚠️ `JSON.stringify` KHÔNG khử được chuỗi tấn công XSS: một tiêu đề bài chứa
 * `</script>` sẽ đóng thẻ sớm và mọi thứ sau đó thành HTML thật. Thay `<` bằng
 * `<` — trong JSON thì hai dạng tương đương, còn trình phân tích HTML thì
 * không còn thấy thẻ nào. Đây là khuyến nghị của chính docs Next.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
