"use client";

import Image from "@tiptap/extension-image";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  BLOG_CODE_LANGUAGES,
  isSafeImageSrc,
  isSafeLinkHref,
  sanitizeBlogDoc,
  type BlogDoc,
} from "@noalhub/api/blog";
import { MEDIA_IMAGE_MIMES, useUploadMedia, type MediaAsset } from "@noalhub/api/media";
import { messageOf, type Message } from "@noalhub/api/message";
import { useMessage } from "@noalhub/i18n/use-message";
import { useTranslations } from "next-intl";
import { Button } from "../button";
import { Dialog } from "../dialog";
import { Toast, ToastError } from "../toast";
import { Icon, ICONS, LUCIDE, type IconName } from "../icons";
import { Input } from "../input";
import { Tooltip } from "../tooltip";

import { ImageUploadButton } from "../media/image-upload-button";
import { Typography } from "../typography";

// The editor writes into a `.blog-content` element, so it needs the very same
// stylesheet the renderer uses — otherwise what is typed and what is published
// look different.
import "./post-content.css";

/**
 * The `image` node carries `width`/`height` **from day one**.
 *
 * Adding them later would mean a `jsonb` migration across every post ever
 * written, so they go in now. Without the two numbers, `next/image` either
 * guesses the ratio (distorted images), falls back to `<img>` (losing
 * optimization), or takes a **CLS** hit — a Core Web Vitals metric, and
 * therefore squarely inside this plan's SEO goal (`docs/blog.md` §3.1b).
 */
const BlogImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: null },
      height: { default: null },
    };
  },
});

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
export function TiptapEditor({
  value,
  onChange,
}: {
  value: BlogDoc;
  onChange: (doc: BlogDoc) => void;
}) {
  const t = useTranslations("common.editor");
  const [linkOpen, setLinkOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const m = useMessage();
  const [dropError, setDropError] = useState<Message | string | null>(null);
  /*
   * `editorProps` is captured when the editor is CREATED, so the handlers inside
   * cannot close over the `editor` variable (it does not exist yet at that
   * point). A ref is their only way to talk to the finished instance.
   */
  const editorRef = useRef<Editor | null>(null);
  const dropUpload = useUploadMedia({ allow: MEDIA_IMAGE_MIMES });

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
        onError: (error) =>
          setDropError(messageOf(error)),
      });
    },
    [dropUpload],
  );

  const editor = useEditor({
    // Required with Next's SSR: rendering on the first pass mismatches hydration.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // `<h1>` is the post title; content only has h2/h3 (§6.2).
        heading: { levels: [2, 3] },
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
      BlogImage.configure({ inline: false, allowBase64: false }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "blog-content min-h-80 rounded-md border border-black/15 px-4 py-3 outline-none focus:border-foreground/60 dark:border-white/20",
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
        if (!file) return false;
        uploadAndInsert(file);
        return true;
      },
      handleDrop: (_view, event) => {
        const file = firstImageFile((event as DragEvent).dataTransfer?.files);
        if (!file) return false;
        event.preventDefault();
        uploadAndInsert(file);
        return true;
      },
    },
    // Sanitized RIGHT IN the editor rather than at submit time: that way the
    // preview (§8) and what will be saved are the same tree, with no "visible
    // while writing, gone after saving".
    onUpdate: ({ editor: instance }) => onChange(sanitizeBlogDoc(instance.getJSON())),
  });

  /*
   * Assigned in an effect rather than directly in the render body: writing to a
   * ref during render is unsafe under StrictMode/concurrent (and
   * `react-hooks/refs` flags exactly this). The paste/drop handlers only run
   * after mount, so the effect's one-beat delay is unobservable.
   */
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  if (!editor) {
    return <div className="h-96 animate-pulse rounded-md bg-black/5 dark:bg-white/5" />;
  }

  return (
    <div className="flex flex-col gap-2">
      <Toolbar
        editor={editor}
        onLink={() => setLinkOpen(true)}
        onImage={() => setImageOpen(true)}
      />
      <EditorContent editor={editor} />

      {dropUpload.isPending ? (
        <Typography variant="body-4" role="status" className="opacity-70">
          {t("uploading", {
            percent: dropUpload.progress
              ? Math.round(dropUpload.progress.ratio * 100)
              : 0,
          })}
        </Typography>
      ) : null}
      <ToastError message={m(dropError)} />

      {linkOpen ? <LinkDialog editor={editor} onClose={() => setLinkOpen(false)} /> : null}
      {imageOpen ? <ImageDialog editor={editor} onClose={() => setImageOpen(false)} /> : null}
    </div>
  );
}

function Toolbar({
  editor,
  onLink,
  onImage,
}: {
  editor: Editor;
  onLink: () => void;
  onImage: () => void;
}) {
  const t = useTranslations("common.editor");
  const inCodeBlock = editor.isActive("codeBlock");

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-md border border-black/10 p-1.5 dark:border-white/15">
      <ToolbarButton
        label={t("bold")}
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        icon={LUCIDE.bold}
      />
      <ToolbarButton
        label={t("italic")}
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        icon={LUCIDE.italic}
      />
      <ToolbarButton
        label={t("strike")}
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        icon={LUCIDE.strikethrough}
      />
      <ToolbarButton
        label={t("code")}
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
        icon={LUCIDE.code}
      />

      <Divider />

      <ToolbarButton
        label={t("h2")}
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        icon={LUCIDE.heading2}
      />
      <ToolbarButton
        label={t("h3")}
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        icon={LUCIDE.heading3}
      />

      <Divider />

      <ToolbarButton
        label={t("bulletList")}
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        icon={LUCIDE.list}
      />
      <ToolbarButton
        label={t("orderedList")}
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        icon={LUCIDE.listOrdered}
      />
      <ToolbarButton
        label={t("quote")}
        active={editor.isActive("blockquote")}
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

      <Divider />

      <ToolbarButton
        label={t("link")}
        active={editor.isActive("link")}
        onClick={onLink}
        icon={LUCIDE.link}
      />
      <ToolbarButton
        label={t("image")}
        active={false}
        onClick={onImage}
        icon={ICONS.image}
      />

      {/* Shown only while the cursor is inside a code block — a select that is
          always visible but almost always inert invites misclicks. */}
      {inCodeBlock ? (
        <select
          aria-label={t("codeLanguage")}
          className="ml-auto h-8 rounded-md border border-black/15 bg-transparent px-2 text-body-4 dark:border-white/20"
          value={(editor.getAttributes("codeBlock").language as string) ?? ""}
          onChange={(event) =>
            editor
              .chain()
              .focus()
              .updateAttributes("codeBlock", { language: event.target.value || null })
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

function Divider() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-black/10 dark:bg-white/15" />;
}

/**
 * A dialog in place of `window.prompt`: prompt blocks the whole tab, cannot be
 * styled, and is close to unusable on mobile.
 */
function LinkDialog({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const t = useTranslations("common.editor");
  const tc = useTranslations("common");
  const [href, setHref] = useState((editor.getAttributes("link").href as string) ?? "");
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
    editor.chain().focus().extendMarkRange("link").setLink({ href: value }).run();
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
          {t.rich("linkHint", { code: (chunks) => <code className="mx-1">{chunks}</code> })}
        </Typography>
        <ToastError message={error} />
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
function ImageDialog({ editor, onClose }: { editor: Editor; onClose: () => void }) {
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
      setError(
        t("imageHostInvalid"),
      );
      return;
    }

    setMeasuring(true);
    const size = await measureImage(value);
    setMeasuring(false);

    if (!size) {
      setNotice(
        t("imageMeasureFailed"),
      );
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
        <ImageUploadButton
          label={t("imagePick")}
          onUploaded={(asset) => {
            setSrc(asset.url);
            setError(null);
            setNotice(null);
            // The original filename is a better `alt` suggestion than an empty
            // field, but only while the author has typed nothing — overwriting
            // what they just wrote loses data.
            setAlt((current) => current || suggestAltFrom(asset.originalName));
          }}
        />

        <Input
          label={t("imageUrl")}
          value={src}
          onChange={(event) => setSrc(event.target.value)}
          placeholder={t("imageUrlPlaceholder")}
        />
        <Input
          label={t("imageAlt")}
          value={alt}
          onChange={(event) => setAlt(event.target.value)}
          placeholder={t("imageAltPlaceholder")}
        />
        <ToastError message={error} />
        <Toast tone="warning" message={notice} />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {t("close")}
          </Button>
          <Button onClick={insert} disabled={measuring}>
            {measuring ? t("measuring") : t("insert")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

/** The image's `naturalWidth`/`naturalHeight`, or `null` if it will not load. */
function measureImage(src: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const image = new window.Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve(null);
    image.src = src;
  });
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
