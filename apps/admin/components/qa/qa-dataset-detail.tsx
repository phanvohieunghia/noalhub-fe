"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

import {
  MAX_SOURCE_CHARS,
  useAddQaSource,
  useDeleteQaSource,
  useQaDatasets,
  useQaOutlines,
  useQaSource,
  useQaSources,
} from "@noalhub/api/qa";
import type { Message } from "@noalhub/api/message";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import { useMessage } from "@noalhub/i18n/use-message";
import { AlertError, AlertWarning } from "@noalhub/ui/alert";
import { Button } from "@noalhub/ui/button";
import { Input } from "@noalhub/ui/input";
import { Skeleton } from "@noalhub/ui/skeleton";
import { Textarea } from "@noalhub/ui/textarea";
import { Typography } from "@noalhub/ui/typography";

import { AdminErrorState } from "../admin-error-state";
import { AnalyzeButton } from "./analyze-button";
import { htmlToMarkdown } from "./clipboard-markdown";

/**
 * One dataset: the raw sources on the left, the outline versions on the right.
 *
 * The paste box is the one place in the whole feature that can rescue link
 * targets: pasting into a plain textarea turns `<a href>` into bare words, and
 * the backend never sees the URL. So the handler reads `text/html` off the
 * clipboard and flattens it to Markdown before it ever reaches the field.
 */
export function QaDatasetDetail({ datasetId }: { datasetId: string }) {
  const t = useTranslations("admin.qa");
  const datasets = useQaDatasets();
  const sources = useQaSources(datasetId);
  const outlines = useQaOutlines(datasetId);

  const dataset = datasets.data?.find((row) => row.id === datasetId);

  if (datasets.isError) {
    return (
      <main className="w-full p-6">
        <AdminErrorState error={datasets.error} onRetry={() => datasets.refetch()} />
      </main>
    );
  }

  return (
    <main className="w-full p-6">
      <Typography variant="h4" as="h1">
        {dataset?.title ?? <Skeleton className="h-7 w-64" />}
      </Typography>
      {dataset?.description ? (
        <Typography variant="body-3" className="mt-1 opacity-70">
          {dataset.description}
        </Typography>
      ) : null}

      {dataset?.sourceCharWarning ? (
        <div className="mt-4">
          {/* A warning, not a block: the real ceiling is computed from the model
              picked at generate time, and it lives on the backend. */}
          <AlertWarning message={t("datasets.charWarning")} />
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="sources-heading">
          <Typography variant="title-3" as="h2" id="sources-heading">
            {t("sources.title")}
          </Typography>
          <Typography variant="body-3" className="mt-1 opacity-70">
            {t("sources.intro")}
          </Typography>

          <div className="mt-3 space-y-2">
            {sources.isPending ? (
              <Skeleton className="h-20 w-full" />
            ) : (sources.data?.length ?? 0) === 0 ? (
              <Typography variant="body-3" className="opacity-70">
                {t("sources.empty")}
              </Typography>
            ) : (
              sources.data?.map((source) => (
                <SourceRow key={source.id} datasetId={datasetId} source={source} />
              ))
            )}
          </div>

          <AddSourceForm datasetId={datasetId} />
        </section>

        <section aria-labelledby="outlines-heading">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Typography variant="title-3" as="h2" id="outlines-heading">
                {t("outlines.title")}
              </Typography>
              <Typography variant="body-3" className="mt-1 opacity-70">
                {t("outlines.intro")}
              </Typography>
            </div>
            <AnalyzeButton
              datasetId={datasetId}
              disabled={(sources.data?.length ?? 0) === 0}
            />
          </div>

          {/*
            A warning next to the button that creates the next version, because
            that is where someone is about to make another one. It never blocks:
            run 21 may be the one that finally splits the document right.
          */}
          {outlines.data?.versionWarning ? (
            <div className="mt-3">
              <AlertWarning
                message={t("outlines.versionWarning", {
                  count: outlines.data.versionCount,
                })}
              />
            </div>
          ) : null}

          <div className="mt-3 space-y-2">
            {outlines.isPending ? (
              <Skeleton className="h-20 w-full" />
            ) : (outlines.data?.items.length ?? 0) === 0 ? (
              <Typography variant="body-3" className="opacity-70">
                {t("outlines.empty")}
              </Typography>
            ) : (
              outlines.data?.items.map((outline) => (
                <Link
                  key={outline.id}
                  href={`/qa/datasets/${datasetId}/outlines/${outline.id}`}
                  className="block rounded-md border border-border p-3 hover:bg-muted"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Typography variant="title-4">
                      {t("outlines.version", { version: outline.version })}
                      {outline.label ? ` — ${outline.label}` : ""}
                    </Typography>
                    {outline.isCurrent ? (
                      <span className="text-body-4 text-success">
                        {t("outlines.current")}
                      </span>
                    ) : null}
                  </div>
                  <Typography variant="body-4" className="opacity-60">
                    {t("outlines.sections", { count: outline.sectionCount })}
                    {outline.generationId ? "" : ` · ${t("outlines.byHand")}`}
                  </Typography>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

/**
 * A source row that can open its own body. The list endpoint deliberately omits
 * `content`, so the text is fetched per row, only once someone asks for it —
 * expanding every chapter at once is hundreds of KB nobody read.
 */
function SourceRow({
  datasetId,
  source,
}: {
  datasetId: string;
  source: { id: string; title: string | null; charCount: number };
}) {
  const t = useTranslations("admin.qa");
  const remove = useDeleteQaSource(datasetId);
  const [open, setOpen] = useState(false);
  const full = useQaSource(open ? source.id : undefined);
  const bodyId = `source-body-${source.id}`;

  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Typography variant="title-4" className="truncate">
            {source.title ?? t("sources.untitled")}
          </Typography>
          <Typography variant="body-4" className="opacity-60">
            {t("datasets.chars", { count: source.charCount })}
          </Typography>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            aria-expanded={open}
            aria-controls={bodyId}
            onClick={() => setOpen(!open)}
          >
            {open ? t("sources.hide") : t("sources.view")}
          </Button>
          <Button
            variant="outline"
            disabled={remove.isPending}
            onClick={() => remove.mutate(source.id)}
          >
            {t("sources.remove")}
          </Button>
        </div>
      </div>

      {open ? (
        <div id={bodyId} className="mt-3">
          {full.isPending ? (
            <Skeleton className="h-24 w-full" />
          ) : full.isError ? (
            <AlertError message={t("sources.loadFailed")} />
          ) : (
            /* Markdown as stored, not rendered: this view exists to check what
               actually goes into the prompt. */
            <pre className="max-h-96 overflow-auto rounded-md bg-muted p-3 text-body-4 whitespace-pre-wrap break-words">
              {full.data?.content}
            </pre>
          )}
        </div>
      ) : null}
    </div>
  );
}

function AddSourceForm({ datasetId }: { datasetId: string }) {
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
    // Only intercept when the clipboard actually carries HTML — plain text
    // pastes are already what we want, and rewriting them would be lossy.
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
      await add.mutateAsync({
        kind: "text",
        title: title === "" ? null : title,
        content,
      });
      setTitle("");
      setContent("");
    } catch (error) {
      setFormError(applyApiError(error, () => undefined, []));
    }
  };

  return (
    <div className="mt-4 space-y-3 rounded-md border border-border p-3">
      <Typography variant="title-4">{t("sources.add")}</Typography>
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
      {/* Stopped here rather than at the API: a 400 after pasting a whole
          chapter is the worst possible moment to learn about the limit. */}
      {tooLong ? (
        <AlertWarning message={t("sources.tooLong", { max: MAX_SOURCE_CHARS })} />
      ) : null}
      {formError ? <AlertError message={m(formError)} /> : null}
    </div>
  );
}
