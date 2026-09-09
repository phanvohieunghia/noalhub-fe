import { http } from "../client";
import {
  addSourceSchema,
  aiCredentialListSchema,
  aiCredentialSchema,
  aiModelListSchema,
  qaDatasetListSchema,
  qaDatasetSchema,
  qaGenerationSchema,
  qaItemFullSchema,
  qaItemListSchema,
  qaOutlineListSchema,
  qaOutlineSchema,
  qaOutlineSummarySchema,
  qaSetDetailSchema,
  qaSetListSchema,
  qaSetSchema,
  qaSourceListSchema,
  qaSourceSchema,
  qaTemplateListSchema,
  qaTemplateSchema,
  startGenerationSchema,
  type AddSourceInput,
  type CreateCredentialInput,
  type CreateDatasetInput,
  type CreateTemplateInput,
  type GenerateSetsInput,
  type PatchItemInput,
  type ReorderItemsInput,
  type StartAnalyzeInput,
  type UpdateCredentialInput,
  type UpdateDatasetInput,
  type UpdateSetInput,
  type UpdateTemplateInput,
  type WriteItemInput,
} from "./schemas";
import type {
  AiCredential,
  AiModel,
  QaDataset,
  QaDatasetSource,
  QaGeneration,
  QaItemFull,
  QaItemList,
  QaItemsQuery,
  QaOutline,
  QaOutlineList,
  QaOutlineSummary,
  QaPromptKind,
  QaPromptTemplate,
  QaSet,
  QaSetDetail,
  QaSetsQuery,
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
  const { data } = await http.get<AiModel[]>("/admin/ai/credentials/models", {
    authRequired: true,
    schema: aiModelListSchema,
    signal,
  });
  return data;
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
 * Sends `content` only. `outline` is derived — the backend recomputes it on
 * every write, and posting a second copy is how the two drift apart.
 */
export async function updateOutline(
  id: string,
  input: { content: unknown; label?: string | null },
): Promise<QaOutline> {
  const { data } = await http.patch<QaOutline>(`/admin/qa/outlines/${id}`, input, {
    authRequired: true,
    schema: qaOutlineSchema,
  });
  return data;
}

export async function setCurrentOutline(
  datasetId: string,
  outlineId: string,
): Promise<QaOutlineSummary> {
  const { data } = await http.put<QaOutlineSummary>(
    `/admin/qa/datasets/${datasetId}/current-outline`,
    { outlineId },
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
