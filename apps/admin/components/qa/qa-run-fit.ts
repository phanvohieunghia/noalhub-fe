import {
  CHARS_PER_TOKEN,
  CHUNK_CONTEXT_MARGIN_TOKENS,
  CHUNK_OUTPUT_SAFETY,
  CHUNK_TARGET_INPUT_TOKENS,
  EST_TOKENS_PER_ITEM,
  MIN_CHUNK_TOKENS,
  OUTLINE_OUTPUT_RATIO,
  type AiModel,
  type QaOutlineEntry,
} from "@noalhub/api/qa";

/** `system` is unknown here (it depends on the prompt picked), so a typical size. */
const TYPICAL_SYSTEM_TOKENS = 2_500;

export type RunFit =
  | {
      ok: true;
      /** Model calls the run will take: sections are packed into calls by token budget. */
      calls: number;
    }
  | {
      /** One section alone is over what a call can read, and a section is never cut. */
      ok: false;
      reason: "section";
      title: string;
      tokens: number;
      budget: number;
      model: string;
    }
  | {
      /** The question count leaves no room for source text on this model. */
      ok: false;
      reason: "model";
      model: string;
    }
  | {
      /** More calls are needed for the output than there are sections to split across. */
      ok: false;
      reason: "output";
      capacity: number;
      maxCount: number;
      calls: number;
      sections: number;
      model: string;
    };

/** The backend's `qaChunkBudgetTokens`; `system` is a typical size, the backend's exact answer wins. */
function qaChunkBudget(model: AiModel, maxCount: number | undefined): number {
  const outputCap = Math.floor(model.maxOutputTokens * CHUNK_OUTPUT_SAFETY);
  const reserve = Math.min(
    outputCap,
    maxCount !== undefined ? maxCount * EST_TOKENS_PER_ITEM : outputCap,
  );
  return Math.min(
    model.contextWindow -
      TYPICAL_SYSTEM_TOKENS -
      CHUNK_CONTEXT_MARGIN_TOKENS -
      reserve,
    CHUNK_TARGET_INPUT_TOKENS,
  );
}

const tokensOf = (chars: number) => Math.ceil(chars / CHARS_PER_TOKEN);

/** Greedy, in outline order — the backend's `planSectionChunks`, counting calls only. */
function packCount(sizes: number[], limitTokens: number): number {
  let calls = 0;
  let current = 0;
  for (const size of sizes) {
    if (calls > 0 && tokensOf(current + size) <= limitTokens) {
      current += size;
    } else {
      calls += 1;
      current = size;
    }
  }
  return calls;
}

/**
 * The backend's pre-flight on `generate-sets`, run on the chosen sections and model so
 * the dialog can say what the click will do before it is made.
 *
 * Source text no longer has to fit one call: sections are packed into calls by token
 * budget and run one after another. What can still be refused is a single section over
 * the budget (never split — a question's `sectionAnchor` would lose its boundary), a
 * model with no room left for sources, and a question count that needs more calls than
 * there are sections to spread across (a call writes `maxOutputTokens / 400` questions).
 */
export function checkRunFit({
  entries,
  anchors,
  maxCount,
  model,
}: {
  entries: QaOutlineEntry[];
  anchors: string[];
  /** Left out when the run has no upper bound. */
  maxCount?: number;
  model: AiModel;
}): RunFit {
  const picked = entries.filter((entry) => anchors.includes(entry.anchor));
  const capacity = Math.max(
    1,
    Math.floor(
      (model.maxOutputTokens * CHUNK_OUTPUT_SAFETY) / EST_TOKENS_PER_ITEM,
    ),
  );
  const budget = qaChunkBudget(
    model,
    maxCount === undefined ? undefined : Math.min(maxCount, capacity),
  );
  if (budget < MIN_CHUNK_TOKENS) {
    return { ok: false, reason: "model", model: model.label };
  }

  const sizes = picked.map((entry) => entry.charCount + entry.title.length);
  const tooLong = picked.find(
    (entry, index) => tokensOf(sizes[index]) > budget,
  );
  if (tooLong) {
    return {
      ok: false,
      reason: "section",
      title: tooLong.title,
      tokens: tokensOf(sizes[picked.indexOf(tooLong)]),
      budget,
      model: model.label,
    };
  }

  const minCalls = maxCount === undefined ? 1 : Math.ceil(maxCount / capacity);
  let limit = budget;
  let calls = packCount(sizes, limit);
  while (calls < minCalls && calls < picked.length) {
    limit = Math.floor(limit * 0.8);
    calls = packCount(sizes, limit);
  }
  if (calls < minCalls) {
    return {
      ok: false,
      reason: "output",
      capacity,
      maxCount: maxCount ?? 0,
      calls: minCalls,
      sections: picked.length,
      model: model.label,
    };
  }
  return { ok: true, calls };
}

/**
 * Input tokens one chunk of an outline run may carry on this model — the backend's
 * `chunkBudgetTokens`, so the dialog can say "this will be split" before the click.
 * `system` is unknown here (it depends on the prompt picked), so it is a typical
 * size; the backend recomputes the exact figure and its answer wins.
 */
export function outlineChunkBudget(model: AiModel): number {
  const byContext = Math.floor(
    (model.contextWindow -
      TYPICAL_SYSTEM_TOKENS -
      CHUNK_CONTEXT_MARGIN_TOKENS) /
      (1 + OUTLINE_OUTPUT_RATIO),
  );
  const byOutput = Math.floor(
    (model.maxOutputTokens * CHUNK_OUTPUT_SAFETY) / OUTLINE_OUTPUT_RATIO,
  );
  return Math.min(byContext, byOutput, CHUNK_TARGET_INPUT_TOKENS);
}
