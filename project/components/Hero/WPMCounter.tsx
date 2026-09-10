'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

const TARGET_WPM = 156

export function WPMCounter() {
  const [count, setCount] = useState(0)
  const [active, setActive] = useState(false)
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let start: number | null = null
    const duration = 1400

    const tick = (ts: number) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * TARGET_WPM))
      if (progress < 1) requestAnimationFrame(tick)
    }

    setTimeout(() => requestAnimationFrame(tick), 600)
  }, [inView])

  useEffect(() => {
    const interval = setInterval(() => setActive(v => !v), 380)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 40, delay: 1.6 }}
      className="absolute bottom-10 right-8 z-10 select-none"
    >
      <div
        className="backdrop-blur-sm rounded px-4 py-3 font-mono border"
        style={{
          background: 'rgba(26,15,53,0.8)',
          borderColor: 'rgba(196,174,244,0.2)',
        }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] tracking-widest uppercase" style={{ color: 'var(--accent-lilac)', opacity: 0.7 }}>
            Keyboard Mastery
          </span>
          <span
            className="w-1.5 h-1.5 rounded-full transition-colors duration-200"
            style={{ background: active ? 'var(--accent-lilac)' : 'var(--bg-surface)' }}
          />
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl font-bold tabular-nums leading-none" style={{ color: 'var(--text-primary)' }}>
            {count}
          </span>
          <span className="text-sm font-medium" style={{ color: 'var(--accent-lilac)' }}>WPM</span>
        </div>

        <div className="flex gap-0.5 mt-2.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 rounded-[2px] border"
              style={{ borderColor: 'var(--bg-surface)' }}
              animate={{
                background:   Math.random() > 0.6 ? 'var(--accent-lilac)' : 'var(--bg-mid)',
                borderColor:  Math.random() > 0.6 ? 'var(--accent-lilac)' : 'var(--bg-surface)',
              }}
              transition={{ duration: 0.1, delay: i * 0.04 }}
            />
          ))}
        </div>
        <div className="text-[9px] mt-1 tracking-wider" style={{ color: 'var(--text-muted)' }}>LIVE · VERIFIED</div>
      </div>
    </motion.div>
  )
}
