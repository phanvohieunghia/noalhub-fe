"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

import type { BlogDoc } from "@noalhub/api/blog";
import type { Message } from "@noalhub/api/message";
import {
  useQaOutline,
  useQaOutlines,
  useSetCurrentOutline,
  useUpdateQaOutline,
  type QaContentFormat,
} from "@noalhub/api/qa";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import { useMessage } from "@noalhub/i18n/use-message";
import { AlertError, AlertWarning } from "@noalhub/ui/alert";
import { Button } from "@noalhub/ui/button";
import { Input } from "@noalhub/ui/input";
import { Skeleton } from "@noalhub/ui/skeleton";
import {
  MarkdownEditor,
  blogDocToMarkdown,
  markdownToBlogDoc,
} from "@noalhub/ui/blog/markdown-editor";
import { TiptapEditor } from "@noalhub/ui/blog/tiptap-editor";
import { Textarea } from "@noalhub/ui/textarea";
import { Typography } from "@noalhub/ui/typography";

import { AdminErrorState } from "../admin-error-state";
import { GenerateSetsButton } from "./generate-sets-button";

const FORMATS: readonly QaContentFormat[] = ["doc", "markdown"];
const EMPTY_DOC: BlogDoc = { type: "doc", content: [{ type: "paragraph" }] };
const EDITOR_SURFACE = "max-h-[calc(100vh-22rem)] overflow-y-auto";

/**
 * Where "the model drafts, a person signs off" happens.
 *
 * Two things about this screen are easy to get wrong:
 *
 * 1. **The outline on the right is derived and read-only.** It comes from the
 *    backend, which recomputes it from `content` on every write. There is no
 *    per-section edit box because there are no section rows — a section IS a
 *    heading in the document. Editing the outline means editing a heading.
 * 2. **A 409 keeps what you typed.** Two admins saving at once is a real case,
 *    and reloading on their behalf throws away the paragraph they just wrote.
 */
export function QaOutlineEditor({
  datasetId,
  outlineId,
}: {
  datasetId: string;
  outlineId: string;
}) {
  const outline = useQaOutline(outlineId);

  if (outline.isError) {
    return (
      <main className="w-full p-6">
        <AdminErrorState error={outline.error} onRetry={() => outline.refetch()} />
      </main>
    );
  }

  if (outline.isPending || !outline.data) {
    return (
      <main className="w-full space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </main>
    );
  }

  return (
    <Loaded datasetId={datasetId} outlineId={outlineId} initial={outline.data} />
  );
}

function Loaded({
  datasetId,
  outlineId,
  initial,
}: {
  datasetId: string;
  outlineId: string;
  initial: NonNullable<ReturnType<typeof useQaOutline>["data"]>;
}) {
  const t = useTranslations("admin.qa");
  const tc = useTranslations("common");
  const m = useMessage();

  const versions = useQaOutlines(datasetId);
  const update = useUpdateQaOutline(outlineId, datasetId);
  const setCurrent = useSetCurrentOutline(datasetId);

  /*
   * Each format keeps its own state and only the active one is saved. A switch
   * converts from the side on screen, so whatever the other format cannot hold
   * is dropped then — the hint under the switch says so, and nothing is lost
   * on the server until Save.
   */
  const [format, setFormat] = useState<QaContentFormat>(initial.contentFormat);
  const [doc, setDoc] = useState<BlogDoc>(() =>
    initial.contentFormat === "doc" ? initial.content : EMPTY_DOC,
  );
  const [markdown, setMarkdown] = useState(() =>
    initial.contentFormat === "markdown" ? initial.content : "",
  );
  // Raw markdown in a textarea — the way to paste markdown in as text rather
  // than have the editor treat it as literal characters.
  const [showSource, setShowSource] = useState(false);
  // Bumped whenever the editor must re-read its value: both editors read
  // `value` on mount only.
  const [editorKey, setEditorKey] = useState(0);
  const [label, setLabel] = useState(initial.label ?? "");
  const [saveError, setSaveError] = useState<Message | string | null>(null);

  const switchFormat = (next: QaContentFormat) => {
    if (next === format) return;
    if (next === "markdown") setMarkdown(blogDocToMarkdown(doc));
    else setDoc(markdownToBlogDoc(markdown));
    setFormat(next);
    setShowSource(false);
    setEditorKey((key) => key + 1);
  };

  const toggleSource = () => {
    setShowSource((shown) => !shown);
    setEditorKey((key) => key + 1);
  };

  const save = async () => {
    setSaveError(null);
    try {
      await update.mutateAsync({
        ...(format === "markdown"
          ? { contentFormat: "markdown", content: markdown }
          : { contentFormat: "doc", content: doc }),
        label: label === "" ? null : label,
      });
    } catch (error) {
      // Deliberately does NOT reload: the editor keeps what is on screen so the
      // author can copy it out before pulling the other version in.
      setSaveError(applyApiError(error, () => undefined, []));
    }
  };

  return (
    <main className="w-full p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Typography variant="h4" as="h1">
            {t("outlines.version", { version: initial.version })}
          </Typography>
          <Typography variant="body-3" className="mt-1 opacity-70">
            {t("outlines.editorIntro")}
          </Typography>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/qa/datasets/${datasetId}`}>{t("outlines.backToDataset")}</Link>
          </Button>
          {!initial.isCurrent ? (
            <Button
              variant="outline"
              disabled={setCurrent.isPending}
              onClick={() => setCurrent.mutate(outlineId)}
            >
              {t("outlines.makeCurrent")}
            </Button>
          ) : null}
          {/* Generating questions reads the sections of THIS version, so the
              button belongs next to them rather than on the dataset screen. */}
          <GenerateSetsButton outlineId={outlineId} sections={initial.outline} />
          <Button onClick={() => void save()} disabled={update.isPending}>
            {tc("actions.save")}
          </Button>
        </div>
      </div>

      {versions.data?.versionWarning ? (
        <div className="mt-3">
          <AlertWarning
            message={t("outlines.versionWarning", {
              count: versions.data.versionCount,
            })}
          />
        </div>
      ) : null}

      {saveError ? (
        <div className="mt-3">
          <AlertError message={m(saveError)} />
        </div>
      ) : null}

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <Input
            label={t("outlines.label")}
            hint={t("outlines.labelHint")}
            value={label}
            onChange={(event) => setLabel(event.target.value)}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div
              role="group"
              aria-label={t("outlines.format")}
              className="flex gap-1 rounded-md border border-border p-1"
            >
              {FORMATS.map((option) => (
                <Button
                  key={option}
                  size="sm"
                  variant={format === option ? "primary" : "ghost"}
                  aria-pressed={format === option}
                  onClick={() => switchFormat(option)}
                >
                  {t(`outlines.formats.${option}`)}
                </Button>
              ))}
            </div>
            {format === "markdown" ? (
              <Button size="sm" variant="outline" onClick={toggleSource}>
                {showSource ? t("outlines.hideSource") : t("outlines.showSource")}
              </Button>
            ) : null}
          </div>
          <Typography variant="body-4" className="text-muted-foreground">
            {t("outlines.formatHint")}
          </Typography>

          {/* The same editor the blog uses — one Tiptap schema, so what is
              allowed here is exactly what the backend keeps. A dataset is a
              whole document, so the surface is capped to the viewport and
              scrolls inside; otherwise the save button is a page away. */}
          {format === "doc" ? (
            <TiptapEditor
              key={editorKey}
              value={doc}
              onChange={setDoc}
              contentClassName={EDITOR_SURFACE}
            />
          ) : showSource ? (
            <Textarea
              label={t("outlines.source")}
              value={markdown}
              onChange={(event) => setMarkdown(event.target.value)}
              className="min-h-80 font-mono"
              rows={24}
            />
          ) : (
            <MarkdownEditor
              key={editorKey}
              value={markdown}
              onChange={setMarkdown}
              contentClassName={EDITOR_SURFACE}
            />
          )}
        </div>

        <aside className="space-y-2">
          <Typography variant="title-3" as="h2">
            {t("outlines.sectionsTitle")}
          </Typography>
          <Typography variant="body-4" className="text-muted-foreground">
            {t("outlines.sectionsHint")}
          </Typography>
          <ol className="space-y-1">
            {initial.outline.map((entry) => (
              <li
                key={entry.anchor}
                className={
                  entry.level === 4 ? "pl-8" : entry.level === 3 ? "pl-4" : undefined
                }
              >
                <Typography variant="body-3">{entry.title}</Typography>
                <Typography variant="body-4" className="text-muted-foreground">
                  <code>{entry.anchor}</code> ·{" "}
                  {t("datasets.chars", { count: entry.charCount })}
                </Typography>
              </li>
            ))}
          </ol>
          {initial.outline.length === 0 ? (
            <Typography variant="body-3" className="opacity-70">
              {t("outlines.noSections")}
            </Typography>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
