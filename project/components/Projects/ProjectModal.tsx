'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { projects } from '@/lib/data'

const SPRING = { type: 'spring' as const, stiffness: 400, damping: 40 }

interface Props {
  projectId: string | null
  onClose: () => void
}

export function ProjectModal({ projectId, onClose }: Props) {
  const project = projects.find(p => p.id === projectId) ?? null

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = projectId ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [projectId])

  return (
    <AnimatePresence>
      {project && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200]"
            onClick={onClose}
          />

          {/* Modal panel */}
          <motion.div
            key={`modal-${project.id}`}
            layoutId={`card-${project.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={SPRING}
            className="fixed inset-x-4 top-[5vh] bottom-[5vh] max-w-3xl mx-auto z-[201] overflow-y-auto rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col"
          >
            {/* Header */}
            <div
              className="sticky top-0 flex items-start justify-between p-6 pb-4 bg-zinc-950 border-b border-zinc-900 z-10"
            >
              <div>
                <div className="section-label mb-1" style={{ color: project.color }}>
                  // Technical Deep Dive
                </div>
                <h2 className="text-2xl font-black text-zinc-50">{project.title}</h2>
                <p className="text-zinc-500 text-sm font-mono mt-0.5">{project.subtitle}</p>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-500 hover:text-zinc-200 transition-colors font-mono text-sm border border-zinc-800 rounded px-3 py-1.5 hover:border-zinc-600"
              >
                [ESC]
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex flex-col gap-8">
              {/* The Why */}
              <section>
                <h3 className="font-mono text-xs tracking-widest text-cyan-400 uppercase mb-3">
                  // The Problem
                </h3>
                <p className="text-zinc-300 leading-relaxed">{project.why}</p>
              </section>

              {/* Quantifiable Metrics */}
              <section>
                <h3 className="font-mono text-xs tracking-widest text-cyan-400 uppercase mb-3">
                  // Quantifiable Metrics
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {project.metrics.map((m, i) => (
                    <div
                      key={i}
                      className="border border-zinc-800 rounded p-3 bg-zinc-900/50 font-mono text-sm text-zinc-200"
                    >
                      <span style={{ color: project.color }} className="mr-2">→</span>
                      {m}
                    </div>
                  ))}
                </div>
              </section>

              {/* Full Description */}
              <section>
                <h3 className="font-mono text-xs tracking-widest text-cyan-400 uppercase mb-3">
                  // Architecture
                </h3>
                <p className="text-zinc-400 leading-relaxed">{project.description}</p>
              </section>

              {/* Tech Stack */}
              <section>
                <h3 className="font-mono text-xs tracking-widest text-cyan-400 uppercase mb-3">
                  // Stack
                </h3>
                <div className="flex flex-wrap gap-2">
                  {project.stack.map(s => (
                    <span
                      key={s}
                      className="font-mono text-xs px-3 py-1.5 rounded border"
                      style={{ borderColor: `${project.color}40`, color: project.color }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </section>

              {/* CTA */}
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="self-start px-6 py-3 border border-cyan-500/50 text-cyan-400 font-mono text-sm rounded hover:bg-cyan-500/10 transition-colors duration-200"
              >
                View Source Code ↗
              </a>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
