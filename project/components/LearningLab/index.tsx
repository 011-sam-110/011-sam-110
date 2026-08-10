'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { blogPosts } from '@/lib/data'

const SPRING = { type: 'spring' as const, stiffness: 400, damping: 40 }

function TypewriterTitle({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState('')
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const started = useRef(false)

  useEffect(() => {
    if (!inView || started.current) return
    started.current = true

    let i = 0
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        i++
        setDisplayed(text.slice(0, i))
        if (i >= text.length) clearInterval(interval)
      }, 32)
      return () => clearInterval(interval)
    }, delay)

    return () => clearTimeout(timer)
  }, [inView, text, delay])

  return (
    <span ref={ref} className="typewriter-cursor">
      {displayed || <span className="opacity-0">{text[0]}</span>}
    </span>
  )
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}
const item = {
  hidden: { y: 24, opacity: 0 },
  show: { y: 0, opacity: 1, transition: SPRING },
}

export function LearningLab() {
  const sectionRef  = useRef<HTMLElement>(null)
  const headerRef   = useRef<HTMLDivElement>(null)
  const postsRef    = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const section = sectionRef.current
    const header  = headerRef.current
    const posts   = postsRef.current
    if (!section || !header || !posts) return

    const triggers: ScrollTrigger[] = []

    // Header: scrubbed reveal
    const st0 = gsap.fromTo(
      header,
      { y: 50, opacity: 0 },
      {
        y: 0, opacity: 1, ease: 'none',
        scrollTrigger: {
          trigger: header,
          start: 'top 88%',
          end: 'top 38%',
          scrub: 1.5,
        },
      }
    ).scrollTrigger

    // Posts container: drifts up slower than the header — creates depth
    const st1 = gsap.to(posts, {
      y: -30,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 3,
      },
    }).scrollTrigger

    if (st0) triggers.push(st0)
    if (st1) triggers.push(st1)
    return () => triggers.forEach(st => st.kill())
  }, [])

  return (
    <section id="lab" ref={sectionRef} className="py-32 px-8 max-w-6xl mx-auto border-t" style={{ borderColor: 'rgba(196,174,244,0.1)' }}>
      {/* Header — GSAP scrub reveal */}
      <div ref={headerRef} className="mb-16">
        <p className="section-label mb-3">// Learning Lab</p>
        <h2 className="text-5xl font-black leading-none" style={{ color: 'var(--text-primary)' }}>
          Technical <span style={{ color: 'var(--accent-lilac)' }}>Writing.</span>
        </h2>
        <p className="text-sm font-mono mt-4" style={{ color: 'var(--text-muted)' }}>
          Deep dives on the problems I&apos;ve actually solved.
        </p>
      </div>

      {/* Blog posts — GSAP depth drift wraps the Framer Motion stagger */}
      <div ref={postsRef}>
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-40px' }}
        className="space-y-4"
      >
        {blogPosts.map((post, i) => (
          <motion.article
            key={post.id}
            variants={item}
            className="group border border-zinc-800 hover:border-zinc-600 rounded-xl p-6 bg-zinc-950/50 hover:bg-zinc-950 transition-all duration-200 cursor-pointer"
            whileHover={{ x: 4 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {/* Meta */}
                <div className="flex items-center gap-4 mb-3 font-mono text-[11px] text-zinc-600">
                  <span>{new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span>·</span>
                  <span>{post.readTime} read</span>
                </div>

                {/* Title with typewriter */}
                <h3 className="text-lg font-bold text-zinc-50 mb-2 group-hover:text-white transition-colors">
                  <TypewriterTitle text={post.title} delay={i * 200} />
                </h3>

                {/* Excerpt */}
                <p className="text-zinc-400 text-sm leading-relaxed mb-4">{post.excerpt}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {post.tags.map(tag => (
                    <span
                      key={tag}
                      className="font-mono text-[10px] tracking-wider text-zinc-500 border border-zinc-800 rounded px-2 py-0.5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <div className="text-zinc-700 group-hover:text-cyan-400 transition-colors text-xl font-mono shrink-0 mt-1">
                →
              </div>
            </div>
          </motion.article>
        ))}
      </motion.div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4, ...SPRING }}
        className="mt-12 text-center"
      >
        <p className="font-mono text-xs text-zinc-600 mb-4 tracking-widest uppercase">
          More writing coming as I build
        </p>
        <a
          href="https://github.com/011-sam-110"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 border border-zinc-800 hover:border-cyan-500/50 rounded-lg px-6 py-3 font-mono text-sm text-zinc-400 hover:text-cyan-400 transition-all duration-200"
        >
          Follow on GitHub
          <span>↗</span>
        </a>
      </motion.div>
    </section>
  )
}
