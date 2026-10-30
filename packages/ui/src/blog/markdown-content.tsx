import Image from 'next/image'
import {isValidElement} from 'react'
import Markdown, {type Components, type UrlTransform} from 'react-markdown'
import remarkGfm from 'remark-gfm'

import {
  isSafeImageSrc,
  isSafeLinkHref,
  parseImageTitle,
} from '@noalhub/api/blog'

import {alignClassName, parseAlignMarker} from './align-markdown'
import {MermaidDiagram} from './mermaid-diagram'

import './post-prose.css'

/**
 * `PostContent`'s twin for content stored as a **markdown string**. Same
 * `.post-prose` stylesheet, so the two formats read identically, and the
 * same three rules (see the note atop `post-content.tsx`):
 *
 * 1. **No `@tiptap/*`** — `react-markdown` parses on the server, so this is
 *    safe in `apps/web`'s public bundle.
 * 2. **No raw HTML** — `skipHtml` drops it; `react-markdown` never reaches for
 *    `dangerouslySetInnerHTML`.
 * 3. **Unknown elements are unwrapped, not thrown on** — `ALLOWED` mirrors the
 *    blog allowlist (§3.1); anything else keeps its text and loses its tag.
 */
export function MarkdownContent({markdown}: {markdown: string}) {
  return (
    <div className="post-prose">
      <Markdown
        remarkPlugins={[remarkGfm, remarkAlign]}
        skipHtml
        allowedElements={ALLOWED}
        unwrapDisallowed
        urlTransform={safeUrl}
        components={COMPONENTS}>
        {markdown}
      </Markdown>
    </div>
  )
}

type MdNode = {
  type: string
  value?: string
  children?: MdNode[]
  data?: {hProperties?: Record<string, unknown>}
}

/**
 * Turns the `<!--align:…-->` marker at the end of a paragraph or heading into
 * a class on that block (`align-markdown.ts`). Runs before `skipHtml` drops the
 * comment, so a reader that has no such plugin still shows plain text.
 */
function remarkAlign() {
  const walk = (node: MdNode) => {
    if (
      (node.type === 'paragraph' || node.type === 'heading') &&
      node.children
    ) {
      const last = node.children[node.children.length - 1]
      const align = last?.type === 'html' ? parseAlignMarker(last.value) : null
      if (align) {
        node.children.pop()
        const tail = node.children[node.children.length - 1]
        if (tail?.type === 'text' && tail.value)
          tail.value = tail.value.replace(/\s+$/, '')
        node.data = {
          ...node.data,
          hProperties: {
            ...node.data?.hProperties,
            className: alignClassName(align),
          },
        }
      }
    }
    node.children?.forEach(walk)
  }
  return (tree: MdNode) => walk(tree)
}

const ALLOWED = [
  'p',
  'br',
  'strong',
  'em',
  'del',
  'code',
  'pre',
  'a',
  'img',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'hr',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
]

/**
 * The same gates the JSON path uses, applied before any component sees the
 * URL. `undefined` drops the attribute: a link degrades to its text, an image
 * to nothing (see `a`/`img` below).
 */
const safeUrl: UrlTransform = (url, key) => {
  if (key === 'href') return isSafeLinkHref(url) ? url : undefined
  if (key === 'src') return isSafeImageSrc(url) ? url : undefined
  return undefined
}

const COMPONENTS: Components = {
  // `<h1>` is the page title and the editor stops at h4 — clamp to h2…h4 so a
  // pasted `#` or `#####` lands on a level the outline understands.
  h1: ({children, className}) => <h2 className={className}>{children}</h2>,
  h5: ({children, className}) => <h4 className={className}>{children}</h4>,
  h6: ({children, className}) => <h4 className={className}>{children}</h4>,

  // `<s>` rather than GFM's `<del>`, matching what `PostContent` emits.
  del: ({children}) => <s>{children}</s>,

  a: ({href, children}) => {
    if (!href) return <>{children}</>
    const isInternal = href.startsWith('/')
    return (
      <a
        href={href}
        // Decided by the renderer, never taken from data (§3.1a).
        {...(isInternal ? {} : {target: '_blank', rel: 'nofollow noopener'})}>
        {children}
      </a>
    )
  },

  /*
   * Without a stored size the image takes the column width and its own height
   * (a fixed 16:9 frame left a blank band under any other ratio). A `<span>`, not `<figure>`: markdown
   * images sit inside a `<p>`, where a block element breaks hydration.
   */
  img: ({src, alt, title}) => {
    if (typeof src !== 'string' || !src) return null
    // A size the editor stored in the title (`image-size-title.ts`).
    const {width, height, align, widthPercent} = parseImageTitle(title)
    if (width && height) {
      return (
        <span className="block" data-image-align={align ?? undefined}>
          <Image
            src={src}
            alt={alt ?? ''}
            width={width}
            height={height}
            style={
              widthPercent
                ? {width: `${widthPercent}%`, height: 'auto'}
                : undefined
            }
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </span>
      )
    }
    return (
      <span className="block">
        <Image
          src={src}
          alt={alt ?? ''}
          width={0}
          height={0}
          style={{width: '100%', height: 'auto'}}
          sizes="(max-width: 768px) 100vw, 768px"
        />
      </span>
    )
  },

  // Scrolls sideways (`post-prose.css`), so it must be keyboard-reachable.
  pre: ({children}) => {
    const code = isValidElement<{
      className?: string
      children?: React.ReactNode
    }>(children)
      ? children
      : null
    if (
      code?.props.className?.includes('language-mermaid') &&
      typeof code.props.children === 'string'
    ) {
      return <MermaidDiagram chart={code.props.children} />
    }
    return <pre tabIndex={0}>{children}</pre>
  },

  table: ({children}) => (
    <div className="post-prose-table-scroll">
      <table>{children}</table>
    </div>
  ),
}
