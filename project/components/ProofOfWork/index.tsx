'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion } from 'framer-motion'
import { GitHubGraph } from './GitHubGraph'

const SPRING = { type: 'spring' as const, stiffness: 400, damping: 40 }

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}
const item = {
  hidden: { y: 24, opacity: 0 },
  show: { y: 0, opacity: 1, transition: SPRING },
}

export function ProofOfWork() {
  const sectionRef    = useRef<HTMLElement>(null)
  const headerRef     = useRef<HTMLDivElement>(null)
  const hackCardRef   = useRef<HTMLDivElement>(null)
  const graphRef      = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const section  = sectionRef.current
    const header   = headerRef.current
    const hackCard = hackCardRef.current
    const graph    = graphRef.current
    if (!section || !header || !hackCard || !graph) return

    const triggers: ScrollTrigger[] = []

    // Header drifts up on entry
    const st1 = gsap.fromTo(
      header,
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: header,
          start: 'top 85%',
          end: 'top 40%',
          scrub: 1.8,
        },
      }
    ).scrollTrigger

    // Hackathon card: subtle upward drift as section scrolls through
    const st2 = gsap.to(hackCard, {
      y: -50,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 2.5,
      },
    }).scrollTrigger

    // GitHub graph: slight slower drift (feels deeper)
    const st3 = gsap.to(graph, {
      y: -25,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 3.5,
      },
    }).scrollTrigger

    if (st1) triggers.push(st1)
    if (st2) triggers.push(st2)
    if (st3) triggers.push(st3)

    return () => triggers.forEach(st => st.kill())
  }, [])

  return (
    <section id="proof" ref={sectionRef} className="py-32 px-8 max-w-6xl mx-auto border-t" style={{ borderColor: 'rgba(196,174,244,0.1)' }}>
      {/* Header — GSAP parallax drift */}
      <div ref={headerRef} className="mb-16">
        <p className="section-label mb-3">// Proof of Work</p>
        <h2 className="text-5xl font-black leading-none" style={{ color: 'var(--text-primary)' }}>
          Evidence <span style={{ color: 'var(--accent-lilac)' }}>I Ship.</span>
        </h2>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-40px' }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16"
      >
        {/* Hackathon win card — GSAP vertical drift */}
        <motion.div variants={item}>
          <div ref={hackCardRef} className="relative border-glow rounded-xl overflow-hidden h-full">
            <div className="bg-zinc-950 p-7 h-full rounded-xl flex flex-col">
              <div className="flex items-center gap-2 mb-5">
                <div className="animate-pulse-glow px-3 py-1 rounded-full border border-amber-500/40 bg-amber-500/10">
                  <span className="font-mono text-[11px] tracking-widest text-amber-400 uppercase">
                    Hackathon Finalist · Solo Build
                  </span>
                </div>
              </div>

              <h3 className="text-xl font-black text-zinc-50 mb-1">Silent Data Hackathon 2026</h3>
              <p className="font-mono text-xs text-zinc-500 mb-4">
                AI-Powered Banking Compliance · University Challenge
              </p>

              <p className="text-zinc-400 text-sm leading-relaxed mb-5">
                Built a three-layer AI compliance platform evaluating banking documents in real-time — AML/KYC rules engine, Markov default model, and Gemini 2.0 Flash narrative. SHA-256 blockchain audit trail included.
              </p>

              <div className="grid grid-cols-3 gap-3 mt-auto">
                {[
                  { label: 'Status', value: 'Shipped' },
                  { label: 'Team', value: 'Solo' },
                  { label: 'Duration', value: '48h' },
                ].map(({ label, value }) => (
                  <div key={label} className="border border-zinc-800 rounded p-3 text-center">
                    <div className="text-2xl font-black text-cyan-400 tabular-nums">{value}</div>
                    <div className="font-mono text-[10px] text-zinc-500 tracking-wider uppercase mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 h-px bg-gradient-to-r from-cyan-500/60 via-cyan-400/80 to-cyan-500/60 animate-pulse-glow" />
            </div>
          </div>
        </motion.div>

        {/* Stats column */}
        <motion.div variants={item} className="flex flex-col gap-4">
          {[
            { label: 'Keyboard Speed',        value: '156 WPM',          sub: 'Top 1% globally · MonkeyType verified', color: '#06b6d4', icon: '⌨' },
            { label: 'AI Projects Shipped',   value: '4 Projects',        sub: 'All in production or demo-ready',      color: '#8b5cf6', icon: '🤖' },
            { label: 'Hackathons Entered',     value: '2 Solo Builds',     sub: 'Built & submitted under 48h each',     color: '#f59e0b', icon: '⚡' },
          ].map(({ label, value, sub, color, icon }) => (
            <div
              key={label}
              className="border border-zinc-800 hover:border-zinc-600 rounded-xl p-5 flex items-center gap-5 transition-all duration-200 bg-zinc-950/50 hover:bg-zinc-950"
            >
              <div className="text-3xl">{icon}</div>
              <div className="flex-1">
                <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase mb-0.5">{label}</p>
                <p className="font-black text-lg text-zinc-50" style={{ color }}>{value}</p>
                <p className="font-mono text-xs text-zinc-600">{sub}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* GitHub graph — GSAP drift */}
      <div ref={graphRef}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={SPRING}
          className="border border-zinc-800 rounded-xl p-6 bg-zinc-950/50"
        >
          <div className="flex items-center gap-3 mb-6">
            <p className="section-label">// GitHub Activity</p>
            <span className="font-mono text-[10px] text-zinc-600">011-sam-110</span>
          </div>
          <GitHubGraph />
        </motion.div>
      </div>
    </section>
  )
}
