"use client";

import { useRouter } from "next/navigation";

import { Avatar } from "@noalhub/ui/avatar";
import { Button } from "@noalhub/ui/button";
import { FormError } from "@noalhub/ui/form-error";
import { Spinner } from "@noalhub/ui/spinner";
import { formatDate } from "@noalhub/core/format-date";
import { lastSeenLabel } from "@noalhub/core/chat/format";
import { ApiError, ERROR_CODES } from "@noalhub/api/errors";
import { useAuthStore } from "@noalhub/api/auth";
import { useCreateDirectConversation } from "@noalhub/api/chat";
import { usePublicProfile } from "@noalhub/api/users";
import type { PublicProfile } from "@noalhub/api/users";

/**
 * Hồ sơ công khai của người khác (`GET /users/{username}`).
 *
 * Ít trường hơn hồ sơ của chính mình — không email, không vai trò. Trang riêng
 * cho mình là `/profile`.
 */
export function PublicProfileContent({ username }: { username: string }) {
  const { data, isPending, error } = usePublicProfile(username);

  if (isPending) {
    return (
      <main
        role="status"
        className="flex flex-1 items-center justify-center gap-2 p-8 text-sm opacity-70"
      >
        <Spinner />
        Đang tải hồ sơ…
      </main>
    );
  }

  if (error) {
    const notFound =
      error instanceof ApiError && error.code === ERROR_CODES.userNotFound;
    return (
      <main className="mx-auto w-full max-w-3xl p-8">
        <FormError
          message={
            notFound
              ? `Không tìm thấy người dùng @${username}.`
              : "Không tải được hồ sơ."
          }
        />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 p-8">
      <header className="flex items-center gap-4">
        <Avatar
          name={data.displayName ?? data.username}
          src={data.avatarUrl}
          size="lg"
        />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold">
            {data.displayName ?? data.username}
          </h1>
          <p className="truncate font-mono text-sm opacity-70">@{data.username}</p>
        </div>
        <MessageButton user={data} />
      </header>

      <dl className="grid gap-3 rounded-lg border border-black/10 p-4 text-sm dark:border-white/15">
        <div className="flex justify-between gap-4">
          <dt className="opacity-70">Tham gia</dt>
          <dd>{formatDate(data.createdAt)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="opacity-70">Hoạt động gần nhất</dt>
          {/* Mốc offline gần nhất, KHÔNG phải trạng thái online hiện tại. */}
          <dd>{lastSeenLabel(data.lastSeenAt) ?? "Chưa từng online"}</dd>
        </div>
      </dl>
    </main>
  );
}

/**
 * Mở DM với người này.
 *
 * `POST /chat/conversations/direct` là **idempotent** — đã có hội thoại thì trả
 * về đúng cái cũ, chưa có thì tạo. Nên không cần dò danh sách trước: cứ gọi rồi
 * điều hướng theo `id` trả về. Hook đã ghi hội thoại vào cache và invalidate
 * danh sách, nên sidebar tự có mục mới.
 */
function MessageButton({ user }: { user: PublicProfile }) {
  const router = useRouter();
  const myId = useAuthStore((s) => s.user?.id ?? null);
  const createDirect = useCreateDirectConversation();

  // Hồ sơ của chính mình thì không có DM để mở.
  if (myId && myId === user.id) return null;

  return (
    <div className="ml-auto flex flex-col items-end gap-1">
      <Button
        disabled={createDirect.isPending}
        onClick={() =>
          createDirect.mutate(user.id, {
            onSuccess: (conversation) => router.push(`/chat/${conversation.id}`),
          })
        }
      >
        {createDirect.isPending ? "Đang mở…" : "Nhắn tin"}
      </Button>
      {createDirect.isError ? (
        <span role="alert" className="text-xs text-red-600 dark:text-red-400">
          {dmErrorMessage(createDirect.error)}
        </span>
      ) : null}
    </div>
  );
}

function dmErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case ERROR_CODES.recipientNotFound:
        return "Người này không còn tồn tại.";
      case ERROR_CODES.cannotDmSelf:
        return "Không thể tự nhắn cho chính mình.";
      case ERROR_CODES.rateLimited:
        return "Bạn thao tác hơi nhanh, thử lại sau ít phút.";
    }
  }
  return "Không mở được hội thoại, thử lại sau.";
}
