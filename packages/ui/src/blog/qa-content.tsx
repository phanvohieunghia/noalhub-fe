import { expandMarkdownImages, type BlogDoc } from "@noalhub/api/blog";

import { PostContent } from "./post-content";

/**
 * A Q&A rich-text field (question, answer, explanation, intro) — `PostContent` plus
 * the fix-up above, so every screen that shows question text draws its pictures the
 * same way. Read-only: use the editor, not this, for content being written.
 */
export function QaContent({ doc }: { doc: BlogDoc }) {
  return <PostContent doc={expandMarkdownImages(doc)} />;
}
