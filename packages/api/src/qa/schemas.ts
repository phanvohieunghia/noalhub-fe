import {z} from 'zod'

import {sanitizeBlogDoc} from '../blog/schemas'
import {FORBIDDEN_PROMPT_VARIABLES, QA_TAG_TONES} from './types'

/**
 * Response schemas validate what the backend sent; input schemas are shared by
 * the react-hook-form resolvers and the api layer, so a field cannot be
 * validated one way in the form and another on the wire.
 */

/**
 * Rich text goes through the same sanitizer as blog content. `transform`
 * rather than a strict object: an unknown node must be dropped, not blow up the
 * page — the backend already made that choice, and disagreeing here would mean
 * the editor shows something the server will not keep.
 */
const richDoc = z.unknown().transform((value) => sanitizeBlogDoc(value))

/** The backend answers `null` for absent values, but tolerate `undefined` too. */
const nullableString = z
  .string()
  .nullish()
  .transform((v) => v ?? null)

const nullableNumber = z
  .number()
  .nullish()
  .transform((v) => v ?? null)

/* ------------------------------ AI credentials ----------------------------- */

/**
 * Mirrors the backend `AiProviderName` enum (`src/ai/entities/ai-credential.entity.ts`).
 *
 * Every value the backend can emit must be here. `/admin/ai/models`
 * returns the WHOLE catalogue in one array, so a single unknown `provider`
 * fails `aiModelListSchema` and the model dropdown comes back empty for every
 * provider — the symptom reads as "the models endpoint is broken", not as a
 * missing enum member. Adding a provider on the backend means adding it here in
 * the same change.
 */
export const aiProviderNameSchema = z.enum([
  'openrouter',
  'openai',
  'anthropic',
  /** An OpenAI-compatible gateway, not a model vendor. */
  'vilao',
])

export const aiModelSchema = z.object({
  id: z.string(),
  provider: aiProviderNameSchema,
  /** The provider's own id for the model — what the API call sends. */
  name: z.string(),
  label: z.string(),
  contextWindow: z.number(),
  maxOutputTokens: z.number(),
  supportsStructuredOutput: z.boolean(),
  /** A disabled model cannot be assigned, and keys already on it stop running. */
  enabled: z.boolean(),
})

export const aiModelListSchema = z.array(aiModelSchema)

export const aiCredentialSchema = z.object({
  id: z.string(),
  provider: aiProviderNameSchema,
  label: z.string(),
  keyLast4: z.string(),
  modelId: z.string(),
  /** The model this key runs. Generate calls pick the key, never the model. */
  model: aiModelSchema,
  enabled: z.boolean(),
  isDefault: z.boolean(),
  monthlyTokenLimit: nullableNumber,
  /** At least one generation ran on this key — only disabling is left then. */
  inUse: z.boolean(),
  createdAt: z.string(),
})

export const aiCredentialListSchema = z.array(aiCredentialSchema)

export const createCredentialSchema = z.object({
  provider: aiProviderNameSchema,
  label: z.string().min(1).max(120),
  /** Accepted ONCE. There is no endpoint that reads it back. */
  apiKey: z.string().min(8).max(400),
  modelId: z.string().uuid(),
  isDefault: z.boolean().optional(),
  monthlyTokenLimit: z.number().int().min(1).nullable().optional(),
})

export const updateCredentialSchema = createCredentialSchema
  .partial()
  // `provider` is missing on purpose: the stored ciphertext belongs to exactly
  // one vendor, so switching it means creating a new credential.
  .omit({provider: true})
  .extend({enabled: z.boolean().optional()})

export const createModelSchema = z.object({
  provider: aiProviderNameSchema,
  /** The provider's own id; the same model via two providers is two rows. */
  name: z.string().min(1).max(64),
  label: z.string().min(1).max(120),
  contextWindow: z.number().int().min(1),
  /** Must not exceed `contextWindow` — the form checks, the backend enforces. */
  maxOutputTokens: z.number().int().min(1),
  supportsStructuredOutput: z.boolean().optional(),
  enabled: z.boolean().optional(),
})

// `provider` and `name` are fixed: changing either is a different model.
export const updateModelSchema = z.object({
  label: z.string().min(1).max(120).optional(),
  contextWindow: z.number().int().min(1).optional(),
  maxOutputTokens: z.number().int().min(1).optional(),
  supportsStructuredOutput: z.boolean().optional(),
  enabled: z.boolean().optional(),
})

export type CreateModelInput = z.infer<typeof createModelSchema>
export type UpdateModelInput = z.infer<typeof updateModelSchema>
export type CreateCredentialInput = z.infer<typeof createCredentialSchema>
export type UpdateCredentialInput = z.infer<typeof updateCredentialSchema>

/* -------------------------------- templates -------------------------------- */

/**
 * The same rule the backend enforces, checked here so the author finds out
 * while writing rather than after composing a long prompt.
 */
export function findSourceVariables(prompt: string): string[] {
  return FORBIDDEN_PROMPT_VARIABLES.filter((name) =>
    prompt.includes(`{{${name}}}`),
  )
}

export const qaPromptDefaultsSchema = z.object({
  count: z.number().int().min(1).optional(),
  difficulty: z.string().max(32).optional(),
  effort: z.string().max(32).optional(),
  itemKinds: z.array(z.string().max(32)).optional(),
})

/**
 * Question shapes, in registry order — `TEMPLATES` in the backend's `qa-templates.ts`.
 * Picked when a run starts, not stored on the prompt: each pick pulls that shape's
 * own rules into the prompt, and the model chooses a shape per question.
 */
export const QA_TEMPLATE_KEYS = [
  'multiple_choice',
  'single_choice',
  'true_false',
  'short_answer',
  'fill_blank',
  'flashcard',
] as const

const questionTypesField = z.array(z.enum(QA_TEMPLATE_KEYS)).min(1)

export const qaTemplateSchema = z.object({
  id: z.string(),
  kind: z.enum(['outline', 'qa']),
  key: z.string(),
  name: z.string(),
  description: nullableString,
  prompt: z.string(),
  defaults: qaPromptDefaultsSchema.nullish().transform((v) => v ?? null),
  enabled: z.boolean(),
  order: z.number(),
  // Not in the OpenAPI DTO yet: read when the backend sends it, so the list can
  // be ordered by creation date; absent until then.
  createdAt: z.string().optional(),
  updatedAt: z.string(),
})

export const qaTemplateListSchema = z.array(qaTemplateSchema)

/** `MAX_ITEMS_PER_SET` on the backend. Kept here so the form can clamp too. */
export const MAX_ITEMS_PER_SET = 50

/**
 * `MAX_RUN_ITEMS` on the backend: a sanity bound on a run's question count. The real
 * ceiling is the chosen model's output limit, checked in `qa-run-fit.ts`.
 */
export const MAX_RUN_ITEMS = 1000

/**
 * Mirrors of `EST_TOKENS_PER_ITEM` and `CHARS_PER_TOKEN` on the backend. Together
 * with a model's `contextWindow` / `maxOutputTokens` they let the generate dialog
 * refuse a run before the click instead of after the 400. Estimates lean towards
 * blocking early — Vietnamese tokenizes badly.
 */
export const EST_TOKENS_PER_ITEM = 400
export const CHARS_PER_TOKEN = 3.5

const promptField = z
  .string()
  .min(1)
  .refine((value) => findSourceVariables(value).length === 0, {
    message: 'prompt.sourceVariable',
  })

export const createTemplateSchema = z.object({
  kind: z.enum(['outline', 'qa']),
  /** Omit it on a `qa` prompt: the server derives one from the name. */
  key: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9_]+$/, 'template.keyFormat')
    .optional(),
  name: z.string().min(1).max(120),
  description: z.string().max(320).nullable().optional(),
  prompt: promptField,
  defaults: qaPromptDefaultsSchema
    .extend({
      count: z.number().int().min(1).max(MAX_ITEMS_PER_SET).optional(),
    })
    .nullable()
    .optional(),
  order: z.number().int().min(0).optional(),
})

/** `kind` and `key` are absent: both are a contract with every item already generated. */
export const updateTemplateSchema = createTemplateSchema
  .omit({kind: true, key: true})
  .partial()
  .extend({enabled: z.boolean().optional()})

/** Duplicate asks only for what must differ; `key` can be left out on a `qa` prompt. */
export const duplicateTemplateSchema = createTemplateSchema.pick({
  key: true,
  name: true,
})

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>
export type DuplicateTemplateInput = z.infer<typeof duplicateTemplateSchema>

/* --------------------------------- datasets -------------------------------- */

export const qaDatasetSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: nullableString,
  language: z.string(),
  status: z.enum(['draft', 'ready', 'outlined', 'archived']),
  ownerId: z.string(),
  sourceCharCount: z.number(),
  sourceCharWarning: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const qaDatasetListSchema = z.array(qaDatasetSchema)

export const qaSourceSchema = z.object({
  id: z.string(),
  kind: z.enum(['text']),
  title: nullableString,
  charCount: z.number(),
  order: z.number(),
  createdAt: z.string(),
})

export const qaSourceListSchema = z.array(qaSourceSchema)

/** The read-one shape: the same row plus the text that was pasted. */
export const qaSourceFullSchema = qaSourceSchema.extend({
  content: nullableString,
  datasetId: z.string(),
})

export const createDatasetSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  language: z.string().max(8).optional(),
})

export const updateDatasetSchema = createDatasetSchema
  .partial()
  .extend({archived: z.boolean().optional()})

/** `MAX_SOURCE_CHARS` on the backend — the form stops the paste before the 400. */
export const MAX_SOURCE_CHARS = 400_000

export const addSourceSchema = z.object({
  kind: z.literal('text'),
  title: z.string().max(200).nullable().optional(),
  content: z.string().min(1).max(MAX_SOURCE_CHARS),
  order: z.number().int().min(0).optional(),
})

export type CreateDatasetInput = z.infer<typeof createDatasetSchema>
export type UpdateDatasetInput = z.infer<typeof updateDatasetSchema>
export type AddSourceInput = z.infer<typeof addSourceSchema>

/* ------------------------------- generations ------------------------------- */

export const qaGenerationSchema = z.object({
  id: z.string(),
  status: z.enum(['queued', 'running', 'succeeded', 'partial', 'failed']),
  kind: z.enum(['outline', 'qa']),
  datasetId: z.string(),
  outlineId: nullableString,
  model: z.string(),
  provider: z.string(),
  promptSnapshot: z.string(),
  error: nullableString,
  sectionErrors: z
    .record(z.string(), z.string())
    .nullish()
    .transform((v) => v ?? null),
  resultCount: z.number(),
  /** Chunks of an `outline` run; `null` = one call (older run, or a `qa` run). */
  chunkTotal: nullableNumber,
  chunkDone: nullableNumber,
  inputTokens: nullableNumber,
  outputTokens: nullableNumber,
  cacheReadInputTokens: nullableNumber,
  startedAt: nullableString,
  finishedAt: nullableString,
  createdAt: z.string(),
})

/** The running (`queued`/`running`) run of each kind, or `null`. */
export const qaActiveGenerationsSchema = z.object({
  outline: qaGenerationSchema.nullable(),
  qa: qaGenerationSchema.nullable(),
})

export const startGenerationSchema = z.object({
  generationId: z.string(),
  reused: z.boolean(),
})

/**
 * `credentialId` is required on both billed calls: the backend no longer falls
 * back to the `isDefault` key, so the person clicking picks the key. The model
 * is not sent — it is whatever model the key is assigned.
 */
const aiRunFields = {
  credentialId: z.string().uuid(),
}

/**
 * How a long source is cut into chunks (chặng ②). Mirrors the backend constants in
 * `src/qa/qa-limits.ts` / `src/qa/qa-chunking.ts`; the backend is the authority and
 * these only let the form stop a bad value before the 400.
 */
export const CHUNK_MODES = [
  'auto',
  'source',
  'heading',
  'pattern',
  'size',
  'ai',
] as const
export const chunkModeSchema = z.enum(CHUNK_MODES)

/** `CHUNK_TARGET_INPUT_TOKENS` — the soft ceiling on one chunk's input. */
export const CHUNK_TARGET_INPUT_TOKENS = 24_000
/** `MIN_CHUNK_TOKENS` — a smaller `maxChunkTokens` is refused. */
export const MIN_CHUNK_TOKENS = 1_500
export const CHUNK_OVERLAP_MAX = 3
export const CHUNK_PATTERN_MAX_LENGTH = 100
/** `OUTLINE_OUTPUT_RATIO` and `CHUNK_OUTPUT_SAFETY` / `CHUNK_CONTEXT_MARGIN_TOKENS`. */
export const OUTLINE_OUTPUT_RATIO = 0.9
export const CHUNK_OUTPUT_SAFETY = 0.8
export const CHUNK_CONTEXT_MARGIN_TOKENS = 4_000

/**
 * Only what the chosen mode uses is sent: the backend answers 400
 * `QA_CHUNK_OPTIONS_INVALID` for `pattern` outside `pattern` mode (and likewise
 * `headingLevel`), rather than silently ignoring it.
 */
const chunkFields = {
  chunkMode: chunkModeSchema.optional(),
  headingLevel: z.number().int().min(1).max(4).optional(),
  pattern: z.string().min(1).max(CHUNK_PATTERN_MAX_LENGTH).optional(),
  maxChunkTokens: z
    .number()
    .int()
    .min(MIN_CHUNK_TOKENS)
    .max(200_000)
    .optional(),
  overlapParagraphs: z.number().int().min(0).max(CHUNK_OVERLAP_MAX).optional(),
}

export const startAnalyzeSchema = z.object({
  templateId: z.string().uuid(),
  ...aiRunFields,
  label: z.string().max(120).optional(),
  /** Omitted = every source of the dataset. */
  sourceIds: z.array(z.string().uuid()).min(1).optional(),
  ...chunkFields,
})

/** Same body as `analyze`: the preview shows exactly what that call would do. */
export const previewChunksSchema = startAnalyzeSchema

export const qaChunkPreviewSchema = z.object({
  /** The mode actually used — for `auto`, the step it picked. */
  strategy: z.string(),
  note: nullableString,
  budgetTokens: z.number(),
  totalTokens: z.number(),
  chunks: z.array(
    z.object({
      position: z.number(),
      title: nullableString,
      startsWith: z.string(),
      charCount: z.number(),
      tokensEstimate: z.number(),
    }),
  ),
})

/**
 * `sectionAnchors` OR `allSections`, spelled out. "Empty means everything" is
 * the most expensive default there is and the easiest to hit by forgetting a
 * field — the backend refuses it, and so does this.
 */
export const generateSetsSchema = z
  .object({
    outlineId: z.string().uuid(),
    sectionAnchors: z.array(z.string()).optional(),
    allSections: z.boolean().optional(),
    templateId: z.string().uuid(),
    /** The shapes this run may produce — chosen here, not on the prompt. */
    questionTypes: questionTypesField,
    /** Either bound may be left out: the model then decides that side. */
    minCount: z.number().int().min(1).max(MAX_RUN_ITEMS).optional(),
    maxCount: z.number().int().min(1).max(MAX_RUN_ITEMS).optional(),
    /** Optional: none ticked means no restriction on the kinds. */
    itemKinds: z
      .array(z.enum(['theory', 'practice', 'recall', 'analysis']))
      .min(1)
      .optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    ...aiRunFields,
  })
  .refine(
    (value) =>
      value.allSections === true || (value.sectionAnchors?.length ?? 0) > 0,
    {message: 'generate.pickSections', path: ['sectionAnchors']},
  )
  .refine(
    (value) =>
      value.minCount === undefined ||
      value.maxCount === undefined ||
      value.minCount <= value.maxCount,
    {
      message: 'generate.countRange',
      path: ['maxCount'],
    },
  )

export type StartAnalyzeInput = z.infer<typeof startAnalyzeSchema>
export type PreviewChunksInput = z.infer<typeof previewChunksSchema>
export type GenerateSetsInput = z.infer<typeof generateSetsSchema>

/* --------------------------------- outlines -------------------------------- */

export const qaOutlineEntrySchema = z.object({
  anchor: z.string(),
  level: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  title: z.string(),
  order: z.number(),
  charCount: z.number(),
})

export const qaOutlineSummarySchema = z.object({
  id: z.string(),
  version: z.number(),
  label: nullableString,
  sectionCount: z.number(),
  contentFormat: z.enum(['doc', 'markdown']),
  isCurrent: z.boolean(),
  generationId: nullableString,
  createdAt: z.string(),
})

/*
 * A discriminated union, so a markdown string never reaches `sanitizeBlogDoc`
 * — that filter would turn it into an empty document without a word.
 */
export const qaOutlineSchema = z.discriminatedUnion('contentFormat', [
  qaOutlineSummarySchema.extend({
    contentFormat: z.literal('doc'),
    content: richDoc,
    outline: z.array(qaOutlineEntrySchema),
  }),
  qaOutlineSummarySchema.extend({
    contentFormat: z.literal('markdown'),
    content: z.string(),
    outline: z.array(qaOutlineEntrySchema),
  }),
])

export const qaOutlineListSchema = z.object({
  items: z.array(qaOutlineSummarySchema),
  versionCount: z.number(),
  versionWarning: z.boolean(),
})

/* ----------------------------------- sets ---------------------------------- */

const qaItemKind = z.enum(['theory', 'practice', 'recall', 'analysis'])
const qaDifficulty = z.enum(['easy', 'medium', 'hard'])

export const qaItemOptionSchema = z.object({
  id: z.string().min(1).max(64),
  text: z.string().min(1).max(2000),
})

export const qaAnswerKeySchema = z.union([
  z.object({optionIds: z.array(z.string())}),
  z.object({accepted: z.array(z.string())}),
])

export const qaItemFullSchema = z.object({
  id: z.string(),
  setId: z.string(),
  datasetId: z.string(),
  order: z.number(),
  kind: qaItemKind,
  question: richDoc,
  options: z
    .array(qaItemOptionSchema)
    .nullish()
    .transform((v) => v ?? null),
  answer: z
    .unknown()
    .nullish()
    .transform((v) => (v == null ? null : sanitizeBlogDoc(v))),
  answerKey: qaAnswerKeySchema.nullish().transform((v) => v ?? null),
  explanation: z
    .unknown()
    .nullish()
    .transform((v) => (v == null ? null : sanitizeBlogDoc(v))),
  sectionAnchor: nullableString,
  difficulty: qaDifficulty.nullish().transform((v) => v ?? null),
  tagIds: z.array(z.string()).default([]),
  published: z.boolean().default(true),
  reviewStatus: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  sourceItemId: nullableString,
})

export const qaItemSearchRowSchema = qaItemFullSchema.extend({
  type: z.string().default(''),
})

export const qaSetSchema = z.object({
  id: z.string(),
  datasetId: z.string(),
  outlineId: nullableString,
  sectionAnchor: nullableString,
  sectionTitle: nullableString,
  templateId: z.string(),
  /** The set's shape — one registry key. One set, one shape. */
  questionType: z.string(),
  generationId: nullableString,
  title: z.string(),
  description: nullableString,
  intro: z
    .unknown()
    .nullish()
    .transform((v) => (v == null ? null : sanitizeBlogDoc(v))),
  difficulty: qaDifficulty.nullish().transform((v) => v ?? null),
  status: z.enum(['draft', 'published', 'archived']),
  itemCount: z.number(),
  isFinal: z.boolean().default(false),
  approvedCount: z.number().default(0),
  version: z.number(),
  publishedAt: nullableString,
  createdAt: z.string(),
  // Optional for a backend that predates the field; readers fall back to `createdAt`.
  updatedAt: z.string().optional(),
})

export const qaSetListSchema = z.array(qaSetSchema)

export const qaSetDetailSchema = qaSetSchema.extend({
  items: z.array(qaItemFullSchema),
})

export const qaFinalOverviewSchema = z.object({
  approved: z.number(),
  added: z.number(),
  groups: z.array(
    z.object({
      sectionAnchor: nullableString,
      sectionTitle: nullableString,
      inFinalSet: z.boolean(),
      entries: z.array(
        z.object({
          item: qaItemFullSchema,
          state: z.enum(['added', 'new']),
          templateKey: z.string(),
        }),
      ),
    }),
  ),
})

export const bulkReviewResultSchema = z.object({updated: z.number()})

export type BulkReviewInput = {
  reviewStatus: 'pending' | 'approved' | 'rejected'
  /** Every question of these sets. Send this or `itemIds`; the backend 400s on neither. */
  setIds?: string[]
  itemIds?: string[]
  /** Only change questions currently in this status (`pending` leaves rejected ones alone). */
  fromStatus?: 'pending' | 'approved' | 'rejected'
  /** Only the questions of this section; `""` is those without one. Needs `setIds`. */
  sectionAnchor?: string
}

/** A page of a set's questions, sections as contiguous blocks. */
export const qaItemPageSchema = z.object({
  items: z.array(qaItemFullSchema),
  total: z.number(),
})

/** How many questions each section of a set has, in the order `qaItemPageSchema` lists them. */
export const qaSetSectionListSchema = z.array(
  z.object({
    sectionAnchor: nullableString,
    total: z.number(),
    approved: z.number(),
    rejected: z.number(),
  }),
)

export const qaFinalSummarySchema = z.object({
  total: z.number(),
  added: z.number(),
  waiting: z.number(),
  hasFinal: z.boolean(),
  sections: z.array(
    z.object({
      sectionAnchor: nullableString,
      total: z.number(),
      waiting: z.number(),
    }),
  ),
})

export const qaFinalEntryPageSchema = z.object({
  entries: z.array(
    z.object({
      item: qaItemFullSchema,
      state: z.enum(['added', 'new']),
      templateKey: z.string(),
    }),
  ),
  total: z.number(),
})

export const addToFinalSetResultSchema = z.object({
  createdSets: z.number(),
  addedItems: z.number(),
})

export const updateSourceSchema = z.object({
  title: z.string().max(200).nullable().optional(),
  content: z.string().min(1).max(MAX_SOURCE_CHARS).optional(),
})

export const qaQuestionTypeSchema = z.object({
  id: z.string(),
  key: z.string(),
  label: z.string(),
  description: nullableString,
  position: z.number(),
  total: z.number(),
  published: z.number(),
})

export const qaQuestionTypeListSchema = z.array(qaQuestionTypeSchema)

export const updateQuestionTypeSchema = z.object({
  label: z.string().min(1).max(120).optional(),
  description: z.string().max(320).nullable().optional(),
  position: z.number().int().min(0).max(1000).optional(),
  published: z.boolean().optional(),
})

export const qaItemListSchema = z.object({
  items: z.array(qaItemSearchRowSchema),
  total: z.number(),
})

export const updateSetSchema = z.object({
  version: z.number().int().min(1),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).nullable().optional(),
  intro: z.unknown().optional(),
  difficulty: qaDifficulty.nullable().optional(),
  templateId: z.string().uuid().optional(),
})

export const writeItemSchema = z.object({
  kind: qaItemKind,
  question: z.unknown(),
  options: z.array(qaItemOptionSchema).nullable().optional(),
  answer: z.unknown().nullable().optional(),
  answerKey: qaAnswerKeySchema.nullable().optional(),
  explanation: z.unknown().nullable().optional(),
  difficulty: qaDifficulty.nullable().optional(),
  sectionAnchor: z.string().max(160).nullable().optional(),
  /** The WHOLE list of tag ids — replaces, never merges. */
  tagIds: z.array(z.string().uuid()).max(20).optional(),
})

export const patchItemSchema = writeItemSchema
  .partial()
  .omit({sectionAnchor: true})
  .extend({
    published: z.boolean().optional(),
    reviewStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
  })

/** One dragged question: it now sits right after `afterId` (`null` = first in the set). */
export const reorderMoveSchema = z.object({
  id: z.string().uuid(),
  afterId: z.string().uuid().nullable(),
  /** Only when the question changed section (`null` = no section). */
  sectionAnchor: z.string().max(160).nullable().optional(),
})

export const reorderItemsSchema = z.object({
  version: z.number().int().min(1),
  /** ONLY the questions that were dragged, top to bottom; the rest keep their place. */
  moves: z.array(reorderMoveSchema).min(1).max(5000),
})

export type UpdateSetInput = z.infer<typeof updateSetSchema>
export type WriteItemInput = z.infer<typeof writeItemSchema>
export type PatchItemInput = z.infer<typeof patchItemSchema>
export type ReorderMove = z.infer<typeof reorderMoveSchema>
export type ReorderItemsInput = z.infer<typeof reorderItemsSchema>

/* ------------------------------ learner surface ---------------------------- */

// `tone` stays a plain string on the way IN: a value the backend adds
// later must not fail the whole list and blank the screen (cf. the provider note).
const qaItemTagMetaSchema = z.object({
  icon: z.string(),
  tone: z.string(),
  label: z.record(z.string(), z.string()),
})

const qaTemplateKey = z.enum(QA_TEMPLATE_KEYS)

/**
 * The learner's view of a question. Written as its own object, NOT
 * `qaItemFullSchema.omit(...)`: a derived schema keeps working when someone
 * adds `answerKey` upstream, and the whole point of the split is that this
 * shape has no field to forget.
 */
export const qaItemPlaySchema = z.object({
  id: z.string(),
  order: z.number(),
  kind: qaItemKind,
  question: richDoc,
  options: z
    .array(qaItemOptionSchema)
    .nullish()
    .transform((v) => v ?? null),
  difficulty: qaDifficulty.nullish().transform((v) => v ?? null),
  /** Tag ids shown on the question — look them up in `qaItemTagPlayListSchema`. */
  tagIds: z.array(z.string()).default([]),
  templateKey: qaTemplateKey,
})

/** A tag as the learner sees it: enough to draw, no `description` (that is for the AI). */
export const qaItemTagPlaySchema = z.object({
  id: z.string(),
  key: z.string(),
  meta: qaItemTagMetaSchema,
})

export const qaItemTagPlayListSchema = z.array(qaItemTagPlaySchema)

export const qaDatasetPlaySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: nullableString,
  itemCount: z.number(),
  items: z.array(qaItemPlaySchema),
})

export const qaDatasetSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: nullableString,
  itemCount: z.number(),
  itemKinds: z.array(qaItemKind),
  templateKeys: z.array(qaTemplateKey),
  difficulties: z.array(qaDifficulty),
  openAttemptId: nullableString,
  updatedAt: nullableString,
})

export const qaDatasetListPlaySchema = z.object({
  items: z.array(qaDatasetSummarySchema),
  total: z.number(),
})

export const qaItemListPlaySchema = z.object({
  items: z.array(qaItemPlaySchema),
  total: z.number(),
})

export const qaAttemptSchema = z.object({
  id: z.string(),
  datasetId: z.string(),
  itemCount: z.number(),
  status: z.enum(['in_progress', 'finished', 'abandoned']),
  answeredCount: z.number(),
  correctCount: z.number(),
  startedAt: z.string(),
  finishedAt: nullableString,
})

export const qaAttemptPlaySchema = z.object({
  attempt: qaAttemptSchema,
  datasetTitle: z.string(),
  items: z.array(qaItemPlaySchema),
})

export const qaAttemptListSchema = z.array(qaAttemptSchema)

const qaGrading = z.enum(['auto', 'self'])

const qaResponseSchema = z.union([
  z.object({optionIds: z.array(z.string())}),
  z.object({text: z.string()}),
  z.object({known: z.boolean()}),
])

export const qaAnswerResultSchema = z.object({
  isCorrect: z.boolean(),
  grading: qaGrading,
  answer: z
    .unknown()
    .nullish()
    .transform((v) => (v == null ? null : sanitizeBlogDoc(v))),
  explanation: z
    .unknown()
    .nullish()
    .transform((v) => (v == null ? null : sanitizeBlogDoc(v))),
  attempt: qaAttemptSchema,
})

export const qaAnswerReviewListSchema = z.array(
  z.object({
    itemId: z.string(),
    kind: qaItemKind,
    question: richDoc,
    options: z
      .array(qaItemOptionSchema)
      .nullish()
      .transform((v) => v ?? null),
    tagIds: z.array(z.string()).default([]),
    response: qaResponseSchema,
    isCorrect: z.boolean(),
    grading: qaGrading,
    answer: z
      .unknown()
      .nullish()
      .transform((v) => (v == null ? null : sanitizeBlogDoc(v))),
    // Option ids that were right; empty for typed/flashcard answers.
    correctOptionIds: z
      .array(z.string())
      .nullish()
      .transform((v) => v ?? []),
    explanation: z
      .unknown()
      .nullish()
      .transform((v) => (v == null ? null : sanitizeBlogDoc(v))),
    answeredAt: z.string(),
  }),
)

export const qaStatsSchema = z.object({
  rows: z.array(
    z.object({
      grading: qaGrading,
      kind: qaItemKind,
      answered: z.number(),
      correct: z.number(),
    }),
  ),
})

/** `durationMs` is measured by the client, so the backend clamps it and never grades on it. */
export const submitAnswerSchema = z.object({
  itemId: z.string().uuid(),
  response: qaResponseSchema,
  durationMs: z.number().int().min(0).optional(),
})

export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>

/* ------------------------------- Item tags ------------------------------- */

export const qaItemTagSchema = z.object({
  id: z.string(),
  key: z.string(),
  description: z.string(),
  meta: qaItemTagMetaSchema,
  active: z.boolean(),
})

export const qaItemTagListSchema = z.array(qaItemTagSchema)

// On the way OUT the enums are strict — the form only offers these.
const qaItemTagMetaInputSchema = z.object({
  icon: z.string().regex(/^lucide:[a-z0-9-]+$/),
  tone: z.enum(QA_TAG_TONES),
  label: z.object({
    vi: z.string().trim().min(1).max(80),
    en: z.string().trim().min(1).max(80),
  }),
})

export const createItemTagSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(32)
    .regex(/^[a-z][a-z0-9_]*$/),
  description: z.string().trim().min(1).max(640),
  meta: qaItemTagMetaInputSchema,
  active: z.boolean().optional(),
})

// `key` can change: items store the tag's id, so renaming touches no question. Only
// saved prompts that still name the old key go stale.
export const updateItemTagSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(32)
    .regex(/^[a-z][a-z0-9_]*$/)
    .optional(),
  description: z.string().trim().min(1).max(640).optional(),
  meta: qaItemTagMetaInputSchema.optional(),
  active: z.boolean().optional(),
})

export type CreateItemTagInput = z.infer<typeof createItemTagSchema>
export type UpdateItemTagInput = z.infer<typeof updateItemTagSchema>
