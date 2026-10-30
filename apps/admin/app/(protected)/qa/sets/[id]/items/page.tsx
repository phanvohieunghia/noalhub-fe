import {redirect} from 'next/navigation'

/**
 * `/qa/sets/[id]/items` has no screen of its own — the set's questions are
 * listed on the set page. The route exists so the breadcrumb's "Questions"
 * crumb is a working link instead of a 404.
 */
export default async function QaSetItemsPage({
  params,
}: PageProps<'/qa/sets/[id]/items'>) {
  const {id} = await params
  redirect(`/qa/sets/${id}`)
}
