# Chữ của story (namespace `sb`)

Chữ demo trong `src/**/*.stories.tsx` — nhãn nút mẫu, tên người mẫu, nội dung
bài viết mẫu. Nó đi qua đúng `NextIntlClientProvider` mà story dùng, nên toolbar
ngôn ngữ đổi luôn cả phần này.

**Không** để trong `packages/i18n/messages/`: chỗ đó dành cho chữ của SẢN PHẨM.
Trộn chữ demo vào đó thì `pnpm check-messages` bắt cả hai locale phải nuôi mãi
những câu không bao giờ xuất hiện trong app, và người đọc namespace `web.*` sẽ
gặp những khoá không thuộc về app.

Đổi lại: hai file dưới đây phải tự giữ đồng bộ khoá với nhau — không có kiểm tra
tự động. `preview.tsx` nạp cả hai.
