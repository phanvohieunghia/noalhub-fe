"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import {
  CHARS_PER_TOKEN,
  MAX_SOURCE_CHARS,
  useAddQaSource,
  useDeleteQaSource,
  useQaSource,
  useQaSources,
  useUpdateQaSource,
  type QaDatasetSourceFull,
} from "@noalhub/api/qa";
import type { Message } from "@noalhub/api/message";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import { useMessage } from "@noalhub/i18n/use-message";
import { AlertError, AlertWarning } from "@noalhub/ui/alert";
import { MarkdownEditor } from "@noalhub/ui/blog/markdown-editor";
import { Button } from "@noalhub/ui/button";
import { Dialog } from "@noalhub/ui/dialog";
import { DropdownMenu, DropdownMenuItem } from "@noalhub/ui/dropdown-menu";
import { Icon, ICONS, LUCIDE } from "@noalhub/ui/icons";
import { InlineTextField } from "@noalhub/ui/inline-text-field";
import { Input } from "@noalhub/ui/input";
import { MetricsCard, type MetricItem } from "@noalhub/ui/metrics-card";
import { Skeleton } from "@noalhub/ui/skeleton";
import { toast } from "@noalhub/ui/toast";
import { Tooltip } from "@noalhub/ui/tooltip";
import { Typography } from "@noalhub/ui/typography";

import { EditorShell } from "./qa-editor-shell";
import { textStats } from "./qa-plain-doc";
import { useFitHeight } from "./use-fit-height";

/**
 * Step 1: the dataset's source text, edited in place. Every source is fetched up
 * front; the first starts open, the rest folded. The editor works on Markdown,
 * which is what goes into the prompt.
 */
export function SourcesStep({ datasetId }: { datasetId: string }) {
  const t = useTranslations("admin.qa");
  const sources = useQaSources(datasetId);
  const remove = useDeleteQaSource(datasetId);
  // `null` = untouched: the first source starts open, the rest folded.
  const [openIds, setOpenIds] = useState<string[] | null>(null);
  const [adding, setAdding] = useState(false);
  const listRef = useFitHeight<HTMLDivElement>();

  const rows = sources.data ?? [];

  if (sources.isPending) return <Skeleton className="h-96 w-full" />;

  const opened = openIds ?? (rows[0] ? [rows[0].id] : []);
  const toggle = (id: string) => {
    setOpenIds(opened.includes(id) ? opened.filter((x) => x !== id) : [...opened, id]);
  };

  const addDialog = adding ? (
    <Dialog
      open
      size="lg"
      onClose={() => setAdding(false)}
      title={t("sources.add")}
    >
      <AddSourceForm
        datasetId={datasetId}
        onSaved={(id) => {
          setAdding(false);
          // Show what was just added.
          if (id) setOpenIds([...opened, id]);
        }}
      />
    </Dialog>
  ) : null;

  if (rows.length === 0) {
    return (
      <section className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-10">
        <Typography variant="body-3" className="text-muted-foreground">
          {t("ws.source.empty")}
        </Typography>
        <Button onClick={() => setAdding(true)}>{t("ws.source.add")}</Button>
        {addDialog}
      </section>
    );
  }

  return (
    // The list is the scroller, ending at the bottom of the viewport: the step tabs
    // above stay put, and the editors inside just grow.
    <div
      ref={listRef}
      className="flex max-h-[var(--fit-h,70vh)] min-h-0 flex-col gap-3 overflow-y-auto [&>*]:shrink-0"
    >
      <div className="flex justify-end">
        <Tooltip label={t("ws.source.add")}>
          <Button
            variant="outline"
            size="icon-md"
            aria-label={t("ws.source.add")}
            onClick={() => setAdding(true)}
          >
            <Icon icon={ICONS.add} />
          </Button>
        </Tooltip>
      </div>
      {/* Every source is mounted folded, so its full text and metrics are fetched up
        front instead of on first open. */}
      {rows.map((row) => (
        <OpenSource
          key={row.id}
          datasetId={datasetId}
          id={row.id}
          collapsed={!opened.includes(row.id)}
          removing={remove.isPending}
          onRemove={() => remove.mutate(row.id)}
          onToggle={() => toggle(row.id)}
        />
      ))}
      {addDialog}
    </div>
  );
}

/** One source, open or folded: fetches its full text as soon as it is mounted. */
function OpenSource({
  datasetId,
  id,
  collapsed,
  removing,
  onRemove,
  onToggle,
}: {
  datasetId: string;
  id: string;
  collapsed: boolean;
  removing: boolean;
  onRemove: () => void;
  onToggle: () => void;
}) {
  const t = useTranslations("admin.qa");
  const full = useQaSource(id);

  if (full.isError) return <AlertError message={t("ws.source.loadFailed")} />;
  if (full.isPending || !full.data) return <Skeleton className="h-96 w-full" />;
  return (
    <SourceEditor
      datasetId={datasetId}
      source={full.data}
      collapsed={collapsed}
      removing={removing}
      onRemove={onRemove}
      onToggle={onToggle}
    />
  );
}

function SourceEditor({
  datasetId,
  source,
  collapsed,
  removing,
  onRemove,
  onToggle,
}: {
  datasetId: string;
  source: QaDatasetSourceFull;
  collapsed: boolean;
  removing: boolean;
  onRemove: () => void;
  onToggle: () => void;
}) {
  const t = useTranslations("admin.qa");
  const update = useUpdateQaSource(datasetId);
  const original = source.content ?? "";
  const [value, setValue] = useState(original);
  const [saved, setSaved] = useState(original);
  const [error, setError] = useState<string | null>(null);

  const canSave = value !== saved && value.trim() !== "";

  const save = async () => {
    setError(null);
    try {
      await update.mutateAsync({ id: source.id, input: { content: value } });
      setSaved(value);
      toast.success(t("ws.source.saved"));
    } catch {
      setError(t("ws.source.saveFailed"));
    }
  };

  // ⌘S / Ctrl+S saves instead of opening the browser's "save page" dialog.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (canSave && !update.isPending) void save();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const stats = useMemo(() => textStats(value), [value]);
  const readMinutes = Math.max(1, Math.ceil(stats.words / 230));
  const fmt = (n: number) => n.toLocaleString("en-US");
  const statItems: MetricItem[] = [
    {
      key: "words",
      icon: LUCIDE.fileText,
      iconClass: "text-primary",
      value: fmt(stats.words),
      label: t("ws.source.metrics.words"),
    },
    {
      key: "characters",
      icon: LUCIDE.type,
      iconClass: "text-brand-500",
      value: fmt(stats.characters),
      label: t("ws.source.metrics.characters"),
    },
    {
      key: "tokens",
      icon: LUCIDE.zap,
      iconClass: "text-success",
      value: fmt(Math.ceil(stats.characters / CHARS_PER_TOKEN)),
      label: t("ws.source.metrics.tokens"),
    },
    {
      key: "readTime",
      icon: LUCIDE.clock,
      iconClass: "text-warning",
      value: `~${readMinutes}`,
      label: t("ws.source.metrics.readTime"),
      detail: t("ws.source.metrics.minutes", { count: readMinutes }),
    },
  ];

  const statusLabel = update.isPending
    ? t("ws.source.statusSaving")
    : value !== saved
      ? t("ws.source.statusUnsaved")
      : t("ws.source.statusSaved");

  return (
    <>
      <EditorShell
        fullscreenTitle={source.title ?? t("sources.untitled")}
        title={
          <div className="flex min-w-0 items-center gap-2">
            <Tooltip label={t(collapsed ? "ws.source.expand" : "ws.source.collapse")}>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-expanded={!collapsed}
                aria-label={t(collapsed ? "ws.source.expand" : "ws.source.collapse")}
                onClick={onToggle}
              >
                <Icon
                  icon={collapsed ? ICONS.chevronRight : ICONS.chevronDown}
                  animate="snappy"
                />
              </Button>
            </Tooltip>
            <SourceTitleField datasetId={datasetId} source={source} />
            <Tooltip label={statusLabel}>
              <span
                role="status"
                tabIndex={0}
                aria-label={statusLabel}
                className={`hidden size-5 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex ${
                  value !== saved || update.isPending
                    ? "text-warning"
                    : "text-success"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full bg-current"
                />
              </span>
            </Tooltip>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Tooltip label={`${t("ws.source.saveChanges")} (⌘S)`}>
              {/* The span takes the hover: a disabled button swallows pointer events. */}
              <span className="inline-flex">
                <Button
                  size="icon-md"
                  disabled={!canSave || update.isPending}
                  aria-label={t("ws.source.saveChanges")}
                  aria-keyshortcuts="Meta+S Control+S"
                  onClick={() => void save()}
                >
                  <Icon icon={LUCIDE.save} />
                </Button>
              </span>
            </Tooltip>
            <DropdownMenu
              compact
              trigger={
                <Button
                  variant="outline"
                  size="icon-md"
                  aria-label={t("ws.source.actions")}
                >
                  <Icon icon={ICONS.more} />
                </Button>
              }
            >
              <DropdownMenuItem
                icon={ICONS.delete}
                tone="danger"
                disabled={removing}
                onSelect={onRemove}
              >
                {t("ws.source.remove")}
              </DropdownMenuItem>
            </DropdownMenu>
          </div>
        }
        onSave={() => void save()}
        saving={update.isPending}
        canSave={canSave}
        error={error}
        grow
        collapsed={collapsed}
        meta={
          <MetricsCard
            title={t("ws.source.metrics.title")}
            items={statItems}
            className="hidden lg:flex"
          />
        }
        renderEditor={({ className, fullscreen }) => (
          <MarkdownEditor
            value={value}
            onChange={setValue}
            contentClassName={className}
            fullscreen={fullscreen}
          />
        )}
      />
    </>
  );
}

function SourceTitleField({
  datasetId,
  source,
}: {
  datasetId: string;
  source: QaDatasetSourceFull;
}) {
  const t = useTranslations("admin.qa");
  const update = useUpdateQaSource(datasetId);

  return (
    <InlineTextField
      value={source.title ?? ""}
      placeholder={t("sources.untitled")}
      label={t("sources.fields.title")}
      onSubmit={async (title) => {
        try {
          // An empty title goes back to `null`, i.e. "Untitled".
          await update.mutateAsync({
            id: source.id,
            input: { title: title === "" ? null : title },
          });
        } catch (error) {
          toast.error(t("ws.source.saveFailed"));
          throw error;
        }
      }}
    />
  );
}

function AddSourceForm({
  datasetId,
  onSaved,
}: {
  datasetId: string;
  onSaved: (id?: string) => void;
}) {
  const t = useTranslations("admin.qa");
  const m = useMessage();
  const add = useAddQaSource(datasetId);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [formError, setFormError] = useState<Message | string | null>(null);

  const tooLong = content.length > MAX_SOURCE_CHARS;

  const save = async () => {
    setFormError(null);
    try {
      const created = await add.mutateAsync({
        kind: "text",
        title: title === "" ? null : title,
        content,
      });
      setTitle("");
      setContent("");
      onSaved(created.id);
    } catch (error) {
      setFormError(applyApiError(error, () => undefined, []));
    }
  };

  return (
    <div className="space-y-3">
      <Input
        label={t("sources.fields.title")}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <div className="space-y-1.5">
        <Typography variant="body-4" as="span" className="font-medium">
          {t("sources.fields.content")}
        </Typography>
        {/* The same editor as editing a source: paste, images and Markdown behave alike. */}
        <MarkdownEditor
          value={content}
          onChange={setContent}
          contentClassName="min-h-[320px] max-h-[50dvh] overflow-y-auto overscroll-contain"
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <Typography
          variant="body-4"
          className={tooLong ? "text-danger" : "text-muted-foreground"}
        >
          {t("sources.charCount", {
            count: content.length,
            max: MAX_SOURCE_CHARS,
          })}
        </Typography>
        <Button
          onClick={() => void save()}
          disabled={add.isPending || content.trim() === "" || tooLong}
        >
          {t("sources.save")}
        </Button>
      </div>
      {/* Stopped here rather than at the API: a 400 after pasting a whole chapter
          is the worst possible moment to learn about the limit. */}
      {tooLong ? (
        <AlertWarning
          message={t("sources.tooLong", { max: MAX_SOURCE_CHARS })}
        />
      ) : null}
      {formError ? <AlertError message={m(formError)} /> : null}
    </div>
  );
}
