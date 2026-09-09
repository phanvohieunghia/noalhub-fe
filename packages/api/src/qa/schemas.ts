import { z } from "zod";

import { sanitizeBlogDoc } from "../blog/schemas";
import { FORBIDDEN_PROMPT_VARIABLES } from "./types";

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
const richDoc = z.unknown().transform((value) => sanitizeBlogDoc(value));

/** The backend answers `null` for absent values, but tolerate `undefined` too. */
const nullableString = z
  .string()
  .nullish()
  .transform((v) => v ?? null);

const nullableNumber = z
  .number()
  .nullish()
  .transform((v) => v ?? null);

/* ------------------------------ AI credentials ----------------------------- */

export const aiCredentialSchema = z.object({
  id: z.string(),
  provider: z.enum(["openrouter"]),
  label: z.string(),
  keyLast4: z.string(),
  defaultModel: z.string(),
  enabled: z.boolean(),
  isDefault: z.boolean(),
  monthlyTokenLimit: nullableNumber,
  createdAt: z.string(),
});

export const aiCredentialListSchema = z.array(aiCredentialSchema);

export const aiModelSchema = z.object({
  id: z.string(),
  provider: z.enum(["openrouter"]),
  label: z.string(),
  contextWindow: z.number(),
  maxOutputTokens: z.number(),
  supportsStructuredOutput: z.boolean(),
});

export const aiModelListSchema = z.array(aiModelSchema);

export const createCredentialSchema = z.object({
  provider: z.enum(["openrouter"]),
  label: z.string().min(1).max(120),
  /** Accepted ONCE. There is no endpoint that reads it back. */
  apiKey: z.string().min(8).max(400),
  defaultModel: z.string().min(1).max(64),
  isDefault: z.boolean().optional(),
  monthlyTokenLimit: z.number().int().min(1).nullable().optional(),
});

export const updateCredentialSchema = createCredentialSchema
  .partial()
  // `provider` is missing on purpose: the stored ciphertext belongs to exactly
  // one vendor, so switching it means creating a new credential.
  .omit({ provider: true })
  .extend({ enabled: z.boolean().optional() });

export type CreateCredentialInput = z.infer<typeof createCredentialSchema>;
export type UpdateCredentialInput = z.infer<typeof updateCredentialSchema>;

/* -------------------------------- templates -------------------------------- */

/**
 * The same rule the backend enforces, checked here so the author finds out
 * while writing rather than after composing a long prompt.
 */
export function findSourceVariables(prompt: string): string[] {
  return FORBIDDEN_PROMPT_VARIABLES.filter((name) =>
    prompt.includes(`{{${name}}}`),
  );
}

export const qaPromptDefaultsSchema = z.object({
  count: z.number().int().min(1).optional(),
  difficulty: z.string().max(32).optional(),
  effort: z.string().max(32).optional(),
  itemKinds: z.array(z.string().max(32)).optional(),
});

export const qaTemplateSchema = z.object({
  id: z.string(),
  kind: z.enum(["outline", "qa"]),
  key: z.string(),
  name: z.string(),
  description: nullableString,
  prompt: z.string(),
  defaults: qaPromptDefaultsSchema
    .nullish()
    .transform((v) => v ?? null),
  enabled: z.boolean(),
  order: z.number(),
  updatedAt: z.string(),
});

export const qaTemplateListSchema = z.array(qaTemplateSchema);

/** `MAX_ITEMS_PER_SET` on the backend. Kept here so the form can clamp too. */
export const MAX_ITEMS_PER_SET = 50;

const promptField = z
  .string()
  .min(1)
  .refine((value) => findSourceVariables(value).length === 0, {
    message: "prompt.sourceVariable",
  });

export const createTemplateSchema = z.object({
  kind: z.enum(["outline", "qa"]),
  key: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9_]+$/, "template.keyFormat"),
  name: z.string().min(1).max(120),
  description: z.string().max(320).nullable().optional(),
  prompt: promptField,
  defaults: qaPromptDefaultsSchema
    .extend({ count: z.number().int().min(1).max(MAX_ITEMS_PER_SET).optional() })
    .nullable()
    .optional(),
  order: z.number().int().min(0).optional(),
});

/** `kind` and `key` are absent: both are a contract with every item already generated. */
export const updateTemplateSchema = createTemplateSchema
  .omit({ kind: true, key: true })
  .partial()
  .extend({ enabled: z.boolean().optional() });

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;

/* --------------------------------- datasets -------------------------------- */

export const qaDatasetSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: nullableString,
  language: z.string(),
  status: z.enum(["draft", "ready", "outlined", "archived"]),
  ownerId: z.string(),
  sourceCharCount: z.number(),
  sourceCharWarning: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const qaDatasetListSchema = z.array(qaDatasetSchema);

export const qaSourceSchema = z.object({
  id: z.string(),
  kind: z.enum(["text"]),
  title: nullableString,
  charCount: z.number(),
  order: z.number(),
  createdAt: z.string(),
});

export const qaSourceListSchema = z.array(qaSourceSchema);

export const createDatasetSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  language: z.string().max(8).optional(),
});

export const updateDatasetSchema = createDatasetSchema
  .partial()
  .extend({ archived: z.boolean().optional() });

/** `MAX_SOURCE_CHARS` on the backend — the form stops the paste before the 400. */
export const MAX_SOURCE_CHARS = 100_000;

export const addSourceSchema = z.object({
  kind: z.literal("text"),
  title: z.string().max(200).nullable().optional(),
  content: z.string().min(1).max(MAX_SOURCE_CHARS),
  order: z.number().int().min(0).optional(),
});

export type CreateDatasetInput = z.infer<typeof createDatasetSchema>;
export type UpdateDatasetInput = z.infer<typeof updateDatasetSchema>;
export type AddSourceInput = z.infer<typeof addSourceSchema>;

/* ------------------------------- generations ------------------------------- */

export const qaGenerationSchema = z.object({
  id: z.string(),
  status: z.enum(["queued", "running", "succeeded", "partial", "failed"]),
  kind: z.enum(["outline", "qa"]),
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
  inputTokens: nullableNumber,
  outputTokens: nullableNumber,
  cacheReadInputTokens: nullableNumber,
  startedAt: nullableString,
  finishedAt: nullableString,
  createdAt: z.string(),
});

export const startGenerationSchema = z.object({
  generationId: z.string(),
  reused: z.boolean(),
});

export const startAnalyzeSchema = z.object({
  templateId: z.string().uuid(),
  credentialId: z.string().uuid().optional(),
  model: z.string().max(64).optional(),
  label: z.string().max(120).optional(),
});

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
    count: z.number().int().min(1).max(MAX_ITEMS_PER_SET),
    itemKinds: z
      .array(z.enum(["theory", "practice", "recall", "analysis"]))
      .min(1),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    credentialId: z.string().uuid().optional(),
    model: z.string().max(64).optional(),
  })
  .refine(
    (value) => value.allSections === true || (value.sectionAnchors?.length ?? 0) > 0,
    { message: "generate.pickSections", path: ["sectionAnchors"] },
  );

export type StartAnalyzeInput = z.infer<typeof startAnalyzeSchema>;
export type GenerateSetsInput = z.infer<typeof generateSetsSchema>;

/* --------------------------------- outlines -------------------------------- */

export const qaOutlineEntrySchema = z.object({
  anchor: z.string(),
  level: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  title: z.string(),
  order: z.number(),
  charCount: z.number(),
});

export const qaOutlineSummarySchema = z.object({
  id: z.string(),
  version: z.number(),
  label: nullableString,
  sectionCount: z.number(),
  isCurrent: z.boolean(),
  generationId: nullableString,
  createdAt: z.string(),
});

export const qaOutlineSchema = qaOutlineSummarySchema.extend({
  content: richDoc,
  outline: z.array(qaOutlineEntrySchema),
});

export const qaOutlineListSchema = z.object({
  items: z.array(qaOutlineSummarySchema),
  versionCount: z.number(),
  versionWarning: z.boolean(),
});

/* ----------------------------------- sets ---------------------------------- */

const qaItemKind = z.enum(["theory", "practice", "recall", "analysis"]);
const qaDifficulty = z.enum(["easy", "medium", "hard"]);

export const qaItemOptionSchema = z.object({
  id: z.string().min(1).max(64),
  text: z.string().min(1).max(2000),
});

export const qaAnswerKeySchema = z.union([
  z.object({ optionIds: z.array(z.string()) }),
  z.object({ accepted: z.array(z.string()) }),
]);

export const qaItemFullSchema = z.object({
  id: z.string(),
  setId: z.string(),
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
});

export const qaSetSchema = z.object({
  id: z.string(),
  datasetId: z.string(),
  outlineId: nullableString,
  sectionAnchor: nullableString,
  sectionTitle: nullableString,
  templateId: z.string(),
  generationId: nullableString,
  title: z.string(),
  description: nullableString,
  intro: z
    .unknown()
    .nullish()
    .transform((v) => (v == null ? null : sanitizeBlogDoc(v))),
  difficulty: qaDifficulty.nullish().transform((v) => v ?? null),
  status: z.enum(["draft", "published", "archived"]),
  itemCount: z.number(),
  version: z.number(),
  publishedAt: nullableString,
  createdAt: z.string(),
});

export const qaSetListSchema = z.array(qaSetSchema);

export const qaSetDetailSchema = qaSetSchema.extend({
  items: z.array(qaItemFullSchema),
});

export const qaItemListSchema = z.object({
  items: z.array(qaItemFullSchema),
  total: z.number(),
});

export const updateSetSchema = z.object({
  version: z.number().int().min(1),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).nullable().optional(),
  intro: z.unknown().optional(),
  difficulty: qaDifficulty.nullable().optional(),
  templateId: z.string().uuid().optional(),
});

export const writeItemSchema = z.object({
  kind: qaItemKind,
  question: z.unknown(),
  options: z.array(qaItemOptionSchema).nullable().optional(),
  answer: z.unknown().nullable().optional(),
  answerKey: qaAnswerKeySchema.nullable().optional(),
  explanation: z.unknown().nullable().optional(),
  difficulty: qaDifficulty.nullable().optional(),
  sectionAnchor: z.string().max(160).nullable().optional(),
});

export const patchItemSchema = writeItemSchema.partial().omit({ sectionAnchor: true });

export const reorderItemsSchema = z.object({
  version: z.number().int().min(1),
  /** The WHOLE list of live ids, in the new order. */
  itemIds: z.array(z.string().uuid()).min(1),
});

export type UpdateSetInput = z.infer<typeof updateSetSchema>;
export type WriteItemInput = z.infer<typeof writeItemSchema>;
export type PatchItemInput = z.infer<typeof patchItemSchema>;
export type ReorderItemsInput = z.infer<typeof reorderItemsSchema>;
