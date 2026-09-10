'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { techStack } from '@/lib/data'

interface Props {
  hoveredTech: string | null
  setHoveredTech: (t: string | null) => void
}

const SPRING = { type: 'spring' as const, stiffness: 400, damping: 40 }

const GROUP_COLORS: Record<string, string> = {
  Languages: '#06b6d4',
  'AI / ML': '#8b5cf6',
  'Tools & Infra': '#10b981',
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}
const item = {
  hidden: { y: 16, opacity: 0 },
  show: { y: 0, opacity: 1, transition: SPRING },
}

export function TechStack({ hoveredTech, setHoveredTech }: Props) {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const section = sectionRef.current
    const header  = headerRef.current
    if (!section || !header) return

    const triggers: ScrollTrigger[] = []

    // Header: scrubbed reveal as it enters viewport
    const st0 = gsap.fromTo(
      header,
      { y: 50, opacity: 0 },
      {
        y: 0, opacity: 1, ease: 'none',
        scrollTrigger: {
          trigger: header,
          start: 'top 88%',
          end: 'top 38%',
          scrub: 1.5,
        },
      }
    ).scrollTrigger

    // Columns: different drift rates create depth (col 0 slowest → col 2 fastest)
    const cols = section.querySelectorAll<HTMLElement>('[data-tech-col]')
    cols.forEach((col, i) => {
      const st = gsap.to(col, {
        y: -(18 + i * 14),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 2.5 - i * 0.4,
        },
      }).scrollTrigger
      if (st) triggers.push(st)
    })

    if (st0) triggers.push(st0)
    return () => triggers.forEach(st => st.kill())
  }, [])

  return (
    <section id="stack" ref={sectionRef} className="py-32 px-8 max-w-6xl mx-auto border-t" style={{ borderColor: 'rgba(196,174,244,0.1)' }}>
      {/* Header — GSAP scrub reveal */}
      <div ref={headerRef} className="mb-16">
        <p className="section-label mb-3">// Stack</p>
        <h2 className="text-5xl font-black leading-none" style={{ color: 'var(--text-primary)' }}>
          Tech <span style={{ color: 'var(--accent-lilac)' }}>Stack.</span>
        </h2>
        <p className="text-sm font-mono mt-4" style={{ color: 'var(--text-muted)' }}>
          Hover a technology to highlight related projects above.
        </p>
      </div>

      {/* Logic-grouped grid — each column wrapped for GSAP depth parallax */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-40px' }}
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        {Object.entries(techStack).map(([group, items]) => {
          const color = GROUP_COLORS[group] ?? '#06b6d4'
          return (
            <div key={group} data-tech-col>
            <motion.div variants={item}>
              {/* Group label */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1 h-5 rounded-full" style={{ background: color }} />
                <p
                  className="font-mono text-xs tracking-widest uppercase font-bold"
                  style={{ color }}
                >
                  {group}
                </p>
              </div>

              {/* Tech items */}
              <div className="space-y-2">
                {items.map(tech => {
                  const isHovered = hoveredTech === tech.name
                  const isDimmed = hoveredTech !== null && !isHovered
                  const hasProjects = tech.relatedProjects.length > 0

                  return (
                    <motion.div
                      key={tech.name}
                      onMouseEnter={() => setHoveredTech(tech.name)}
                      onMouseLeave={() => setHoveredTech(null)}
                      animate={{
                        opacity: isDimmed ? 0.3 : 1,
                        x: isHovered ? 6 : 0,
                      }}
                      transition={{ duration: 0.18 }}
                      className="flex items-center justify-between px-4 py-2.5 rounded border border-zinc-800 hover:border-zinc-600 transition-colors group"
                      style={{
                        background: isHovered ? `${color}08` : 'transparent',
                        borderColor: isHovered ? `${color}40` : undefined,
                      }}
                    >
                      <span
                        className="font-mono text-sm transition-colors"
                        style={{ color: isHovered ? color : '#a1a1aa' }}
                      >
                        {tech.name}
                      </span>
                      {hasProjects && (
                        <span
                          className="font-mono text-[10px] tracking-wider transition-colors"
                          style={{ color: isHovered ? color : '#3f3f46' }}
                        >
                          {tech.relatedProjects.length} project{tech.relatedProjects.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
            </div>
          )
        })}
      </motion.div>
    </section>
  )
}
