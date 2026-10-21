import type { Editor } from "@tiptap/react";
import { Extension } from "@tiptap/react";
import type { Node as PMNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { diffArrays } from "diff";

/**
 * What changed against the content the editor opened with, painted on the
 * document: **green** = added, **yellow** = replaced (the old wording sits struck
 * through just before the new one), **red** = removed (shown struck through where
 * it used to be). Word-level, so one edited sentence does not light up a whole
 * paragraph.
 *
 * Recomputed (debounced) after every edit — paste, typing, delete — against the
 * baseline: the document at open, at the last `acceptChanges`, or just before the
 * last paste (the editor rebases there, so a paste is always shown against what it replaced).
 * Highlights are decorations, never part of the document, so they cannot leak into
 * the saved content or the markdown round trip.
 */
type Word = { text: string; from: number; to: number };

type ChangeState = {
  base: PMNode;
  decorations: DecorationSet;
};

const DEBOUNCE_MS = 250;

export const changeHighlightKey = new PluginKey<ChangeState>("changeHighlight");

/** Words of a document with their positions; whitespace carries no meaning here. */
function wordsOf(doc: PMNode): Word[] {
  const words: Word[] = [];
  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    for (const match of node.text.matchAll(/\S+/g)) {
      const from = pos + (match.index ?? 0);
      words.push({ text: match[0], from, to: from + match[0].length });
    }
  });
  return words;
}

function removedSpan(text: string, className: string): HTMLElement {
  const span = document.createElement("span");
  span.className = className;
  span.textContent = text;
  span.contentEditable = "false";
  return span;
}

function compare(before: PMNode, after: PMNode): Pick<ChangeState, "decorations"> {
  const oldWords = wordsOf(before);
  const newWords = wordsOf(after);
  const parts = diffArrays(
    oldWords.map((word) => word.text),
    newWords.map((word) => word.text),
  );

  const decorations: Decoration[] = [];
  let cursor = 0; // index into `newWords`
  let oldCursor = 0; // index into `oldWords`

  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    const count = part.value.length;

    if (!part.added && !part.removed) {
      cursor += count;
      oldCursor += count;
      continue;
    }

    if (part.removed) {
      const removedWords = oldWords.slice(oldCursor, oldCursor + count);
      oldCursor += count;
      const next = parts[i + 1];

      // Removed, then added straight after: the words were swapped, not deleted.
      if (next?.added) {
        const run = newWords.slice(cursor, cursor + next.value.length);
        const before = removedWords.map((word) => word.text).join(" ");
        // The old wording stays visible, struck through, right before the new one.
        decorations.push(
          Decoration.widget(run[0].from, () => removedSpan(before, "diff-replaced-old"), {
            side: -1,
            key: `replaced-${run[0].from}-${before}`,
          }),
          Decoration.inline(run[0].from, run[run.length - 1].to, {
            class: "diff-replaced",
          }),
        );
        cursor += next.value.length;
        i += 1;
        continue;
      }

      const anchor = newWords[cursor - 1]?.to ?? newWords[cursor]?.from;
      if (anchor !== undefined) {
        const text = removedWords.map((word) => word.text).join(" ");
        decorations.push(
          Decoration.widget(anchor, () => removedSpan(` ${text} `, "diff-removed"), {
            side: 1,
            key: `removed-${anchor}-${text}`,
          }),
        );
      }
      continue;
    }

    const run = newWords.slice(cursor, cursor + count);
    decorations.push(
      Decoration.inline(run[0].from, run[run.length - 1].to, { class: "diff-added" }),
    );
    cursor += count;
  }

  if (decorations.length === 0) return { decorations: DecorationSet.empty };
  return { decorations: DecorationSet.create(after, decorations) };
}

export const ChangeHighlight = Extension.create({
  name: "changeHighlight",

  addProseMirrorPlugins() {
    return [
      new Plugin<ChangeState>({
        key: changeHighlightKey,
        state: {
          init: (_, state) => ({
            base: state.doc,
            decorations: DecorationSet.empty,
          }),
          apply(tr, value) {
            const meta = tr.getMeta(changeHighlightKey) as
              | { accept: true }
              | { result: Pick<ChangeState, "decorations"> }
              | undefined;
            if (meta && "accept" in meta) {
              return { base: tr.doc, decorations: DecorationSet.empty };
            }
            if (meta && "result" in meta) return { ...value, ...meta.result };
            // Until the debounced recompute lands, keep the old marks glued to their text.
            if (tr.docChanged) {
              return { ...value, decorations: value.decorations.map(tr.mapping, tr.doc) };
            }
            return value;
          },
        },
        props: {
          decorations: (state) => changeHighlightKey.getState(state)?.decorations,
        },
        view: () => {
          let timer: ReturnType<typeof setTimeout> | undefined;
          return {
            update(view, previous) {
              if (view.state.doc.eq(previous.doc)) return;
              clearTimeout(timer);
              timer = setTimeout(() => {
                const state = changeHighlightKey.getState(view.state);
                if (!state) return;
                // Typing into an empty document makes everything "added" — no information.
                const result =
                  wordsOf(state.base).length === 0
                    ? { decorations: DecorationSet.empty }
                    : compare(state.base, view.state.doc);
                view.dispatch(view.state.tr.setMeta(changeHighlightKey, { result }));
              }, DEBOUNCE_MS);
            },
            destroy: () => clearTimeout(timer),
          };
        },
      }),
    ];
  },
});

/** Makes the current content the new baseline and clears the highlights. */
export function acceptChanges(editor: Editor): void {
  editor.view.dispatch(editor.state.tr.setMeta(changeHighlightKey, { accept: true }));
}
