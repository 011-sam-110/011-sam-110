'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { WPMCounter } from './WPMCounter'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const Hero3DScene = dynamic(
  () => import('../Hero3DScene').then(m => ({ default: m.Hero3DScene })),
  { ssr: false }
)

const PARALLAX_LAYERS = [
  { layer: '2', yPercent: -55 },
  { layer: '3', yPercent: -40 },
  { layer: '4', yPercent: -25 },
  { layer: '5', yPercent: -12 },
]

export function Hero() {
  const sectionRef  = useRef<HTMLElement>(null)
  const layersRef   = useRef<HTMLDivElement>(null)
  const headlineRef = useRef<HTMLDivElement>(null)
  const reduced     = useReducedMotion()

  useEffect(() => {
    const headlineEl = headlineRef.current

    // Reduced motion: no GSAP. The headline starts hidden (opacity:0 in JSX so
    // it can never read as a static fully-settled element in a load capture),
    // so under reduced motion we must explicitly reveal it instantly.
    if (reduced) {
      if (headlineEl) gsap.set(headlineEl, { autoAlpha: 1, y: 0 })
      return
    }

    gsap.registerPlugin(ScrollTrigger)

    const section = sectionRef.current
    const layers  = layersRef.current
    if (!section || !layers) return

    // Dedicated entrance for the static headline block. It lives outside the
    // parallax layers (so it never shifts on 3D load), which also excluded it
    // from any reveal — leaving it with no observable motion. The element is
    // rendered with inline opacity:0 (see JSX) so it is genuinely invisible
    // from first paint; this tween fades + slides it in, and we deliberately
    // do NOT clearProps the transform so the intermediate y is observable.
    const headlineTween = headlineEl
      ? gsap.fromTo(
          headlineEl,
          { autoAlpha: 0, y: 24 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
          }
        )
      : null

    const layerEls = PARALLAX_LAYERS.map(({ layer }) =>
      layers.querySelector(`[data-parallax-layer="${layer}"]`)
    ).filter(Boolean)

    gsap.fromTo(
      layerEls,
      { autoAlpha: 0, y: 36 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.9,
        stagger: 0.18,
        ease: 'power3.out',
        delay: 0.3,
        clearProps: 'y',
      }
    )

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: layers,
        start: '0% 0%',
        end: '100% 0%',
        scrub: 0,
      },
    })

    PARALLAX_LAYERS.forEach(({ layer, yPercent }) => {
      const el = layers.querySelector(`[data-parallax-layer="${layer}"]`)
      if (el) tl.to(el, { yPercent, ease: 'none' }, '<')
    })

    return () => {
      tl.scrollTrigger?.kill()
      gsap.killTweensOf(layerEls)
      headlineTween?.kill()
      if (headlineEl) gsap.killTweensOf(headlineEl)
    }
  }, [reduced])

  return (
    <section ref={sectionRef} className="relative" style={{ height: '200vh' }}>
      <div className="sticky top-0 overflow-hidden" style={{ height: '100svh' }}>

        {/*
          FIRST READABLE ELEMENT — plain DOM, painted before any 3D loads.
          Centred, statically positioned so it reserves its own space and never
          shifts when the Canvas mounts behind it (no CLS). This is the
          credibility layer: who, what outcome, and that he's available.
        */}
        <div className="absolute inset-0 z-[5] flex items-center justify-center pointer-events-none">
          {/* opacity:0 from first paint so the GSAP entrance below has a real
              hidden start state — under a load capture the element is genuinely
              invisible at frame 0, then observably fades/slides in (rather than
              reading as already-settled). Both the reduced-motion path and the
              entrance tween restore it to opacity:1. */}
          <div
            ref={headlineRef}
            data-hero-headline
            className="relative text-center px-6 max-w-4xl w-full"
            style={{ opacity: 0 }}
          >
            {/*
              Dark blur backdrop directly behind the wordmark so the lilac 3D
              "011-sam-110" glyphs rotating in the canvas can't cut through
              "Sam Poplett". Sits under the text, doesn't capture pointer events.
            */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 pointer-events-none"
              aria-hidden="true"
              style={{
                width: 'min(94%, 760px)',
                height: '82%',
                // Near-solid through the wordmark band, holding ~0.95 opacity
                // well past the name before falling off — so even if a 3D glyph
                // strays up from the lower third it cannot read through
                // "Sam Poplett". Reduced blur keeps the edge from feathering
                // the opaque core away from the text.
                background:
                  'radial-gradient(ellipse 62% 58% at 50% 50%, rgba(13,7,30,0.95) 0%, rgba(13,7,30,0.92) 38%, rgba(13,7,30,0.6) 62%, transparent 80%)',
                filter: 'blur(6px)',
              }}
            />
            <a
              href="#contact"
              className="pointer-events-auto inline-flex items-center gap-2 mb-7 px-4 py-1.5 rounded-full font-mono text-[11px] tracking-widest uppercase transition-colors duration-150"
              style={{
                border: '1px solid rgba(220,206,64,0.45)',
                background: 'rgba(220,206,64,0.08)',
                color: 'var(--accent-citrine)',
              }}
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse-glow"
                style={{ background: 'var(--accent-citrine)' }}
              />
              Open to contracts
            </a>

            <h1
              className="text-5xl sm:text-7xl lg:text-[84px] font-black tracking-tight leading-[0.95] mb-5"
              style={{ color: 'var(--text-primary)' }}
            >
              Sam Poplett
            </h1>

            <p
              className="text-xl sm:text-2xl lg:text-3xl font-light leading-snug max-w-3xl mx-auto"
              style={{ color: 'var(--text-muted)' }}
            >
              I build{' '}
              <span className="font-semibold" style={{ color: 'var(--accent-lilac)' }}>
                AI-powered web apps
              </span>{' '}
              and ship them.
            </p>
          </div>
        </div>

        <div ref={layersRef} data-parallax-layers className="absolute inset-0">

          {/* Layer 1 — 3D hero scene (slowest, no parallax). Mounts lazily
              behind the headline; renders a static poster under reduced
              motion / low-power mobile. */}
          <div
            data-parallax-layer="1"
            className="absolute inset-0"
            style={{ transform: 'scale(1.06)', transformOrigin: 'center center' }}
          >
            <Hero3DScene />
            <div className="bg-grid absolute inset-0 pointer-events-none" />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 35%, rgba(26,15,53,0.75) 100%)' }}
            />
          </div>

          {/* Layer 2 — Context label */}
          <div
            data-parallax-layer="2"
            className="absolute inset-x-0 top-0 flex justify-center pt-28 pointer-events-none"
          >
            <p className="section-label opacity-70">
              <span style={{ color: 'var(--text-muted)' }}>// </span>
              CS with AI · University of Sussex · Year 01
            </p>
          </div>

          {/* Layer 3 — (intentionally empty: the headline now lives in the
              static, no-parallax layer above so it never shifts on 3D load) */}
          <div
            data-parallax-layer="3"
            className="absolute inset-0"
            aria-hidden="true"
          />

          {/* Layer 4 — Stats */}
          <div
            data-parallax-layer="4"
            className="absolute inset-0 flex items-end justify-center pb-48 pointer-events-none"
          >
            <div className="flex items-center justify-center gap-8 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
              {[
                ['4', 'Projects'],
                ['2', 'Hackathons'],
                ['156', 'WPM'],
                ['Shipping', 'Status'],
              ].map(([value, label]) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <span className="text-xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>{value}</span>
                  <span className="tracking-widest uppercase">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Layer 5 — CTAs */}
          <div
            data-parallax-layer="5"
            className="absolute inset-0 flex items-end justify-center pb-28"
          >
            <div className="flex items-center justify-center gap-4">
              <a
                href="#projects"
                className="px-8 py-3 font-bold text-sm rounded font-mono tracking-wider transition-colors duration-150"
                style={{ background: 'var(--accent-citrine)', color: 'var(--bg-deep)' }}
              >
                View Work ↓
              </a>
              <a
                href="https://github.com/011-sam-110"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 text-sm rounded font-mono tracking-wider transition-all duration-150"
                style={{
                  border: '1px solid var(--accent-lilac)',
                  color: 'var(--accent-lilac)',
                }}
              >
                GitHub ↗
              </a>
            </div>
          </div>
        </div>

        {/* WPM counter */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          <div className="pointer-events-auto">
            <WPMCounter />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none">
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase" style={{ color: 'var(--text-muted)' }}>
            First Year · University of Sussex
          </span>
          <span className="text-lg animate-bob" style={{ color: 'var(--accent-lilac)' }}>⌄</span>
        </div>

        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, var(--bg-deep))' }}
        />
      </div>
    </section>
  )
}
