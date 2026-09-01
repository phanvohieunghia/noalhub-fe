import Image from "next/image";
import { Fragment } from "react";

import { isSafeImageSrc, isSafeLinkHref } from "@noalhub/api/blog";
import type {
  BlogBlockNode,
  BlogDoc,
  BlogInlineNode,
  BlogListItemNode,
  BlogTextNode,
} from "@noalhub/api/blog";
import { collectHeadings } from "@noalhub/core/blog/headings";

import "./post-content.css";

/**
 * Renderer Tiptap JSON → React. **Một code path** cho `apps/web` (bản thật) và
 * `apps/admin` (preview, §8) — nhờ vậy preview không bao giờ lệch bản thật.
 *
 * Ba ràng buộc, cả ba đều có lý do ở `docs/blog-plan.md`:
 *
 * 1. **KHÔNG import `@tiptap/*`** (§3.2). Chạm vào Tiptap là kéo cả bộ editor
 *    vào bundle công khai của `apps/web`, nơi không ai soạn thảo gì. Tiptap chỉ
 *    tồn tại trong `apps/admin`.
 * 2. **Không có đường nào nhả HTML thô** (§3). Không `dangerouslySetInnerHTML`,
 *    không `innerHTML` — đó là loại an toàn do kiến trúc chứ không do kỷ luật.
 * 3. **Node/attr lạ thì bỏ im lặng, không ném** (§3.1). Một node lạ không được
 *    làm trắng cả trang bài viết.
 *
 * `sanitizeBlogDoc` (tầng schema) đã lọc một lượt khi dữ liệu vào; các lần kiểm
 * `isSafeLinkHref`/`isSafeImageSrc` dưới đây là **lớp thứ hai**, cố ý trùng:
 * renderer nhận doc từ nhiều đường (server fetch, cache, state của editor) và
 * chỉ cần một đường quên lọc là có stored XSS (§3.1a).
 */
export function PostContent({ doc }: { doc: BlogDoc }) {
  // Quét cả cây MỘT lượt lấy id đã khử trùng — cùng hàm mà mục lục dùng, nên
  // anchor và TOC không thể lệch nhau (§3.3).
  const headings = collectHeadings(doc);
  let headingCursor = 0;

  return (
    <div className="blog-content">
      {doc.content.map((node, index) => {
        const headingId =
          node.type === "heading" ? headings[headingCursor++]?.id : undefined;
        return <Block key={index} node={node} headingId={headingId} />;
      })}
    </div>
  );
}

function Block({
  node,
  headingId,
}: {
  node: BlogBlockNode;
  headingId?: string;
}) {
  switch (node.type) {
    case "paragraph":
      // Đoạn rỗng là cách người viết tạo khoảng nghỉ — giữ chiều cao dòng.
      return <p>{node.content?.length ? <Inline nodes={node.content} /> : <br />}</p>;

    case "heading": {
      // `<h1>` là tiêu đề bài (§6.2) nên nội dung chỉ có h2/h3.
      const Tag = node.attrs.level === 3 ? "h3" : "h2";
      return <Tag id={headingId}>{<Inline nodes={node.content ?? []} />}</Tag>;
    }

    case "bulletList":
      return (
        <ul>
          <ListItems items={node.content} />
        </ul>
      );

    case "orderedList":
      return (
        <ol>
          <ListItems items={node.content} />
        </ol>
      );

    case "blockquote":
      return (
        <blockquote>
          {node.content.map((child, index) => (
            <Block key={index} node={child} />
          ))}
        </blockquote>
      );

    case "codeBlock":
      return (
        <pre>
          <code
            className={node.attrs.language ? `language-${node.attrs.language}` : undefined}
          >
            {node.content?.map((child) => child.text).join("") ?? ""}
          </code>
        </pre>
      );

    case "horizontalRule":
      return <hr />;

    case "image":
      return <ContentImage node={node} />;

    default:
      return null;
  }
}

function ListItems({ items }: { items: BlogListItemNode[] }) {
  return (
    <>
      {items.map((item, index) => (
        <li key={index}>
          {item.content.map((child, childIndex) => (
            <Block key={childIndex} node={child} />
          ))}
        </li>
      ))}
    </>
  );
}

/**
 * Ảnh trong bài.
 *
 * Có `width`/`height` thật → `next/image` dùng đúng kích thước. `null` (editor
 * không đo được: ảnh chết, CORS) → khung `aspect-video` + `fill` +
 * `object-contain`: ảnh không méo, và quan trọng hơn là **không có CLS** — một
 * chỉ số Core Web Vitals, tức là nằm đúng trong mục tiêu SEO của plan (§3.1b).
 */
function ContentImage({
  node,
}: {
  node: Extract<BlogBlockNode, { type: "image" }>;
}) {
  const { src, alt, width, height } = node.attrs;
  // Lớp phòng thủ thứ hai — xem ghi chú đầu file.
  if (!isSafeImageSrc(src)) return null;

  if (width && height) {
    return (
      <figure>
        <Image src={src} alt={alt} width={width} height={height} sizes="(max-width: 768px) 100vw, 768px" />
      </figure>
    );
  }

  return (
    <figure className="relative aspect-video w-full">
      <Image src={src} alt={alt} fill className="object-contain" sizes="(max-width: 768px) 100vw, 768px" />
    </figure>
  );
}

function Inline({ nodes }: { nodes: BlogInlineNode[] }) {
  return (
    <>
      {nodes.map((node, index) =>
        node.type === "hardBreak" ? (
          <br key={index} />
        ) : (
          <Text key={index} node={node} />
        ),
      )}
    </>
  );
}

function Text({ node }: { node: BlogTextNode }) {
  const marks = node.marks ?? [];
  let content: React.ReactNode = node.text;

  // Mark ký tự bọc từ trong ra ngoài; `link` để cuối cùng nên nó là thẻ ngoài
  // cùng — `<a><strong>…</strong></a>` chứ không phải ngược lại.
  for (const mark of marks) {
    switch (mark.type) {
      case "bold":
        content = <strong>{content}</strong>;
        break;
      case "italic":
        content = <em>{content}</em>;
        break;
      case "strike":
        content = <s>{content}</s>;
        break;
      case "code":
        content = <code>{content}</code>;
        break;
      default:
        break;
    }
  }

  const link = marks.find((mark) => mark.type === "link");
  // href sai ràng buộc → KHÔNG render thẻ <a> nhưng GIỮ text con: link hỏng
  // thành chữ thường, không mất chữ (§3.1a).
  if (link && isSafeLinkHref(link.attrs.href)) {
    const isInternal = link.attrs.href.startsWith("/");
    content = (
      <a
        href={link.attrs.href}
        // `target`/`rel` do renderer đặt, KHÔNG nhận từ dữ liệu (§3.1a).
        {...(isInternal ? {} : { target: "_blank", rel: "nofollow noopener" })}
      >
        {content}
      </a>
    );
  }

  return <Fragment>{content}</Fragment>;
}
