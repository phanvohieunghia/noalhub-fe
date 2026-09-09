"use client";

import type { BlogDoc } from "@noalhub/api/blog";
import { PostContent } from "@noalhub/ui/blog/post-content";

/**
 * Renders a question's rich text with the same renderer the blog uses.
 *
 * One renderer for both features is the point: the backend runs one sanitizer,
 * so a second display path would be a second place to forget h4 or tables — and
 * the failure mode is content that saves fine and shows up blank.
 */
export function PostContentPreview({ doc }: { doc: BlogDoc }) {
  return (
    <div className="text-body-3">
      <PostContent doc={doc} />
    </div>
  );
}
