import type { BlogPostFormValues } from "@noalhub/api/blog";

/** The slug the backend generates for an empty draft — a sign the post has no real title yet. */
const DEFAULT_SLUG_PREFIX = "bai-viet-khong-ten";

export type PublishIssue = {
  id: string;
  /** An i18n key under `admin.posts.publish.issues.*` — this file knows no locale. */
  messageKey: string;
  /** `true` disables Publish. `false` is a soft warning that still allows publishing. */
  blocking: boolean;
};

/**
 * The Publish button's checklist (`docs/blog.md` §7.4).
 *
 * **The category is a hard block**, not a soft warning: the backend would answer
 * `POST_NOT_PUBLISHABLE` anyway (§2.2), so letting the user click and only then
 * reporting it sends them round twice.
 *
 * The other three are warnings: a post without a cover image is still a correct
 * post, it merely shares badly on social media. Hard-blocking things that are
 * not actually broken is the fastest way to teach people to ignore the
 * checklist.
 */
export function publishChecklist(
  values: BlogPostFormValues,
  { hasUnsavedChanges }: { hasUnsavedChanges: boolean },
): PublishIssue[] {
  const issues: PublishIssue[] = [];

  if (!values.categorySlug) {
    issues.push({
      id: "category",
      messageKey: "category",
      blocking: true,
    });
  }

  // Publishing with unsaved edits means readers see the OLD content while the
  // editor shows the new — with no autosave, that gap is entirely silent (§7.3).
  if (hasUnsavedChanges) {
    issues.push({
      id: "unsaved",
      messageKey: "unsaved",
      blocking: true,
    });
  }

  if (!values.metaDescription.trim() && !values.excerpt.trim()) {
    issues.push({
      id: "description",
      messageKey: "description",
      blocking: false,
    });
  }

  if (!values.coverImageUrl.trim()) {
    issues.push({
      id: "cover",
      messageKey: "cover",
      blocking: false,
    });
  }

  if (values.slug.startsWith(DEFAULT_SLUG_PREFIX)) {
    issues.push({
      id: "slug",
      messageKey: "slug",
      blocking: false,
    });
  }

  return issues;
}
