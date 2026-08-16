"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormError, FormSuccess } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/lib/auth/store";
import { ApiError, ERROR_CODES } from "@/services/errors";
import {
  useFindUserByUsername,
  useFriendRequests,
  useFriends,
  useSendFriendRequest,
} from "@/services/friends/hooks";
import {
  findFriendSchema,
  type FindFriendInput,
} from "@/services/friends/schemas";
import type { FriendState } from "@/services/friends/types";
import type { PublicProfile } from "@/services/users/types";

/**
 * Tìm bạn theo username.
 *
 * Khớp **tuyệt đối** (`GET /users/{username}`): nhập đúng mới ra, backend không
 * có tìm mờ. Vì vậy chỉ tìm khi submit — gõ dở dang mà bắn request thì vừa tốn
 * vừa luôn 404.
 */
export function FindFriendDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [submitted, setSubmitted] = useState<string | undefined>();
  const { data, isFetching, error } = useFindUserByUsername(submitted);
  const state = useFriendState(data?.username);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FindFriendInput>({ resolver: zodResolver(findFriendSchema) });

  const onSubmit = handleSubmit((values) => setSubmitted(values.username));

  function close() {
    // Mở lại là một lượt tìm mới — đừng để kết quả của người trước còn nằm đó.
    setSubmitted(undefined);
    reset();
    onClose();
  }

  const notFound =
    error instanceof ApiError && error.code === ERROR_CODES.userNotFound;

  return (
    <Dialog open={open} onClose={close} title="Tìm bạn theo username">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex items-end gap-2">
          <span className="flex-1">
            <Input
              label="Username"
              placeholder="vd: nghia-pham"
              autoComplete="off"
              spellCheck={false}
              error={errors.username?.message}
              {...register("username")}
            />
          </span>
          <Button type="submit" disabled={isFetching} className="mb-[1px]">
            {isFetching ? "Đang tìm…" : "Tìm"}
          </Button>
        </div>

        <p className="text-xs opacity-60">
          Phải nhập đúng username, không tìm theo tên hiển thị.
        </p>
      </form>

      {isFetching ? (
        <p role="status" className="flex items-center gap-2 text-sm opacity-70">
          <Spinner />
          Đang tìm…
        </p>
      ) : notFound ? (
        <FormError message={`Không tìm thấy ai với username @${submitted}.`} />
      ) : error ? (
        <FormError message="Không tìm được, thử lại sau." />
      ) : data ? (
        <SearchResult user={data} state={state} />
      ) : null}
    </Dialog>
  );
}

/**
 * Quan hệ với người vừa tìm.
 *
 * `PublicProfileDto` KHÔNG kèm trạng thái quan hệ, nên suy từ ba danh sách đã
 * có sẵn trong cache. `null` = mình, không phải "chưa quen".
 */
function useFriendState(username: string | undefined): FriendState | null {
  const me = useAuthStore((s) => s.user?.username ?? null);
  const friends = useFriends();
  const incoming = useFriendRequests("incoming");
  const outgoing = useFriendRequests("outgoing");

  if (!username) return "none";
  if (username === me) return null;

  const has = (list: { items: { user: { username: string } }[] } | undefined) =>
    Boolean(list?.items.some((item) => item.user.username === username));

  if (has(friends.data)) return "friends";
  if (has(incoming.data)) return "pending_incoming";
  if (has(outgoing.data)) return "pending_outgoing";
  return "none";
}

function SearchResult({
  user,
  state,
}: {
  user: PublicProfile;
  state: FriendState | null;
}) {
  const sendRequest = useSendFriendRequest();
  const name = user.displayName ?? user.username;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-black/10 p-3 dark:border-white/15">
      <div className="flex items-center gap-3">
        <Avatar name={name} src={user.avatarUrl} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">{name}</span>
          <Link
            href={`/profile/${user.username}`}
            className="truncate font-mono text-xs opacity-60 underline-offset-4 hover:underline"
          >
            @{user.username}
          </Link>
        </div>
      </div>

      {sendRequest.isError ? (
        <FormError message={sendErrorMessage(sendRequest.error)} />
      ) : sendRequest.isSuccess ? (
        // Hai bên cùng bấm kết bạn thì backend nối luôn — đọc `state` của
        // response chứ đừng đoán là "đang chờ".
        <FormSuccess
          message={
            sendRequest.data.state === "friends"
              ? "Hai bạn đã thành bạn bè."
              : "Đã gửi lời mời kết bạn."
          }
        />
      ) : null}

      <FriendshipAction
        state={state}
        pending={sendRequest.isPending || sendRequest.isSuccess}
        onSend={() => sendRequest.mutate(user.username)}
      />
    </div>
  );
}

function sendErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case ERROR_CODES.alreadyFriends:
        return "Hai bạn đã là bạn bè.";
      case ERROR_CODES.friendRequestExists:
        return "Lời mời đã tồn tại.";
      case ERROR_CODES.cannotFriendSelf:
        return "Không thể tự kết bạn với chính mình.";
      case ERROR_CODES.rateLimited:
        return "Bạn thao tác hơi nhanh, thử lại sau ít phút.";
    }
  }
  return "Không gửi được lời mời, thử lại sau.";
}

/** Trạng thái quan hệ quyết định hiện gì — không phải lúc nào cũng "Kết bạn". */
function FriendshipAction({
  state,
  pending,
  onSend,
}: {
  state: FriendState | null;
  pending: boolean;
  onSend: () => void;
}) {
  switch (state) {
    case null:
      return <p className="text-sm opacity-70">Đây là bạn.</p>;
    case "friends":
      return <p className="text-sm opacity-70">Hai bạn đã là bạn bè.</p>;
    case "pending_outgoing":
      return <p className="text-sm opacity-70">Đã gửi lời mời, đang chờ phản hồi.</p>;
    case "pending_incoming":
      return (
        <p className="text-sm opacity-70">
          Người này đã gửi lời mời cho bạn — mở “Lời mời kết bạn” để phản hồi.
        </p>
      );
    default:
      return (
        <div>
          <Button onClick={onSend} disabled={pending}>
            {pending ? "Đang gửi…" : "Gửi lời mời kết bạn"}
          </Button>
        </div>
      );
  }
}
