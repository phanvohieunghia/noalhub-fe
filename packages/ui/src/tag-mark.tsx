"use client";

import { Icon } from "./icons";

/**
 * `tone` is a theme token name, never a colour: the classes are spelled out here because
 * Tailwind cannot see a class built from a string, and they follow light/dark for free.
 * A tone this map does not know — one the backend added later — falls back to neutral
 * instead of breaking the question.
 *
 * The chip is filled with the tone and its text uses `background`, the page colour: in
 * light mode a dark red with pale text, in dark mode a light red with dark text — both
 * readable without a hardcoded white.
 */
const TONES: Record<string, { frame: string; chip: string }> = {
  danger: { frame: "border-danger/70", chip: "bg-danger text-background" },
  warning: { frame: "border-warning/70", chip: "bg-warning text-background" },
  success: { frame: "border-success/70", chip: "bg-success text-background" },
  primary: { frame: "border-primary/70", chip: "bg-primary text-primary-foreground" },
};
const NEUTRAL = { frame: "border-border", chip: "bg-foreground text-background" };

/** The label for `locale`, else English, else `fallback` (the tag's key). */
export function pickTagLabel(
  label: Record<string, string>,
  locale: string,
  fallback: string,
): string {
  return label[locale] ?? label.en ?? fallback;
}

/** What `TaggedFrame` needs to draw a tag — the learner view of `qa_item_tags`. */
export type TaggedFrameTag = {
  id: string;
  key: string;
  meta: { icon: string; tone: string; label: Record<string, string> };
};

/** A tag as a small filled label: its icon and name, in capitals. */
export function TagChip({
  icon,
  tone,
  label,
}: {
  icon: string;
  tone: string;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-caption font-bold uppercase tracking-wide ${
        (TONES[tone] ?? NEUTRAL).chip
      }`}
    >
      <Icon icon={icon} className="size-3.5 shrink-0" />
      {label}
    </span>
  );
}

/**
 * Wraps a question in an outlined frame (border only, no fill) with its tags as labels sitting on the top
 * edge — "critical question" being the archetype. With no tags it renders the children
 * untouched, so an untagged question looks exactly as before.
 *
 * The frame takes its colour from the FIRST tag; every tag still gets its own label. The
 * question text carries no marker: the frame is derived from the tags the item holds.
 */
export function TaggedFrame({
  tags,
  locale,
  children,
}: {
  tags: readonly TaggedFrameTag[];
  locale: string;
  children: React.ReactNode;
}) {
  const first = tags[0];
  if (!first) return <>{children}</>;

  return (
    <div
      className={`relative mt-3 rounded-2xl border-2 p-4 pt-6 ${
        (TONES[first.meta.tone] ?? NEUTRAL).frame
      }`}
    >
      <div className="absolute -top-3 left-4 flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <TagChip
            key={tag.id}
            icon={tag.meta.icon}
            tone={tag.meta.tone}
            label={pickTagLabel(tag.meta.label, locale, tag.key)}
          />
        ))}
      </div>
      {children}
    </div>
  );
}
