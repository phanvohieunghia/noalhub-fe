"use client";

import { Markdown } from "@tiptap/markdown";
import { Editor } from "@tiptap/react";

import { sanitizeBlogDoc, type BlogDoc } from "@noalhub/api/blog";

import {
  BLOG_EXTENSIONS,
  RichTextEditor,
  flattenTaskLists,
  type EditorFullscreen,
} from "./tiptap-editor";

/** Re-exported so apps need not depend on Tiptap just to type `onReady`. */
export type { Editor };

const MARKDOWN_EXTENSIONS = [Markdown];

/**
 * `TiptapEditor`'s twin for content stored as a **markdown string** rather than
 * Tiptap JSON — same toolbar, same allowlisted schema, same stylesheet.
 *
 * Markdown is parsed into that schema on load and serialized back on every
 * keystroke, so anything outside it (h1/h5, raw HTML, task lists) does not
 * survive an edit. That is the point: the stored text never holds what
 * `MarkdownContent` would refuse to render.
 *
 * `value` is read once, on mount — like `TiptapEditor`. To load a different
 * document, remount with a new `key`.
 */
export function MarkdownEditor({
  value,
  onChange,
  contentClassName,
  fullscreen,
  toolbarExtra,
  onReady,
  savedKey,
}: {
  value: string;
  onChange: (markdown: string) => void;
  contentClassName?: string;
  fullscreen?: EditorFullscreen;
  /** Controls pinned to the toolbar's right edge — e.g. a menu that inserts the caller's own tokens. */
  toolbarExtra?: React.ReactNode;
  /** The live Tiptap instance, for callers that insert content programmatically. Pass a stable callback. */
  onReady?: (editor: Editor | null) => void;
  /** Bump after a successful save to clear the change highlights. */
  savedKey?: number;
}) {
  return (
    <RichTextEditor
      content={value}
      contentType="markdown"
      extensions={MARKDOWN_EXTENSIONS}
      onUpdate={(editor) => onChange(editor.getMarkdown())}
      contentClassName={contentClassName}
      fullscreen={fullscreen}
      toolbarExtra={toolbarExtra}
      onReady={onReady}
      savedKey={savedKey}
    />
  );
}

/**
 * Switching a document between the two formats. Runs a throwaway headless
 * editor over the very schema the editors use, so the result is something
 * both editors open unchanged — browser only (it needs a DOM), i.e. call it
 * from an event handler, not during render.
 */
export function blogDocToMarkdown(doc: BlogDoc): string {
  return withHeadlessEditor(doc, "json", (editor) => editor.getMarkdown());
}

const IMAGE_LINE = /^\s*!\[[^\]]*\]\([^)]*\)\s*$/;

/**
 * The `image` node is a block, but markdown happily puts `![](url)` on the line
 * right under a sentence — which parses as an inline image inside that
 * paragraph, and a paragraph cannot hold one, so the picture silently vanishes.
 * Giving every image-only line its own paragraph keeps it.
 */
function isolateImages(markdown: string): string {
  const out: string[] = [];
  let fenced = false;
  for (const line of markdown.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    const isImage = !fenced && IMAGE_LINE.test(line);
    const previous = out[out.length - 1];
    if (isImage && previous !== undefined && previous.trim() !== "") out.push("");
    else if (!isImage && previous !== undefined && IMAGE_LINE.test(previous) && line.trim() !== "") out.push("");
    out.push(line);
  }
  return out.join("\n");
}

/** The reverse of `blogDocToMarkdown`, sanitized like every other doc write. */
export function markdownToBlogDoc(markdown: string): BlogDoc {
  return withHeadlessEditor(isolateImages(flattenTaskLists(markdown)), "markdown", (editor) =>
    sanitizeBlogDoc(editor.getJSON()),
  );
}

function withHeadlessEditor<T>(
  content: BlogDoc | string,
  contentType: "json" | "markdown",
  read: (editor: Editor) => T,
): T {
  const editor = new Editor({
    extensions: [...BLOG_EXTENSIONS, ...MARKDOWN_EXTENSIONS],
    content,
    contentType,
  });
  try {
    return read(editor);
  } finally {
    editor.destroy();
  }
}
