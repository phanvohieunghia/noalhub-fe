"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useVirtualizer } from "@tanstack/react-virtual";

import {
  useApproveQaSection,
  useApproveQaSets,
  useArchiveQaSets,
  useDeleteQaItem,
  useQaOutline,
  useQaSetItems,
  useQaSetSections,
  useQaSets,
  useRenameQaSets,
  useUpdateQaItem,
  type QaItemFull,
  type QaOutlineEntry,
  type QaReviewStatus,
  type QaSet,
} from "@noalhub/api/qa";
import { useDateFormat } from "@noalhub/i18n/use-date-format";
import { AlertError } from "@noalhub/ui/alert";
import { Badge } from "@noalhub/ui/badge";
import { Button } from "@noalhub/ui/button";
import { Dialog } from "@noalhub/ui/dialog";
import { DropdownMenu, DropdownMenuItem } from "@noalhub/ui/dropdown-menu";
import { Icon, ICONS, LUCIDE } from "@noalhub/ui/icons";
import { InlineTextField } from "@noalhub/ui/inline-text-field";
import { MetricsCard } from "@noalhub/ui/metrics-card";
import { Skeleton } from "@noalhub/ui/skeleton";
import { Spinner } from "@noalhub/ui/spinner";
import { Toggle } from "@noalhub/ui/toggle";
import { toast } from "@noalhub/ui/toast";
import { Tooltip } from "@noalhub/ui/tooltip";
import { Typography } from "@noalhub/ui/typography";

import { GenerateSetsButton } from "./generate-sets-button";
import { useFitHeight } from "./use-fit-height";
import { RunOutcome } from "./generation-progress";
import { useOutlineVersion } from "./use-outline-version";
import { PostContentPreview } from "./post-content-preview";
import { TruncatedTooltip } from "./truncated-tooltip";
import { QaReviewQuestion } from "./qa-review-question";
import { QaItemForm } from "./qa-item-form";
import { QaSetArrangeDialog } from "./qa-set-arrange-dialog";

type Section = {
  key: string;
  title: string;
  entry?: QaOutlineEntry;
  /** Version of the outline the sets came from; `null` for a hand-written set. */
  version: number | null;
  sets: QaSet[];
};

/** Sections with more loaded questions than this fold and open instantly rather than animated. */
const ANIMATE_UP_TO = 12;

/** Tailwind's default transition length, which folding a group uses: rows leave once it is over. */
const FOLD_MS = 150;

const STATUS_TONE = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
} as const;

/** More sections than this start collapsed. */
const COLLAPSE_ABOVE = 5;

/**
 * Step 3: the questions the model drafted, one outline section at a time. Nothing is
 * listed at first — a single Generate button opens the run dialog (prompt, AI key and
 * model) and, once confirmed, drafts the first section. Each later run drafts the next
 * section, which then appears below with its questions. Every question is reviewed
 * here — approve, reject or delete; only approved ones move on to the final set.
 */
export function SetsStep({
  datasetId,
  generationId,
  generating,
  onStarted,
}: {
  datasetId: string;
  /** The run started from this screen, if any — see `QaDatasetDetail`. */
  generationId?: string;
  generating: boolean;
  onStarted: (generationId: string) => void;
}) {
  const t = useTranslations("admin.qa");
  // The outline version the sections come from and new questions are generated against.
  // Opens on the newest; the picker only changes which one is used.
  const { outlines, items: versions, latest } = useOutlineVersion(datasetId);
  const current = latest;
  const detail = useQaOutline(current?.id);
  const sets = useQaSets({ datasetId });
  // `null` = never toggled: the default then depends on how many sections there are.
  const [closedState, setClosed] = useState<Set<string> | null>(null);
  // Sections toggled at least once: their body stays mounted so collapsing can animate.
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const [removing, setRemoving] = useState<Section | null>(null);
  const [arranging, setArranging] = useState<QaSet | null>(null);
  const [adding, setAdding] = useState<QaSet | null>(null);
  const approveAll = useApproveQaSets();
  const [approvingKey, setApprovingKey] = useState<string | null>(null);
  const [view, setView] = useState<"full" | "hover">("full");
  const [groupBy, setGroupBy] = useState<"set" | "section">("set");
  const listRef = useFitHeight<HTMLDivElement>();

  if (outlines.isPending || sets.isPending || (!!current && detail.isPending)) {
    return <Skeleton className="h-64 w-full" />;
  }

  // Every live set is listed — drafts and published final sets alike, archived ones
  // never — whichever outline version it came from; a seeded or hand-written set may
  // have none. Sections of the current outline come first, in
  // outline order; only those that hold questions are drawn.
  const draftSets = (sets.data ?? []).filter(
    (set) => set.status !== "archived",
  );
  const sections: Section[] = [];
  const byKey = new Map<string, Section>();
  const ensure = (
    key: string,
    title: string,
    version: number | null,
    entry?: QaOutlineEntry,
  ): Section => {
    let section = byKey.get(key);
    if (!section) {
      section = { key, title, entry, version, sets: [] };
      byKey.set(key, section);
      sections.push(section);
    }
    return section;
  };
  for (const entry of detail.data?.outline ?? [])
    ensure(
      `${current?.id}:${entry.anchor}`,
      entry.title,
      current?.version ?? null,
      entry,
    );
  // Every generation stays listed: the same section drafted against two outline
  // versions is two sections, each tagged with its version.
  for (const set of draftSets) {
    const key = `${set.outlineId ?? "none"}:${set.sectionAnchor ?? set.id}`;
    const version =
      versions.find((outline) => outline.id === set.outlineId)?.version ?? null;
    ensure(key, set.sectionTitle ?? set.title, version).sets.push(set);
  }

  // Most recently changed first: a section is as fresh as its freshest set.
  const touchedAt = (section: Section) =>
    Math.max(
      ...section.sets.map((set) => Date.parse(set.updatedAt ?? set.createdAt)),
    );
  const generated = sections
    .filter((section) => section.sets.length > 0)
    .sort((a, b) => touchedAt(b) - touchedAt(a));
  const pending = sections.filter(
    (section) => section.sets.length === 0 && section.entry,
  );
  const next = pending[0]?.entry;
  // Not an order to follow: the dialog lists the whole outline and any section can be
  // picked, again too. The first section without questions is only the suggestion.
  const generateNext = current ? (
    <GenerateSetsButton
      datasetId={datasetId}
      outlineId={current.id}
      sections={detail.data?.outline ?? []}
      defaultAnchor={next?.anchor}
      label={generated.length === 0 ? undefined : t("ws.sets.more")}
      iconOnly
      onStarted={onStarted}
    />
  ) : null;

  // Heading title per anchor, for the "group by section" view.
  const anchorTitles = new Map(
    (detail.data?.outline ?? []).map((entry) => [entry.anchor, entry.title]),
  );

  // A long list starts folded; until the user toggles anything, that default follows
  // the section count rather than being frozen at the first render.
  const closed =
    closedState ??
    new Set(
      generated.length > COLLAPSE_ABOVE ? generated.map((section) => section.key) : [],
    );

  // Before the first section is drafted the empty state stands in for the list; while
  // that first run is writing, the header bar is already there with only the action —
  // the count, view and fold controls appear once there is data to act on.
  const firstRun = generated.length === 0 && generating;
  if (generated.length === 0 && !generating) {
    return (
      <section className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface px-6 py-12">
        <Icon icon={LUCIDE.sparkles} className="size-6" />
        <Typography
          variant="body-3"
          className="text-center text-muted-foreground"
        >
          {t("ws.sets.empty")}
        </Typography>
        {/* The outline version is picked inside the dialog. */}
        {generateNext}
        <RunOutcome generationId={generationId} />
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3">
        <div className="flex min-w-0 items-center gap-2">
          <Typography variant="title-3" as="h2">
            {t("ws.sets.heading")}
          </Typography>
          {firstRun ? null : (
            <Badge size="sm">
              {t("ws.sets.setCount", { count: draftSets.length })}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {firstRun ? null : (
            <>
              <Toggle
                variant="outline"
                aria-label={t("ws.sets.viewMode")}
                value={view}
                onValueChange={setView}
                options={[
                  {
                    value: "full",
                    icon: LUCIDE.listChecks,
                    label: t("ws.sets.viewFull"),
                  },
                  {
                    value: "hover",
                    icon: LUCIDE.mousePointerClick,
                    label: t("ws.sets.viewHover"),
                  },
                ]}
              />
              <Toggle
                variant="outline"
                aria-label={t("ws.sets.groupBy")}
                value={groupBy}
                onValueChange={setGroupBy}
                options={[
                  {
                    value: "set",
                    icon: LUCIDE.rows3,
                    label: t("ws.sets.groupBySet"),
                  },
                  {
                    value: "section",
                    icon: LUCIDE.listTree,
                    label: t("ws.sets.groupBySection"),
                  },
                ]}
              />
              <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
              <div className="inline-flex divide-x divide-border overflow-hidden rounded-lg border border-border bg-surface">
                <Tooltip label={t("ws.sets.expandAll")}>
                  <Button
                    variant="ghost"
                    size="icon-md"
                    className="size-7! rounded-none!"
                    aria-label={t("ws.sets.expandAll")}
                    onClick={() => setClosed(new Set())}
                  >
                    <Icon icon={LUCIDE.chevronsUpDown} />
                  </Button>
                </Tooltip>
                <Tooltip label={t("ws.sets.collapseAll")}>
                  <Button
                    variant="ghost"
                    size="icon-md"
                    className="size-7! rounded-none!"
                    aria-label={t("ws.sets.collapseAll")}
                    onClick={() =>
                      setClosed(
                        new Set(generated.map((section) => section.key)),
                      )
                    }
                  >
                    <Icon icon={LUCIDE.chevronsDownUp} />
                  </Button>
                </Tooltip>
              </div>
            </>
          )}
          {generateNext}
        </div>
      </div>
      {firstRun ? <SetsGenerating /> : null}
      <RunOutcome generationId={generationId} />
      {firstRun ? null : (
        <div
          ref={listRef}
          className="flex max-h-[var(--fit-h,70vh)] min-h-0 flex-col gap-2 overflow-y-auto"
        >
          {/* Inside the scroller: outside it the placeholder pushed the list down and
            the earlier sets could not be reached while a run was going. */}
          {generating ? (
            <div className="shrink-0">
              <SetsGenerating inline />
            </div>
          ) : null}
          {generated.map((section) => {
            const group = section.sets;
            const total = group.reduce((sum, set) => sum + set.itemCount, 0);
            const approved = group.reduce(
              (sum, set) => sum + set.approvedCount,
              0,
            );
            const expanded = !closed.has(section.key);
            return (
              <div
                key={section.key}
                className="flex max-h-[var(--fit-h,70vh)] shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-muted"
              >
                <div className="flex shrink-0 items-center gap-3 pr-3">
                  <Button
                    variant="ghost"
                    size="icon-md"
                    aria-expanded={expanded}
                    aria-label={section.title}
                    onClick={() => {
                      setOpened((prev) => new Set(prev).add(section.key));
                      setClosed(() => {
                        const nextClosed = new Set(closed);
                        if (expanded) nextClosed.add(section.key);
                        else nextClosed.delete(section.key);
                        return nextClosed;
                      });
                    }}
                    className="ml-3"
                  >
                    <Icon
                      icon={expanded ? ICONS.chevronDown : ICONS.chevronRight}
                      animate="snappy"
                      className="size-4 shrink-0"
                    />
                  </Button>
                  <div className="flex min-w-0 flex-1 flex-col gap-2 py-1.5 sm:flex-row sm:items-center sm:gap-3">
                    <div className="min-w-0 flex-1">
                      <SectionTitleField
                        sets={group}
                        title={group[0]?.title ?? section.title}
                      />
                    </div>
                    {section.version !== null ? (
                      <Badge
                        size="sm"
                        className="shrink-0 self-start sm:self-center"
                      >
                        {t("outlines.versionShort", {
                          version: section.version,
                        })}
                      </Badge>
                    ) : null}
                    <SectionMetrics
                      createdAt={group
                        .map((set) => set.createdAt)
                        .reduce((a, b) => (a < b ? a : b))}
                      total={total}
                      approved={approved}
                    />
                  </div>
                  {approved < total ? (
                    <Tooltip label={t("ws.sets.approveSection")}>
                      <Button
                        variant="outline"
                        size="icon-md"
                        aria-label={t("ws.sets.approveSection")}
                        disabled={approveAll.isPending}
                        loading={approvingKey === section.key}
                        onClick={() => {
                          setApprovingKey(section.key);
                          approveAll.mutate(
                            group.map((set) => set.id),
                            {
                              onSettled: () => setApprovingKey(null),
                            },
                          );
                        }}
                      >
                        {approvingKey === section.key ? null : <Icon icon={ICONS.check} />}
                      </Button>
                    </Tooltip>
                  ) : null}
                  <DropdownMenu
                    compact
                    trigger={
                      <Button
                        variant="outline"
                        size="icon-md"
                        aria-label={t("ws.sets.sectionActions")}
                      >
                        <Icon icon={ICONS.more} />
                      </Button>
                    }
                  >
                    {group.map((set) => (
                      <DropdownMenuItem
                        key={`add:${set.id}`}
                        icon={ICONS.add}
                        onSelect={() => setAdding(set)}
                      >
                        {group.length > 1
                          ? t("ws.sets.addQuestionSet", { title: set.title })
                          : t("sets.addQuestion")}
                      </DropdownMenuItem>
                    ))}
                    {group
                      .filter((set) => set.itemCount > 1)
                      .map((set) => (
                        <DropdownMenuItem
                          key={set.id}
                          icon={LUCIDE.arrowUpDown}
                          onSelect={() => setArranging(set)}
                        >
                          {group.length > 1
                            ? t("ws.sets.arrangeSet", { title: set.title })
                            : t("ws.sets.arrange")}
                        </DropdownMenuItem>
                      ))}
                    <DropdownMenuItem
                      icon={ICONS.delete}
                      tone="danger"
                      onSelect={() => setRemoving(section)}
                    >
                      {t("ws.sets.removeSection")}
                    </DropdownMenuItem>
                  </DropdownMenu>
                </div>
                <div
                  aria-hidden={!expanded}
                  inert={!expanded}
                  className={`grid min-h-0 transition-[grid-template-rows] duration-200 ease-out ${
                    expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="min-h-0 overflow-hidden">
                    {/* Mount lazily so collapsed sections do not fetch, then keep mounted to animate out. */}
                    {expanded || opened.has(section.key) ? (
                      <div
                        data-qa-scroll
                        className="flex max-h-[calc(var(--fit-h,70vh)-4rem)] min-h-0 flex-col gap-3 overflow-y-auto border-t border-border p-3"
                      >
                        {group.map((set) => (
                          <ReviewSet
                            key={set.id}
                            set={set}
                            revealOnHover={view === "hover"}
                            groupBySection={groupBy === "section"}
                            anchorTitles={anchorTitles}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {adding ? (
        <Dialog open onClose={() => setAdding(null)} size="lg" title={t("sets.addQuestion")}>
          <QaItemForm
            setId={adding.id}
            sections={[...anchorTitles].map(([value, label]) => ({ value, label }))}
            defaultSection={adding.sectionAnchor ?? ""}
            onDone={() => setAdding(null)}
            onCancel={() => setAdding(null)}
          />
        </Dialog>
      ) : null}
      {arranging ? (
        <QaSetArrangeDialog
          setId={arranging.id}
          title={arranging.title}
          anchorTitles={anchorTitles}
          onClose={() => setArranging(null)}
        />
      ) : null}
      {removing ? (
        <RemoveSectionDialog
          section={removing}
          onClose={() => setRemoving(null)}
        />
      ) : null}
    </section>
  );
}

/** The section name, edited in place: written onto every set of the section. */
function SectionTitleField({ sets, title }: { sets: QaSet[]; title: string }) {
  const t = useTranslations("admin.qa");
  const rename = useRenameQaSets();
  return (
    <InlineTextField
      value={title}
      placeholder={t("sources.untitled")}
      label={t("ws.sets.sectionTitle")}
      onSubmit={async (next) => {
        if (next === "") throw new Error("empty");
        try {
          await rename.mutateAsync({
            sets: sets.map((set) => ({ id: set.id, version: set.version })),
            title: next,
          });
        } catch (error) {
          toast.error(t("ws.sets.renameFailed"));
          throw error;
        }
      }}
    />
  );
}

function RemoveSectionDialog({
  section,
  onClose,
}: {
  section: Section;
  onClose: () => void;
}) {
  const t = useTranslations("admin.qa");
  const tc = useTranslations("common");
  const archive = useArchiveQaSets();
  const [failed, setFailed] = useState(0);

  const confirm = async () => {
    const failedIds = await archive.mutateAsync(
      section.sets.map((set) => ({ id: set.id, version: set.version })),
    );
    // Stay open on a partial failure so the count is read, not silently lost.
    if (failedIds.length === 0) onClose();
    else setFailed(failedIds.length);
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={t("ws.sets.removeTitle", { title: section.title })}
    >
      <div className="space-y-4">
        <Typography variant="body-3" className="opacity-70">
          {t("ws.sets.removeIntro")}
        </Typography>
        {failed > 0 ? (
          <AlertError message={t("ws.sets.removeFailed", { count: failed })} />
        ) : null}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {tc("actions.cancel")}
          </Button>
          <Button
            variant="danger"
            loading={archive.isPending}
            onClick={() => void confirm()}
          >
            {t("ws.sets.removeConfirm")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

/** Row widths of the placeholder question card. A run drafts one section at a time, so one card. */
const SKELETON_CARDS = [
  { title: "w-3/5", options: ["w-full", "w-full", "w-full", "w-full"] },
] as const;

/**
 * The questions step while a run is writing the next section. The same frame as the
 * real list — a section card holding question cards — with the content swapped for
 * placeholders, so nothing jumps when the questions arrive. `inline` is the run
 * that comes after earlier sections: only the new section card, below them.
 */
function SetsGenerating({ inline = false }: { inline?: boolean }) {
  const t = useTranslations("admin.qa");
  const body = (
    <div className="flex flex-col gap-3" aria-busy="true">
      {/* Inline, the step tile already carries the spinner: the banner would only
          cost a row above the sets, so it stays screen-reader only. */}
      {inline ? (
        <span role="status" className="sr-only">
          {t("ws.sets.generatingTitle")}
        </span>
      ) : (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-md bg-muted px-3 py-2.5 text-primary"
        >
          <Spinner size="sm" />
          <div className="flex flex-col text-foreground">
            <Typography variant="title-4">
              {t("ws.sets.generatingTitle")}
            </Typography>
            <Typography variant="body-4" className="text-muted-foreground">
              {t("ws.sets.generatingHint")}
            </Typography>
          </div>
        </div>
      )}
      {/* The same frame as a drafted section: header row, then the question cards. */}
      <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-muted">
        <div className="flex items-center gap-3 py-3 pr-3 pl-4">
          <Skeleton className="size-4 shrink-0" />
          <Skeleton className="h-5 w-2/5" />
          <span className="flex-1" />
          <Skeleton className="h-5 w-36 rounded-full" />
          <Skeleton className="h-5 w-28 rounded-full" />
          <Skeleton className="size-9 shrink-0 rounded-lg" />
        </div>
        <div className="flex flex-col gap-3 border-t border-border p-3">
          {SKELETON_CARDS.map((card, index) => (
            <div
              key={index}
              className="flex flex-col gap-2.5 rounded-lg border border-border bg-surface p-4"
            >
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className={`h-5 ${card.title}`} />
              {card.options.map((width, option) => (
                <Skeleton key={option} className={`h-9 ${width}`} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  if (inline) return body;
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <Typography variant="title-3" as="h2">
        {t("ws.sets.generatingHeading")}
      </Typography>
      {body}
    </section>
  );
}

type ReviewRow =
  | {
      kind: "header";
      key: string;
      sectionAnchor: string | null;
      title: string;
      total: number;
      approved: number;
      /** Neither approved nor rejected yet — what the heading's approve button would change. */
      pending: number;
      folded: boolean;
    }
  | {
      kind: "item";
      key: string;
      item: QaItemFull;
      index: number;
      /** The heading row (`h:<anchor>`) this question sits under; empty when ungrouped. */
      groupKey: string;
    };

/**
 * One question with its review menu, in the grid wrapper that folds it away.
 *
 * `memo` because the list around it renders on every scroll tick (the pinned heading
 * follows the scroll), and a card is the expensive part — rich text, options, an
 * explanation. Every prop is a value or a stable callback, so a tick re-renders none of
 * them; the same goes for the pending flags, which only change while a request runs.
 */
const ReviewItemRow = memo(function ReviewItemRow({
  item,
  index,
  shapeLabel,
  revealOnHover,
  folded,
  updating,
  removing,
  onReview,
  onRemove,
}: {
  item: QaItemFull;
  index: number;
  shapeLabel: string;
  revealOnHover: boolean;
  folded: boolean;
  updating: boolean;
  removing: boolean;
  onReview: (item: QaItemFull, status: QaReviewStatus) => void;
  onRemove: (id: string) => void;
}) {
  const t = useTranslations("admin.qa");
  return (
    <div
      className={`grid transition-[grid-template-rows,opacity] ease-[ease] ${
        folded ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
      }`}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="pb-3">
          <QaReviewQuestion
            item={item}
            index={index}
            shapeLabel={shapeLabel}
            revealOnHover={revealOnHover}
            actions={
              <>
                <Badge tone={STATUS_TONE[item.reviewStatus]} size="sm">
                  {t(`ws.sets.${item.reviewStatus}`)}
                </Badge>
                <DropdownMenu
                  compact
                  trigger={
                    <Button
                      variant="outline"
                      size="icon-md"
                      aria-label={t("ws.sets.actions")}
                    >
                      <Icon icon={ICONS.more} />
                    </Button>
                  }
                >
                  {item.reviewStatus !== "approved" ? (
                    <DropdownMenuItem
                      icon={ICONS.check}
                      disabled={updating}
                      onSelect={() => onReview(item, "approved")}
                    >
                      {t("ws.sets.approve")}
                    </DropdownMenuItem>
                  ) : null}
                  {item.reviewStatus !== "rejected" ? (
                    <DropdownMenuItem
                      icon={ICONS.close}
                      disabled={updating}
                      onSelect={() => onReview(item, "rejected")}
                    >
                      {t("ws.sets.reject")}
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem
                    icon={ICONS.delete}
                    tone="danger"
                    disabled={removing}
                    onSelect={() => onRemove(item.id)}
                  >
                    {t("ws.sets.delete")}
                  </DropdownMenuItem>
                </DropdownMenu>
              </>
            }
          />
        </div>
      </div>
    </div>
  );
});

/** A real card is 500–650px; a row not yet measured is guessed at this, so the scroll bar barely jumps. */
const ITEM_ESTIMATE = 520;
const HEADING_ESTIMATE = 56;

function ReviewSet({
  set,
  revealOnHover,
  groupBySection,
  anchorTitles,
}: {
  set: QaSet;
  revealOnHover: boolean;
  /** Bucket the questions under their `sectionAnchor` heading instead of one flat list. */
  groupBySection: boolean;
  anchorTitles: Map<string, string>;
}) {
  const t = useTranslations("admin.qa");
  // A set is read a page at a time (more load as the list nears its end) and its
  // per-section counts come separately, so a heading can read `25/25` before its
  // questions are here. The set's own title, description and intro are already on `set`.
  const items = useQaSetItems(set.id);
  const sections = useQaSetSections(set.id);
  const update = useUpdateQaItem(set.id);
  const remove = useDeleteQaItem(set.id);
  const approveSection = useApproveQaSection();
  const [approvingKey, setApprovingKey] = useState<string | null>(null);
  // `mutate` keeps its identity between renders, which is what lets the rows be memoised.
  const { mutate: mutateItem } = update;
  const { mutate: deleteItem } = remove;
  const review = useCallback(
    (item: QaItemFull, reviewStatus: QaReviewStatus) =>
      mutateItem({ id: item.id, input: { reviewStatus } }),
    [mutateItem],
  );
  const removeItem = useCallback((id: string) => deleteItem(id), [deleteItem]);
  // Heading keys (`h:<anchor>`) whose questions are folded away.
  const [folded, setFolded] = useState<Set<string>>(new Set());
  // Folding a group collapses the height of each of its rows to 0 (see the row markup),
  // and the virtualizer re-measures them every frame, so everything below follows. The
  // rows only leave the list once that has finished (`hidden`); opening mounts them
  // already collapsed and lets them grow a moment later.
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const foldTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const toggleFold = (key: string) => {
    clearTimeout(foldTimers.current.get(key));
    const change = (set: Set<string>, add: boolean) => {
      const next = new Set(set);
      if (add) next.add(key);
      else next.delete(key);
      return next;
    };
    // Only the rows on screen are mounted, and only those can animate: the rest of a
    // long section keep their last measured height until they are removed, so folding
    // it would shrink a few cards and then drop the whole remainder in one jump (opening
    // is the same in reverse). Past a handful of rows the toggle is instant instead.
    const anchor = key.slice(2);
    const size = loaded.reduce(
      (count, item) => ((item.sectionAnchor ?? "") === anchor ? count + 1 : count),
      0,
    );
    const animate = size <= ANIMATE_UP_TO;
    if (!folded.has(key)) {
      setFolded((prev) => change(prev, true));
      if (!animate) {
        setHidden((prev) => change(prev, true));
        return;
      }
      foldTimers.current.set(
        key,
        setTimeout(() => setHidden((prev) => change(prev, true)), FOLD_MS + 50),
      );
    } else {
      setHidden((prev) => change(prev, false));
      if (!animate) {
        setFolded((prev) => change(prev, false));
        return;
      }
      foldTimers.current.set(
        key,
        setTimeout(() => setFolded((prev) => change(prev, false)), 30),
      );
    }
  };

  const loaded = useMemo(
    () => items.data?.pages.flatMap((page) => page.items) ?? [],
    [items.data],
  );
  const counts = useMemo(
    () => new Map((sections.data ?? []).map((s) => [s.sectionAnchor ?? "", s])),
    [sections.data],
  );

  // One flat list of rows (headings and questions) so the virtualizer covers both. The
  // server sends each section's questions together, so a heading goes in wherever the
  // section changes; its counts come from `counts`, not from what is loaded so far.
  const rows = useMemo<ReviewRow[]>(() => {
    if (!groupBySection)
      return loaded.map((item, index) => ({
        kind: "item",
        key: item.id,
        item,
        index,
        groupKey: "",
      }));
    const out: ReviewRow[] = [];
    let current: string | null = null;
    loaded.forEach((item, index) => {
      const anchor = item.sectionAnchor ?? "";
      const key = `h:${anchor}`;
      if (anchor !== current) {
        current = anchor;
        const count = counts.get(anchor);
        out.push({
          kind: "header",
          key,
          sectionAnchor: item.sectionAnchor,
          title: anchorTitles.get(anchor) ?? anchor,
          total: count?.total ?? 0,
          approved: count?.approved ?? 0,
          pending: count ? count.total - count.approved - count.rejected : 0,
          folded: folded.has(key),
        });
      }
      if (hidden.has(key)) return;
      out.push({ kind: "item", key: item.id, item, index, groupKey: key });
    });
    return out;
  }, [loaded, groupBySection, anchorTitles, counts, folded, hidden]);

  // A set can hold hundreds of questions after a chunked run, so only the rows near the
  // viewport are mounted. The scroll element is the section body that holds every set of
  // the section (marked `data-qa-scroll`); `scrollMargin` is where this list starts inside
  // it, because the intro card sits above and other sets may sit above that.
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollEl, setScrollEl] = useState<HTMLElement | null>(null);
  const [scrollMargin, setScrollMargin] = useState(0);
  const itemCount = loaded.length;
  const hasHeader = !!(set.description || set.intro);

  useLayoutEffect(() => {
    const list = listRef.current;
    const scroller = list?.closest<HTMLElement>("[data-qa-scroll]") ?? null;
    setScrollEl(scroller);
    if (!list || !scroller) return;
    setScrollMargin(
      list.getBoundingClientRect().top -
        scroller.getBoundingClientRect().top +
        scroller.scrollTop,
    );
  }, [itemCount, hasHeader]);

  // Group headings sit at the head of their rows; each gets an overlay box (below).
  const stickyIndexes = rows.flatMap((row, index) =>
    row.kind === "header" ? [index] : [],
  );

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollEl,
    estimateSize: (index) =>
      rows[index]?.kind === "header" ? HEADING_ESTIMATE : ITEM_ESTIMATE,
    // No `gap`: each row carries its own bottom padding so that collapsing a row takes
    // the space between rows with it.
    overscan: 6,
    scrollMargin,
    getItemKey: (index) => rows[index]?.key ?? index,
  });
  const virtualRows = virtualizer.getVirtualItems();

  // Next page: when the rows on screen come within a few of the last one loaded.
  const lastVisible = virtualRows[virtualRows.length - 1]?.index ?? -1;
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = items;
  useEffect(() => {
    if (lastVisible >= rows.length - 8 && hasNextPage && !isFetchingNextPage)
      void fetchNextPage();
  }, [lastVisible, rows.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Each group gets an overlay box spanning exactly its rows, with the heading
  // `sticky` inside it. The browser pins it on the compositor (no lag behind the
  // scroll, unlike positioning it from React state) and CSS keeps it inside the box,
  // so it only leaves once the group's last question has gone by and the next
  // heading pushes it out. The heading rows in the virtual list are invisible
  // placeholders that only reserve (and measure) the space.
  const GAP = 12;
  const offset = virtualizer.scrollOffset ?? 0;
  const viewport = virtualizer.scrollRect?.height ?? 800;
  const measured = virtualizer.measurementsCache;
  const groupBoxes = groupBySection
    ? stickyIndexes.flatMap((index) => {
        const head = measured[index];
        if (!head) return [];
        const nextIndex = stickyIndexes.find((i) => i > index);
        const end =
          nextIndex !== undefined && measured[nextIndex]
            ? measured[nextIndex].start - GAP
            : virtualizer.getTotalSize() + scrollMargin;
        if (head.start > offset + viewport || end < offset) return [];
        return [{ index, top: head.start - scrollMargin, height: end - head.start }];
      })
    : [];

  // The shape is the set's own: one prompt can now produce several.
  const shape = set.questionType
    ? t(
        `templates.shapes.${set.questionType}` as "templates.shapes.multiple_choice",
      )
    : "";

  if (items.isPending) return <Skeleton className="h-32 w-full" />;
  if (items.isError) return <AlertError message={t("ws.sets.loadFailed")} />;

  const renderHeading = (
    entry: Extract<ReviewRow, { kind: "header" }>,
    index: number,
    top: number,
  ) => (
    <div
      key={entry.key}
      ref={virtualizer.measureElement}
      data-index={index}
      aria-hidden="true"
      inert
      className="invisible absolute left-0 top-0 w-full pb-3"
      style={{ transform: `translateY(${top}px)` }}
    >
      {headingCard(entry)}
    </div>
  );

  const headingCard = (entry: Extract<ReviewRow, { kind: "header" }>) => (
      <div className="flex items-center gap-2 rounded-lg bg-surface py-1 pr-3 pl-1.5 shadow-sm ring-1 ring-border">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-expanded={!entry.folded}
          aria-label={entry.title || t("ws.sets.noSection")}
          onClick={() => toggleFold(entry.key)}
        >
          <Icon
            icon={entry.folded ? ICONS.chevronRight : ICONS.chevronDown}
            animate="snappy"
            className="size-4 shrink-0"
          />
        </Button>
        {/* The title is cut to one line; the tooltip shows the rest, only when something is cut. */}
        <TruncatedTooltip label={entry.title || t("ws.sets.noSection")}>
          <div className="min-w-0 flex-1">
            <Typography variant="title-4" className="truncate">
              {entry.title || t("ws.sets.noSection")}
            </Typography>
          </div>
        </TruncatedTooltip>
        <Typography
          variant="body-4"
          className={
            entry.approved === entry.total ? "text-success" : "text-warning"
          }
        >
          {entry.approved}/{entry.total}
        </Typography>
        {entry.pending > 0 ? (
          <Tooltip label={t("ws.sets.approveHeading")}>
            <Button
              variant="outline"
              size="icon-md"
              aria-label={t("ws.sets.approveHeading")}
              disabled={approveSection.isPending}
              loading={approvingKey === entry.key}
              onClick={() => {
                setApprovingKey(entry.key);
                approveSection.mutate(
                  { setId: set.id, sectionAnchor: entry.sectionAnchor },
                  { onSettled: () => setApprovingKey(null) },
                );
              }}
            >
              {approvingKey === entry.key ? null : <Icon icon={ICONS.check} />}
            </Button>
          </Tooltip>
        ) : null}
      </div>
  );

  return (
    <>
      {set.description || set.intro ? (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
          <Typography variant="title-4">{set.title}</Typography>
          {set.description ? (
            <Typography variant="body-3" className="text-muted-foreground">
              {set.description}
            </Typography>
          ) : null}
          {set.intro ? <PostContentPreview doc={set.intro} /> : null}
        </div>
      ) : null}
      <div
        ref={listRef}
        className="relative w-full"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualRows.map((row) => {
          const entry = rows[row.index];
          if (!entry) return null;
          if (entry.kind === "header") {
            return renderHeading(
              entry,
              row.index,
              row.start - virtualizer.options.scrollMargin,
            );
          }
          return (
            <div
              key={row.key}
              ref={virtualizer.measureElement}
              data-index={row.index}
              className="absolute left-0 top-0 w-full"
              style={{
                transform: `translateY(${row.start - virtualizer.options.scrollMargin}px)`,
              }}
            >
              <ReviewItemRow
                item={entry.item}
                index={entry.index}
                shapeLabel={shape}
                revealOnHover={revealOnHover}
                folded={folded.has(entry.groupKey)}
                updating={update.isPending}
                removing={remove.isPending}
                onReview={review}
                onRemove={removeItem}
              />
            </div>
          );
        })}
        {groupBoxes.map((box) => {
          const entry = rows[box.index];
          if (entry?.kind !== "header") return null;
          return (
            <div
              key={`box:${entry.key}`}
              className="pointer-events-none absolute left-0 z-10 w-full"
              // `top`, not a transform: `sticky` works from layout positions and
              // would ignore a translate on the box it is contained by.
              style={{ top: box.top, height: box.height }}
            >
              <div className="pointer-events-auto sticky top-0">
                {headingCard(entry)}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/**
 * Icon + figure chips for one section, with the full breakdown in a hover card — the
 * same pattern as the outline metrics, so the two steps read alike.
 */
function SectionMetrics({
  createdAt,
  total,
  approved,
}: {
  createdAt: string;
  total: number;
  approved: number;
}) {
  const t = useTranslations("admin.qa");
  const locale = useLocale();
  const df = useDateFormat();
  const short = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  }).format(new Date(createdAt));

  return (
    <MetricsCard
      title={t("ws.sets.metrics.title")}
      layout="row"
      className="whitespace-nowrap"
      items={[
        {
          key: "created",
          icon: LUCIDE.calendarClock,
          iconClass: "text-primary",
          value: short,
          label: t("ws.sets.metrics.created"),
          detail: df.dateTime(createdAt),
        },
        {
          key: "questions",
          icon: LUCIDE.listChecks,
          iconClass: "text-brand-500",
          value: String(total),
          label: t("ws.sets.metrics.questions"),
        },
        {
          key: "approved",
          icon: LUCIDE.circleCheck,
          iconClass:
            approved === total && total > 0 ? "text-success" : "text-warning",
          value: `${approved}/${total}`,
          label: t("ws.sets.metrics.approved"),
          detail: t("ws.sets.approvedOf", { approved, total }),
        },
      ]}
    />
  );
}
