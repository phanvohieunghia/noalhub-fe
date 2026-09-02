# Còn lại sau đợt dịch comment sang tiếng Anh

Đợt này đã dịch comment của **toàn bộ** `packages/*` và `apps/*` sang tiếng Anh
(`AGENTS.md` cũng đã viết lại bằng tiếng Anh; `docs/` giữ nguyên tiếng Việt theo
quy ước mới ở mục `# Language` của `AGENTS.md`). `pnpm typecheck` xanh.

Dưới đây là những chỗ **chưa đụng tới**, chia làm ba nhóm.

---

## 1. Chưa dịch — cần làm nốt

| File | Số dòng còn tiếng Việt | Ghi chú |
| --- | --- | --- |
| `.github/workflows/publish.yml` | 93 | Comment CI/CD (build args, deploy qua ssh, nginx reload, health check) **và** vài chuỗi `echo` báo lỗi trong script deploy. Đang dịch dở thì dừng. |
| `apps/web/mocks/auth-server.mjs` | 6 | Comment đã dịch xong; 6 dòng còn lại là **message JSON giả lập backend** (`"Email hoặc mật khẩu không đúng"`…). Chúng mô phỏng phản hồi thật của backend tiếng Việt — dịch hay không là quyết định riêng. |

---

## 2. Chuỗi tiếng Việt **hardcode trong JSX** — vi phạm quy tắc i18n

Không thuộc phạm vi "dịch comment", nhưng phát hiện trong lúc rà và nên sửa:
phải chuyển thành khoá i18n trong `packages/i18n/messages/{vi,en}/`.

| File:dòng | Chuỗi |
| --- | --- |
| `apps/web/components/chat/send-button.tsx:15` | `Gửi` |
| `apps/admin/components/posts/tiptap-editor.tsx:188` | `Đang tải ảnh lên…` |

## 3. Chuỗi tiếng Việt trong tầng dữ liệu — nên trả **khoá** thay vì câu

`docs/i18n.md` §7.3 nói message của zod và của tầng api phải là khoá i18n; ba chỗ
này còn là câu tiếng Việt viết thẳng:

| File:dòng | Chuỗi |
| --- | --- |
| `packages/api/src/chat/schemas.ts:119` | `Tin nhắn tối đa ${MESSAGE_BODY_MAX} ký tự` |
| `packages/api/src/blog/schemas.ts:457` | `Ảnh phải thuộc host được phép: …` |
| `packages/api/src/blog/api.ts:100` | Tiêu đề mặc định của bản nháp: `"Bài viết không tên"` — đây là **dữ liệu** gửi lên backend, không phải chuỗi UI; cân nhắc trước khi đổi (backend sinh slug `bai-viet-khong-ten` từ nó, và `publish-checklist.ts` so với slug đó). |

---

## 4. Cố ý giữ nguyên — KHÔNG phải việc còn sót

Đây là ví dụ minh hoạ bên trong comment tiếng Anh, hoặc là code:

- `packages/ui/src/avatar.tsx:19` — ví dụ initials `"Nguyễn An" → "NA"`.
- `packages/ui/src/language-switcher.tsx:90` — ví dụ nhãn dài nhất `"Tiếng Việt"`.
- `packages/core/src/blog/slugify.ts:19–21` — ví dụ `"đường" → "duong"` và regex `/[đĐ]/g`.
- `apps/admin/components/posts/category-select.tsx:13–14` — ví dụ hai chuyên mục trùng tên `Hướng dẫn`.
- `packages/i18n/messages/vi/**` — file bản dịch tiếng Việt, đương nhiên giữ.
