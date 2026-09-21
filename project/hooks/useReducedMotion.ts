'use client'

import { useEffect, useState } from 'react'

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)'
const COARSE_QUERY = '(pointer: coarse)'

/**
 * SSR-safe accessibility governor for all motion in the app.
 *
 * Returns `true` when motion should be suppressed — either because the user
 * asked for `prefers-reduced-motion: reduce`, or because they're on a
 * coarse-pointer / touch device where a custom cursor and heavy parallax do
 * more harm than good.
 *
 * Renders `false` on the server and the first client paint (no `window`
 * access during render), then resolves on mount. This means the first frame
 * is the motion-on layout; the effect re-renders to the calm layout if needed.
 * That's the right trade-off: it never reads `window` during render (no
 * hydration mismatch) and the resolve happens before any animation can play.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const reduceMq = window.matchMedia(REDUCE_QUERY)
    const coarseMq = window.matchMedia(COARSE_QUERY)

    const update = () => setReduced(reduceMq.matches || coarseMq.matches)
    update()

    // `addEventListener` is the modern API; both queries dispatch `change`.
    reduceMq.addEventListener('change', update)
    coarseMq.addEventListener('change', update)

    return () => {
      reduceMq.removeEventListener('change', update)
      coarseMq.removeEventListener('change', update)
    }
  }, [])

  return reduced
}
