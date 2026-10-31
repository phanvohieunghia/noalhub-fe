import 'server-only'

import {API_BASE_URL, apiBaseUrlFrom} from '../config'
import {qaDatasetListPlaySchema} from './schemas'
import type {QaDatasetSummary} from './types'

/**
 * The server-only read of the public Knowledge catalogue, for the site footers
 * (Server Components). Plain `fetch` rather than `client.ts`'s axios for the same
 * reasons as `blog/server.ts`: Next's cache only wires into its own `fetch`, and
 * `client.ts` drags in the browser token store.
 *
 * Unlike the blog this never throws into the page: a footer must not take a page
 * down, so a failed read is an empty list.
 */
const KNOWLEDGE_REVALIDATE = 300

export const QA_KNOWLEDGE_TAG = 'qa-knowledge'

type NextFetchInit = RequestInit & {
  next?: {revalidate?: number | false; tags?: string[]}
}

function serverApiBaseUrl(): string {
  const internal = process.env.API_INTERNAL_URL
  return internal ? apiBaseUrlFrom(internal) : API_BASE_URL
}

/** Published banks with readable material, newest first. Empty on any failure. */
export async function getKnowledgeDatasets(
  limit = 50,
): Promise<QaDatasetSummary[]> {
  try {
    const url = new URL(`${serverApiBaseUrl()}/qa/knowledge`)
    url.searchParams.set('limit', String(limit))
    const init: NextFetchInit = {
      headers: {Accept: 'application/json'},
      next: {revalidate: KNOWLEDGE_REVALIDATE, tags: [QA_KNOWLEDGE_TAG]},
    }
    const response = await fetch(url, init)
    if (!response.ok) return []
    return qaDatasetListPlaySchema.parse(await response.json()).items
  } catch {
    return []
  }
}
