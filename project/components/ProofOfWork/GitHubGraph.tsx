'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { GitHubReport, ContributionDay } from '@/lib/github'

const DAYS_PER_WEEK = 7

// GitHub-style intensity ramp, in the portfolio's cyan accent. Index = level 0–4.
const LEVEL_COLORS = [
  'bg-zinc-900 border-zinc-800',
  'bg-cyan-900/60 border-cyan-800/50',
  'bg-cyan-700/70 border-cyan-600/60',
  'bg-cyan-500/80 border-cyan-400/70',
  'bg-cyan-400 border-cyan-300',
]

interface Tooltip {
  x: number
  y: number
  date: string
  count: number
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Group the flat day list into week columns (oldest first). */
function toWeeks(heatmap: ContributionDay[]): ContributionDay[][] {
  const weeks: ContributionDay[][] = []
  for (let i = 0; i < heatmap.length; i += DAYS_PER_WEEK) {
    weeks.push(heatmap.slice(i, i + DAYS_PER_WEEK))
  }
  return weeks
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

function Skeleton() {
  return (
    <div className="animate-pulse" aria-hidden>
      <div className="mb-4 h-3 w-48 rounded bg-zinc-800" />
      <div className="flex gap-[3px]">
        {Array.from({ length: 13 }).map((_, c) => (
          <div key={c} className="flex flex-col gap-[3px]">
            {Array.from({ length: DAYS_PER_WEEK }).map((__, r) => (
              <div key={r} className="h-[10px] w-[10px] rounded-[2px] bg-zinc-800/70" />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-6 h-3 w-32 rounded bg-zinc-800" />
      <div className="mt-3 h-4 w-full rounded bg-zinc-800/70" />
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="flex flex-col items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 p-5"
    >
      <p className="font-mono text-xs tracking-wider text-amber-400/90">// data unavailable</p>
      <p className="text-sm text-zinc-400">{message}</p>
      <a
        href="https://github.com/011-sam-110"
        target="_blank"
        rel="noreferrer"
        className="font-mono text-xs text-cyan-400 underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
      >
        View activity on GitHub →
      </a>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Language / stars summary (hand-rolled SVG, mobile-readable)
// ---------------------------------------------------------------------------

function LanguageSummary({ report }: { report: GitHubReport }) {
  const { languages, totalStars, totalForks, publicRepos } = report

  return (
    <div className="mt-7 border-t border-zinc-800/80 pt-5">
      <div className="mb-4 flex flex-wrap items-baseline gap-x-5 gap-y-2">
        {[
          { label: 'stars', value: totalStars },
          { label: 'forks', value: totalForks },
          { label: 'public repos', value: publicRepos },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-baseline gap-1.5">
            <span className="font-black tabular-nums text-lg text-zinc-50">
              {value.toLocaleString()}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              {label}
            </span>
          </div>
        ))}
      </div>

      {languages.length > 0 && (
        <>
          {/* Stacked share bar — one SVG, scales to any width */}
          <svg
            viewBox="0 0 100 3"
            preserveAspectRatio="none"
            className="h-2 w-full overflow-hidden rounded-full"
            role="img"
            aria-label="Language breakdown by repository count"
          >
            {(() => {
              let x = 0
              return languages.map(lang => {
                const w = lang.share * 100
                const seg = <rect key={lang.name} x={x} y={0} width={w} height={3} fill={lang.color} />
                x += w
                return seg
              })
            })()}
          </svg>

          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {languages.map(lang => (
              <li key={lang.name} className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: lang.color }}
                  aria-hidden
                />
                <span className="text-xs text-zinc-300">{lang.name}</span>
                <span className="font-mono text-[10px] tabular-nums text-zinc-500">
                  {Math.round(lang.share * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function GitHubGraph() {
  const reduced = useReducedMotion()
  const [report, setReport] = useState<GitHubReport | null>(null)
  const [errored, setErrored] = useState(false)
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)

  useEffect(() => {
    let alive = true
    fetch('/api/github')
      .then(res => {
        if (!res.ok) throw new Error(`status ${res.status}`)
        return res.json() as Promise<GitHubReport>
      })
      .then(data => {
        if (alive) setReport(data)
      })
      .catch(() => {
        if (alive) setErrored(true)
      })
    return () => {
      alive = false
    }
  }, [])

  const weeks = useMemo(() => (report ? toWeeks(report.heatmap) : []), [report])

  if (errored) {
    return <ErrorState message="Couldn't reach the GitHub activity feed right now." />
  }

  if (!report) {
    return <Skeleton />
  }

  if (!report.ok && report.heatmap.length === 0) {
    return (
      <ErrorState
        message={report.note ?? 'No live GitHub data is available at the moment.'}
      />
    )
  }

  const windowLabel =
    report.windowDays >= 60
      ? `last ${Math.round(report.windowDays / 30)} months`
      : `last ${report.windowDays} days`

  return (
    <div className="relative" onMouseLeave={() => setTooltip(null)}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-xs tracking-wider text-zinc-500">
          {report.recentContributions.toLocaleString()} contributions · {windowLabel}
        </p>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-zinc-600">Less</span>
          {LEVEL_COLORS.map((cls, i) => (
            <div key={i} className={`h-3 w-3 rounded-sm border ${cls}`} />
          ))}
          <span className="font-mono text-[10px] text-zinc-600">More</span>
        </div>
      </div>

      {/* Heatmap — week columns, fluid so 13 weeks fit inside 390px */}
      <div id="github-heatmap" className="flex w-full gap-[3px]" role="img" aria-label={`${report.recentContributions} contributions over the ${windowLabel}`}>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-1 flex-col gap-[3px]">
            {week.map(day => (
                <motion.div
                  key={day.date}
                  initial={reduced ? false : { opacity: 0, scale: 0.6 }}
                  whileInView={reduced ? undefined : { opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.15, delay: reduced ? 0 : wi * 0.012 }}
                  className={`aspect-square w-full min-w-[8px] rounded-[2px] border transition-transform hover:scale-125 ${LEVEL_COLORS[day.level]}`}
                  onMouseEnter={e => {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                    setTooltip({
                      x: rect.left + rect.width / 2,
                      y: rect.top,
                      date: formatDate(day.date),
                      count: day.count,
                    })
                  }}
                />
            ))}
          </div>
        ))}
      </div>

      {report.note && (
        <p className="mt-3 font-mono text-[10px] text-zinc-600">{report.note}</p>
      )}

      <LanguageSummary report={report} />

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 font-mono text-xs text-zinc-200 shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y - 8 }}
        >
          <span className="text-cyan-400">{tooltip.count}</span> contribution
          {tooltip.count !== 1 ? 's' : ''} · {tooltip.date}
        </div>
      )}
    </div>
  )
}
