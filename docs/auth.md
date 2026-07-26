# Authentication — Design Document

| | |
|---|---|
| **Status** | Đã triển khai và căn lại theo OpenAPI spec thật của backend (`http://localhost:3101/docs`) — **chưa chạy lại E2E với backend thật** |
| **Ngày** | 2026-07-25 |
| **Phạm vi** | Login, logout, register, forgot/reset password, OAuth (Google, GitHub), bảo vệ route |
| **Codebase** | Next.js 16.2.11 · React 19.2.4 · Tailwind v4 · App Router · TypeScript strict |

---

## 1. Bối cảnh

`noalhub-fe` hiện là **bare `create-next-app`**: chỉ có `app/layout.tsx`, `app/page.tsx`, `app/globals.css`. Không có auth, state management, HTTP client, form/validation lib, không `.env`, không `middleware.ts`/`proxy.ts`. Toàn bộ feature này là greenfield.

Authentication là tiền đề cho mọi feature có dữ liệu người dùng, nên cần chốt kiến trúc ngay từ đầu — đặc biệt là **nơi lưu session**, vì thay đổi nó về sau sẽ kéo theo viết lại data-fetching của cả app.

### 1.1 Quyết định kiến trúc đã chốt

| Quyết định | Lựa chọn |
|---|---|
| Nguồn auth | Backend REST riêng (chưa có OpenAPI spec) |
| Đường đi request | **Browser gọi thẳng backend** — không qua BFF proxy |
| Nơi lưu token | Client (memory + `localStorage`) |
| OAuth | Backend lo toàn bộ; Next chỉ redirect đi và nhận callback |

### 1.2 Hệ quả của "browser gọi thẳng backend" — đọc kỹ

Đây là đánh đổi có ý thức, không phải sơ suất. Bốn hệ quả ràng buộc toàn bộ thiết kế bên dưới:

1. **XSS đồng nghĩa mất token.** Không có httpOnly cookie che chắn; bất kỳ script nào chạy được trên page đều đọc được `localStorage`. → Giảm thiểu ở §4.1: access token **chỉ nằm trong memory**, `localStorage` chỉ giữ refresh token.
2. **`proxy.ts` (middleware) vô dụng cho auth.** Nó chạy trên server, không thấy `localStorage`. → **Không tạo `proxy.ts`.** Route protection làm ở client (§4.5), chấp nhận một nhịp loading trước khi redirect.
3. **Không SSR được nội dung cần đăng nhập.** Mọi trang protected là client component, fetch sau khi mount. Server component vẫn dùng tốt cho phần public/static.
4. **Backend phải bật CORS** cho origin của FE, cho phép header `Authorization`, và `Access-Control-Allow-Origin` phải là origin cụ thể (không dùng `*` khi có credentials).

### 1.3 Đường thoát (migration path)

Nếu sau này muốn chuyển sang httpOnly cookie + BFF, toàn bộ việc chạm storage được cô lập trong **một file duy nhất** — `lib/auth/token-store.ts`. Việc migrate khi đó là: viết lại file đó, thêm route handlers `app/api/auth/*`, đổi `API_BASE_URL` trong `services/config.ts`. **Không component nào phải sửa** — không component nào được phép import `token-store` trực tiếp (xem §4.1).

---

## 2. Kiến trúc tổng thể

```
┌──────────────────── Browser ────────────────────┐
│                                                 │
│  Components (forms, guards, buttons)            │
│         │ chỉ gọi qua store                     │
│         ▼                                       │
│  lib/auth/store.ts        (zustand: user+status)│
│         │                                       │
│         ▼                                       │
│  services/auth/hooks.ts   (React Query hooks)   │
│         │                                       │
│         ▼                                       │
│  services/auth/api.ts     (1 hàm / 1 endpoint)  │
│         │                                       │
│         ▼                                       │
│  services/client.ts       (Bearer, 401→refresh) │
│         │             ▲                         │
│         │             └── lib/auth/token-store  │
│         │                 (BIÊN CÔ LẬP)         │
└─────────┼───────────────────────────────────────┘
          │ axios, gọi thẳng backend, CORS
          ▼
    Backend REST  ──OAuth──▶ Google / GitHub
```

**Quy tắc phụ thuộc (bắt buộc):**
- Component **chỉ** nói chuyện với hooks (`services/auth/hooks.ts`) và store. Không component nào import `token-store`, `services/client` hay `services/auth/api`.
- `services/auth/api.ts` **chỉ** biết endpoint và shape, không biết storage, không biết cache.
- Tầng phân chia theo `docs/data-layer.md` — auth là feature mẫu.
- `lib/auth/token-store.ts` là nơi **duy nhất** chạm `localStorage`.

---

## 3. API contract

Nguồn sự thật: OpenAPI spec của backend tại `http://localhost:3101/docs` (JSON thô: `/docs-json`). Toàn bộ contract được cô lập trong `services/auth/api.ts` — một hàm cho một operation.

Path **không có tiền tố** (`/auth/login`, không phải `/api/auth/login`) → `NEXT_PUBLIC_API_BASE_URL=http://localhost:3101`.

| Method | Endpoint | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/auth/register` | — | `RegisterDto` `{ email, password, displayName? }` | `201 AuthSessionDto` · 409 `EMAIL_TAKEN` |
| POST | `/auth/login` | — | `LoginDto` `{ email, password }` | `200 AuthSessionDto` · 401 `INVALID_CREDENTIALS` |
| POST | `/auth/refresh` | — | `{ refreshToken }` | `200 TokenPairDto` · 401 `INVALID_TOKEN` |
| POST | `/auth/logout` | — | `{ refreshToken }` | `204` |
| POST | `/auth/logout-all` | Bearer | — | `204` |
| GET | `/auth/me` | Bearer | — | `200 UserDto` (trả thẳng user, **không** bọc `{ user }`) |
| POST | `/auth/verify-email` | — | `{ token }` | `204` · 400 `INVALID_TOKEN` |
| POST | `/auth/verify-email/resend` | — | `{ email }` | `204` (luôn 204) |
| POST | `/auth/forgot-password` | — | `{ email }` | `204` (luôn 204) |
| POST | `/auth/reset-password` | — | `{ token, newPassword }` | `204` · 400 `INVALID_TOKEN` |
| POST | `/auth/change-password` | Bearer | `{ currentPassword, newPassword }` | `200 AuthSessionDto` · 400 `PASSWORD_NOT_SET` |
| GET | `/auth/oauth/{provider}` | — | — | `302` → Google/GitHub |
| POST | `/auth/oauth/exchange` | — | `{ code }` | `200 AuthSessionDto` · 403 `OAUTH_ACCOUNT_LINK_FORBIDDEN` |

Mọi endpoint đều có thể trả `429 RATE_LIMITED`.

**Kiểu dữ liệu** (`services/auth/types.ts`, zod ở `services/auth/schemas.ts`):

```ts
type User = {
  id: string; email: string; emailVerified: boolean;
  role: "user" | "admin";
  displayName: string | null; avatarUrl: string | null;
  createdAt: string;
};
type AuthTokens = {
  accessToken: string; refreshToken: string;
  expiresIn: number;   // TTL access token, giây (900)
  tokenType: string;   // "Bearer"
};
type AuthSession = AuthTokens & { user: User };
type ApiErrorBody = {
  code: string;        // mã ổn định — switch trên trường này
  message: string;     // chỉ để hiển thị, đừng parse
  statusCode: number;
  details?: string[];  // chỉ với VALIDATION_FAILED, dạng ["email must be an email"]
};
```

### 3.1 Ràng buộc từ DTO phải khớp form schema

- `password`: **12–128 ký tự**, không ép ký tự đặc biệt. Form schema để 8 là backend sẽ trả `VALIDATION_FAILED` sau khi form đã báo hợp lệ.
- `email`: tối đa 320 ký tự · `displayName`: tối đa 255, **optional**.

### 3.2 Ba hành vi của backend ràng buộc thiết kế client

1. **Refresh token xoay vòng, và trình lại token cũ thu hồi TOÀN BỘ phiên.** Nên single-flight ở `services/client.ts` không phải tối ưu hiệu năng mà là điều kiện đúng đắn: N request cùng 401 mà gọi refresh song song là mất phiên thật.
2. **`/auth/change-password` giết mọi phiên cũ và trả phiên mới.** Client bắt buộc ghi đè cặp token bằng cặp trả về (`useChangePassword` làm việc này), nếu không request kế tiếp sẽ 401.
3. **`/auth/logout` chỉ thu hồi refresh token gửi lên**; access token hiện tại vẫn sống tới khi hết hạn (≤15 phút). Cần chặn ngay lập tức thì dùng `/auth/logout-all`.

### 3.3 Luồng OAuth (đã đổi so với thiết kế ban đầu)

Token **không bao giờ đi qua URL**. Luồng thật là handoff code:

```
OAuthButtons  ──window.location──▶  GET /auth/oauth/{provider}
                                      (backend đặt cookie httpOnly: state + PKCE)
                                          │ 302
                                          ▼
                                    Google / GitHub
                                          │ 302 về backend
                                          ▼
                                    backend redirect  ──▶  /auth/callback?code=…
                                                              │
                    POST /auth/oauth/exchange { code }  ◀─────┘
                                          │ 200 AuthSessionDto
                                          ▼
                                    setSession → /dashboard
```

- Handoff code **dùng một lần, hết hạn 60 giây** → `OAuthCallback` chặn effect chạy lần hai bằng `useRef`, nếu không lần thứ hai nhận `INVALID_TOKEN` và ghi đè kết quả thành công.
- Spec **không nhận `redirect_uri`** — callback URL do backend cấu hình. Muốn quay lại đúng trang sau đăng nhập thì gửi `next` qua `sessionStorage` (`rememberOAuthNext` / `takeOAuthNext` trong `lib/auth/redirect.ts`), không qua query string.
- Cookie `state`/PKCE là httpOnly, ngắn hạn, chỉ sống trong lúc bắt tay — đây là chỗ **duy nhất** trong API dùng cookie.

---

## 4. Thiết kế chi tiết

### 4.1 `lib/auth/token-store.ts` — biên cô lập

Access token nằm trong biến module (memory): reload là mất, nhưng bù lại XSS kiểu "đọc storage" không lấy được nó. Refresh token buộc phải bền qua reload nên nằm ở `localStorage`.

```ts
let accessToken: string | null = null;
const REFRESH_KEY = "nh.refresh";

export const tokenStore = {
  getAccess: () => accessToken,
  setTokens(t: AuthTokens) {
    accessToken = t.accessToken;
    localStorage.setItem(REFRESH_KEY, t.refreshToken);
  },
  getRefresh: () =>
    typeof window === "undefined" ? null : localStorage.getItem(REFRESH_KEY),
  clear() {
    accessToken = null;
    localStorage.removeItem(REFRESH_KEY);
  },
};
```

**Đồng bộ đa tab:** đăng ký `window.addEventListener("storage", …)`; khi `REFRESH_KEY` bị xoá ở tab khác → tab hiện tại `reset()` store và điều hướng về `/login`.

### 4.2 `services/client.ts` — HTTP client (axios)

Nền là **axios**: một instance `http` (`baseURL = API_BASE_URL`) cộng hai interceptor. Tầng api dùng thẳng `http.get` / `http.post`; hai option riêng của app (`authRequired`, `schema`) được thêm vào `AxiosRequestConfig` bằng module augmentation nên không cần wrapper nào.

Trách nhiệm:
- `baseURL` = `API_BASE_URL` (`services/config.ts`, đọc từ `NEXT_PUBLIC_API_BASE_URL`).
- **Request interceptor**: gắn `Authorization: Bearer <access>` khi request có cờ `authRequired`.
- **Response interceptor**: xử lý 401 → refresh → retry, và chuẩn hoá **mọi** lỗi thành `ApiError` mang `status`, `code`, `message`, `details` (dựng từ `ErrorResponseDto`).
- Response interceptor còn lo hai quy ước: validate bằng zod khi config có `schema`, và `204 → undefined` (axios trả chuỗi rỗng cho body rỗng).

Ba chi tiết riêng của axios, dễ sai:

- **Không đặt tên cờ là `auth`.** Axios đã lấy key `auth` cho HTTP Basic (`{ username, password }`). Cờ nội bộ tên `authRequired`; `ApiFetchOptions.auth` chỉ là tên ở bề mặt API, được map sang.
- **Lỗi mạng không có `error.response`.** Nhánh đó → `ApiError(0, NETWORK_ERROR)`, không được đọc `error.response.status`.
- **Huỷ request phải để nguyên.** `axios.isCancel(error)` → ném lại `CanceledError`, không bọc thành `ApiError`, nếu không React Query hiểu nhầm abort là lỗi thật.

**Refresh flow khi gặp 401:**

```
request → 401
   │
   ├─ không có refresh token ──────────────▶ clear + reset + →/login
   │
   ├─ đã có refreshPromise đang chạy ──────▶ await promise đó   ← single-flight
   │
   └─ chưa có ─▶ tạo refreshPromise = POST /auth/refresh
                    │
                    ├─ OK  → setTokens(mới) → retry request gốc ĐÚNG 1 LẦN
                    └─ lỗi → clear + reset + →/login
```

Hai chi tiết dễ sai, phải làm đúng:

- **Single-flight.** Giữ `let refreshPromise: Promise<AuthTokens> | null`. Nếu 5 request cùng nhận 401, chỉ **một** lần gọi `/auth/refresh`; 4 request còn lại `await` chung promise. Không có cơ chế này, với refresh token rotate thì 4 request kia sẽ dùng token đã bị vô hiệu hoá → logout oan. Nhớ `finally { refreshPromise = null }`.
- **Retry đúng một lần.** Dùng cờ `isRetry` gắn trên chính `error.config` rồi `http.request(config)` lại. Nếu không, 401 lặp lại sẽ thành vòng lặp vô hạn đập backend.

`/auth/refresh` gọi bằng **instance axios riêng** (`refreshHttp`) — instance đó không gắn interceptor 401 nên không thể đệ quy vào chính nó.

### 4.3 `services/auth/api.ts`

Một hàm mỏng cho mỗi endpoint ở §3, gọi `http.get/post` rồi trả `data` đã typed và đã qua zod. Đây là toàn bộ bề mặt tiếp xúc với backend — chỗ duy nhất phải sửa khi có contract thật.

### 4.4 `lib/auth/store.ts` — zustand

```ts
type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";
type AuthState = {
  user: User | null;
  status: AuthStatus;
  bootstrap(): Promise<void>;
  login(input: LoginInput): Promise<void>;
  register(input: RegisterInput): Promise<void>;
  logout(): Promise<void>;
  setSession(tokens: AuthTokens, user?: User): Promise<void>;
  reset(): void;
};
```

Máy trạng thái:

```
idle ──bootstrap()──▶ loading ──┬─ có refresh + refresh OK ─▶ authenticated
                                └─ không / lỗi ────────────▶ unauthenticated

unauthenticated ──login() OK──▶ authenticated
authenticated ──logout() | refresh fail──▶ unauthenticated
```

`bootstrap()` là mắt xích quan trọng nhất và cũng hay bị bỏ sót: chạy một lần lúc app mount, nếu có refresh token thì gọi `/auth/me` để khôi phục phiên (access token chỉ nằm trong memory nên sau reload nó rỗng → 401 → interceptor tự refresh rồi retry). Thiếu nó, người dùng F5 là văng ra `/login`.

#### Session epoch — chống phiên cũ đè phiên mới

`bootstrap()` là async nên có thể **resolve sau** một phiên mới hơn. Ca lỗi thật đã gặp khi verify: vào `/auth/callback` trong lúc `localStorage` còn phiên cũ → `bootstrap()` chạy trước, `setSession()` ghi phiên OAuth, rồi `bootstrap()` resolve và **ghi đè lại user cũ** — dashboard hiện sai người dùng.

Khắc phục bằng biến đếm `sessionEpoch` ở module scope: `login` / `register` / `setSession` / `reset` đều tăng nó; `bootstrap()` chụp giá trị lúc bắt đầu và chỉ ghi kết quả nếu epoch chưa đổi.

`logout()` gọi API rồi clear — nhưng **clear cả khi API lỗi** (mạng hỏng không được phép giữ người dùng trong trạng thái đăng nhập).

### 4.5 Bảo vệ route

Hai component client, không dùng `proxy.ts` (lý do §1.2).

- **`AuthProvider`** — bọc quanh `children` trong `app/layout.tsx`. Gọi `bootstrap()` trong `useEffect` một lần, render children ngay lập tức (không chặn), để phần public không bị delay.
- **`AuthGuard`** — bọc `app/(protected)/layout.tsx`:
  - `idle` / `loading` → skeleton
  - `unauthenticated` → `router.replace('/login?next=' + encodeURIComponent(pathname))`
  - `authenticated` → render children

Login xong đọc `?next=` để quay lại đúng trang. **Chỉ chấp nhận `next` là đường dẫn nội bộ bắt đầu bằng `/` và không bắt đầu bằng `//`** — nếu không sẽ thành lỗ hổng open-redirect.

### 4.6 Form và validation

Tất cả schema ở `services/auth/schemas.ts` (zod), type suy ra bằng `z.infer`. Form dùng `react-hook-form` + `zodResolver`.

| Schema | Ràng buộc |
|---|---|
| `loginSchema` | email hợp lệ, password không rỗng |
| `registerSchema` | `displayName` optional ≤ 255, email hợp lệ ≤ 320, password 12–128, `confirmPassword` khớp (`.refine`) |
| `forgotPasswordSchema` | email hợp lệ |
| `resetPasswordSchema` | `newPassword` 12–128 + confirm khớp |
| `changePasswordSchema` | `currentPassword` không rỗng, `newPassword` 12–128 + confirm khớp |

Mẫu xử lý submit dùng chung cho mọi form:

```ts
try { await mutation.mutateAsync(values) }
catch (e) {
  // knownFields: backend trả details dạng câu ("email must be an email"),
  // applyApiError lấy token đầu câu làm tên field và chỉ gắn khi field có thật.
  setFormError(applyApiError(e, setError, ["email", "password"]));
}
```

Nút submit disable khi `isSubmitting`. Client-side validation chỉ là UX — backend vẫn là nguồn chân lý.

### 4.7 OAuth

Nút OAuth **không** phải `<Link>` của Next (đây là điều hướng ra ngoài origin), và cũng không được gọi bằng `fetch` — backend đặt cookie httpOnly chứa `state` + PKCE verifier, cần điều hướng top-level:

```ts
rememberOAuthNext(next);                       // sessionStorage, xem §3.3
window.location.assign(oauthStartUrl(provider));
```

`app/auth/callback/page.tsx` (client) đọc `useSearchParams()`: có `error` thì hiện thông báo + link `/login`; có `code` thì `useOAuthExchange()` → `setSession` → `router.replace(takeOAuthNext())`.

**Bắt buộc bọc `<Suspense>`** quanh component dùng `useSearchParams`, nếu không build sẽ fail.

Token **không đi qua URL** nữa (spec dùng handoff code), nên rủi ro rò token qua history/Referer đã hết. Vẫn dùng `router.replace` để `?code=` biến khỏi history — code đã tiêu thụ mà còn nằm trong history chỉ tổ gây lỗi khi bấm back.

---

## 5. Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| 400 `VALIDATION_FAILED` kèm `details` | Map từng câu vào đúng input (xem §4.6); câu không khớp field nào → banner |
| 409 `EMAIL_TAKEN` / 401 `INVALID_CREDENTIALS` | Banner theo `message` của backend |
| 429 `RATE_LIMITED` | Banner "thao tác quá nhanh"; **không** retry tự động |
| 401 trên request thường | Refresh → retry 1 lần → thất bại thì logout |
| 401 trên chính `/auth/refresh` | Logout ngay, về `/login` |
| 403 | Hiện "Không có quyền", **không** logout |
| 5xx / mất mạng | Banner lỗi chung + nút thử lại; giữ nguyên phiên |
| Backend trả shape lạ | zod ném lỗi → banner lỗi chung, log console |

---

## 6. Cấu trúc file

Path alias `@/*` trỏ về **root** (không có `src/`) → import dạng `@/services/…`, `@/lib/…`, `@/components/…`.

```
docs/auth.md                        ← tài liệu này
mocks/auth-server.mjs               ← mock backend CŨ, đã lỗi thời (§10.1)

lib/auth/redirect.ts                ← safeRedirect: chặn open-redirect
lib/forms/apply-api-error.ts        ← map ApiError → lỗi từng field

lib/auth/token-store.ts             ← BIÊN CÔ LẬP, nơi duy nhất chạm localStorage
lib/auth/store.ts                   ← zustand
services/errors.ts                  ← ApiError + ERROR_CODES (dùng chung mọi feature)
services/config.ts                  ← API_BASE_URL
services/client.ts                  ← fetch wrapper + refresh single-flight
services/auth/types.ts
services/auth/schemas.ts            ← zod
services/auth/api.ts                ← adapter tới backend (map 1-1 với OpenAPI)
services/auth/hooks.ts              ← React Query hooks (useLogin, useMe, …)

components/auth/auth-provider.tsx
components/auth/auth-guard.tsx
components/auth/login-form.tsx
components/auth/register-form.tsx
components/auth/forgot-password-form.tsx
components/auth/reset-password-form.tsx
components/auth/oauth-buttons.tsx
components/auth/oauth-callback.tsx
components/auth/logout-button.tsx
components/dashboard-content.tsx    ← trang mẫu
components/ui/{input,button,form-error}.tsx

app/layout.tsx                      ← MODIFY: bọc <AuthProvider>
app/(auth)/layout.tsx               ← layout căn giữa
app/(auth)/login/page.tsx
app/(auth)/register/page.tsx
app/(auth)/forgot-password/page.tsx
app/(auth)/reset-password/page.tsx  ← async, await searchParams
app/auth/callback/page.tsx          ← client + <Suspense>
app/(protected)/layout.tsx          ← bọc <AuthGuard>
app/(protected)/dashboard/page.tsx  ← trang mẫu để verify
```

`app/layout.tsx` giữ nguyên là server component — chỉ thêm import và bọc `{children}`.

---

## 7. Dependencies & cấu hình

```bash
pnpm add axios zod react-hook-form @hookform/resolvers zustand
```

| Package | Lý do |
|---|---|
| `axios` | HTTP client — interceptor gắn Bearer, xử lý 401 → refresh, chuẩn hoá lỗi |
| `zod` | Validate form + parse response backend |
| `react-hook-form` + `@hookform/resolvers` | Form state, ít re-render |
| `zustand` | Store toàn cục, không cần Provider boilerplate |

**Không thêm:** NextAuth/Better Auth (backend đã tự lo auth, thêm vào là trùng lặp và xung đột về nơi giữ session).

**Env** — `.env.local` (gitignored) và `.env.example` (commit):

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3101
```

Path trong spec không có tiền tố → **không** thêm `/api`. Bắt buộc prefix `NEXT_PUBLIC_` vì browser gọi thẳng. Next 16 đã **xoá** `serverRuntimeConfig`/`publicRuntimeConfig` — chỉ còn env vars.

---

## 8. Ràng buộc Next.js 16 (khác kiến thức cũ — đọc trước khi code)

Docs bundled tại `node_modules/next/dist/docs/`. Các điểm ảnh hưởng trực tiếp:

- **`middleware.ts` đã deprecated → `proxy.ts`** (`03-file-conventions/proxy.md`); hàm export tên `proxy`, runtime cố định `nodejs`, cờ đổi thành `skipProxyUrlNormalize`. Plan này không tạo file đó, nhưng đừng theo quán tính tạo `middleware.ts`.
- **`cookies()`, `headers()`, `params`, `searchParams` đều async.** Bản đồng bộ **đã bị xoá hoàn toàn** ở v16 (không còn deprecation shim như v15).

  ```tsx
  export default async function Page(props: PageProps<'/reset-password'>) {
    const { token } = await props.searchParams;
    return <ResetPasswordForm token={typeof token === 'string' ? token : ''} />;
  }
  ```
- **Global types** `PageProps<'/route'>`, `LayoutProps<'/route'>`, `RouteContext<'/route'>` có sẵn — **không import**, được sinh khi `next dev`/`next build`.
- **`next lint` đã bị xoá**; `next build` không lint nữa. Lint bằng `pnpm lint` (eslint flat config).
- **Tailwind v4**: cấu hình bằng CSS trong `app/globals.css` qua `@theme inline`. **Không** tạo `tailwind.config.js`.
- `cacheComponents` đang tắt → mô hình caching cũ vẫn áp dụng; không cần đụng tới.
- Docs cảnh báo Server Functions là POST tới chính route đó, nên auth phải check bên trong từng function — hiện chưa dùng Server Actions cho auth (client-side hết), nhưng ghi nhớ khi mở rộng.

---

## 9. Kế hoạch thực thi

| # | Bước | Kết quả kiểm được |
|---|---|---|
| 0 | Commit `docs/auth.md` | Tài liệu vào repo |
| 1 | Cài deps, tạo `.env.local` + `.env.example` | `pnpm dev` chạy |
| 2 | `types.ts`, `schemas.ts`, `token-store.ts` | `pnpm build` pass |
| 3 | `api/client.ts` (refresh + single-flight), `api/auth.ts` | — |
| 4 | `auth/store.ts` | — |
| 5 | `components/ui/*` | — |
| 6 | `AuthProvider` + wire vào `app/layout.tsx` | App vẫn render bình thường |
| 7 | `(auth)/login` + `login-form` | **Luồng end-to-end đầu tiên chạy được** |
| 8 | register / forgot / reset | 3 form còn lại |
| 9 | `oauth-buttons` + `/auth/callback` | OAuth round-trip |
| 10 | `AuthGuard` + `(protected)/dashboard` + `logout-button` | Bảo vệ route + logout |

Mốc quan trọng là **bước 7** — chạm được backend thật (hoặc mock) lần đầu; sai sót về contract lộ ra ở đây.

---

## 10. Verification

### 10.1 Trạng thái sau khi căn theo spec thật

Backend thật đã có tại `http://localhost:3101`. Code đã được sửa để khớp OpenAPI spec, **`pnpm build` + `pnpm lint` pass, nhưng chưa chạy lại kịch bản thủ công nào với backend thật** — bảng §10.2 là kết quả cũ, chạy trên mock theo contract giả định.

> `mocks/auth-server.mjs` đã **lỗi thời**: nó implement contract giả định cũ (cổng 8080, `/api` prefix, `{ user }` bọc ngoài, lỗi có `fields`, password ≥ 8). Đừng dùng để verify nữa — hoặc viết lại theo spec, hoặc xoá.

Cần chạy lại toàn bộ bảng §10.2 với backend thật, chú ý các điểm contract đã đổi: `displayName` (không phải `name`), `/auth/me` trả thẳng `UserDto`, `reset-password` dùng `newPassword`, và luồng OAuth handoff code (§3.3).

### 10.2 Kết quả kịch bản thủ công

`pnpm dev` + **mock server cũ**, thao tác qua Chrome. Đây là kết quả trước khi căn theo spec thật:

| # | Kịch bản | Kỳ vọng | KQ |
|---|---|---|---|
| 1 | Vào `/dashboard` khi chưa login | Đẩy về `/login?next=%2Fdashboard` | ✅ |
| 2 | Login sai mật khẩu | Hiện lỗi từ backend, không redirect | ✅ |
| 3 | Login đúng | Về `/dashboard` theo `?next=`, `/auth/me` trả user | ✅ |
| 4 | **F5 tại `/dashboard`** | Vẫn ở lại — `bootstrap()` đúng | ✅ |
| 5 | `/auth/me` trả 401 | Đúng **một** `/auth/refresh`, rồi retry `/auth/me` OK | ✅ |
| 6 | 5 request song song cùng 401 | Vẫn chỉ **một** `/auth/refresh` (single-flight) | ⚠️ chưa chạy được |
| 7 | Refresh token hết hạn | Về `/login`, `localStorage` sạch, không loop | ✅ |
| 8 | Logout | Gọi `/auth/logout`, clear, về `/login` | ✅ |
| 9 | Logout ở tab 1 | Tab 2 cũng bị logout (storage event) | ✅ |
| 10 | Register: tên/email/password/confirm sai | Cả 4 lỗi chặn ở client, chưa gửi request | ✅ (mock) |
| 11 | Register hợp lệ | Tạo xong tự động đăng nhập | ✅ |
| 12 | Register email trùng | 409 `EMAIL_TAKEN` → banner (backend không trả details cho case này) | ⚠️ cần chạy lại |
| 13 | Forgot password | Báo thành công chung, không tiết lộ email tồn tại | ✅ |
| 14 | Reset với `?token=…` | Đổi mật khẩu → login lại bằng mật khẩu mới | ⚠️ cần chạy lại (`newPassword`) |
| 15 | OAuth Google | Callback `?code=` → exchange → dashboard đúng user | ⚠️ cần chạy lại (luồng đã đổi) |
| 16 | OAuth bị từ chối | `/auth/callback?error=…` hiện lỗi + link về `/login` | ✅ |
| 17 | `/login?next=https://evil.com` | **Không** redirect ra ngoài | ✅ |

**#6 chưa verify được:** app chỉ phát sinh một request cần auth tại một thời điểm (`/auth/me`), nên không dựng được tình huống N request song song cùng 401 từ ngoài. Cơ chế single-flight đã có trong `services/client.ts` và đường đi một-request đã verify qua #5, nhưng **nhánh nhiều request đồng thời chưa được chạy thật**. Nên viết unit test cho interceptor của `http` khi thêm test runner.

**Bug đã phát hiện và sửa nhờ verify:** kịch bản #15 ban đầu hiện sai user (phiên cũ đè phiên OAuth) → dẫn tới cơ chế session epoch ở §4.4.

### 10.3 Build & lint

`pnpm build` và `pnpm lint` đều pass. Typegen v16 bắt lỗi `PageProps` / `searchParams` async / thiếu `<Suspense>`; ESLint của v16 có `react-hooks/set-state-in-effect` — đó là lý do `OAuthCallback` tính lỗi URL bằng `useMemo` khi render thay vì `setState` trong effect.

---

## 11. Ngoài phạm vi lần này

Service + hook đã có sẵn cho `change-password`, `verify-email`, `verify-email/resend`, `logout-all` — nhưng **chưa có màn hình nào dùng**. Còn thiếu hẳn: 2FA, phân quyền theo role, quản lý phiên đa thiết bị, rate limiting phía FE, remember-me.
