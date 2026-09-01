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
import { Button } from "@noalhub/ui/button";
import { Dialog } from "@noalhub/ui/dialog";
import { FormError } from "@noalhub/ui/form-error";
import { Input } from "@noalhub/ui/input";

import { ImageUploadButton } from "../media/image-upload-button";
import { Typography } from "@noalhub/ui/typography";

/**
 * Node `image` mang thêm `width`/`height` **ngay từ đợt 1**.
 *
 * Thêm sau là phải migrate `jsonb` của mọi bài đã viết, nên làm luôn. Không có
 * hai số này thì `next/image` hoặc phải đoán tỉ lệ (ảnh méo), hoặc rơi về `<img>`
 * (mất tối ưu), hoặc ăn **CLS** — một chỉ số Core Web Vitals, tức là nằm đúng
 * trong mục tiêu SEO của cả plan (`docs/blog-plan.md` §3.1b).
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
 * Editor Tiptap, cấu hình **đúng bằng allowlist §3.1** — không hơn một node nào.
 *
 * Schema của editor, schema validate ở backend và renderer
 * (`packages/ui/src/blog/post-content.tsx`) phải là cùng một danh sách; đây là
 * một trong ba chỗ đó.
 *
 * ⚠️ KHÔNG cắm `CodeBlockLowlight`: nó đổi shape của node `codeBlock` trong
 * JSON, và việc đó phải được chốt trước chứ không lén thêm vào (§3.1c). Đợt này
 * chỉ **lưu** `language`, chưa tô màu.
 */
export function TiptapEditor({
  value,
  onChange,
}: {
  value: BlogDoc;
  onChange: (doc: BlogDoc) => void;
}) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);
  /*
   * `editorProps` được đóng gói lúc TẠO editor, nên handler bên trong không thể
   * đóng bao lên biến `editor` (lúc đó nó còn chưa tồn tại). Ref là đường duy
   * nhất để chúng nói chuyện với instance đã dựng xong.
   */
  const editorRef = useRef<Editor | null>(null);
  const dropUpload = useUploadMedia({ allow: MEDIA_IMAGE_MIMES });

  /**
   * Kéo-thả và dán ảnh — đường mà người viết thật sự dùng; dialog là đường dự
   * phòng cho ảnh đã có URL.
   *
   * Chèn **sau khi upload xong**, không chèn trước một node tạm rồi thay `src`:
   * node tạm phải mang `blob:` hoặc `data:`, mà cả hai đều bị `sanitizeBlogDoc`
   * (chạy ở `onUpdate`) bỏ ngay trong nhịp sau — ảnh sẽ biến mất giữa chừng.
   * Đổi lại là ảnh chỉ hiện ra khi đã lên máy chủ; thanh tiến độ dưới toolbar
   * lấp khoảng chờ đó.
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
          setDropError(error instanceof Error ? error.message : "Không tải được ảnh lên."),
      });
    },
    [dropUpload],
  );

  const editor = useEditor({
    // Bắt buộc với SSR của Next: render ngay ở lượt đầu sẽ lệch hydration.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // `<h1>` là tiêu đề bài, nội dung chỉ h2/h3 (§6.2).
        heading: { levels: [2, 3] },
        // Không có trong allowlist §3.1 — bật lên là đẻ ra mark mà renderer bỏ,
        // tức là người viết gạch chân xong lưu lại thì chữ trở về bình thường.
        underline: false,
        link: {
          openOnClick: false,
          protocols: ["http", "https", "mailto"],
          // Lớp chặn thứ nhất cho `href`. `sanitizeBlogDoc` là lớp thứ hai và
          // mới là lớp bắt buộc — cái này chỉ để người viết biết ngay tại chỗ.
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
       * Trả `true` = "đã xử lý, ProseMirror đừng làm gì nữa". Bắt buộc với ảnh:
       * hành vi mặc định của cả hai là chèn `<img src="data:…">` từ clipboard/OS,
       * thứ `allowBase64: false` và `sanitizeBlogDoc` sẽ vứt — người viết thấy
       * ảnh hiện ra rồi mất, không hiểu vì sao.
       *
       * Chỉ nuốt sự kiện khi thật sự có FILE ảnh: dán chữ, dán HTML, kéo một
       * đoạn văn trong bài đều phải đi tiếp đường mặc định.
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
    // Làm sạch NGAY trong editor, không đợi lúc submit: nhờ vậy preview (§8) và
    // thứ sẽ được lưu là cùng một cây, không có "lúc soạn thì thấy, lưu xong thì
    // mất".
    onUpdate: ({ editor: instance }) => onChange(sanitizeBlogDoc(instance.getJSON())),
  });

  /*
   * Gán trong effect, không gán thẳng trong thân render: ghi vào ref lúc render
   * là hành vi không an toàn với StrictMode/concurrent (và `react-hooks/refs`
   * chặn đúng chỗ này). Handler paste/drop chỉ chạy sau khi đã mount, nên độ
   * trễ một nhịp của effect không quan sát được.
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
          Đang tải ảnh lên…{" "}
          {dropUpload.progress ? `${Math.round(dropUpload.progress.ratio * 100)}%` : ""}
        </Typography>
      ) : null}
      <FormError message={dropError} />

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
  const inCodeBlock = editor.isActive("codeBlock");

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-md border border-black/10 p-1.5 dark:border-white/15">
      <ToolbarButton
        label="Đậm"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        label="Nghiêng"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        label="Gạch ngang"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <s>S</s>
      </ToolbarButton>
      <ToolbarButton
        label="Mã inline"
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <code>{"</>"}</code>
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        label="Tiêu đề mức 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        label="Tiêu đề mức 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        label="Danh sách chấm"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        •
      </ToolbarButton>
      <ToolbarButton
        label="Danh sách số"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1.
      </ToolbarButton>
      <ToolbarButton
        label="Trích dẫn"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        ❞
      </ToolbarButton>
      <ToolbarButton
        label="Khối mã"
        active={inCodeBlock}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        {"{ }"}
      </ToolbarButton>
      <ToolbarButton
        label="Đường kẻ ngang"
        active={false}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        —
      </ToolbarButton>

      <Divider />

      <ToolbarButton label="Chèn liên kết" active={editor.isActive("link")} onClick={onLink}>
        Link
      </ToolbarButton>
      <ToolbarButton label="Chèn ảnh" active={false} onClick={onImage}>
        Ảnh
      </ToolbarButton>

      {/* Chỉ hiện khi con trỏ đang trong khối mã — một ô select luôn hiện nhưng
          hầu như luôn vô tác dụng là mời gọi bấm nhầm. */}
      {inCodeBlock ? (
        <select
          aria-label="Ngôn ngữ của khối mã"
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
            Không rõ
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
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`h-8 min-w-8 rounded px-2 text-body-3 transition-colors ${
        active ? "bg-foreground text-background" : "hover:bg-black/8 dark:hover:bg-white/12"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-black/10 dark:bg-white/15" />;
}

/**
 * Dialog thay cho `window.prompt`: prompt chặn cả tab, không style được, và trên
 * mobile thì gần như không dùng nổi.
 */
function LinkDialog({ editor, onClose }: { editor: Editor; onClose: () => void }) {
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
      setError("Chỉ nhận http, https, mailto hoặc đường dẫn nội bộ bắt đầu bằng /.");
      return;
    }
    // KHÔNG đặt `target`/`rel` ở đây: renderer tự quyết định (§3.1a), và ghi
    // chúng vào dữ liệu là mở lại đúng cửa mà allowlist attr vừa đóng.
    editor.chain().focus().extendMarkRange("link").setLink({ href: value }).run();
    onClose();
  };

  return (
    <Dialog open onClose={onClose} title="Liên kết">
      <div className="flex flex-col gap-4">
        <Input
          label="URL"
          value={href}
          onChange={(event) => setHref(event.target.value)}
          placeholder="https://…"
        />
        <Typography variant="body-4" className="-mt-2 opacity-60">
          Để trống rồi bấm Áp dụng để gỡ liên kết. Link ra ngoài tự động mang
          <code className="mx-1">rel=&quot;nofollow noopener&quot;</code> khi hiển thị.
        </Typography>
        <FormError message={error} />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={apply}>Áp dụng</Button>
        </div>
      </div>
    </Dialog>
  );
}

/**
 * Hai đường chèn ảnh: **tải lên** (đường chính) và **dán URL** (ảnh đã có sẵn
 * trên host được phép, ví dụ Unsplash).
 *
 * Tải lên xong thì `src` được điền hộ chứ KHÔNG chèn thẳng vào bài: người viết
 * còn phải gõ `alt`, và một ảnh đã nằm trong bài rồi thì gỡ ra sửa phiền hơn
 * nhiều so với bấm thêm một nút.
 *
 * Editor tự đo kích thước thật rồi ghi vào node (§3.1b). Đo không được (ảnh
 * chết, CORS, host chặn hotlink) thì để `null` và **cảnh báo tại chỗ**: renderer
 * vẫn hiện được nhưng phải rơi về khung `aspect-video`, và người viết nên biết
 * điều đó trước khi bài lên sóng.
 */
function ImageDialog({ editor, onClose }: { editor: Editor; onClose: () => void }) {
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
        "Ảnh phải dùng https và nằm trong danh sách host được phép. Host ngoài danh sách sẽ chết ở production vì next/image chặn.",
      );
      return;
    }

    setMeasuring(true);
    const size = await measureImage(value);
    setMeasuring(false);

    if (!size) {
      setNotice(
        "Không đo được kích thước ảnh (ảnh không tải được hoặc bị chặn CORS). Vẫn chèn được, nhưng ảnh sẽ hiển thị trong khung 16:9 thay vì kích thước thật.",
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
    <Dialog open onClose={onClose} title="Chèn ảnh">
      <div className="flex flex-col gap-4">
        <ImageUploadButton
          label="Chọn ảnh từ máy"
          onUploaded={(asset) => {
            setSrc(asset.url);
            setError(null);
            setNotice(null);
            // Tên file gốc là gợi ý `alt` tốt hơn ô trống, nhưng chỉ khi người
            // viết chưa gõ gì — ghi đè thứ họ vừa gõ là mất dữ liệu.
            setAlt((current) => current || suggestAltFrom(asset.originalName));
          }}
        />

        <Input
          label="URL ảnh"
          value={src}
          onChange={(event) => setSrc(event.target.value)}
          placeholder="Tải lên ở trên, hoặc dán https://images.unsplash.com/…"
        />
        <Input
          label="Mô tả ảnh (alt)"
          value={alt}
          onChange={(event) => setAlt(event.target.value)}
          placeholder="Để trống nếu ảnh chỉ để trang trí"
        />
        <FormError message={error} />
        {notice ? (
          <Typography
            variant="body-3"
            role="status"
            className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-700 dark:text-amber-300"
          >
            {notice}
          </Typography>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button onClick={insert} disabled={measuring}>
            {measuring ? "Đang đo ảnh…" : "Chèn"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

/** `naturalWidth`/`naturalHeight` của ảnh, hoặc `null` nếu không tải được. */
function measureImage(src: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const image = new window.Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

/** File ảnh đầu tiên trong một `FileList`, nếu có. */
function firstImageFile(files: FileList | null | undefined): File | undefined {
  if (!files) return undefined;
  return Array.from(files).find((file) =>
    (MEDIA_IMAGE_MIMES as readonly string[]).includes(file.type),
  );
}

/**
 * Chèn một asset đã upload vào vị trí con trỏ, kèm kích thước thật.
 *
 * Đo bằng `measureImage` chứ không lấy `asset.width`/`asset.height`: backend cố
 * ý để hai cột đó `null` (đọc chúng cần giải mã ảnh phía server, thứ đã chốt là
 * không làm). Trình duyệt thì vừa tải ảnh đó xong và biết chính xác — nên chỗ
 * rẻ nhất để có con số là ở đây.
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
 * Tên file → gợi ý `alt`: bỏ đuôi, đổi `-`/`_` thành khoảng trắng.
 *
 * Chỉ là **gợi ý**. `alt` đúng mô tả nội dung ảnh cho người không nhìn thấy nó,
 * còn tên file thì thường là `IMG_2931`; người viết vẫn phải sửa. Để trống hẳn
 * thì tệ hơn — ảnh không alt là lỗi a11y im lặng, còn một chuỗi vô nghĩa nằm
 * đó ít nhất còn nhắc người ta sửa.
 */
function suggestAltFrom(fileName: string | null): string {
  if (!fileName) return "";
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();
}
