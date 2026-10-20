"use client";

import { useLocale } from "next-intl";

import { usePlayItemTags } from "@noalhub/api/qa";
import type { BlogDoc } from "@noalhub/api/blog";

import { TaggedFrame } from "../tag-mark";
import { QaContent } from "./qa-content";

/**
 * A question's text, framed and labelled when the question carries tags.
 *
 * The question text holds no marker: only tag ids are stored on the item, and a tag
 * counts when its id is in the learner catalogue — which lists active tags only, so a
 * switched-off tag simply stops showing. While the catalogue loads the text shows on its
 * own and the frame appears when it arrives.
 */
export function QaQuestion({ doc, tagIds }: { doc: BlogDoc; tagIds: readonly string[] }) {
  const locale = useLocale();
  const catalogue = usePlayItemTags();
  const tags = (catalogue.data ?? []).filter((tag) => tagIds.includes(tag.id));

  return (
    <TaggedFrame tags={tags} locale={locale}>
      <QaContent doc={doc} />
    </TaggedFrame>
  );
}
