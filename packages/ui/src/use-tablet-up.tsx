'use client'

import {useSyncExternalStore} from 'react'

/** Tailwind's `md`. */
const TABLET_UP = '(min-width: 768px)'

/** True from tablet width up. `false` on the server and until the client has measured. */
export function useTabletUp() {
  return useSyncExternalStore(
    (notify) => {
      const query = window.matchMedia(TABLET_UP)
      query.addEventListener('change', notify)
      return () => query.removeEventListener('change', notify)
    },
    () => window.matchMedia(TABLET_UP).matches,
    () => false,
  )
}
