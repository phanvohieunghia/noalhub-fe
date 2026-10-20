"use client";

import Heading from "@tiptap/extension-heading";
import Image from "@tiptap/extension-image";
import Paragraph from "@tiptap/extension-paragraph";
import TextAlign from "@tiptap/extension-text-align";
import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
  type Extensions,
} from "@tiptap/react";
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from "@tiptap/extension-table";
import { NodeSelection, Plugin } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import StarterKit from "@tiptap/starter-kit";
// Type-only: `contentType` on the editor options is declared by this package's
// module augmentation. Nothing is bundled — `MarkdownEditor` adds the runtime.
import type {} from "@tiptap/markdown";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  BLOG_CODE_LANGUAGES,
  formatImageTitle,
  isSafeImageSrc,
  isSafeLinkHref,
  parseImageTitle,
  sanitizeBlogDoc,
  type BlogDoc,
} from "@noalhub/api/blog";
import {
  MEDIA_IMAGE_MIMES,
  useUploadMedia,
  type MediaAsset,
} from "@noalhub/api/media";
import { messageOf, type Message } from "@noalhub/api/message";
import { useMessage } from "@noalhub/i18n/use-message";
import { useTranslations } from "next-intl";
import { Button } from "../button";
import { Dialog } from "../dialog";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../dropdown-menu";
import { Alert, AlertError } from "../alert";
import { Icon, ICONS, LUCIDE, type IconName } from "../icons";
import { Input } from "../input";
import { Select } from "../select";
import { Tooltip } from "../tooltip";

import { ImageUploadButton } from "../media/image-upload-button";
import { Typography } from "../typography";

// The editor writes into a `.post-prose` element, so it needs the very same
// stylesheet the renderer uses — otherwise what is typed and what is published
// look different.
import { formatAlignMarker, takeAlignMarker } from "./align-markdown";
import "./post-prose.css";

/**
 * The `image` node carries `width`/`height` **from day one**.
 *
 * Adding them later would mean a `jsonb` migration across every post ever
 * written, so they go in now. Without the two numbers, `next/image` either
 * guesses the ratio (distorted images), falls back to `<img>` (losing
 * optimization), or takes a **CLS** hit — a Core Web Vitals metric, and
 * therefore squarely inside this plan's SEO goal (`docs/blog.md` §3.1b).
 */
type ImageAttrs = {
  width?: number | null;
  height?: number | null;
  widthPercent?: number | null;
  align?: string | null;
};

/** The pixel size as a style — only while no share-of-column size overrides it. */
function pixelStyle(attributes: ImageAttrs) {
  return !attributes.widthPercent && attributes.width && attributes.height
    ? { style: `width:${attributes.width}px;height:${attributes.height}px` }
    : {};
}

const BlogImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      /*
       * How the size reaches the picture: as an inline `style`, because the
       * resize view reads `width`/`height` once and then leaves the element
       * alone. `style` is what its `onUpdate` re-applies, so the pixel size and
       * the share-of-column size both go through it (and exclude each other).
       */
      width: {
        default: null,
        renderHTML: (attributes: ImageAttrs) => ({
          ...(attributes.width ? { width: attributes.width } : {}),
          ...pixelStyle(attributes),
        }),
      },
      height: {
        default: null,
        renderHTML: (attributes: ImageAttrs) =>
          attributes.height ? { height: attributes.height } : {},
      },
      widthPercent: {
        default: null,
        parseHTML: () => null,
        renderHTML: (attributes: ImageAttrs) =>
          attributes.widthPercent
            ? { style: "width:100%;height:auto" }
            : {},
      },
      // Shown through a data attribute (not `style`): the resize view writes
      // `style.width/height` on the same element and a `style` here would wipe it.
      align: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-image-align"),
        renderHTML: (attributes: ImageAttrs) =>
          attributes.align ? { "data-image-align": attributes.align } : {},
      },
    };
  },
  /*
   * The resize view applies the pixel size once, on creation, and would paint
   * over the size. Put it back right after. A share of the column is carried by
   * the wrapper (see the decoration below), so the picture itself just fills it
   * — that way the selection frame hugs the picture instead of the whole row.
   */
  addNodeView() {
    const make = this.parent?.();
    if (!make) return null;
    return (props) => {
      const view = make(props);
      const percent = props.node.attrs.widthPercent;
      const img = view.dom.querySelector("img");
      if (percent && img) img.style.cssText = "width:100%;height:auto";
      return view;
    };
  },
  /*
   * Dragging a corner commits pixels; a stale share would then win over them
   * on the next paint, so the drag clears it.
   */
  addProseMirrorPlugins() {
    return [
      // The share of the column, as a custom property on the node view's
      // container; `post-prose.css` turns it into the wrapper's width.
      new Plugin({
        props: {
          decorations: ({ doc }) => {
            const found: Decoration[] = [];
            doc.descendants((node, pos) => {
              if (node.type.name === "image" && node.attrs.widthPercent) {
                found.push(
                  Decoration.node(pos, pos + node.nodeSize, {
                    class: "image-sized",
                    style: `--image-width:${node.attrs.widthPercent}%`,
                  }),
                );
              }
            });
            return found.length ? DecorationSet.create(doc, found) : null;
          },
        },
      }),
      /*
       * A text selection that sweeps over an image paints the text but leaves
       * the picture untouched, so the highlight looks full of holes. Tag the
       * images inside the range; `post-prose.css` tints them like the text.
       * (A selection of the image alone already has `ProseMirror-selectednode`.)
       */
      new Plugin({
        props: {
          decorations: (state) => {
            const { selection, doc } = state;
            if (selection.empty || selection instanceof NodeSelection) return null;
            const found: Decoration[] = [];
            doc.nodesBetween(selection.from, selection.to, (node, pos) => {
              if (node.type.name === "image") {
                found.push(
                  Decoration.node(pos, pos + node.nodeSize, {
                    class: "image-in-selection",
                  }),
                );
              }
            });
            return found.length ? DecorationSet.create(doc, found) : null;
          },
        },
      }),
      new Plugin({
        appendTransaction: (transactions, oldState, newState) => {
          if (!transactions.some((tr) => tr.docChanged)) return null;
          // Attribute-only edits keep the document size; anything else (typing,
          // pasting) shifts positions and is not a resize.
          if (oldState.doc.content.size !== newState.doc.content.size) return null;
          let tr = newState.tr;
          let changed = false;
          newState.doc.descendants((node, pos) => {
            if (node.type.name !== "image" || !node.attrs.widthPercent) return;
            const before = oldState.doc.nodeAt(pos);
            if (
              before?.type.name === "image" &&
              before.attrs.src === node.attrs.src &&
              before.attrs.widthPercent === node.attrs.widthPercent &&
              (before.attrs.width !== node.attrs.width ||
                before.attrs.height !== node.attrs.height)
            ) {
              tr = tr.setNodeMarkup(pos, undefined, { ...node.attrs, widthPercent: null });
              changed = true;
            }
          });
          return changed ? tr : null;
        },
      }),
    ];
  },
  /*
   * The size rides in the image's title (`"=300x200"`) — see
   * `image-size-title.ts`. Without these two the markdown round trip would
   * drop `width`/`height`, so a resize would be lost on the next load.
   */
  parseMarkdown: (token, helpers) => {
    const { title, width, height, align, widthPercent } = parseImageTitle(token.title);
    return helpers.createNode("image", {
      src: token.href,
      alt: token.text,
      title,
      width,
      height,
      align,
      widthPercent,
    });
  },
  renderMarkdown: (node) => {
    const { src = "", alt = "", title, width, height, align, widthPercent } =
      node.attrs ?? {};
    const text = formatImageTitle(title, width, height, align, widthPercent);
    return text ? `![${alt}](${src} "${text}")` : `![${alt}](${src})`;
  },
});

/*
 * Paragraph and heading with alignment in their markdown. The attribute itself
 * comes from `TextAlign` below; these two only teach the markdown round trip to
 * keep it (`align-markdown.ts`), so a `MarkdownEditor` document does not lose
 * its alignment on the next keystroke.
 */
const alignedParse =
  (parse: NonNullable<typeof Paragraph.config.parseMarkdown>): NonNullable<typeof Paragraph.config.parseMarkdown> =>
  (token, helpers) => {
    const { align, tokens } = takeAlignMarker(token.tokens ?? []);
    const result = parse({ ...token, tokens }, helpers);
    if (!align || Array.isArray(result) || !("type" in result)) return result;
    return { ...result, attrs: { ...result.attrs, textAlign: align } };
  };

const alignedRender =
  (render: NonNullable<typeof Paragraph.config.renderMarkdown>): NonNullable<typeof Paragraph.config.renderMarkdown> =>
  (node, helpers, ctx) => {
    const text = render(node, helpers, ctx);
    // An empty block has nothing to align (and `&nbsp;` is its placeholder).
    return text && text !== "&nbsp;"
      ? `${text}${formatAlignMarker(node.attrs?.textAlign)}`
      : text;
  };

const AlignedParagraph = Paragraph.extend({
  parseMarkdown: alignedParse(Paragraph.config.parseMarkdown!),
  renderMarkdown: alignedRender(Paragraph.config.renderMarkdown!),
});

const AlignedHeading = Heading.extend({
  parseMarkdown: alignedParse(Heading.config.parseMarkdown!),
  renderMarkdown: alignedRender(Heading.config.renderMarkdown!),
});

/**
 * The schema half of the editor: exactly the §3.1 allowlist. Shared by every
 * editor and by the headless doc ↔ markdown conversion in `markdown-editor.tsx`,
 * so a conversion can never produce a node the editors would refuse.
 */
export const BLOG_EXTENSIONS: Extensions = [
  StarterKit.configure({
    // Replaced by the aligned versions below.
    heading: false,
    paragraph: false,
    // Not in the §3.1 allowlist — enabling it produces a mark the renderer
    // drops, so an author underlines something, saves, and the text comes
    // back plain.
    underline: false,
    link: {
      openOnClick: false,
      protocols: ["http", "https", "mailto"],
      // The first gate for `href`. `sanitizeBlogDoc` is the second and the
      // mandatory one — this exists so the author finds out on the spot.
      isAllowedUri: (url) => isSafeLinkHref(url),
    },
  }),
  AlignedParagraph,
  // h1 is the Q&A outline document title; h2/h3/h4 are its levels (§6.2). h4 is
  // what the Q&A outline's third level needs — without it the backend demotes a
  // sub-point to h2 and it reads as a chapter that was never written.
  AlignedHeading.configure({ levels: [1, 2, 3, 4] }),
  // Left is the default and is never stored (`BlogTextAlign`).
  TextAlign.configure({
    types: ["heading", "paragraph"],
    alignments: ["left", "center", "right", "justify"],
  }),
  /*
   * Drag a corner to resize. It writes the `width`/`height` attrs the schema
   * already carries and the renderer already honours, so the size survives a
   * save with no new field. Corners only, ratio locked: dragging one edge
   * would stretch the picture.
   */
  BlogImage.configure({
    inline: false,
    allowBase64: false,
    resize: {
      enabled: true,
      directions: ["top-left", "top-right", "bottom-left", "bottom-right"],
      minWidth: 80,
      minHeight: 40,
      alwaysPreserveAspectRatio: true,
    },
  }),
  /*
   * `resizable: false` — column widths would be a `colwidth` attribute the
   * backend sanitizer does not keep, so the author drags a column, saves,
   * and the width is gone.
   */
  Table.configure({ resizable: false }),
  TableRow,
  TableHeader,
  TableCell,
];

/**
 * The Tiptap editor, configured to **exactly the §3.1 allowlist** — not one node
 * more.
 *
 * The editor's schema, the backend's write validation and the renderer
 * (`packages/ui/src/blog/post-content.tsx`) must be the same list; this is one
 * of those three places.
 *
 * ⚠️ Do NOT plug in `CodeBlockLowlight`: it changes the shape of the
 * `codeBlock` node in the JSON, and that has to be decided deliberately rather
 * than slipped in (§3.1c). This pass only **stores** `language`; no
 * highlighting.
 */
/** The full-screen toggle an editor can show in its toolbar; the parent owns the state. */
export type EditorFullscreen = { active: boolean; onToggle: () => void };

export function TiptapEditor({
  value,
  onChange,
  contentClassName,
  fullscreen,
}: {
  value: BlogDoc;
  onChange: (doc: BlogDoc) => void;
  /** Draws the full-screen toggle as the toolbar's first button. */
  fullscreen?: EditorFullscreen;
  /**
   * Extra classes on the editable surface itself (the `.ProseMirror` node) —
   * e.g. a `max-h-*` + `overflow-y-auto` pair so a long document scrolls
   * inside its border instead of stretching the page. Applied there rather
   * than on a wrapper so the border and focus ring stay with the scrollbox.
   */
  contentClassName?: string;
}) {
  return (
    <RichTextEditor
      content={value}
      // Sanitized RIGHT IN the editor rather than at submit time: that way the
      // preview (§8) and what will be saved are the same tree, with no "visible
      // while writing, gone after saving".
      onUpdate={(instance) => onChange(sanitizeBlogDoc(instance.getJSON()))}
      contentClassName={contentClassName}
      fullscreen={fullscreen}
    />
  );
}

/**
 * The editor body both `TiptapEditor` (JSON) and `MarkdownEditor` (markdown
 * string) are built on: the allowlisted schema, toolbar, dialogs and image
 * upload. Only how content goes in and comes out differs between the two, so
 * that is all the wrappers supply.
 */
export function RichTextEditor({
  content,
  contentType,
  extensions = [],
  onUpdate,
  contentClassName,
  fullscreen,
  toolbarExtra,
  onReady,
}: {
  content: BlogDoc | string;
  /** How Tiptap parses `content`. `"markdown"` needs the `Markdown` extension. */
  contentType?: "json" | "markdown";
  /** Appended to the allowlisted set — never a node the renderers drop. */
  extensions?: Extensions;
  onUpdate: (editor: Editor) => void;
  contentClassName?: string;
  /** Draws the full-screen toggle as the toolbar's first button. */
  fullscreen?: EditorFullscreen;
  /** Controls for the caller's own insertions, pinned to the toolbar's right edge. */
  toolbarExtra?: React.ReactNode;
  /** Hands the live instance to the parent (and `null` on unmount), e.g. to insert text at the caret. */
  onReady?: (editor: Editor | null) => void;
}) {
  const t = useTranslations("common.editor");
  const [linkOpen, setLinkOpen] = useState(false);
  const [imageMode, setImageMode] = useState<"upload" | "url" | null>(null);
  const m = useMessage();
  const [dropError, setDropError] = useState<Message | string | null>(null);
  /*
   * `editorProps` is captured when the editor is CREATED, so the handlers inside
   * cannot close over the `editor` variable (it does not exist yet at that
   * point). A ref is their only way to talk to the finished instance.
   */
  const editorRef = useRef<Editor | null>(null);
  const dropUpload = useUploadMedia({ allow: MEDIA_IMAGE_MIMES });
  const [localImages, setLocalImages] = useState<LocalImage[]>([]);
  const [folderBatch, setFolderBatch] = useState<{
    done: number;
    total: number;
  } | null>(null);
  // What the last folder pick failed to match: the author may have chosen the wrong folder.
  const [folderMiss, setFolderMiss] = useState<{ missing: number; total: number } | null>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  /**
   * Resolves the pasted `![](/Users/…/x.jpeg)` references. A page cannot read a
   * path off the author's disk, so the author hands over the folder once (a
   * file input cannot be opened from the paste event itself — paste is not a
   * user activation) and files are matched to the references by name.
   */
  const uploadFromFolder = useCallback(
    async (files: File[]) => {
      const editorInstance = editorRef.current;
      if (!editorInstance || localImages.length === 0) return;
      setDropError(null);
      setFolderMiss(null);

      const byName = new Map(files.map((file) => [file.name, file]));
      const todo = localImages.filter((image) => byName.has(image.name));
      const missing = localImages.filter((image) => !byName.has(image.name));
      setFolderBatch({ done: 0, total: todo.length });

      let done = 0;
      let failed: LocalImage[] = [];
      const queue = [...todo];
      const worker = async () => {
        for (let image = queue.shift(); image; image = queue.shift()) {
          try {
            const file = byName.get(image.name)!;
            const asset = await dropUpload.mutateAsync(file);
            const size = await measureImage(asset.url);
            replaceToken(editorInstance, image.token, {
              type: "image",
              attrs: {
                src: asset.url,
                alt: image.alt || suggestAltFrom(image.name),
                width: size?.width ?? null,
                height: size?.height ?? null,
              },
            });
          } catch (error) {
            failed = [...failed, image];
            setDropError(messageOf(error));
          }
          done += 1;
          setFolderBatch({ done, total: todo.length });
        }
      };
      // A few in flight at once: a pasted chapter can hold hundreds of images.
      await Promise.all(Array.from({ length: 4 }, worker));

      setFolderBatch(null);
      setFolderMiss(missing.length > 0 ? { missing: missing.length, total: localImages.length } : null);
      setLocalImages([...missing, ...failed]);
    },
    [dropUpload, localImages],
  );

  /**
   * Gives up on uploading the pasted images. `keepText` leaves the original
   * `![alt](path)` in the document as plain text; otherwise the reference is
   * deleted along with its placeholder paragraph.
   */
  const dismissLocalImages = useCallback(
    (keepText: boolean) => {
      const editorInstance = editorRef.current;
      if (editorInstance) {
        for (const image of localImages)
          replaceToken(
            editorInstance,
            image.token,
            keepText
              ? {
                  type: "paragraph",
                  content: [{ type: "text", text: image.raw }],
                }
              : null,
          );
      }
      setLocalImages([]);
      setFolderMiss(null);
    },
    [localImages],
  );

  /**
   * Drag-and-drop and paste for images — the path authors actually use; the
   * dialog is the fallback for images that already have a URL.
   *
   * Inserted **after the upload finishes**, rather than inserting a placeholder
   * node and swapping its `src`: a placeholder would need `blob:` or `data:`,
   * and `sanitizeBlogDoc` (running in `onUpdate`) drops both on the very next
   * beat — the image would vanish mid-edit. In exchange the image appears only
   * once it is on the server; the progress bar under the toolbar fills that
   * wait.
   */
  const uploadAndInsert = useCallback(
    (file: File) => {
      const editorInstance = editorRef.current;
      if (!editorInstance) return;
      setDropError(null);
      dropUpload.mutate(file, {
        onSuccess: (asset) => {
          void insertImageAsset(editorInstance, asset, file.name);
        },
        onError: (error) => setDropError(messageOf(error)),
      });
    },
    [dropUpload],
  );

  const editor = useEditor({
    // Required with Next's SSR: rendering on the first pass mismatches hydration.
    immediatelyRender: false,
    extensions: [...BLOG_EXTENSIONS, ...extensions],
    // Stored markdown can hold `- [ ]` too (see `flattenTaskLists`); an invalid item
    // here would throw on mount and blank the editor.
    content: contentType === "markdown" && typeof content === "string" ? flattenTaskLists(content) : content,
    contentType,
    editorProps: {
      attributes: {
        class: [
          "post-prose post-prose-compact min-h-80 rounded-md border border-border bg-surface px-4 py-3 outline-none focus:border-foreground/60",
          contentClassName,
        ]
          .filter(Boolean)
          .join(" "),
      },
      /*
       * Returning `true` means "handled, ProseMirror should do nothing more".
       * Required for images: the default behaviour of both is to insert
       * `<img src="data:…">` straight from the clipboard/OS, which
       * `allowBase64: false` and `sanitizeBlogDoc` then discard — the author
       * watches the image appear and vanish with no explanation.
       *
       * The event is only swallowed when there really is an image FILE: pasting
       * text, pasting HTML, or dragging a paragraph within the post must all
       * continue down the default path.
       */
      handlePaste: (_view, event) => {
        const file = firstImageFile(event.clipboardData?.files);
        if (file) {
          uploadAndInsert(file);
          return true;
        }
        return pasteMarkdown(editorRef.current, event, contentType, (items) =>
          setLocalImages((prev) => [...prev, ...items]),
        );
      },
      handleDrop: (_view, event) => {
        const file = firstImageFile((event as DragEvent).dataTransfer?.files);
        if (!file) return false;
        event.preventDefault();
        uploadAndInsert(file);
        return true;
      },
    },
    onUpdate: ({ editor: instance }) => onUpdate(instance),
  });

  /*
   * Assigned in an effect rather than directly in the render body: writing to a
   * ref during render is unsafe under StrictMode/concurrent (and
   * `react-hooks/refs` flags exactly this). The paste/drop handlers only run
   * after mount, so the effect's one-beat delay is unobservable.
   */
  useEffect(() => {
    editorRef.current = editor;
    onReady?.(editor);
    return () => onReady?.(null);
  }, [editor, onReady]);

  if (!editor) {
    return (
      <div className="h-96 animate-pulse rounded-md bg-black/5 dark:bg-white/5" />
    );
  }

  return (
    // `min-h-0 flex-1` lets a parent that is a fixed-height flex column (the
    // full-screen window) hand the editor its height: the toolbar stays put and
    // only the content scrolls. In a plain block parent they do nothing.
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Toolbar
        editor={editor}
        fullscreen={fullscreen}
        extra={toolbarExtra}
        onLink={() => setLinkOpen(true)}
        onImage={setImageMode}
      />
      <EditorContent editor={editor} className="min-h-0 flex-1" />

      {dropUpload.isPending ? (
        <Typography variant="body-4" role="status" className="opacity-70">
          {t("uploading", {
            percent: dropUpload.progress
              ? Math.round(dropUpload.progress.ratio * 100)
              : 0,
          })}
        </Typography>
      ) : null}
      <AlertError message={m(dropError)} />

      {/*
        A modal rather than a strip above the page: the author has to decide
        before going on (the pasted images are placeholders until then), and a
        row of buttons wedged between the toolbar and the text looked like part
        of the editor chrome. Closing it is the same as "Skip images", which
        keeps the pasted text rather than deleting anything.
      */}
      {localImages.length > 0 ? (
        <Dialog
          open
          onClose={() => {
            if (folderBatch === null) dismissLocalImages(true);
          }}
          title={t("localImagesTitle")}
        >
          <div role="status" className="flex flex-col gap-4">
            <Typography variant="body-3" className="text-muted-foreground">
              {folderBatch
                ? t("localImagesUploading", folderBatch)
                : t("localImagesPending", { count: localImages.length })}
            </Typography>
            {folderMiss && folderBatch === null ? (
              <Alert
                tone="warning"
                message={
                  folderMiss.missing === folderMiss.total
                    ? t("localImagesNoneFound")
                    : t("localImagesSomeMissing", folderMiss)
                }
              />
            ) : null}
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={folderBatch !== null}
                onClick={() => dismissLocalImages(false)}
              >
                {t("localImagesRemove")}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={folderBatch !== null}
                onClick={() => dismissLocalImages(true)}
              >
                {t("localImagesSkip")}
              </Button>
              <Button
                type="button"
                disabled={folderBatch !== null}
                onClick={() => folderInputRef.current?.click()}
              >
                {t("localImagesPick")}
              </Button>
            </div>
            <input
              ref={folderInputRef}
              type="file"
              multiple
              hidden
              {...({ webkitdirectory: "" } as object)}
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                event.target.value = "";
                void uploadFromFolder(files);
              }}
            />
          </div>
        </Dialog>
      ) : null}

      {linkOpen ? (
        <LinkDialog editor={editor} onClose={() => setLinkOpen(false)} />
      ) : null}
      {imageMode ? (
        <ImageDialog
          editor={editor}
          mode={imageMode}
          onClose={() => setImageMode(null)}
        />
      ) : null}
    </div>
  );
}

/** The alignment every image shares (`"left"` for none), or `null` when they differ or there are none. */
function commonImageAlign(doc: {
  descendants: (
    fn: (node: { type: { name: string }; attrs: Record<string, unknown> }) => void,
  ) => void;
}): string | null {
  let common: string | null | undefined;
  doc.descendants((node) => {
    if (node.type.name !== "image") return;
    const value = (node.attrs.align as string | null) ?? "left";
    common = common === undefined || common === value ? value : null;
  });
  return common ?? null;
}

const ALIGNMENTS = [
  { value: "left", icon: LUCIDE.alignLeft, label: "alignLeft" },
  { value: "center", icon: LUCIDE.alignCenter, label: "alignCenter" },
  { value: "right", icon: LUCIDE.alignRight, label: "alignRight" },
  { value: "justify", icon: LUCIDE.alignJustify, label: "alignJustify" },
] as const;

function Toolbar({
  editor,
  fullscreen,
  extra,
  onLink,
  onImage,
}: {
  editor: Editor;
  fullscreen?: EditorFullscreen;
  extra?: React.ReactNode;
  onLink: () => void;
  onImage: (mode: "upload" | "url") => void;
}) {
  const t = useTranslations("common.editor");
  const [imagesOpen, setImagesOpen] = useState(false);
  /*
   * Tiptap v3 no longer re-renders on every transaction, so a bare
   * `editor.isActive(...)` in JSX is frozen at first render — the heading
   * button would not light up when the caret moves into a heading. The
   * selector runs on each transaction and the toolbar re-renders only when one
   * of these booleans flips.
   */
  const active = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      strike: e.isActive("strike"),
      code: e.isActive("code"),
      h1: e.isActive("heading", { level: 1 }),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      h4: e.isActive("heading", { level: 4 }),
      bulletList: e.isActive("bulletList"),
      orderedList: e.isActive("orderedList"),
      blockquote: e.isActive("blockquote"),
      codeBlock: e.isActive("codeBlock"),
      table: e.isActive("table"),
      link: e.isActive("link"),
      image: e.isActive("image"),
      imagesAlign: commonImageAlign(e.state.doc),
      textAlign: e.isActive("image")
        ? ((e.getAttributes("image").align as string | null) ?? "left")
        : (ALIGNMENTS.find((item) => e.isActive({ textAlign: item.value }))?.value ??
          "left"),
      codeBlockLanguage:
        (e.getAttributes("codeBlock").language as string | undefined) ?? "",
    }),
  });
  const inCodeBlock = active.codeBlock;

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-md border border-border bg-surface px-2 py-1.5">
      {fullscreen ? (
        <>
          <ToolbarButton
            label={t(fullscreen.active ? "exitFullscreen" : "fullscreen")}
            active={false}
            onClick={fullscreen.onToggle}
            icon={fullscreen.active ? LUCIDE.minimize : LUCIDE.maximize}
          />
          <Divider />
        </>
      ) : null}
      <ToolbarButton
        label={t("bold")}
        active={active.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
        icon={LUCIDE.bold}
      />
      <ToolbarButton
        label={t("italic")}
        active={active.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        icon={LUCIDE.italic}
      />
      <ToolbarButton
        label={t("strike")}
        active={active.strike}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        icon={LUCIDE.strikethrough}
      />
      <ToolbarButton
        label={t("code")}
        active={active.code}
        onClick={() => editor.chain().focus().toggleCode().run()}
        icon={LUCIDE.code}
      />

      <Divider />

      <ToolbarButton
        label={t("h1")}
        active={active.h1}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        icon={LUCIDE.heading1}
      />
      <ToolbarButton
        label={t("h2")}
        active={active.h2}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        icon={LUCIDE.heading2}
      />
      <ToolbarButton
        label={t("h3")}
        active={active.h3}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        icon={LUCIDE.heading3}
      />
      <ToolbarButton
        label={t("h4")}
        active={active.h4}
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        icon={LUCIDE.heading4}
      />

      <Divider />

      {/* One button showing the current alignment; the menu is a single row of icons. */}
      <DropdownMenu
        align="start"
        compact
        // `compact` sets a min-width for text menus; a row of icons should hug them.
        className="min-w-0!"
        trigger={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("align")}
            title={t("align")}
          >
            <Icon
              icon={
                ALIGNMENTS.find((item) => item.value === active.textAlign)?.icon ??
                LUCIDE.alignLeft
              }
              className="size-4"
            />
          </Button>
        }
      >
        <div className="flex gap-1">
          {/* An image has no justify — it is a box, not a line of text. */}
          {ALIGNMENTS.filter((item) => !active.image || item.value !== "justify").map((item) => (
            <DropdownMenuItem
              key={item.value}
              icon={item.icon}
              className={`size-8 justify-center px-0 ${
                active.textAlign === item.value ? "bg-primary/10 text-primary" : ""
              }`}
              onSelect={() =>
                active.image
                  ? editor
                      .chain()
                      .focus()
                      .updateAttributes("image", {
                        align: item.value === "left" ? null : item.value,
                      })
                      .run()
                  : editor.chain().focus().setTextAlign(item.value).run()
              }
            >
              <span className="sr-only">{t(item.label)}</span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenu>

      <ToolbarButton
        label={t("bulletList")}
        active={active.bulletList}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        icon={LUCIDE.list}
      />
      <ToolbarButton
        label={t("orderedList")}
        active={active.orderedList}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        icon={LUCIDE.listOrdered}
      />
      <ToolbarButton
        label={t("quote")}
        active={active.blockquote}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        icon={LUCIDE.textQuote}
      />
      <ToolbarButton
        label={t("codeBlock")}
        active={inCodeBlock}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        icon={LUCIDE.codeXml}
      />
      <ToolbarButton
        label={t("hr")}
        active={false}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        icon={LUCIDE.minus}
      />
      {/*
        One button inserts a 3×3 table with a header row; the row/column
        controls appear only once the cursor is inside one. A full table toolbar
        that is inert 99% of the time is six buttons of noise.
      */}
      <ToolbarButton
        label={t("table")}
        active={active.table}
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run()
        }
        icon={LUCIDE.table}
      />

      {active.table ? (
        <>
          <Divider />
          <ToolbarButton
            label={t("addColumn")}
            active={false}
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            icon={LUCIDE.betweenHorizontalStart}
          />
          <ToolbarButton
            label={t("addRow")}
            active={false}
            onClick={() => editor.chain().focus().addRowAfter().run()}
            icon={LUCIDE.betweenVerticalStart}
          />
          <ToolbarButton
            label={t("deleteColumn")}
            active={false}
            onClick={() => editor.chain().focus().deleteColumn().run()}
            icon={LUCIDE.trash2}
          />
          <ToolbarButton
            label={t("deleteRow")}
            active={false}
            onClick={() => editor.chain().focus().deleteRow().run()}
            icon={LUCIDE.trash}
          />
          <ToolbarButton
            label={t("deleteTable")}
            active={false}
            onClick={() => editor.chain().focus().deleteTable().run()}
            icon={LUCIDE.tableCellsMerge}
          />
        </>
      ) : null}

      <Divider />

      <ToolbarButton
        label={t("link")}
        active={active.link}
        onClick={onLink}
        icon={LUCIDE.link}
      />
      {/* Like Google Docs: one button, then pick where the image comes from. */}
      <DropdownMenu
        align="start"
        compact
        trigger={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("image")}
            title={t("image")}
          >
            <Icon icon={ICONS.image} className="size-4" />
          </Button>
        }
      >
        <DropdownMenuItem
          icon={LUCIDE.upload}
          onSelect={() => onImage("upload")}
        >
          {t("imageFromComputer")}
        </DropdownMenuItem>
        <DropdownMenuItem icon={LUCIDE.link} onSelect={() => onImage("url")}>
          {t("imageByUrl")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          icon={LUCIDE.images}
          onSelect={() => setImagesOpen(true)}
        >
          {t("imagesSettings")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <p className="px-2 pb-1 text-body-4 text-muted-foreground">
          {t("imagesAlignAll")}
        </p>
        <div className="flex gap-1">
          {ALIGNMENTS.filter((item) => item.value !== "justify").map((item) => (
            <DropdownMenuItem
              key={item.value}
              icon={item.icon}
              className={`size-8 justify-center px-0 ${
                active.imagesAlign === item.value ? "bg-primary/10 text-primary" : ""
              }`}
              onSelect={() =>
                editor
                  .chain()
                  .command(({ tr, state }) => {
                    state.doc.descendants((node, pos) => {
                      if (node.type.name !== "image") return;
                      tr.setNodeMarkup(pos, undefined, {
                        ...node.attrs,
                        align: item.value === "left" ? null : item.value,
                      });
                    });
                    return true;
                  })
                  .run()
              }
            >
              <span className="sr-only">{t(item.label)}</span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenu>

      {imagesOpen ? (
        <ImagesDialog editor={editor} onClose={() => setImagesOpen(false)} />
      ) : null}

      {/* Shown only while the cursor is inside a code block — a select that is
          always visible but almost always inert invites misclicks. */}
      {inCodeBlock ? (
        <select
          aria-label={t("codeLanguage")}
          className={`${extra ? "" : "ml-auto "}h-8 rounded-md border border-border bg-transparent px-2 text-body-4`}
          value={active.codeBlockLanguage}
          onChange={(event) =>
            editor
              .chain()
              .focus()
              .updateAttributes("codeBlock", {
                language: event.target.value || null,
              })
              .run()
          }
        >
          <option value="" className="bg-background">
            {t("codeLanguageNone")}
          </option>
          {BLOG_CODE_LANGUAGES.map((language) => (
            <option key={language} value={language} className="bg-background">
              {language}
            </option>
          ))}
        </select>
      ) : null}

      {extra ? (
        <div className="ml-auto flex items-center gap-1">{extra}</div>
      ) : null}
    </div>
  );
}

function ToolbarButton({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: IconName;
}) {
  return (
    // A Tooltip rather than `title`: these buttons are icon-only, so the label
    // IS the affordance — it must show up fast and on keyboard focus too, which
    // the native tooltip does neither of.
    <Tooltip label={label}>
      {/*
        Pressed state as a VARIANT rather than an override: a `bg-*` passed
        through `className` collides with the variant's own background at equal
        specificity, so which one paints is up to the stylesheet order.
      */}
      <Button
        variant={active ? "primary" : "ghost"}
        size="icon-sm"
        aria-label={label}
        aria-pressed={active}
        onClick={onClick}
      >
        <Icon icon={icon} className="size-4" />
      </Button>
    </Tooltip>
  );
}

/**
 * The width of the images — a share of the column, or pixels — for the selected
 * image or for every image in the document. (Alignment lives in the image menu.)
 *
 * Pixels need the picture's real ratio to find the height; an image the editor
 * could not measure (no `width`/`height`) is skipped for that field and still
 * takes the share and the alignment.
 */
function ImagesDialog({
  editor,
  onClose,
}: {
  editor: Editor;
  onClose: () => void;
}) {
  const t = useTranslations("common.editor");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState<"%" | "px">("%");

  const { count, selectedPos } = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      let n = 0;
      e.state.doc.descendants((node) => {
        if (node.type.name === "image") n += 1;
      });
      // The image the author had selected when the dialog opened, if any.
      const { selection } = e.state;
      const picked =
        "node" in selection &&
        (selection as { node?: { type: { name: string } } }).node?.type.name === "image"
          ? selection.from
          : null;
      return { count: n, selectedPos: picked };
    },
  });

  const amount = Number(value);
  const valid = value.trim() === "" || (Number.isFinite(amount) && amount >= 1 && (unit === "px" || amount <= 100));
  const nothing = value.trim() === "";

  const apply = (scope: "all" | "selected") => {
    editor
      .chain()
      .command(({ tr, state }) => {
        state.doc.descendants((node, pos) => {
          if (node.type.name !== "image") return;
          if (scope === "selected" && pos !== selectedPos) return;
          const attrs = { ...node.attrs };
          if (value.trim() !== "") {
            if (unit === "%") {
              attrs.widthPercent = Math.round(amount);
            } else if (attrs.width && attrs.height) {
              attrs.height = Math.round((amount * attrs.height) / attrs.width);
              attrs.width = Math.round(amount);
              attrs.widthPercent = null;
            }
          }
          tr.setNodeMarkup(pos, undefined, attrs);
        });
        return true;
      })
      .run();
    onClose();
  };

  return (
    <Dialog open onClose={onClose} title={t("imagesDialogTitle")}>
      <div className="flex flex-col gap-4">
        <Typography variant="body-3" className="text-muted-foreground">
          {t("imagesCount", { count })}
        </Typography>

        <div className="flex items-start gap-2">
          <div className="flex-1">
            <Input
              label={t("imagesWidth")}
              type="number"
              min={1}
              max={unit === "%" ? 100 : undefined}
              inputMode="numeric"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={t("imagesWidthPlaceholder")}
              error={valid ? undefined : t("imagesWidthInvalid")}
            />
          </div>
          <div className="w-24">
            <Select
              label={t("imagesUnit")}
              value={unit}
              onChange={(event) => setUnit(event.target.value as "%" | "px")}
              options={[
                { value: "%", label: "%" },
                { value: "px", label: "px" },
              ]}
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {t("close")}
          </Button>
          <Button
            variant="outline"
            onClick={() => apply("selected")}
            disabled={!valid || nothing || selectedPos === null}
          >
            {t("imagesApplySelected")}
          </Button>
          <Button
            onClick={() => apply("all")}
            disabled={!valid || nothing || count === 0}
          >
            {t("imagesApply")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function Divider() {
  return <span aria-hidden className="mx-0.5 h-5 w-px bg-border" />;
}

/**
 * A dialog in place of `window.prompt`: prompt blocks the whole tab, cannot be
 * styled, and is close to unusable on mobile.
 */
function LinkDialog({
  editor,
  onClose,
}: {
  editor: Editor;
  onClose: () => void;
}) {
  const t = useTranslations("common.editor");
  const tc = useTranslations("common");
  const [href, setHref] = useState(
    (editor.getAttributes("link").href as string) ?? "",
  );
  const [error, setError] = useState<string | null>(null);

  const apply = () => {
    const value = href.trim();
    if (value === "") {
      editor.chain().focus().unsetLink().run();
      onClose();
      return;
    }
    if (!isSafeLinkHref(value)) {
      setError(t("linkInvalid"));
      return;
    }
    // Do NOT set `target`/`rel` here: the renderer decides them (§3.1a), and
    // writing them into the data reopens the door the attribute allowlist just
    // closed.
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: value })
      .run();
    onClose();
  };

  return (
    <Dialog open onClose={onClose} title={t("linkDialogTitle")}>
      <div className="flex flex-col gap-4">
        <Input
          label={t("linkUrl")}
          value={href}
          onChange={(event) => setHref(event.target.value)}
          placeholder="https://…"
        />
        <Typography variant="body-4" className="-mt-2 opacity-60">
          {t.rich("linkHint", {
            code: (chunks) => <code className="mx-1">{chunks}</code>,
          })}
        </Typography>
        <AlertError message={error} />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {tc("actions.cancel")}
          </Button>
          <Button onClick={apply}>{t("apply")}</Button>
        </div>
      </div>
    </Dialog>
  );
}

/**
 * Two ways to insert an image: **upload** (the main path) and **paste a URL**
 * (for images already hosted somewhere allowed, e.g. Unsplash).
 *
 * After an upload the `src` is filled in but the image is NOT inserted straight
 * into the post: the author still has to write the `alt`, and pulling an
 * already-inserted image back out to edit it is far more annoying than one extra
 * click.
 *
 * The editor measures the real dimensions and writes them into the node
 * (§3.1b). When measuring fails (dead image, CORS, hotlink protection) they stay
 * `null` and it **warns on the spot**: the renderer still works but falls back
 * to an `aspect-video` frame, and the author should know that before the post
 * goes live.
 */
function ImageDialog({
  editor,
  mode,
  onClose,
}: {
  editor: Editor;
  mode: "upload" | "url";
  onClose: () => void;
}) {
  const t = useTranslations("common.editor");
  const [src, setSrc] = useState("");
  const [alt, setAlt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [measuring, setMeasuring] = useState(false);

  const insert = async () => {
    const value = src.trim();
    setError(null);
    setNotice(null);

    if (!isSafeImageSrc(value)) {
      setError(t("imageHostInvalid"));
      return;
    }

    setMeasuring(true);
    const size = await measureImage(value);
    setMeasuring(false);

    if (!size) {
      setNotice(t("imageMeasureFailed"));
    }

    editor
      .chain()
      .focus()
      .insertContent({
        type: "image",
        attrs: {
          src: value,
          alt: alt.trim(),
          width: size?.width ?? null,
          height: size?.height ?? null,
        },
      })
      .run();

    if (size) onClose();
  };

  return (
    <Dialog open onClose={onClose} title={t("imageDialogTitle")}>
      <div className="flex flex-col gap-4">
        {mode === "upload" ? (
          <ImageUploadButton
            autoOpen
            label={t("imagePick")}
            onUploaded={(asset) => {
              setSrc(asset.url);
              setError(null);
              setNotice(null);
              // The original filename is a better `alt` suggestion than an empty
              // field, but only while the author has typed nothing — overwriting
              // what they just wrote loses data.
              setAlt(
                (current) => current || suggestAltFrom(asset.originalName),
              );
            }}
          />
        ) : (
          <Input
            label={t("imageUrl")}
            value={src}
            onChange={(event) => setSrc(event.target.value)}
            placeholder={t("imageUrlPlaceholder")}
          />
        )}
        {src.trim() !== "" && isSafeImageSrc(src.trim()) ? (
          // A plain <img>: this is a preview of what is about to be inserted,
          // not page content, so `next/image` (and its host allowlist) adds nothing.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src.trim()}
            alt={alt}
            className="max-h-60 w-full rounded-md border border-border bg-muted object-contain"
          />
        ) : null}
        <Input
          label={t("imageAlt")}
          value={alt}
          onChange={(event) => setAlt(event.target.value)}
          placeholder={t("imageAltPlaceholder")}
        />
        <AlertError message={error} />
        <Alert tone="warning" message={notice} />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {t("close")}
          </Button>
          <Button onClick={insert} disabled={measuring || src.trim() === ""}>
            {measuring ? t("measuring") : t("insert")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

/** The image's `naturalWidth`/`naturalHeight`, or `null` if it will not load. */
function measureImage(
  src: string,
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const image = new window.Image();
    image.onload = () =>
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

/**
 * Turns task-list items (`- [ ] text`, `- [x] text`) into plain list items.
 *
 * Task lists are not in the §3.1 allowlist, so the editor has no TaskList/TaskItem. The
 * Markdown extension still reads `- [ ]` as a task item and, with nothing to turn it
 * into, builds a `listItem` holding bare text — which ProseMirror rejects with
 * `RangeError: Invalid content for node listItem`. Pasted into a markdown editor that
 * error aborts the whole paste, after the browser's default has already been cancelled,
 * so the author sees nothing happen. Checklists are common in pasted prompts and notes,
 * hence this: the item keeps its text, only the unsupported checkbox goes.
 *
 * Fenced code is left alone — a `- [ ]` inside a code block is literal text.
 */
export function flattenTaskLists(markdown: string): string {
  let fenced = false;
  return markdown
    .split("\n")
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
      return fenced ? line : line.replace(/^(\s*(?:[-*+]|\d{1,9}[.)])\s+)\[[ xX]\]\s+/, "$1");
    })
    .join("\n");
}

/**
 * Pasting Markdown source into a markdown editor should render it, not drop it
 * in as literal `###` / `**` characters.
 *
 * Only plain text is taken over. Real rich content (a web page, Word) carries
 * `text/html` and keeps ProseMirror's own HTML parsing, with one exception:
 * code editors (VS Code) also put `text/html` on the clipboard — a monospace
 * dump of the same source — and Tiptap's code block turns that into a code
 * block, which is the opposite of what pasting a `.md` file means. They are
 * recognised by `vscode-editor-data`. Inside a code block the text stays
 * literal, since that is what the author asked for there.
 */
function pasteMarkdown(
  editor: Editor | null,
  event: ClipboardEvent,
  contentType: "json" | "markdown" | undefined,
  onLocalImages: (images: LocalImage[]) => void,
): boolean {
  if (contentType !== "markdown" || !editor) return false;
  if (editor.isActive("codeBlock")) return false;

  const data = event.clipboardData;
  const text = data?.getData("text/plain");
  if (!data || !text) return false;

  const fromCodeEditor = data.types.includes("vscode-editor-data");
  if (data.types.includes("text/html") && !fromCodeEditor) return false;

  event.preventDefault();
  const { markdown, images } = extractLocalImages(flattenTaskLists(text));
  try {
    editor.commands.insertContent(markdown, { contentType: "markdown" });
  } catch {
    // `preventDefault` above already cancelled the browser's own paste, so a parse
    // failure here must not leave the author with nothing: fall back to the text.
    editor.commands.insertContent(text);
    return true;
  }
  if (images.length > 0) onLocalImages(images);
  return true;
}

/** A pasted image reference that points at a file on the author's machine. */
type LocalImage = {
  token: string;
  name: string;
  alt: string;
  /** The `![alt](path)` as pasted, for "skip" to put back as plain text. */
  raw: string;
};

/**
 * Swaps every `![alt](/local/path.jpg)` for a one-word token paragraph and
 * reports what was swapped. The sanitizer would drop such an image on the next
 * update (`isSafeImageSrc` wants an allowed https host), so it never reaches
 * the document as an image; the token holds its place until the file is
 * uploaded. Alphanumeric only, so markdown cannot read emphasis into it.
 */
function extractLocalImages(markdown: string): {
  markdown: string;
  images: LocalImage[];
} {
  const images: LocalImage[] = [];
  // Only text outside code counts: an `![](…)` shown inside a code span or fence
  // is an example, not a picture.
  const out = markdown
    .split(/(```[\s\S]*?```|`[^`\n]+`)/)
    .map((part, index) =>
      index % 2 === 1
        ? part
        : part.replace(
            /!\[([^\]]*)\]\(\s*<?([^)>]*?)>?\s*\)/g,
            (whole, alt: string, src: string) => {
              if (
                /^([a-z][a-z0-9+.-]*:)?\/\//i.test(src) ||
                /^(data|blob):/i.test(src)
              ) {
                return whole;
              }
              src = src.replace(/\s+"[^"]*"$/, "");
              const last = src.split(/[\\/]/).pop() ?? "";
              let name = last;
              try {
                name = decodeURIComponent(last);
              } catch {
                // keep the raw name
              }
              // A real file reference ends in an image extension. Anything else
              // — `![](<đường dẫn ảnh>)` in a prompt template — is a placeholder:
              // keep it as plain text instead of asking for a folder.
              if (!IMAGE_FILE.test(name)) return whole.replace(/^!/, "\\!").replace(/</g, "\\<");
              const token = `NOALHUBIMG${crypto.randomUUID().replace(/-/g, "")}END`;
              images.push({ token, name, alt, raw: whole });
              return `\n\n${token}\n\n`;
            },
          ),
    )
    .join("");
  return { markdown: collapseBlanksAroundImages(out), images };
}

const IMAGE_FILE = /\.(jpe?g|png|gif|webp|svg|bmp|heic|heif|avif|tiff?)$/i;

const IMAGE_LINE =
  String.raw`(?:!\[[^\]]*\]\([^)\n]*\)|NOALHUBIMG[0-9a-f]{32}END)`;
const BLANKS_BEFORE_IMAGE = new RegExp(String.raw`\n{3,}(?=${IMAGE_LINE}[ \t]*(?:\n|$))`, "g");
const BLANKS_AFTER_IMAGE = new RegExp(String.raw`(${IMAGE_LINE}[ \t]*)\n{3,}`, "g");

/**
 * An image sits on a line of its own with one blank line either side. Tiptap
 * turns every extra blank line into an empty paragraph, so the wrapping that
 * `extractLocalImages` adds (or a source that already had spacing) would leave
 * a gap above and below each picture.
 */
function collapseBlanksAroundImages(markdown: string): string {
  return markdown
    .replace(BLANKS_BEFORE_IMAGE, "\n\n")
    .replace(BLANKS_AFTER_IMAGE, "$1\n\n");
}

/**
 * Replaces a placeholder token with `node` (or removes it when `node` is null).
 *
 * The token sits alone in a paragraph of its own, so it is that whole paragraph
 * that goes — deleting just the text would leave an empty line behind where the
 * skipped image was.
 */
function replaceToken(
  editor: Editor,
  token: string,
  node: Record<string, unknown> | null,
): void {
  let range: { from: number; to: number } | null = null;
  editor.state.doc.descendants((child, pos) => {
    if (range) return false;
    if (child.isTextblock && child.textContent === token) {
      range = { from: pos, to: pos + child.nodeSize };
      return false;
    }
    if (!child.isText) return;
    const at = child.text?.indexOf(token) ?? -1;
    if (at >= 0) range = { from: pos + at, to: pos + at + token.length };
  });
  if (!range) return;
  const chain = editor.chain();
  if (node) chain.insertContentAt(range, node).run();
  else chain.deleteRange(range).run();
}

/** The first image file in a `FileList`, if any. */
function firstImageFile(files: FileList | null | undefined): File | undefined {
  if (!files) return undefined;
  return Array.from(files).find((file) =>
    (MEDIA_IMAGE_MIMES as readonly string[]).includes(file.type),
  );
}

/**
 * Inserts an uploaded asset at the cursor, with its real dimensions.
 *
 * Measured with `measureImage` rather than read from
 * `asset.width`/`asset.height`: the backend deliberately leaves those columns
 * `null` (filling them would require decoding images server-side, which was
 * ruled out). The browser has just loaded the image and knows exactly — so this
 * is the cheapest place to get the numbers.
 */
async function insertImageAsset(
  editor: Editor,
  asset: MediaAsset,
  fileName: string,
): Promise<void> {
  const size = await measureImage(asset.url);
  editor
    .chain()
    .focus()
    .insertContent({
      type: "image",
      attrs: {
        src: asset.url,
        alt: suggestAltFrom(asset.originalName ?? fileName),
        width: size?.width ?? null,
        height: size?.height ?? null,
      },
    })
    .run();
}

/**
 * Filename → `alt` suggestion: drop the extension, turn `-`/`_` into spaces.
 *
 * A **suggestion** only. A good `alt` describes the image's content to someone
 * who cannot see it, while a filename is usually `IMG_2931`; the author still
 * has to fix it. Leaving it empty is worse — an image with no alt is a silent
 * a11y bug, whereas a meaningless string at least prompts someone to correct
 * it.
 */
function suggestAltFrom(fileName: string | null): string {
  if (!fileName) return "";
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();
}
