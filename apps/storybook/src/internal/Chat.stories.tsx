import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslations } from "next-intl";

import { useMessage } from "@noalhub/i18n/use-message";

import { Button } from "@noalhub/ui/button";
import { Icon, ICONS } from "@noalhub/ui/icons";
import { Spinner } from "@noalhub/ui/spinner";
import { Typography } from "@noalhub/ui/typography";

import {
  DocPage,
  DocSection,
  Figure,
  FlowMap,
  LegendItem,
  NoteList,
  SequenceDiagram,
  SourceNote,
  useFlowText,
  type FlowEdge,
  type FlowNode,
  type Lane,
  type Step,
} from "./flow-doc";
import {
  Bubble,
  ChatScreen,
  Composer,
  ConversationHeader,
  ConversationList,
  DateSeparator,
  PEERS,
  ReadReceipt,
} from "./chat-parts";

/*
 * One story per state of the MESSAGING flow. Presence lives next door in
 * `Presence.stories.tsx` — the two are separate flows with separate transports
 * (REST + socket ack here, a fire-and-forget broadcast there), and reading them
 * as one picture is what makes chat look more tangled than it is.
 *
 * The map that ties these together, lanes and all, is `Chat.mdx`; it links to
 * each story by id, so renaming an export breaks a link there.
 *
 * Screens are rebuilt from `@noalhub/ui` primitives (see `chat-parts.tsx` for
 * why). Every state shown is one the backend actually produces; the rules behind
 * each are in `docs/chat.md` (§3.1 REST, §3.2 events, §5.5 send).
 */

const meta: Meta = {
  title: "Flows/Chat",
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj;

/**
 * The page that maps this flow: a state map whose boxes link to the stories
 * below, then the same flow as an FE ↔ BE sequence.
 *
 * It is a STORY rather than MDX prose so the locale toolbar reaches it — see
 * `flow-doc.tsx`. `Chat.mdx` embeds this one story and nothing else.
 */
export const Overview: Story = {
  parameters: { layout: "fullscreen" },
  render: function ChatOverviewPage() {
    const t = useTranslations("sb.flows.chat");
    const tc = useTranslations("sb.flows.common");
    const n = useFlowText("sb.flows.chat.nodes");
    const e = useFlowText("sb.flows.chat.edges");
    const l = useFlowText("sb.flows.chat.lanes");
    const s = useFlowText("sb.flows.chat.steps");
    const notes = useTranslations("sb.flows.chat.notes");

    const nodes: FlowNode[] = [
      { href: "flows-chat--conversations-empty-pane", x: 40, y: 20, label: n("list"), note: n("listNote"), primary: true },
      { href: "flows-chat--conversation", x: 40, y: 100, label: n("open"), note: n("openNote") },
      { href: "flows-chat--message-sending", x: 40, y: 180, label: n("sending"), note: n("sendingNote") },
      { href: "flows-chat--message-failed", x: 40, y: 260, label: n("failed"), note: n("failedNote") },
      { href: "flows-chat--offline", x: 100, y: 360, label: n("offline"), note: n("offlineNote") },
      { href: "flows-chat--reconnecting", x: 380, y: 360, label: n("reconnecting"), note: n("reconnectingNote") },
      { href: "flows-chat--conversations-empty-list", x: 380, y: 20, label: n("emptyList"), note: n("emptyListNote") },
      { href: "flows-chat--conversation-empty", x: 380, y: 100, label: n("emptyConv"), note: n("emptyConvNote") },
      { href: "flows-chat--conversation-not-found", x: 380, y: 180, label: n("notFound"), note: n("notFoundNote"), end: true },
    ];

    const edges: FlowEdge[] = [
      { d: "M135 72 V100", label: e("pick"), labelX: 125, labelY: 92, anchor: "end" },
      { d: "M135 152 V180", label: e("submit"), labelX: 145, labelY: 172 },
      { d: "M135 232 V260", label: e("nack"), labelX: 145, labelY: 252 },
      { d: "M230 46 H380", label: e("never"), labelX: 305, labelY: 40, anchor: "middle" },
      { d: "M230 112 H380", label: e("brandNew"), labelX: 305, labelY: 106, anchor: "middle" },
      { d: "M230 140 H300 Q312 140 312 152 V194 Q312 206 324 206 H380", label: e("notFound"), labelX: 240, labelY: 134 },
      // The retry loop: back to the SAME send step, with the same id.
      // Clear of the "ack ok:false" label (which used to run straight through
      // this loop) and of the 404 elbow at x=312.
      { d: "M230 286 H316 Q330 286 330 272 V238 Q330 224 316 224 H236", label: e("retry"), labelX: 352, labelY: 252, anchor: "middle", rotate: true },
      // Losing the socket can happen at any point → routed around the outside.
      { d: "M40 126 H26 Q16 126 16 136 V376 Q16 386 26 386 H96", label: e("drop"), labelX: 30, labelY: 352 },
      { d: "M290 386 H380", label: e("backoff"), labelX: 300, labelY: 356 },
      // Straight up the outside and back in through the TOP of the open
      // conversation: entering from the right meant threading between two rows
      // of boxes and a second jog halfway down.
      { d: "M570 386 H608 Q620 386 620 366 V108 Q620 88 600 88 H192 Q180 88 180 100", label: e("reconnect"), labelX: 614, labelY: 236, anchor: "middle", rotate: true },
    ];

    const lanes: Lane[] = [
      { x: 96, label: l("ui"), note: l("uiNote") },
      { x: 256, label: l("cache"), note: l("cacheNote") },
      { x: 416, label: l("socket"), note: l("socketNote") },
      { x: 636, label: l("gateway"), note: l("gatewayNote") },
      { x: 816, label: l("rest"), note: l("restNote") },
    ];

    const steps: Step[] = [
      { from: 0, to: 1, label: s("1") },
      { from: 1, to: 4, label: s("2") },
      { from: 4, to: 1, label: s("3"), back: true },
      { from: 0, to: 2, label: s("4") },
      { from: 2, to: 3, label: s("5") },
      { from: 3, to: 2, label: s("6"), back: true },
      { from: 0, to: 1, label: s("7") },
      { from: 1, to: 4, label: s("8") },
      { from: 4, to: 1, label: s("9"), back: true },
      { from: 0, to: 1, label: s("10") },
      { from: 2, to: 3, label: s("11"), accent: true },
      { from: 3, to: 2, label: s("12"), back: true, accent: true },
      { from: 3, to: 2, label: s("13"), back: true },
      { from: 2, to: 3, label: s("14") },
      { from: 3, to: 2, label: s("15"), back: true },
    ];

    return (
      <DocPage title={t("title")} lead={t("lead")}>
        <DocSection step={1} title={tc("flowSection")} hint={tc("clickHint")}>
          <Figure
            caption={t("flowCaption")}
            title={tc("flowSection")}
            width={660}
          >
            <FlowMap
              viewBox="0 0 660 440"
              title={t("title")}
              nodes={nodes}
              edges={edges}
            />
          </Figure>
        </DocSection>

        <DocSection step={2} title={tc("seqSection")}>
          <Figure
            caption={t("seqCaption")}
            title={tc("seqSection")}
            width={900}
            legend={
              <>
                <LegendItem kind="request" label={tc("legendRequest")} />
                <LegendItem kind="push" label={tc("legendPush")} />
                <LegendItem kind="accent" label={tc("legendAccent")} />
              </>
            }
          >
            <SequenceDiagram
              title={tc("seqSection")}
              lanes={lanes}
              steps={steps}
              divider={526}
              frontendLabel={tc("frontend")}
              backendLabel={tc("backend")}
              width={900}
            />
          </Figure>
        </DocSection>

        <DocSection step={3} title={tc("notesSection")}>
          <NoteList
            notes={["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((key) =>
              notes(key),
            )}
          />
        </DocSection>

        <SourceNote />
      </DocPage>
    );
  },
};

/** `/chat` với danh sách đã tải nhưng chưa chọn hội thoại nào. */
export const ConversationsEmptyPane: Story = {
  render: function ConversationsEmptyPaneScreen() {
    const t = useTranslations("web.chat.conversation");

    return (
      <ChatScreen>
        <ConversationList activeIndex={-1} />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
          <Icon
            icon={ICONS.chat}
            className="text-muted-foreground size-8"
            aria-hidden
          />
          <Typography variant="title-3" as="h2">
            {t("emptyTitle")}
          </Typography>
          <Typography
            variant="body-3"
            className="text-muted-foreground max-w-xs"
          >
            {t("emptyState")}
          </Typography>
        </div>
      </ChatScreen>
    );
  },
};

/** Chưa từng chat với ai: danh sách rỗng, không phải lỗi. */
export const ConversationsEmptyList: Story = {
  render: function ConversationsEmptyListScreen() {
    const t = useTranslations("web.chat.sidebar");

    return (
      <ChatScreen className="w-[min(26rem,90vw)] h-[24rem]">
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
          <Typography variant="title-3" as="h2">
            {t("empty")}
          </Typography>
          <Typography variant="body-3" className="text-muted-foreground">
            {t("emptyHint")}
          </Typography>
        </div>
      </ChatScreen>
    );
  },
};

/**
 * Trạng thái thường gặp nhất: hội thoại đang mở, lịch sử đã tải, người kia đang
 * nhập. `✓✓` là suy ra từ con trỏ `lastReadMessageId` của người kia (id là UUID
 * v7 nên so sánh được theo thời gian), không phải cờ "đã đọc" của từng tin.
 */
export const Conversation: Story = {
  render: function ConversationScreen() {
    const t = useTranslations("web.chat.messages");
    const td = useTranslations("web.chat.day");
    const tt = useTranslations("web.chat.typing");
    const tp = useTranslations("web.chat.presence");

    return (
      <ChatScreen>
        <ConversationList />
        <div className="flex min-w-0 flex-1 flex-col">
          <ConversationHeader statusLabel={tp("online")} />
          <div
            className="flex flex-1 flex-col gap-2 overflow-y-auto p-4"
            aria-label={t("label")}
            // A scrollable region has to be reachable by keyboard, or the
            // history is unreadable without a mouse.
            tabIndex={0}
          >
            <DateSeparator label={td("yesterday")} />
            <Bubble time="09:38">Mai họp lúc mấy giờ thế?</Bubble>
            <Bubble
              mine
              time="09:40"
              meta={<ReadReceipt read />}
            >
              9h30 nhé, mình gửi link trong invite rồi.
            </Bubble>
            <DateSeparator label={td("today")} />
            <Bubble time="09:41">Ok mình xem rồi nhé</Bubble>
          </div>
          <div
            className="text-body-4 text-muted-foreground h-5 shrink-0 px-4"
            aria-live="polite"
          >
            {tt("one", { name: PEERS[0]!.name })}
          </div>
          <Composer />
        </div>
      </ChatScreen>
    );
  },
};

/** Hội thoại mới toanh: chưa có tin nào, composer vẫn dùng được. */
export const ConversationEmpty: Story = {
  render: function ConversationEmptyScreen() {
    const t = useTranslations("web.chat.conversation");
    const tp = useTranslations("web.chat.presence");

    return (
      <ChatScreen>
        <ConversationList />
        <div className="flex min-w-0 flex-1 flex-col">
          <ConversationHeader statusLabel={tp("minutesAgo", { minutes: 12 })} />
          <div className="flex flex-1 items-center justify-center p-8">
            <Typography variant="body-3" className="text-muted-foreground">
              {t("noMessagesYet")}
            </Typography>
          </div>
          <Composer />
        </div>
      </ChatScreen>
    );
  },
};

/**
 * Tin đang bay: bubble mờ + spinner. `id` do FE sinh (UUID v7) chính là khoá
 * idempotency của BE, nên trạng thái này luôn an toàn để retry.
 */
export const MessageSending: Story = {
  render: function MessageSendingScreen() {
    const t = useTranslations("web.chat.messages");

    return (
      <ChatScreen className="h-[18rem] w-[min(30rem,90vw)]">
        <div className="flex min-w-0 flex-1 flex-col">
          <div
            className="flex flex-1 flex-col gap-2 p-4"
            aria-label={t("label")}
          >
            <Bubble mine time="09:41" meta={<ReadReceipt read={false} />}>
              Mình gửi bản cuối nhé.
            </Bubble>
            <Bubble mine pending time="09:42" meta={<Spinner className="size-3" />}>
              Đang gửi cái này…
            </Bubble>
          </div>
          <Composer pending />
        </div>
      </ChatScreen>
    );
  },
};

/**
 * Ack trả về `ok: false`: bubble viền đỏ, câu lỗi là KEY được dịch lúc render
 * (đổi ngôn ngữ trên toolbar là đổi câu lỗi), và nút gửi lại dùng ĐÚNG `id` cũ.
 */
export const MessageFailed: Story = {
  render: function MessageFailedScreen() {
    const t = useTranslations("web.chat.messages");
    const m = useMessage();

    return (
      <ChatScreen className="h-[18rem] w-[min(30rem,90vw)]">
        <div className="flex min-w-0 flex-1 flex-col">
          <div
            className="flex flex-1 flex-col gap-2 p-4"
            aria-label={t("label")}
          >
            <Bubble mine danger time="09:42">
              Đang gửi cái này…
            </Bubble>
            <div className="flex items-center justify-end gap-2 px-1">
              <span role="alert" className="text-danger text-[11px]">
                {m("common.errors.generic")}
              </span>
              <Button variant="link" size="inline">
                {t("resend")}
              </Button>
            </div>
          </div>
          <Composer />
        </div>
      </ChatScreen>
    );
  },
};

/**
 * Socket rụng. Gửi tin đi qua socket (không có REST để ghi), nên mất kết nối là
 * mất khả năng gửi — phải nói ra, không để người dùng đoán.
 */
export const Offline: Story = {
  render: function OfflineScreen() {
    const t = useTranslations("web.chat.connection");
    const tc = useTranslations("common");
    const tm = useTranslations("web.chat.messages");

    return (
      <ChatScreen className="h-[20rem] w-[min(30rem,90vw)]">
        <div className="flex min-w-0 flex-1 flex-col">
          <div
            role="status"
            className="text-body-3 border-border bg-warning/15 text-warning flex shrink-0 items-center justify-center gap-3 border-b px-4 py-2"
          >
            <Icon icon={ICONS.warning} aria-hidden />
            <span>{t("offline")}</span>
            <Button variant="outline" size="xs">
              {tc("actions.retry")}
            </Button>
          </div>
          <div className="flex flex-1 flex-col gap-2 p-4" aria-label={tm("label")}>
            <Bubble time="09:41">Ok mình xem rồi nhé</Bubble>
          </div>
          <Composer offline />
        </div>
      </ChatScreen>
    );
  },
};

/**
 * Đang kết nối lại. Không có nút thử lại ở trạng thái này — chỉ chờ.
 */
export const Reconnecting: Story = {
  render: function ReconnectingScreen() {
    const t = useTranslations("web.chat.connection");

    return (
      <div
        role="status"
        className="text-body-3 border-border bg-warning/15 text-warning flex w-[min(30rem,90vw)] items-center justify-center gap-3 rounded-lg border px-4 py-2"
      >
        <Spinner />
        <span>{t("reconnecting")}</span>
      </div>
    );
  },
};

/**
 * Ngõ cụt: BE trả **404** cho cả "không tồn tại" lẫn "không phải thành viên" —
 * cố tình không tiết lộ hội thoại có thật hay không. Không có nhánh 403.
 */
export const ConversationNotFound: Story = {
  render: function ConversationNotFoundScreen() {
    const t = useTranslations("web.chat.conversation");

    return (
      <ChatScreen className="h-[16rem] w-[min(30rem,90vw)]">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <Typography variant="body-3">{t("notFound")}</Typography>
          <a href="#" className="text-body-3 underline underline-offset-4">
            {t("backToList")}
          </a>
        </div>
      </ChatScreen>
    );
  },
};
