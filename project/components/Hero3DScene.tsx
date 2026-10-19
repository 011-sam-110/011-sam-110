'use client'

import { useRef, useMemo, useState, useEffect, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Text3D, Grid, Points, PointMaterial, Center } from '@react-three/drei'
import { EffectComposer, Bloom, DepthOfField } from '@react-three/postprocessing'
import * as THREE from 'three'
import { colors } from '@/lib/theme'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const IS_MOBILE = typeof window !== 'undefined' && window.innerWidth < 768
const PARTICLE_COUNT = IS_MOBILE ? 600 : 2000

/**
 * `navigator.deviceMemory` is only exposed on Chromium and is the cheapest
 * honest signal of a low-power device. Treat any mobile reporting <=4GB (or
 * not reporting at all) as low-power so the 3D never becomes a Lighthouse
 * liability on the phones hiring managers actually browse on.
 */
function isLowPowerDevice(): boolean {
  if (typeof window === 'undefined') return false
  if (!IS_MOBILE) return false
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  return mem === undefined || mem <= 4
}

function HeroText() {
  const groupRef = useRef<THREE.Group>(null!)
  const matRef   = useRef<THREE.MeshStandardMaterial>(null!)
  const [hovered, setHovered] = useState(false)

  const targetColor = useRef(new THREE.Color(colors.lilac))
  const currentScale = useRef(1)

  useEffect(() => {
    targetColor.current.set(hovered ? colors.citrine : colors.lilac)
  }, [hovered])

  useFrame((_, delta) => {
    if (!groupRef.current || !matRef.current) return

    // Slow Y-axis rotation
    groupRef.current.rotation.y += 0.003 * delta * 60

    // Lerp color
    matRef.current.color.lerp(targetColor.current, 0.06)

    // Lerp scale
    const targetS = hovered ? 1.05 : 1.0
    currentScale.current += (targetS - currentScale.current) * 0.1
    groupRef.current.scale.setScalar(currentScale.current)
  })

  return (
    // Pushed well below center and scaled down so the rotating "011-sam-110"
    // wordmark sits in the lower third of the canvas, clear of the DOM
    // "Sam Poplett" headline (centered at camera y). The previous y=-1.7 still
    // threaded the glyphs through the name at camera position [0,0.4,7] / fov 60;
    // y=-3.2 + scale 0.62 keeps the mesh entirely beneath the wordmark band so
    // there is no double-exposure smear over the candidate name.
    <group ref={groupRef} position={[0, -3.2, 0]} scale={0.62}>
      <Center>
        <Suspense fallback={null}>
          <Text3D
            font="/fonts/helvetiker_bold.typeface.json"
            size={0.65}
            height={0.08}
            bevelEnabled
            bevelThickness={0.02}
            bevelSize={0.015}
            bevelSegments={4}
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
          >
            011-sam-110
            <meshStandardMaterial
              ref={matRef}
              color={colors.lilac}
              metalness={0.4}
              roughness={0.2}
              emissive={colors.lilac}
              emissiveIntensity={0.08}
            />
          </Text3D>
        </Suspense>
      </Center>
    </group>
  )
}

function ParticleSphere() {
  const groupRef = useRef<THREE.Group>(null!)

  const positions = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const r     = 8 * Math.cbrt(Math.random())
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
    }
    return pos
  }, [])

  useFrame(() => {
    if (groupRef.current) groupRef.current.rotation.y += 0.0005
  })

  return (
    <group ref={groupRef}>
      <Points positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color={colors.lilac}
          size={0.015}
          sizeAttenuation
          opacity={0.6}
          depthWrite={false}
        />
      </Points>
    </group>
  )
}

function CameraRig({ mouseRef }: { mouseRef: React.RefObject<{ x: number; y: number }> }) {
  const { camera } = useThree()

  useFrame(() => {
    if (!mouseRef.current) return
    camera.position.x += (mouseRef.current.x * 0.3 - camera.position.x) * 0.05
    camera.position.y += (mouseRef.current.y * 0.3 - camera.position.y) * 0.05
  })

  return null
}

/**
 * Releases the GPU only when the TAB is hidden (a confirmed, unambiguous
 * signal), then resumes the always-on loop when it returns. Runs INSIDE the
 * Canvas so it drives the renderer's own frameloop via `setFrameloop` —
 * pausing rendering (rather than unmounting) keeps the WebGL context warm.
 *
 * Deliberately does NOT gate on an IntersectionObserver: observing the inner
 * scaled+sticky container misfired under headless/lazy-mount capture and froze
 * the scene at `isIntersecting=false`. Visibility-only is safe — at mount the
 * tab is visible, so the loop always starts.
 */
function VisibilityFrameloop() {
  const setFrameloop = useThree((s) => s.setFrameloop)

  useEffect(() => {
    const onVisibility = () => {
      setFrameloop(document.hidden ? 'never' : 'always')
    }
    document.addEventListener('visibilitychange', onVisibility)
    // Ensure we start running even if a prior 'never' lingered.
    setFrameloop(document.hidden ? 'never' : 'always')
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [setFrameloop])

  return null
}

/**
 * Static, GPU-cheap stand-in for the 3D scene. Shown under reduced-motion or
 * on low-power mobile so the hero is never a perf liability — pure CSS/SVG,
 * no WebGL context, no animation loop. Mirrors the lilac/citrine brand and the
 * `011-sam-110` wordmark so the visual identity is preserved.
 */
function HeroPoster() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      aria-hidden="true"
      style={{
        background: `radial-gradient(ellipse 70% 55% at 50% 42%, ${colors.bgSurface}55 0%, transparent 60%)`,
      }}
    >
      <svg
        className="w-[min(90%,640px)]"
        viewBox="0 0 640 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="hero-poster-grad" x1="0" y1="0" x2="640" y2="200" gradientUnits="userSpaceOnUse">
            <stop stopColor={colors.lilac} />
            <stop offset="1" stopColor={colors.citrine} />
          </linearGradient>
        </defs>
        <text
          x="320"
          y="118"
          textAnchor="middle"
          fontFamily="var(--font-mono), monospace"
          fontWeight="700"
          fontSize="56"
          letterSpacing="2"
          fill="url(#hero-poster-grad)"
        >
          011-sam-110
        </text>
      </svg>
    </div>
  )
}

function Scene({ mouseRef }: {
  mouseRef: React.RefObject<{ x: number; y: number }>
}) {
  return (
    <Canvas
      // Always drive the render loop. The previous `frameloop="never"` gate
      // (driven by an IntersectionObserver on the inner, scaled+sticky
      // container) misfired under headless/lazy-mount capture and left the
      // scene frozen — useFrame never ran, so the wordmark/particles never
      // rotated. Keeping it "always" guarantees continuous rotation;
      // VisibilityFrameloop below still releases the GPU when the tab is hidden.
      frameloop="always"
      dpr={[1, IS_MOBILE ? 1 : 1.5]}
      camera={{ position: [0, 0.4, 7], fov: 60 }}
      // EffectComposer owns its own multisampled render target, so the default
      // backbuffer doesn't need antialiasing or a stencil buffer — dropping
      // both cuts memory and fill cost with no visible change.
      gl={{ antialias: false, alpha: true, stencil: false, powerPreference: 'high-performance' }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 2]} intensity={1.4} color={colors.citrine} />
      <directionalLight position={[-4, 2, 1]} intensity={0.9} color={colors.lilac} />

      <HeroText />
      <ParticleSphere />

      <Grid
        position={[0, -2.8, 0]}
        args={[20, 20]}
        cellColor={colors.bgSurface}
        sectionColor={colors.bgMid}
        cellSize={0.6}
        sectionSize={3}
        fadeDistance={20}
        fadeStrength={1.2}
      />

      <CameraRig mouseRef={mouseRef} />
      <VisibilityFrameloop />

      {!IS_MOBILE && (
        <EffectComposer multisampling={4}>
          {/* Lowered threshold/intensity so the wordmark glow stays tight and
              does not bleed upward into the "Sam Poplett" headline band. */}
          <Bloom luminanceThreshold={0.45} intensity={0.35} />
          <DepthOfField focusDistance={0} focalLength={0.02} bokehScale={2} />
        </EffectComposer>
      )}
    </Canvas>
  )
}

export function Hero3DScene() {
  const reduced = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseRef = useRef({ x: 0, y: 0 })

  // Lazy-mount: keep the WebGL context out of the critical path so the
  // readable headline paints first. We mount the Canvas one idle tick after
  // first paint rather than during render.
  const [mounted, setMounted] = useState(false)
  const [lowPower, setLowPower] = useState(false)

  useEffect(() => {
    setLowPower(isLowPowerDevice())

    const w = window as Window & {
      requestIdleCallback?: (cb: () => void) => number
      cancelIdleCallback?: (id: number) => void
    }
    let idleId: number | undefined
    let rafId: number | undefined

    if (typeof w.requestIdleCallback === 'function') {
      idleId = w.requestIdleCallback(() => setMounted(true))
    } else {
      // Two RAFs ≈ after first paint on browsers without rIC (Safari).
      rafId = requestAnimationFrame(() =>
        requestAnimationFrame(() => setMounted(true))
      )
    }

    // Guaranteed fallback: under automation / headless capture rIC can be
    // throttled or never fire, leaving the Canvas stuck on the poster. This
    // timer ensures the live scene always mounts shortly after first paint.
    const timeoutId = window.setTimeout(() => setMounted(true), 600)

    return () => {
      if (idleId !== undefined && typeof w.cancelIdleCallback === 'function') {
        w.cancelIdleCallback(idleId)
      }
      if (rafId !== undefined) cancelAnimationFrame(rafId)
      clearTimeout(timeoutId)
    }
  }, [])

  useEffect(() => {
    if (reduced || lowPower) return
    const onMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [reduced, lowPower])

  const showPoster = reduced || lowPower

  return (
    <div ref={containerRef} className="absolute inset-0">
      {showPoster || !mounted ? (
        <HeroPoster />
      ) : (
        <Scene mouseRef={mouseRef} />
      )}
    </div>
  )
}
