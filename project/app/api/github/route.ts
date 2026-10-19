import { NextResponse } from 'next/server'
import { getGitHubReport, type GitHubReport } from '@/lib/github'

// Revalidate the GitHub report at most once an hour. Combined with the
// per-fetch caching in lib/github.ts, this keeps us comfortably inside the
// unauthenticated rate limit (60 req/hr) even under traffic.
export const revalidate = 3600

export async function GET() {
  let report: GitHubReport
  try {
    report = await getGitHubReport()
  } catch {
    // getGitHubReport is written not to throw, but never let the route 500.
    return NextResponse.json(
      {
        user: '011-sam-110',
        profileUrl: 'https://github.com/011-sam-110',
        publicRepos: 0,
        followers: 0,
        totalStars: 0,
        totalForks: 0,
        recentContributions: 0,
        windowDays: 91,
        languages: [],
        topRepos: [],
        heatmap: [],
        ok: false,
        note: 'GitHub report failed to build.',
      } satisfies GitHubReport,
      {
        status: 200,
        headers: { 'Cache-Control': 's-maxage=300' },
      }
    )
  }

  return NextResponse.json(report, {
    headers: {
      // Edge/CDN hint mirroring the ISR window, with stale-while-revalidate so
      // a refresh never blocks the client on GitHub.
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
