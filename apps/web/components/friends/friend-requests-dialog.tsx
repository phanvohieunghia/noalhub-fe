"use client";

import { Avatar } from "@noalhub/ui/avatar";
import { Button } from "@noalhub/ui/button";
import { Dialog } from "@noalhub/ui/dialog";
import { ToastError } from "@noalhub/ui/toast";
import { Spinner } from "@noalhub/ui/spinner";
import { useDateFormat } from "@noalhub/i18n/use-date-format";
import { useTranslations } from "next-intl";
import {
  useAcceptFriendRequest,
  useFriendRequests,
  useRemoveFriendRequest,
} from "@noalhub/api/friends";
import type { Friend } from "@noalhub/api/friends";
import { Typography } from "@noalhub/ui/typography";

/**
 * Pending friend requests.
 *
 * The two directions are separate endpoints (`?direction=`), hence two queries —
 * incoming requests are what need action, so they go on top.
 */
export function FriendRequestsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("web.friends.requests");
  const incoming = useFriendRequests("incoming");
  const outgoing = useFriendRequests("outgoing");

  const isPending = incoming.isPending || outgoing.isPending;
  const error = incoming.error ?? outgoing.error;
  const empty = (incoming.data?.total ?? 0) === 0 && (outgoing.data?.total ?? 0) === 0;

  return (
    <Dialog open={open} onClose={onClose} title={t("title")}>
      {isPending ? (
        <Typography
          variant="body-3"
          role="status"
          className="flex items-center gap-2 py-4 opacity-70"
        >
          <Spinner />
          {t("loading")}
        </Typography>
      ) : error ? (
        <ToastError message={t("loadFailed")} />
      ) : empty ? (
        <Typography variant="body-3" className="py-4 opacity-70">
          {t("empty")}
        </Typography>
      ) : (
        <div className="flex flex-col gap-5">
          {incoming.data && incoming.data.items.length > 0 ? (
            <section className="flex flex-col gap-2">
              <Typography
                variant="body-4"
                weight={500}
                as="h3"
                className="tracking-wide uppercase opacity-60"
              >
                {t("incomingHeading")}
              </Typography>
              <ul className="flex flex-col gap-2">
                {incoming.data.items.map((friend) => (
                  <IncomingRow key={friend.user.id} friend={friend} />
                ))}
              </ul>
            </section>
          ) : null}

          {outgoing.data && outgoing.data.items.length > 0 ? (
            <section className="flex flex-col gap-2">
              <Typography
                variant="body-4"
                weight={500}
                as="h3"
                className="tracking-wide uppercase opacity-60"
              >
                {t("outgoingHeading")}
              </Typography>
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
  const t = useTranslations("web.friends.requests");
  const accept = useAcceptFriendRequest();
  const remove = useRemoveFriendRequest();
  // Disable both buttons while either is running: overlapping clicks send two
  // contradictory decisions about one request.
  const busy = accept.isPending || remove.isPending;

  return (
    <li className="flex items-center gap-3">
      <Identity friend={friend} />
      <span className="flex shrink-0 gap-2">
        <Button
          className="h-8 px-3 text-body-4"
          disabled={busy}
          onClick={() => accept.mutate(friend.user.username)}
        >
          {t("accept")}
        </Button>
        <Button
          variant="outline"
          className="h-8 px-3 text-body-4"
          disabled={busy}
          onClick={() => remove.mutate(friend.user.username)}
        >
          {t("decline")}
        </Button>
      </span>
    </li>
  );
}

function OutgoingRow({ friend }: { friend: Friend }) {
  const t = useTranslations("web.friends.requests");
  const remove = useRemoveFriendRequest();

  return (
    <li className="flex items-center gap-3">
      <Identity friend={friend} />
      <Button
        variant="outline"
        className="h-8 shrink-0 px-3 text-body-4"
        disabled={remove.isPending}
        onClick={() => remove.mutate(friend.user.username)}
      >
        {t("cancel")}
      </Button>
    </li>
  );
}

function Identity({ friend }: { friend: Friend }) {
  const df = useDateFormat();
  const name = friend.user.displayName ?? friend.user.username;

  return (
    <>
      <Avatar name={name} src={friend.user.avatarUrl} size="sm" />
      <span className="flex min-w-0 flex-1 flex-col">
        <Typography variant="title-4" as="span" className="truncate">
          {name}
        </Typography>
        <Typography variant="body-4" as="span" className="truncate font-mono opacity-60">
          @{friend.user.username}
          {friend.since ? ` · ${df.date(friend.since)}` : ""}
        </Typography>
      </span>
    </>
  );
}
