"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as qaApi from "./api";
import type {
  AddSourceInput,
  CreateCredentialInput,
  CreateDatasetInput,
  CreateTemplateInput,
  DuplicateTemplateInput,
  GenerateSetsInput,
  PatchItemInput,
  ReorderItemsInput,
  StartAnalyzeInput,
  SubmitAnswerInput,
  UpdateCredentialInput,
  UpdateDatasetInput,
  UpdateSetInput,
  UpdateTemplateInput,
  WriteItemInput,
} from "./schemas";
import type {
  BrowseItemsQuery,
  BrowseSetsQuery,
  QaGeneration,
  QaItemsQuery,
  QaPromptKind,
  QaSetsQuery,
  UpdateQaOutlineInput,
} from "./types";

/**
 * Query key factory — the ONLY source of truth for this feature's keys. Keys
 * written inline in several places are the number-one cause of "invalidate does
 * nothing".
 */
export const qaKeys = {
  all: ["qa"] as const,

  credentials: () => [...qaKeys.all, "credentials"] as const,
  models: () => [...qaKeys.all, "models"] as const,

  templates: () => [...qaKeys.all, "templates"] as const,
  templateList: (kind?: QaPromptKind) => [...qaKeys.templates(), kind ?? "all"] as const,

  datasets: () => [...qaKeys.all, "datasets"] as const,
  datasetList: () => [...qaKeys.datasets(), "list"] as const,
  sources: (datasetId: string) => [...qaKeys.datasets(), datasetId, "sources"] as const,
  source: (id: string) => [...qaKeys.all, "source", id] as const,

  generations: () => [...qaKeys.all, "generations"] as const,
  generation: (id: string) => [...qaKeys.generations(), id] as const,

  outlines: () => [...qaKeys.all, "outlines"] as const,
  outlineList: (datasetId: string) => [...qaKeys.outlines(), "list", datasetId] as const,
  outline: (id: string) => [...qaKeys.outlines(), id] as const,

  sets: () => [...qaKeys.all, "sets"] as const,
  setList: (query: QaSetsQuery) => [...qaKeys.sets(), "list", query] as const,
  set: (id: string) => [...qaKeys.sets(), id] as const,

  items: () => [...qaKeys.all, "items"] as const,
  itemSearch: (query: QaItemsQuery) => [...qaKeys.items(), query] as const,

  /* The learner surface reads different rows than admin does, so it keeps its
     own subtree — invalidating "sets" after publishing must not wipe a
     learner's open attempt out of the cache. */
  play: () => [...qaKeys.all, "play"] as const,
  playSets: (query: BrowseSetsQuery) => [...qaKeys.play(), "sets", query] as const,
  playSet: (id: string) => [...qaKeys.play(), "set", id] as const,
  playItems: (query: BrowseItemsQuery) => [...qaKeys.play(), "items", query] as const,
  attempts: (setId?: string) => [...qaKeys.play(), "attempts", setId ?? "all"] as const,
  attemptReview: (id: string) => [...qaKeys.play(), "review", id] as const,
  stats: () => [...qaKeys.play(), "stats"] as const,
};

/* ------------------------------ AI credentials ----------------------------- */

export function useAiCredentials() {
  return useQuery({
    queryKey: qaKeys.credentials(),
    queryFn: ({ signal }) => qaApi.listCredentials(signal),
  });
}

export function useAiModels() {
  return useQuery({
    queryKey: qaKeys.models(),
    queryFn: ({ signal }) => qaApi.listModels(signal),
    // The registry is code on the backend — it changes on deploy, not on the hour.
    staleTime: 60 * 60 * 1000,
  });
}

export function useCreateAiCredential() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCredentialInput) => qaApi.createCredential(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qaKeys.credentials() }),
  });
}

export function useUpdateAiCredential(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCredentialInput) => qaApi.updateCredential(id, input),
    // Invalidate the whole list, not just this row: flipping `isDefault` turns
    // the previous default off, so a second row changed too.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qaKeys.credentials() }),
  });
}

export function useDisableAiCredential() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => qaApi.disableCredential(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qaKeys.credentials() }),
  });
}

export function useDeleteAiCredential() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => qaApi.deleteCredential(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qaKeys.credentials() }),
  });
}

/* -------------------------------- templates -------------------------------- */

export function useQaTemplates(kind?: QaPromptKind) {
  return useQuery({
    queryKey: qaKeys.templateList(kind),
    queryFn: ({ signal }) => qaApi.listTemplates(kind, signal),
  });
}

export function useCreateQaTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTemplateInput) => qaApi.createTemplate(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qaKeys.templates() }),
  });
}

export function useUpdateQaTemplate(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTemplateInput) => qaApi.updateTemplate(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qaKeys.templates() }),
  });
}

export function useDuplicateQaTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: DuplicateTemplateInput }) =>
      qaApi.duplicateTemplate(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qaKeys.templates() }),
  });
}

export function useDisableQaTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => qaApi.disableTemplate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qaKeys.templates() }),
  });
}

/* --------------------------------- datasets -------------------------------- */

export function useQaDatasets() {
  return useQuery({
    queryKey: qaKeys.datasetList(),
    queryFn: ({ signal }) => qaApi.listDatasets(signal),
  });
}

export function useCreateQaDataset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDatasetInput) => qaApi.createDataset(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qaKeys.datasets() }),
  });
}

export function useUpdateQaDataset(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateDatasetInput) => qaApi.updateDataset(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qaKeys.datasets() }),
  });
}

export function useDeleteQaDataset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => qaApi.deleteDataset(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qaKeys.datasets() }),
  });
}

export function useQaSources(datasetId: string | undefined) {
  return useQuery({
    queryKey: qaKeys.sources(datasetId ?? ""),
    queryFn: ({ signal }) => qaApi.listSources(datasetId!, signal),
    enabled: Boolean(datasetId),
  });
}

/**
 * One source with its text. Keyed off the source id alone, NOT under the
 * dataset's `sources` key: invalidating the list after an add or a delete must
 * not throw away the body someone has open.
 */
export function useQaSource(id: string | undefined) {
  return useQuery({
    queryKey: qaKeys.source(id ?? ""),
    queryFn: ({ signal }) => qaApi.getSource(id!, signal),
    enabled: Boolean(id),
  });
}

export function useAddQaSource(datasetId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddSourceInput) => qaApi.addSource(datasetId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qaKeys.sources(datasetId) });
      // The dataset row carries `sourceCharCount` and `status`, and adding the
      // first source moves `draft` → `ready`.
      queryClient.invalidateQueries({ queryKey: qaKeys.datasets() });
    },
  });
}

export function useDeleteQaSource(datasetId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => qaApi.deleteSource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qaKeys.sources(datasetId) });
      queryClient.invalidateQueries({ queryKey: qaKeys.datasets() });
    },
  });
}

/* ------------------------------- generations ------------------------------- */

/** A run is finished once it leaves these two states. */
export function isGenerationRunning(status: QaGeneration["status"]): boolean {
  return status === "queued" || status === "running";
}

/**
 * Poll a run until it settles.
 *
 * Polling rather than a socket: one job, one person watching it. A socket is
 * infrastructure for many listeners on one event, and it would cost a
 * namespace, a handshake and a reconnect path for a screen that one person has
 * open for a few minutes.
 */
export function useQaGeneration(id: string | undefined) {
  return useQuery({
    queryKey: qaKeys.generation(id ?? ""),
    queryFn: ({ signal }) => qaApi.getGeneration(id!, signal),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && isGenerationRunning(status) ? 3000 : false;
    },
    // The point of this query is to see the state change, so nothing is fresh.
    staleTime: 0,
  });
}

export function useStartAnalyze(datasetId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: StartAnalyzeInput) => qaApi.startAnalyze(datasetId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qaKeys.generations() }),
  });
}

export function useGenerateSets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GenerateSetsInput) => qaApi.generateSets(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qaKeys.generations() }),
  });
}

/* --------------------------------- outlines -------------------------------- */

export function useQaOutlines(datasetId: string | undefined) {
  return useQuery({
    queryKey: qaKeys.outlineList(datasetId ?? ""),
    queryFn: ({ signal }) => qaApi.listOutlines(datasetId!, signal),
    enabled: Boolean(datasetId),
  });
}

export function useQaOutline(id: string | undefined) {
  return useQuery({
    queryKey: qaKeys.outline(id ?? ""),
    queryFn: ({ signal }) => qaApi.getOutline(id!, signal),
    enabled: Boolean(id),
  });
}

export function useUpdateQaOutline(id: string, datasetId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateQaOutlineInput) => qaApi.updateOutline(id, input),
    onSuccess: (outline) => {
      queryClient.setQueryData(qaKeys.outline(id), outline);
      // `sectionCount` on the summary changes with the content.
      queryClient.invalidateQueries({ queryKey: qaKeys.outlineList(datasetId) });
    },
  });
}

export function useSetCurrentOutline(datasetId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (outlineId: string) => qaApi.setCurrentOutline(datasetId, outlineId),
    // Two rows move: the new current one on, the old one off.
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: qaKeys.outlineList(datasetId) }),
  });
}

/* ----------------------------------- sets ---------------------------------- */

export function useQaSets(query: QaSetsQuery = {}) {
  return useQuery({
    queryKey: qaKeys.setList(query),
    queryFn: ({ signal }) => qaApi.listSets(query, signal),
  });
}

export function useQaSet(id: string | undefined) {
  return useQuery({
    queryKey: qaKeys.set(id ?? ""),
    queryFn: ({ signal }) => qaApi.getSet(id!, signal),
    enabled: Boolean(id),
  });
}

export function useUpdateQaSet(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSetInput) => qaApi.updateSet(id, input),
    onSuccess: () => invalidateSet(queryClient, id),
  });
}

export function usePublishQaSet(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (version: number) => qaApi.publishSet(id, version),
    onSuccess: () => invalidateSet(queryClient, id),
  });
}

export function useArchiveQaSet(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (version: number) => qaApi.archiveSet(id, version),
    onSuccess: () => invalidateSet(queryClient, id),
  });
}

export function useAddQaItem(setId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WriteItemInput) => qaApi.addItem(setId, input),
    onSuccess: () => invalidateSet(queryClient, setId),
  });
}

export function useUpdateQaItem(setId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PatchItemInput }) =>
      qaApi.updateItem(id, input),
    onSuccess: () => invalidateSet(queryClient, setId),
  });
}

export function useDeleteQaItem(setId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => qaApi.deleteItem(id),
    onSuccess: () => invalidateSet(queryClient, setId),
  });
}

export function useReorderQaItems(setId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReorderItemsInput) => qaApi.reorderItems(setId, input),
    onSuccess: () => invalidateSet(queryClient, setId),
  });
}

/**
 * The search box calls this on every keystroke, so the caller debounces and
 * only passes `q` once it has 3 characters — below that the backend answers
 * 400, because a trigram index needs three characters to be usable and a
 * shorter term is a sequential scan over a table with tens of thousands of rows.
 */
export function useQaItemSearch(query: QaItemsQuery, enabled = true) {
  return useQuery({
    queryKey: qaKeys.itemSearch(query),
    queryFn: ({ signal }) => qaApi.searchItems(query, signal),
    enabled,
  });
}

/** Every write to a set changes both the detail (items, version) and the list. */
function invalidateSet(
  queryClient: ReturnType<typeof useQueryClient>,
  setId: string,
): void {
  queryClient.invalidateQueries({ queryKey: qaKeys.set(setId) });
  queryClient.invalidateQueries({ queryKey: qaKeys.sets() });
  queryClient.invalidateQueries({ queryKey: qaKeys.items() });
}

/* ------------------------------ learner surface ---------------------------- */

export function useBrowseQaSets(query: BrowseSetsQuery = {}) {
  return useQuery({
    queryKey: qaKeys.playSets(query),
    queryFn: ({ signal }) => qaApi.browseSets(query, signal),
  });
}

export function usePlayQaSet(id: string | undefined) {
  return useQuery({
    queryKey: qaKeys.playSet(id ?? ""),
    queryFn: ({ signal }) => qaApi.getPlaySet(id!, signal),
    enabled: Boolean(id),
  });
}

export function useQaAttempts(setId?: string) {
  return useQuery({
    queryKey: qaKeys.attempts(setId),
    queryFn: ({ signal }) => qaApi.listAttempts(setId, signal),
  });
}

/**
 * Idempotent per (user, set): calling it with an attempt already open returns
 * that same attempt. So the button says "Continue", and a double click cannot
 * strand the first attempt — which matters, because `(attempt_id, item_id)` is
 * unique and an abandoned attempt can never be retaken.
 */
export function useStartQaAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (setId: string) => qaApi.startAttempt(setId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qaKeys.play() });
    },
  });
}

export function useSubmitQaAnswer(attemptId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitAnswerInput) => qaApi.submitAnswer(attemptId, input),
    onSuccess: () => {
      // `wrongOnly` and the stats both change with every answer.
      queryClient.invalidateQueries({ queryKey: qaKeys.playItems({}) });
      queryClient.invalidateQueries({ queryKey: qaKeys.stats() });
      queryClient.invalidateQueries({ queryKey: qaKeys.attemptReview(attemptId) });
    },
  });
}

export function useFinishQaAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attemptId: string) => qaApi.finishAttempt(attemptId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qaKeys.play() }),
  });
}

export function useQaAttemptReview(attemptId: string | undefined) {
  return useQuery({
    queryKey: qaKeys.attemptReview(attemptId ?? ""),
    queryFn: ({ signal }) => qaApi.reviewAttempt(attemptId!, signal),
    enabled: Boolean(attemptId),
  });
}

export function useBrowseQaItems(query: BrowseItemsQuery = {}) {
  return useQuery({
    queryKey: qaKeys.playItems(query),
    queryFn: ({ signal }) => qaApi.browseItems(query, signal),
  });
}

export function useQaStats() {
  return useQuery({
    queryKey: qaKeys.stats(),
    queryFn: ({ signal }) => qaApi.getStats(signal),
  });
}
