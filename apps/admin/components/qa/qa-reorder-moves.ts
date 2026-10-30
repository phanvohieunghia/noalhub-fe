import type {ReorderMove} from '@noalhub/api/qa'

type Group = {anchor: string; ids: string[]}

/** Indices of one longest strictly-increasing run in `values` (patience sorting, O(n log n)). */
function longestIncreasing(values: number[]): Set<number> {
  const tails: number[] = [] // tails[k] = index in `values` ending the best run of length k + 1
  const prev: number[] = new Array(values.length).fill(-1)

  values.forEach((value, index) => {
    let lo = 0
    let hi = tails.length
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (values[tails[mid]] < value) lo = mid + 1
      else hi = mid
    }
    if (lo > 0) prev[index] = tails[lo - 1]
    tails[lo] = index
  })

  const keep = new Set<number>()
  for (
    let at = tails.length > 0 ? tails[tails.length - 1] : -1;
    at !== -1;
    at = prev[at]
  ) {
    keep.add(at)
  }
  return keep
}

/**
 * The questions that were really dragged, and where each one now sits.
 *
 * The questions that kept their relative order (a longest increasing run of their
 * starting positions) stay where they are; every other one is a move, placed right
 * after the question above it in the new order. Dragging one question out of 500
 * therefore sends exactly one move. A question that changed section is a move even
 * if its place in the flat list did not change.
 */
export function computeMoves(
  startOrder: string[],
  groups: Group[],
  originalAnchor: (id: string) => string,
): ReorderMove[] {
  const startAt = new Map(startOrder.map((id, index) => [id, index]))
  const entries = groups.flatMap((group) =>
    group.ids.map((id) => ({id, anchor: group.anchor})),
  )
  const still = longestIncreasing(entries.map(({id}) => startAt.get(id) ?? -1))

  const moves: ReorderMove[] = []
  entries.forEach(({id, anchor}, index) => {
    const sectionChanged = originalAnchor(id) !== anchor
    if (still.has(index) && !sectionChanged) return
    moves.push({
      id,
      afterId: index === 0 ? null : entries[index - 1].id,
      ...(sectionChanged ? {sectionAnchor: anchor === '' ? null : anchor} : {}),
    })
  })
  return moves
}
