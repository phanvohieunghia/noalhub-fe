/**
 * A kebab-case slug with Vietnamese diacritics stripped.
 *
 * Used for **two** things, deliberately by the same function (`docs/blog.md`
 * §3.3):
 * - the post slug (the "generate from title" button in the SEO panel, §7.2),
 * - heading `id`s inside a post, so anchors and the table of contents land in
 *   the right place.
 *
 * One rule for both means the URL `/blogs/gioi-thieu#cai-dat` can never drift
 * from what the renderer put in the DOM.
 */
export function slugify(input: string): string {
  return (
    input
      .normalize("NFD")
      // Drop tone marks and diacritics (U+0300–U+036F) once NFD split them off.
      .replace(/[\u0300-\u036f]/g, "")
      // `đ`/`Đ` is not a `d` with a diacritic, so NFD cannot split it — it has
      // to be replaced by hand, or "đường" becomes "ung" instead of "duong".
      .replace(/[đĐ]/g, "d")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120)
      // `slice` can cut right on a dash — clean up once more.
      .replace(/-+$/g, "")
  );
}
