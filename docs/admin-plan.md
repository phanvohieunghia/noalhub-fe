# Kế hoạch admin — checklist quản trị app chat

|                |                                                                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**     | Đã chốt phạm vi (2026-08-17) — chờ backend chốt contract §3                                                                                          |
| **Hiện trạng** | `apps/admin` chỉ có `/login` + `/dashboard` (dashboard mới in `useMe()` làm bằng chứng chuỗi liên kết — xem `docs/monorepo-plan.md` §5)       |
| **Contract**   | `http://localhost:3101/docs-json`. Backend hiện có **đúng 3** endpoint admin: `GET /admin/stats`, `GET /admin/users`, `GET /admin/users/{id}` |
| **Liên quan**  | `docs/data-layer.md` (bắt buộc), `docs/chat.md`, `docs/monorepo-plan.md`, `docs/account-deletion.md` (user tự xoá tài khoản)                  |

---

## 0. Kết luận đọc trước khi lên lịch

Đối chiếu spec: **backend chưa có bất kỳ endpoint nào cho chat ở phía admin.**
`/api/chat/*` đều là endpoint của _người tham gia hội thoại_ — chúng lọc theo
membership của caller. Admin không phải member nên không đọc được hội thoại của
người khác qua chúng, và cũng không có endpoint xoá tin, khoá user, đổi role.

Hệ quả cho kế hoạch: một checklist "quản lý app chat" chia làm hai nhóm rất khác nhau
về chi phí.

| Nhóm                    | Làm được ngay     | Vì sao                                          |
| ----------------------- | ----------------- | ----------------------------------------------- |
| **A — user & số liệu**  | ✅ FE thuần       | 3 endpoint admin đã có                          |
| **B — moderation chat** | ❌ chặn ở backend | Chưa có endpoint; phải chốt contract trước (§3) |

Đừng bắt đầu bằng nhóm B ở FE — sẽ phải mock rồi viết lại. Bắt đầu bằng nhóm A
cộng với việc **vá lỗ hổng phân quyền ở §1** (đây là việc gấp nhất, không phải feature).

---

## 1. Phase 0 — Nền admin (làm trước mọi feature)

- [ ] **Role gate.** `packages/ui/src/auth/auth-guard.tsx` chỉ kiểm `status === "authenticated"`.
      Nghĩa là **mọi user thường đăng nhập được vào `/dashboard` của admin**. Backend vẫn
      trả 403 nên không lộ dữ liệu, nhưng UI cho vào là sai và gây bug khó đọc.
      → Thêm `RoleGuard` (hoặc prop `requireRole` cho `AuthGuard`) đọc `useMe().data.role`,
      `role !== "admin"` thì redirect ra `/login` kèm thông báo. Đặt ở `packages/ui` vì
      là vỏ session dùng chung, không phải feature của admin.
- [ ] **Xử lý 403 tập trung.** `packages/api/src/errors.ts` đã có `ERROR_CODES`; admin cần
      một chỗ hiển thị "bạn không có quyền" thay vì màn hình trắng khi mất role giữa phiên.
- [ ] **Shell admin.** Sidebar + header + breadcrumb, `apps/admin/components/layout/`.
      Nav: Overview · Users · Conversations · Reports (2 mục sau khoá lại tới khi có §3).
- [ ] **`packages/api/src/admin/`** theo đúng `docs/data-layer.md` §5, cộng thêm
      `"./admin"` vào `exports` của `packages/api/package.json` (phần riêng của admin).
      Types copy từ `AdminUserDto`,
      `AdminUserListDto`, `AdminStatsDto` — **không suy từ DB**.
      ⚠️ Trong spec, `displayName`/`avatarUrl`/`emailVerifiedAt`/`lastSeenAt`/`usernameChangedAt`
      khai `type: "object", nullable: true` (lỗi generate của Nest Swagger). Shape thật là
      `string | null`; ghi chú lệch này vào `types.ts` như `chat/types.ts` đã làm.
- [ ] **Primitive còn thiếu** cho `packages/ui`: `table`, `pagination`, `badge`, `select`,
      `stat-card`. Cả 4 màn hình dưới đều cần — dựng một lần, đừng copy vào từng page.

## 2. Phase 1 — Nhóm A: dùng hết 3 endpoint đã có

- [ ] **`/overview`** — 4 stat card từ `GET /admin/stats`
      (`totalUsers`, `verifiedUsers`, `newUsersLast7Days`, `admins`).
      Spec ghi rõ **không cache** ở backend → đặt `staleTime` ngắn + nút refresh; đừng
      hiển thị như số liệu realtime.
- [ ] **`/users`** — bảng từ `GET /admin/users`: phân trang offset (`page`, `limit` ≤ 100),
      `q` (khớp gần đúng email + username), lọc `role`. Debounce `q`, đồng bộ filter vào
      URL searchParams để share được link.
- [ ] **`/users/[id]`** — chi tiết từ `GET /admin/users/{id}`, 404 → `USER_NOT_FOUND`.
      ⚠️ `lastSeenAt` **không phải** trạng thái online (spec nói thẳng: endpoint này không
      đọc presence). Nhãn phải là "hoạt động lần cuối", không phải dot xanh/xám.
- [ ] Empty state, skeleton, và trạng thái 429 `RATE_LIMITED` — cả 3 endpoint đều khai 429.

Hết Phase 1 thì nhóm A cạn contract: **không có** ban/khoá, đổi role, xoá user, buộc
logout, resend verify. Nếu bạn cần chúng thì đó cũng là việc backend (§3).

## 3. Phase 2 — Nhóm B: cần backend trước

**Chính sách đã chốt: metadata-only.** Admin **không** đọc được nội dung tin nhắn
(`body`) của user. Ràng buộc này nằm ở tầng contract, không ở tầng UI: endpoint không
trả `body` thì FE không có cách nào lộ, kể cả khi ai đó sửa màn hình sau này.

Đề xuất contract để bạn mang sang repo backend chốt. FE không viết trước dòng nào.

**Quan sát hội thoại (metadata)**

- [ ] `GET /admin/conversations` — phân trang, lọc `type`, `q` (theo member), sort theo
      `lastMessageAt`. Trả `id`, `type`, `title`, `members`, `messageCount`, `createdAt`,
      `lastMessageAt`. **Không** trả `lastMessage` — `ConversationDto` của user có field
      đó và nó chứa `body`, nên bản admin phải là DTO riêng, đừng tái dùng.
      Lưu ý `ConversationDto` hiện cũng không trả `lastMessageAt` dù backend sort theo cột
      đó (`chat/types.ts` đã ghi lệch này) — bản admin nên trả.
- [ ] `GET /admin/conversations/{id}` — chi tiết metadata: danh sách member kèm số tin mỗi
      người gửi, thời điểm join/leave. Không có danh sách tin nhắn.
- [ ] `GET /admin/users/{id}/activity` — chuỗi hoạt động để phát hiện spam:
      số tin/giờ, số hội thoại mới khởi tạo, số người khác nhau đã nhắn tới.
      Đây là thứ **thay thế** cho việc đọc nội dung: một account nhắn 500 người trong 1 giờ
      thì nhìn con số là đủ kết luận, không cần đọc chữ.

**Hành động moderation**

- [ ] `PATCH /admin/users/{id}` — **chỉ** đổi `role`. Trạng thái/hạn chế tài khoản là
      mô hình riêng, đi qua endpoint khác → **xem §3b**, đừng implement `status` ở đây.
- [ ] `POST /admin/users/{id}/logout-all` — thu hồi phiên của user bị khoá. Không có cái
      này thì "suspend" chỉ có tác dụng ở lần login sau. ⚠️ Cơ chế thu hồi **đã tồn tại**:
      `users.tokenVersion` (xem `account-deletion.md` §4.4) giết mọi access token đang lưu
      hành khi tăng lên. Endpoint này nên là wrapper quanh nó, không phải cơ chế thứ hai —
      dùng chung một đường cho ban/suspend/xoá/đổi mật khẩu.
- [ ] `GET /admin/audit-logs` — mọi hành động ở trên phải ghi log.
      (Metadata-only bỏ được yêu cầu log "ai đã xem hội thoại nào" cho hội thoại thường,
      nhưng log _hành động_ thì vẫn cần — suspend một user là việc phải truy được ai làm.
      **Ngoại lệ:** xem một report *là* truy cập nội dung nên phải ghi log — xem §3.1.)

**Hệ quả: xoá tin nhắn không đứng một mình.** Admin không thấy `body` thì không có căn
cứ xoá đúng tin, nên `DELETE /admin/messages/{id}` chỉ hợp lý **sau** luồng report, nơi
chính user đã đưa tin đó ra. Đã chốt: không làm ở §3, gộp vào §3.1.

### 3.1 Report — đường duy nhất tới nội dung

- [ ] `POST /chat/messages/{id}/report` (phía `apps/web`) — user report một tin.
- [ ] `GET /admin/reports` + `GET /admin/reports/{id}` — chỉ ở đây admin thấy `body`,
      và **chỉ của đúng tin bị report**, không phải hội thoại xung quanh.
- [ ] `PATCH /admin/reports/{id}` — `resolved | dismissed`, kèm hành động xoá tin.
- [ ] Feature này xuyên cả 2 app (web gửi report, admin xử lý) → làm sau §2, xem §5.

**Đã chốt làm (2026-08-17).** Vì report là đường duy nhất tới nội dung, mấy điểm sau
là ràng buộc contract chứ không phải chi tiết triển khai.

Đã chốt:

- `GET /admin/reports/{id}` trả `body` của **đúng tin bị report** và tối đa N tin kề để
  lấy ngữ cảnh — N chốt trước, mặc định **0**. Để mở là admin đọc được cả hội thoại và
  nguyên tắc metadata-only mất nghĩa.
- Xem một report **là** truy cập nội dung → phải vào `GET /admin/audit-logs`. Đây là
  ngoại lệ duy nhất của ghi chú "metadata-only bỏ được log ai xem hội thoại nào" ở trên.
- Chống lạm dụng chính luồng report: rate limit `POST /chat/messages/{id}/report`, chặn
  report trùng cùng một tin từ cùng một user. Không có thì report thành công cụ quấy rối.

Còn mở, phải chốt trước khi code:

- `PATCH /admin/reports/{id}` xoá tin thì **xoá cho ai** — cả hai phía hay chỉ ẩn với
  người report? Ảnh hưởng thẳng tới UI chat ở `apps/web` (tin biến mất giữa hội thoại).
- Reporter có được báo kết quả không? Nếu có thì `resolved`/`dismissed` cần
  `userFacingMessage` giống mô hình ở §3b.
- UI nào gọi `POST /chat/messages/{id}/report` — menu ngữ cảnh trên bong bóng tin? Và có
  màn hình "report của tôi" phía web không?

## 3b. Mô hình trạng thái tài khoản (mở rộng của "block user")

"Block một user" là _một_ nút trong bảng dưới đây, không phải cả bài toán. Nếu chỉ làm
đúng nút đó thì mọi ca xử lý đều bị đẩy về hai cực: bỏ qua, hoặc khoá sạch tài khoản.
Thực tế của app chat cần các mức trung gian — phần lớn ca spam/quấy rối xử lý bằng
_hạn chế_ chứ không bằng _khoá_.

**Chốt kiến trúc: hai trục độc lập.** Đây là điểm dễ làm sai nhất và sửa sau rất đau,
vì nó là schema DB:

- **Trục 1 — `status`: vòng đời tài khoản.** Loại trừ nhau, đúng một giá trị tại một thời điểm.
- **Trục 2 — `restrictions`: các hạn chế.** Cộng dồn được, mỗi cái có hạn riêng.

Nhồi tất cả vào một enum `status` là cái bẫy: không diễn tả được "user active nhưng bị
mute 24h" — mà đó lại là hành động moderation dùng nhiều nhất.

### Trục 1 — `status`

| Giá trị                | Nghĩa                                                | Login        | Gửi tin | Hiện trong search |
| ---------------------- | ---------------------------------------------------- | ------------ | ------- | ----------------- |
| `active`               | Bình thường                                          | ✅           | ✅      | ✅                |
| `pending_verification` | Chưa verify email                                    | ✅           | ❌      | ❌                |
| `suspended`            | Khoá **có hạn**, có `expiresAt` → tự hết             | ❌           | ❌      | ❌                |
| `banned`               | Khoá vĩnh viễn, chỉ admin mở                         | ❌           | ❌      | ❌                |
| `deactivated`          | **User tự** tắt, tự mở lại được bằng login           | ✅ (mở lại)  | ❌      | ❌                |
| `pending_deletion`     | Đã yêu cầu xoá, đang trong grace period              | ❌ (xem ghi chú) | ❌      | ❌                |

Ghi chú:

- `pending_verification` **suy ra được** từ `emailVerifiedAt` đã có trong `AdminUserDto`
  → đừng lưu trùng thành cột. Nó nằm trong bảng này chỉ vì admin cần thấy nó cùng chỗ.
- `suspended` vs `banned` khác nhau ở `expiresAt`, không ở cơ chế. Vẫn nên là hai giá trị
  riêng vì hai thông báo gửi cho user khác nhau hẳn, và vì "ban" **chặn re-register cùng
  email** (chốt 2026-08-17): `POST /auth/register` với email của tài khoản `banned` phải
  bị từ chối. Ràng buộc thật cần giữ là **định danh dùng để chặn phải bất biến qua mọi
  luồng xoá** — nói "không hard delete hàng user" là chưa đủ, vì tombstone ở
  `account-deletion.md` §4.6 *ghi đè* `email` mà vẫn giữ nguyên hàng, nên lệnh chặn thủng
  đúng ngày thứ 31. Cơ chế chưa chốt (đề xuất: bảng hash email bị ban riêng) — xem
  `account-deletion.md` §6. Mã lỗi trả về phải **không** phân biệt được với "email đã tồn
  tại", nếu không thì đây là kênh dò xem email nào bị ban.
- `pending_deletion`: **`docs/account-deletion.md` là nguồn sự thật**, đừng chép số hay
  hành vi sang đây. Hai điểm hay bị hiểu sai: grace period do §4.1 của doc đó định nghĩa
  (§4.1 doc đó), và login **không** tự huỷ xoá — `POST /auth/login` trả 403
  `ACCOUNT_DELETED`, khôi phục đi qua `POST /users/me/restore` (§4.2–§4.3 doc đó).
- `deactivated` / `pending_deletion` là **hành động của user**, không phải của admin,
  nhưng dùng chung cột `status` — admin phải đọc được để khỏi tưởng đó là án kỷ luật.
  ⚠️ `deactivated` hiện **không có nhà**: không endpoint, không màn hình, và
  `account-deletion.md` không nhắc tới nó. Hoặc đưa vào phạm vi doc đó, hoặc ghi rõ là
  không làm đợt này — đừng để một trạng thái được chốt ở đây rồi bốc hơi ở chỗ triển khai.

### Trục 2 — `restrictions` (cộng dồn)

| Cờ                        | Hiệu lực                                                       | Ca dùng điển hình                                     |
| ------------------------- | -------------------------------------------------------------- | ----------------------------------------------------- |
| `muted`                   | Đọc được, **không gửi được** tin nào                           | Quấy rối trong hội thoại, cần hạ nhiệt                |
| `throttled`               | Giảm rate limit gửi tin xuống mức thấp                         | Nghi spam nhưng chưa chắc — không cấm oan             |
| `dm_restricted`           | Chỉ nhắn được cho người **đã là bạn**                          | Chống cold-DM hàng loạt, ca phổ biến nhất             |
| `unsearchable`            | Không xuất hiện ở tìm kiếm user, không gửi được friend request | Shadow-limit: hạn chế mà user không biết ngay         |
| `media_blocked`           | Gửi được text, không gửi được ảnh/file                         | Ca lạm dụng ảnh (chưa cần tới khi chat còn text-only) |
| `password_reset_required` | Buộc đổi mật khẩu ở lần login tới                              | Nghi tài khoản bị chiếm — **không** phải hình phạt    |

Mỗi cờ cần `expiresAt` riêng. "Mute 24h" phải tự hết; mute vĩnh viễn không có hạn thì
thực chất là ban, và nên gọi đúng tên nó.

### Metadata bắt buộc cho mọi lần đổi trạng thái

Thiếu mấy field này thì trạng thái thành số liệu mồ côi, 3 tháng sau không ai biết vì sao:

- `reason` (enum: `spam` · `harassment` · `impersonation` · `csam` · `security` · `other`)
  — enum để lọc/đếm được, khác với `note`.
- `note` — free text **nội bộ**, không bao giờ trả cho user bị xử lý.
- `userFacingMessage` — cái duy nhất user đọc được. Tách khỏi `note` là cố ý.
- `actorId` + `createdAt` — ai làm, lúc nào. Đi vào `GET /admin/audit-logs` ở §3.
- `expiresAt` — nullable = vĩnh viễn.

⚠️ Ràng buộc phải chốt cùng backend: **admin không sửa được trạng thái của admin khác**,
và không tự sửa được chính mình. Không có chặn này thì hai admin có thể khoá lẫn nhau.
Cần kèm mã lỗi riêng (`CANNOT_MODERATE_ADMIN`, `CANNOT_MODERATE_SELF`) để admin hiểu vì
sao nút bị từ chối. Và `GET /admin/audit-logs` thì ai đọc được — mọi admin, hay cần một
cấp cao hơn? Hiện `role` chỉ có hai giá trị nên chưa diễn tả được "super-admin"; nếu cần
phân cấp thì phải chốt **trước**, vì nó đổi cả `AdminUserDto`.

### Contract đề xuất — bổ sung cho §3

- [ ] `PATCH /admin/users/{id}/status` — body: `status`, `reason`, `note`,
      `userFacingMessage`, `expiresAt`. Tách khỏi `PATCH /admin/users/{id}` (đổi `role`)
      vì hai việc này khác nhau về audit và về quyền.
- [ ] `POST /admin/users/{id}/restrictions` + `DELETE /admin/users/{id}/restrictions/{flag}`
      — cộng dồn nên không dùng PATCH cả cụm.
- [ ] `GET /admin/users/{id}/moderation-history` — lịch sử theo user, khác với audit log
      theo actor. Admin cần cái này để biết đây là lần vi phạm thứ mấy.
- [ ] `AdminUserDto` thêm `status`, `statusExpiresAt`, và `restrictions` — **không phải
      `string[]`**: mỗi cờ có hạn và lý do riêng nên phải là
      `{ flag, expiresAt, reason, actorId, createdAt }[]`. `string[]` không chở nổi
      `expiresAt`, mà đó chính là thứ làm "mute 24h" tự hết.
      `GET /admin/users` thêm filter `status` và `hasRestrictions`.
- [ ] `DELETE /admin/users/{id}/restrictions/{flag}` khi cờ không tồn tại trả gì — 404 hay
      204 idempotent? Ảnh hưởng tới việc admin bấm gỡ hai lần có thấy lỗi giả không.
- [ ] `AdminStatsDto` thêm `suspendedUsers`, `bannedUsers` — nếu không thì overview vẽ
      "totalUsers" gồm cả người đã bị ban, con số sai âm thầm.
- [ ] `POST /admin/users/{id}/logout-all` (đã có ở §3) phải được **gọi tự động** khi
      chuyển sang `suspended`/`banned`. Nếu để admin bấm tay hai bước thì sẽ có lần quên,
      và user bị "khoá" vẫn chat tiếp bằng session cũ tới khi access token hết hạn.

### Chuyển trạng thái — ai đổi, bằng đường nào

Bảng Trục 1 liệt kê 6 giá trị nhưng contract ở trên mới có đúng một đường vào
(`PATCH /admin/users/{id}/status`). Thiếu đường ra/vào là thiếu nửa mô hình:

| Chuyển | Ai làm | Đường | Trạng thái |
| --- | --- | --- | --- |
| `active` → `suspended` / `banned` | admin | `PATCH /status` | đã có ở trên |
| `suspended` / `banned` → `active` | admin | `PATCH /status` với `status=active` | **chưa rõ**: gỡ án có bắt buộc `reason` không? |
| `suspended` hết hạn → `active` | hệ thống | job định kỳ, hay tính lười lúc login? | **chưa chốt** — hai cách cho ra `AdminUserDto.status` khác nhau |
| `active` → `deactivated` | user | chưa có endpoint | **chưa có** (xem ghi chú `deactivated` ở trên) |
| `active` → `pending_deletion` | user | `DELETE /users/me` | `account-deletion.md` §4.3 |
| `pending_deletion` → `active` | user | `POST /users/me/restore` | `account-deletion.md` §4.3 |
| → `pending_verification` | hệ thống | dẫn xuất từ `emailVerifiedAt`, không set tay | — |

⚠️ Ô "hết hạn" là chỗ dễ sai nhất: nếu tính lười lúc login thì `GET /admin/users` vẫn
hiện `suspended` cho một tài khoản thực chất đã hết án — admin sẽ đọc sai.

### Migration & thứ tự deploy

§3b đổi schema nặng hơn `account-deletion.md` §4.1 nhiều (cột `status`, bảng restrictions,
moderation history, audit logs) mà chưa có dòng nào về rollout:

- User đang có phải backfill `status` — mặc định `active`, riêng ai chưa verify thì để
  dẫn xuất lo, đừng ghi cứng `pending_verification` vào cột.
- Thứ tự deploy: BE trả `status` trước, FE đọc sau. Trong giai đoạn giao nhau, `status` và
  `restrictions` phải **optional** trong schema Zod của `packages/api`, nếu không admin
  hiện tại vỡ ngay khi deploy lệch nhịp.

### Điểm thực thi — chỗ này quyết định trạng thái có thật hay không

Chat này **gửi tin qua socket, không qua REST** (`docs/chat.md` §1). Nên mỗi hạn chế
phải được chặn ở **cả hai** đường, và socket là đường dễ bỏ sót:

1. **Login** (`POST /auth/login`) — trả 403 kèm mã riêng, không phải
   `INVALID_CREDENTIALS`, để `apps/web` hiện đúng lý do.
2. **Socket handshake** — `banned`/`suspended` thì từ chối connect ngay.
3. **Ack của `message:send`** — `muted`/`throttled`/`dm_restricted` phải trả mã lỗi trong
   ack. Đây là chỗ duy nhất chặn được mute mà không cần ngắt kết nối.
4. **Đang online lúc bị khoá** — backend phải chủ động disconnect socket đang mở.
   Không làm thì user bị ban vẫn chat bình thường cho tới khi tự F5.

### Hệ quả ở FE

**`apps/web`** (phần này chưa có, phải làm cùng lúc — nếu không thì user bị hạn chế chỉ
thấy app hỏng, không hiểu vì sao):

- Mã lỗi mới trong `packages/api/src/errors.ts`: `ACCOUNT_SUSPENDED`, `ACCOUNT_BANNED`,
  `ACCOUNT_MUTED`, `ACCOUNT_DEACTIVATED`, `PASSWORD_RESET_REQUIRED`, `DM_RESTRICTED`,
  `SEND_RATE_LIMITED`. Cộng `ACCOUNT_DELETED` từ `account-deletion.md` §5 — **cùng một
  enum `ERROR_CODES`**, nên chốt cả cụm một lượt thay vì hai đợt sửa cùng file.
- Tên mã trong socket ack và lý do disconnect cũng phải chốt cùng lượt (xem "Điểm thực
  thi" ở trên) — đó là hai tín hiệu duy nhất FE nhận được khi user bị chặn lúc đang online.
- Trang login: hiện `userFacingMessage` + `expiresAt` ("mở lại sau 3 ngày"), không phải
  toast đỏ chung chung.
- Composer: `muted` → disable input kèm banner giải thích, **không** để user gõ xong mới
  báo lỗi. `dm_restricted` → chặn ở bước tạo hội thoại mới, không phải ở lúc gửi.
- Socket bị ngắt vì ban: phân biệt với mất mạng, **không** retry reconnect vô hạn.

**`apps/admin`**:

- Badge trạng thái ở `/users` và `/users/[id]`; màu phải phân biệt được `suspended` (tạm)
  với `banned` (vĩnh viễn) — dùng chung một sắc đỏ là mời gọi bấm sai.
- Dialog xác nhận **bắt buộc** chọn `reason` + nhập `userFacingMessage`. Không cho khoá
  bằng một cú click; đây là hành động khó đảo và nhìn thấy được từ ngoài.
- Chỉ hiện restriction đang còn hiệu lực; cái đã hết hạn đẩy về moderation-history.

## 4. Phase 3 — Vận hành

- [ ] CI 2 job, nginx server block cho `admin-noalhub.duckdns.org`, origin admin vào
      CORS allowlist backend. **Nguồn sự thật là `monorepo-plan.md` §5 bước 7** — đừng
      chép trạng thái sang đây, chỉ trỏ.
- [ ] Bảo vệ tầng hạ tầng cho `admin-*`: IP allowlist / basic auth / VPN ở nginx.

---

## 5. Thứ tự đề nghị

1. **§1 role gate** — lỗ hổng UI, làm ngay, nhỏ.
2. **§1 còn lại + §2** — một sprint, cho ra admin dùng được thật bằng contract sẵn có.
3. **Chốt §3 với backend** — song song trong lúc làm bước 2, vì nó chặn mọi thứ còn lại.
   Gồm cả contract của §3.1.
4. **§3.1 report** — sau khi §2 chạy được, vì nó cần bảng user/message của §2 làm nền và
   xuyên cả hai app.
5. **§4** khi domain admin cần public.

## 6. Nhật ký quyết định

Chốt **2026-08-17** (chi tiết và hệ quả kỹ thuật ở mục tương ứng, đừng sửa ở đây):

- Admin **không** đọc nội dung tin nhắn — metadata-only (§3).
- Trạng thái tài khoản là **hai trục** `status` + `restrictions`, không phải một nút (§3b).
- `pending_verification` không gửi được tin; `banned` chặn re-register cùng email (§3b).
- Grace period của `pending_deletion`: xem `account-deletion.md` §4.1 (nguồn sự thật).
- **Có** làm luồng report, kéo theo giữ `DELETE /admin/messages/{id}` sau màn hình report (§3.1).

Còn mở: các ô "chưa chốt" trong bảng chuyển trạng thái ở §3b, hai câu hỏi cuối §3.1, và
va chạm ban ↔ tombstone ở `account-deletion.md` §6.
