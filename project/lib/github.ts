/**
 * GitHub analytics — shared fetch/normalise helpers and types.
 *
 * Used by both the server route (`app/api/github/route.ts`) and the client
 * graph (`components/ProofOfWork/GitHubGraph.tsx`). Everything here speaks the
 * public GitHub REST API so it works WITHOUT a token (just a lower rate limit);
 * `GITHUB_TOKEN`, when present, raises that limit. No data is fabricated — if a
 * call fails we degrade to an honest empty/error shape rather than inventing it.
 */

export const GITHUB_USER = '011-sam-110'

// One bucket per day; the public events feed covers ~90 days of activity, so a
// quarter is the most we can honestly show. Aligns with the rendered heatmap.
export const HEATMAP_DAYS = 91

export interface LanguageStat {
  name: string
  /** Number of repos whose primary language is this. */
  count: number
  /** Share of the catalogued repos, 0–1. */
  share: number
  /** GitHub's canonical language colour, for the legend swatches. */
  color: string
}

export interface ActiveRepo {
  name: string
  description: string | null
  stars: number
  forks: number
  language: string | null
  url: string
  /** ISO timestamp of the last push. */
  pushedAt: string
}

export interface ContributionDay {
  /** ISO date (YYYY-MM-DD), local to the report. */
  date: string
  count: number
  /** GitHub-style intensity bucket 0–4 for colouring. */
  level: 0 | 1 | 2 | 3 | 4
}

export interface GitHubReport {
  user: string
  profileUrl: string
  /** Public repo count from the profile. */
  publicRepos: number
  followers: number
  totalStars: number
  totalForks: number
  /** Real contributions counted from the public events feed in this window. */
  recentContributions: number
  /** How many days the heatmap/contribution count actually spans. */
  windowDays: number
  languages: LanguageStat[]
  topRepos: ActiveRepo[]
  heatmap: ContributionDay[]
  /** True when live data was fetched; false when serving the empty fallback. */
  ok: boolean
  /** Human-readable note when degraded (rate limited, no network, etc.). */
  note?: string
}

// A small, stable subset of GitHub's linguist colours — enough for the
// languages Sam actually ships in, with a neutral fallback for the rest.
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Rust: '#dea584',
  Go: '#00ADD8',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Ruby: '#701516',
  Solidity: '#AA6746',
  Jupyter: '#DA5B0B',
  'Jupyter Notebook': '#DA5B0B',
  Dockerfile: '#384d54',
  Vue: '#41b883',
  Svelte: '#ff3e00',
}

const FALLBACK_COLOR = '#8b949e'

export function languageColor(name: string | null): string {
  if (!name) return FALLBACK_COLOR
  return LANGUAGE_COLORS[name] ?? FALLBACK_COLOR
}

// ---------------------------------------------------------------------------
// Raw API response shapes (only the fields we consume)
// ---------------------------------------------------------------------------

interface RawUser {
  public_repos: number
  followers: number
  html_url: string
}

interface RawRepo {
  name: string
  description: string | null
  stargazers_count: number
  forks_count: number
  language: string | null
  html_url: string
  pushed_at: string
  fork: boolean
  archived: boolean
}

interface RawEvent {
  type: string
  created_at: string
  payload?: { commits?: unknown[]; size?: number }
}

// ---------------------------------------------------------------------------
// Fetch layer
// ---------------------------------------------------------------------------

const API_ROOT = 'https://api.github.com'

function headers(): HeadersInit {
  const h: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    // GitHub requires a User-Agent; unauthenticated requests are rejected
    // outright without one.
    'User-Agent': 'sam-poplett-portfolio',
  }
  const token = process.env.GITHUB_TOKEN
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

/**
 * Fetch JSON from the GitHub API. Caches at the Next.js fetch layer so the
 * route's `revalidate` governs freshness. Returns `null` on any non-OK
 * response (rate limit, 404, network) so callers can degrade gracefully.
 */
async function ghFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_ROOT}${path}`, {
      headers: headers(),
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Normalise
// ---------------------------------------------------------------------------

function emptyReport(note: string): GitHubReport {
  return {
    user: GITHUB_USER,
    profileUrl: `https://github.com/${GITHUB_USER}`,
    publicRepos: 0,
    followers: 0,
    totalStars: 0,
    totalForks: 0,
    recentContributions: 0,
    windowDays: HEATMAP_DAYS,
    languages: [],
    topRepos: [],
    heatmap: buildHeatmap(new Map()),
    ok: false,
    note,
  }
}

function levelFor(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0
  if (max <= 0) return 1
  const ratio = count / max
  if (ratio > 0.66) return 4
  if (ratio > 0.33) return 3
  if (ratio > 0.12) return 2
  return 1
}

/** Build a contiguous day-by-day heatmap ending today from a date→count map. */
function buildHeatmap(counts: Map<string, number>): ContributionDay[] {
  let max = 0
  counts.forEach(v => {
    if (v > max) max = v
  })
  const days: ContributionDay[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = HEATMAP_DAYS - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const count = counts.get(key) ?? 0
    days.push({ date: key, count, level: levelFor(count, max) })
  }
  return days
}

function buildLanguages(repos: RawRepo[]): LanguageStat[] {
  const tally = new Map<string, number>()
  for (const r of repos) {
    if (!r.language) continue
    tally.set(r.language, (tally.get(r.language) ?? 0) + 1)
  }
  const total = Array.from(tally.values()).reduce((a, b) => a + b, 0)
  if (total === 0) return []

  return Array.from(tally.entries())
    .map(([name, count]) => ({
      name,
      count,
      share: count / total,
      color: languageColor(name),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
}

function buildTopRepos(repos: RawRepo[]): ActiveRepo[] {
  return [...repos]
    .sort((a, b) => {
      // Stars first, then most recently pushed — "most active" with a quality bias.
      if (b.stargazers_count !== a.stargazers_count) {
        return b.stargazers_count - a.stargazers_count
      }
      return new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime()
    })
    .slice(0, 5)
    .map(r => ({
      name: r.name,
      description: r.description,
      stars: r.stargazers_count,
      forks: r.forks_count,
      language: r.language,
      url: r.html_url,
      pushedAt: r.pushed_at,
    }))
}

/** Count real contributions per day from the public events feed. */
function buildContributionCounts(events: RawEvent[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const e of events) {
    const day = e.created_at.slice(0, 10)
    // Weight push events by number of commits; everything else counts as one
    // contribution (issues, PRs, reviews, etc.).
    const commitCount =
      e.type === 'PushEvent'
        ? e.payload?.size ?? e.payload?.commits?.length ?? 1
        : 1
    counts.set(day, (counts.get(day) ?? 0) + commitCount)
  }
  return counts
}

/**
 * Fetch and normalise the full report for {@link GITHUB_USER}. Never throws —
 * returns an `ok: false` report with a note when the API is unavailable.
 */
export async function getGitHubReport(): Promise<GitHubReport> {
  const [user, repos, events] = await Promise.all([
    ghFetch<RawUser>(`/users/${GITHUB_USER}`),
    // 100 most-recently-pushed repos is plenty for one developer and one page.
    ghFetch<RawRepo[]>(`/users/${GITHUB_USER}/repos?per_page=100&sort=pushed&type=owner`),
    ghFetch<RawEvent[]>(`/users/${GITHUB_USER}/events/public?per_page=100`),
  ])

  if (!user && !repos) {
    return emptyReport('GitHub API unavailable — showing no live data.')
  }

  // Exclude forks and archived repos so stars/languages reflect Sam's own work.
  const ownRepos = (repos ?? []).filter(r => !r.fork && !r.archived)

  const totalStars = ownRepos.reduce((acc, r) => acc + r.stargazers_count, 0)
  const totalForks = ownRepos.reduce((acc, r) => acc + r.forks_count, 0)

  const counts = buildContributionCounts(events ?? [])
  const heatmap = buildHeatmap(counts)
  const recentContributions = heatmap.reduce((acc, d) => acc + d.count, 0)

  return {
    user: GITHUB_USER,
    profileUrl: user?.html_url ?? `https://github.com/${GITHUB_USER}`,
    publicRepos: user?.public_repos ?? ownRepos.length,
    followers: user?.followers ?? 0,
    totalStars,
    totalForks,
    recentContributions,
    windowDays: HEATMAP_DAYS,
    languages: buildLanguages(ownRepos),
    topRepos: buildTopRepos(ownRepos),
    heatmap,
    ok: true,
    note: events ? undefined : 'Activity feed unavailable — heatmap may be sparse.',
  }
}
