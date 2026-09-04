/**
 * `Object.keys` that keeps the literal key type.
 *
 * Every component in this package describes its variants as a lookup object
 * mapping a name to a class string — that object is the definition. Anything
 * that needs to ENUMERATE the variants (Storybook's controls, a docs page)
 * derives the list from it with this helper rather than retyping the names:
 * a second copy of the list goes stale the first time a variant is added, and
 * the stale copy is silent.
 *
 * The cast is safe by construction and deliberately lives in one place instead
 * of being repeated at each call site.
 */
export function keysOf<T extends Record<string, unknown>>(lookup: T): (keyof T)[] {
  return Object.keys(lookup) as (keyof T)[];
}
