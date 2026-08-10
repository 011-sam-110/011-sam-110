import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCaseStudy, getCaseStudyIds } from '@/lib/caseStudies'
import { CaseStudyView } from '@/components/CaseStudy/CaseStudyView'

interface PageProps {
  params: { id: string }
}

// Statically generate one route per project that has a case study, so every
// /work/[id] page is prerendered at build time.
export function generateStaticParams(): { id: string }[] {
  return getCaseStudyIds().map(id => ({ id }))
}

// Per-route metadata + Open Graph, always leading with Sam Poplett's name so
// shared links read as "Sam Poplett — <project>".
export function generateMetadata({ params }: PageProps): Metadata {
  const study = getCaseStudy(params.id)
  if (!study) {
    return { title: 'Sam Poplett — Case study not found' }
  }

  const { project } = study
  const title = `Sam Poplett — ${project.title}`
  const description = study.problem

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `/work/${project.id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default function WorkCaseStudyPage({ params }: PageProps) {
  const study = getCaseStudy(params.id)
  if (!study) notFound()

  return <CaseStudyView study={study} />
}
