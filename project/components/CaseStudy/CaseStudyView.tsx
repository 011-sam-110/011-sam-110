'use client'

import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { fadeUpVariants, staggerContainerVariants } from '@/lib/motion'
import type { CaseStudyEntry } from '@/lib/caseStudies'

interface Props {
  study: CaseStudyEntry
}

/**
 * Long-form, scannable case-study page body: an at-a-glance stat header
 * followed by problem → approach → architecture → result, then a
 * with-rationale stack list and the code/demo links.
 *
 * Presentational only — all content comes from lib/caseStudies.ts. Section
 * reveals animate on scroll and collapse to an instant cut under reduced motion
 * via the shared variants from lib/motion.ts.
 */
export function CaseStudyView({ study }: Props) {
  const reduced = useReducedMotion()
  const fadeUp = fadeUpVariants(reduced)
  const stagger = staggerContainerVariants(reduced)
  const { project } = study
  const accent = project.color

  return (
    <main
      style={{ background: 'var(--bg-deep)' }}
      className="min-h-screen px-6 pb-32 pt-24 sm:px-8"
    >
      <article className="mx-auto max-w-3xl">
        {/* Back link */}
        <a
          href="/#projects"
          className="font-mono text-xs tracking-wider text-[var(--text-muted)] transition-colors hover:text-[var(--accent-lilac)] focus-visible:text-[var(--accent-lilac)]"
        >
          ← Back to projects
        </a>

        {/* ---- Title + at-a-glance header ---- */}
        <motion.header
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mt-8 border-b pb-10"
          style={{ borderColor: 'rgba(196,174,244,0.12)' }}
        >
          <motion.p
            variants={fadeUp}
            className="section-label mb-3"
            style={{ color: accent }}
          >
            // Case Study
          </motion.p>

          <motion.h1
            variants={fadeUp}
            className="text-4xl font-black leading-none sm:text-5xl"
            style={{ color: 'var(--text-primary)' }}
          >
            {project.title}
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-3 font-mono text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            {project.subtitle}
          </motion.p>

          {/* Headline metric */}
          <motion.div variants={fadeUp} className="mt-8 flex items-baseline gap-3">
            <span className="text-4xl font-black sm:text-5xl" style={{ color: accent }}>
              {study.headlineMetric.value}
            </span>
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--text-muted)]">
              {study.headlineMetric.label}
            </span>
          </motion.div>

          {/* Fact chips: role / timeline / context */}
          <motion.dl variants={fadeUp} className="mt-6 flex flex-wrap gap-3">
            {study.facts.map(fact => (
              <div
                key={fact.label}
                className="rounded-lg border px-3 py-2"
                style={{ background: 'var(--bg-mid)', borderColor: 'rgba(196,174,244,0.15)' }}
              >
                <dt className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                  {fact.label}
                </dt>
                <dd className="mt-0.5 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {fact.value}
                </dd>
              </div>
            ))}
          </motion.dl>

          {/* Stack chips */}
          <motion.div variants={fadeUp} className="mt-6 flex flex-wrap gap-2">
            {project.stack.map(s => (
              <span
                key={s}
                className="rounded border px-3 py-1 font-mono text-xs"
                style={{ borderColor: `${accent}40`, color: accent }}
              >
                {s}
              </span>
            ))}
          </motion.div>

          {/* Top-of-page links */}
          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded border px-5 py-2.5 font-mono text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2"
              style={{ borderColor: `${accent}80`, color: accent }}
            >
              View Source Code ↗
            </a>
          </motion.div>
        </motion.header>

        {/* ---- Narrative sections ---- */}
        <Section
          accent={accent}
          fadeUp={fadeUp}
          stagger={stagger}
          label="01"
          title="The Problem"
        >
          <p className="leading-relaxed text-[var(--text-primary)]">{study.problem}</p>
        </Section>

        <Section
          accent={accent}
          fadeUp={fadeUp}
          stagger={stagger}
          label="02"
          title="The Approach"
        >
          <p className="leading-relaxed text-[var(--text-primary)]">{study.approach}</p>
          <PointList points={study.approachPoints} accent={accent} fadeUp={fadeUp} />
        </Section>

        <Section
          accent={accent}
          fadeUp={fadeUp}
          stagger={stagger}
          label="03"
          title="Architecture"
        >
          <p className="leading-relaxed text-[var(--text-primary)]">{study.architecture}</p>
          <PointList points={study.architecturePoints} accent={accent} fadeUp={fadeUp} />
        </Section>

        <Section
          accent={accent}
          fadeUp={fadeUp}
          stagger={stagger}
          label="04"
          title="Result"
        >
          <p className="leading-relaxed text-[var(--text-primary)]">{study.result}</p>

          {/* Quantifiable metrics, lifted from data.ts */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-40px' }}
            className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            {project.metrics.map(metric => (
              <motion.div
                key={metric}
                variants={fadeUp}
                className="rounded-lg border bg-[var(--bg-mid)] p-3 font-mono text-sm text-[var(--text-primary)]"
                style={{ borderColor: 'rgba(196,174,244,0.15)' }}
              >
                <span style={{ color: accent }} className="mr-2">
                  →
                </span>
                {metric}
              </motion.div>
            ))}
          </motion.div>
        </Section>

        {/* ---- Stack with rationale ---- */}
        <Section
          accent={accent}
          fadeUp={fadeUp}
          stagger={stagger}
          label="05"
          title="Stack & Why"
        >
          <motion.ul
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-40px' }}
            className="flex flex-col gap-3"
          >
            {study.stack.map(choice => (
              <motion.li
                key={choice.name}
                variants={fadeUp}
                className="rounded-lg border bg-[var(--bg-mid)] p-4"
                style={{ borderColor: 'rgba(196,174,244,0.12)' }}
              >
                <p className="font-mono text-sm font-bold" style={{ color: accent }}>
                  {choice.name}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">
                  {choice.rationale}
                </p>
              </motion.li>
            ))}
          </motion.ul>
        </Section>

        {/* ---- Footer CTA ---- */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-40px' }}
          className="mt-16 border-t pt-10"
          style={{ borderColor: 'rgba(196,174,244,0.12)' }}
        >
          <div className="flex flex-wrap items-center gap-4">
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded border px-5 py-2.5 font-mono text-sm transition-colors duration-200"
              style={{ borderColor: `${accent}80`, color: accent }}
            >
              View Source Code ↗
            </a>
            <a
              href="/#projects"
              className="font-mono text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--accent-lilac)]"
            >
              ← All projects
            </a>
          </div>
        </motion.div>
      </article>
    </main>
  )
}

// ---------------------------------------------------------------------------
// Section primitives
// ---------------------------------------------------------------------------

interface SectionProps {
  accent: string
  // Variants objects from lib/motion — typed loosely to avoid re-importing the
  // framer-motion Variants type here; they are passed straight through.
  fadeUp: ReturnType<typeof fadeUpVariants>
  stagger: ReturnType<typeof staggerContainerVariants>
  label: string
  title: string
  children: React.ReactNode
}

/** A numbered, reveal-on-scroll narrative section. */
function Section({ accent, fadeUp, stagger, label, title, children }: SectionProps) {
  return (
    <motion.section
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      className="mt-14"
    >
      <motion.div variants={fadeUp} className="mb-4 flex items-center gap-3">
        <span className="font-mono text-xs font-bold" style={{ color: accent }}>
          {label}
        </span>
        <h2 className="text-xl font-black sm:text-2xl" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h2>
      </motion.div>
      <motion.div variants={fadeUp}>{children}</motion.div>
    </motion.section>
  )
}

interface PointListProps {
  points: string[]
  accent: string
  fadeUp: ReturnType<typeof fadeUpVariants>
}

/** Bulleted key-moves list under a narrative paragraph. */
function PointList({ points, accent, fadeUp }: PointListProps) {
  return (
    <ul className="mt-4 flex flex-col gap-2">
      {points.map(point => (
        <motion.li
          key={point}
          variants={fadeUp}
          className="flex gap-3 text-sm leading-relaxed text-[var(--text-muted)]"
        >
          <span className="mt-0.5 shrink-0 font-mono" style={{ color: accent }} aria-hidden>
            →
          </span>
          <span>{point}</span>
        </motion.li>
      ))}
    </ul>
  )
}
