import type { BlogDoc } from "../blog/types";

/**
 * A mirror of the DTOs in the OpenAPI spec (`/docs`, tags `admin` and `qa`).
 * A change here must come with a change to the zod schemas in `./schemas.ts`.
 *
 * The rich-text columns reuse `BlogDoc`: both features write the same
 * ProseMirror shape through the same backend sanitizer
 * (`src/common/rich-content/rich-doc.ts`), so a second near-identical type
 * would be a second place to forget h4 or tables.
 */

/* ------------------------------ AI credentials ----------------------------- */

export type AiProviderName = "openrouter";

/**
 * `AiCredentialDto`. There is no field carrying the key — not an omission: the
 * backend has no "show the key" endpoint at all. Lose it and you rotate.
 */
export type AiCredential = {
  id: string;
  provider: AiProviderName;
  label: string;
  /** The last four characters, in the clear — enough to recognise which key. */
  keyLast4: string;
  defaultModel: string;
  enabled: boolean;
  /** Used when a generate call names no key. Exactly one row may hold it. */
  isDefault: boolean;
  /** Tokens per calendar month, UTC. `null` means unlimited. */
  monthlyTokenLimit: number | null;
  createdAt: string;
};

/** `AiModelDto` — from the backend's registry (code), never from a table. */
export type AiModel = {
  id: string;
  provider: AiProviderName;
  label: string;
  contextWindow: number;
  maxOutputTokens: number;
  /**
   * A model without this cannot be forced into a JSON schema. Picking one is
   * rejected **before the call**, so the UI disables it with the reason rather
   * than hiding it — hidden, the user goes looking for their model.
   */
  supportsStructuredOutput: boolean;
};

/* --------------------------------- datasets -------------------------------- */

/**
 * The **furthest stage reached**, not the current state, and it only moves
 * forward: deleting the last source does not push `outlined` back to `ready`.
 * Use it for display and filtering only — every real precondition is checked
 * against the actual rows by the backend.
 */
export type QaDatasetStatus = "draft" | "ready" | "outlined" | "archived";

export type QaDataset = {
  id: string;
  title: string;
  description: string | null;
  language: string;
  status: QaDatasetStatus;
  ownerId: string;
  sourceCharCount: number;
  /** Past this, the analyze call risks hitting the model's output ceiling. */
  sourceCharWarning: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Only `text` in this pass. `file` is a later phase; `url` was dropped for SSRF. */
export type QaSourceKind = "text";

/** `QaDatasetSourceDto` — deliberately without `content` (a chapter is hundreds of KB). */
export type QaDatasetSource = {
  id: string;
  kind: QaSourceKind;
  title: string | null;
  charCount: number;
  order: number;
  createdAt: string;
};

/* -------------------------------- templates -------------------------------- */

export type QaPromptKind = "outline" | "qa";

/** Must match a shape in the backend registry when `kind === "qa"`. */
export type QaTemplateKey =
  | "multiple_choice"
  | "true_false"
  | "short_answer"
  | "fill_blank"
  | "flashcard";

export type QaPromptDefaults = {
  count?: number;
  difficulty?: string;
  effort?: string;
  itemKinds?: string[];
};

export type QaPromptTemplate = {
  id: string;
  kind: QaPromptKind;
  key: string;
  name: string;
  description: string | null;
  /**
   * The prompt as written. It becomes the `system` half of the call — the half
   * that must stay byte-identical between runs for prefix caching to hit, which
   * is why the three source variables are rejected at write time.
   */
  prompt: string;
  defaults: QaPromptDefaults | null;
  enabled: boolean;
  order: number;
  updatedAt: string;
};

/** Variables the template may use. The three source ones are **not** here. */
export const PROMPT_VARIABLES = [
  "count",
  "language",
  "difficulty",
  "itemKinds",
] as const;

/**
 * Variables that carry the SOURCE. The backend answers 400 when one appears in
 * a prompt: source travels in the `user` half, and putting it in the middle of
 * the instructions means the cacheable prefix never repeats — a failure with no
 * error, visible only on the invoice.
 */
export const FORBIDDEN_PROMPT_VARIABLES = [
  "sourceText",
  "outline",
  "topic",
] as const;

/* ------------------------------- generations ------------------------------- */

/**
 * `partial` is a **third outcome**, not a shade of success: the model returned
 * valid JSON while silently dropping whole sections. Treating it as `succeeded`
 * closes the only window there is onto that.
 */
export type QaGenerationStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "partial"
  | "failed";

export type QaGeneration = {
  id: string;
  status: QaGenerationStatus;
  kind: QaPromptKind;
  datasetId: string;
  outlineId: string | null;
  model: string;
  provider: string;
  /** Verbatim copy of the prompt AT RUN TIME — it may differ from the template now. */
  promptSnapshot: string;
  error: string | null;
  /**
   * `{ anchor: reason }` for a section that was sent and came back empty or
   * invalid. `null` means every section produced something.
   *
   * This is the only window onto the failure mode that produces no error at
   * all: the model returns valid JSON with three chapters quietly missing.
   */
  sectionErrors: Record<string, string> | null;
  resultCount: number;
  inputTokens: number | null;
  outputTokens: number | null;
  /** Tokens read from cache (~0.1× price). The only way to tell caching works. */
  cacheReadInputTokens: number | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
};

export type StartGenerationResponse = {
  generationId: string;
  /** `true` = a run with these exact parameters was already going; this is it. */
  reused: boolean;
};

/* --------------------------------- outlines -------------------------------- */

/** One entry of the flat index the backend derives from the headings. */
export type QaOutlineEntry = {
  /** Also the heading's `id` when rendered. The frontend never generates this. */
  anchor: string;
  level: 2 | 3 | 4;
  title: string;
  order: number;
  charCount: number;
};

export type QaOutlineSummary = {
  id: string;
  version: number;
  label: string | null;
  sectionCount: number;
  isCurrent: boolean;
  /** `null` = typed by hand, not produced by a model. */
  generationId: string | null;
  createdAt: string;
};

export type QaOutline = QaOutlineSummary & {
  content: BlogDoc;
  /** Derived from `content` on every write. Read-only — the backend recomputes it. */
  outline: QaOutlineEntry[];
};

export type QaOutlineList = {
  items: QaOutlineSummary[];
  versionCount: number;
  /** A warning, never a block: run 21 may be the one that gets it right. */
  versionWarning: boolean;
};

/* ----------------------------------- sets ---------------------------------- */

export type QaSetStatus = "draft" | "published" | "archived";
export type QaDifficulty = "easy" | "medium" | "hard";

/** What competence a question tests — a second axis, crossing every shape. */
export type QaItemKind = "theory" | "practice" | "recall" | "analysis";

export type QaItemOption = { id: string; text: string };

/** Machine-gradable answer. Split from `answer`, which is for a human to read. */
export type QaAnswerKey = { optionIds: string[] } | { accepted: string[] };

/**
 * The admin view of a question, **answers included**. `QaItemPlay` is a
 * separate type, not this one filtered — see the note there.
 */
export type QaItemFull = {
  id: string;
  setId: string;
  order: number;
  kind: QaItemKind;
  question: BlogDoc;
  /** `{ id, text }` only. There is no `correct` flag; `answerKey` owns that. */
  options: QaItemOption[] | null;
  answer: BlogDoc | null;
  answerKey: QaAnswerKey | null;
  explanation: BlogDoc | null;
  sectionAnchor: string | null;
  difficulty: QaDifficulty | null;
};

export type QaSet = {
  id: string;
  datasetId: string;
  outlineId: string | null;
  sectionAnchor: string | null;
  /** The section title as it read when the set was generated. */
  sectionTitle: string | null;
  templateId: string;
  /** `null` = written by hand. */
  generationId: string | null;
  title: string;
  description: string | null;
  intro: BlogDoc | null;
  difficulty: QaDifficulty | null;
  /** A generated set is ALWAYS `draft` — the model never publishes. */
  status: QaSetStatus;
  itemCount: number;
  /** Optimistic lock. Send it back on every write or you get a 409. */
  version: number;
  publishedAt: string | null;
  createdAt: string;
};

export type QaSetDetail = QaSet & { items: QaItemFull[] };

export type QaItemList = { items: QaItemFull[]; total: number };

/* --------------------------------- queries --------------------------------- */

export type QaSetsQuery = {
  datasetId?: string;
  outlineId?: string;
  sectionAnchor?: string;
  status?: QaSetStatus;
};

export type QaItemsQuery = {
  /** At least 3 characters — below that the backend answers 400 (trigram index). */
  q?: string;
  datasetId?: string;
  kind?: QaItemKind;
  limit?: number;
  offset?: number;
};

/* ------------------------------ learner surface ---------------------------- */

/**
 * What a question looks like to a **learner**. A separate type, not
 * `QaItemFull` with fields removed: the protection is that this one has no
 * field to forget to strip. Answers appear in exactly two places — the response
 * to submitting one, and the review of an attempt already taken.
 */
export type QaItemPlay = {
  id: string;
  order: number;
  kind: QaItemKind;
  question: BlogDoc;
  /** `{ id, text }` only. Nothing here says which one is right. */
  options: QaItemOption[] | null;
  difficulty: QaDifficulty | null;
};

export type QaSetPlay = {
  id: string;
  title: string;
  description: string | null;
  intro: BlogDoc | null;
  difficulty: QaDifficulty | null;
  /** The denominator of progress. Read from the set, not a snapshot. */
  itemCount: number;
  /**
   * Which input to render. Not inferable from `options`: a flashcard has none
   * either, yet it needs two buttons rather than a text box.
   */
  templateKey: QaTemplateKey;
  items: QaItemPlay[];
};

export type QaSetSummary = {
  id: string;
  title: string;
  description: string | null;
  difficulty: QaDifficulty | null;
  itemCount: number;
  templateKey: QaTemplateKey;
  /** The kinds present IN the set — for "I want to drill application questions". */
  itemKinds: QaItemKind[];
  /** Your own open attempt. Present means the button says "Continue". */
  openAttemptId: string | null;
  publishedAt: string | null;
};

export type QaAttemptStatus = "in_progress" | "finished" | "abandoned";

export type QaAttempt = {
  id: string;
  setId: string;
  status: QaAttemptStatus;
  /** Counts what HAPPENED. Never decremented, even if a question is deleted. */
  answeredCount: number;
  correctCount: number;
  startedAt: string;
  finishedAt: string | null;
};

/** `auto` = the machine matched an answer key; `self` = you told it (flashcards). */
export type QaGradingMode = "auto" | "self";

export type QaResponse =
  | { optionIds: string[] }
  | { text: string }
  | { known: boolean };

export type QaAnswerResult = {
  isCorrect: boolean;
  grading: QaGradingMode;
  answer: BlogDoc | null;
  explanation: BlogDoc | null;
  attempt: QaAttempt;
};

/** One answered question in the review of a past attempt. */
export type QaAnswerReview = {
  itemId: string;
  kind: QaItemKind;
  question: BlogDoc;
  options: QaItemOption[] | null;
  response: QaResponse;
  isCorrect: boolean;
  grading: QaGradingMode;
  answer: BlogDoc | null;
  explanation: BlogDoc | null;
  answeredAt: string;
};

export type QaStatsRow = {
  grading: QaGradingMode;
  kind: QaItemKind;
  answered: number;
  correct: number;
};

export type BrowseSetsQuery = {
  datasetId?: string;
  limit?: number;
  offset?: number;
};

export type BrowseItemsQuery = {
  kind?: QaItemKind;
  datasetId?: string;
  /** Your latest answer for each question was wrong. */
  wrongOnly?: boolean;
  limit?: number;
  offset?: number;
};
