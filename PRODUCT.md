# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Độc giả blog (người dùng chính của `apps/web`).** Đến từ tìm kiếm hoặc liên kết, đọc bài của Noah và kho kiến thức công khai; một phần đăng ký để làm bộ câu hỏi, nhắn tin và kết bạn.
- **Người học đã đăng nhập (phụ).** Làm bộ câu hỏi đã publish, xem lịch sử và thống kê, trò chuyện với bạn bè.
- **Quản trị viên (`apps/admin`).** Vài người nội bộ: viết và quản lý bài, quản lý người dùng, vận hành workbench Q&A (nguồn → outline → sinh câu hỏi → duyệt → final set). Chỉ `super_admin` được sinh câu hỏi.

## Product Purpose

Noalhub là một không gian nhỏ gom blog cá nhân, học qua bộ câu hỏi và chat chung một chỗ. Thành công là độc giả ở lại đọc, quay lại, và một phần trong số họ chuyển sang luyện tập và trò chuyện.

## Positioning

Blog cá nhân, ngân hàng câu hỏi do AI sinh rồi người duyệt, và chat để trò chuyện tiếp nằm trong cùng một không gian chậm, tối giản. Khẩu hiệu hiện tại ở trang chủ: "Live slowly. Learn deeply. Keep it simple."

## Operating Context

- Hai Next app độc lập: `apps/web` (khách, có phân đoạn locale `vi`/`en`) và `apps/admin` (sau cổng đăng nhập, không có locale trên URL). Trình duyệt gọi thẳng backend `noalhub-be`.
- Bề mặt công khai: trang chủ, blog (danh sách, danh mục, tag, bài), kho kiến thức, đăng nhập/đăng ký. Bề mặt đăng nhập: dashboard, học, chat, bạn bè, hồ sơ.
- Sáng/tối/hệ thống do token màu trong `packages/config/theme.css`.

## Capabilities and Constraints

- Mọi chữ hiển thị đi qua i18n (`packages/i18n/messages/{vi,en}/`), cả hai locale; ngày qua `useDateFormat()`.
- Màu dùng token, không hex, không `dark:` viết tay (xem `docs/theme.md`).
- Ưu tiên component có sẵn trong `packages/ui`; hai app không import chéo.
- Chưa quyết định: bảng màu mới cho trang chủ (xem Brand Commitments).
- Ngoài phạm vi đợt này: `apps/mobile`, `packages/ui-native`.

## Brand Commitments

- Cho phép đổi bảng màu khi thiết kế lại trang chủ công khai; `theme.css` vẫn là nguồn token, mọi thay đổi màu phải đi qua token.
- Bảng màu hiện tại (teal `#0ABAB5` và thang brand/neutral) và câu khẩu hiệu "Live slowly. Learn deeply. Keep it simple." chưa được xác nhận là ràng buộc; coi là hiện trạng, hỏi lại trước khi đổi nghĩa khẩu hiệu.
- Giọng văn hiện tại: điềm đạm, ít chữ, tiếng Anh và tiếng Việt song song.

## Evidence on Hand

- Bài blog thật và danh mục/tag trong backend; kho kiến thức công khai.
- Chưa có lời chứng thực, số liệu người dùng hay logo khách hàng; không được bịa.

## Product Principles

1. Chậm và rõ: nội dung đọc được lên trước, trang trí lùi lại.
2. Một không gian, ba việc (đọc, học, trò chuyện) chuyển qua lại không đứt mạch.
3. Bề mặt công khai được phép có cá tính; admin và màn học ưu tiên rõ ràng, quét nhanh, nhất quán.
4. Mọi trạng thái (rỗng, lỗi, đang tải) được thiết kế, không để mặc định.

## Accessibility & Inclusion

- Hai ngôn ngữ (vi, en); độ dài chữ khác nhau phải không làm vỡ bố cục.
- Chủ đề sáng và tối phải đạt tương phản đọc được; hỗ trợ điều hướng bàn phím và `prefers-reduced-motion`.
