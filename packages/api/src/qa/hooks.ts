'use client'

import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {useEffect} from 'react'

import * as qaApi from './api'
import type {
  AddSourceInput,
  CreateCredentialInput,
  CreateItemTagInput,
  CreateModelInput,
  CreateDatasetInput,
  CreateTemplateInput,
  DuplicateTemplateInput,
  GenerateSetsInput,
  PatchItemInput,
  PreviewChunksInput,
  ReorderItemsInput,
  StartAnalyzeInput,
  SubmitAnswerInput,
  UpdateCredentialInput,
  UpdateItemTagInput,
  ReviewQaFeedbackInput,
  SubmitQaFeedbackInput,
  UpdateModelInput,
  UpdateDatasetInput,
  UpdateSetInput,
  UpdateTemplateInput,
  WriteItemInput,
} from './schemas'
import type {
  QaFeedbackQuery,
  BrowseItemsQuery,
  QaGeneration,
  QaItemPlay,
  QaItemsQuery,
  QaOutline,
  QaPromptKind,
  QaSetsQuery,
  UpdateQaOutlineInput,
  UpdateQuestionTypeInput,
  UpdateSourceInput,
} from './types'

/**
 * Query key factory — the ONLY source of truth for this feature's keys. Keys
 * written inline in several places are the number-one cause of "invalidate does
 * nothing".
 */
export const qaKeys = {
  all: ['qa'] as const,

  credentials: () => [...qaKeys.all, 'credentials'] as const,
  models: () => [...qaKeys.all, 'models'] as const,
  itemTags: () => [...qaKeys.all, 'item-tags'] as const,
  feedbacks: () => [...qaKeys.all, 'feedbacks'] as const,
  feedbackList: (query: QaFeedbackQuery) =>
    [...qaKeys.feedbacks(), 'list', query] as const,
  feedbackPending: () => [...qaKeys.feedbacks(), 'pending'] as const,

  templates: () => [...qaKeys.all, 'templates'] as const,
  templateList: (kind?: QaPromptKind) =>
    [...qaKeys.templates(), kind ?? 'all'] as const,

  datasets: () => [...qaKeys.all, 'datasets'] as const,
  datasetList: () => [...qaKeys.datasets(), 'list'] as const,
  sources: (datasetId: string) =>
    [...qaKeys.datasets(), datasetId, 'sources'] as const,
  source: (id: string) => [...qaKeys.all, 'source', id] as const,

  generations: () => [...qaKeys.all, 'generations'] as const,
  generation: (id: string) => [...qaKeys.generations(), id] as const,
  activeGenerations: (datasetId: string) =>
    [...qaKeys.generations(), 'active', datasetId] as const,

  outlines: () => [...qaKeys.all, 'outlines'] as const,
  outlineList: (datasetId: string) =>
    [...qaKeys.outlines(), 'list', datasetId] as const,
  outline: (id: string) => [...qaKeys.outlines(), id] as const,

  finalSet: (datasetId: string) =>
    [...qaKeys.all, 'final-set', datasetId] as const,

  sets: () => [...qaKeys.all, 'sets'] as const,
  setList: (query: QaSetsQuery) => [...qaKeys.sets(), 'list', query] as const,
  set: (id: string) => [...qaKeys.sets(), id] as const,

  items: () => [...qaKeys.all, 'items'] as const,
  questionTypes: () => [...qaKeys.all, 'question-types'] as const,
  itemSearch: (query: QaItemsQuery) => [...qaKeys.items(), query] as const,

  /* The learner surface reads different rows than admin does, so it keeps its
     own subtree — invalidating "sets" after publishing must not wipe a
     learner's open attempt out of the cache. */
  play: () => [...qaKeys.all, 'play'] as const,
  playDatasets: (q = '') => [...qaKeys.play(), 'datasets', q] as const,
  knowledge: (id: string) => [...qaKeys.play(), 'knowledge', id] as const,
  playDataset: (id: string) => [...qaKeys.play(), 'dataset', id] as const,
  playItems: (query: BrowseItemsQuery) =>
    [...qaKeys.play(), 'items', query] as const,
  attemptPlay: (id: string) => [...qaKeys.play(), 'attempt', id] as const,
  attempts: (datasetId?: string) =>
    [...qaKeys.play(), 'attempts', datasetId ?? 'all'] as const,
  datasetItems: (datasetId: string) =>
    [...qaKeys.play(), 'dataset-items', datasetId] as const,
  attemptReview: (id: string) => [...qaKeys.play(), 'review', id] as const,
  stats: () => [...qaKeys.play(), 'stats'] as const,
  playTags: () => [...qaKeys.play(), 'item-tags'] as const,
}

/* ------------------------------ AI credentials ----------------------------- */

export function useAiCredentials() {
  return useQuery({
    queryKey: qaKeys.credentials(),
    queryFn: ({signal}) => qaApi.listCredentials(signal),
  })
}

export function useAiModels() {
  return useQuery({
    queryKey: qaKeys.models(),
    queryFn: ({signal}) => qaApi.listModels(signal),
  })
}

// A model's limits and `enabled` are embedded in every credential row, so a model
// change must refresh both lists.
function invalidateModels(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({queryKey: qaKeys.models()}),
    queryClient.invalidateQueries({queryKey: qaKeys.credentials()}),
  ])
}

export function useCreateAiModel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateModelInput) => qaApi.createModel(input),
    onSuccess: () => invalidateModels(queryClient),
  })
}

export function useUpdateAiModel(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateModelInput) => qaApi.updateModel(id, input),
    onSuccess: () => invalidateModels(queryClient),
  })
}

export function useDeleteAiModel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => qaApi.deleteModel(id),
    onSuccess: () => invalidateModels(queryClient),
  })
}

export function useCreateAiCredential() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCredentialInput) => qaApi.createCredential(input),
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: qaKeys.credentials()}),
  })
}

export function useUpdateAiCredential(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateCredentialInput) =>
      qaApi.updateCredential(id, input),
    // Invalidate the whole list, not just this row: flipping `isDefault` turns
    // the previous default off, so a second row changed too.
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: qaKeys.credentials()}),
  })
}

export function useDisableAiCredential() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => qaApi.disableCredential(id),
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: qaKeys.credentials()}),
  })
}

export function useDeleteAiCredential() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => qaApi.deleteCredential(id),
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: qaKeys.credentials()}),
  })
}

/* -------------------------------- templates -------------------------------- */

export function useQaTemplates(kind?: QaPromptKind) {
  return useQuery({
    queryKey: qaKeys.templateList(kind),
    queryFn: ({signal}) => qaApi.listTemplates(kind, signal),
  })
}

export function useCreateQaTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTemplateInput) => qaApi.createTemplate(input),
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: qaKeys.templates()}),
  })
}

export function useUpdateQaTemplate(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateTemplateInput) => qaApi.updateTemplate(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: qaKeys.templates()}),
  })
}

export function useDuplicateQaTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({id, input}: {id: string; input: DuplicateTemplateInput}) =>
      qaApi.duplicateTemplate(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: qaKeys.templates()}),
  })
}

export function useDisableQaTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => qaApi.disableTemplate(id),
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: qaKeys.templates()}),
  })
}

/**
 * Bulk disable. The backend has no batch route, so this fans out one request per
 * id and uses `allSettled`: one refused row must not hide that the others went
 * through. Resolves to the ids that failed so the caller can keep them selected.
 */
export function useDisableQaTemplates() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(
        ids.map((id) => qaApi.disableTemplate(id)),
      )
      return ids.filter((_, index) => results[index].status === 'rejected')
    },
    onSettled: () =>
      queryClient.invalidateQueries({queryKey: qaKeys.templates()}),
  })
}

/* --------------------------------- datasets -------------------------------- */

export function useQaDatasets() {
  return useQuery({
    queryKey: qaKeys.datasetList(),
    queryFn: ({signal}) => qaApi.listDatasets(signal),
  })
}

export function useCreateQaDataset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateDatasetInput) => qaApi.createDataset(input),
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: qaKeys.datasets()}),
  })
}

export function useUpdateQaDataset(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateDatasetInput) => qaApi.updateDataset(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: qaKeys.datasets()}),
  })
}

export function useDeleteQaDataset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => qaApi.deleteDataset(id),
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: qaKeys.datasets()}),
  })
}

export function useQaSources(datasetId: string | undefined) {
  return useQuery({
    queryKey: qaKeys.sources(datasetId ?? ''),
    queryFn: ({signal}) => qaApi.listSources(datasetId!, signal),
    enabled: Boolean(datasetId),
  })
}

/**
 * One source with its text. Keyed off the source id alone, NOT under the
 * dataset's `sources` key: invalidating the list after an add or a delete must
 * not throw away the body someone has open.
 */
export function useQaSource(id: string | undefined) {
  return useQuery({
    queryKey: qaKeys.source(id ?? ''),
    queryFn: ({signal}) => qaApi.getSource(id!, signal),
    enabled: Boolean(id),
  })
}

export function useAddQaSource(datasetId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: AddSourceInput) => qaApi.addSource(datasetId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: qaKeys.sources(datasetId)})
      // The dataset row carries `sourceCharCount` and `status`, and adding the
      // first source moves `draft` → `ready`.
      queryClient.invalidateQueries({queryKey: qaKeys.datasets()})
    },
  })
}

export function useUpdateQaSource(datasetId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({id, input}: {id: string; input: UpdateSourceInput}) =>
      qaApi.updateSource(id, input),
    onSuccess: (source) => {
      queryClient.setQueryData(qaKeys.source(source.id), source)
      queryClient.invalidateQueries({queryKey: qaKeys.sources(datasetId)})
      queryClient.invalidateQueries({queryKey: qaKeys.datasets()})
    },
  })
}

export function useDeleteQaSource(datasetId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => qaApi.deleteSource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: qaKeys.sources(datasetId)})
      queryClient.invalidateQueries({queryKey: qaKeys.datasets()})
    },
  })
}

/* ------------------------------- generations ------------------------------- */

/** A run is finished once it leaves these two states. */
export function isGenerationRunning(status: QaGeneration['status']): boolean {
  return status === 'queued' || status === 'running'
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
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: qaKeys.generation(id ?? ''),
    queryFn: ({signal}) => qaApi.getGeneration(id!, signal),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status && isGenerationRunning(status) ? 3000 : false
    },
    // The point of this query is to see the state change, so nothing is fresh.
    staleTime: 0,
  })

  // A finished run has written sets that no list knows about yet — without this
  // the new section only shows up after a reload. An outline run writes a new
  // outline version instead, so its lists are refreshed the same way.
  const status = query.data?.status
  const kind = query.data?.kind
  const finished = status !== undefined && !isGenerationRunning(status)
  useEffect(() => {
    if (!finished) return
    void queryClient.invalidateQueries({
      queryKey: kind === 'outline' ? qaKeys.outlines() : qaKeys.sets(),
    })
  }, [finished, kind, queryClient])

  return query
}

/**
 * The runs still going on a dataset. The page only knows the id of a run it started
 * itself; this is how a reload (or a second tab) still shows one in progress. Read
 * once on mount — `useQaGeneration` takes over the polling from the id it returns.
 */
export function useQaActiveGenerations(datasetId: string) {
  return useQuery({
    queryKey: qaKeys.activeGenerations(datasetId),
    queryFn: ({signal}) => qaApi.getActiveGenerations(datasetId, signal),
    staleTime: 0,
  })
}

export function useStartAnalyze(datasetId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: StartAnalyzeInput) =>
      qaApi.startAnalyze(datasetId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: qaKeys.generations()}),
  })
}

/**
 * Mutations, not queries: each call is a deliberate click (the second one is
 * billed), and its answer describes the options at that moment — a cached copy
 * would outlive the form it answered.
 */
export function usePreviewChunks(datasetId: string) {
  return useMutation({
    mutationFn: (input: PreviewChunksInput) =>
      qaApi.previewChunks(datasetId, input),
  })
}

export function useGenerateSets() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: GenerateSetsInput) => qaApi.generateSets(input),
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: qaKeys.generations()}),
  })
}

export function useRetryQaGeneration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => qaApi.retryGeneration(id),
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: qaKeys.generations()}),
  })
}

/* --------------------------------- outlines -------------------------------- */

export function useQaOutlines(datasetId: string | undefined) {
  return useQuery({
    queryKey: qaKeys.outlineList(datasetId ?? ''),
    queryFn: ({signal}) => qaApi.listOutlines(datasetId!, signal),
    enabled: Boolean(datasetId),
  })
}

export function useQaOutline(id: string | undefined) {
  return useQuery({
    queryKey: qaKeys.outline(id ?? ''),
    queryFn: ({signal}) => qaApi.getOutline(id!, signal),
    enabled: Boolean(id),
  })
}

export function useCreateQaOutline(datasetId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {content: string; label?: string | null}) =>
      qaApi.createOutline(datasetId, input),
    onSuccess: (outline) => {
      queryClient.setQueryData(qaKeys.outline(outline.id), outline)
      queryClient.invalidateQueries({
        queryKey: qaKeys.outlineList(datasetId),
      })
      // The first version moves the dataset from `ready` to `outlined`.
      queryClient.invalidateQueries({queryKey: qaKeys.datasets()})
    },
  })
}

export function useUpdateQaOutline(id: string, datasetId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateQaOutlineInput) => qaApi.updateOutline(id, input),
    onSuccess: (outline) => {
      queryClient.setQueryData(qaKeys.outline(id), outline)
      // `sectionCount` on the summary changes with the content.
      queryClient.invalidateQueries({
        queryKey: qaKeys.outlineList(datasetId),
      })
    },
  })
}

export function useSetCurrentQaOutline(datasetId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (outlineId: string) =>
      qaApi.setCurrentOutline(datasetId, outlineId),
    onSuccess: () => {
      // The flag moves between rows, so the list and every cached version are stale.
      queryClient.invalidateQueries({
        queryKey: qaKeys.outlineList(datasetId),
      })
      queryClient.invalidateQueries({queryKey: qaKeys.outlines()})
      queryClient.invalidateQueries({queryKey: qaKeys.play()})
    },
  })
}

export function useDeleteQaOutline(datasetId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => qaApi.deleteOutline(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({queryKey: qaKeys.outline(id)})
      // Deleting the current version promotes another one, so every row may change.
      queryClient.invalidateQueries({
        queryKey: qaKeys.outlineList(datasetId),
      })
    },
  })
}

export function useUpdateQaOutlineLabel(id: string, datasetId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (label: string | null) => qaApi.updateOutlineLabel(id, label),
    onSuccess: (summary) => {
      // Bản tóm tắt không có `content`, nên vá nhãn vào cache thay vì ghi đè cả bản.
      queryClient.setQueryData<QaOutline>(qaKeys.outline(id), (old) =>
        old ? {...old, label: summary.label} : old,
      )
      queryClient.invalidateQueries({
        queryKey: qaKeys.outlineList(datasetId),
      })
    },
  })
}

/* ----------------------------------- sets ---------------------------------- */

export function useQaSets(query: QaSetsQuery = {}) {
  return useQuery({
    queryKey: qaKeys.setList(query),
    queryFn: ({signal}) => qaApi.listSets(query, signal),
  })
}

export function useQaSet(id: string | undefined) {
  return useQuery({
    queryKey: qaKeys.set(id ?? ''),
    queryFn: ({signal}) => qaApi.getSet(id!, signal),
    enabled: Boolean(id),
  })
}

/** Questions per request when a set or the final set is read a page at a time. */
const REVIEW_PAGE_SIZE = 50

/**
 * A set's questions, a page at a time, for a list that loads more as it is scrolled.
 * Pages arrive in the server's display order (each section's questions together), so
 * the flat list of `data.pages` is already the order to draw.
 */
export function useQaSetItems(setId: string) {
  return useInfiniteQuery({
    queryKey: [...qaKeys.set(setId), 'items'] as const,
    queryFn: ({pageParam, signal}) =>
      qaApi.listSetItems(
        setId,
        {limit: REVIEW_PAGE_SIZE, offset: pageParam},
        signal,
      ),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((sum, page) => sum + page.items.length, 0)
      return loaded < last.total && last.items.length > 0 ? loaded : undefined
    },
  })
}

/** Per-section counts of a set — for headings that should read `25/25` before their questions load. */
export function useQaSetSections(setId: string) {
  return useQuery({
    queryKey: [...qaKeys.set(setId), 'sections'] as const,
    queryFn: ({signal}) => qaApi.listSetSections(setId, signal),
  })
}

export function useUpdateQaSet(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateSetInput) => qaApi.updateSet(id, input),
    onSuccess: () => invalidateSet(queryClient, id),
  })
}

export function usePublishQaSet(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (version: number) => qaApi.publishSet(id, version),
    onSuccess: () => invalidateSet(queryClient, id),
  })
}

export function useArchiveQaSet(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (version: number) => qaApi.archiveSet(id, version),
    onSuccess: () => invalidateSet(queryClient, id),
  })
}

/**
 * Renames a whole section: the backend has no section title to write, so the new
 * name goes onto every set's own `title`. Rejects with the ids that failed so the
 * caller can say so; one failure does not stop the rest.
 */
export function useRenameQaSets() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      sets,
      title,
    }: {
      sets: {id: string; version: number}[]
      title: string
    }) => {
      const results = await Promise.allSettled(
        sets.map((set) =>
          qaApi.updateSet(set.id, {version: set.version, title}),
        ),
      )
      const failed = sets.filter(
        (_, index) => results[index].status === 'rejected',
      )
      if (failed.length > 0)
        throw new Error(`rename failed for ${failed.length} set(s)`)
    },
    onSettled: () => queryClient.invalidateQueries({queryKey: qaKeys.sets()}),
  })
}

/**
 * Removes a whole section: the backend has no delete for a set, so each one is
 * archived (and the review screen hides archived sets). Same contract as
 * `useDisableQaTemplates` — resolves to the set ids that failed, and one failure
 * does not stop the rest.
 */
export function useArchiveQaSets() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (sets: {id: string; version: number}[]) => {
      const results = await Promise.allSettled(
        sets.map((set) => qaApi.archiveSet(set.id, set.version)),
      )
      return sets
        .filter((_, index) => results[index].status === 'rejected')
        .map((set) => set.id)
    },
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: qaKeys.sets()})
      queryClient.invalidateQueries({queryKey: qaKeys.items()})
      queryClient.invalidateQueries({queryKey: [...qaKeys.all, 'final-set']})
    },
  })
}

function useInvalidateReview() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({queryKey: qaKeys.sets()})
    queryClient.invalidateQueries({queryKey: qaKeys.items()})
    queryClient.invalidateQueries({queryKey: [...qaKeys.all, 'final-set']})
  }
}

/**
 * Approves every still-pending question of the given sets (rejected ones stay
 * rejected) in ONE request. Resolves to how many questions changed.
 */
export function useApproveQaSets() {
  const invalidate = useInvalidateReview()
  return useMutation({
    mutationFn: async (setIds: string[]) =>
      (
        await qaApi.bulkReviewItems({
          reviewStatus: 'approved',
          setIds,
          fromStatus: 'pending',
        })
      ).updated,
    onSettled: invalidate,
  })
}

/**
 * Approves every still-pending question of ONE section of a set, in one request — the
 * server finds them, so a section whose questions are not all loaded yet is approved
 * whole. `sectionAnchor` is `null` for the questions that belong to no section.
 */
export function useApproveQaSection() {
  const invalidate = useInvalidateReview()
  return useMutation({
    mutationFn: async ({
      setId,
      sectionAnchor,
    }: {
      setId: string
      sectionAnchor: string | null
    }) =>
      (
        await qaApi.bulkReviewItems({
          reviewStatus: 'approved',
          setIds: [setId],
          sectionAnchor: sectionAnchor ?? '',
          fromStatus: 'pending',
        })
      ).updated,
    onSettled: invalidate,
  })
}

export function useDeleteQaSet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => qaApi.deleteSet(id),
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: qaKeys.sets()})
      queryClient.invalidateQueries({queryKey: qaKeys.items()})
      queryClient.invalidateQueries({queryKey: [...qaKeys.all, 'final-set']})
    },
  })
}

/**
 * Hard-deletes several sets at once. Resolves to the ids that failed (typically a
 * 409 `QA_SET_IN_USE`); one failure does not stop the rest.
 */
export function useDeleteQaSets() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(
        ids.map((id) => qaApi.deleteSet(id)),
      )
      return ids.filter((_, index) => results[index].status === 'rejected')
    },
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: qaKeys.sets()})
      queryClient.invalidateQueries({queryKey: qaKeys.items()})
      queryClient.invalidateQueries({queryKey: [...qaKeys.all, 'final-set']})
    },
  })
}

export function useAddQaItem(setId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: WriteItemInput) => qaApi.addItem(setId, input),
    onSuccess: () => invalidateSet(queryClient, setId),
  })
}

export function useUpdateQaItem(setId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({id, input}: {id: string; input: PatchItemInput}) =>
      qaApi.updateItem(id, input),
    onSuccess: () => invalidateSet(queryClient, setId),
  })
}

export function useDeleteQaItem(setId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => qaApi.deleteItem(id),
    onSuccess: () => invalidateSet(queryClient, setId),
  })
}

export function useReorderQaItems(setId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ReorderItemsInput) => qaApi.reorderItems(setId, input),
    onSuccess: () => invalidateSet(queryClient, setId),
  })
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
    queryFn: ({signal}) => qaApi.searchItems(query, signal),
    enabled,
  })
}

/** Approved questions grouped by section, and which are already in the final set. */
export function useQaFinalSet(datasetId: string) {
  return useQuery({
    queryKey: qaKeys.finalSet(datasetId),
    queryFn: ({signal}) => qaApi.getFinalSet(datasetId, signal),
  })
}

/** The Final set step's counts (totals, per-section waiting) without its questions. */
export function useQaFinalSummary(datasetId: string) {
  return useQuery({
    queryKey: [...qaKeys.finalSet(datasetId), 'summary'] as const,
    queryFn: ({signal}) => qaApi.getFinalSummary(datasetId, signal),
  })
}

/** The Final set step's questions, a page at a time, each section's together. */
export function useQaFinalEntries(datasetId: string) {
  return useInfiniteQuery({
    queryKey: [...qaKeys.finalSet(datasetId), 'entries'] as const,
    queryFn: ({pageParam, signal}) =>
      qaApi.listFinalEntries(
        datasetId,
        {limit: REVIEW_PAGE_SIZE, offset: pageParam},
        signal,
      ),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((sum, page) => sum + page.entries.length, 0)
      return loaded < last.total && last.entries.length > 0 ? loaded : undefined
    },
  })
}

export function useAddToQaFinalSet(datasetId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (itemIds?: string[]) => qaApi.addToFinalSet(datasetId, itemIds),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: qaKeys.finalSet(datasetId)})
      queryClient.invalidateQueries({queryKey: qaKeys.sets()})
    },
  })
}

/** The question-type catalogue, with how many questions each type holds. */
export function useQaQuestionTypes() {
  return useQuery({
    queryKey: qaKeys.questionTypes(),
    queryFn: ({signal}) => qaApi.listQuestionTypes(signal),
  })
}

export function useUpdateQaQuestionType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({id, input}: {id: string; input: UpdateQuestionTypeInput}) =>
      qaApi.updateQuestionType(id, input),
    // Publishing a type rewrites its questions, so the question lists go stale too.
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: qaKeys.questionTypes()})
      queryClient.invalidateQueries({queryKey: qaKeys.items()})
    },
  })
}

/**
 * Flips one question's `published` flag from the question-type screens, where no single
 * set is open — so it refreshes the bank and the sets, not one set's detail.
 */
export function useSetQaItemPublished() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({id, published}: {id: string; published: boolean}) =>
      qaApi.updateItem(id, {published}),
    onSuccess: (item) => {
      queryClient.invalidateQueries({queryKey: qaKeys.set(item.setId)})
      queryClient.invalidateQueries({queryKey: qaKeys.items()})
      queryClient.invalidateQueries({queryKey: qaKeys.questionTypes()})
    },
  })
}

/** Every write to a set changes both the detail (items, version) and the list. */
function invalidateSet(
  queryClient: ReturnType<typeof useQueryClient>,
  setId: string,
): void {
  queryClient.invalidateQueries({queryKey: qaKeys.set(setId)})
  queryClient.invalidateQueries({queryKey: qaKeys.sets()})
  queryClient.invalidateQueries({queryKey: qaKeys.items()})
  // Review state and the final set's copies both hang off the same rows.
  queryClient.invalidateQueries({queryKey: [...qaKeys.all, 'final-set']})
}

/* ------------------------------ learner surface ---------------------------- */

/** `q` is matched against the dataset title by the backend; debounce it at the call site. */
export function useBrowseQaDatasets(q = '') {
  return useQuery({
    queryKey: qaKeys.playDatasets(q),
    queryFn: ({signal}) => qaApi.browseDatasets(q, signal),
    placeholderData: keepPreviousData,
  })
}

export function usePlayQaDataset(id: string | undefined) {
  return useQuery({
    queryKey: qaKeys.playDataset(id ?? ''),
    queryFn: ({signal}) => qaApi.getPlayDataset(id!, signal),
    enabled: Boolean(id),
  })
}

/** The source text behind a published bank — read-only, for the learner. */
export function useQaKnowledge(id: string | undefined) {
  return useQuery({
    queryKey: qaKeys.knowledge(id ?? ''),
    queryFn: ({signal}) => qaApi.getKnowledge(id!, signal),
    enabled: Boolean(id),
  })
}

export function useQaAttemptPlay(attemptId: string | undefined) {
  return useQuery({
    queryKey: qaKeys.attemptPlay(attemptId ?? ''),
    queryFn: ({signal}) => qaApi.getAttemptPlay(attemptId!, signal),
    enabled: Boolean(attemptId),
  })
}

export function useQaAttempts(datasetId?: string) {
  return useQuery({
    queryKey: qaKeys.attempts(datasetId),
    queryFn: ({signal}) => qaApi.listAttempts(datasetId, signal),
  })
}

/**
 * Idempotent per (user, dataset): calling it with an attempt already open returns
 * that same attempt. So the button says "Continue", and a double click cannot
 * strand the first attempt — which matters, because `(attempt_id, item_id)` is
 * unique and an abandoned attempt can never be retaken.
 */
export function useStartQaAttempt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({datasetId, count}: {datasetId: string; count?: number}) =>
      qaApi.startAttempt(datasetId, count),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: qaKeys.play()})
    },
  })
}

export function useSubmitQaAnswer(attemptId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SubmitAnswerInput) =>
      qaApi.submitAnswer(attemptId, input),
    onSuccess: () => {
      // `wrongOnly` and the stats both change with every answer.
      queryClient.invalidateQueries({queryKey: qaKeys.playItems({})})
      queryClient.invalidateQueries({queryKey: qaKeys.stats()})
      queryClient.invalidateQueries({
        queryKey: qaKeys.attemptReview(attemptId),
      })
    },
  })
}

export function useFinishQaAttempt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (attemptId: string) => qaApi.finishAttempt(attemptId),
    onSuccess: () => queryClient.invalidateQueries({queryKey: qaKeys.play()}),
  })
}

export function useQaAttemptReview(attemptId: string | undefined) {
  return useQuery({
    queryKey: qaKeys.attemptReview(attemptId ?? ''),
    queryFn: ({signal}) => qaApi.reviewAttempt(attemptId!, signal),
    enabled: Boolean(attemptId),
  })
}

export function useBrowseQaItems(query: BrowseItemsQuery = {}) {
  return useQuery({
    queryKey: qaKeys.playItems(query),
    queryFn: ({signal}) => qaApi.browseItems(query, signal),
  })
}

/** One answer to one question, flattened out of an attempt's review. */
export type QaQuestionAnswer = {
  itemId: string
  isCorrect: boolean
  answeredAt: string
}

/**
 * Every published question of a dataset plus every answer ever given to them,
 * for the per-question statistics chart. The backend has no per-question
 * aggregate, so this pages the bank (100 per request) and reads each attempt's
 * review; both are cached per id, so the cost is paid once.
 */
export function useQaDatasetQuestionStats(datasetId: string | undefined) {
  const items = useQuery({
    queryKey: qaKeys.datasetItems(datasetId ?? ''),
    enabled: Boolean(datasetId),
    // The bank is paged (up to a dozen requests): do not refetch it on every mount.
    staleTime: 5 * 60_000,
    queryFn: async ({signal}) => {
      const limit = 100
      const all: QaItemPlay[] = []
      for (let offset = 0; ; offset += limit) {
        const page = await qaApi.browseItems({datasetId, limit, offset}, signal)
        all.push(...page.items)
        if (all.length >= page.total || page.items.length === 0) break
      }
      return all.sort((a, b) => a.order - b.order)
    },
  })
  const attempts = useQaAttempts(datasetId)
  const reviews = useQueries({
    queries: (attempts.data ?? []).map((attempt) => ({
      queryKey: qaKeys.attemptReview(attempt.id),
      queryFn: ({signal}: {signal: AbortSignal}) =>
        qaApi.reviewAttempt(attempt.id, signal),
      staleTime: 60_000,
    })),
  })

  const answers: QaQuestionAnswer[] = reviews.flatMap((review) =>
    (review.data ?? []).map((row) => ({
      itemId: row.itemId,
      isCorrect: row.isCorrect,
      answeredAt: row.answeredAt,
    })),
  )
  return {
    items: items.data ?? [],
    answers,
    isPending:
      items.isPending || attempts.isPending || reviews.some((r) => r.isPending),
    isError:
      items.isError || attempts.isError || reviews.some((r) => r.isError),
  }
}

export function useQaStats() {
  return useQuery({
    queryKey: qaKeys.stats(),
    queryFn: ({signal}) => qaApi.getStats(signal),
  })
}

/* ------------------------------- Item tags ------------------------------- */

export function useQaItemTags() {
  return useQuery({
    queryKey: qaKeys.itemTags(),
    queryFn: ({signal}) => qaApi.listItemTags(signal),
  })
}

export function useCreateQaItemTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateItemTagInput) => qaApi.createItemTag(input),
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: qaKeys.itemTags()}),
  })
}

export function useUpdateQaItemTag(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateItemTagInput) => qaApi.updateItemTag(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: qaKeys.itemTags()}),
  })
}

/**
 * The catalogue that turns a question's `tagIds` into something drawable. Rarely
 * changes, so it is cached long: each question reads it, none should refetch it.
 */
export function usePlayItemTags() {
  return useQuery({
    queryKey: qaKeys.playTags(),
    queryFn: ({signal}) => qaApi.listPlayItemTags(signal),
    staleTime: 5 * 60 * 1000,
  })
}

/* ---------------------------- Question feedback ---------------------------- */

/** Learner: report the question on screen. Nothing to invalidate — they never read it back. */
export function useSubmitQaFeedback(itemId: string) {
  return useMutation({
    mutationFn: (input: SubmitQaFeedbackInput) =>
      qaApi.submitItemFeedback(itemId, input),
  })
}

export function useQaFeedbacks(query: QaFeedbackQuery = {}) {
  return useQuery({
    queryKey: qaKeys.feedbackList(query),
    queryFn: ({signal}) => qaApi.listFeedbacks(query, signal),
    placeholderData: keepPreviousData,
  })
}

export function useQaFeedbackPendingCount() {
  return useQuery({
    queryKey: qaKeys.feedbackPending(),
    queryFn: ({signal}) => qaApi.countPendingFeedbacks(signal),
    refetchInterval: 60_000,
  })
}

export function useReviewQaFeedback() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({id, ...input}: ReviewQaFeedbackInput & {id: string}) =>
      qaApi.reviewFeedback(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: qaKeys.feedbacks()}),
  })
}
