"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormError } from "@/components/ui/form-error";
import { Spinner } from "@/components/ui/spinner";
import { formatDate } from "@/lib/format-date";
import {
  useAcceptFriendRequest,
  useFriendRequests,
  useRemoveFriendRequest,
} from "@/services/friends/hooks";
import type { Friend } from "@/services/friends/types";

/**
 * Lời mời kết bạn đang chờ.
 *
 * Hai chiều là hai endpoint riêng (`?direction=`) nên gọi hai query — chiều đến
 * là thứ cần hành động, để lên trên.
 */
export function FriendRequestsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const incoming = useFriendRequests("incoming");
  const outgoing = useFriendRequests("outgoing");

  const isPending = incoming.isPending || outgoing.isPending;
  const error = incoming.error ?? outgoing.error;
  const empty =
    (incoming.data?.total ?? 0) === 0 && (outgoing.data?.total ?? 0) === 0;

  return (
    <Dialog open={open} onClose={onClose} title="Lời mời kết bạn">
      {isPending ? (
        <p role="status" className="flex items-center gap-2 py-4 text-sm opacity-70">
          <Spinner />
          Đang tải…
        </p>
      ) : error ? (
        <FormError message="Không tải được danh sách lời mời." />
      ) : empty ? (
        <p className="py-4 text-sm opacity-70">Chưa có lời mời nào đang chờ.</p>
      ) : (
        <div className="flex flex-col gap-5">
          {incoming.data && incoming.data.items.length > 0 ? (
            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-medium tracking-wide uppercase opacity-60">
                Đang chờ bạn phản hồi
              </h3>
              <ul className="flex flex-col gap-2">
                {incoming.data.items.map((friend) => (
                  <IncomingRow key={friend.user.id} friend={friend} />
                ))}
              </ul>
            </section>
          ) : null}

          {outgoing.data && outgoing.data.items.length > 0 ? (
            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-medium tracking-wide uppercase opacity-60">
                Bạn đã gửi
              </h3>
              <ul className="flex flex-col gap-2">
                {outgoing.data.items.map((friend) => (
                  <OutgoingRow key={friend.user.id} friend={friend} />
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </Dialog>
  );
}

function IncomingRow({ friend }: { friend: Friend }) {
  const accept = useAcceptFriendRequest();
  const remove = useRemoveFriendRequest();
  // Khoá cả hai nút khi một trong hai đang chạy: bấm chồng lên nhau là gửi hai
  // quyết định trái ngược cho cùng một lời mời.
  const busy = accept.isPending || remove.isPending;

  return (
    <li className="flex items-center gap-3">
      <Identity friend={friend} />
      <span className="flex shrink-0 gap-2">
        <Button
          className="h-8 px-3 text-xs"
          disabled={busy}
          onClick={() => accept.mutate(friend.user.username)}
        >
          Chấp nhận
        </Button>
        <Button
          variant="outline"
          className="h-8 px-3 text-xs"
          disabled={busy}
          onClick={() => remove.mutate(friend.user.username)}
        >
          Từ chối
        </Button>
      </span>
    </li>
  );
}

function OutgoingRow({ friend }: { friend: Friend }) {
  const remove = useRemoveFriendRequest();

  return (
    <li className="flex items-center gap-3">
      <Identity friend={friend} />
      <Button
        variant="outline"
        className="h-8 shrink-0 px-3 text-xs"
        disabled={remove.isPending}
        onClick={() => remove.mutate(friend.user.username)}
      >
        Huỷ lời mời
      </Button>
    </li>
  );
}

function Identity({ friend }: { friend: Friend }) {
  const name = friend.user.displayName ?? friend.user.username;

  return (
    <>
      <Avatar name={name} src={friend.user.avatarUrl} size="sm" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{name}</span>
        <span className="truncate font-mono text-xs opacity-60">
          @{friend.user.username}
          {friend.since ? ` · ${formatDate(friend.since)}` : ""}
        </span>
      </span>
    </>
  );
}
