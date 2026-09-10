'use client'

import { useRef, useMemo, useState, useEffect, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Html, RoundedBox, Text, OrbitControls } from '@react-three/drei'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import { colors } from '@/lib/theme'

const SKILLS = {
  languages: { color: colors.lilac,   items: ['Python', 'JavaScript', 'Java', 'C', 'HTML', 'CSS'] },
  aiml:      { color: colors.citrine, items: ['GPT-4o', 'Gemini 2.0', 'OpenCV', 'NumPy', 'Computer Vision', 'Agentic Systems'] },
  web:       { color: colors.mauve,   items: ['FastAPI', 'Streamlit', 'Git', 'GitHub', 'VS Code', 'Linux', 'Bash'] },
  cs:        { color: colors.textMuted, items: ['Algorithms', 'Data Structures', 'OOP', 'Multithreading', 'System Design'] },
} as const

const CLUSTER_CENTERS: Record<string, [number, number, number]> = {
  languages: [-3, 0.5, 0],
  aiml:      [0, 1.5, -1],
  web:       [3, 0, 0],
  cs:        [0, -1.5, 0],
}

function jitter(base: number): number {
  return base + (Math.random() - 0.5) * 1.6
}

interface SkillPillProps {
  label:    string
  position: [number, number, number]
  color:    string
}

function SkillPill({ label, position, color }: SkillPillProps) {
  const meshRef   = useRef<THREE.Mesh>(null!)
  const [hovered, setHovered] = useState(false)
  const scaleRef = useRef(1)

  useFrame(() => {
    const target = hovered ? 1.3 : 1.0
    scaleRef.current += (target - scaleRef.current) * 0.12
    if (meshRef.current) meshRef.current.scale.setScalar(scaleRef.current)
  })

  return (
    <Float speed={1.2 + Math.random() * 0.8} rotationIntensity={0.1} floatIntensity={0.4}>
      <group position={position}>
        <RoundedBox
          ref={meshRef}
          args={[1.4, 0.42, 0.12]}
          radius={0.12}
          smoothness={4}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
        >
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={hovered ? 0.4 : 0.08}
            metalness={0.2}
            roughness={0.5}
            transparent
            opacity={hovered ? 0.95 : 0.7}
          />
        </RoundedBox>

        <Suspense fallback={null}>
          <Text
            position={[0, 0, 0.08]}
            fontSize={0.13}
            color={hovered ? '#1a0f35' : colors.textPrimary}
            anchorX="center"
            anchorY="middle"
          >
            {label}
          </Text>
        </Suspense>

        {hovered && (
          <Html position={[0, 0.42, 0]} center>
            <div
              className="font-mono text-[10px] px-2 py-0.5 rounded pointer-events-none whitespace-nowrap"
              style={{ background: color, color: '#1a0f35' }}
            >
              {label}
            </div>
          </Html>
        )}
      </group>
    </Float>
  )
}

function SkillsCloud() {
  const pills = useMemo(() => {
    const result: { label: string; position: [number, number, number]; color: string }[] = []
    for (const [group, { color, items }] of Object.entries(SKILLS)) {
      const center = CLUSTER_CENTERS[group]
      for (const item of items) {
        result.push({
          label: item,
          color,
          position: [jitter(center[0]), jitter(center[1]), jitter(center[2])],
        })
      }
    }
    return result
  }, [])

  return (
    <>
      {pills.map(({ label, position, color }) => (
        <SkillPill key={label} label={label} position={position} color={color} />
      ))}
    </>
  )
}

function SkillsCanvas() {
  return (
    <div style={{ width: '100%', height: '60vh', minHeight: 400 }}>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 7], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} color={colors.lilac} />
        <directionalLight position={[-5, -2, 2]} intensity={0.4} color={colors.citrine} />

        <SkillsCloud />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.4}
        />
      </Canvas>
    </div>
  )
}

// Mobile fallback
function SkillsMobile() {
  return (
    <div className="space-y-6">
      {Object.entries(SKILLS).map(([group, { color, items }]) => (
        <div key={group}>
          <p className="font-mono text-[11px] tracking-widest uppercase mb-3" style={{ color }}>
            {group}
          </p>
          <div className="flex flex-wrap gap-2">
            {items.map(item => (
              <span
                key={item}
                className="font-mono text-xs px-3 py-1.5 rounded-full border"
                style={{ borderColor: `${color}40`, color, background: `${color}15` }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

const SkillsCanvasDynamic = dynamic(
  () => Promise.resolve(SkillsCanvas),
  { ssr: false, loading: () => <div style={{ height: '60vh' }} /> }
)

export function SkillsSection() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])

  return (
    <section
      id="skills"
      className="py-32 px-8 border-t"
      style={{ borderColor: 'rgba(196,174,244,0.1)' }}
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="mb-12"
        >
          <p className="section-label mb-3">// Skills</p>
          <h2 className="text-5xl font-black leading-none" style={{ color: 'var(--text-primary)' }}>
            Tech{' '}
            <span style={{ color: 'var(--accent-lilac)' }}>Cloud.</span>
          </h2>
          <p className="font-mono text-sm mt-4" style={{ color: 'var(--text-muted)' }}>
            Drag to explore · Hover pills for detail
          </p>
        </motion.div>

        {isMobile ? <SkillsMobile /> : <SkillsCanvasDynamic />}

        {/* Legend */}
        <div className="flex flex-wrap gap-6 mt-8">
          {Object.entries(SKILLS).map(([group, { color }]) => (
            <div key={group} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="font-mono text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {group}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
