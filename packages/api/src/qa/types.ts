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

/** Mirrors the backend enum — see the note on `aiProviderNameSchema`. */
export type AiProviderName = "openrouter" | "openai" | "anthropic" | "vilao";

/** `AiModelDto` — a row of the backend's `ai_models` table. */
export type AiModel = {
  id: string;
  provider: AiProviderName;
  /** The provider's own id for the model — what the API call sends. */
  name: string;
  label: string;
  contextWindow: number;
  maxOutputTokens: number;
  /**
   * A model without this cannot be forced into a JSON schema. Picking one is
   * rejected **before the call**, so the UI disables it with the reason rather
   * than hiding it — hidden, the user goes looking for their model.
   */
  supportsStructuredOutput: boolean;
  /** Off ⇒ cannot be assigned to a key, and keys on it stop running. */
  enabled: boolean;
};

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
  modelId: string;
  /** The model this key runs; generate calls pick the key, never the model. */
  model: AiModel;
  enabled: boolean;
  /** Used when a generate call names no key. Exactly one row may hold it. */
  isDefault: boolean;
  /** Tokens per calendar month, UTC. `null` means unlimited. */
  monthlyTokenLimit: number | null;
  /**
   * At least one generation ran on this key. `false` ⇒ it can be deleted for
   * good; `true` ⇒ only disabled, so the history keeps which key ran.
   */
  inUse: boolean;
  createdAt: string;
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

/**
 * `QaDatasetSourceFullDto` — the read-one shape. `content` is only ever fetched
 * for the one row someone opened, never for the list.
 */
export type QaDatasetSourceFull = QaDatasetSource & {
  content: string | null;
  datasetId: string;
};

/* -------------------------------- templates -------------------------------- */

export type QaPromptKind = "outline" | "qa";

/** Must match a shape in the backend registry when `kind === "qa"`. */
export type QaTemplateKey =
  | "multiple_choice"
  | "single_choice"
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
  /** Not in the OpenAPI DTO yet — present only once the backend sends it. */
  createdAt?: string;
  updatedAt: string;
};

/** Variables the template may use. The three source ones are **not** here. */
export const PROMPT_VARIABLES = [
  "count",
  "minCount",
  "maxCount",
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
  "queued" | "running" | "succeeded" | "partial" | "failed";

/** What is still running on a dataset — survives a reload, unlike the page's own state. */
export type QaActiveGenerations = {
  outline: QaGeneration | null;
  qa: QaGeneration | null;
};

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
  /** Chunks of an `outline` run, and how many are done. `null` = a single call. */
  chunkTotal: number | null;
  chunkDone: number | null;
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

/* --------------------------------- chunking -------------------------------- */

/** `auto` detects; `ai` asks the model for cut points (billed, cannot be previewed). */
export type ChunkMode = "auto" | "source" | "heading" | "pattern" | "size" | "ai";

/** `QaChunkPreviewDto` — what an analyze call would do, computed without the model. */
export type QaChunkPreview = {
  strategy: string;
  note: string | null;
  budgetTokens: number;
  totalTokens: number;
  chunks: {
    position: number;
    title: string | null;
    /** The first ~120 characters — enough to see where the chunk starts. */
    startsWith: string;
    charCount: number;
    tokensEstimate: number;
  }[];
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

/**
 * How a content column is stored: Tiptap JSON (`BlogDoc`) or a markdown
 * string. Explicit rather than sniffed from `typeof content` — it is what picks
 * the editor and the renderer, and the backend 400s a mismatched pair.
 */
export type QaContentFormat = "doc" | "markdown";

export type QaOutlineSummary = {
  id: string;
  version: number;
  label: string | null;
  sectionCount: number;
  contentFormat: QaContentFormat;
  isCurrent: boolean;
  /** `null` = typed by hand, not produced by a model. */
  generationId: string | null;
  createdAt: string;
};

/** `content` and `contentFormat` travel as a pair — narrow on the format. */
export type QaOutlineContent =
  | { contentFormat: "doc"; content: BlogDoc }
  | { contentFormat: "markdown"; content: string };

export type QaOutline = QaOutlineSummary &
  QaOutlineContent & {
    /** Derived from `content` on every write. Read-only — the backend recomputes it. */
    outline: QaOutlineEntry[];
  };

/** Chỉ nội dung. Đổi nhãn đi route riêng (`updateOutlineLabel`). */
export type UpdateQaOutlineInput = QaOutlineContent;

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
  /** Dataset of the set holding this question — always equals the set's `datasetId`. */
  datasetId: string;
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
  /**
   * Tag ids on the question. How a tag is drawn comes from the tag's own `meta`,
   * never from the question text — `question` carries no marker.
   */
  tagIds: string[];
  /** Whether learners see this question (once its set is published). */
  published: boolean;
  /** The reviewer's verdict on an AI-drafted question. */
  reviewStatus: QaReviewStatus;
  /** The draft this question was copied from, for a question in a final set. */
  sourceItemId: string | null;
};

export type QaReviewStatus = "pending" | "approved" | "rejected";

export type QaSet = {
  id: string;
  datasetId: string;
  outlineId: string | null;
  sectionAnchor: string | null;
  /** The section title as it read when the set was generated. */
  sectionTitle: string | null;
  templateId: string;
  /** The set's shape (one registry key), not the prompt's — a prompt can make several. */
  questionType: string;
  /** `null` = written by hand. */
  generationId: string | null;
  title: string;
  description: string | null;
  intro: BlogDoc | null;
  difficulty: QaDifficulty | null;
  /** A generated set is ALWAYS `draft` — the model never publishes. */
  status: QaSetStatus;
  itemCount: number;
  /** A final set: copies of approved questions — the only sets learners see. */
  isFinal: boolean;
  /** How many of its questions are approved. */
  approvedCount: number;
  /** Optimistic lock. Send it back on every write or you get a 409. */
  version: number;
  publishedAt: string | null;
  createdAt: string;
  /** Absent from a backend that predates the field: fall back to `createdAt`. */
  updatedAt?: string;
};

export type QaSetDetail = QaSet & { items: QaItemFull[] };

/** A search hit: the question plus the shape (template key) of its set. */
export type QaItemSearchRow = QaItemFull & { type: string };

/**
 * One entry of the question-type catalogue. `key` is fixed by the backend (it
 * matches a shape in its registry); `label`, `description` and `position` are
 * editable. `total` / `published` count the questions of that type.
 */
export type QaQuestionType = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  position: number;
  total: number;
  published: number;
};

export type UpdateQuestionTypeInput = {
  label?: string;
  description?: string | null;
  position?: number;
  /** Publishes or hides every question of the type in one go. */
  published?: boolean;
};

/** A question on the Final set step: already copied in, or approved and waiting. */
export type QaFinalEntry = {
  item: QaItemFull;
  state: "added" | "new";
  /** The question's shape, e.g. `multiple_choice`. */
  templateKey: string;
};

export type QaFinalGroup = {
  sectionAnchor: string | null;
  sectionTitle: string | null;
  inFinalSet: boolean;
  entries: QaFinalEntry[];
};

export type QaFinalOverview = {
  approved: number;
  added: number;
  groups: QaFinalGroup[];
};

export type UpdateSourceInput = { title?: string | null; content?: string };

export type QaItemList = { items: QaItemSearchRow[]; total: number };

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
  /** Question shape — a template key such as `multiple_choice`. */
  type?: string;
  published?: boolean;
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
  /** Tag ids shown on the question — look them up with `usePlayItemTags`. */
  tagIds: string[];
  /**
   * Which input to render. Not inferable from `options`: a flashcard has none
   * either, yet it needs two buttons rather than a text box. It lives on the
   * item because a dataset mixes shapes.
   */
  templateKey: QaTemplateKey;
};

/**
 * What a learner takes: a dataset's **published** questions, as one bank. Sets
 * and outlines are admin plumbing and never reach this side.
 */
export type QaDatasetPlay = {
  id: string;
  title: string;
  description: string | null;
  /** The denominator of progress: the published questions in the bank. */
  itemCount: number;
  items: QaItemPlay[];
};

/** A dataset with at least one published question — the learner's catalogue entry. */
export type QaDatasetSummary = {
  id: string;
  title: string;
  description: string | null;
  /** Published questions only; never the draft count. */
  itemCount: number;
  /** The kinds present IN the bank — for "I want to drill application questions". */
  itemKinds: QaItemKind[];
  /** The shapes present in the bank (one dataset mixes several). */
  templateKeys: QaTemplateKey[];
  /** The difficulties present in the bank. */
  difficulties: QaDifficulty[];
  /** Your own open attempt. Present means the button says "Continue". */
  openAttemptId: string | null;
  updatedAt: string | null;
};

/** How many questions a learner can pick before starting; "all" is the fourth option. */
export const QA_COUNT_OPTIONS = [5, 10, 20] as const;

/** An attempt with its own questions (answers hidden) — what the taking screen renders. */
export type QaAttemptPlay = {
  attempt: QaAttempt;
  datasetTitle: string;
  items: QaItemPlay[];
};

export type QaAttemptStatus = "in_progress" | "finished" | "abandoned";

export type QaAttempt = {
  id: string;
  datasetId: string;
  /**
   * The denominator of progress: how many questions this attempt has, fixed when it
   * started (the learner picks 5 / 10 / 20 / all). Not the dataset's current count.
   */
  itemCount: number;
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
  { optionIds: string[] } | { text: string } | { known: boolean };

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
  /** Tag ids on the question, as on `QaItemPlay`. */
  tagIds: string[];
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

export type BrowseItemsQuery = {
  kind?: QaItemKind;
  datasetId?: string;
  /** Your latest answer for each question was wrong. */
  wrongOnly?: boolean;
  limit?: number;
  offset?: number;
};

/* ------------------------------- Item tags ------------------------------- */

/** Theme token names (`text-danger`…), never colour values — dark mode follows. */
export const QA_TAG_TONES = ["danger", "warning", "success", "primary"] as const;
export type QaTagTone = (typeof QA_TAG_TONES)[number];

/** `QaItemTagDto` — a row of the backend's `qa_item_tags` catalogue. */
export type QaItemTag = {
  id: string;
  /** The name the prompt gives the AI. Renamable; items reference the tag by `id`. */
  key: string;
  /** The definition the AI is given: when to attach this tag. */
  description: string;
  meta: {
    /** A lucide icon, `lucide:name` — the only set the UI bundles. */
    icon: string;
    tone: string;
    label: Record<string, string>;
  };
  /** Off ⇒ the AI stops attaching it; items already tagged keep the id. */
  active: boolean;
};

/** `QaItemTagPlayDto` — a tag as a learner sees it (no `description`). */
export type QaItemTagPlay = Pick<QaItemTag, "id" | "key" | "meta">;
