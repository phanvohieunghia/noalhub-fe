# Xoá tài khoản — thiết kế soft delete

| | |
|---|---|
| **Status** | Dự thảo (2026-08-17) — chưa có dòng code nào ở cả FE lẫn BE |
| **Phạm vi** | User tự xoá tài khoản của mình. Admin xoá user là việc khác, xem `docs/admin-plan.md` §3 |
| **Chạm tới** | BE: migration + 2 endpoint · FE: `apps/web` màn hình cài đặt · `packages/api/src/users/` |
| **Đối chiếu** | Đã đọc `../noalhub-be` (entity + 4 migration) tại commit `b3d6e41`, không suy từ ký ức |

---

## 1. Hiện trạng: chưa có soft delete cho `users`

Rà toàn bộ `src/*/entities/*.ts` của backend: **đúng một cột `deletedAt` tồn tại**, ở
`messages` (`message.entity.ts:72`), kèm comment "chừa sẵn cho xoá tin — chưa có API".
Không có `paranoid: true` ở đâu. Bảng `users` có 13 cột, không cột nào là trạng thái xoá.

Nghĩa là hôm nay **không có đường nào để user xoá tài khoản**, và nếu xoá thẳng bằng SQL
thì FK đã định nghĩa sẵn hành vi:

| Bảng | FK về `users` | Hậu quả khi hard delete |
|---|---|---|
| `refresh_tokens`, `email_tokens`, `oauth_accounts` | `CASCADE` | Dọn sạch — đúng ý |
| `friendships` | `CASCADE` | Mất hết quan hệ bạn bè — đúng ý |
| `conversation_members` | `CASCADE` | ⚠️ Mất luôn hàng member |
| `messages.senderId` | `SET NULL` | Tin nhắn **giữ lại**, người gửi thành `null` |
| `conversations.createdBy` | `SET NULL` | Hội thoại giữ lại |

(Bảng trên mô tả **hard delete** — thứ ta *không* chọn. Hành vi của thiết kế được chọn
nằm ở §4.2, và nó ngược lại ở hai dòng cuối: giữ `senderId`, giữ hàng member.)

Cặp `CASCADE` + `SET NULL` ở hai dòng cuối tạo ra một trạng thái đã được tính trước:
tin nhắn còn nguyên nhưng không còn hàng member để tra tên. `apps/web` đã xử đúng ca này
— `message-group.tsx:32` hiển thị **"Người dùng đã xoá"** in nghiêng khi `senderId === null`.
Vậy nên hard delete *không* làm vỡ UI. Vấn đề của nó nằm ở chỗ khác.

## 2. Vì sao vẫn cần soft delete

Ba lý do, không phải lý do kỹ thuật thuần:

1. **Xoá nhầm không hồi được.** Hard delete là mất vĩnh viễn quan hệ bạn bè và membership.
   Hầu hết sản phẩm cho 14–30 ngày để đổi ý.
2. **Người còn lại trong DM mất ngữ cảnh.** Sau hard delete, hội thoại 1-1 trở thành
   một danh sách tin của "Người dùng đã xoá" không có username để tra cứu gì thêm.
3. **Chống lạm dụng.** Xoá tài khoản rồi tạo lại ngay để thoát khỏi block/report là
   đường vòng hiển nhiên nếu email được giải phóng tức thì.

## 3. Ràng buộc trung tâm: unique index

`user.entity.ts` có **hai unique index**: `idx_users_email` và `idx_users_username`.
Soft delete để nguyên hàng trong bảng, nên một tài khoản đã xoá **vẫn giữ email và
username của nó** — người đó không đăng ký lại được bằng email cũ, và username thì bị
khoá vĩnh viễn khỏi vòng lưu hành.

**Quyết định (2026-08-17): tombstone lúc hết hạn.** Giữ nguyên unique index; hết grace
period thì mới ghi đè `email`/`username` sang dạng tombstone (§4.6) rồi thả cho vòng lưu
hành. Không phải migration index, và chính khoảng thời gian giữ email là cơ chế chống lạm
dụng ở §2.3.

(Đã cân nhắc và loại: *partial unique index* `WHERE deleted_at IS NULL` — tái dùng email
ngay nhưng sinh ca bế tắc "khôi phục mà email đã bị người khác chiếm"; *hard delete sau
hạn* — sạch nhất nhưng mất khả năng audit.)

Hệ quả, cần nhớ khi code:

- **Trong 30 ngày:** email và username của tài khoản đã xoá vẫn bị chiếm. Đăng ký lại
  bằng email cũ phải trả lỗi rõ ràng — không phải "email đã tồn tại" chung chung mà là
  gợi ý khôi phục (§4.3 `POST /users/me/restore`). Tránh để user nghĩ là bug.
- **Sau 30 ngày:** hàng `users` vẫn còn (audit được), nhưng email/username đã bị đổi
  thành dạng tombstone nên vòng lưu hành nhận lại được ngay.
- **Không cần migration index.** `idx_users_email` và `idx_users_username` giữ nguyên,
  chỉ thêm hai cột ở §4.1.
- Tombstone là **một chiều**: đã ghi thì `POST /users/me/restore` không còn nghĩa lý gì
  nữa. Job purge (§4.6) phải là chỗ duy nhất được ghi tombstone.

## 4. Thiết kế đề xuất

### 4.1 Trạng thái cần lưu

**Grace period: 30 ngày** (chốt 2026-08-17). Đây là **nguồn sự thật** cho con số đó —
`admin-plan.md` §3b (`pending_deletion`) chỉ trỏ về đây, đừng ghi số ở cả hai chỗ.

FE quan sát được đúng hai mốc, và đó là thứ phải có trong DTO:

- `deletedAt` — thời điểm user bấm xoá (ISO string, nullable).
- `purgeAfter` — mốc hết hạn khôi phục (ISO string, nullable). FE hiển thị "còn N ngày"
  từ đây, **không** tự cộng 30 ngày vào `deletedAt` — chính sách đổi thì FE không phải sửa.

Cách lưu là việc của backend, chỉ có hai ràng buộc: lưu `purgeAfter` thành mốc riêng chứ
đừng suy từ `deletedAt` ở mọi query (đổi chính sách 30 → 7 ngày sẽ hồi tố sai), và cột
`username` phải chứa nổi dạng tombstone ở §4.6 — hiện `user.entity.ts:70` khai `STRING(32)`
mà tombstone dài 44 ký tự, xem cảnh báo ở đó.

### 4.2 Ngữ nghĩa "đã xoá" — quyết định từng đường một

Soft delete chỉ là một cột; thứ quyết định hành vi là danh sách dưới đây.

| Đường | Hành vi khi `deletedAt != null` |
|---|---|
| `POST /auth/login` | 403 `ACCOUNT_DELETED`, kèm `purgeAfter` để FE mời khôi phục |
| Access token đang lưu hành | Chết **ngay** — tăng `tokenVersion` (§4.4) |
| `GET /users/{username}` | 404, như thể không tồn tại |
| Tìm bạn / gửi lời mời | Không xuất hiện trong kết quả |
| `friendships` | Xoá thật lúc soft delete — bạn bè thấy mất ngay, không chờ hết hạn ⚠️ |
| `conversation_members` | Đặt `left_at = now()`, **không** xoá hàng |
| Tin nhắn cũ | Giữ nguyên, giữ cả `senderId` |
| Presence | Xoá khỏi `PresenceStore`, ép offline |

Hai dòng quan trọng nhất:

**`conversation_members.left_at` là chìa khoá.** Bảng này đã có sẵn cột `left_at`
(`InitChat.ts:92`) — tức khái niệm "rời hội thoại nhưng vẫn còn dấu" đã tồn tại. Dùng nó
thì hàng member còn nguyên, nên `username`/`displayName` vẫn tra được, và
`message-group.tsx` hiển thị tên thật kèm nhãn "đã xoá tài khoản" thay vì
"Người dùng" trống trơn. Đây chính là lý do #2 ở §2 được giải quyết.

**Giữ `senderId`, không set null.** Khác hẳn hard delete. Nhờ vậy nhóm tin theo người gửi
vẫn đúng và avatar vẫn hiện.

⚠️ **Mâu thuẫn chưa giải: `friendships` xoá thật thì restore khôi phục được gì?** Lý do #1
ở §2 để cần soft delete chính là "hard delete mất vĩnh viễn quan hệ bạn bè" — nhưng dòng
`friendships` ở trên lại xoá thật ngay lúc soft delete, nên user khôi phục trong hạn vẫn
mất sạch bạn bè. Phải chọn: hoặc `friendships` cũng soft (thêm cột, và bạn bè phía kia
thấy mất ngay bằng cách lọc), hoặc ghi thẳng "restore không khôi phục friendship" và sửa
lý do #1 ở §2 cho khớp. Để nguyên như hiện tại là doc tự phản bác chính nó.

### 4.3 Endpoint

```
DELETE /users/me          → soft delete. Bắt buộc xác thực lại (xem 4.5)
POST   /users/me/restore  → khôi phục, chỉ khi now() < purge_after
```

`GET /users/me/export` chưa quyết có làm hay không (§6) nên **không** nằm trong block trên
— endpoint chưa chốt mà đứng trong contract là lời mời implement nhầm.

`POST /users/me/restore` **không** dùng được access token (token đã chết theo §4.4), nên
nó phải nhận `email` + `password`, hoặc một `restoreToken` gửi qua email lúc xoá.
Đường thứ hai an toàn hơn và tái dùng được hạ tầng `email_tokens` đã có.

**Shape phải chốt trước khi viết `types.ts`/`schemas.ts`** — hiện doc mới có method + path,
không đủ để code theo `docs/data-layer.md`:

| Endpoint | Request | Response | Mã lỗi |
|---|---|---|---|
| `DELETE /users/me` | `{ password }`, hoặc `{}` cho tài khoản OAuth (§4.5) | `{ deletedAt, purgeAfter }` | `INVALID_PASSWORD`, `ACCOUNT_ALREADY_DELETED` |
| `POST /users/me/restore` | `{ restoreToken }` **hoặc** `{ email, password }` — chốt một | phiên mới, như `POST /auth/login` | `RESTORE_WINDOW_EXPIRED`, `INVALID_TOKEN` |
| `POST /auth/login` (đã có) | — | 403 + `purgeAfter` | `ACCOUNT_DELETED` |

Ràng buộc kèm theo, đừng để sót:

- **Rate limit** cả hai endpoint. `DELETE /users/me` nhận mật khẩu nên nó là một kênh dò
  mật khẩu không kém gì `/auth/login`; `restore` bằng email là kênh dò xem email nào đang
  chờ xoá, nên phản hồi phải giống nhau dù email có tồn tại hay không.
- `restoreToken` cần TTL riêng (≤ `purgeAfter`) và **dùng một lần**.

### 4.4 Thu hồi phiên — dùng cơ chế đã có

`users.tokenVersion` (`user.entity.ts:57`) được nhúng vào access token dưới claim `ver`;
tăng nó là **vô hiệu ngay lập tức** mọi access token đang lưu hành. Nghĩa là soft delete
**không cần cơ chế thu hồi mới** — chỉ cần `tokenVersion++` trong cùng transaction, cộng
với xoá `refresh_tokens` của user (hoặc để `CASCADE` khi purge).

Nếu bỏ bước này thì tài khoản "đã xoá" vẫn dùng app bình thường tới khi access token hết
hạn, vì interceptor ở `packages/api/src/client.ts` tự refresh. Đó là lỗi dễ sót nhất của
cả thiết kế này.

### 4.5 Xác thực lại trước khi xoá

Xoá tài khoản là hành động không hồi lại được sau 30 ngày, nên `DELETE /users/me` phải
đòi mật khẩu trong body. Ngoại lệ: tài khoản OAuth có `passwordHash = null`
(`user.entity.ts:46`) — với chúng thì dùng email confirm token, **không** cho xoá chỉ
bằng một lần bấm.

### 4.6 Job purge

Cron chạy hằng ngày: với mọi user `purge_after < now()`, ghi tombstone email/username
theo §3-B, và `DELETE` các bản ghi `refresh_tokens`/`email_tokens`/`oauth_accounts` còn
sót. Giữ lại hàng `users` (đã tombstone) và toàn bộ tin nhắn.

Dạng tombstone chốt như sau — `id` là UUID của user nên đảm bảo duy nhất, không cần
thêm hậu tố:

```
email    = "deleted+" || id || "@deleted.invalid"
username = "deleted_" || id
```

`.invalid` là TLD dành riêng theo RFC 2606, không ai gửi mail tới đó được. Ghi tombstone
trong **cùng một transaction** với việc dọn token, và đặt `purge_after = NULL` sau khi
xong để job idempotent — chạy lại lần hai không đụng tới hàng đã tombstone.

**Cột `username` phải nới ra — đã kiểm, không phải giả định.** `user.entity.ts:70` khai
`STRING(32)`, mà `deleted_` + UUID (36 ký tự) = **44** → job purge sẽ ném lỗi lúc chạy
thật, không phải lúc review. `email` thì không lo: `STRING(320)`, tombstone dài ~62 ký tự.

### 4.7 Điều người khác nhìn thấy

Chưa mục nào định nghĩa user `pending_deletion` trông ra sao **với người còn lại**, mà
đây là thay đổi contract thật vì `apps/web` đang render member từ DTO của chat:

- Hội thoại DM cũ còn mở được không, và người kia gửi tin tiếp thì nhận lỗi gì?
- `ConversationDto.members` và `PublicProfile` còn trả user đó không, hay trả kèm cờ
  `deleted` để `message-group.tsx` hiện tên thật + nhãn phụ (§5)?
- Presence: §4.2 đã nói ép offline, nhưng người kia thấy "offline" hay thấy hẳn nhãn?

Chốt ba dòng này trước, vì cả ba đều đổi payload chứ không phải đổi CSS.

## 5. Phần việc FE

Theo `docs/data-layer.md`, tất cả nằm trong `packages/api/src/users/`:

- [ ] `types.ts` — thêm `deletedAt`, `purgeAfter` vào các DTO có trả về.
- [ ] `api.ts` + `hooks.ts` — `useDeleteAccount()`, `useRestoreAccount()`.
- [ ] `packages/api/src/errors.ts` (ngoài thư mục `users/`) — thêm `ACCOUNT_DELETED`.
      Chốt cùng lượt với cụm mã moderation ở `admin-plan.md` §3b: **cùng một enum**.
- [ ] **Dọn phiên ở client sau khi xoá** — việc chỉ FE làm được, và là chỗ dễ sót nhất:
      interceptor ở `packages/api/src/client.ts` **tự refresh**, nên sau `DELETE /users/me`
      phải chủ động xoá token, huỷ toàn bộ cache React Query và ngắt socket. Không làm thì
      app rơi vào vòng lặp refresh–401 ngay trên màn hình vừa xoá xong.
- [ ] `apps/web` — route `settings` **chưa tồn tại**, nên đây là task dựng route mới chứ
      không phải thêm một section. Màn hình cài đặt: dialog xoá 2 bước (nhập mật khẩu → xác nhận), nói rõ
      "dữ liệu giữ 30 ngày, sau đó không hồi lại được", và tin nhắn cũ **vẫn còn** với
      người khác — đừng để user tưởng xoá là gỡ hết tin họ đã gửi.
- [ ] Màn hình `/login` xử 403 `ACCOUNT_DELETED` → mời khôi phục kèm ngày hết hạn.
- [ ] `message-group.tsx:32` — nhãn hiện tại "Người dùng đã xoá" chỉ đúng cho ca
      `senderId === null` (hard delete cũ). Thêm nhánh: member còn hàng nhưng
      `left_at != null` **và** user đã xoá → hiện tên thật + nhãn phụ.

## 6. Còn phải chốt

Các quyết định đã chốt nằm ở mục tương ứng (§3 tombstone, §4.1 grace period 30 ngày) —
không nhắc lại ở đây. Còn mở:

- ⚠️ **Va chạm ban ↔ tombstone.** `banned` chặn re-register cùng email
  (`admin-plan.md` §3b), nhưng tombstone §4.6 **ghi đè `email`** khi hết hạn — user bị ban
  rồi tự xoá tài khoản sẽ thoát lệnh chặn đúng ngày thứ 31. Hai đường: chặn user `banned`
  vào luồng `DELETE /users/me`, hoặc giữ bảng hash email bị ban riêng để tombstone không
  xoá mất. Đường thứ hai bền hơn vì không phụ thuộc vào việc nhớ chặn ở mọi luồng xoá.
- **Ma trận `status` × xoá tài khoản.** `pending_deletion` và `banned` dùng **chung một
  cột** `status` (`admin-plan.md` §3b) mà cột đó loại trừ nhau — nên chưa trả lời được:
  user `suspended` có gọi được `DELETE /users/me` không (không login được thì lấy đâu
  token?), user `pending_deletion` bị admin ban thì giá trị nào thắng, admin có thấy và
  khôi phục được user `pending_deletion` không. Đây là xung đột schema, không phải chi
  tiết UI.
- **`deactivated`** (`admin-plan.md` §3b) không có mục nào trong doc này. Đưa vào §4.3 hay
  ghi rõ là không làm đợt này?
- **`friendships` khi restore** — xem cảnh báo ở §4.2.
- Có làm `GET /users/me/export` không? Nếu có thì làm trước khi mở `DELETE`, vì sau khi
  xoá thì không lấy được nữa.
- Tài khoản OAuth xoá bằng gì — email confirm token, hay buộc đặt mật khẩu trước?
- **Copy gửi user** chưa có bản nào: text 403 ở `/login`, dialog xoá 2 bước, email xác
  nhận + email `restoreToken`, và thông báo khi đăng ký trúng email đang trong hạn giữ.
  Repo chưa có i18n (chuỗi Việt hardcode) nên đây là văn bản viết thẳng vào component.
