'use client'

import type {BlogDoc} from '@noalhub/api/blog'
import {QaContent} from '@noalhub/ui/blog/qa-content'
import {QaQuestion} from '@noalhub/ui/blog/qa-question'

/**
 * Renders a question's rich text with the same renderer the blog uses.
 *
 * One renderer for both features is the point: the backend runs one sanitizer,
 * so a second display path would be a second place to forget h4 or tables — and
 * the failure mode is content that saves fine and shows up blank.
 *
 * Question text often carries images as markdown (`![alt](url "=300x167")`) inside a
 * plain paragraph; `QaContent` turns them into real images.
 */
export function PostContentPreview({
  doc,
  tagIds,
}: {
  doc: BlogDoc
  /**
   * Pass a QUESTION's tag ids to draw it framed and labelled, as a learner sees it. Leave
   * it out for any other rich text (answer, explanation, intro) — those are never framed.
   */
  tagIds?: readonly string[]
}) {
  return (
    <div className="text-body-3">
      {tagIds ? (
        <QaQuestion doc={doc} tagIds={tagIds} />
      ) : (
        <QaContent doc={doc} />
      )}
    </div>
  )
}
