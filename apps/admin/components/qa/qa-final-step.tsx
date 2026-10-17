"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  useAddToQaFinalSet,
  useDeleteQaItem,
  useQaFinalSet,
  useUpdateQaItem,
  type QaFinalEntry,
  type QaFinalGroup,
} from "@noalhub/api/qa";
import { AlertError } from "@noalhub/ui/alert";
import { Badge } from "@noalhub/ui/badge";
import { Button } from "@noalhub/ui/button";
import { DropdownMenu, DropdownMenuItem } from "@noalhub/ui/dropdown-menu";
import { Icon, ICONS, LUCIDE } from "@noalhub/ui/icons";
import { Skeleton } from "@noalhub/ui/skeleton";
import { Toggle } from "@noalhub/ui/toggle";
import { Typography } from "@noalhub/ui/typography";

import { QaItemEditDialog } from "./qa-item-edit-dialog";
import { QaReviewQuestion } from "./qa-review-question";
import { useFitHeight } from "./use-fit-height";

/**
 * Step 4: the questions that were approved, and what of them is already in the
 * final set — the copies learners actually see. Before the set exists it is one
 * flat list and a "Create final set" button; afterwards it is grouped by section,
 * with the approved-but-not-yet-added questions flagged "New" and addable one by
 * one or all at once.
 */
export function QaFinalStep({ datasetId }: { datasetId: string }) {
  const t = useTranslations("admin.qa");
  const final = useQaFinalSet(datasetId);
  const add = useAddToQaFinalSet(datasetId);
  const [editing, setEditing] = useState<{ entry: QaFinalEntry; section: string } | null>(null);
  const [view, setView] = useState<"full" | "hover">("full");
  const listRef = useFitHeight<HTMLDivElement>();

  if (final.isPending) return <Skeleton className="h-64 w-full" />;
  if (final.isError) return <AlertError message={t("ws.sets.loadFailed")} />;

  const { groups } = final.data;
  const entries = groups.flatMap((group) => group.entries);
  const hasFinal = groups.some((group) => group.inFinalSet);
  const inDatabase = entries.filter((entry) => entry.state === "added").length;
  const waiting = entries.filter((entry) => entry.state === "new").length;

  if (entries.length === 0) {
    return (
      <section className="rounded-lg border border-border bg-surface p-6">
        <Typography variant="body-3" className="text-muted-foreground">
          {t("ws.final.empty")}
        </Typography>
      </section>
    );
  }

  const questionActions = (entry: QaFinalEntry, section: string) => (
    <>
      {entry.state === "new" && hasFinal ? (
        <Badge tone="warning" size="sm">
          {t("ws.final.newTag")}
        </Badge>
      ) : null}
      <Button
        variant="outline"
        size="icon-md"
        aria-label={t("ws.final.edit")}
        onClick={() => setEditing({ entry, section })}
      >
        <Icon icon={ICONS.edit} />
      </Button>
      {entry.state === "new" && hasFinal ? (
        <Button
          size="icon-md"
          aria-label={t("ws.final.add")}
          disabled={add.isPending}
          onClick={() => add.mutate([entry.item.id])}
        >
          <Icon icon={ICONS.add} />
        </Button>
      ) : null}
      <EntryMenu item={entry.item} />
    </>
  );

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
        <Typography variant="title-3" as="h2" className="flex-1">
          {hasFinal
            ? t("ws.final.headingCreated", { count: inDatabase })
            : t("ws.final.headingNew", { count: entries.length })}
        </Typography>
        <Toggle
          variant="outline"
          aria-label={t("ws.sets.viewMode")}
          value={view}
          onValueChange={setView}
          options={[
            { value: "full", icon: LUCIDE.listChecks, label: t("ws.sets.viewFull") },
            {
              value: "hover",
              icon: LUCIDE.mousePointerClick,
              label: t("ws.sets.viewHover"),
            },
          ]}
        />
        {!hasFinal ? (
          <Button disabled={add.isPending} onClick={() => add.mutate(undefined)}>
            {t("ws.final.create")}
          </Button>
        ) : waiting > 0 ? (
          <Button disabled={add.isPending} onClick={() => add.mutate(undefined)}>
            {t("ws.final.addNew", { count: waiting })}
          </Button>
        ) : null}
      </div>

      {add.isError ? <AlertError message={t("ws.final.saveFailed")} /> : null}

      <div
        ref={listRef}
        className="flex max-h-[var(--fit-h,70vh)] min-h-0 flex-col gap-3 overflow-y-auto"
      >
        {entries.map((entry, index) => {
          const tags = sectionTagOf(groups, entry);
          return (
            <QaReviewQuestion
              key={entry.item.id}
              item={entry.item}
              index={index}
              shapeLabel={shapeOf(t, entry.templateKey)}
              tags={tags}
              revealOnHover={view === "hover"}
              actions={questionActions(entry, tags[0] ?? "")}
            />
          );
        })}
      </div>

      {editing ? (
        <QaItemEditDialog
          key={editing.entry.item.id}
          item={editing.entry.item}
          shapeLabel={shapeOf(t, editing.entry.templateKey)}
          sectionTitle={editing.section}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </section>
  );
}

/** Reject or delete one question — the same menu as the review step. */
function EntryMenu({ item }: { item: QaFinalEntry["item"] }) {
  const t = useTranslations("admin.qa");
  const update = useUpdateQaItem(item.setId);
  const remove = useDeleteQaItem(item.setId);

  return (
    <DropdownMenu
      compact
      trigger={
        <Button variant="outline" size="icon-md" aria-label={t("ws.sets.actions")}>
          <Icon icon={ICONS.more} />
        </Button>
      }
    >
      <DropdownMenuItem
        icon={ICONS.close}
        disabled={update.isPending}
        onSelect={() => update.mutate({ id: item.id, input: { reviewStatus: "rejected" } })}
      >
        {t("ws.sets.reject")}
      </DropdownMenuItem>
      <DropdownMenuItem
        icon={ICONS.delete}
        tone="danger"
        disabled={remove.isPending}
        onSelect={() => remove.mutate(item.id)}
      >
        {t("ws.sets.delete")}
      </DropdownMenuItem>
    </DropdownMenu>
  );
}

function shapeOf(t: ReturnType<typeof useTranslations<"admin.qa">>, key: string): string {
  return key ? t(`templates.shapes.${key}` as "templates.shapes.multiple_choice") : "";
}

/** The section a question belongs to, as a tag — used on the flat, pre-creation list. */
function sectionTagOf(groups: QaFinalGroup[], entry: QaFinalEntry): string[] {
  const group = groups.find((g) => g.entries.includes(entry));
  return group?.sectionTitle ? [group.sectionTitle] : [];
}
