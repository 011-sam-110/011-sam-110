'use client'

import { useEffect, useRef, useState } from 'react'
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { SPRING } from '@/lib/motion'

const NAV_ITEMS = [
  { label: 'About',    href: '#about' },
  { label: 'Projects', href: '#projects' },
  { label: 'Skills',   href: '#skills' },
  { label: 'Stack',    href: '#stack' },
  { label: 'Contact',  href: '#contact' },
]

// The "Book a call" CTA points at the booking section, which is the same
// #contact section that renders <BookACall/>.
const BOOK_HREF = '#contact'

/**
 * Pointer-tracked magnetic "Book a call" button.
 *
 * The element follows the cursor a fraction of the way toward it (capped, so
 * it never drifts far) through a spring, which is the classic "magnetic"
 * micro-interaction: motion with a job — it advertises the primary conversion
 * action and rewards the pointer that's already heading for it.
 *
 * Fully inert under reduced motion / touch (`reduced`): no listeners, no
 * transform, just a static styled anchor. The spring is always declared (hooks
 * can't be conditional) but its inputs stay at 0 when reduced.
 */
function MagneticBookCTA({
  reduced,
  onClick,
}: {
  reduced: boolean
  onClick?: () => void
}) {
  const ref = useRef<HTMLAnchorElement>(null)

  // Raw pointer offset from the button centre.
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  // Spring-smoothed so the pull feels weighty, not jittery.
  const sx = useSpring(x, { stiffness: 250, damping: 18, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 250, damping: 18, mass: 0.4 })

  // Fraction of the distance to follow, and the hard cap on displacement (px).
  const STRENGTH = 0.35
  const MAX = 10

  const handleMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (reduced || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const dx = e.clientX - (rect.left + rect.width / 2)
    const dy = e.clientY - (rect.top + rect.height / 2)
    x.set(Math.max(-MAX, Math.min(MAX, dx * STRENGTH)))
    y.set(Math.max(-MAX, Math.min(MAX, dy * STRENGTH)))
  }

  const reset = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.a
      ref={ref}
      href={BOOK_HREF}
      onClick={onClick}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      // x/y are spring MotionValues (or 0 when reduced); the rest are the
      // citrine brand fill reserved for the one primary conversion action.
      style={{
        x: reduced ? 0 : sx,
        y: reduced ? 0 : sy,
        background: 'var(--accent-citrine)',
        color: 'var(--bg-deep)',
        boxShadow: '0 8px 24px -8px rgba(220,206,64,0.5)',
      }}
      whileHover={reduced ? undefined : { scale: 1.04 }}
      whileTap={reduced ? undefined : { scale: 0.97 }}
      transition={SPRING}
      className="inline-flex items-center gap-2 rounded-full px-4 py-2 font-mono text-xs font-semibold tracking-widest uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      <span
        aria-hidden
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: 'var(--bg-deep)' }}
      />
      Book a call
    </motion.a>
  )
}

/** "Open to contracts" availability pill with a pulsing status dot. */
function AvailabilityPill({ reduced }: { reduced: boolean }) {
  return (
    <div
      className="flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[11px] tracking-wider"
      style={{
        color: 'var(--text-primary)',
        background: 'rgba(196,174,244,0.08)',
        border: '1px solid rgba(196,174,244,0.18)',
      }}
    >
      <span className="relative flex w-2 h-2">
        {/* Outer ping ring — only animates when motion is allowed. */}
        {!reduced && (
          <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
        )}
        <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-400" />
      </span>
      Open to contracts
    </div>
  )
}

export function Navigation() {
  const reduced = useReducedMotion()

  const [scrolled, setScrolled]           = useState(false)
  const [activeSection, setActiveSection] = useState('')
  const [menuOpen, setMenuOpen]           = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })

    const sections = document.querySelectorAll('section[id]')
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id) })
      },
      { threshold: 0.3 }
    )
    sections.forEach(s => obs.observe(s))

    return () => {
      window.removeEventListener('scroll', onScroll)
      obs.disconnect()
    }
  }, [])

  // Close the drawer on Escape for keyboard users.
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <>
      <motion.nav
        className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-8 py-5"
        animate={{
          background: scrolled ? 'rgba(26,15,53,0.9)' : 'transparent',
          borderBottomColor: scrolled ? 'rgba(196,174,244,0.12)' : 'transparent',
        }}
        style={{ borderBottom: '1px solid', backdropFilter: scrolled ? 'blur(12px)' : 'none' }}
        transition={{ duration: 0.3 }}
      >
        {/* Logo */}
        <a href="#" className="font-mono text-sm tracking-wider" style={{ color: 'var(--text-primary)' }}>
          <span style={{ color: 'var(--accent-lilac)' }}>011</span>-sam-
          <span style={{ color: 'var(--accent-lilac)' }}>110</span>
          <span className="animate-blink ml-0.5" style={{ color: 'var(--accent-citrine)' }}>_</span>
        </a>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map(item => (
            <li key={item.href}>
              <a
                href={item.href}
                className="font-mono text-xs tracking-widest uppercase transition-colors duration-200"
                style={{
                  color: activeSection === item.href.slice(1)
                    ? 'var(--accent-lilac)'
                    : 'var(--text-muted)',
                }}
              >
                {activeSection === item.href.slice(1) && (
                  <span style={{ color: 'var(--bg-surface)' }} className="mr-1">//</span>
                )}
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Availability + primary CTA + hamburger */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:block">
            <AvailabilityPill reduced={reduced} />
          </div>

          {/* Primary conversion action — above the fold on desktop. */}
          <div className="hidden md:block">
            <MagneticBookCTA reduced={reduced} />
          </div>

          {/* Hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span className="w-5 h-px transition-all" style={{ background: 'var(--accent-lilac)' }} />
            <span className="w-5 h-px transition-all" style={{ background: 'var(--accent-lilac)' }} />
            <span className="w-5 h-px transition-all" style={{ background: 'var(--accent-lilac)' }} />
          </button>
        </div>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 40 }}
            className="fixed inset-y-0 right-0 z-[200] w-64 flex flex-col justify-center px-8 gap-6"
            style={{ background: 'rgba(26,15,53,0.97)', backdropFilter: 'blur(20px)' }}
          >
            <button
              className="absolute top-6 right-6 font-mono text-xl"
              style={{ color: 'var(--text-muted)' }}
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              ×
            </button>

            {NAV_ITEMS.map(item => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="font-mono text-sm tracking-widest uppercase"
                style={{ color: activeSection === item.href.slice(1) ? 'var(--accent-lilac)' : 'var(--text-primary)' }}
              >
                {item.label}
              </a>
            ))}

            {/* Availability + primary CTA inside the drawer (non-magnetic, full-width). */}
            <div className="mt-2 pt-6 flex flex-col gap-4" style={{ borderTop: '1px solid rgba(196,174,244,0.12)' }}>
              <AvailabilityPill reduced={reduced} />
              <a
                href={BOOK_HREF}
                onClick={() => setMenuOpen(false)}
                className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 font-mono text-xs font-semibold tracking-widest uppercase focus-visible:outline-none focus-visible:ring-2"
                style={{
                  background: 'var(--accent-citrine)',
                  color: 'var(--bg-deep)',
                  boxShadow: '0 8px 24px -8px rgba(220,206,64,0.5)',
                }}
              >
                <span aria-hidden className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--bg-deep)' }} />
                Book a call
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
