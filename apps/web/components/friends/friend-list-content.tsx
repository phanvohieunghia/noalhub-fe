"use client";

import { Link } from "@noalhub/i18n/navigation";
import { useDateFormat } from "@noalhub/i18n/use-date-format";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { FindFriendDialog } from "./find-friend-dialog";
import { FriendRequestsDialog } from "./friend-requests-dialog";
import { Avatar } from "@noalhub/ui/avatar";
import { Button } from "@noalhub/ui/button";
import { ToastError } from "@noalhub/ui/toast";
import { Spinner } from "@noalhub/ui/spinner";
import { useFriendRequests, useFriends } from "@noalhub/api/friends";
import { Typography } from "@noalhub/ui/typography";

/**
 * The friend list.
 *
 * `FriendDto` wraps the user in `friend.user` — it is NOT flat; `since` here is
 * when the friendship began.
 */
export function FriendListContent() {
  const t = useTranslations("web.friends");
  const df = useDateFormat();
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [findOpen, setFindOpen] = useState(false);

  const { data, isPending, error } = useFriends();
  // Only the count is needed for the badge; incoming requests are what need action.
  const { data: incoming } = useFriendRequests("incoming");
  const incomingCount = incoming?.total ?? 0;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Typography variant="h3" as="h1">
          {t("title")}
        </Typography>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setRequestsOpen(true)}>
            {t("openRequests")}
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
          <Button onClick={() => setFindOpen(true)}>{t("find")}</Button>
          <Link
            href="/chat"
            className="inline-flex h-10 items-center rounded-md border border-black/15 px-4 text-body-3 font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            {t("messages")}
          </Link>
        </div>
      </header>

      {isPending ? (
        <Typography variant="body-3" role="status" className="flex items-center gap-2 opacity-70">
          <Spinner />
          {t("loading")}
        </Typography>
      ) : error ? (
        <ToastError message={t("loadFailed")} />
      ) : data.items.length === 0 ? (
        <div className="text-body-3 rounded-lg border border-dashed border-black/15 p-8 text-center opacity-70 dark:border-white/20">
          {t("empty")}
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
                    {friend.since ? t("friendSince", { date: df.date(friend.since) }) : ""}
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
