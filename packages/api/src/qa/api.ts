import { http } from "../client";
import {
  addSourceSchema,
  aiCredentialListSchema,
  aiCredentialSchema,
  aiModelListSchema,
  aiModelSchema,
  qaDatasetListSchema,
  qaDatasetSchema,
  qaActiveGenerationsSchema,
  qaGenerationSchema,
  qaItemFullSchema,
  qaItemTagListSchema,
  qaItemTagPlayListSchema,
  qaItemTagSchema,
  qaItemListSchema,
  addToFinalSetResultSchema,
  qaFinalOverviewSchema,
  qaQuestionTypeListSchema,
  updateSourceSchema,
  qaQuestionTypeSchema,
  qaOutlineListSchema,
  qaOutlineSchema,
  qaOutlineSummarySchema,
  qaSetDetailSchema,
  qaSetListSchema,
  qaSetSchema,
  qaSourceFullSchema,
  qaSourceListSchema,
  qaSourceSchema,
  qaTemplateListSchema,
  qaTemplateSchema,
  qaAnswerResultSchema,
  qaAnswerReviewListSchema,
  qaAttemptListSchema,
  qaAttemptPlaySchema,
  qaAttemptSchema,
  qaItemListPlaySchema,
  qaDatasetListPlaySchema,
  qaDatasetPlaySchema,
  qaStatsSchema,
  startGenerationSchema,
  type AddSourceInput,
  type CreateCredentialInput,
  type CreateItemTagInput,
  type CreateModelInput,
  type CreateDatasetInput,
  type CreateTemplateInput,
  type DuplicateTemplateInput,
  type GenerateSetsInput,
  type PatchItemInput,
  type ReorderItemsInput,
  type StartAnalyzeInput,
  type SubmitAnswerInput,
  type UpdateCredentialInput,
  type UpdateItemTagInput,
  type UpdateModelInput,
  type UpdateDatasetInput,
  type UpdateSetInput,
  type UpdateTemplateInput,
  type WriteItemInput,
} from "./schemas";
import type {
  AiCredential,
  BrowseItemsQuery,
  QaAnswerResult,
  QaAnswerReview,
  QaAttempt,
  QaItemPlay,
  QaItemTag,
  QaItemTagPlay,
  QaAttemptPlay,
  QaDatasetPlay,
  QaDatasetSummary,
  QaStatsRow,
  AiModel,
  QaDataset,
  QaDatasetSource,
  QaDatasetSourceFull,
  QaActiveGenerations,
  QaGeneration,
  QaItemFull,
  QaItemList,
  QaFinalOverview,
  QaQuestionType,
  UpdateSourceInput,
  UpdateQuestionTypeInput,
  QaItemsQuery,
  QaOutline,
  QaOutlineList,
  QaOutlineSummary,
  QaPromptKind,
  QaPromptTemplate,
  QaSet,
  QaSetDetail,
  QaSetsQuery,
  UpdateQaOutlineInput,
  StartGenerationResponse,
} from "./types";

/**
 * One function per endpoint, named after the action. `API_BASE_URL` already
 * carries `/api`, so paths here start at `/admin` or `/qa`.
 *
 * Three permission levels live in these paths and the UI must respect them:
 * `/admin/ai/credentials` and the two generate calls need `super_admin`,
 * everything else under `/admin/qa` needs `admin`.
 */

/* ------------------------------ AI credentials ----------------------------- */

export async function listCredentials(signal?: AbortSignal): Promise<AiCredential[]> {
  const { data } = await http.get<AiCredential[]>("/admin/ai/credentials", {
    authRequired: true,
    schema: aiCredentialListSchema,
    signal,
  });
  return data;
}

export async function listModels(signal?: AbortSignal): Promise<AiModel[]> {
  const { data } = await http.get<AiModel[]>("/admin/ai/models", {
    authRequired: true,
    schema: aiModelListSchema,
    signal,
  });
  return data;
}

export async function createModel(input: CreateModelInput): Promise<AiModel> {
  const { data } = await http.post<AiModel>("/admin/ai/models", input, {
    authRequired: true,
    schema: aiModelSchema,
  });
  return data;
}

export async function updateModel(id: string, input: UpdateModelInput): Promise<AiModel> {
  const { data } = await http.patch<AiModel>(`/admin/ai/models/${id}`, input, {
    authRequired: true,
    schema: aiModelSchema,
  });
  return data;
}

export async function deleteModel(id: string): Promise<void> {
  await http.delete(`/admin/ai/models/${id}`, { authRequired: true });
}

export async function createCredential(
  input: CreateCredentialInput,
): Promise<AiCredential> {
  const { data } = await http.post<AiCredential>("/admin/ai/credentials", input, {
    authRequired: true,
    schema: aiCredentialSchema,
  });
  return data;
}

export async function updateCredential(
  id: string,
  input: UpdateCredentialInput,
): Promise<AiCredential> {
  const { data } = await http.patch<AiCredential>(
    `/admin/ai/credentials/${id}`,
    input,
    { authRequired: true, schema: aiCredentialSchema },
  );
  return data;
}

/** Disable, not delete — `qa_generations` points at these rows with RESTRICT. */
export async function disableCredential(id: string): Promise<AiCredential> {
  const { data } = await http.delete<AiCredential>(`/admin/ai/credentials/${id}`, {
    authRequired: true,
    schema: aiCredentialSchema,
  });
  return data;
}

/**
 * Hard delete — only for a key no generation ever ran on (`inUse === false`).
 * A used key answers 409 `AI_CREDENTIAL_IN_USE`.
 */
export async function deleteCredential(id: string): Promise<void> {
  await http.delete(`/admin/ai/credentials/${id}/permanent`, {
    authRequired: true,
  });
}

/* -------------------------------- templates -------------------------------- */

export async function listTemplates(
  kind?: QaPromptKind,
  signal?: AbortSignal,
): Promise<QaPromptTemplate[]> {
  const { data } = await http.get<QaPromptTemplate[]>("/admin/qa/templates", {
    params: kind ? { kind } : undefined,
    authRequired: true,
    schema: qaTemplateListSchema,
    signal,
  });
  return data;
}

export async function createTemplate(
  input: CreateTemplateInput,
): Promise<QaPromptTemplate> {
  const { data } = await http.post<QaPromptTemplate>("/admin/qa/templates", input, {
    authRequired: true,
    schema: qaTemplateSchema,
  });
  return data;
}

export async function updateTemplate(
  id: string,
  input: UpdateTemplateInput,
): Promise<QaPromptTemplate> {
  const { data } = await http.patch<QaPromptTemplate>(
    `/admin/qa/templates/${id}`,
    input,
    { authRequired: true, schema: qaTemplateSchema },
  );
  return data;
}

export async function duplicateTemplate(
  id: string,
  input: DuplicateTemplateInput,
): Promise<QaPromptTemplate> {
  const { data } = await http.post<QaPromptTemplate>(
    `/admin/qa/templates/${id}/duplicate`,
    input,
    { authRequired: true, schema: qaTemplateSchema },
  );
  return data;
}

export async function disableTemplate(id: string): Promise<void> {
  await http.delete(`/admin/qa/templates/${id}`, { authRequired: true });
}

/* --------------------------------- datasets -------------------------------- */

export async function listDatasets(signal?: AbortSignal): Promise<QaDataset[]> {
  const { data } = await http.get<QaDataset[]>("/admin/qa/datasets", {
    authRequired: true,
    schema: qaDatasetListSchema,
    signal,
  });
  return data;
}

export async function createDataset(input: CreateDatasetInput): Promise<QaDataset> {
  const { data } = await http.post<QaDataset>("/admin/qa/datasets", input, {
    authRequired: true,
    schema: qaDatasetSchema,
  });
  return data;
}

export async function updateDataset(
  id: string,
  input: UpdateDatasetInput,
): Promise<QaDataset> {
  const { data } = await http.patch<QaDataset>(`/admin/qa/datasets/${id}`, input, {
    authRequired: true,
    schema: qaDatasetSchema,
  });
  return data;
}

/** Only allowed while no set has been generated — otherwise 409 QA_DATASET_IN_USE. */
export async function deleteDataset(id: string): Promise<void> {
  await http.delete(`/admin/qa/datasets/${id}`, { authRequired: true });
}

export async function listSources(
  datasetId: string,
  signal?: AbortSignal,
): Promise<QaDatasetSource[]> {
  const { data } = await http.get<QaDatasetSource[]>(
    `/admin/qa/datasets/${datasetId}/sources`,
    { authRequired: true, schema: qaSourceListSchema, signal },
  );
  return data;
}

/** Read one source WITH its text — the list endpoint never carries `content`. */
export async function getSource(
  id: string,
  signal?: AbortSignal,
): Promise<QaDatasetSourceFull> {
  const { data } = await http.get<QaDatasetSourceFull>(`/admin/qa/sources/${id}`, {
    authRequired: true,
    schema: qaSourceFullSchema,
    signal,
  });
  return data;
}

export async function addSource(
  datasetId: string,
  input: AddSourceInput,
): Promise<QaDatasetSource> {
  const { data } = await http.post<QaDatasetSource>(
    `/admin/qa/datasets/${datasetId}/sources`,
    addSourceSchema.parse(input),
    { authRequired: true, schema: qaSourceSchema },
  );
  return data;
}

export async function updateSource(
  id: string,
  input: UpdateSourceInput,
): Promise<QaDatasetSourceFull> {
  const { data } = await http.patch<QaDatasetSourceFull>(
    `/admin/qa/sources/${id}`,
    updateSourceSchema.parse(input),
    { authRequired: true, schema: qaSourceFullSchema },
  );
  return data;
}

export async function deleteSource(id: string): Promise<void> {
  await http.delete(`/admin/qa/sources/${id}`, { authRequired: true });
}

/* ------------------------------- generations ------------------------------- */

/** `super_admin` only — this is the call that spends money. */
export async function startAnalyze(
  datasetId: string,
  input: StartAnalyzeInput,
): Promise<StartGenerationResponse> {
  const { data } = await http.post<StartGenerationResponse>(
    `/admin/qa/datasets/${datasetId}/analyze`,
    input,
    { authRequired: true, schema: startGenerationSchema },
  );
  return data;
}

/** `super_admin` only. One click = one run = many sets. */
export async function generateSets(
  input: GenerateSetsInput,
): Promise<StartGenerationResponse> {
  const { data } = await http.post<StartGenerationResponse>(
    "/admin/qa/generate-sets",
    input,
    { authRequired: true, schema: startGenerationSchema },
  );
  return data;
}

export async function getActiveGenerations(
  datasetId: string,
  signal?: AbortSignal,
): Promise<QaActiveGenerations> {
  const { data } = await http.get<QaActiveGenerations>(
    `/admin/qa/datasets/${datasetId}/generations/active`,
    { authRequired: true, schema: qaActiveGenerationsSchema, signal },
  );
  return data;
}

/** Readable by `admin`: debugging a bad set starts from "which prompt made it". */
export async function getGeneration(
  id: string,
  signal?: AbortSignal,
): Promise<QaGeneration> {
  const { data } = await http.get<QaGeneration>(`/admin/qa/generations/${id}`, {
    authRequired: true,
    schema: qaGenerationSchema,
    signal,
  });
  return data;
}

/* --------------------------------- outlines -------------------------------- */

export async function listOutlines(
  datasetId: string,
  signal?: AbortSignal,
): Promise<QaOutlineList> {
  const { data } = await http.get<QaOutlineList>(
    `/admin/qa/datasets/${datasetId}/outlines`,
    { authRequired: true, schema: qaOutlineListSchema, signal },
  );
  return data;
}

export async function getOutline(
  id: string,
  signal?: AbortSignal,
): Promise<QaOutline> {
  const { data } = await http.get<QaOutline>(`/admin/qa/outlines/${id}`, {
    authRequired: true,
    schema: qaOutlineSchema,
    signal,
  });
  return data;
}

/**
 * Sends `content` (with its `contentFormat`) only. `outline` is derived — the
 * backend recomputes it on every write, and posting a second copy is how the
 * two drift apart.
 */
export async function updateOutline(
  id: string,
  input: UpdateQaOutlineInput,
): Promise<QaOutline> {
  const { data } = await http.patch<QaOutline>(`/admin/qa/outlines/${id}`, input, {
    authRequired: true,
    schema: qaOutlineSchema,
  });
  return data;
}

/**
 * Route riêng: `PATCH /outlines/:id` bắt buộc `content` (tới 2 MB) và từ chối field
 * `label`, nên đổi tên phải đi đường `/label`. Trả bản tóm tắt, không kèm `content`.
 */
export async function updateOutlineLabel(
  id: string,
  label: string | null,
): Promise<QaOutlineSummary> {
  const { data } = await http.patch<QaOutlineSummary>(
    `/admin/qa/outlines/${id}/label`,
    { label },
    { authRequired: true, schema: qaOutlineSummarySchema },
  );
  return data;
}

/* ----------------------------------- sets ---------------------------------- */

export async function listSets(
  query: QaSetsQuery = {},
  signal?: AbortSignal,
): Promise<QaSet[]> {
  const { data } = await http.get<QaSet[]>("/admin/qa/sets", {
    params: query,
    authRequired: true,
    schema: qaSetListSchema,
    signal,
  });
  return data;
}

export async function getSet(id: string, signal?: AbortSignal): Promise<QaSetDetail> {
  const { data } = await http.get<QaSetDetail>(`/admin/qa/sets/${id}`, {
    authRequired: true,
    schema: qaSetDetailSchema,
    signal,
  });
  return data;
}

export async function updateSet(id: string, input: UpdateSetInput): Promise<QaSet> {
  const { data } = await http.patch<QaSet>(`/admin/qa/sets/${id}`, input, {
    authRequired: true,
    schema: qaSetSchema,
  });
  return data;
}

export async function publishSet(id: string, version: number): Promise<QaSet> {
  const { data } = await http.post<QaSet>(
    `/admin/qa/sets/${id}/publish`,
    { version },
    { authRequired: true, schema: qaSetSchema },
  );
  return data;
}

export async function archiveSet(id: string, version: number): Promise<QaSet> {
  const { data } = await http.post<QaSet>(
    `/admin/qa/sets/${id}/archive`,
    { version },
    { authRequired: true, schema: qaSetSchema },
  );
  return data;
}

/** Hard delete; 409 `QA_SET_IN_USE` once learners have attempted the set. */
export async function deleteSet(id: string): Promise<void> {
  await http.delete(`/admin/qa/sets/${id}`, { authRequired: true });
}

export async function addItem(
  setId: string,
  input: WriteItemInput,
): Promise<QaItemFull> {
  const { data } = await http.post<QaItemFull>(
    `/admin/qa/sets/${setId}/items`,
    input,
    { authRequired: true, schema: qaItemFullSchema },
  );
  return data;
}

export async function updateItem(
  id: string,
  input: PatchItemInput,
): Promise<QaItemFull> {
  const { data } = await http.patch<QaItemFull>(`/admin/qa/items/${id}`, input, {
    authRequired: true,
    schema: qaItemFullSchema,
  });
  return data;
}

/** A soft delete: `qa_answers` points at the id, so it stays valid forever. */
export async function deleteItem(id: string): Promise<void> {
  await http.delete(`/admin/qa/items/${id}`, { authRequired: true });
}

export async function reorderItems(
  setId: string,
  input: ReorderItemsInput,
): Promise<QaSet> {
  const { data } = await http.put<QaSet>(
    `/admin/qa/sets/${setId}/items/order`,
    input,
    { authRequired: true, schema: qaSetSchema },
  );
  return data;
}

export async function getFinalSet(
  datasetId: string,
  signal?: AbortSignal,
): Promise<QaFinalOverview> {
  const { data } = await http.get<QaFinalOverview>(
    `/admin/qa/datasets/${datasetId}/final-set`,
    { authRequired: true, schema: qaFinalOverviewSchema, signal },
  );
  return data;
}

/** Copies approved questions into the final set; `itemIds` limits it to a few. */
export async function addToFinalSet(
  datasetId: string,
  itemIds?: string[],
): Promise<{ createdSets: number; addedItems: number }> {
  const { data } = await http.post<{ createdSets: number; addedItems: number }>(
    `/admin/qa/datasets/${datasetId}/final-set`,
    itemIds ? { itemIds } : {},
    { authRequired: true, schema: addToFinalSetResultSchema },
  );
  return data;
}

export async function listQuestionTypes(
  signal?: AbortSignal,
): Promise<QaQuestionType[]> {
  const { data } = await http.get<QaQuestionType[]>("/admin/qa/question-types", {
    authRequired: true,
    schema: qaQuestionTypeListSchema,
    signal,
  });
  return data;
}

export async function updateQuestionType(
  id: string,
  input: UpdateQuestionTypeInput,
): Promise<QaQuestionType> {
  const { data } = await http.patch<QaQuestionType>(
    `/admin/qa/question-types/${id}`,
    input,
    { authRequired: true, schema: qaQuestionTypeSchema },
  );
  return data;
}

export async function searchItems(
  query: QaItemsQuery = {},
  signal?: AbortSignal,
): Promise<QaItemList> {
  const { data } = await http.get<QaItemList>("/admin/qa/items", {
    params: query,
    authRequired: true,
    schema: qaItemListSchema,
    signal,
  });
  return data;
}

/* ------------------------------ learner surface ---------------------------- */

/**
 * The way in. A learner takes a **dataset** — its published questions as one
 * bank — so this lists only the datasets that have at least one. Sets stay on
 * the admin side.
 */
export async function browseDatasets(
  signal?: AbortSignal,
): Promise<{ items: QaDatasetSummary[]; total: number }> {
  const { data } = await http.get<{ items: QaDatasetSummary[]; total: number }>("/qa/datasets", {
    authRequired: true,
    schema: qaDatasetListPlaySchema,
    signal,
  });
  return data;
}

export async function getPlayDataset(id: string, signal?: AbortSignal): Promise<QaDatasetPlay> {
  const { data } = await http.get<QaDatasetPlay>(`/qa/datasets/${id}`, {
    authRequired: true,
    schema: qaDatasetPlaySchema,
    signal,
  });
  return data;
}

/**
 * Idempotent per (user, dataset): an open attempt comes back instead of a new row
 * (and then `count` is ignored — it already has its questions). `count` is how many
 * questions the learner wants; absent means all.
 */
export async function startAttempt(datasetId: string, count?: number): Promise<QaAttempt> {
  const { data } = await http.post<QaAttempt>(
    `/qa/datasets/${datasetId}/attempts`,
    count === undefined ? {} : { count },
    { authRequired: true, schema: qaAttemptSchema },
  );
  return data;
}

/** The attempt's own questions, in the order fixed when it started. */
export async function getAttemptPlay(
  attemptId: string,
  signal?: AbortSignal,
): Promise<QaAttemptPlay> {
  const { data } = await http.get<QaAttemptPlay>(`/qa/attempts/${attemptId}`, {
    authRequired: true,
    schema: qaAttemptPlaySchema,
    signal,
  });
  return data;
}

export async function listAttempts(datasetId?: string, signal?: AbortSignal): Promise<QaAttempt[]> {
  const { data } = await http.get<QaAttempt[]>("/qa/attempts", {
    params: datasetId ? { datasetId } : undefined,
    authRequired: true,
    schema: qaAttemptListSchema,
    signal,
  });
  return data;
}

export async function submitAnswer(
  attemptId: string,
  input: SubmitAnswerInput,
): Promise<QaAnswerResult> {
  const { data } = await http.post<QaAnswerResult>(
    `/qa/attempts/${attemptId}/answers`,
    input,
    { authRequired: true, schema: qaAnswerResultSchema },
  );
  return data;
}

export async function finishAttempt(attemptId: string): Promise<QaAttempt> {
  const { data } = await http.post<QaAttempt>(
    `/qa/attempts/${attemptId}/finish`,
    undefined,
    { authRequired: true, schema: qaAttemptSchema },
  );
  return data;
}

/** Only questions already ANSWERED — a question not taken has no entry here. */
export async function reviewAttempt(
  attemptId: string,
  signal?: AbortSignal,
): Promise<QaAnswerReview[]> {
  const { data } = await http.get<QaAnswerReview[]>(
    `/qa/attempts/${attemptId}/answers`,
    { authRequired: true, schema: qaAnswerReviewListSchema, signal },
  );
  return data;
}

/** Cuts across every dataset and every shape — "give me all the application questions". */
export async function browseItems(
  query: BrowseItemsQuery = {},
  signal?: AbortSignal,
): Promise<{ items: QaItemPlay[]; total: number }> {
  const { data } = await http.get<{ items: QaItemPlay[]; total: number }>(
    "/qa/items",
    { params: query, authRequired: true, schema: qaItemListPlaySchema, signal },
  );
  return data;
}

export async function getStats(signal?: AbortSignal): Promise<QaStatsRow[]> {
  const { data } = await http.get<{ rows: QaStatsRow[] }>("/qa/stats", {
    authRequired: true,
    schema: qaStatsSchema,
    signal,
  });
  return data.rows;
}

/* ------------------------------- Item tags ------------------------------- */

export async function listItemTags(signal?: AbortSignal): Promise<QaItemTag[]> {
  const { data } = await http.get<QaItemTag[]>("/admin/qa/item-tags", {
    authRequired: true,
    schema: qaItemTagListSchema,
    signal,
  });
  return data;
}

export async function createItemTag(input: CreateItemTagInput): Promise<QaItemTag> {
  const { data } = await http.post<QaItemTag>("/admin/qa/item-tags", input, {
    authRequired: true,
    schema: qaItemTagSchema,
  });
  return data;
}

export async function updateItemTag(id: string, input: UpdateItemTagInput): Promise<QaItemTag> {
  const { data } = await http.patch<QaItemTag>(`/admin/qa/item-tags/${id}`, input, {
    authRequired: true,
    schema: qaItemTagSchema,
  });
  return data;
}

/** The active tags a learner can see — small and rarely changing, fetched once. */
export async function listPlayItemTags(signal?: AbortSignal): Promise<QaItemTagPlay[]> {
  const { data } = await http.get<QaItemTagPlay[]>("/qa/item-tags", {
    authRequired: true,
    schema: qaItemTagPlayListSchema,
    signal,
  });
  return data;
}
