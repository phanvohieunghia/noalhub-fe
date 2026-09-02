/**
 * Structured data for Google. Rendered in a **server component** so it is in the
 * first HTML — `<meta>` cannot replace it, and this is what Google actually uses
 * for rich results (`docs/blog.md` §6.2).
 *
 * ⚠️ `JSON.stringify` does NOT neutralize an XSS payload: a post title
 * containing `</script>` closes the tag early and everything after it becomes
 * real HTML. Replacing `<` with its escape makes no difference inside JSON while
 * leaving the HTML parser with no tag to see. This is Next's own documented
 * recommendation.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
