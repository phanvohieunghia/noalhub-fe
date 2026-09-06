import { useTranslations } from "next-intl";

import { Avatar } from "@noalhub/ui/avatar";
import { Button } from "@noalhub/ui/button";
import { Input } from "@noalhub/ui/input";
import { Spinner } from "@noalhub/ui/spinner";
import { Textarea } from "@noalhub/ui/textarea";
import { Typography } from "@noalhub/ui/typography";

/*
 * The pieces the chat and presence flows both draw, kept out of either stories
 * file so the two can be read separately.
 *
 * Not a `*.stories.tsx`, so Storybook never indexes it — and it lives in
 * `src/internal/` for the same reason the flows do: the public build leaves that
 * directory out entirely (`.storybook/main.ts`).
 *
 * Everything here is rebuilt from `@noalhub/ui` primitives rather than imported
 * from `apps/web/components/chat/*`: the apps are built and deployed
 * independently and nothing may import across them (AGENTS.md), and the real
 * components hang off `@noalhub/api` hooks plus a live Socket.IO connection.
 * What is reproduced is the LAYOUT and the copy, read from the same `web.chat`
 * messages, so the locale toolbar switches these exactly like the app.
 */

export type PresenceState = "online" | "offline" | "unknown";

/**
 * The status dot. THREE states, not two: presence is only broadcast to people
 * who share a conversation, so "no data" is `unknown` and must not be painted as
 * a confident offline (`docs/chat.md` §5.7).
 *
 * Color alone communicates nothing → the label always ships as `title` +
 * `sr-only` text.
 */
export function PresenceDot({
  state,
  label,
  className = "",
}: {
  state: PresenceState;
  label: string;
  className?: string;
}) {
  const color =
    state === "online"
      ? "bg-success"
      : state === "offline"
        ? "bg-muted-foreground"
        : "bg-border";

  return (
    <span className={`inline-flex items-center ${className}`}>
      <span
        title={label}
        className={`ring-background size-2.5 rounded-full ring-2 ${color}`}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** The frame every chat screen sits in: one card, app-sized. */
export function ChatScreen({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`border-border bg-surface flex h-[30rem] w-[min(46rem,90vw)] overflow-hidden rounded-xl border ${className}`}
    >
      {children}
    </div>
  );
}

export type Peer = {
  name: string;
  presence: PresenceState;
  preview: string;
  time: string;
  unread?: number;
};

export const PEERS: Peer[] = [
  { name: "Nguyễn An", presence: "online", preview: "Ok mình xem rồi nhé", time: "09:41", unread: 2 },
  { name: "Trần Bình", presence: "offline", preview: "Gửi lại giúp mình link", time: "Hôm qua" },
  { name: "Lê Chi", presence: "unknown", preview: "", time: "3 Th7" },
];

/** The sidebar list. Presence rides on the avatar of every direct conversation. */
export function ConversationList({ activeIndex = 0 }: { activeIndex?: number }) {
  const t = useTranslations("web.chat.sidebar");
  const tp = useTranslations("web.chat.presence");

  const presenceLabel = (peer: Peer) =>
    peer.presence === "online"
      ? tp("online")
      : peer.presence === "offline"
        ? tp("hoursAgo", { hours: 3 })
        : tp("unknown");

  return (
    <aside className="border-border flex w-64 shrink-0 flex-col gap-3 border-r p-3">
      <Typography variant="title-3" as="h2">
        {t("title")}
      </Typography>
      <Input
        label={t("searchLabel")}
        placeholder={t("searchPlaceholder")}
        type="search"
      />
      <ul className="flex flex-col gap-1">
        {PEERS.map((peer, index) => (
          <li key={peer.name}>
            <a
              href="#"
              aria-current={index === activeIndex ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg p-2 ${
                index === activeIndex ? "bg-muted" : ""
              }`}
            >
              <span className="relative shrink-0">
                <Avatar name={peer.name} />
                <PresenceDot
                  state={peer.presence}
                  label={presenceLabel(peer)}
                  className="absolute -right-0.5 -bottom-0.5"
                />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-baseline justify-between gap-2">
                  <Typography variant="title-4" as="span" className="truncate">
                    {peer.name}
                  </Typography>
                  <span className="text-body-4 text-muted-foreground shrink-0">
                    {peer.time}
                  </span>
                </span>
                <span className="flex items-center justify-between gap-2">
                  <span
                    className={`text-body-4 truncate ${
                      peer.unread ? "font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {peer.preview || t("noMessages")}
                  </span>
                  {peer.unread ? (
                    <span className="bg-primary text-primary-foreground inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold">
                      <span aria-hidden>{peer.unread}</span>
                      <span className="sr-only">
                        {t("unread", { count: peer.unread })}
                      </span>
                    </span>
                  ) : null}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/** The header of an open conversation: avatar, name, and the presence LABEL. */
export function ConversationHeader({
  peer = PEERS[0]!,
  statusLabel,
  landmark = true,
}: {
  peer?: Peer;
  statusLabel?: string;
  /**
   * `false` renders a plain `<div>`. In the app there is exactly one chat header
   * on the page, so `<header>` is right; a story that stacks several of them
   * would otherwise ship several banner landmarks — an a11y error, and CI runs
   * `a11y: { test: "error" }`.
   */
  landmark?: boolean;
}) {
  const Root = landmark ? "header" : "div";

  return (
    <Root className="border-border flex items-center gap-3 border-b px-4 py-3">
      <span className="relative shrink-0">
        <Avatar name={peer.name} />
      </span>
      <span className="flex flex-col">
        <Typography variant="title-4" as="h2">
          {peer.name}
        </Typography>
        {statusLabel ? (
          <Typography
            variant="body-4"
            as="span"
            className="text-muted-foreground"
          >
            {statusLabel}
          </Typography>
        ) : null}
      </span>
    </Root>
  );
}

export function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="bg-border h-px flex-1" />
      <Typography variant="body-4" as="span" className="text-muted-foreground">
        {label}
      </Typography>
      <span className="bg-border h-px flex-1" />
    </div>
  );
}

export function Bubble({
  mine = false,
  children,
  time,
  meta,
  pending = false,
  danger = false,
}: {
  mine?: boolean;
  children: React.ReactNode;
  time: string;
  meta?: React.ReactNode;
  /** In flight: drawn as an outline, not a faded fill — see below. */
  pending?: boolean;
  danger?: boolean;
}) {
  return (
    <div className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
      <div
        className={`text-body-3 max-w-[min(24rem,80%)] rounded-2xl px-3 py-2 ${
          pending
            ? // NOT `opacity-60` over the filled bubble, which is how the app
              // draws it: faded text on `--primary` lands under the 4.5:1 WCAG
              // AA threshold and CI fails the story. A dashed outline says "in
              // flight" without touching the text contrast.
              "border-primary text-foreground border border-dashed"
            : mine
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
        } ${danger ? "ring-danger ring-1" : ""}`}
      >
        {children}
      </div>
      <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 px-1 text-[11px]">
        <time dateTime="2026-07-26T09:41:00Z">{time}</time>
        {meta}
      </div>
    </div>
  );
}

/** `✓` sent · `✓✓` read — derived from the peer's read cursor, not a per-message flag. */
export function ReadReceipt({ read }: { read: boolean }) {
  const t = useTranslations("web.chat.messages");

  return (
    <span className="leading-none">
      <span aria-hidden>{read ? "✓✓" : "✓"}</span>
      <span className="sr-only">{t(read ? "read" : "sent")}</span>
    </span>
  );
}

export function Composer({
  offline = false,
  pending = false,
}: {
  offline?: boolean;
  pending?: boolean;
}) {
  const t = useTranslations("web.chat.composer");
  const tc = useTranslations("web.chat.connection");

  return (
    <div className="border-border shrink-0 border-t">
      {offline ? (
        <p role="status" className="text-body-4 text-warning px-4 pt-2">
          {tc("composerOffline")}
        </p>
      ) : null}
      <form className="flex items-end gap-2 p-3" noValidate>
        <Textarea
          label={t("label")}
          placeholder={offline ? t("placeholderOffline") : t("placeholder")}
          resize="auto"
          maxRows={4}
          className="flex-1"
        />
        <Button type="submit" className="shrink-0" disabled={offline}>
          {pending ? <Spinner className="size-3.5" /> : null}
          {t("send")}
        </Button>
      </form>
    </div>
  );
}
