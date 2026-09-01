# Media — phía frontend

|                |                                                                              |
| -------------- | ---------------------------------------------------------------------------- |
| **Status**     | ĐÃ LÀM. Editor blog upload được ảnh; chưa có màn hình nào cho video/file       |
| **Contract**   | tag `admin-media` trong `/docs-json`                                          |
| **Thiết kế**   | `docs/media.md` bên repo `noalhub-be` — **nguồn sự thật** cho mọi giới hạn    |
| **Liên quan**  | [`data-layer.md`](./data-layer.md) · [`blog-plan.md`](./blog-plan.md) §9      |

Tài liệu này chỉ nói phần **FE làm gì và vì sao**; giới hạn mime/size, luồng ba nhịp
và lý do chọn MinIO nằm ở tài liệu bên backend.

---

## 1. Vì sao không có `POST /media/upload`

Vì backend cố ý không có endpoint đó: file sẽ đi qua RAM của Nest — một video 200MB
tranh RAM với Postgres và Redis trên cùng một VPS. Đổi lại là luồng **ba nhịp**, mà
nhịp giữa không nói chuyện với backend chút nào:

```
1. POST /admin/media/presign   { mime, sizeBytes, originalName } → { id, uploadUrl, expiresIn }
2. PUT  <uploadUrl>            browser → MinIO, KHÔNG qua backend
3. POST /admin/media/{id}/complete                               → { url, … }
```

`uploadMedia()` trong `packages/api/src/media/api.ts` gói cả ba thành một lời gọi. Gói
ở **tầng api** chứ không ở hook vì nó là trình tự của contract, không phải logic React.

---

## 2. Ba thứ dễ sai ở nhịp 2

**Không dùng `http` (axios instance) cho `PUT`.** Ba lý do, mỗi lý do đủ để hỏng:
`baseURL` nối `uploadUrl` vào sau origin của API; interceptor gắn `Authorization` — một
header **không nằm trong chữ ký** presigned, và gửi token của mình sang origin khác là
việc không nên làm dù storage bỏ qua nó; và interceptor 401 sẽ đi refresh token vì một
mã 403 của storage.

**Dùng `XMLHttpRequest`, không dùng `fetch`.** `fetch` không báo được tiến độ upload
(request body dạng stream chưa dùng rộng rãi được), mà một file lớn không có thanh tiến
độ thì người dùng chỉ thấy app treo.

**`Content-Type` phải khớp đúng thứ đã khai ở nhịp 1** — nó nằm trong phần được ký.
`Content-Length` thì trình duyệt tự đặt, không set tay được.

Lỗi của nhịp này là `StorageUploadError`, **không** phải `ApiError`: MinIO trả XML của
S3, không có `code` nào trong contract lỗi của backend. Trộn hai thứ vào một lớp là mời
người ta `switch` trên một mã không tồn tại.

403 ở nhịp 2 gần như luôn là một trong ba thứ, và **không** thứ nào là lỗi người dùng:
link hết hạn (`expiresIn` là hạn cho *toàn bộ* request PUT, không phải hạn để bắt đầu),
chữ ký sai vì `Host` khác lúc ký, hoặc đồng hồ server lệch.

---

## 3. Allowlist ở FE là bản sao thứ yếu

`MEDIA_MIME_TO_KIND` / `MEDIA_KIND_MAX_BYTES` trong `packages/api/src/media/schemas.ts`
là **bản sao** của `media-limits.ts` bên backend. Backend vẫn từ chối độc lập dù FE có
kiểm hay không; bản sao này chỉ để **hỏng sớm và hỏng có nghĩa** — chọn nhầm file 40MB
thì biết ngay lúc chọn, thay vì sau khi đã đẩy hết 40MB lên mạng rồi mới ăn 400.

Lệch với backend thì hậu quả là lỗi hiện muộn hơn, **không phải lỗ hổng**. Đừng "sửa"
điều đó bằng cách bỏ kiểm ở FE, cũng đừng nâng nó lên thành nguồn sự thật.

Client **không gửi `kind`** — backend suy từ mime. Cho gửi nghĩa là backend phải kiểm nó
khớp mime, và quên câu kiểm đó là lỗ hổng lách giới hạn size.

---

## 4. Editor blog dùng nó thế nào

Ba đường vào, cùng một hàm:

| Đường | Ở đâu |
| --- | --- |
| Kéo-thả / dán ảnh vào bài | `handleDrop` / `handlePaste` của `tiptap-editor.tsx` |
| Nút chọn file (dialog chèn ảnh, ảnh bìa, ảnh OG) | `components/media/image-upload-button.tsx` |
| Dán URL (Unsplash…) | dialog chèn ảnh, như trước |

**Chèn ảnh SAU khi upload xong, không chèn node tạm rồi thay `src`.** Node tạm phải mang
`blob:` hoặc `data:`, mà cả hai đều bị `sanitizeBlogDoc` — chạy ngay ở `onUpdate` — bỏ
trong nhịp sau: ảnh sẽ hiện ra rồi biến mất giữa chừng, không ai hiểu vì sao. Đổi lại là
một khoảng chờ, và thanh tiến độ dưới toolbar lấp chỗ đó.

**`handlePaste`/`handleDrop` chỉ nuốt sự kiện khi thật sự có file ảnh.** Dán chữ, dán
HTML, kéo một đoạn văn trong bài đều phải đi tiếp đường mặc định của ProseMirror.

**`width`/`height` do trình duyệt đo, không lấy từ API.** Backend cố ý để hai cột đó
`null` (đọc chúng cần giải mã ảnh phía server). Trình duyệt thì vừa tải ảnh xong và biết
chính xác — chỗ rẻ nhất để có con số là ở client. Đo không được thì để `null` và renderer
rơi về khung 16:9.

**Upload xong phải `setValue(..., { shouldDirty: true })`** cho ảnh bìa và ảnh OG. Không
có nó thì rời trang sẽ **không** bị `useUnsavedChanges` chặn, và ảnh vừa chọn mất im
lặng dù file đã nằm trên máy chủ.

Huỷ giữa chừng để lại một row `pending` bên backend. **Không** cố dọn từ FE — không có
endpoint xoá (và cũng không nên có); job dọn của backend xoá nó sau 24h.

---

## 5. Cấu hình `next/image` — ba chỗ phải khớp

`BLOG_IMAGE_HOSTS` (`packages/api/src/blog/schemas.ts`, nơi validate `image.src` lúc
ghi), `apps/web/next.config.ts`, và `apps/admin/next.config.ts`. Ba chỗ vì file config
chạy **trước** khi `transpilePackages` có hiệu lực nên không import được package nội bộ.

`apps/admin` cũng cần block `images`, dù nó không phải trang công khai: tab **Xem trước**
render bằng đúng `@noalhub/ui/blog/post-content`, và renderer đó dùng `next/image`.

`dangerouslyAllowSVG: true` + `contentDispositionType: "attachment"` là **bắt buộc** ở cả
hai app: `next/image` từ chối mọi SVG khi cờ này tắt, và triệu chứng là ảnh hỏng ở đúng
production trong khi `next dev` vẫn chạy (dev không tối ưu ảnh).

> ⚠️ "dangerously" là thật, và nó được bù bằng **ba lớp khác**, không phải bằng cờ này:
> backend sanitize SVG bằng DOMPurify rồi ghi đè object, nginx trả
> `Content-Security-Policy: sandbox` cho mọi `.svg`, và host phục vụ ảnh tách hẳn khỏi
> origin của app.
>
> **Lớp thứ ba là ràng buộc của repo NÀY và backend không cưỡng chế được:** SVG chỉ
> được nhúng qua `next/image` / `<img src>`. Inline nó vào DOM
> (`dangerouslySetInnerHTML`, import as component) là cho nó chạy trên origin của app,
> và không lớp nào ở trên cứu được — cả ba đều dựa vào việc file được tải như một tấm ảnh.

---

## 6. Chưa làm

- **Upload video / file đính kèm.** Tầng api đã tổng quát theo `kind`, nhưng chưa có màn
  hình nào cần; `ImageUploadButton` cố tình chỉ nhận mime ảnh.
- **Thư viện media** (liệt kê, chọn lại ảnh đã upload). Backend chưa có endpoint liệt kê.
- **Upload nhiều file một lúc.** Kéo-thả hiện lấy **file ảnh đầu tiên**.
