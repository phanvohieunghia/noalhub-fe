# Data Layer Convention — types → api → hooks

| | |
|---|---|
| **Status** | Bắt buộc áp dụng cho **mọi feature mới** |
| **Ngày** | 2026-07-25 |
| **Phạm vi** | Cách định nghĩa kiểu dữ liệu, hàm gọi API, và React Query hooks |
| **Liên quan** | [`docs/auth.md`](./auth.md) — auth là feature mẫu, đã theo đủ convention này |
| **Contract** | OpenAPI spec: `http://localhost:3101/docs` (JSON: `/docs-json`) |

---

## 1. Nguyên tắc

Mỗi feature chạm backend được chia thành **ba tầng, ba file**, theo đúng thứ tự phụ thuộc:

```
types + schemas  ──▶  api (transport)  ──▶  hooks (React Query)  ──▶  components
```

**Cả ba tầng nằm trong `services/<feature>/`** — types, api, hooks đi cùng nhau, không rải sang `lib/`:

```
services/
  client.ts                 ← axios instance + interceptor (Bearer, 401 → refresh)
  errors.ts                 ← ApiError, ERROR_CODES, ApiErrorBody
  config.ts                 ← API_BASE_URL
  <feature>/
    types.ts
    schemas.ts
    api.ts
    hooks.ts
```

| Tầng | File | Trách nhiệm | KHÔNG được làm |
|---|---|---|---|
| **Types** | `services/<feature>/types.ts`<br>`services/<feature>/schemas.ts` | Shape dữ liệu + zod schema (validate response, validate form input) | Không import React, không gọi fetch |
| **API** | `services/<feature>/api.ts` | Một hàm cho một endpoint, gọi `http.get/post`. Nhận input đã typed, trả `Promise<T>` đã validate | Không biết React Query, không cache, không toast/redirect |
| **Hooks** | `services/<feature>/hooks.ts` | `useQuery` / `useMutation`, query key, invalidate | Không gọi `axios`/`fetch` trực tiếp, không chứa JSX |
| **Components** | `components/<feature>/*.tsx` | Render + gọi hook | **Không được import `api.ts` hay `client.ts`** |

`lib/` chỉ giữ thứ **không** thuộc data layer: state store, token store, helper form, tiện ích điều hướng.

Quy tắc cứng: **component chỉ nói chuyện với `hooks.ts`** (cộng `types.ts` / `schemas.ts` khi cần kiểu và resolver, và `services/errors.ts` khi cần bắt `ApiError`). Nhờ vậy đổi transport (BFF proxy, đổi endpoint, đổi schema) chỉ sửa tầng dưới, không đụng UI.

### 1.1 Vì sao tách api ra khỏi hooks

Tầng api là nơi duy nhất mô tả contract với backend. Mỗi hàm map 1-1 với một operation trong OpenAPI spec; backend đổi contract thì chỉ `services/*` phải sửa. Nếu nhét `fetch` vào trong `useQuery` thì contract bị rải khắp app và không test/tái dùng được ngoài React (script, server action, seed data).

---

## 2. Setup (làm một lần)

```bash
pnpm add axios @tanstack/react-query
pnpm add -D @tanstack/react-query-devtools
```

### 2.1 Provider

`components/providers/query-provider.tsx`:

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { ApiError } from "@/services/errors";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Dữ liệu coi là "tươi" 30s — chặn refetch thừa khi điều hướng qua lại.
        staleTime: 30_000,
        // 4xx là lỗi contract/nghiệp vụ, retry chỉ tốn request. 401 đã được
        // services/client.ts tự refresh + retry một lần ở tầng dưới rồi.
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
            return false;
          }
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // useState → mỗi lần mount tạo đúng một client. KHÔNG khai báo ở module
  // scope: trên server sẽ bị chia sẻ giữa các request → rò rỉ dữ liệu user.
  const [client] = useState(makeQueryClient);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

Gắn trong `app/layout.tsx`, **bọc ngoài** `AuthProvider` (auth store dùng để quyết định `enabled` của query):

```tsx
<QueryProvider>
  <AuthProvider>{children}</AuthProvider>
</QueryProvider>
```

### 2.2 Reset cache khi logout

Cache của React Query là dữ liệu của **một** user. Khi logout phải xoá sạch, nếu không user kế tiếp đăng nhập trên cùng tab sẽ thấy dữ liệu cũ trong một nhịp:

```ts
const queryClient = useQueryClient();
// sau khi clear token + store
queryClient.clear();
```

### 2.3 `services/client.ts` — axios

Transport là **axios**. `services/client.ts` giữ một instance `http` với `baseURL = API_BASE_URL` và hai interceptor:

- **request** — gắn `Authorization: Bearer <access>` khi request có cờ `authRequired`.
- **response** — 401 → refresh (single-flight) → retry đúng một lần; mọi lỗi còn lại chuẩn hoá thành `ApiError`.

Tầng api gọi **thẳng `http.get` / `http.post`** — không có wrapper `apiFetch` nào. Hai nhu cầu riêng của app được cắm vào chính config của axios bằng module augmentation trong `client.ts`:

```ts
declare module "axios" {
  export interface AxiosRequestConfig {
    authRequired?: boolean;   // gắn Bearer + bật refresh-on-401
    schema?: ZodType<any>;    // validate response bằng zod
    isRetry?: boolean;        // nội bộ: đã retry sau refresh
  }
}
```

Nhờ vậy `http.get("/projects", { authRequired: true, schema: projectListSchema })` là axios thuần, không phải học API riêng. Response interceptor lo `schema.parse` và quy ước `204 → undefined`.

Ba điểm riêng của axios, ghi ở đây để khỏi vấp lại:

- Cờ tên `authRequired`, **không** phải `auth` — axios đã dùng key `auth` cho HTTP Basic.
- Lỗi mạng không có `error.response`; nhánh đó trả `ApiError(0, NETWORK_ERROR)`.
- `axios.isCancel(error)` → ném lại nguyên `CanceledError`, đừng bọc thành `ApiError`, nếu không React Query hiểu nhầm abort là lỗi thật.

---

## 3. Template cho một feature mới

Ví dụ feature `project`.

### 3.1 `services/project/types.ts`

```ts
export type Project = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
};

export type ProjectListQuery = {
  page?: number;
  search?: string;
};
```

### 3.2 `services/project/schemas.ts`

```ts
import { z } from "zod";

/** Validate response — bắt backend đổi shape ngay tại chỗ, không để lỗi trôi vào UI. */
export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  ownerId: z.string(),
  createdAt: z.string(),
});

export const projectListSchema = z.object({
  items: z.array(projectSchema),
  total: z.number(),
});

/** Validate input — dùng chung cho react-hook-form resolver và tầng api. */
export const createProjectSchema = z.object({
  name: z.string().min(1, "Tên dự án không được để trống").max(120),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
```

### 3.3 `services/project/api.ts`

```ts
import { http } from "../client";
import { projectListSchema, projectSchema } from "./schemas";
import type { CreateProjectInput } from "./schemas";
import type { Project, ProjectListQuery } from "./types";

type ProjectList = { items: Project[]; total: number };

export async function listProjects(
  query: ProjectListQuery = {},
  signal?: AbortSignal,
): Promise<ProjectList> {
  const { data } = await http.get<ProjectList>("/projects", {
    // Để axios serialize query string — không tự ghép chuỗi.
    params: query,
    authRequired: true,
    schema: projectListSchema,
    signal,
  });
  return data;
}

export async function getProject(
  id: string,
  signal?: AbortSignal,
): Promise<Project> {
  const { data } = await http.get<Project>(`/projects/${id}`, {
    authRequired: true,
    schema: projectSchema,
    signal,
  });
  return data;
}

export async function createProject(
  input: CreateProjectInput,
): Promise<Project> {
  const { data } = await http.post<Project>("/projects", input, {
    authRequired: true,
    schema: projectSchema,
  });
  return data;
}

export async function deleteProject(id: string): Promise<void> {
  await http.delete(`/projects/${id}`, { authRequired: true });
}
```

Quy tắc tầng api:

- Một hàm = một endpoint, đặt tên theo **hành động** (`listProjects`, `createProject`), không theo HTTP verb.
- Luôn truyền `schema` cho response có body. Không có schema = không có bảo vệ khi backend đổi field.
- Query function nhận `signal` để React Query huỷ được request.
- `authRequired: true` cho mọi endpoint cần đăng nhập — `services/client.ts` lo gắn token, refresh 401 và single-flight.
- Trả `data` từ response axios, đừng trả cả `AxiosResponse` — tầng trên không cần biết transport.

### 3.4 `services/project/hooks.ts`

```ts
"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

import * as projectApi from "./api";
import type { CreateProjectInput } from "./schemas";
import type { Project, ProjectListQuery } from "./types";

/**
 * Query key factory — nguồn sự thật DUY NHẤT cho key của feature này.
 * Viết key rời rạc ở nhiều nơi là nguyên nhân số một của "invalidate không ăn".
 */
export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (query: ProjectListQuery) => [...projectKeys.lists(), query] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
};

export function useProjects(query: ProjectListQuery = {}) {
  return useQuery({
    queryKey: projectKeys.list(query),
    queryFn: ({ signal }) => projectApi.listProjects(query, signal),
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: projectKeys.detail(id ?? ""),
    queryFn: ({ signal }) => projectApi.getProject(id!, signal),
    enabled: Boolean(id),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProjectInput) => projectApi.createProject(input),
    onSuccess: (project) => {
      // Ghi thẳng detail vào cache: mở trang chi tiết ngay sau khi tạo
      // không phải fetch lại.
      queryClient.setQueryData(projectKeys.detail(project.id), project);
      // Invalidate mọi list bất kể filter/page.
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectApi.deleteProject(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: projectKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}
```

Quy tắc tầng hooks:

- Hook đặt tên `use<Danh từ>` cho query, `use<Động từ><Danh từ>` cho mutation.
- **Luôn** có query key factory; không hardcode mảng key trong hook.
- Key phải chứa mọi biến ảnh hưởng tới kết quả (filter, page, id). Thiếu → hai màn hình khác nhau dùng chung cache.
- Hooks không hiển thị lỗi, không redirect. Đó là việc của component.

### 3.5 Component

```tsx
"use client";

import { useProjects } from "@/services/project/hooks";

export function ProjectList() {
  const { data, isPending, error } = useProjects({ page: 1 });

  if (isPending) return <p>Đang tải…</p>;
  if (error) return <p role="alert">{errorMessage(error)}</p>;

  return (
    <ul>
      {data.items.map((p) => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  );
}
```

---

## 4. Xử lý lỗi

Mọi lỗi từ tầng api là `ApiError` (`services/errors.ts` — contract lỗi dùng chung, component/provider import trực tiếp được), dựng từ `ErrorResponseDto`:

| Trường | Dùng để |
|---|---|
| `code` | **Switch trên trường này.** Mã ổn định, đổi giá trị là breaking change. Hằng số ở `ERROR_CODES` |
| `message` | Chỉ để hiển thị. Có thể đổi bất cứ lúc nào — đừng parse |
| `status` | HTTP status |
| `details` | Chỉ có với `VALIDATION_FAILED`. Là **mảng câu** (`["email must be an email"]`), KHÔNG phải map field → message |

- **Form + mutation**: dùng `applyApiError(error, setError, knownFields)` trong `lib/forms/apply-api-error.ts`. Nó lấy token đầu mỗi câu trong `details` làm tên field (quy ước class-validator); field nào không có trong `knownFields` thì dồn lên banner thay vì mất tăm. **Phải truyền `knownFields`** — thiếu là mọi lỗi validate rơi hết lên banner.

  ```tsx
  const { mutateAsync } = useCreateProject();
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(values: CreateProjectInput) {
    try {
      await mutateAsync(values);
    } catch (error) {
      setFormError(applyApiError(error, setError, ["name"]));
    }
  }
  ```

  Dùng `mutateAsync` + `try/catch` khi cần map lỗi vào form; dùng `mutate` khi chỉ cần `onError` đơn giản.

- **Query**: đọc `error` từ hook, render inline. Không nuốt lỗi im lặng.
- **401**: không xử lý ở feature. `services/client.ts` tự refresh, và khi refresh hỏng thì gọi `onSessionExpired` → auth store logout + redirect.

---

## 5. Checklist cho mỗi feature mới

- [ ] `services/<feature>/types.ts` — type thuần, không phụ thuộc React/fetch
- [ ] `services/<feature>/schemas.ts` — zod cho **cả** response và form input
- [ ] `services/<feature>/api.ts` — một hàm/endpoint, có `schema`, có `auth`, nhận `signal`
- [ ] `services/<feature>/hooks.ts` — `<feature>Keys` factory + hooks
- [ ] Mutation nào đổi dữ liệu đều `invalidateQueries` đúng scope
- [ ] Component **không** import `api.ts` / `client.ts` — chỉ `hooks.ts`
- [ ] Đối chiếu lại với `/docs-json` — ràng buộc trong zod form schema (min/max) phải KHỚP DTO, nếu không backend trả `VALIDATION_FAILED` sau khi form đã báo hợp lệ

---

## 6. Những thứ cố tình KHÔNG làm

| Không dùng | Lý do |
|---|---|
| SSR prefetch / `HydrationBoundary` | Token nằm ở client (`docs/auth.md` §1.2) — server không đọc được, không fetch hộ được |
| `useSuspenseQuery` | Cần streaming SSR để phát huy; với client-only fetch thì chỉ làm khó xử lý lỗi |
| Optimistic update mặc định | Chỉ thêm khi UX thực sự cần (toggle, reorder). Mặc định là invalidate cho đúng |
| Gọi `fetch`/`axios` thẳng, ngoài `services/<feature>/api.ts` | Mất refresh token, mất validate, mất chuẩn hoá lỗi |
