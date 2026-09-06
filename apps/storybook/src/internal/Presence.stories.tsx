import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslations } from "next-intl";

import { Avatar } from "@noalhub/ui/avatar";
import { Typography } from "@noalhub/ui/typography";

import {
  DocPage,
  DocSection,
  Figure,
  FlowMap,
  KeyList,
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
  ChatScreen,
  ConversationHeader,
  PresenceDot,
  type PresenceState,
} from "./chat-parts";

/*
 * Presence (online/offline) as its own flow, deliberately split from
 * `Chat.stories.tsx`.
 *
 * It shares the socket with messaging and nothing else: no REST endpoint, no
 * React Query cache, no ack — a `presence:changed` broadcast lands in a zustand
 * store and that is the whole data path (`docs/chat.md` §5.7). The sequence
 * diagram is `Presence.mdx`, which links to these stories by id.
 */

const meta: Meta = {
  title: "Flows/Presence",
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj;

/**
 * The presence page: a three-state machine, then the same thing along the data
 * path. A story rather than MDX so the locale toolbar reaches the prose — see
 * `flow-doc.tsx`.
 */
export const Overview: Story = {
  parameters: { layout: "fullscreen" },
  render: function PresenceOverviewPage() {
    const t = useTranslations("sb.flows.presence");
    const tc = useTranslations("sb.flows.common");
    const n = useFlowText("sb.flows.presence.nodes");
    const e = useFlowText("sb.flows.presence.edges");
    const l = useFlowText("sb.flows.presence.lanes");
    const s = useFlowText("sb.flows.presence.steps");
    const notes = useTranslations("sb.flows.presence.notes");
    const rk = useFlowText("sb.flows.presence.redisKeys");
    const rl = useFlowText("sb.flows.presence.redisLanes");
    const rs = useFlowText("sb.flows.presence.redisSteps");
    const redisNotes = useFlowText("sb.flows.presence.redisNotes");

    const nodes: FlowNode[] = [
      { href: "flows-presence--states", x: 40, y: 130, label: n("unknown"), note: n("unknownNote"), end: true },
      { href: "flows-presence--labels", x: 460, y: 60, label: n("online"), note: n("onlineNote") },
      { href: "flows-presence--going-offline", x: 460, y: 236, label: n("offline"), note: n("offlineNote") },
    ];

    const edges: FlowEdge[] = [
      // The elbows turn late, on purpose: the two-line label needs the whole run
      // between the boxes to itself, and an early turn used to cross it.
      { d: "M230 140 H428 Q440 140 440 128 V98 Q440 86 452 86 H460", label: e("toOnlineA"), label2: e("toOnlineB"), labelX: 240, labelY: 118 },
      { d: "M230 172 H428 Q440 172 440 184 V234 Q440 246 452 246 H460", label: e("toOfflineA"), label2: e("toOfflineB"), labelX: 240, labelY: 196 },
      { d: "M535 112 V236", label: e("closeTab"), labelX: 521, labelY: 174, anchor: "middle", rotate: true },
      { d: "M575 236 V112", label: e("reopen"), labelX: 589, labelY: 174, anchor: "middle", rotate: true },
      // `status: null` is a transition that goes nowhere — drawn as a self-loop
      // so it cannot be mistaken for "no data means offline".
      { d: "M110 130 Q110 100 135 100 Q160 100 160 128", label: e("stay"), labelX: 135, labelY: 92, anchor: "middle" },
      // Comes back into the BOTTOM CENTRE of "unknown" — the old route arrived
      // at the box's corner, which read like it was pointing past it.
      { d: "M650 262 H726 Q740 262 740 276 V292 Q740 306 726 306 H149 Q135 306 135 292 V188", label: e("clear"), labelX: 400, labelY: 326, anchor: "middle" },
    ];

    const lanes: Lane[] = [
      { x: 106, label: l("ui"), note: l("uiNote") },
      { x: 258, label: l("store"), note: l("storeNote") },
      { x: 410, label: l("socket"), note: l("socketNote") },
      { x: 590, label: l("rest"), note: l("restNote") },
      { x: 742, label: l("gateway"), note: l("gatewayNote") },
      { x: 894, label: l("peer"), note: l("peerNote") },
    ];

    const steps: Step[] = [
      { from: 0, to: 3, label: s("1") },
      { from: 3, to: 0, label: s("2"), back: true },
      { from: 0, to: 1, label: s("3") },
      { from: 1, to: 0, label: s("4"), back: true },
      { from: 0, to: 1, label: s("5") },
      { from: 1, to: 0, label: s("6"), back: true, accent: true },
      { from: 5, to: 4, label: s("7") },
      { from: 4, to: 2, label: s("8"), back: true },
      { from: 2, to: 1, label: s("9") },
      { from: 1, to: 0, label: s("10"), back: true },
      { from: 5, to: 4, label: s("11") },
      { from: 4, to: 2, label: s("12"), back: true },
      { from: 4, to: 2, label: s("13"), back: true, accent: true },
      { from: 0, to: 3, label: s("14"), accent: true },
    ];

    // The Redis view of the same three states — see `redisNotes.7` for why a
    // backend diagram belongs in the frontend's Storybook.
    const redisLanes: Lane[] = [
      { x: 100, label: rl("peer"), note: rl("peerNote") },
      { x: 258, label: rl("gateway"), note: rl("gatewayNote") },
      { x: 416, label: rl("service"), note: rl("serviceNote") },
      { x: 596, label: rl("userKey"), note: rl("userKeyNote") },
      { x: 754, label: rl("expiryKey"), note: rl("expiryKeyNote") },
      { x: 912, label: rl("db"), note: rl("dbNote") },
    ];

    const redisSteps: Step[] = [
      { from: 0, to: 1, label: rs("1") },
      { from: 1, to: 2, label: rs("2") },
      { from: 2, to: 3, label: rs("3") },
      { from: 2, to: 4, label: rs("4") },
      { from: 3, to: 2, label: rs("5"), back: true, accent: true },
      { from: 2, to: 0, label: rs("6"), back: true },
      { from: 2, to: 3, label: rs("7") },
      { from: 2, to: 4, label: rs("8") },
      { from: 1, to: 2, label: rs("9") },
      { from: 2, to: 3, label: rs("10"), accent: true },
      // The reaper tick talks to nobody but itself — drawn as a self-loop.
      { from: 2, to: 2, label: rs("11") },
      { from: 2, to: 4, label: rs("12") },
      { from: 3, to: 2, label: rs("13"), back: true },
      { from: 2, to: 5, label: rs("14") },
      { from: 2, to: 0, label: rs("15"), back: true, accent: true },
    ];

    return (
      <DocPage title={t("title")} lead={t("lead")}>
        <DocSection step={1} title={tc("flowSection")} hint={tc("clickHint")}>
          <Figure
            caption={t("flowCaption")}
            title={tc("flowSection")}
            width={780}
          >
            <FlowMap
              viewBox="0 0 780 350"
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
            width={990}
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
              divider={500}
              frontendLabel={tc("frontend")}
              backendLabel={tc("backend")}
              width={990}
            />
          </Figure>
        </DocSection>

        <DocSection step={3} title={tc("redisSection")}>
          <KeyList
            keys={[
              {
                name: rk("userName"),
                shape: rk("userShape"),
                purpose: rk("userPurpose"),
              },
              {
                name: rk("expiryName"),
                shape: rk("expiryShape"),
                purpose: rk("expiryPurpose"),
              },
              {
                name: rk("reaperName"),
                shape: rk("reaperShape"),
                purpose: rk("reaperPurpose"),
              },
            ]}
          />
          <Figure
            caption={t("redisCaption")}
            title={tc("redisSection")}
            width={990}
            legend={
              <>
                <LegendItem kind="request" label={tc("legendRequest")} />
                <LegendItem kind="push" label={tc("legendPush")} />
                <LegendItem kind="accent" label={tc("legendAccent")} />
              </>
            }
          >
            <SequenceDiagram
              title={tc("redisSection")}
              lanes={redisLanes}
              steps={redisSteps}
              divider={180}
              frontendLabel={tc("frontend")}
              backendLabel={tc("backend")}
              width={990}
            />
          </Figure>
          <NoteList
            notes={["1", "2", "3", "4", "5", "6", "7"].map((key) =>
              redisNotes(key),
            )}
          />
        </DocSection>

        <DocSection step={4} title={tc("notesSection")}>
          <NoteList
            notes={["1", "2", "3", "4", "5", "6", "7"].map((key) => notes(key))}
          />
        </DocSection>

        <SourceNote />
      </DocPage>
    );
  },
};

/**
 * Ba trạng thái của chấm presence. Cái thứ ba mới là cái dễ quên: store được
 * seed từ `members[].status` của REST rồi cập nhật bằng `presence:changed`, nên
 * "không rõ" là khi BE **không tính** presence cho member đó (`status: null` —
 * danh sách hội thoại chỉ tính cho DM) hoặc userId chưa xuất hiện ở đâu cả. Nó
 * KHÔNG phải offline, và `useSeedPresence` cố tình không ghi đè `null` thành
 * offline.
 */
export const States: Story = {
  render: function StatesScreen() {
    const t = useTranslations("web.chat.presence");

    const rows: { state: PresenceState; label: string; note: string }[] = [
      { state: "online", label: t("online"), note: "seed từ members[].status, rồi presence:changed" },
      {
        state: "offline",
        label: t("hoursAgo", { hours: 3 }),
        note: "status: offline + lastSeenAt",
      },
      { state: "unknown", label: t("unknown"), note: "status = null, hoặc chưa gặp userId này" },
    ];

    return (
      <ul className="border-border bg-surface flex w-[min(26rem,90vw)] flex-col gap-4 rounded-xl border p-5">
        {rows.map((row) => (
          <li key={row.state} className="flex items-center gap-3">
            <span className="relative shrink-0">
              <Avatar name="Nguyễn An" />
              <PresenceDot
                state={row.state}
                label={row.label}
                className="absolute -right-0.5 -bottom-0.5"
              />
            </span>
            <span className="flex flex-col">
              <Typography variant="title-4" as="span">
                {row.label}
              </Typography>
              <Typography
                variant="body-4"
                as="span"
                className="text-muted-foreground"
              >
                {row.note}
              </Typography>
            </span>
          </li>
        ))}
      </ul>
    );
  },
};

/**
 * Cùng một nguồn dữ liệu, hai chỗ hiển thị: chấm trên avatar ở sidebar và câu
 * chữ ở header. `lastSeenAt` chỉ có khi offline → "Hoạt động 3 giờ trước".
 */
export const Labels: Story = {
  render: function LabelsScreen() {
    const t = useTranslations("web.chat.presence");

    const labels = [
      t("online"),
      t("justNow"),
      t("minutesAgo", { minutes: 12 }),
      t("hoursAgo", { hours: 3 }),
      t("daysAgo", { days: 2 }),
      t("onDate", { date: "3 Th7" }),
      t("unknown"),
    ];

    return (
      <div className="flex w-[min(30rem,90vw)] flex-col gap-4">
        {labels.map((label) => (
          <ConversationHeader key={label} statusLabel={label} landmark={false} />
        ))}
      </div>
    );
  },
};

/**
 * Người kia vừa offline. Chấm chuyển xám và header đổi sang `lastSeenAt` — có
 * thể trễ tới 60 giây nếu một instance BE chết đột ngột (`staleAfter = 60s`),
 * đó là thiết kế của BE chứ không phải bug của FE.
 */
export const GoingOffline: Story = {
  render: function GoingOfflineScreen() {
    const t = useTranslations("web.chat.presence");

    return (
      <ChatScreen className="h-[16rem] w-[min(30rem,90vw)]">
        <div className="flex min-w-0 flex-1 flex-col">
          <ConversationHeader statusLabel={t("justNow")} />
          <div className="flex flex-1 items-center justify-center gap-6 p-6">
            <span className="relative">
              <Avatar name="Nguyễn An" size="lg" />
              <PresenceDot
                state="offline"
                label={t("justNow")}
                className="absolute -right-0.5 -bottom-0.5"
              />
            </span>
            <Typography variant="body-4" className="text-muted-foreground max-w-[14rem]">
              presence:changed → status: offline, lastSeenAt
            </Typography>
          </div>
        </div>
      </ChatScreen>
    );
  },
};
