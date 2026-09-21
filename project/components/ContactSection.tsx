'use client'

import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import { colors } from '@/lib/theme'
import { BookACall } from './Booking/BookACall'

function DriftingParticles() {
  const pointsRef = useRef<THREE.Points>(null!)

  const { positions, velocities } = useMemo(() => {
    const count = 500
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 20
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10
      pos[i * 3 + 2] = (Math.random() - 0.5) * 5
      vel[i] = 0.002 + Math.random() * 0.004
    }
    return { positions: pos, velocities: vel }
  }, [])

  useFrame(() => {
    if (!pointsRef.current) return
    const attr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
    const pos  = attr.array as Float32Array
    const count = velocities.length

    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += velocities[i]
      if (pos[i * 3 + 1] > 5) pos[i * 3 + 1] = -5
    }
    attr.needsUpdate = true
  })

  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={colors.bgSurface}
        size={0.008}
        sizeAttenuation
        opacity={0.5}
        depthWrite={false}
      />
    </Points>
  )
}

function ContactCanvas() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <Canvas
        dpr={[1, 1]}
        camera={{ position: [0, 0, 6], fov: 60 }}
        gl={{ antialias: false, alpha: true }}
        style={{ background: 'transparent' }}
        frameloop="always"
      >
        <DriftingParticles />
      </Canvas>
    </div>
  )
}

const ContactCanvasDynamic = dynamic(
  () => Promise.resolve(ContactCanvas),
  { ssr: false }
)

const WORDS = ["Let's", 'build', 'something.']

export function ContactSection() {
  return (
    <section
      id="contact"
      style={{ background: 'var(--bg-deep)', position: 'relative', overflow: 'hidden' }}
      className="py-40 px-8"
    >
      <Suspense fallback={null}>
        <ContactCanvasDynamic />
      </Suspense>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Heading */}
        <div
          className="font-black leading-none mb-16 flex flex-wrap gap-x-6"
          style={{ fontSize: 'clamp(48px, 8vw, 120px)' }}
        >
          {WORDS.map((word, i) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 300, damping: 28, delay: i * 0.12 }}
              style={{ color: i === 2 ? 'var(--accent-citrine)' : 'var(--accent-lilac)', display: 'block' }}
            >
              {word}
            </motion.span>
          ))}
        </div>

        {/* Sub-line — honest availability signal */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 30 }}
          className="font-mono text-lg mb-12 flex flex-wrap items-center gap-x-3 gap-y-2"
          style={{ color: 'var(--text-muted)' }}
        >
          <span className="inline-flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: 'var(--accent-citrine)' }}
              aria-hidden
            />
            Open to contracts &amp; grad roles
          </span>
          <span aria-hidden style={{ color: 'rgba(196,174,244,0.3)' }}>·</span>
          <span>Usually reply within a day</span>
        </motion.p>

        {/* Booking — Cal.com inline embed, or styled mailto fallback.
            id/data-testid so the animation probe can scroll to and observe the
            reveal of this exact wrapper (opacity 0->1, y 20->0). */}
        <motion.div
          id="book-a-call"
          data-testid="book-a-call"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.45, type: 'spring', stiffness: 300, damping: 30 }}
          className="mb-12"
        >
          <BookACall />
        </motion.div>

        {/* Secondary CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.55, type: 'spring', stiffness: 300, damping: 30 }}
          className="flex flex-wrap gap-4"
        >
          <motion.a
            href="https://github.com/011-sam-110"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="font-mono text-sm px-8 py-3.5 rounded border transition-all duration-200"
            style={{
              borderColor: 'var(--accent-lilac)',
              color: 'var(--accent-lilac)',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.background = 'var(--accent-lilac)'
              el.style.color = 'var(--bg-deep)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.background = 'transparent'
              el.style.color = 'var(--accent-lilac)'
            }}
          >
            GitHub ↗
          </motion.a>

          <motion.a
            href="mailto:sam.poplett15@gmail.com"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="font-mono text-sm px-8 py-3.5 rounded border transition-all duration-200"
            style={{
              borderColor: 'var(--accent-citrine)',
              color: 'var(--accent-citrine)',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.background = 'var(--accent-citrine)'
              el.style.color = 'var(--bg-deep)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.background = 'transparent'
              el.style.color = 'var(--accent-citrine)'
            }}
          >
            Email →
          </motion.a>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-24 pt-8 border-t text-center" style={{ borderColor: 'rgba(196,174,244,0.1)' }}>
        <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
          © 2026 Sam Poplett · CS with AI @ Sussex · Open to contracts &amp; grad roles ·{' '}
          <a
            href="https://011-sam-110.github.io"
            className="hover:underline"
            style={{ color: 'var(--accent-lilac)' }}
          >
            011-sam-110.github.io
          </a>
        </p>
      </div>
    </section>
  )
}
