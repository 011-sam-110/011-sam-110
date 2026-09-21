'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion } from 'framer-motion'
import { projects, techStack } from '@/lib/data'
import { ProjectCard } from './ProjectCard'
import { ProjectModal } from './ProjectModal'

interface Props {
  hoveredTech: string | null
  openProject: string | null
  setOpenProject: (id: string | null) => void
}

function getHighlightedProjects(tech: string | null): string[] {
  if (!tech) return []
  for (const group of Object.values(techStack)) {
    const item = group.find(t => t.name === tech)
    if (item) return item.relatedProjects
  }
  return []
}

const SPRING = { type: 'spring' as const, stiffness: 400, damping: 40 }

export function Projects({ hoveredTech, openProject, setOpenProject }: Props) {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef  = useRef<HTMLDivElement>(null)
  const highlighted = getHighlightedProjects(hoveredTech)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const header  = headerRef.current
    const section = sectionRef.current
    if (!header || !section) return

    // Section header drifts up as it enters the viewport
    const st1 = gsap.fromTo(
      header,
      { y: 60, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: header,
          start: 'top 85%',
          end: 'top 35%',
          scrub: 1.8,
        },
      }
    ).scrollTrigger

    return () => {
      st1?.kill()
    }
  }, [])

  return (
    <section id="projects" ref={sectionRef} className="py-32 px-8 max-w-6xl mx-auto border-t" style={{ borderColor: 'rgba(196,174,244,0.1)' }}>
      {/* Header — GSAP parallax drift */}
      <div ref={headerRef} className="mb-16">
        <p className="section-label mb-3">// 004 Projects</p>
        <h2 className="text-5xl font-black leading-none" style={{ color: 'var(--text-primary)' }}>
          What I&apos;ve{' '}
          <span style={{ color: 'var(--accent-lilac)' }}>Built.</span>
        </h2>
        <p className="text-sm font-mono mt-4 max-w-lg" style={{ color: 'var(--text-muted)' }}>
          Each project emphasizes{' '}
          <span className="text-zinc-300">The Why</span> and{' '}
          <span className="text-zinc-300">Quantifiable Metrics</span> — not just what was built, but why it matters.
        </p>
      </div>

      {/* Hover tech hint */}
      {hoveredTech && (
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={SPRING}
          className="font-mono text-xs text-cyan-400 mb-6 tracking-wider"
        >
          Filtering by: <span className="text-zinc-50">{hoveredTech}</span>
          {highlighted.length === 0 && ' — no direct project link'}
        </motion.p>
      )}

      {/* Cards */}
      <div className="flex flex-col gap-6">
        {projects.map((project, i) => (
          <motion.div
            key={project.id}
            animate={{
              opacity: highlighted.length === 0 || highlighted.includes(project.id) ? 1 : 0.25,
              scale:   highlighted.length > 0 && highlighted.includes(project.id) ? 1.005 : 1,
            }}
            transition={{ duration: 0.25 }}
          >
            <ProjectCard
              project={project}
              index={i}
              isHighlighted={highlighted.includes(project.id)}
              onOpen={setOpenProject}
            />
          </motion.div>
        ))}
      </div>

      <ProjectModal projectId={openProject} onClose={() => setOpenProject(null)} />
    </section>
  )
}
