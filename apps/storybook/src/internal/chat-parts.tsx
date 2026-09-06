import { useTranslations } from "next-intl";

import { Avatar } from "@noalhub/ui/avatar";
import { Button } from "@noalhub/ui/button";
import { Icon, ICONS } from "@noalhub/ui/icons";
import { Spinner } from "@noalhub/ui/spinner";
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

export type PresenceState = "online" | "offline";

/**
 * The status dot. TWO states.
 *
 * The store can hold no entry for a user at all — presence is only broadcast to
 * people who share a conversation, and the conversation list only carries
 * `status` for DMs. That absence is rendered as **offline**, not as a third
 * dot (`docs/chat.md` §5.7).
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
  const color = state === "online" ? "bg-success" : "bg-muted-foreground";

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

/**
 * The frame every chat screen sits in: one card, app-sized.
 *
 * `banner` renders ABOVE the two columns, which is where `ChatLayoutShell` puts
 * `ConnectionBanner` — the whole shell is `flex h-dvh flex-col` with the banner
 * as its first child. Drawing it inside the message pane, as this file used to,
 * puts it on the wrong side of the sidebar.
 */
export function ChatScreen({
  banner,
  children,
  className = "",
}: {
  banner?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`border-border bg-surface flex h-[30rem] w-[min(46rem,90vw)] flex-col overflow-hidden rounded-xl border ${className}`}
    >
      {banner}
      <div className="flex min-h-0 flex-1">{children}</div>
    </div>
  );
}

/**
 * The connection banner — the top strip of the whole shell, never a per-pane
 * element.
 *
 * Two states from one component: `connecting` swaps the `⚠` for a spinner and
 * **drops the retry button**, because there is nothing to retry while a retry is
 * already in flight.
 */
export function ConnectionBanner({ connecting = false }: { connecting?: boolean }) {
  const t = useTranslations("web.chat.connection");
  const tc = useTranslations("common");

  return (
    <div
      role="status"
      className="text-body-3 bg-warning/15 text-warning border-warning/30 flex shrink-0 items-center justify-center gap-3 border-b px-4 py-2"
    >
      {connecting ? <Spinner /> : <span aria-hidden>⚠</span>}
      <span>{connecting ? t("reconnecting") : t("offline")}</span>
      {connecting ? null : (
        // `border-current` on purpose: the banner is amber, and a `border-border`
        // button inside it reads as a foreign element.
        <Button variant="outline" size="xs" className="border-current/30 hover:bg-current/10">
          {tc("actions.retry")}
        </Button>
      )}
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
  { name: "Lê Chi", presence: "offline", preview: "", time: "3 Th7" },
];

/** The sidebar list. Presence rides on the avatar of every direct conversation. */
export function ConversationList({ activeIndex = 0 }: { activeIndex?: number }) {
  const t = useTranslations("web.chat.sidebar");
  const tp = useTranslations("web.chat.presence");

  const presenceLabel = (peer: Peer) =>
    peer.presence === "online" ? tp("online") : tp("hoursAgo", { hours: 3 });

  return (
    // `w-80`, matching `ChatLayoutShell`'s `md:w-80` — the sidebar is 20rem in
    // the app, not 16rem.
    <aside className="border-border flex w-80 shrink-0 flex-col border-r">
      <div className="flex shrink-0 items-center gap-2 px-4 py-3">
        {/*
          `ChatUserMenu` sits here in the app — a dropdown that needs the auth
          store, so only its trigger is drawn. There is deliberately NO "New"
          button: creating a DM needs a `userId` and the backend has no user
          search endpoint yet, and a disabled button is an empty promise
          (`docs/chat.md` §0 #2).
        */}
        <Avatar name={PEERS[0]!.name} size="sm" />
        <Typography variant="h6" as="h1">
          {t("title")}
        </Typography>
      </div>

      {/*
        A bare `<input>` with an `aria-label`, not `@noalhub/ui`'s `Input`: the
        app's search box has no visible label, and rendering one here made the
        sidebar a row taller than it really is. The filtering is CLIENT-SIDE over
        what is already loaded — the backend has no conversation search endpoint.
      */}
      <div className="shrink-0 px-2 pb-2">
        <input
          type="search"
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchLabel")}
          className="border-border text-body-3 focus:border-foreground/60 w-full rounded-md border bg-transparent px-3 py-1.5 outline-none"
        />
      </div>

      <ul className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-2">
        {PEERS.map((peer, index) => (
          <li key={peer.name}>
            <a
              href="#"
              aria-current={index === activeIndex ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg p-2 transition-colors ${
                index === activeIndex ? "bg-muted" : "hover:bg-muted/60"
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
                  <span className="text-muted-foreground shrink-0 text-[11px]">
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
                    // `bg-foreground`, not `bg-primary`: the unread pill is the
                    // plain high-contrast one, and it caps its label at `99+`.
                    <span className="bg-foreground text-background inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold">
                      <span aria-hidden>{peer.unread > 99 ? "99+" : peer.unread}</span>
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

/**
 * The header of an open conversation: back button, avatar with its presence dot,
 * name, and the presence LABEL.
 *
 * The name is a `<span>`, not a heading — that is what the app renders; the only
 * `h1` on the chat screen is the sidebar title.
 */
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
  const tp = useTranslations("web.chat.presence");
  const th = useTranslations("web.chat.header");

  const presenceLabel =
    peer.presence === "online" ? tp("online") : tp("hoursAgo", { hours: 3 });

  return (
    <Root className="border-border flex shrink-0 items-center gap-3 border-b px-4 py-3">
      {/* `md:hidden`, exactly as the app has it: the back button only means
          anything on mobile, because desktop always shows the sidebar. It is
          therefore invisible at Storybook's usual viewport — resize the preview
          below 768px to see it. */}
      <span
        aria-label={th("backToList")}
        className="text-title-2 -ml-1 leading-none opacity-70 md:hidden"
      >
        ◀
      </span>

      <span className="relative shrink-0">
        <Avatar name={peer.name} size="sm" />
        <PresenceDot
          state={peer.presence}
          label={presenceLabel}
          className="absolute -right-0.5 -bottom-0.5"
        />
      </span>
      <span className="flex min-w-0 flex-col">
        <Typography variant="title-4" weight={600} as="span" className="truncate">
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
  error,
  pending = false,
  danger = false,
}: {
  mine?: boolean;
  children: React.ReactNode;
  time: string;
  meta?: React.ReactNode;
  /** The failed-send row: the error message and the resend button. */
  error?: React.ReactNode;
  /** In flight: drawn as an outline, not a faded fill — see below. */
  pending?: boolean;
  danger?: boolean;
}) {
  return (
    <div className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
      <div
        className={`text-body-3 max-w-[min(32rem,80%)] rounded-2xl px-3 py-2 ${
          pending
            ? // NOT `opacity-60` over the filled bubble, which is how the app
              // draws it: faded text on `--foreground` lands under the 4.5:1
              // WCAG AA threshold and CI fails the story. A dashed outline says
              // "in flight" without touching the text contrast. This is the one
              // place these screens deliberately differ from the app.
              "border-foreground text-foreground border border-dashed"
            : mine
              ? // `bg-foreground text-background` — the own-message bubble is the
                // plain inverted one, not the brand color.
                "bg-foreground text-background"
              : "bg-muted text-foreground"
        } ${danger ? "ring-danger ring-1" : ""}`}
      >
        {children}
      </div>
      <div className="mt-0.5 flex items-center gap-1.5 px-1 text-[11px] opacity-60">
        <time dateTime="2026-07-26T09:41:00Z">{time}</time>
        {meta}
      </div>
      {/* Inside the bubble's own flex column, so it lands on the same side the
          message did — the app does the same rather than aligning it by hand. */}
      {error ? <div className="mt-0.5 flex items-center gap-2 px-1">{error}</div> : null}
    </div>
  );
}

/**
 * A run of consecutive messages from one person: the avatar and the sender name
 * appear ONCE, not per bubble.
 *
 * Own messages get neither — the column is reversed and the name would be your
 * own. Forgetting this grouping was what made the old story look like a wall of
 * detached bubbles.
 */
export function MessageGroup({
  peer,
  mine = false,
  children,
}: {
  peer?: Peer;
  mine?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
      {mine ? null : <Avatar name={peer?.name ?? ""} size="sm" />}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {mine ? null : (
          <span className="text-body-4 px-1 opacity-60">{peer?.name}</span>
        )}
        {children}
      </div>
    </div>
  );
}

/**
 * The scrollable history.
 *
 * `role="log"` + `aria-live="polite"` + `aria-relevant="additions"`: a screen
 * reader announces new messages without interrupting the user mid-typing.
 *
 * ⚠️ `tabIndex={0}` is the one addition to what the app renders. A scrollable
 * region that cannot be focused is unreachable by keyboard — axe flags it, and
 * these stories run with `a11y: { test: "error" }`. The app's own message list
 * is missing it.
 */
export function MessageList({ children }: { children: React.ReactNode }) {
  const t = useTranslations("web.chat.messages");

  return (
    <div
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      aria-label={t("label")}
      tabIndex={0}
      className="flex-1 overflow-y-auto px-4 py-3"
    >
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

/** `✓` sent · `✓✓` read — derived from the peer's read cursor, not a per-message flag. */
export function ReadReceipt({ read }: { read: boolean }) {
  const t = useTranslations("web.chat.messages");

  return (
    <span className="text-[11px] leading-none opacity-70">
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
    <form className="border-border shrink-0 border-t p-3" noValidate>
      {/* Inside the form, above the input row — and only `opacity-60`, not a
          warning color: it explains, it does not alarm. */}
      {offline ? (
        <Typography variant="body-4" role="status" className="px-1 pb-1 opacity-60">
          {tc("composerOffline")}
        </Typography>
      ) : null}

      <div className="flex items-end gap-2">
        {/*
          A bare `<textarea>` with an `aria-label`, not `@noalhub/ui`'s
          `Textarea`: the app's composer has no visible label, grows to
          `max-h-40` and only then scrolls. It is deliberately NOT disabled while
          offline — being locked out mid-sentence is awful, so only the send
          button is blocked and the text is kept.
        */}
        <textarea
          rows={1}
          aria-label={t("label")}
          placeholder={offline ? t("placeholderOffline") : t("placeholder")}
          className="border-border text-body-3 focus:border-foreground/60 max-h-40 flex-1 resize-none rounded-md border bg-transparent px-3 py-2 outline-none"
        />
        {/* Icon-only, so the label moves to `aria-label`: a button whose only
            content is an `aria-hidden` glyph announces nothing. `size="icon"` is
            the same height as the default button, so the row does not shift. */}
        <Button
          type="submit"
          size="icon"
          aria-label={t("send")}
          className="shrink-0"
          disabled={offline}
        >
          {pending ? <Spinner className="size-4" /> : <Icon icon={ICONS.send} />}
        </Button>
      </div>
    </form>
  );
}
