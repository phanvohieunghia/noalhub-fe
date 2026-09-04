"use client";

import { useRouter } from "next/navigation";

import { Avatar } from "@noalhub/ui/avatar";
import { Button } from "@noalhub/ui/button";
import { ToastError } from "@noalhub/ui/toast";
import { Spinner } from "@noalhub/ui/spinner";
import { useDateFormat } from "@noalhub/i18n/use-date-format";
import { useMessage } from "@noalhub/i18n/use-message";
import { useTranslations } from "next-intl";

import { useChatFormat } from "@/components/chat/use-chat-format";
import { ApiError, ERROR_CODES } from "@noalhub/api/errors";
import type { Message } from "@noalhub/api/message";
import { useAuthStore } from "@noalhub/api/auth";
import { useCreateDirectConversation } from "@noalhub/api/chat";
import { usePublicProfile } from "@noalhub/api/users";
import type { PublicProfile } from "@noalhub/api/users";
import { Typography } from "@noalhub/ui/typography";

/**
 * Someone else's public profile (`GET /users/{username}`).
 *
 * Fewer fields than your own profile — no email, no role. Your own page is
 * `/profile`.
 */
export function PublicProfileContent({ username }: { username: string }) {
  const t = useTranslations("web.profile");
  const df = useDateFormat();
  const cf = useChatFormat();
  const { data, isPending, error } = usePublicProfile(username);

  if (isPending) {
    return (
      <main
        role="status"
        className="flex flex-1 items-center justify-center gap-2 p-8 text-body-3 opacity-70"
      >
        <Spinner />
        {t("loading")}
      </main>
    );
  }

  if (error) {
    const notFound = error instanceof ApiError && error.code === ERROR_CODES.userNotFound;
    return (
      <main className="mx-auto w-full max-w-3xl p-8">
        <ToastError
          message={notFound ? t("public.notFound", { username }) : t("loadFailed")}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 p-8">
      <header className="flex items-center gap-4">
        <Avatar name={data.displayName ?? data.username} src={data.avatarUrl} size="lg" />
        <div className="min-w-0">
          <Typography variant="h3" as="h1" className="truncate">
            {data.displayName ?? data.username}
          </Typography>
          <Typography variant="body-3" className="truncate font-mono opacity-70">
            @{data.username}
          </Typography>
        </div>
        <MessageButton user={data} />
      </header>

      <dl className="grid gap-3 rounded-lg border border-black/10 p-4 text-body-3 dark:border-white/15">
        <div className="flex justify-between gap-4">
          <dt className="opacity-70">{t("facts.joined")}</dt>
          <dd>{df.date(data.createdAt)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="opacity-70">{t("facts.lastSeen")}</dt>
          {/* When they last went offline, NOT the current online state. */}
          <dd>{cf.lastSeenLabel(data.lastSeenAt) ?? t("facts.neverOnline")}</dd>
        </div>
      </dl>
    </main>
  );
}

/**
 * Open a DM with this person.
 *
 * `POST /chat/conversations/direct` is **idempotent** — if a conversation exists
 * it returns that one, otherwise it creates one. So there is no need to search
 * the list first: just call it and navigate to the returned `id`. The hook
 * already writes the conversation into the cache and invalidates the list, so
 * the sidebar gets its new entry on its own.
 */
function MessageButton({ user }: { user: PublicProfile }) {
  const t = useTranslations("web.profile.public");
  const m = useMessage();
  const router = useRouter();
  const myId = useAuthStore((s) => s.user?.id ?? null);
  const createDirect = useCreateDirectConversation();

  // On your own profile there is no DM to open.
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
        {createDirect.isPending ? t("opening") : t("message")}
      </Button>
      {createDirect.isError ? (
        <Typography
          variant="body-4"
          as="span"
          role="alert"
          className="text-red-600 dark:text-red-400"
        >
          {m(dmErrorText(createDirect.error))}
        </Typography>
      ) : null}
    </div>
  );
}

function dmErrorText(error: unknown): Message {
  if (error instanceof ApiError) {
    switch (error.code) {
      case ERROR_CODES.recipientNotFound:
        return { key: "web.profile.public.errors.recipientNotFound" };
      case ERROR_CODES.cannotDmSelf:
        return { key: "web.profile.public.errors.self" };
      case ERROR_CODES.rateLimited:
        return { key: "web.profile.public.errors.rateLimited" };
    }
  }
  return { key: "web.profile.public.errors.failed" };
}
