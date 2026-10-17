"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import {
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
import { Icon, ICONS } from "@noalhub/ui/icons";
import { Input } from "@noalhub/ui/input";
import { Select } from "@noalhub/ui/select";
import { Skeleton } from "@noalhub/ui/skeleton";
import { toast } from "@noalhub/ui/toast";
import { Textarea } from "@noalhub/ui/textarea";
import { Typography } from "@noalhub/ui/typography";

import { htmlToMarkdown } from "./clipboard-markdown";
import { EditorShell } from "./qa-editor-shell";

/**
 * Step 1: the dataset's source text, edited in place. One source is open at a time;
 * with several chapters the title becomes a picker. The editor works on Markdown —
 * the rich editor round-trips it, the "raw" view shows the text exactly as stored,
 * which is what goes into the prompt.
 */
export function SourcesStep({ datasetId }: { datasetId: string }) {
  const t = useTranslations("admin.qa");
  const sources = useQaSources(datasetId);
  const remove = useDeleteQaSource(datasetId);
  const [picked, setPicked] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const rows = sources.data ?? [];
  // A removed source must not leave the editor pointing at nothing.
  const activeId = rows.some((row) => row.id === picked) ? picked : (rows[0]?.id ?? null);
  const full = useQaSource(activeId ?? undefined);

  if (sources.isPending) return <Skeleton className="h-96 w-full" />;

  const addDialog = adding ? (
    <Dialog open onClose={() => setAdding(false)} title={t("sources.add")}>
      <AddSourceForm datasetId={datasetId} onSaved={() => setAdding(false)} />
    </Dialog>
  ) : null;

  if (rows.length === 0 || !activeId) {
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

  const picker =
    rows.length > 1 ? (
      <div className="w-72 max-w-full">
        <Select
          label={t("ws.source.pick")}
          hideLabel
          size="sm"
          value={activeId}
          onChange={(event) => setPicked(event.target.value)}
          options={rows.map((row) => ({
            value: row.id,
            label: row.title ?? t("sources.untitled"),
          }))}
        />
      </div>
    ) : null;

  return (
    <div className="flex flex-col gap-3">
      {full.isError ? (
        <AlertError message={t("ws.source.loadFailed")} />
      ) : full.isPending || !full.data ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <SourceEditor
          key={full.data.id}
          datasetId={datasetId}
          source={full.data}
          picker={picker}
          removing={remove.isPending}
          onRemove={() => remove.mutate(activeId)}
        />
      )}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
          {t("ws.source.add")}
        </Button>
      </div>
      {addDialog}
    </div>
  );
}

function SourceEditor({
  datasetId,
  source,
  picker,
  removing,
  onRemove,
}: {
  datasetId: string;
  source: QaDatasetSourceFull;
  picker: React.ReactNode;
  removing: boolean;
  onRemove: () => void;
}) {
  const t = useTranslations("admin.qa");
  const tc = useTranslations("common");
  const update = useUpdateQaSource(datasetId);
  const original = source.content ?? "";
  const [value, setValue] = useState(original);
  const [rich, setRich] = useState(true);
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

  return (
    <EditorShell
      fullscreenTitle={source.title ?? t("sources.untitled")}
      title={
        picker ?? (
          <Typography variant="title-3" className="truncate">
            {source.title ?? t("sources.untitled")}
          </Typography>
        )
      }
      switchLabel={t("ws.source.rawMarkdown")}
      switchOn={rich}
      onSwitchChange={setRich}
      actions={
        <DropdownMenu
          compact
          trigger={
            <Button variant="outline" size="icon-md" aria-label={t("ws.source.actions")}>
              <Icon icon={ICONS.more} />
            </Button>
          }
        >
          <DropdownMenuItem
            icon={ICONS.save}
            disabled={!canSave || update.isPending}
            onSelect={() => void save()}
          >
            {tc("actions.save")}
          </DropdownMenuItem>
          <DropdownMenuItem
            icon={ICONS.delete}
            tone="danger"
            disabled={removing}
            onSelect={onRemove}
          >
            {t("ws.source.remove")}
          </DropdownMenuItem>
        </DropdownMenu>
      }
      onSave={() => void save()}
      saving={update.isPending}
      canSave={canSave}
      error={error}
      fill
      renderEditor={({ className, fullscreen }) =>
        rich ? (
          <MarkdownEditor
            value={value}
            onChange={setValue}
            contentClassName={className}
            fullscreen={fullscreen}
          />
        ) : (
          <Textarea
            aria-label={t("ws.source.rawMarkdown")}
            rows={18}
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        )
      }
    />
  );
}

function AddSourceForm({ datasetId, onSaved }: { datasetId: string; onSaved: () => void }) {
  const t = useTranslations("admin.qa");
  const m = useMessage();
  const add = useAddQaSource(datasetId);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [formError, setFormError] = useState<Message | string | null>(null);

  const tooLong = content.length > MAX_SOURCE_CHARS;

  const onPaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const html = event.clipboardData.getData("text/html");
    if (!html) return;
    // Pasting into a plain textarea turns `<a href>` into bare words and the
    // backend never sees the URL, so read the clipboard's HTML and flatten it to
    // Markdown first. Plain-text pastes are already what we want.
    event.preventDefault();
    const markdown = htmlToMarkdown(html);
    const field = event.currentTarget;
    const start = field.selectionStart ?? content.length;
    const end = field.selectionEnd ?? content.length;
    setContent(content.slice(0, start) + markdown + content.slice(end));
  };

  const save = async () => {
    setFormError(null);
    try {
      await add.mutateAsync({ kind: "text", title: title === "" ? null : title, content });
      setTitle("");
      setContent("");
      onSaved();
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
      <Textarea
        label={t("sources.fields.content")}
        rows={10}
        value={content}
        onPaste={onPaste}
        onChange={(event) => setContent(event.target.value)}
      />
      <div className="flex items-center justify-between gap-3">
        <Typography variant="body-4" className={tooLong ? "text-danger" : "text-muted-foreground"}>
          {t("sources.charCount", { count: content.length, max: MAX_SOURCE_CHARS })}
        </Typography>
        <Button onClick={() => void save()} disabled={add.isPending || content.trim() === "" || tooLong}>
          {t("sources.save")}
        </Button>
      </div>
      {/* Stopped here rather than at the API: a 400 after pasting a whole chapter
          is the worst possible moment to learn about the limit. */}
      {tooLong ? <AlertWarning message={t("sources.tooLong", { max: MAX_SOURCE_CHARS })} /> : null}
      {formError ? <AlertError message={m(formError)} /> : null}
    </div>
  );
}
