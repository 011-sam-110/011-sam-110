'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { fadeUpVariants } from '@/lib/motion'

/**
 * "Book a call" section body.
 *
 * Two intentional states, decided at build time by NEXT_PUBLIC_CAL_LINK:
 *  - SET   → an inline Cal.com embed (lazy, brand-themed) renders here.
 *  - UNSET → a styled mailto CTA + email render instead — never a broken embed.
 *
 * The embed is the single most valuable conversion point on the site, so it
 * gets first-class treatment: lazy-loaded below the fold, idle-mounted so it
 * never blocks first paint, and reduced-motion safe.
 */

const CAL_LINK = process.env.NEXT_PUBLIC_CAL_LINK
const EMAIL = 'sam.poplett15@gmail.com'

const MAILTO = `mailto:${EMAIL}?subject=${encodeURIComponent(
  'Project / contract enquiry'
)}&body=${encodeURIComponent(
  "Hi Sam,\n\nI'd like to talk about some work. Here's a bit about it:\n\n- What we're building:\n- Rough timeline:\n- Budget / scope:\n\nWhen are you free for a quick call?\n\nThanks,"
)}`

// ---------------------------------------------------------------------------
// Cal.com inline embed — only loaded when a link is configured.
// ---------------------------------------------------------------------------

/**
 * The embed lives in its own dynamic chunk so @calcom/embed-react is never in
 * the main bundle and never runs on the server. It only mounts once the
 * section is near the viewport (idle-after-paint), keeping it off the critical
 * path.
 */
const CalEmbed = dynamic(() => import('./CalEmbed'), {
  ssr: false,
  loading: () => <EmbedSkeleton />,
})

function EmbedSkeleton() {
  return (
    <div
      className="animate-pulse rounded-xl border border-zinc-800 bg-zinc-950/60 p-6"
      style={{ minHeight: 520 }}
      aria-hidden
    >
      <div className="mb-4 h-4 w-40 rounded bg-zinc-800" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-10 rounded bg-zinc-800/70" />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Mailto fallback — the "no Cal link yet" state, styled to look deliberate.
// ---------------------------------------------------------------------------

function MailtoFallback({ reduced }: { reduced: boolean }) {
  return (
    <div
      className="rounded-xl border p-7 sm:p-9"
      style={{
        borderColor: 'rgba(196,174,244,0.18)',
        background:
          'linear-gradient(135deg, rgba(196,174,244,0.06), rgba(220,206,64,0.04))',
      }}
    >
      <p className="section-label mb-3">// Book a call</p>
      <h3
        className="mb-2 text-2xl font-black leading-tight"
        style={{ color: 'var(--text-primary)' }}
      >
        Tell me what you&rsquo;re building.
      </h3>
      <p
        className="mb-7 max-w-md font-mono text-sm leading-relaxed"
        style={{ color: 'var(--text-muted)' }}
      >
        Drop me a line with the rough scope and timeline and I&rsquo;ll reply
        within a day to set up a quick intro call.
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <motion.a
          href={MAILTO}
          whileHover={reduced ? undefined : { scale: 1.04 }}
          whileTap={reduced ? undefined : { scale: 0.97 }}
          className="rounded px-8 py-3.5 font-mono text-sm font-bold transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{
            background: 'var(--accent-citrine)',
            color: 'var(--bg-deep)',
            outlineColor: 'var(--accent-citrine)',
          }}
        >
          Book a call →
        </motion.a>

        <a
          href={`mailto:${EMAIL}`}
          className="font-mono text-sm underline-offset-4 transition-colors hover:underline focus-visible:underline focus-visible:outline-none"
          style={{ color: 'var(--accent-lilac)' }}
        >
          {EMAIL}
        </a>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

export function BookACall() {
  const reduced = useReducedMotion()

  // Defer mounting the heavy embed until just after first paint so the section
  // (and everything below it) is interactive without waiting on Cal.com.
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void) => number
      cancelIdleCallback?: (id: number) => void
    }
    let idleId: number | undefined
    let rafId: number | undefined

    if (typeof w.requestIdleCallback === 'function') {
      idleId = w.requestIdleCallback(() => setReady(true))
    } else {
      rafId = requestAnimationFrame(() =>
        requestAnimationFrame(() => setReady(true))
      )
    }

    return () => {
      if (idleId !== undefined && typeof w.cancelIdleCallback === 'function') {
        w.cancelIdleCallback(idleId)
      }
      if (rafId !== undefined) cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <motion.div
      variants={fadeUpVariants(reduced)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
    >
      {CAL_LINK ? (
        ready ? (
          <CalEmbed calLink={CAL_LINK} />
        ) : (
          <EmbedSkeleton />
        )
      ) : (
        <MailtoFallback reduced={reduced} />
      )}
    </motion.div>
  )
}
