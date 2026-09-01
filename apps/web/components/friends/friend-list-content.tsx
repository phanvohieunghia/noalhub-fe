"use client";

import Link from "next/link";
import { useState } from "react";

import { FindFriendDialog } from "./find-friend-dialog";
import { FriendRequestsDialog } from "./friend-requests-dialog";
import { Avatar } from "@noalhub/ui/avatar";
import { Button } from "@noalhub/ui/button";
import { FormError } from "@noalhub/ui/form-error";
import { Spinner } from "@noalhub/ui/spinner";
import { formatDate } from "@noalhub/core/format-date";
import { useFriendRequests, useFriends } from "@noalhub/api/friends";
import { Typography } from "@noalhub/ui/typography";

/**
 * Danh sách bạn bè.
 *
 * `FriendDto` bọc user trong `friend.user` — KHÔNG phẳng; `since` ở đây là mốc
 * kết bạn.
 */
export function FriendListContent() {
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [findOpen, setFindOpen] = useState(false);

  const { data, isPending, error } = useFriends();
  // Chỉ cần con số cho badge; chiều đến là thứ cần hành động.
  const { data: incoming } = useFriendRequests("incoming");
  const incomingCount = incoming?.total ?? 0;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Typography variant="h3" as="h1">
          Bạn bè
        </Typography>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setRequestsOpen(true)}>
            Lời mời kết bạn
            {incomingCount > 0 ? (
              <Typography
                variant="body-4"
                as="span"
                className="rounded-full bg-foreground px-1.5 text-background"
              >
                {incomingCount}
              </Typography>
            ) : null}
          </Button>
          <Button onClick={() => setFindOpen(true)}>Tìm bạn</Button>
          <Link
            href="/chat"
            className="inline-flex h-10 items-center rounded-md border border-black/15 px-4 text-body-3 font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            Tin nhắn
          </Link>
        </div>
      </header>

      {isPending ? (
        <Typography variant="body-3" role="status" className="flex items-center gap-2 opacity-70">
          <Spinner />
          Đang tải danh sách bạn bè…
        </Typography>
      ) : error ? (
        <FormError message="Không tải được danh sách bạn bè." />
      ) : data.items.length === 0 ? (
        <div className="text-body-3 rounded-lg border border-dashed border-black/15 p-8 text-center opacity-70 dark:border-white/20">
          Chưa có bạn nào. Dùng “Tìm bạn” để gửi lời mời đầu tiên.
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-black/10 rounded-lg border border-black/10 dark:divide-white/10 dark:border-white/15">
          {data.items.map((friend) => {
            const name = friend.user.displayName ?? friend.user.username;
            return (
              <li key={friend.user.id}>
                <Link
                  href={`/profile/${friend.user.username}`}
                  className="flex items-center gap-3 p-3 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                >
                  <Avatar name={name} src={friend.user.avatarUrl} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <Typography variant="title-4" as="span" className="truncate">
                      {name}
                    </Typography>
                    <Typography
                      variant="body-4"
                      as="span"
                      className="truncate font-mono opacity-60"
                    >
                      @{friend.user.username}
                    </Typography>
                  </span>
                  <Typography variant="body-4" as="span" className="shrink-0 opacity-50">
                    {friend.since ? `Bạn từ ${formatDate(friend.since)}` : ""}
                  </Typography>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <FriendRequestsDialog open={requestsOpen} onClose={() => setRequestsOpen(false)} />
      <FindFriendDialog open={findOpen} onClose={() => setFindOpen(false)} />
    </main>
  );
}
