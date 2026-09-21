'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import type { Project } from '@/lib/data'

const SPRING = { type: 'spring' as const, stiffness: 400, damping: 40 }

interface Props {
  project: Project
  index: number
  isHighlighted: boolean
  onOpen: (id: string) => void
}

export function ProjectCard({ project, index, isHighlighted, onOpen }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  // Parallax: metrics panel moves at a different rate than the title
  const metricsY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%'])
  const titleY = useTransform(scrollYProgress, [0, 1], ['4%', '-4%'])

  const isEven = index % 2 === 0

  return (
    <motion.div
      ref={ref}
      layoutId={`card-${project.id}`}
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ ...SPRING, delay: index * 0.08 }}
      className={`relative group flex flex-col lg:flex-row gap-0 border border-zinc-800 rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
        isHighlighted
          ? 'border-cyan-500/60 shadow-cyan'
          : 'hover:border-zinc-600'
      } ${project.featured ? 'border-glow' : ''}`}
      onClick={() => onOpen(project.id)}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.998 }}
    >
      {/* Left: title + tags (parallaxes up slightly) */}
      <motion.div
        style={{ y: titleY }}
        className={`flex-1 p-7 flex flex-col justify-between bg-zinc-950 ${
          isEven ? 'lg:order-1' : 'lg:order-2'
        }`}
      >
        {/* Top */}
        <div>
          {/* Featured badge */}
          {project.featured && (
            <div className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-amber-400 border border-amber-500/30 rounded px-2 py-0.5 mb-4">
              <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
              HACKATHON WINNER · 2026
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {project.tags.map(t => (
              <span
                key={t}
                className="font-mono text-[10px] tracking-widest uppercase px-2 py-0.5 rounded border"
                style={{ borderColor: `${project.color}40`, color: project.color }}
              >
                {t}
              </span>
            ))}
          </div>

          <h3 className="text-xl font-black text-zinc-50 leading-tight mb-2 group-hover:text-white transition-colors">
            {project.title}
          </h3>
          <p className="font-mono text-xs text-zinc-500 mb-4">{project.subtitle}</p>
          <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3">{project.description}</p>
        </div>

        {/* Bottom: stack + action */}
        <div className="mt-6">
          <div className="flex flex-wrap gap-2 mb-5">
            {project.stack.map(s => (
              <span key={s} className="font-mono text-[11px] text-zinc-500 bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5">
                {s}
              </span>
            ))}
          </div>
          <button className="font-mono text-xs text-cyan-400 hover:text-cyan-300 transition-colors tracking-wider uppercase flex items-center gap-2">
            Technical Deep Dive
            <span className="text-lg leading-none">→</span>
          </button>
        </div>
      </motion.div>

      {/* Right: metrics panel (parallaxes down slightly — different rate) */}
      <motion.div
        style={{ y: metricsY }}
        className={`w-full lg:w-72 bg-black/40 border-t lg:border-t-0 border-zinc-800 p-7 flex flex-col justify-between ${
          isEven ? 'lg:order-2 lg:border-l' : 'lg:order-1 lg:border-r'
        }`}
      >
        <div>
          <p className="font-mono text-[10px] tracking-widest text-zinc-600 uppercase mb-4">
            // Metrics
          </p>
          <ul className="space-y-3">
            {project.metrics.map((m, i) => (
              <li key={i} className="flex items-start gap-2">
                <span style={{ color: project.color }} className="font-mono text-xs mt-0.5 shrink-0">
                  [{String(i + 1).padStart(2, '0')}]
                </span>
                <span className="font-mono text-xs text-zinc-300 leading-snug">{m}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Color accent bar */}
        <div
          className="mt-6 h-px w-full opacity-30 group-hover:opacity-70 transition-opacity duration-300"
          style={{ background: `linear-gradient(to right, ${project.color}, transparent)` }}
        />
      </motion.div>
    </motion.div>
  )
}
