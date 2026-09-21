import type { Variants, Transition } from 'framer-motion'

/**
 * Shared motion vocabulary so every section animates with the same easing and
 * rhythm, and so reduced-motion has one place to collapse everything to instant.
 *
 * Pass the boolean from `useReducedMotion()` into the factory helpers; the
 * static `fadeUp` / `staggerContainer` exports are the motion-on defaults for
 * components that don't (yet) read the hook.
 */

// Matches the spring already used across the existing sections (AboutSection
// et al.) so this is a drop-in for them.
export const SPRING: Transition = { type: 'spring', stiffness: 400, damping: 40 }

// Calm, near-instant transition used when motion is reduced. Not literally 0
// so Framer still commits the final values cleanly.
export const INSTANT: Transition = { duration: 0 }

export const STAGGER = 0.07

/** Fade + rise. Collapses to a no-offset instant cut under reduced motion. */
export function fadeUpVariants(reduced: boolean): Variants {
  return {
    hidden: { opacity: 0, y: reduced ? 0 : 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: reduced ? INSTANT : SPRING,
    },
  }
}

/** Parent container that staggers its children — no stagger when reduced. */
export function staggerContainerVariants(reduced: boolean): Variants {
  return {
    hidden: {},
    show: {
      transition: { staggerChildren: reduced ? 0 : STAGGER },
    },
  }
}

// Motion-on defaults for direct use without the hook.
export const fadeUp: Variants = fadeUpVariants(false)
export const staggerContainer: Variants = staggerContainerVariants(false)
