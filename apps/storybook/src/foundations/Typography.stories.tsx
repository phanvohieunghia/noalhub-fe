import type { Meta, StoryObj } from "@storybook/nextjs";
import React from "react";
import { Typography, TYPOGRAPHY_VARIANTS } from "@noalhub/ui/typography";
import type { Variant } from "@noalhub/ui/typography";

import { useTokens } from "./use-token";

/**
 * The type scale of `packages/config/theme.css`, rendered through the real
 * `Typography` component.
 *
 * Nothing on this page is a copy: the steps come from the component's exported
 * list, the numbers are read from the live CSS variables. Add a step to
 * `typography.tsx` and it appears here — in the right group — with no edit.
 */
const meta: Meta = {
  title: "Foundations/Typography",
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Groups are derived from the variant NAME, not listed by hand. The final
 * catch-all matters: a step in some new family still shows up rather than
 * silently disappearing from the documentation.
 */
const GROUPS: { title: string; note: string; match: (variant: string) => boolean }[] = [
  {
    title: "Headings",
    note: "The larger the step, the tighter the line-height and the more negative the letter-spacing.",
    match: (variant) => /^h\d/.test(variant),
  },
  {
    title: "Titles",
    note: "Not headings: these label a block (a card, a table row, a stat tile). Same size range as h4–h6, but tighter line-height and POSITIVE letter-spacing.",
    match: (variant) => variant.startsWith("title-"),
  },
  {
    title: "Body",
    note: "`body-2` is the system default; `body-1` is for a lead paragraph only.",
    match: (variant) => variant.startsWith("body-"),
  },
  {
    title: "Caption",
    note: "Same size as `body-4` but always italic — separated by style, not size.",
    match: (variant) => variant === "caption",
  },
  {
    title: "Other",
    note: "Steps that do not fall into a group above.",
    match: () => true,
  },
];

/** Each variant lands in the FIRST group that claims it. */
const GROUPED = GROUPS.map((group, index) => ({
  ...group,
  variants: TYPOGRAPHY_VARIANTS.filter(
    (variant) => GROUPS.findIndex((candidate) => candidate.match(variant)) === index,
  ),
})).filter((group) => group.variants.length > 0);

const TOKENS = TYPOGRAPHY_VARIANTS.flatMap((variant) => [
  `--text-${variant}`,
  `--text-${variant}--line-height`,
  `--text-${variant}--letter-spacing`,
]);

const SAMPLE = "Chuyển giao tri thức — the quick brown fox";

function Step({ variant, values }: { variant: Variant; values: Record<string, string> }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border py-4 last:border-0">
      <div className="flex flex-wrap items-baseline gap-x-3 text-body-4 text-muted-foreground">
        <code className="text-foreground">{variant}</code>
        <span>{values[`--text-${variant}`] || "—"}</span>
        <span>line-height {values[`--text-${variant}--line-height`] || "1"}</span>
        <span>tracking {values[`--text-${variant}--letter-spacing`] || "0"}</span>
      </div>
      <Typography variant={variant}>{SAMPLE}</Typography>
    </div>
  );
}

function Scale() {
  const values = useTokens(TOKENS);

  return (
    <div className="flex flex-col gap-10 bg-background p-8 text-foreground">
      <div className="flex flex-col gap-2">
        <h1 className="text-h3">Type scale</h1>
        <p className="max-w-2xl text-body-3 text-muted-foreground">
          Every step carries its own line-height and letter-spacing, so one
          utility is the whole decision. The sample carries Vietnamese diacritics
          on purpose — they are what a too-tight line-height breaks first.
        </p>
      </div>

      {GROUPED.map((group) => (
        <section key={group.title} className="flex flex-col gap-1">
          <h2 className="text-title-2">{group.title}</h2>
          <p className="max-w-2xl text-body-4 text-muted-foreground">{group.note}</p>
          <div className="mt-2">
            {group.variants.map((variant) => (
              <Step key={variant} variant={variant} values={values} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export const Scale_: Story = {
  name: "Scale",
  render: () => <Scale />,
};
