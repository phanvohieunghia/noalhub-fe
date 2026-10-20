import {
  CHARS_PER_TOKEN,
  EST_TOKENS_PER_ITEM,
  type AiModel,
  type QaOutlineEntry,
} from "@noalhub/api/qa";

export type RunFit =
  | { ok: true }
  | {
      ok: false;
      reason: "context";
      chars: number;
      tokens: number;
      window: number;
      model: string;
    }
  | {
      ok: false;
      reason: "output";
      /** Questions the model can emit in one call. */
      capacity: number;
      maxCount: number;
      model: string;
    };

/**
 * The same two pre-flight checks the backend runs on `generate-sets`, run on the
 * chosen sections and model so the dialog can say why before the click.
 *
 * Input and output are independent. The sections only decide which text goes into
 * the prompt (`charCount` summed — a parent and its child both count, as the backend
 * sends each picked anchor separately). Output is one flat list of questions for the
 * whole run, so it depends on the question count alone.
 */
export function checkRunFit({
  entries,
  anchors,
  maxCount,
  model,
}: {
  entries: QaOutlineEntry[];
  anchors: string[];
  /** Left out when the run has no upper bound: only the context window is checked. */
  maxCount?: number;
  model: AiModel;
}): RunFit {
  const chars = entries
    .filter((entry) => anchors.includes(entry.anchor))
    .reduce((sum, entry) => sum + entry.charCount + entry.title.length, 0);
  const tokens = Math.ceil(chars / CHARS_PER_TOKEN);
  if (tokens > model.contextWindow) {
    return {
      ok: false,
      reason: "context",
      chars,
      tokens,
      window: model.contextWindow,
      model: model.label,
    };
  }
  // Each question costs EST_TOKENS_PER_ITEM and a call can emit `maxOutputTokens`.
  const capacity = Math.floor(model.maxOutputTokens / EST_TOKENS_PER_ITEM);
  if (maxCount !== undefined && maxCount > capacity) {
    return {
      ok: false,
      reason: "output",
      capacity,
      maxCount,
      model: model.label,
    };
  }
  return { ok: true };
}
