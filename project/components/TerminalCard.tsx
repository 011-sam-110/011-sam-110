'use client'

import { useRef, useState, useEffect, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Float, Text, RoundedBox } from '@react-three/drei'
import { colors } from '@/lib/theme'

const TERMINAL_LINES = [
  '> whoami',
  '011-sam-110 — CS with AI @ Sussex',
  '',
  '> cat interests.txt',
  'AI agents, ML systems, hackathons',
  '',
  '> echo $STATUS',
  'Building. Learning. Shipping.',
]

function TerminalScene() {
  const [revealed, setRevealed] = useState<string[]>([])
  const lineIndex = useRef(0)
  const charIndex = useRef(0)

  useEffect(() => {
    const interval = setInterval(() => {
      const line = TERMINAL_LINES[lineIndex.current]
      if (line === undefined) { clearInterval(interval); return }

      if (line === '') {
        setRevealed(prev => [...prev, ''])
        lineIndex.current++
        charIndex.current = 0
        return
      }

      charIndex.current++
      const partial = line.slice(0, charIndex.current)
      setRevealed(prev => {
        const next = [...prev]
        next[lineIndex.current] = partial
        return next
      })

      if (charIndex.current >= line.length) {
        lineIndex.current++
        charIndex.current = 0
      }
    }, 40)

    return () => clearInterval(interval)
  }, [])

  const lineColor = (line: string) => {
    if (line.startsWith('>')) return colors.citrine
    if (line === '') return colors.bgMid
    return colors.lilac
  }

  return (
    <Float speed={1.4} rotationIntensity={0.08} floatIntensity={0.3}>
      {/* Card body */}
      <RoundedBox args={[3.6, 2.6, 0.12]} radius={0.06} smoothness={4} position={[0, 0, 0]}>
        <meshStandardMaterial color={colors.bgMid} metalness={0.1} roughness={0.6} />
      </RoundedBox>

      {/* Title bar */}
      <RoundedBox args={[3.6, 0.32, 0.13]} radius={0.04} smoothness={4} position={[0, 1.14, 0]}>
        <meshStandardMaterial color={colors.bgSurface} />
      </RoundedBox>

      {/* Traffic lights */}
      {[[-1.55, '#e05252'], [-1.25, '#e0b152'], [-0.95, '#52c852']].map(([x, col], i) => (
        <mesh key={i} position={[x as number, 1.14, 0.09]}>
          <circleGeometry args={[0.06, 16]} />
          <meshStandardMaterial color={col as string} />
        </mesh>
      ))}

      {/* Terminal text lines */}
      {revealed.map((line, i) => (
        line !== '' && (
          <Suspense fallback={null} key={i}>
            <Text
              position={[-1.6, 0.75 - i * 0.28, 0.1]}
              fontSize={0.13}
              color={lineColor(line)}
              anchorX="left"
              anchorY="middle"
              maxWidth={3.2}
            >
              {line}
            </Text>
          </Suspense>
        )
      ))}
    </Float>
  )
}

export function TerminalCard() {
  return (
    <div style={{ width: '100%', height: '340px' }}>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 4.5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 3, 3]} intensity={1} color={colors.lilac} />
        <directionalLight position={[-2, -1, 2]} intensity={0.4} color={colors.citrine} />
        <TerminalScene />
      </Canvas>
    </div>
  )
}
