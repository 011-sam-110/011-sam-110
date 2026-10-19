'use client'

import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'

const TerminalCard = dynamic(
  () => import('./TerminalCard').then(m => ({ default: m.TerminalCard })),
  { ssr: false, loading: () => <div style={{ height: 340 }} /> }
)

const STATS = [
  { label: 'University',  value: 'Sussex',       sub: 'CS with AI · Year 1' },
  { label: 'Hackathons',  value: '2 Entered',    sub: '1 Win · Solo submissions' },
  { label: 'Projects',    value: '4 Shipped',    sub: 'All AI-driven' },
  { label: 'Typing',      value: '156 WPM',      sub: 'Top 1% globally' },
  { label: 'Location',    value: 'UK 🇬🇧',        sub: 'University of Sussex' },
  { label: 'Status',      value: 'Shipping',     sub: 'Building things daily' },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}
const item = {
  hidden: { y: 20, opacity: 0 },
  show:   { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 400, damping: 40 } },
}

export function AboutSection() {
  return (
    <section
      id="about"
      style={{ background: 'var(--bg-deep)' }}
      className="py-32 px-8 max-w-6xl mx-auto"
    >
      <div className="mb-16">
        <p className="section-label mb-3">// About</p>
        <h2 className="text-5xl font-black leading-none" style={{ color: 'var(--text-primary)' }}>
          Who I{' '}
          <span style={{ color: 'var(--accent-lilac)' }}>Am.</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left: 3D terminal card */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <TerminalCard />
        </motion.div>

        {/* Right: stat grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-40px' }}
          className="grid grid-cols-2 gap-4"
        >
          {STATS.map(({ label, value, sub }) => (
            <motion.div
              key={label}
              variants={item}
              className="rounded-xl p-5 border transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: 'var(--bg-mid)',
                borderColor: 'rgba(196,174,244,0.15)',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(196,174,244,0.5)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(196,174,244,0.15)')}
            >
              <p className="font-mono text-[10px] tracking-widest uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>
                {label}
              </p>
              <p className="font-black text-xl leading-tight mb-0.5" style={{ color: 'var(--accent-lilac)' }}>
                {value}
              </p>
              <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                {sub}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
