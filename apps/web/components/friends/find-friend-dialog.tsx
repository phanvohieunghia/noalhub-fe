"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@noalhub/i18n/navigation";
import { useMessage } from "@noalhub/i18n/use-message";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Avatar } from "@noalhub/ui/avatar";
import { Button } from "@noalhub/ui/button";
import { Dialog } from "@noalhub/ui/dialog";
import { FormError, FormSuccess } from "@noalhub/ui/form-error";
import { Input } from "@noalhub/ui/input";
import { Spinner } from "@noalhub/ui/spinner";
import { useAuthStore } from "@noalhub/api/auth";
import { ApiError, ERROR_CODES } from "@noalhub/api/errors";
import type { Message } from "@noalhub/api/message";
import {
  useFindUserByUsername,
  useFriendRequests,
  useFriends,
  useSendFriendRequest,
} from "@noalhub/api/friends";
import { findFriendSchema, type FindFriendInput } from "@noalhub/api/friends";
import type { FriendState } from "@noalhub/api/friends";
import type { PublicProfile } from "@noalhub/api/users";
import { Typography } from "@noalhub/ui/typography";

/**
 * Find a friend by username.
 *
 * An **exact** match (`GET /users/{username}`): only the right input finds
 * anyone, since the backend has no fuzzy search. So it searches on submit only —
 * firing on every keystroke is both wasteful and always a 404.
 */
export function FindFriendDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("web.friends");
  const m = useMessage();
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
    // Reopening starts a fresh search — do not leave the previous person's result behind.
    setSubmitted(undefined);
    reset();
    onClose();
  }

  const notFound = error instanceof ApiError && error.code === ERROR_CODES.userNotFound;

  return (
    <Dialog open={open} onClose={close} title={t("search.title")}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex items-end gap-2">
          <span className="flex-1">
            <Input
              label={t("search.usernameLabel")}
              placeholder={t("search.usernamePlaceholder")}
              autoComplete="off"
              spellCheck={false}
              error={m(errors.username?.message)}
              {...register("username")}
            />
          </span>
          <Button type="submit" disabled={isFetching} className="mb-[1px]">
            {isFetching ? t("search.submitting") : t("search.submit")}
          </Button>
        </div>

        <Typography variant="body-4" className="opacity-60">
          {t("search.hint")}
        </Typography>
      </form>

      {isFetching ? (
        <Typography variant="body-3" role="status" className="flex items-center gap-2 opacity-70">
          <Spinner />
          {t("search.submitting")}
        </Typography>
      ) : notFound ? (
        <FormError message={t("search.notFound", { username: submitted ?? "" })} />
      ) : error ? (
        <FormError message={t("search.failed")} />
      ) : data ? (
        <SearchResult user={data} state={state} />
      ) : null}
    </Dialog>
  );
}

/**
 * The relationship with the person just found.
 *
 * `PublicProfileDto` carries NO relationship state, so it is derived from the
 * three lists already in the cache. `null` means it is you, not "not connected".
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

function SearchResult({ user, state }: { user: PublicProfile; state: FriendState | null }) {
  const t = useTranslations("web.friends");
  const m = useMessage();
  const sendRequest = useSendFriendRequest();
  const name = user.displayName ?? user.username;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-black/10 p-3 dark:border-white/15">
      <div className="flex items-center gap-3">
        <Avatar name={name} src={user.avatarUrl} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Typography variant="title-4" as="span" className="truncate">
            {name}
          </Typography>
          <Link
            href={`/profile/${user.username}`}
            className="truncate font-mono text-body-4 opacity-60 underline-offset-4 hover:underline"
          >
            @{user.username}
          </Link>
        </div>
      </div>

      {sendRequest.isError ? (
        <FormError message={m(sendErrorText(sendRequest.error))} />
      ) : sendRequest.isSuccess ? (
        // When both sides send a request the backend connects them immediately —
        // read the response's `state` rather than assuming "pending".
        <FormSuccess
          message={
            sendRequest.data.state === "friends" ? t("request.nowFriends") : t("request.sent")
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

function sendErrorText(error: unknown): Message {
  if (error instanceof ApiError) {
    switch (error.code) {
      case ERROR_CODES.alreadyFriends:
        return { key: "web.friends.request.errors.alreadyFriends" };
      case ERROR_CODES.friendRequestExists:
        return { key: "web.friends.request.errors.exists" };
      case ERROR_CODES.cannotFriendSelf:
        return { key: "web.friends.request.errors.self" };
      case ERROR_CODES.rateLimited:
        return { key: "web.friends.request.errors.rateLimited" };
    }
  }
  return { key: "web.friends.request.errors.failed" };
}

/** The relationship state decides what to show — it is not always "Add friend". */
function FriendshipAction({
  state,
  pending,
  onSend,
}: {
  state: FriendState | null;
  pending: boolean;
  onSend: () => void;
}) {
  const t = useTranslations("web.friends");

  switch (state) {
    case null:
      return (
        <Typography variant="body-3" className="opacity-70">
          {t("request.isYou")}
        </Typography>
      );
    case "friends":
      return (
        <Typography variant="body-3" className="opacity-70">
          {t("request.alreadyFriends")}
        </Typography>
      );
    case "pending_outgoing":
      return (
        <Typography variant="body-3" className="opacity-70">
          {t("request.waitingReply")}
        </Typography>
      );
    case "pending_incoming":
      return (
        <Typography variant="body-3" className="opacity-70">
          {t("request.theySentYou")}
        </Typography>
      );
    default:
      return (
        <div>
          <Button onClick={onSend} disabled={pending}>
            {pending ? t("request.sending") : t("request.send")}
          </Button>
        </div>
      );
  }
}
