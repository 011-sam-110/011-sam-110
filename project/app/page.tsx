'use client'

import { useState } from 'react'
import { SmoothScroll } from '@/components/SmoothScroll'
import { Cursor } from '@/components/Cursor'
import { Navigation } from '@/components/Navigation'
import { Hero } from '@/components/Hero/index'
import { AboutSection } from '@/components/AboutSection'
import { Projects } from '@/components/Projects/index'
import { SkillsSection } from '@/components/SkillsSection'
import { TechStack } from '@/components/TechStack/index'
import { ProofOfWork } from '@/components/ProofOfWork/index'
import { LearningLab } from '@/components/LearningLab/index'
import { ContactSection } from '@/components/ContactSection'

export default function Home() {
  const [hoveredTech, setHoveredTech]   = useState<string | null>(null)
  const [openProject, setOpenProject]   = useState<string | null>(null)

  return (
    <SmoothScroll>
      <Cursor />
      <Navigation />
      <main style={{ background: 'var(--bg-deep)' }}>
        <Hero />
        <AboutSection />
        <Projects
          hoveredTech={hoveredTech}
          openProject={openProject}
          setOpenProject={setOpenProject}
        />
        <SkillsSection />
        <TechStack hoveredTech={hoveredTech} setHoveredTech={setHoveredTech} />
        <ProofOfWork />
        <LearningLab />
        <ContactSection />
      </main>
    </SmoothScroll>
  )
}
