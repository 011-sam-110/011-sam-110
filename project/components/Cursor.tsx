'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const SLOW_SPRING = { stiffness: 120, damping: 28, mass: 0.8 }

export function Cursor() {
  const reduced = useReducedMotion()
  const [visible, setVisible] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [clicking, setClicking] = useState(false)

  // Inner dot — exact position
  const dotX = useMotionValue(-100)
  const dotY = useMotionValue(-100)

  // Outer ring — spring lag
  const ringRawX = useMotionValue(-100)
  const ringRawY = useMotionValue(-100)
  const ringX = useSpring(ringRawX, SLOW_SPRING)
  const ringY = useSpring(ringRawY, SLOW_SPRING)

  // Magnetic target
  const magnetTarget = useRef<{ x: number; y: number } | null>(null)
  const frameRef = useRef<number>(0)
  const mousePos = useRef({ x: -100, y: -100 })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Touch / keyboard / reduced-motion: do nothing. No listeners, no raf loop,
    // no MutationObserver — the native cursor is never touched.
    if (reduced) return

    const onMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY }
      setVisible(true)
    }
    const onLeave = () => setVisible(false)
    const onDown = () => setClicking(true)
    const onUp = () => setClicking(false)

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('mouseup', onUp)

    // Magnetic hover detection
    const handleEnter = (e: Event) => {
      const el = e.currentTarget as HTMLElement
      const rect = el.getBoundingClientRect()
      magnetTarget.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      }
      setHovering(true)
    }
    const handleLeave = () => {
      magnetTarget.current = null
      setHovering(false)
    }

    // Raf loop for smooth position updates
    const loop = () => {
      const { x, y } = mousePos.current
      dotX.set(x)
      dotY.set(y)

      if (magnetTarget.current && hovering) {
        // Lerp ring toward magnetic center
        const mx = magnetTarget.current.x
        const my = magnetTarget.current.y
        const lx = ringRawX.get() + (mx - ringRawX.get()) * 0.2
        const ly = ringRawY.get() + (my - ringRawY.get()) * 0.2
        ringRawX.set(lx)
        ringRawY.set(ly)
      } else {
        ringRawX.set(x)
        ringRawY.set(y)
      }

      frameRef.current = requestAnimationFrame(loop)
    }
    frameRef.current = requestAnimationFrame(loop)

    // Attach to interactive elements
    const attach = () => {
      document.querySelectorAll('a, button, [data-magnetic]').forEach(el => {
        el.addEventListener('mouseenter', handleEnter)
        el.addEventListener('mouseleave', handleLeave)
      })
    }
    attach()
    const observer = new MutationObserver(attach)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('mouseup', onUp)
      cancelAnimationFrame(frameRef.current)
      observer.disconnect()
    }
  }, [hovering, reduced])

  // Render nothing when motion is reduced or on touch devices, so the native
  // cursor is preserved and no custom cursor elements mount.
  if (reduced) return null

  return (
    <>
      {/* Outer ring */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full border border-cyan-400"
        style={{ x: ringX, y: ringY, translateX: '-50%', translateY: '-50%' }}
        animate={{
          width: hovering ? 52 : 28,
          height: hovering ? 52 : 28,
          opacity: visible ? 1 : 0,
          borderColor: hovering ? 'rgba(6,182,212,1)' : 'rgba(6,182,212,0.5)',
          scale: clicking ? 0.8 : 1,
          boxShadow: hovering ? '0 0 16px rgba(6,182,212,0.5)' : '0 0 0px transparent',
        }}
        transition={{ duration: 0.15 }}
      />

      {/* Inner dot */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full bg-cyan-400"
        style={{ x: dotX, y: dotY, translateX: '-50%', translateY: '-50%' }}
        animate={{
          width: hovering ? 5 : 4,
          height: hovering ? 5 : 4,
          opacity: visible ? 1 : 0,
          scale: clicking ? 0.5 : 1,
        }}
        transition={{ duration: 0.08 }}
      />
    </>
  )
}
