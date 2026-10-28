"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  QA_COUNT_OPTIONS,
  useBrowseQaDatasets,
  useQaAttempts,
  useStartQaAttempt,
  type QaAttempt,
  type QaDifficulty,
  type QaItemKind,
  type QaDatasetSummary,
} from "@noalhub/api/qa";
import { useDateFormat } from "@noalhub/i18n/use-date-format";
import { AlertError } from "@noalhub/ui/alert";
import { Badge, type BadgeTone } from "@noalhub/ui/badge";
import { Button } from "@noalhub/ui/button";
import { Dialog } from "@noalhub/ui/dialog";
import { Icon, ICONS, LUCIDE } from "@noalhub/ui/icons";
import { Input } from "@noalhub/ui/input";
import { Select } from "@noalhub/ui/select";
import { Skeleton } from "@noalhub/ui/skeleton";
import { Tooltip } from "@noalhub/ui/tooltip";
import { Typography } from "@noalhub/ui/typography";

const KINDS = ["theory", "practice", "recall", "analysis"] as const;
const DIFFICULTIES = ["easy", "medium", "hard"] as const;
/** How many cards one "Load more" reveals — two rows of the three-column grid. */
const PAGE_SIZE = 6;

const DIFFICULTY_TONE: Record<QaDifficulty, BadgeTone> = {
  easy: "success",
  medium: "warning",
  hard: "danger",
};

/**
 * The way into the learner surface.
 *
 * One card per **dataset** that has at least one published question — a dataset
 * is one bank of questions, and sets/outlines never show up on this side. Starting
 * one happens in a modal over this list, not on a page of its own.
 *
 * The button reads "Continue" whenever the backend reports an open attempt.
 * Two different words for two different situations: starting is a decision,
 * continuing is picking up something already half-done.
 *
 * Search, kind and difficulty filter **client-side** over the published list:
 * the browse endpoint takes no filter, and the list is the learner's whole
 * catalogue, small enough to hold in memory.
 */
export function LearnBrowse() {
  const t = useTranslations("web.learn");
  const [kind, setKind] = useState<QaItemKind | "">("");
  const [difficulty, setDifficulty] = useState<QaDifficulty | "">("");
  const [search, setSearch] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [opened, setOpened] = useState<QaDatasetSummary | null>(null);

  const datasets = useBrowseQaDatasets();
  const attempts = useQaAttempts();

  // One open attempt per dataset (the backend guarantees it) → its progress by dataset id.
  const openByDataset = useMemo(() => {
    const map = new Map<string, QaAttempt>();
    for (const attempt of attempts.data ?? []) {
      if (attempt.status === "in_progress" && !isAnsweredThrough(attempt)) {
        map.set(attempt.datasetId, attempt);
      }
    }
    return map;
  }, [attempts.data]);

  const needle = search.trim().toLowerCase();
  const rows = (datasets.data?.items ?? []).filter(
    (row) =>
      (kind === "" || row.itemKinds.includes(kind)) &&
      (difficulty === "" || row.difficulties.includes(difficulty)) &&
      (needle === "" || row.title.toLowerCase().includes(needle)),
  );
  const shown = rows.slice(0, visible);

  // A filter change must start from the first page again, or "Showing 6 of 3"
  // is one keystroke away.
  const onFilter =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value);
      setVisible(PAGE_SIZE);
    };

  // The dataset the learner was last in the middle of leads the grid as the
  // featured card — but only on the unfiltered first view, or a search would
  // reshuffle the layout under the cursor.
  const featured =
    kind === "" && difficulty === "" && needle === ""
      ? (shown.find((row) => openByDataset.has(row.id)) ?? null)
      : null;
  const rest = featured ? shown.filter((row) => row.id !== featured.id) : shown;

  return (
    <main className="mx-auto w-full max-w-6xl p-4 sm:p-6">
      <div className="grid gap-6">
        <div className="min-w-0 space-y-5">
          <header className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Typography variant="h2" as="h1">
                {t("browse.title")}
              </Typography>
              <Typography variant="body-3" className="text-muted-foreground">
                {t("browse.intro")}
              </Typography>
            </div>
            <Tooltip label={t("browse.stats")} side="bottom">
              <Button
                variant="outline"
                size="icon"
                asChild
                className="shrink-0"
              >
                <Link href="/learn/stats" aria-label={t("browse.stats")}>
                  <Icon icon={LUCIDE.chartColumn} />
                </Link>
              </Button>
            </Tooltip>
          </header>

          <Input
            label={t("browse.searchLabel")}
            hideLabel
            type="search"
            leadingIcon={ICONS.search}
            placeholder={t("browse.searchPlaceholder")}
            value={search}
            onChange={(event) => onFilter(setSearch)(event.target.value)}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label={t("browse.filterKind")}
              hideLabel
              value={kind}
              onChange={(event) =>
                onFilter(setKind)(event.target.value as QaItemKind | "")
              }
              placeholder={t("browse.allKinds")}
              options={KINDS.map((value) => ({
                value,
                label: t(`kinds.${value}`),
              }))}
            />
            <Select
              label={t("browse.difficultyLabel")}
              hideLabel
              value={difficulty}
              onChange={(event) =>
                onFilter(setDifficulty)(event.target.value as QaDifficulty | "")
              }
              placeholder={t("browse.anyDifficulty")}
              options={DIFFICULTIES.map((value) => ({
                value,
                label: t(`difficulty.${value}`),
              }))}
            />
          </div>

          {datasets.isPending ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Skeleton className="h-52 w-full rounded-xl sm:col-span-2 xl:col-span-2" />
              <Skeleton className="h-52 w-full rounded-xl" />
              <Skeleton className="h-44 w-full rounded-xl" />
            </div>
          ) : rows.length === 0 ? (
            <Typography variant="body-3" className="text-muted-foreground">
              {/* Empty here means no admin has PUBLISHED anything — say that,
                  rather than "no data", which reads like something broke. */}
              {datasets.data?.total === 0
                ? t("browse.emptyNone")
                : t("browse.emptyFilter")}
            </Typography>
          ) : (
            <>
              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {featured ? (
                  <DatasetCard
                    featured
                    dataset={featured}
                    attempt={openByDataset.get(featured.id)}
                    onOpen={() => setOpened(featured)}
                  />
                ) : null}
                {rest.map((dataset) => (
                  <DatasetCard
                    key={dataset.id}
                    dataset={dataset}
                    attempt={openByDataset.get(dataset.id)}
                    onOpen={() => setOpened(dataset)}
                  />
                ))}
              </ul>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <Typography variant="body-4" className="text-muted-foreground">
                  {t("browse.showing", {
                    shown: shown.length,
                    total: rows.length,
                  })}
                </Typography>
                {shown.length < rows.length ? (
                  <Button
                    variant="outline"
                    onClick={() => setVisible((n) => n + PAGE_SIZE)}
                  >
                    {t("browse.loadMore")}
                  </Button>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>

      {opened ? (
        <DatasetDialog
          dataset={opened}
          attempt={openByDataset.get(opened.id)}
          onClose={() => setOpened(null)}
        />
      ) : null}
    </main>
  );
}

/**
 * What a bank holds, and the one button — a modal over the catalogue rather than a
 * page of its own: everything it shows is already in the list row, so a route
 * would only add a round trip and a back button.
 *
 * Starting twice is safe (the backend hands back the attempt already open), so a
 * double click cannot strand the first one.
 */
function DatasetDialog({
  dataset,
  attempt,
  onClose,
}: {
  dataset: QaDatasetSummary;
  attempt?: QaAttempt;
  onClose: () => void;
}) {
  const t = useTranslations("web.learn");
  const router = useRouter();
  const start = useStartQaAttempt();
  // Only sizes smaller than the bank are offered — "20" of 12 questions is just "all".
  const sizes = QA_COUNT_OPTIONS.filter((size) => size < dataset.itemCount);
  // `null` = all of them. Ten is a sitting; a bank smaller than that is taken whole.
  const [count, setCount] = useState<number | null>(
    sizes.includes(10) ? 10 : null,
  );
  // An open attempt already has its questions — the picker would be a lie.
  const resuming = attempt !== undefined;

  const begin = () =>
    start.mutate(
      {
        datasetId: dataset.id,
        count: resuming ? undefined : (count ?? undefined),
      },
      { onSuccess: (attempt) => router.push(`/learn/attempts/${attempt.id}`) },
    );

  return (
    <Dialog open onClose={onClose} title={dataset.title}>
      {dataset.description ? (
        <Typography variant="body-3" className="text-muted-foreground">
          {dataset.description}
        </Typography>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        <Badge tone="neutral">
          {t("browse.itemCount", { count: dataset.itemCount })}
        </Badge>
        {dataset.templateKeys.map((value) => (
          <Badge key={value} tone="neutral">
            {t(`shapes.${value}`)}
          </Badge>
        ))}
        {dataset.itemKinds.map((value) => (
          <Badge key={value} tone="neutral">
            {t(`kinds.${value}`)}
          </Badge>
        ))}
        {dataset.difficulties.map((value) => (
          <Badge key={value} tone={DIFFICULTY_TONE[value]}>
            {t(`difficulty.${value}`)}
          </Badge>
        ))}
      </div>

      {!resuming && sizes.length > 0 ? (
        <Select
          label={t("browse.countLabel")}
          value={count === null ? "all" : String(count)}
          onChange={(event) =>
            setCount(
              event.target.value === "all" ? null : Number(event.target.value),
            )
          }
          options={[
            ...sizes.map((value) => ({
              value: String(value),
              label: t("browse.countOption", { count: value }),
            })),
            {
              value: "all",
              label: t("browse.countAll", { count: dataset.itemCount }),
            },
          ]}
        />
      ) : null}

      {start.isError ? <AlertError message={t("dataset.startFailed")} /> : null}

      <div className="space-y-2">
        <Button className="w-full" onClick={begin} loading={start.isPending}>
          {resuming ? t("browse.continue") : t("dataset.start")}
        </Button>
        {resuming ? (
          <Typography variant="body-4" className="text-muted-foreground">
            {t("dataset.resumeHint")}
          </Typography>
        ) : null}
      </div>
    </Dialog>
  );
}

/** Every question of the attempt is answered — nothing left to continue. */
function isAnsweredThrough(attempt: QaAttempt) {
  return attempt.itemCount > 0 && attempt.answeredCount >= attempt.itemCount;
}

function DatasetCard({
  dataset,
  attempt,
  onOpen,
  featured = false,
}: {
  dataset: QaDatasetSummary;
  attempt?: QaAttempt;
  onOpen: () => void;
  featured?: boolean;
}) {
  const t = useTranslations("web.learn");
  const df = useDateFormat();
  const percent =
    attempt && attempt.itemCount > 0
      ? Math.min(
          100,
          Math.round((attempt.answeredCount / attempt.itemCount) * 100),
        )
      : 0;

  return (
    <li
      className={`flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-md ${
        featured ? "sm:col-span-2 xl:col-span-2" : ""
      }`}
    >
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {featured ? <Badge tone="info">{t("browse.featured")}</Badge> : null}
          {dataset.difficulties.map((value) => (
            <Badge key={value} tone={DIFFICULTY_TONE[value]}>
              {t(`difficulty.${value}`)}
            </Badge>
          ))}
        </div>
        <Typography variant="title-2" as="h2">
          <button
            type="button"
            onClick={onOpen}
            className="text-left hover:underline"
          >
            {dataset.title}
          </button>
        </Typography>
        {dataset.description ? (
          <Typography
            variant="body-3"
            className="line-clamp-2 text-muted-foreground"
          >
            {dataset.description}
          </Typography>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge tone="neutral">
          {t("browse.itemCount", { count: dataset.itemCount })}
        </Badge>
        {dataset.templateKeys.map((value) => (
          <Badge key={value} tone="neutral">
            {t(`shapes.${value}`)}
          </Badge>
        ))}
        {dataset.itemKinds.map((value) => (
          <Badge key={value} tone="neutral">
            {t(`kinds.${value}`)}
          </Badge>
        ))}
      </div>

      {attempt ? (
        <div className="space-y-1.5">
          <div className="flex items-start">
            <Typography
              as="span"
              variant="body-4"
              className="flex-1 text-primary"
            >
              {t("browse.inProgress")}
            </Typography>
            <Typography
              as="span"
              variant="body-4"
              className="text-muted-foreground"
            >
              {t("browse.answeredOf", {
                answered: attempt.answeredCount,
                total: attempt.itemCount,
              })}
            </Typography>
          </div>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={attempt.itemCount}
            aria-valuenow={attempt.answeredCount}
            aria-label={t("attempt.progressLabel")}
            className="h-1.5 overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className="mt-auto flex items-center gap-3 border-t border-border pt-4">
        <Typography
          variant="body-4"
          className="flex flex-1 items-center gap-1.5 text-muted-foreground"
        >
          <Icon
            icon={attempt ? LUCIDE.clock : LUCIDE.circleDashed}
            className="size-3.5 shrink-0"
          />
          {attempt
            ? t("browse.startedOn", { date: df.date(attempt.startedAt) })
            : t("browse.notStarted")}
        </Typography>
        {/* Continue skips the modal: there is nothing left to decide. */}
        {attempt ? (
          <Button asChild shape="circle" className="pr-4 pl-5">
            <Link href={`/learn/attempts/${attempt.id}`}>
              {t("browse.continue")}
              <Icon icon={LUCIDE.arrowRight} />
            </Link>
          </Button>
        ) : (
          <Button shape="circle" onClick={onOpen} className="pr-5 pl-4">
            <Icon icon={LUCIDE.play} className="size-4 fill-current" />
            {t("browse.start")}
          </Button>
        )}
      </div>
    </li>
  );
}
