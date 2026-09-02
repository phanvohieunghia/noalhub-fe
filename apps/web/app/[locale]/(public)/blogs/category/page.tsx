import { redirect } from "next/navigation";

/**
 * A bare `/blogs/category` → back to the listing, **not** a 404
 * (`docs/blog.md` §6.5).
 *
 * The nav never points at this URL; anyone here typed it or truncated a URL —
 * and what they want is the listing, not an error page.
 */
export default function CategoryIndexPage() {
  redirect("/blogs");
}
