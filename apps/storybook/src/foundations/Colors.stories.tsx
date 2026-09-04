import type { Meta, StoryObj } from "@storybook/nextjs";
import React from "react";

import { useTokens } from "./use-token";

/**
 * The color system of `packages/config/theme.css`.
 *
 * Nothing here is a second copy of the palette: the token NAMES are parsed out
 * of the stylesheet at build time (`.storybook/theme-tokens.ts`), the VALUES are
 * read from the live document. Add a token to `theme.css` and it shows up here;
 * flip the theme in the toolbar and every swatch follows.
 *
 * Components use **semantic tokens only**. The raw scales are shown because the
 * semantic tokens point at them, not because you should reach for
 * `bg-brand-700` in a component (`docs/theme.md`).
 */
const meta: Meta = {
  title: "Foundations/Colors",
  parameters: {
    layout: "fullscreen",
    // A page of swatches has no "component", so the props panel would only ever
    // be empty.
    controls: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

const { semantic, scales } = __THEME_TOKENS__;

/**
 * Semantic tokens are grouped the way a reader picks one: "what surface am I
 * on", "what text goes on it", "what is interactive", "what is a status".
 *
 * Only the grouping is editorial — the membership is not. Anything `theme.css`
 * declares that no group claims falls into "Other", so a new token can never go
 * missing from this page just because nobody updated the list.
 */
const SEMANTIC_GROUPS: { title: string; note: string; tokens: string[] }[] = [
  {
    title: "Surfaces",
    note: "In dark mode `surface` is LIGHTER than `background`, not white.",
    tokens: ["--background", "--surface", "--muted", "--highlight", "--border"],
  },
  {
    title: "Text",
    note: "Each one is paired with the surface of the same name.",
    tokens: [
      "--foreground",
      "--surface-foreground",
      "--muted-foreground",
      "--highlight-foreground",
      "--accent",
    ],
  },
  {
    title: "Interactive",
    note: "`ring` is for focus rings only — never for text.",
    tokens: ["--primary", "--primary-hover", "--primary-foreground", "--ring"],
  },
  {
    title: "Status",
    note: "Deliberately outside the brand scale: a teal `success` would read as the brand color.",
    tokens: ["--danger", "--success", "--warning"],
  },
];

const GROUPED = (() => {
  const claimed = new Set(SEMANTIC_GROUPS.flatMap((group) => group.tokens));
  // A group keeps only tokens that really exist, so a renamed token disappears
  // from its group instead of rendering an empty swatch.
  const groups = SEMANTIC_GROUPS.map((group) => ({
    ...group,
    tokens: group.tokens.filter((token) => semantic.includes(token)),
  })).filter((group) => group.tokens.length > 0);

  const rest = semantic.filter((token) => !claimed.has(token));
  return rest.length > 0
    ? [
        ...groups,
        {
          title: "Other",
          note: "Declared in `theme.css` but not sorted into a group above — give it a home in `Colors.stories.tsx`.",
          tokens: rest,
        },
      ]
    : groups;
})();

/** Notes for the scales that have one; a scale without a note still renders. */
const SCALE_NOTES: Record<string, string> = {
  brand:
    "Raw material for the semantic tokens. 500→950 are our extension: all four source colors are too light to carry text.",
  neutral: "Grays tinted with the brand hue — overrides Tailwind's own `neutral`.",
  blush: "Off the teal axis; the background of highlight and callout areas.",
};

const ALL_TOKENS = [...semantic, ...Object.values(scales).flat()];

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div
        className="h-14 rounded-lg border border-border"
        style={{ background: `var(${name})` }}
      />
      <code className="truncate text-body-4">
        {name.replace("--color-", "").replace("--", "")}
      </code>
      <code className="truncate text-body-4 text-muted-foreground">{value || "—"}</code>
    </div>
  );
}

function Section({
  title,
  note,
  tokens,
  values,
}: {
  title: string;
  note?: string;
  tokens: string[];
  values: Record<string, string>;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-title-2">{title}</h2>
        {note ? <p className="max-w-2xl text-body-4 text-muted-foreground">{note}</p> : null}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {tokens.map((name) => (
          <Swatch key={name} name={name} value={values[name] ?? ""} />
        ))}
      </div>
    </section>
  );
}

function Palette() {
  const values = useTokens(ALL_TOKENS);

  return (
    <div className="flex flex-col gap-10 bg-background p-8 text-foreground">
      <div className="flex flex-col gap-2">
        <h1 className="text-h3">Color tokens</h1>
        <p className="max-w-2xl text-body-3 text-muted-foreground">
          Names come from <code>packages/config/theme.css</code>, values from the
          live document. Switch the theme in the toolbar to compare light and
          dark.
        </p>
      </div>

      <div>
        <h2 className="text-title-1">Semantic tokens — use these</h2>
        <p className="text-body-4 text-muted-foreground">
          The only layer a component should name.
        </p>
      </div>
      {GROUPED.map((group) => (
        <Section key={group.title} {...group} values={values} />
      ))}

      <hr className="border-border" />

      {Object.entries(scales).map(([family, tokens]) => (
        <Section
          key={family}
          title={`${family[0].toUpperCase()}${family.slice(1)} scale`}
          note={SCALE_NOTES[family]}
          tokens={tokens}
          values={values}
        />
      ))}
    </div>
  );
}

export const Palette_: Story = {
  name: "Palette",
  render: () => <Palette />,
};
