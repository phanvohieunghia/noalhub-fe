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

    /*
     * TWO boxes, not three. `offline` is also the ENTRY point: the store holds
     * no entry for most people, and the view renders that absence as offline
     * rather than as a third dot (`presence-dot.tsx`).
     */
    const nodes: FlowNode[] = [
      { href: "flows-presence--going-offline", x: 60, y: 120, label: n("offline"), note: n("offlineNote"), primary: true },
      { href: "flows-presence--labels", x: 440, y: 120, label: n("online"), note: n("onlineNote") },
    ];

    const edges: FlowEdge[] = [
      // Two separate runs rather than one double-ended arrow: they are different
      // transports. Going online arrives either in the REST seed or as an event;
      // going offline is only ever an event.
      { d: "M250 132 H432", label: e("toOnlineA"), label2: e("toOnlineB"), labelX: 341, labelY: 100, anchor: "middle" },
      { d: "M440 160 H258", label: e("toOffline"), labelX: 341, labelY: 190, anchor: "middle" },
      // The absence of data is not a transition — it is the offline box itself,
      // drawn as a self-loop so it cannot be read as a third state.
      { d: "M120 172 Q120 208 155 208 Q190 208 190 178", label: e("noData"), labelX: 155, labelY: 230, anchor: "middle" },
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
              viewBox="0 0 780 258"
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
 * The two states of the presence dot.
 *
 * There is no third: the store can hold nothing at all for a user — presence is
 * only broadcast to people who share a conversation, and the conversation list
 * only carries `status` for DMs — and the view renders that absence as offline.
 * The trade is that someone genuinely online reads as offline until the first
 * fact about them arrives, which is exactly what the REST seed is for.
 */
export const States: Story = {
  render: function StatesScreen() {
    const t = useTranslations("web.chat.presence");
    const ts = useTranslations("sb.flows.presence.states");

    const rows: { state: PresenceState; label: string; note: string }[] = [
      { state: "online", label: t("online"), note: ts("onlineNote") },
      {
        state: "offline",
        label: t("hoursAgo", { hours: 3 }),
        note: ts("offlineNote"),
      },
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
 * One data source, two places it shows up: the dot on the sidebar avatar and the
 * sentence in the header. `lastSeenAt` only exists when offline → "Active 3 hours
 * ago".
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
 * The other person just went offline. The dot turns gray and the header switches to
 * `lastSeenAt` — which can lag by up to 60 seconds if a backend instance dies
 * abruptly (`staleAfter = 60s`); that is the backend's design, not an FE bug.
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
