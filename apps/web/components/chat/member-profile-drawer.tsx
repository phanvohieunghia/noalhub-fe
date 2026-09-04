"use client";

import { Link } from "@noalhub/i18n/navigation";
import { useTranslations } from "next-intl";

import { Avatar } from "@noalhub/ui/avatar";
import { Drawer } from "@noalhub/ui/drawer";
import { ToastError } from "@noalhub/ui/toast";
import { Spinner } from "@noalhub/ui/spinner";
import { useDateFormat } from "@noalhub/i18n/use-date-format";

import { useChatFormat } from "./use-chat-format";
import { ApiError, ERROR_CODES } from "@noalhub/api/errors";
import { usePresence } from "@noalhub/api/chat";
import { usePublicProfile } from "@noalhub/api/users";
import type { ConversationMember } from "@noalhub/api/chat";
import { Typography } from "@noalhub/ui/typography";

/**
 * A conversation member's public profile.
 *
 * Two sources, deliberately kept apart: `GET /users/{username}` for the static
 * parts (name, join date), while online/offline comes from realtime presence —
 * the endpoint's `lastSeenAt` is only the last time they went offline, NOT their
 * current state.
 *
 * It fetches only while the drawer is open: however many conversations the
 * sidebar holds, this costs exactly one request, and only when someone actually
 * opens it.
 */
export function MemberProfileDrawer({
  member,
  name,
  open,
  onClose,
}: {
  member: ConversationMember | null;
  name: string;
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("web.chat");
  const cf = useChatFormat();
  const df = useDateFormat();
  const presence = usePresence(member?.userId);
  const { data, isPending, error } = usePublicProfile(open ? member?.username : undefined);

  const statusLabel = !presence
    ? t("presence.unknown")
    : presence.status === "online"
      ? t("presence.online")
      : (cf.lastSeenLabel(presence.lastSeenAt) ?? t("presence.offline"));

  // Before the response arrives, use the member data already in the chat cache —
  // the drawer opens with content and fills in the rest afterwards.
  const displayName = data?.displayName ?? member?.displayName ?? name;
  const avatarUrl = data?.avatarUrl ?? member?.avatarUrl ?? null;

  return (
    <Drawer open={open} onClose={onClose} title={t("profile.title")}>
      {member ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <Avatar name={displayName} src={avatarUrl} size="lg" className="size-20 text-h3" />
            <div>
              <Typography variant="title-2">{displayName}</Typography>
              <Typography variant="body-3" className="font-mono opacity-70">
                @{member.username}
              </Typography>
              <Typography variant="body-3" className="opacity-60">
                {statusLabel}
              </Typography>
            </div>
          </div>

          {error ? (
            <ToastError
              message={
                error instanceof ApiError && error.code === ERROR_CODES.userNotFound
                  ? t("profile.gone")
                  : t("profile.loadFailed")
              }
            />
          ) : null}

          <dl className="grid gap-3 rounded-lg border border-black/10 p-4 text-body-3 dark:border-white/15">
            <div className="flex justify-between gap-4">
              <dt className="opacity-70">{t("profile.role")}</dt>
              <dd>{t(member.role === "owner" ? "profile.owner" : "profile.member")}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="opacity-70">{t("profile.joined")}</dt>
              <dd>
                {isPending && !data ? (
                  <span className="inline-flex items-center gap-2 opacity-60">
                    <Spinner />
                    {t("profile.loading")}
                  </span>
                ) : (
                  df.date(data?.createdAt)
                )}
              </dd>
            </div>
          </dl>

          <Link
            href={`/profile/${member.username}`}
            className="inline-flex h-10 items-center justify-center rounded-md border border-black/15 px-4 text-body-3 font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            {t("profile.viewFull")}
          </Link>
        </div>
      ) : null}
    </Drawer>
  );
}
